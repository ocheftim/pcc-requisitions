import React, { useState, useEffect, useMemo } from 'react';
import { getRequisitions } from '../../lib/supabase';

// Active courses this semester
const ACTIVE_COURSES = ['CUL130', 'CUL160', 'CUL244', 'CUL260'];

// Vendor options
const VENDORS = [
  { id: 'sysco', name: 'Sysco', color: 'bg-blue-100 text-blue-800' },
  { id: 'shamrock', name: 'Shamrock', color: 'bg-green-100 text-green-800' },
  { id: 'peddlers', name: "Peddler's Son", color: 'bg-orange-100 text-orange-800' },
  { id: 'costco', name: 'Costco', color: 'bg-red-100 text-red-800' },
  { id: 'local', name: 'Local/Other', color: 'bg-purple-100 text-purple-800' },
];

// Common pantry items that likely have stock
const PANTRY_ITEMS = ['salt', 'pepper', 'sugar', 'flour', 'oil', 'butter', 'garlic'];

// Category inference based on ingredient name
const CATEGORY_KEYWORDS = {
  'Produce': ['lettuce', 'tomato', 'onion', 'garlic', 'carrot', 'celery', 'pepper', 'mushroom', 'potato', 'lemon', 'lime', 'orange', 'apple', 'berry', 'fruit', 'vegetable', 'herb', 'basil', 'parsley', 'cilantro', 'thyme', 'rosemary', 'mint', 'dill', 'chive', 'scallion', 'shallot', 'leek', 'spinach', 'kale', 'arugula', 'cabbage', 'broccoli', 'cauliflower', 'asparagus', 'zucchini', 'squash', 'eggplant', 'cucumber', 'avocado', 'ginger', 'jalapeño', 'serrano', 'habanero', 'poblano', 'banana', 'grape', 'melon', 'pineapple', 'mango', 'peach', 'pear', 'plum', 'cherry', 'apricot', 'fig', 'date', 'raisin', 'cranberry', 'blueberry', 'raspberry', 'strawberry', 'blackberry'],
  'Dairy & Eggs': ['milk', 'cream', 'butter', 'cheese', 'yogurt', 'egg', 'sour cream', 'half', 'buttermilk', 'ricotta', 'mascarpone', 'mozzarella', 'parmesan', 'cheddar', 'brie', 'gouda', 'feta', 'goat cheese', 'cream cheese'],
  'Meat & Poultry': ['beef', 'pork', 'chicken', 'turkey', 'lamb', 'veal', 'duck', 'bacon', 'ham', 'sausage', 'ground', 'steak', 'roast', 'chop', 'tenderloin', 'ribeye', 'sirloin', 'brisket', 'prosciutto', 'pancetta'],
  'Seafood': ['fish', 'salmon', 'tuna', 'shrimp', 'crab', 'lobster', 'scallop', 'mussel', 'clam', 'oyster', 'cod', 'halibut', 'tilapia', 'trout', 'bass', 'snapper', 'squid', 'calamari', 'octopus', 'anchovy'],
  'Baking & Pastry': ['flour', 'sugar', 'yeast', 'baking powder', 'baking soda', 'vanilla', 'chocolate', 'cocoa', 'almond', 'extract', 'gelatin', 'pectin', 'cornstarch', 'confectioner', 'powdered sugar', 'brown sugar', 'molasses', 'honey', 'maple', 'corn syrup', 'shortening', 'lard'],
  'Dry Goods': ['rice', 'pasta', 'noodle', 'quinoa', 'couscous', 'barley', 'oat', 'cereal', 'bread', 'crumb', 'tortilla', 'bean', 'lentil', 'chickpea', 'pea'],
  'Oils & Vinegars': ['oil', 'olive', 'vegetable oil', 'canola', 'sesame', 'vinegar', 'balsamic', 'wine vinegar', 'cider vinegar', 'rice vinegar'],
  'Spices & Seasonings': ['salt', 'pepper', 'cumin', 'paprika', 'oregano', 'cinnamon', 'nutmeg', 'clove', 'allspice', 'cardamom', 'coriander', 'turmeric', 'curry', 'chili', 'cayenne', 'bay leaf', 'sage', 'tarragon', 'marjoram'],
  'Canned & Jarred': ['tomato paste', 'tomato sauce', 'diced tomato', 'crushed tomato', 'canned', 'jarred', 'pickle', 'olive', 'caper', 'artichoke', 'roasted pepper', 'sundried'],
  'Condiments & Sauces': ['mustard', 'ketchup', 'mayonnaise', 'soy sauce', 'worcestershire', 'hot sauce', 'sriracha', 'teriyaki', 'hoisin', 'fish sauce', 'oyster sauce', 'tahini', 'pesto'],
  'Nuts & Seeds': ['almond', 'walnut', 'pecan', 'cashew', 'pistachio', 'peanut', 'hazelnut', 'pine nut', 'macadamia', 'sesame seed', 'sunflower', 'pumpkin seed', 'chia', 'flax'],
  'Beverages': ['wine', 'beer', 'brandy', 'rum', 'vodka', 'whiskey', 'liqueur', 'juice', 'stock', 'broth', 'coffee', 'tea'],
};

