const fs = require('fs');

// Import all ingredient sources
const { bakingIngredientsList, savoryIngredientsList, shamrockIngredientsList, additionalIngredients } = require('./src/data/ingredients/ingredientsList.js');
const { syscoOrderGuide } = require('./src/data/ingredients/syscoOrderGuide.js');

// Combine all sources - syscoOrderGuide takes priority (most current pricing)
const allIngredients = [
  ...syscoOrderGuide,
  ...bakingIngredientsList,
  ...savoryIngredientsList,
  ...shamrockIngredientsList,
  ...additionalIngredients
];

// Deduplicate by syscoCode first, then by name
const seen = new Map();
const deduped = [];

for (const ing of allIngredients) {
  const key = ing.syscoCode || ing.name.toLowerCase();
  if (!seen.has(key)) {
    seen.set(key, true);
    deduped.push(ing);
  }
}

// Normalize categories
const categoryMap = {
  'Dairy': 'Dairy & Eggs',
  'Baking': 'Baking & Pastry',
  'Bakery': 'Bakery & Bread',
  'Breads': 'Bread'
};

// Generate SQL
let sql = 'INSERT INTO ingredients (id, name, category, subcategory, unit, vendor, vendor_code, pack_size, case_price, brand, programs, storage, is_active, hidden_from_instructor) VALUES\n';

const values = deduped.map(ing => {
  const category = categoryMap[ing.category] || ing.category;
  const subcategory = categoryMap[ing.subcategory] || ing.subcategory || 'Other';
  const vendor = ing.vendor || 'Sysco';
  const vendorCode = ing.syscoCode || ing.vendorCode || '';
  const packSize = ing.syscoPackSize || ing.packSize || '';
  const casePrice = ing.syscoPrice || ing.casePrice || 0;
  const brand = ing.brand || '';
  const programs = ing.programs || ['Baking & Pastry Arts', 'Culinary Arts', 'Foodservice'];
  const storage = ing.storage || '';
  
  const escape = (str) => str ? str.replace(/'/g, "''") : '';
  
  return `('${escape(ing.id)}', '${escape(ing.name)}', '${escape(category)}', '${escape(subcategory)}', '${escape(ing.unit || 'ea')}', '${escape(vendor)}', '${escape(vendorCode)}', '${escape(packSize)}', ${casePrice}, '${escape(brand)}', ARRAY['${programs.join("','")}'], '${escape(storage)}', true, false)`;
});

sql += values.join(',\n') + ';';

fs.writeFileSync('ingredients-export.sql', sql);
console.log(`Exported ${deduped.length} deduplicated ingredients to ingredients-export.sql`);
console.log(`Original count: ${allIngredients.length}`);
console.log(`Removed ${allIngredients.length - deduped.length} duplicates`);
