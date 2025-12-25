// Real Vendor Pricing Data for Pima Community College
// Updated: November 16, 2025
// Stores CASE prices (how you order) + calculates unit prices (for comparison)

export const ingredientDatabase = [
  // DAIRY PRODUCTS
  {
    id: 'dairy-001',
    pccStockNumber: 'PCC-D-001',
    category: 'Dairy',
    productName: 'Butter Unsalted AA',
    vendors: {
      sysco: { 
        code: '5093382', 
        casePrice: 87.48,
        packSize: '36/1 LB',
        packQty: 36,
        packWeight: 1,
        unitPrice: 2.43,
        brand: 'WHLFIMP', 
        available: true 
      },
      shamrock: { 
        code: '1930551', 
        casePrice: 73.20,
        packSize: '30/1 LB',
        packQty: 30,
        packWeight: 1,
        unitPrice: 2.44,
        brand: 'SHAMF', 
        available: true 
      },
      peddlers: { 
        code: 'D432700', 
        casePrice: 81.90,
        packSize: '30/1 LB',
        packQty: 30,
        packWeight: 1,
        unitPrice: 2.73,
        brand: 'BULK', 
        available: true 
      }
    }
  },
  {
    id: 'grain-001',
    pccStockNumber: 'PCC-G-001',
    category: 'Grains',
    productName: 'Flour All Purpose',
    vendors: {
      sysco: { 
        code: '4012674', 
        casePrice: 21.50,
        packSize: '1/50 LB',
        packQty: 1,
        packWeight: 50,
        unitPrice: 0.43,
        brand: 'GOLD MEDAL', 
        available: true 
      },
      shamrock: { 
        code: '1100478', 
        casePrice: 18.00,
        packSize: '1/50 LB',
        packQty: 1,
        packWeight: 50,
        unitPrice: 0.36,
        brand: 'GOLD MEDAL', 
        available: true 
      },
      peddlers: { 
        code: 'B100200', 
        casePrice: 64.00,
        packSize: '20/2 LB',
        packQty: 20,
        packWeight: 2,
        unitPrice: 1.60,
        brand: 'ADM', 
        available: true 
      }
    }
  },
  {
    id: 'dairy-007',
    pccStockNumber: 'PCC-D-007',
    category: 'Dairy',
    productName: 'Cheese Parmesan Shaved',
    vendors: {
      sysco: { 
        code: '7322154', 
        casePrice: 52.65,
        packSize: '2/5 LB',
        packQty: 2,
        packWeight: 5,
        unitPrice: 5.27,
        brand: 'ARREZZIO IMPERIAL', 
        available: true 
      },
      shamrock: { 
        code: '3242391', 
        casePrice: 203.60,
        packSize: '4/5 LB',
        packQty: 4,
        packWeight: 5,
        unitPrice: 10.18,
        brand: 'BELGIOIOSO', 
        available: true 
      },
      peddlers: { 
        code: 'D479001', 
        casePrice: 219.00,
        packSize: '4/5 LB',
        packQty: 4,
        packWeight: 5,
        unitPrice: 10.95,
        brand: 'BEL GIOIOSO', 
        available: true 
      }
    }
  }
];

// Helper function to compare vendors for a specific ingredient
export const compareVendors = (ingredient) => {
  const vendors = ingredient.vendors;
  const comparisons = [];

  Object.entries(vendors).forEach(([vendorName, data]) => {
    if (data.available) {
      comparisons.push({
        vendorName,
        ...data,
        totalWeight: data.packQty * data.packWeight
      });
    }
  });

  // Sort by unit price (fairest comparison)
  comparisons.sort((a, b) => a.unitPrice - b.unitPrice);

  // Add comparison data
  const bestUnitPrice = comparisons[0].unitPrice;
  const bestCasePrice = comparisons[0].casePrice;

  return comparisons.map((vendor, index) => ({
    rank: index + 1,
    ...vendor,
    unitPriceDiff: vendor.unitPrice - bestUnitPrice,
    casePriceDiff: vendor.casePrice - bestCasePrice,
    isBest: index === 0
  }));
};

// Helper to get savings summary
export const getSavingsSummary = (ingredient) => {
  const comparison = compareVendors(ingredient);
  if (comparison.length < 2) return null;

  const best = comparison[0];
  const worst = comparison[comparison.length - 1];

  return {
    bestVendor: best.vendorName,
    bestPrice: best.casePrice,
    worstVendor: worst.vendorName,
    worstPrice: worst.casePrice,
    savingsAmount: worst.casePrice - best.casePrice,
    savingsPercent: ((worst.casePrice - best.casePrice) / worst.casePrice * 100).toFixed(1)
  };
};

export default ingredientDatabase;
