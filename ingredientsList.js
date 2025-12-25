// FIXED: Ingredient List with Proper Case Prices & Pack Sizes
// All prices are CASE prices (how you order)
// Unit prices calculated for comparison

export const ingredientsList = [
  {
    id: 'FLOUR-001',
    pccStock: 'PCC-1001',
    category: 'DRY GOODS',
    name: 'Flour All Purpose',
    vendors: {
      sysco: {
        code: '8378111',
        casePrice: 19.00,           // ← CASE price
        packSize: '1/50 LB',        // ← Pack configuration
        packQty: 1,
        packWeight: 50,
        unitPrice: 0.38,            // ← Calculated: $19.00 / 50 = $0.38/lb
        lastUpdated: '2025-11-15',
        available: true
      },
      shamrock: {
        code: 'SHM-40001',
        casePrice: 18.00,
        packSize: '1/50 LB',
        packQty: 1,
        packWeight: 50,
        unitPrice: 0.36,            // ← Calculated: $18.00 / 50 = $0.36/lb
        lastUpdated: '2025-11-11',
        available: true
      },
      merit: {
        code: 'MER-40001',
        casePrice: 21.00,
        packSize: '1/50 LB',
        packQty: 1,
        packWeight: 50,
        unitPrice: 0.42,            // ← Calculated: $21.00 / 50 = $0.42/lb
        lastUpdated: '2025-11-14',
        available: true
      },
      peddlers: {
        code: 'PED-40001',
        casePrice: 22.50,
        packSize: '1/50 LB',
        packQty: 1,
        packWeight: 50,
        unitPrice: 0.45,            // ← Calculated: $22.50 / 50 = $0.45/lb
        lastUpdated: '2025-11-07',
        available: true
      }
    },
    preferredVendor: 'shamrock'
  },
  
  {
    id: 'TORTILLA-001',
    pccStock: 'PCC-7004',
    category: 'FROZEN',
    name: 'Tortilla, Corn',
    vendors: {
      sysco: {
        code: '9598160',
        casePrice: 14.00,           // ← CASE price (was showing $0.07 unit price!)
        packSize: '200/CT',         // ← 200 tortillas per case
        packQty: 200,
        packWeight: null,
        unitPrice: 0.07,            // ← Calculated: $14.00 / 200 = $0.07/each
        lastUpdated: '2025-11-16',
        available: true
      },
      shamrock: {
        code: 'SHM-70004',
        casePrice: 25.70,
        packSize: '500/CT',         // ← Different pack size!
        packQty: 500,
        packWeight: null,
        unitPrice: 0.05,            // ← Calculated: $25.70 / 500 = $0.05/each
        lastUpdated: '2025-11-12',
        available: true
      },
      merit: {
        code: 'MER-70004',
        casePrice: 22.25,
        packSize: '400/CT',
        packQty: 400,
        packWeight: null,
        unitPrice: 0.06,            // ← Calculated: $22.25 / 400 = $0.06/each
        lastUpdated: '2025-11-15',
        available: true
      },
      peddlers: {
        code: 'PED-70004',
        casePrice: 26.90,
        packSize: '500/CT',
        packQty: 500,
        packWeight: null,
        unitPrice: 0.05,            // ← Calculated: $26.90 / 500 = $0.05/each
        lastUpdated: '2025-11-08',
        available: true
      }
    },
    preferredVendor: 'shamrock'
  },

  {
    id: 'BUTTER-001',
    pccStock: 'PCC-2001',
    category: 'DAIRY',
    name: 'Butter Unsalted AA',
    vendors: {
      sysco: {
        code: '5093382',
        casePrice: 87.48,
        packSize: '36/1 LB',
        packQty: 36,
        packWeight: 1,
        unitPrice: 2.43,
        lastUpdated: '2025-11-15',
        available: true
      },
      shamrock: {
        code: '1930551',
        casePrice: 73.20,
        packSize: '30/1 LB',
        packQty: 30,
        packWeight: 1,
        unitPrice: 2.44,
        lastUpdated: '2025-11-11',
        available: true
      },
      merit: {
        code: 'MER-20001',
        casePrice: 75.60,
        packSize: '30/1 LB',
        packQty: 30,
        packWeight: 1,
        unitPrice: 2.52,
        lastUpdated: '2025-11-14',
        available: true
      },
      peddlers: {
        code: 'D432700',
        casePrice: 81.90,
        packSize: '30/1 LB',
        packQty: 30,
        packWeight: 1,
        unitPrice: 2.73,
        lastUpdated: '2025-11-07',
        available: true
      }
    },
    preferredVendor: 'shamrock'
  },

  {
    id: 'PARMESAN-001',
    pccStock: 'PCC-2007',
    category: 'DAIRY',
    name: 'Cheese Parmesan Shaved',
    vendors: {
      sysco: {
        code: '7322154',
        casePrice: 52.65,
        packSize: '2/5 LB',
        packQty: 2,
        packWeight: 5,
        unitPrice: 5.27,
        lastUpdated: '2025-11-16',
        available: true
      },
      shamrock: {
        code: '3242391',
        casePrice: 203.60,
        packSize: '4/5 LB',
        packQty: 4,
        packWeight: 5,
        unitPrice: 10.18,
        lastUpdated: '2025-11-11',
        available: true
      },
      merit: {
        code: 'MER-20007',
        casePrice: 210.00,
        packSize: '4/5 LB',
        packQty: 4,
        packWeight: 5,
        unitPrice: 10.50,
        lastUpdated: '2025-11-14',
        available: true
      },
      peddlers: {
        code: 'D479001',
        casePrice: 219.00,
        packSize: '4/5 LB',
        packQty: 4,
        packWeight: 5,
        unitPrice: 10.95,
        lastUpdated: '2025-11-07',
        available: true
      }
    },
    preferredVendor: 'sysco'
  }
];

// Helper functions
export const categories = [...new Set(ingredientsList.map(item => item.category))];

export const vendors = ['sysco', 'shamrock', 'merit', 'peddlers'];

export const vendorNames = {
  sysco: 'Sysco',
  shamrock: 'Shamrock Foods',
  merit: 'Merit',
  peddlers: 'Peddlers'
};

// Get best price by UNIT price (fair comparison)
export function getBestPrice(item) {
  let best = { vendor: null, unitPrice: Infinity, casePrice: null };
  Object.entries(item.vendors).forEach(([vendor, data]) => {
    if (data.available && data.unitPrice < best.unitPrice) {
      best = { 
        vendor, 
        unitPrice: data.unitPrice,
        casePrice: data.casePrice,
        packSize: data.packSize
      };
    }
  });
  return best;
}

// Get item price (preferred vendor or best available)
export function getItemPrice(item) {
  const preferred = item.vendors[item.preferredVendor];
  if (preferred && preferred.available) {
    return {
      casePrice: preferred.casePrice,
      unitPrice: preferred.unitPrice,
      packSize: preferred.packSize
    };
  }
  const best = getBestPrice(item);
  return {
    casePrice: best.casePrice,
    unitPrice: best.unitPrice,
    packSize: best.packSize
  };
}

export function getItemByPccStock(pccStock) {
  return ingredientsList.find(item => item.pccStock === pccStock);
}

export function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default ingredientsList;
