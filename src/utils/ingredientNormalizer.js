const MAPPINGS = {
  'basil': 'Basil, Fresh', 'fresh basil': 'Basil, Fresh',
  'parsley': 'Parsley, Fresh', 'fresh parsley': 'Parsley, Fresh',
  'thyme': 'Thyme, Fresh', 'fresh thyme': 'Thyme, Fresh',
  'chives': 'Chives, Fresh', 'fresh chives': 'Chives, Fresh',
  'cilantro': 'Cilantro, Fresh', 'fresh cilantro': 'Cilantro, Fresh',
  'sage': 'Sage, Fresh', 'fresh sage': 'Sage, Fresh',
  'sugar': 'Sugar, Granulated', 'white sugar': 'Sugar, Granulated', 'granulated sugar': 'Sugar, Granulated',
  'brown sugar': 'Sugar, Light Brown', 'powdered sugar': 'Sugar, Powdered',
  'flour': 'All-Purpose Flour', 'ap flour': 'All-Purpose Flour',
  'butter': 'Butter, Unsalted', 'unsalted butter': 'Butter, Unsalted',
  'eggs': 'Eggs, Large', 'egg': 'Eggs, Large',
  'cream': 'Cream, Heavy Whipping', 'heavy cream': 'Cream, Heavy Whipping',
  'onion': 'Onion, Yellow', 'yellow onion': 'Onion, Yellow',
  'potato': 'Potato, Russet', 'garlic': 'Garlic, Fresh',
  'salt': 'Kosher Salt', 'pepper': 'Black Pepper, Ground',
  'olive oil': 'Olive Oil', 'yeast': 'Yeast, Active Dry'
};
export const normalizeIngredientName = (name) => { if (!name) return ''; return MAPPINGS[name.toLowerCase().trim()] || name.trim(); };
export const findPotentialDuplicates = (name, existing) => {
  const n = normalizeIngredientName(name).toLowerCase();
  return existing.filter(i => { const e = normalizeIngredientName(i.name).toLowerCase(); return n === e || n.includes(e) || e.includes(n); });
};
export const suggestCanonicalName = (name) => { const normalized = normalizeIngredientName(name); return { original: name, suggested: normalized, hasMapping: normalized !== name.trim() }; };