function inferCategory(ingredientName) {
  const nameLower = ingredientName.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (nameLower.includes(keyword)) {
        return category;
      }
    }
  }
  return 'Other';
}

// Known ingredient aliases
const INGREDIENT_ALIASES = {
  'butter unsalted': 'Unsalted Butter',
  'unsalted butter': 'Unsalted Butter',
  'all purpose flour': 'All-Purpose Flour',
  'ap flour': 'All-Purpose Flour',
  'heavy cream': 'Heavy Cream',
  'cream heavy': 'Heavy Cream',
  'eggs large': 'Eggs (Large)',
  'large eggs': 'Eggs (Large)',
  'eggs': 'Eggs (Large)',
};

function createMatchKey(name) {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/[,\-()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(w => w.length > 0)
    .sort()
    .join(' ');
}

function normalizeIngredientName(name) {
  if (!name) return '';
  const matchKey = createMatchKey(name);
  if (INGREDIENT_ALIASES[matchKey]) {
    return INGREDIENT_ALIASES[matchKey];
  }
  return name
    .toLowerCase()
    .replace(/,\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function normalizeUnit(unit) {
  if (!unit) return '';
  const unitMap = {
    'lbs': 'lb', 'pound': 'lb', 'pounds': 'lb',
    'ozs': 'oz', 'ounce': 'oz', 'ounces': 'oz',
    'dozen': 'doz', 'dz': 'doz',
    'each': 'ea', 'eaches': 'ea',
    'gallon': 'gal', 'gallons': 'gal',
    'quart': 'qt', 'quarts': 'qt',
    'bunch': 'bn', 'bunches': 'bn',
  };
  const lower = unit.toLowerCase().trim();
  return unitMap[lower] || lower;
}

// Format date as "Wed 1/21"
function formatShortDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return `${days[date.getDay()]} ${date.getMonth() + 1}/${date.getDate()}`;
}

// Extract topic from week field (e.g., "Term 1 Week 1 - Eggs" → "Eggs")
function extractTopic(weekField) {
  if (!weekField) return '';
  const match = weekField.match(/[-–]\s*(.+)$/);
  return match ? match[1].trim() : '';
}

// Extract module number from week field
function extractModuleNumber(weekField) {
  if (!weekField) return 0;
  const match = weekField.match(/(?:module|mod|week|wk)\s*(\d+)/i) || weekField.match(/Week\s*(\d+)/i);
  return match ? parseInt(match[1]) : 0;
}

export default function SmartOrderPage() {
  const [requisitions, setRequisitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReqs, setSelectedReqs] = useState([]);
  const [orderItems, setOrderItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [vendorFilter, setVendorFilter] = useState('all');
  
  // Filters - simplified
  const [selectedCourses, setSelectedCourses] = useState([]);

  // Load requisitions
  useEffect(() => {
    async function load() {
      try {
        const data = await getRequisitions();
        const processed = data.map(r => {
          let ingredients = [];
          if (r.items) {
            try {
              ingredients = typeof r.items === 'string' ? JSON.parse(r.items) : r.items;
            } catch (e) {
              console.error('Error parsing items for', r.id, e);
            }
          }
          if ((!ingredients || ingredients.length === 0) && r.ingredients) {
            ingredients = typeof r.ingredients === 'string' ? JSON.parse(r.ingredients) : r.ingredients;
          }
          return { ...r, ingredients };
        });
        
        const active = processed.filter(r => {
          return r.status !== 'completed' &&
            r.status !== 'cancelled' &&
            r.ingredients &&
            r.ingredients.length > 0;
        });
        
        setRequisitions(active);
        setSelectedReqs([]);
      } catch (err) {
        console.error('Error loading requisitions:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Get available courses from requisitions
  const availableCourses = useMemo(() => {
    const courses = new Set();
    requisitions.forEach(r => {
      if (r.course) {
        const normalized = r.course.replace(/\s+/g, '').toUpperCase();
        if (ACTIVE_COURSES.some(ac => ac.replace(/\s+/g, '').toUpperCase() === normalized)) {
          courses.add(normalized);
        }
      }
    });
    return Array.from(courses).sort();
  }, [requisitions]);

  // Filter requisitions by selected courses
  const filteredRequisitions = useMemo(() => {
    if (selectedCourses.length === 0) return [];
    return requisitions.filter(r => {
      const courseNormalized = (r.course || '').replace(/\s+/g, '').toUpperCase();
      return selectedCourses.includes(courseNormalized);
    });
  }, [requisitions, selectedCourses]);

  // Build module list from filtered requisitions - grouped by course
  const modulesByCourse = useMemo(() => {
    const courseMap = {};
    
    filteredRequisitions.forEach(req => {
      const course = (req.course || '').replace(/\s+/g, '').toUpperCase();
      if (!courseMap[course]) {
        courseMap[course] = [];
      }
      
      const moduleNum = extractModuleNumber(req.week);
      const topic = extractTopic(req.week);
      const dateStr = formatShortDate(req.class_date);
      
      courseMap[course].push({
        id: req.id,
        moduleNum,
        topic,
        dateStr,
        date: req.class_date ? new Date(req.class_date) : null,
        itemCount: (req.ingredients || []).length,
        week: req.week,
      });
    });
    
    // Sort each course's modules by date
    Object.keys(courseMap).forEach(course => {
      courseMap[course].sort((a, b) => {
        if (a.date && b.date) return a.date - b.date;
        return a.moduleNum - b.moduleNum;
      });
    });
    
    return courseMap;
  }, [filteredRequisitions]);

  // Consolidate ingredients when selection changes
  useEffect(() => {
    const selectedData = requisitions.filter(r => selectedReqs.includes(r.id));
    const itemMap = {};

    selectedData.forEach(req => {
      const ingredients = req.ingredients || [];
      ingredients.forEach(ing => {
        const normalizedName = normalizeIngredientName(ing.name);
        const normalizedUnit = normalizeUnit(ing.unit);
        const matchKey = createMatchKey(ing.name);
        const key = `${matchKey}|${normalizedUnit}`;

        if (!itemMap[key]) {
          const isPantry = PANTRY_ITEMS.some(p => normalizedName.toLowerCase().includes(p));
          const category = ing.category || inferCategory(normalizedName);
          
          itemMap[key] = {
            id: key,
            name: normalizedName,
            unit: normalizedUnit,
            category: category,
            totalNeeded: 0,
            onHand: isPantry ? 5 : 0,
            onHandEstimated: isPantry,
            vendor: ing.vendor || 'sysco',
            packSize: ing.packSize || '',
            unitPrice: ing.unitPrice || 0,
            syscoNumber: ing.syscoNumber || ing.itemNumber || '',
            sources: [],
            originalNames: [],
          };
        }

        itemMap[key].totalNeeded += parseFloat(ing.quantity) || 0;
        itemMap[key].sources.push(req.course || req.name);
        if (!itemMap[key].originalNames.includes(ing.name)) {
          itemMap[key].originalNames.push(ing.name);
        }
        if (ing.packSize && !itemMap[key].packSize) itemMap[key].packSize = ing.packSize;
        if (ing.unitPrice && !itemMap[key].unitPrice) itemMap[key].unitPrice = ing.unitPrice;
        if (ing.syscoNumber && !itemMap[key].syscoNumber) itemMap[key].syscoNumber = ing.syscoNumber;
      });
    });

    const items = Object.values(itemMap).map(item => {
      const netNeeded = Math.max(0, item.totalNeeded - item.onHand);
      const packQty = parseFloat(item.packSize) || 1;
      const casesNeeded = packQty > 0 ? Math.ceil(netNeeded / packQty) : netNeeded;
      
      return {
        ...item,
        netNeeded,
        orderQty: casesNeeded,
        orderQtyOverride: null,
      };
    });

    setOrderItems(items);
  }, [requisitions, selectedReqs]);

  // Filtered and sorted items
  const displayItems = useMemo(() => {
    let filtered = [...orderItems];
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(term) ||
        item.syscoNumber?.includes(term)
      );
    }
    
    if (vendorFilter !== 'all') {
      filtered = filtered.filter(item => item.vendor === vendorFilter);
    }

    const categoryOrder = [
      'Produce', 'Dairy & Eggs', 'Meat & Poultry', 'Seafood',
      'Baking & Pastry', 'Dry Goods', 'Oils & Vinegars',
      'Spices & Seasonings', 'Canned & Jarred', 'Condiments & Sauces',
      'Nuts & Seeds', 'Beverages', 'Other'
    ];

    filtered.sort((a, b) => {
      const catA = categoryOrder.indexOf(a.category);
      const catB = categoryOrder.indexOf(b.category);
      if (catA !== catB) return catA - catB;
      if (a.netNeeded === 0 && b.netNeeded > 0) return 1;
      if (a.netNeeded > 0 && b.netNeeded === 0) return -1;
      return a.name.localeCompare(b.name);
    });

    return filtered;
  }, [orderItems, searchTerm, vendorFilter]);

  // Group items by category
  const groupedItems = useMemo(() => {
    const groups = {};
    displayItems.forEach(item => {
      const cat = item.category || 'Other';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    });
    return groups;
  }, [displayItems]);

  // Toggle course selection
  const toggleCourse = (course) => {
    setSelectedCourses(prev => {
      const newCourses = prev.includes(course)
        ? prev.filter(c => c !== course)
        : [...prev, course];
      
      // Clear module selections when courses change
      setSelectedReqs([]);
      return newCourses;
    });
  };

  // Toggle module selection
  const toggleModule = (reqId) => {
    setSelectedReqs(prev =>
      prev.includes(reqId) ? prev.filter(x => x !== reqId) : [...prev, reqId]
    );
  };

  // Select all modules for a course
  const selectAllForCourse = (course) => {
    const courseModules = modulesByCourse[course] || [];
    const moduleIds = courseModules.map(m => m.id);
    const allSelected = moduleIds.every(id => selectedReqs.includes(id));
    
    if (allSelected) {
      setSelectedReqs(prev => prev.filter(id => !moduleIds.includes(id)));
    } else {
      setSelectedReqs(prev => [...new Set([...prev, ...moduleIds])]);
    }
  };

  // Select all modules across all selected courses
  const selectAllModules = () => {
    const allModuleIds = Object.values(modulesByCourse).flat().map(m => m.id);
    const allSelected = allModuleIds.every(id => selectedReqs.includes(id));
    
    if (allSelected) {
      setSelectedReqs([]);
    } else {
      setSelectedReqs(allModuleIds);
    }
  };

  // Update item functions
  const updateVendor = (itemId, newVendor) => {
    setOrderItems(prev => prev.map(item =>
      item.id === itemId ? { ...item, vendor: newVendor } : item
    ));
  };

  const updateOnHand = (itemId, delta) => {
    setOrderItems(prev => prev.map(item => {
      if (item.id !== itemId) return item;
      const newOnHand = Math.max(0, item.onHand + delta);
      const netNeeded = Math.max(0, item.totalNeeded - newOnHand);
      const packQty = parseFloat(item.packSize) || 1;
      const casesNeeded = packQty > 0 ? Math.ceil(netNeeded / packQty) : netNeeded;
      return {
        ...item,
        onHand: newOnHand,
        onHandEstimated: false,
        netNeeded,
        orderQty: item.orderQtyOverride ?? casesNeeded,
      };
    }));
  };

  const updateOrderQty = (itemId, delta) => {
    setOrderItems(prev => prev.map(item => {
      if (item.id !== itemId) return item;
      const newQty = Math.max(0, (item.orderQtyOverride ?? item.orderQty) + delta);
      return { ...item, orderQty: newQty, orderQtyOverride: newQty };
    }));
  };

  const markAsHave = (itemId) => {
    setOrderItems(prev => prev.map(item => {
      if (item.id !== itemId) return item;
      return {
        ...item,
        onHand: item.totalNeeded,
        onHandEstimated: false,
        netNeeded: 0,
        orderQty: 0,
        orderQtyOverride: 0,
      };
    }));
  };

  const undoHaveIt = (itemId) => {
    setOrderItems(prev => prev.map(item => {
      if (item.id !== itemId) return item;
      const isPantry = PANTRY_ITEMS.some(p => item.name.toLowerCase().includes(p));
      const onHand = isPantry ? 5 : 0;
      const netNeeded = Math.max(0, item.totalNeeded - onHand);
      const packQty = parseFloat(item.packSize) || 1;
      const casesNeeded = packQty > 0 ? Math.ceil(netNeeded / packQty) : netNeeded;
      return {
        ...item,
        onHand,
        onHandEstimated: isPantry,
        netNeeded,
        orderQty: casesNeeded,
        orderQtyOverride: null,
      };
    }));
  };

  // Print order
  const printOrder = () => {
    const itemsToPrint = displayItems.filter(item => item.orderQty > 0);
    const grouped = {};
    
    itemsToPrint.forEach(item => {
      const vendor = item.vendor || 'sysco';
      if (!grouped[vendor]) grouped[vendor] = [];
      grouped[vendor].push(item);
    });

    const printWindow = window.open('', '_blank');
    const vendorNames = { sysco: 'Sysco', shamrock: 'Shamrock', peddlers: "Peddler's Son", costco: 'Costco', local: 'Local/Other' };
    
    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Order List - ${new Date().toLocaleDateString()}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { font-size: 18px; margin-bottom: 5px; }
          h2 { font-size: 16px; color: #333; margin: 20px 0 10px; padding-bottom: 5px; border-bottom: 2px solid #333; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px; }
          th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; }
          th { background: #f5f5f5; font-weight: bold; }
          .qty { text-align: center; font-weight: bold; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <h1>Order List</h1>
        <p style="color: #666; margin-bottom: 20px;">Generated: ${new Date().toLocaleString()}</p>
    `;

    Object.entries(grouped).forEach(([vendor, items]) => {
      html += `<h2>${vendorNames[vendor] || vendor} (${items.length} items)</h2>`;
      html += `
        <table>
          <thead>
            <tr>
              <th style="width: 30px;"></th>
              <th>Item</th>
              <th>Item #</th>
              <th>Pack Size</th>
              <th class="qty">Order Qty</th>
              <th>Unit</th>
            </tr>
          </thead>
          <tbody>
      `;
      items.forEach((item, idx) => {
        html += `
          <tr>
            <td>${idx + 1}</td>
            <td>${item.name}</td>
            <td>${item.syscoNumber || '-'}</td>
            <td>${item.packSize || '-'}</td>
            <td class="qty">${item.orderQty}</td>
            <td>${item.unit}</td>
          </tr>
        `;
      });
      html += '</tbody></table>';
    });

    html += '</body></html>';
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  };

  // Vendor counts
  const vendorCounts = useMemo(() => {
    const counts = { all: 0 };
    orderItems.filter(i => i.netNeeded > 0).forEach(item => {
      counts.all++;
      counts[item.vendor] = (counts[item.vendor] || 0) + 1;
    });
    return counts;
  }, [orderItems]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse text-gray-500">Loading orders...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Current Order</h1>
          <p className="text-gray-500 text-sm mt-1">
            {displayItems.filter(i => i.netNeeded > 0).length} items to order
            {displayItems.filter(i => i.netNeeded === 0).length > 0 && (
              <span className="text-green-600"> · {displayItems.filter(i => i.netNeeded === 0).length} covered</span>
            )}
            {selectedReqs.length > 0 && ` from ${selectedReqs.length} requisitions`}
          </p>
        </div>
        <button
          onClick={printOrder}
          disabled={displayItems.filter(i => i.orderQty > 0).length === 0}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Print Order
        </button>
      </div>

      {/* Step 1: Select Courses */}
      <div className="bg-white border rounded-lg p-4 mb-4">
        <h2 className="font-semibold text-gray-700 mb-3">1. Select Course(s)</h2>
        <div className="flex flex-wrap gap-2">
          {ACTIVE_COURSES.map(course => {
            const normalized = course.replace(/\s+/g, '').toUpperCase();
            const isAvailable = availableCourses.includes(normalized);
            const isSelected = selectedCourses.includes(normalized);
            
            return (
              <button
                key={course}
                onClick={() => isAvailable && toggleCourse(normalized)}
                disabled={!isAvailable}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  isSelected
                    ? 'bg-blue-600 text-white'
                    : isAvailable
                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    : 'bg-gray-50 text-gray-300 cursor-not-allowed'
                }`}
              >
                {course}
              </button>
            );
          })}
        </div>
      </div>

      {/* Step 2: Select Modules */}
      {selectedCourses.length > 0 && (
        <div className="bg-white border rounded-lg p-4 mb-4">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-semibold text-gray-700">2. Select Module(s)</h2>
            <button
              onClick={selectAllModules}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              {Object.values(modulesByCourse).flat().every(m => selectedReqs.includes(m.id))
                ? 'Deselect All'
                : 'Select All'}
            </button>
          </div>
          
          {selectedCourses.map(course => {
            const modules = modulesByCourse[course] || [];
            const allSelected = modules.every(m => selectedReqs.includes(m.id));
            
            return (
              <div key={course} className="mb-4 last:mb-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-medium text-gray-800">{course}</span>
                  <button
                    onClick={() => selectAllForCourse(course)}
                    className="text-xs text-blue-500 hover:text-blue-700"
                  >
                    {allSelected ? 'Deselect all' : 'Select all'}
                  </button>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                  {modules.map(mod => {
                    const isSelected = selectedReqs.includes(mod.id);
                    return (
                      <button
                        key={mod.id}
                        onClick={() => toggleModule(mod.id)}
                        className={`p-3 rounded-lg border-2 text-left transition-all ${
                          isSelected
                            ? 'bg-blue-50 border-blue-500'
                            : 'bg-white border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className={`font-semibold ${isSelected ? 'text-blue-700' : 'text-gray-800'}`}>
                              Module {mod.moduleNum}
                            </div>
                            <div className="text-sm text-gray-600">{mod.dateStr}</div>
                            {mod.topic && (
                              <div className="text-sm text-gray-500 mt-1">{mod.topic}</div>
                            )}
                          </div>
                          <span className={`text-xs px-2 py-1 rounded ${isSelected ? 'bg-blue-200 text-blue-800' : 'bg-gray-100 text-gray-600'}`}>
                            {mod.itemCount} items
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Items Section - only show if modules selected */}
      {selectedReqs.length > 0 && (
        <>
          {/* Search and Vendor Filter */}
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setVendorFilter('all')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  vendorFilter === 'all' ? 'bg-white shadow text-gray-900' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                All ({vendorCounts.all || 0})
              </button>
              {VENDORS.map(v => (
                <button
                  key={v.id}
                  onClick={() => setVendorFilter(v.id)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    vendorFilter === v.id ? 'bg-white shadow text-gray-900' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {v.name} ({vendorCounts[v.id] || 0})
                </button>
              ))}
            </div>
          </div>

          {/* Order Table */}
          <div className="bg-white border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Item</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Vendor</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Item #</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Pack Size</th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-700">Needed</th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-700">On Hand</th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-700">Net</th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-700">Order Qty</th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {displayItems.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                        No items match your filters
                      </td>
                    </tr>
                  ) : (
                    Object.entries(groupedItems).map(([category, items]) => (
                      <React.Fragment key={category}>
                        <tr className="bg-gray-100">
                          <td colSpan={9} className="px-4 py-2 font-semibold text-gray-700 text-sm">
                            {category} ({items.filter(i => i.netNeeded > 0).length} to order)
                          </td>
                        </tr>
                        {items.map(item => {
                          const vendorInfo = VENDORS.find(v => v.id === item.vendor) || VENDORS[0];
                          const isCovered = item.netNeeded === 0;
                          return (
                            <tr key={item.id} className={`${isCovered ? 'bg-gray-50 opacity-60' : 'hover:bg-gray-50'}`}>
                              <td className="px-4 py-3">
                                <div className={`font-medium ${isCovered ? 'text-gray-400 line-through' : 'text-gray-900'}`}>{item.name}</div>
                                <div className="text-xs text-gray-400 mt-0.5">{item.sources.join(', ')}</div>
                              </td>
                              <td className="px-4 py-3">
                                <select
                                  value={item.vendor}
                                  onChange={(e) => updateVendor(item.id, e.target.value)}
                                  disabled={isCovered}
                                  className={`px-2 py-1 rounded text-xs font-medium border-0 cursor-pointer ${isCovered ? 'bg-gray-200 text-gray-400' : vendorInfo.color}`}
                                >
                                  {VENDORS.map(v => (
                                    <option key={v.id} value={v.id}>{v.name}</option>
                                  ))}
                                </select>
                              </td>
                              <td className={`px-4 py-3 text-xs font-mono ${isCovered ? 'text-gray-300' : 'text-gray-600'}`}>
                                {item.syscoNumber || '-'}
                              </td>
                              <td className={`px-4 py-3 ${isCovered ? 'text-gray-300' : 'text-gray-600'}`}>
                                {item.packSize || '-'}
                              </td>
                              <td className={`px-4 py-3 text-center ${isCovered ? 'text-gray-300 line-through' : 'text-gray-700'}`}>
                                {item.totalNeeded} {item.unit}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    onClick={() => updateOnHand(item.id, -1)}
                                    className="w-6 h-6 rounded bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-bold"
                                  >
                                    -
                                  </button>
                                  <span className={`w-10 text-center ${item.onHandEstimated ? 'text-purple-600 italic' : ''} ${isCovered ? 'text-green-600 font-bold' : ''}`}>
                                    {item.onHand}
                                  </span>
                                  <button
                                    onClick={() => updateOnHand(item.id, 1)}
                                    className="w-6 h-6 rounded bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-bold"
                                  >
                                    +
                                  </button>
                                </div>
                              </td>
                              <td className={`px-4 py-3 text-center font-medium ${isCovered ? 'text-gray-300' : 'text-gray-900'}`}>
                                {item.netNeeded} {item.unit}
                              </td>
                              <td className="px-4 py-3">
                                {isCovered ? (
                                  <div className="text-center text-gray-300">0</div>
                                ) : (
                                  <div className="flex items-center justify-center gap-1">
                                    <button
                                      onClick={() => updateOrderQty(item.id, -1)}
                                      className="w-6 h-6 rounded bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-bold"
                                    >
                                      -
                                    </button>
                                    <span className={`w-10 text-center font-bold ${item.orderQtyOverride !== null ? 'text-yellow-600' : 'text-blue-600'}`}>
                                      {item.orderQty}
                                    </span>
                                    <button
                                      onClick={() => updateOrderQty(item.id, 1)}
                                      className="w-6 h-6 rounded bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-bold"
                                    >
                                      +
                                    </button>
                                  </div>
                                )}
                              </td>
                              <td className="px-4 py-3 text-center">
                                {isCovered ? (
                                  <button
                                    onClick={() => undoHaveIt(item.id)}
                                    className="px-2 py-1 rounded text-xs bg-gray-200 text-gray-600 hover:bg-gray-300"
                                  >
                                    Undo
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => markAsHave(item.id)}
                                    className="px-2 py-1 rounded text-xs bg-green-100 text-green-700 hover:bg-green-200"
                                  >
                                    Have It
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </React.Fragment>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary Footer */}
          <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-600">
            {VENDORS.map(v => {
              const count = displayItems.filter(i => i.vendor === v.id && i.orderQty > 0).length;
              if (count === 0) return null;
              return (
                <div key={v.id} className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${v.color}`}>{v.name}</span>
                  <span>{count} items</span>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Empty state */}
      {selectedCourses.length === 0 && (
        <div className="bg-white border rounded-lg p-8 text-center text-gray-500">
          <p>Select a course above to see available modules</p>
        </div>
      )}

      {selectedCourses.length > 0 && selectedReqs.length === 0 && (
        <div className="bg-white border rounded-lg p-8 text-center text-gray-500">
          <p>Select modules above to see items to order</p>
        </div>
      )}
    </div>
  );
}
