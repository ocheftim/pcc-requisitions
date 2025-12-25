import re
import json
import os

os.chdir('/Users/chef/Downloads/requisition-module/src/data/ingredients')

def parse_js_array(content):
    """Extract array of objects from JS file"""
    # Find array content between [ and ]
    match = re.search(r'export\s+(?:const|let)\s+\w+\s*=\s*\[(.*?)\];', content, re.DOTALL)
    if not match:
        return []
    
    array_content = match.group(1)
    items = []
    
    # Find each object { ... }
    obj_pattern = re.compile(r'\{([^{}]+)\}', re.DOTALL)
    for obj_match in obj_pattern.finditer(array_content):
        obj_str = obj_match.group(1)
        item = {}
        
        # Parse key: value pairs
        for pair in re.finditer(r"(\w+)\s*:\s*(?:'([^']*)'|\"([^\"]*)\"|(\d+\.?\d*)|(\[[^\]]*\]))", obj_str):
            key = pair.group(1)
            value = pair.group(2) or pair.group(3) or pair.group(4) or pair.group(5)
            if pair.group(4):  # number
                value = float(value) if '.' in value else int(value)
            elif pair.group(5):  # array
                value = [s.strip().strip("'\"") for s in value.strip('[]').split(',') if s.strip()]
            item[key] = value
        
        if item.get('id') and item.get('name'):
            items.append(item)
    
    return items

# Parse all files
all_ingredients = []

with open('syscoOrderGuide.js', 'r') as f:
    content = f.read()
    sysco = parse_js_array(content)
    print(f"syscoOrderGuide: {len(sysco)} items")
    all_ingredients.extend(sysco)

with open('ingredientsList.js', 'r') as f:
    content = f.read()
    # Parse each array
    for name in ['bakingIngredientsList', 'savoryIngredientsList', 'additionalIngredients']:
        match = re.search(rf'export\s+const\s+{name}\s*=\s*\[(.*?)\];', content, re.DOTALL)
        if match:
            items = []
            for obj_match in re.finditer(r'\{([^{}]+)\}', match.group(1)):
                obj_str = obj_match.group(1)
                item = {}
                for pair in re.finditer(r"(\w+)\s*:\s*(?:'([^']*)'|\"([^\"]*)\"|(\d+\.?\d*)|(\[[^\]]*\]))", obj_str):
                    key = pair.group(1)
                    value = pair.group(2) or pair.group(3) or pair.group(4) or pair.group(5)
                    if pair.group(4):
                        value = float(value) if '.' in value else int(value)
                    elif pair.group(5):
                        value = [s.strip().strip("'\"") for s in value.strip('[]').split(',') if s.strip()]
                    item[key] = value
                if item.get('id') and item.get('name'):
                    items.append(item)
            print(f"{name}: {len(items)} items")
            all_ingredients.extend(items)

with open('shamrockIngredients.js', 'r') as f:
    content = f.read()
    shamrock = parse_js_array(content)
    print(f"shamrockIngredients: {len(shamrock)} items")
    all_ingredients.extend(shamrock)

print(f"\nTotal before dedup: {len(all_ingredients)}")

# Deduplicate by syscoCode or name
seen = {}
deduped = []
for ing in all_ingredients:
    key = ing.get('syscoCode') or ing['name'].lower()
    if key not in seen:
        seen[key] = True
        deduped.append(ing)

print(f"After dedup: {len(deduped)}")
print(f"Removed: {len(all_ingredients) - len(deduped)} duplicates")

# Normalize categories
category_map = {
    'Dairy': 'Dairy & Eggs',
    'Baking': 'Baking & Pastry',
    'Bakery': 'Bakery & Bread',
}

subcategory_map = {
    'Breads': 'Bread',
    'Breakfast Breads': 'Bread',
}

# Generate SQL
def escape(s):
    if s is None:
        return ''
    return str(s).replace("'", "''")

values = []
for ing in deduped:
    cat = category_map.get(ing.get('category'), ing.get('category', 'Other'))
    subcat = subcategory_map.get(ing.get('subcategory'), ing.get('subcategory', 'Other'))
    vendor = ing.get('vendor', 'Sysco')
    vendor_code = ing.get('syscoCode', ing.get('vendorCode', ''))
    pack_size = ing.get('syscoPackSize', ing.get('packSize', ''))
    case_price = ing.get('syscoPrice', ing.get('casePrice', 0))
    brand = ing.get('brand', '')
    programs = ing.get('programs', ['Baking & Pastry Arts', 'Culinary Arts', 'Foodservice'])
    storage = ing.get('storage', '')
    
    prog_str = "ARRAY['" + "','".join(programs) + "']" if programs else "ARRAY['Baking & Pastry Arts','Culinary Arts','Foodservice']"
    
    val = f"('{escape(ing['id'])}', '{escape(ing['name'])}', '{escape(cat)}', '{escape(subcat)}', '{escape(ing.get('unit', 'ea'))}', '{escape(vendor)}', '{escape(vendor_code)}', '{escape(pack_size)}', {case_price}, '{escape(brand)}', {prog_str}, '{escape(storage)}', true, false)"
    values.append(val)

sql = 'INSERT INTO ingredients (id, name, category, subcategory, unit, vendor, vendor_code, pack_size, case_price, brand, programs, storage, is_active, hidden_from_instructor) VALUES\n'
sql += ',\n'.join(values) + ';'

with open('/Users/chef/Downloads/requisition-module/ingredients-export.sql', 'w') as f:
    f.write(sql)

print(f"\nSQL written to ingredients-export.sql")
