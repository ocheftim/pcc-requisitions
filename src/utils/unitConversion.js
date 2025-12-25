// Unit conversion utilities for requisition system

// Define unit groups and conversion factors (to base unit)
export const unitGroups = {
  weight: {
    base: 'oz',
    units: {
      'lb': 16,      // 1 lb = 16 oz
      'oz': 1,
      'g': 0.035274, // 1 g = 0.035274 oz
      'kg': 35.274   // 1 kg = 35.274 oz
    }
  },
  volume: {
    base: 'fl oz',
    units: {
      'gal': 128,    // 1 gal = 128 fl oz
      'qt': 32,      // 1 qt = 32 fl oz
      'pt': 16,      // 1 pt = 16 fl oz
      'cup': 8,      // 1 cup = 8 fl oz
      'fl oz': 1,
      'tbsp': 0.5,   // 1 tbsp = 0.5 fl oz
      'tsp': 0.1667  // 1 tsp = ~0.17 fl oz
    }
  },
  volumeMetric: {
    base: 'mL',
    units: {
      'L': 1000,
      'mL': 1
    }
  },
  count: {
    base: 'ea',
    units: {
      'doz': 12,
      'ea': 1,
      'each': 1,
      'sheet': 1,
      'bunch': 1
    }
  }
};

// Find which group a unit belongs to
export function getUnitGroup(unit) {
  const normalizedUnit = unit?.toLowerCase().trim();
  for (const [groupName, group] of Object.entries(unitGroups)) {
    if (group.units[normalizedUnit] !== undefined) {
      return groupName;
    }
  }
  return null;
}

// Get compatible units for a given unit
export function getCompatibleUnits(unit) {
  const group = getUnitGroup(unit);
  if (!group) return [unit]; // Return original if no group found
  return Object.keys(unitGroups[group].units);
}

// Convert quantity from one unit to another
export function convertQuantity(quantity, fromUnit, toUnit) {
  if (fromUnit === toUnit) return quantity;
  
  const fromGroup = getUnitGroup(fromUnit);
  const toGroup = getUnitGroup(toUnit);
  
  // Can only convert within same group
  if (!fromGroup || !toGroup || fromGroup !== toGroup) {
    console.warn(`Cannot convert between ${fromUnit} and ${toUnit}`);
    return quantity;
  }
  
  const group = unitGroups[fromGroup];
  const fromFactor = group.units[fromUnit.toLowerCase()];
  const toFactor = group.units[toUnit.toLowerCase()];
  
  // Convert to base unit, then to target unit
  return (quantity * fromFactor) / toFactor;
}

// Convert unit cost from base unit to selected unit
export function convertUnitCost(baseCost, baseUnit, selectedUnit) {
  if (baseUnit === selectedUnit) return baseCost;
  
  const baseGroup = getUnitGroup(baseUnit);
  const selectedGroup = getUnitGroup(selectedUnit);
  
  if (!baseGroup || !selectedGroup || baseGroup !== selectedGroup) {
    return baseCost; // Can't convert, return original
  }
  
  const group = unitGroups[baseGroup];
  const baseFactor = group.units[baseUnit.toLowerCase()];
  const selectedFactor = group.units[selectedUnit.toLowerCase()];
  
  // Cost per base * (base factor / selected factor)
  // E.g., $1/lb to $/oz: $1 * (16/1) = $0.0625/oz... wait that's wrong
  // Actually: $1/lb means cost for 16 oz is $1, so cost per oz = $1/16 = $0.0625
  // So: baseCost / baseFactor * selectedFactor
  // $1/lb = $1 / 16 oz * 1 = $0.0625/oz ✓
  
  return (baseCost / baseFactor) * selectedFactor;
}

// Get display label for unit dropdown
export function getUnitLabel(unit) {
  const labels = {
    'lb': 'Pounds (lb)',
    'oz': 'Ounces (oz)',
    'g': 'Grams (g)',
    'kg': 'Kilograms (kg)',
    'gal': 'Gallons (gal)',
    'qt': 'Quarts (qt)',
    'pt': 'Pints (pt)',
    'cup': 'Cups',
    'fl oz': 'Fluid Oz (fl oz)',
    'tbsp': 'Tablespoons (tbsp)',
    'tsp': 'Teaspoons (tsp)',
    'L': 'Liters (L)',
    'mL': 'Milliliters (mL)',
    'doz': 'Dozen (doz)',
    'ea': 'Each (ea)',
    'each': 'Each',
    'sheet': 'Sheets',
    'bunch': 'Bunches'
  };
  return labels[unit] || unit;
}

// Get short label for compact display
export function getUnitShort(unit) {
  return unit;
}

// Common unit options by category
export function getRecommendedUnits(baseUnit, category) {
  const group = getUnitGroup(baseUnit);
  
  if (group === 'weight') {
    return ['lb', 'oz', 'g', 'kg'];
  }
  if (group === 'volume') {
    return ['gal', 'qt', 'pt', 'cup', 'fl oz', 'tbsp', 'tsp'];
  }
  if (group === 'volumeMetric') {
    return ['L', 'mL'];
  }
  if (group === 'count') {
    return ['ea', 'doz'];
  }
  
  return [baseUnit];
}
