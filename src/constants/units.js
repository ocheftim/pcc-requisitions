export const UNIT_CATEGORIES = {
  weight: { label: 'Weight', units: ['lb', 'oz', 'g', 'kg'], baseUnit: 'oz', conversions: { lb: 16, oz: 1, g: 0.035274, kg: 35.274 } },
  volume: { label: 'Volume', units: ['gal', 'qt', 'pt', 'cup', 'fl oz', 'tbsp', 'tsp', 'ml', 'L'], baseUnit: 'fl oz', conversions: { gal: 128, qt: 32, pt: 16, cup: 8, 'fl oz': 1, tbsp: 0.5, tsp: 0.167, ml: 0.034, L: 33.814 } },
  count: { label: 'Count', units: ['ea', 'doz', 'case', 'pack', 'bag', 'can', 'jar', 'bottle', 'box', 'tub', 'set', 'roll', 'slice'], baseUnit: 'ea', conversions: { ea: 1, doz: 12 } },
  produce: { label: 'Produce', units: ['bu', 'bunch', 'head', 'stalk', 'sprig', 'clove'], baseUnit: 'ea', conversions: { bu: 1, bunch: 1, head: 1, stalk: 1, sprig: 1, clove: 1 } }
};
export const ALL_UNITS = Object.values(UNIT_CATEGORIES).flatMap(cat => cat.units);
export const getUnitCategory = (unit) => { for (const [k, c] of Object.entries(UNIT_CATEGORIES)) { if (c.units.includes(unit)) return k; } return 'count'; };
export const unitsCompatible = (u1, u2) => getUnitCategory(u1) === getUnitCategory(u2);
export const convertUnits = (val, from, to) => { const c1 = getUnitCategory(from), c2 = getUnitCategory(to); if (c1 !== c2) return val; const cat = UNIT_CATEGORIES[c1]; return (val * (cat.conversions[from] || 1)) / (cat.conversions[to] || 1); };
export const normalizeUnit = (u) => { if (!u) return 'ea'; const m = { pound: 'lb', pounds: 'lb', lbs: 'lb', ounce: 'oz', ounces: 'oz', each: 'ea', dozen: 'doz', gallon: 'gal', quart: 'qt', pint: 'pt', tablespoon: 'tbsp', teaspoon: 'tsp', bunch: 'bu' }; return m[u.toLowerCase().trim()] || u.toLowerCase().trim(); };
