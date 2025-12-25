// Shamrock Foods Vendor Product Mapping
// Maps internal ingredient codes to Shamrock products with pricing

export const shamrockMapping = {
  'FLR-001': {
    shamrockItemCode: '10001',
    shamrockDescription: 'Flour, All-Purpose, 50lb bag',
    category: 'BAKING',
    unitPrice: 28.50,
    unit: 'bag',
    packSize: '50lb',
    conversionFactor: 10, // 1 bag = 10 cups (approximate)
  },
  'BAK-001': {
    shamrockItemCode: '10002',
    shamrockDescription: 'Baking Powder, 5lb',
    category: 'BAKING',
    unitPrice: 12.75,
    unit: 'lb',
    packSize: '5lb',
    conversionFactor: 48, // 1 lb = 48 tbsp
  },
  'BAK-002': {
    shamrockItemCode: '10003',
    shamrockDescription: 'Baking Soda, 5lb',
    category: 'BAKING',
    unitPrice: 8.50,
    unit: 'lb',
    packSize: '5lb',
    conversionFactor: 96, // 1 lb = 96 tsp
  },
  'SLT-001': {
    shamrockItemCode: '10004',
    shamrockDescription: 'Salt, Kosher, 3lb box',
    category: 'BAKING',
    unitPrice: 4.25,
    unit: 'lb',
    packSize: '3lb',
    conversionFactor: 96, // 1 lb = 96 tsp
  },
  'SUG-001': {
    shamrockItemCode: '10005',
    shamrockDescription: 'Sugar, Granulated, 50lb',
    category: 'BAKING',
    unitPrice: 35.00,
    unit: 'lb',
    packSize: '50lb',
    conversionFactor: 2, // 1 lb = 2 cups
  },
  'DAI-001': {
    shamrockItemCode: '20001',
    shamrockDescription: 'Butter, Unsalted, 1lb',
    category: 'DAIRY & EGGS',
    unitPrice: 4.50,
    unit: 'lb',
    packSize: '1lb',
    conversionFactor: 2, // 1 lb = 2 cups
  },
  'DAI-002': {
    shamrockItemCode: '20002',
    shamrockDescription: 'Eggs, Large, dozen',
    category: 'DAIRY & EGGS',
    unitPrice: 4.25,
    unit: 'dozen',
    packSize: 'dozen',
    conversionFactor: 1,
  },
  'DAI-003': {
    shamrockItemCode: '20003',
    shamrockDescription: 'Heavy Cream, quart',
    category: 'DAIRY & EGGS',
    unitPrice: 5.75,
    unit: 'quart',
    packSize: 'quart',
    conversionFactor: 4, // 1 qt = 4 cups
  },
  'DAI-004': {
    shamrockItemCode: '20004',
    shamrockDescription: 'Milk, Whole, gallon',
    category: 'DAIRY & EGGS',
    unitPrice: 4.50,
    unit: 'gallon',
    packSize: 'gallon',
    conversionFactor: 16, // 1 gal = 16 cups
  },
  'DAI-005': {
    shamrockItemCode: '20005',
    shamrockDescription: 'Buttermilk, quart',
    category: 'DAIRY & EGGS',
    unitPrice: 3.25,
    unit: 'quart',
    packSize: 'quart',
    conversionFactor: 4, // 1 qt = 4 cups
  },
  'DAI-006': {
    shamrockItemCode: '20006',
    shamrockDescription: 'Cheddar Cheese, Shredded, 5lb',
    category: 'DAIRY & EGGS',
    unitPrice: 18.50,
    unit: 'lb',
    packSize: '5lb',
    conversionFactor: 4, // 1 lb = 4 cups shredded
  },
  'FRT-001': {
    shamrockItemCode: '30001',
    shamrockDescription: 'Raisins, 2lb box',
    category: 'PRODUCE',
    unitPrice: 8.75,
    unit: 'lb',
    packSize: '2lb',
    conversionFactor: 3, // 1 lb = 3 cups
  },
  'FRT-002': {
    shamrockItemCode: '30002',
    shamrockDescription: 'Blueberries, Fresh, pint',
    category: 'PRODUCE',
    unitPrice: 5.25,
    unit: 'pint',
    packSize: 'pint',
    conversionFactor: 2, // 1 pint = 2 cups
  },
};

// Helper function to get Shamrock product by code
export function getShamrockProduct(shamrockCode) {
  return shamrockMapping[shamrockCode] || null;
}

// Helper function to calculate quantity in vendor units
export function convertToVendorUnits(quantity, unit, shamrockProduct) {
  // This is a simplified conversion - in production would need comprehensive unit conversion
  const vendorQuantity = quantity / shamrockProduct.conversionFactor;
  return Math.ceil(vendorQuantity * 100) / 100; // Round up to 2 decimals
}
