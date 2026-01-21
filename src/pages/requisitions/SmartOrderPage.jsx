import React, { useState, useEffect, useMemo } from 'react';
import { getRequisitions } from '../../lib/supabase';

// Active courses this semester
const ACTIVE_COURSES = ['CUL130', 'CUL160', 'CUL244', 'CUL260', 'CUL 130', 'CUL 160', 'CUL 244', 'CUL 260'];

// Terms
const TERMS = [
  { id: 'spring2026', name: 'Spring 2026', start: '2026-01-13', end: '2026-05-15' },
  { id: 'fall2025', name: 'Fall 2025', start: '2025-08-25', end: '2025-12-15' },
];

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

// Known ingredient aliases - map variations to canonical name
const INGREDIENT_ALIASES = {
  'butter unsalted': 'Unsalted Butter',
  'unsalted butter': 'Unsalted Butter',
  'butter sweet': 'Unsalted Butter',
  'sweet butter': 'Unsalted Butter',
  'butter salted': 'Salted Butter',
  'salted butter': 'Salted Butter',
  'all purpose flour': 'All-Purpose Flour',
  'ap flour': 'All-Purpose Flour',
  'flour all purpose': 'All-Purpose Flour',
  'flour ap': 'All-Purpose Flour',
  'bread flour': 'Bread Flour',
  'flour bread': 'Bread Flour',
  'cake flour': 'Cake Flour',
  'flour cake': 'Cake Flour',
  'pastry flour': 'Pastry Flour',
  'flour pastry': 'Pastry Flour',
  'powdered sugar': 'Powdered Sugar',
  'confectioners sugar': 'Powdered Sugar',
  'icing sugar': 'Powdered Sugar',
  'sugar powdered': 'Powdered Sugar',
  'sugar confectioners': 'Powdered Sugar',
  '10x sugar': 'Powdered Sugar',
  'granulated sugar': 'Granulated Sugar',
  'sugar granulated': 'Granulated Sugar',
  'white sugar': 'Granulated Sugar',
  'sugar white': 'Granulated Sugar',
  'brown sugar': 'Brown Sugar',
  'sugar brown': 'Brown Sugar',
  'light brown sugar': 'Light Brown Sugar',
  'dark brown sugar': 'Dark Brown Sugar',
  'heavy cream': 'Heavy Cream',
  'cream heavy': 'Heavy Cream',
  'heavy whipping cream': 'Heavy Cream',
  'whipping cream': 'Heavy Cream',
  'cream whipping': 'Heavy Cream',
  'half and half': 'Half & Half',
  'half half': 'Half & Half',
  'whole milk': 'Whole Milk',
  'milk whole': 'Whole Milk',
  'eggs large': 'Eggs (Large)',
  'large eggs': 'Eggs (Large)',
  'egg large': 'Eggs (Large)',
  'eggs': 'Eggs (Large)',
  'egg': 'Eggs (Large)',
  'vanilla extract': 'Vanilla Extract',
  'extract vanilla': 'Vanilla Extract',
  'pure vanilla extract': 'Vanilla Extract',
  'vanilla pure extract': 'Vanilla Extract',
  'kosher salt': 'Kosher Salt',
  'salt kosher': 'Kosher Salt',
  'sea salt': 'Sea Salt',
  'salt sea': 'Sea Salt',
  'table salt': 'Table Salt',
  'salt table': 'Table Salt',
  'olive oil': 'Olive Oil',
  'oil olive': 'Olive Oil',
  'extra virgin olive oil': 'Extra Virgin Olive Oil',
  'evoo': 'Extra Virgin Olive Oil',
  'vegetable oil': 'Vegetable Oil',
  'oil vegetable': 'Vegetable Oil',
  'canola oil': 'Canola Oil',
  'oil canola': 'Canola Oil',
  'baking powder': 'Baking Powder',
  'powder baking': 'Baking Powder',
  'baking soda': 'Baking Soda',
  'soda baking': 'Baking Soda',
  'bicarbonate soda': 'Baking Soda',
  'cream of tartar': 'Cream of Tartar',
  'tartar cream': 'Cream of Tartar',
  'ap flour': 'All-Purpose Flour',
  'active dry yeast': 'Active Dry Yeast',
  'yeast active dry': 'Active Dry Yeast',
  'dry yeast active': 'Active Dry Yeast',
  'instant yeast': 'Instant Yeast',
  'yeast instant': 'Instant Yeast',
  'instant dry yeast': 'Instant Dry Yeast',
  'dry milk powder': 'Dry Milk Powder',
  'milk powder dry': 'Dry Milk Powder',
  'nonfat dry milk': 'Dry Milk Powder',
  'powdered milk': 'Dry Milk Powder',
};

// Create a normalized key for matching (alphabetized words)
function createMatchKey(name) {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/[,\-()]/g, ' ')  // Remove punctuation
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(w => w.length > 0)
    .sort()  // Alphabetize words so "butter unsalted" = "unsalted butter"
    .join(' ');
}

function normalizeIngredientName(name) {
  if (!name) return '';
  
  // First check for known aliases
  const matchKey = createMatchKey(name);
  if (INGREDIENT_ALIASES[matchKey]) {
    return INGREDIENT_ALIASES[matchKey];
  }
  
  // Otherwise, clean up and title case
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
    'cups': 'cup', 'c': 'cup',
    'tbsps': 'tbsp', 'tablespoon': 'tbsp', 'tablespoons': 'tbsp',
    'tsps': 'tsp', 'teaspoon': 'tsp', 'teaspoons': 'tsp',
    'dozen': 'doz', 'dz': 'doz',
    'each': 'ea', 'eaches': 'ea',
    'gallon': 'gal', 'gallons': 'gal',
    'quart': 'qt', 'quarts': 'qt',
    'pint': 'pt', 'pints': 'pt',
    'bunch': 'bn', 'bunches': 'bn',
    'fl oz': 'fl oz', 'fluid ounce': 'fl oz', 'fluid ounces': 'fl oz',
  };
  const lower = unit.toLowerCase().trim();
  return unitMap[lower] || lower;
}

export default function SmartOrderPage() {
  const [requisitions, setRequisitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReqs, setSelectedReqs] = useState([]);
  const [orderItems, setOrderItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [vendorFilter, setVendorFilter] = useState('all');
  const [sortField, setSortField] = useState('name');
  const [sortDir, setSortDir] = useState('asc');
  
  // Filters
  const [dateRangeFilter, setDateRangeFilter] = useState('next2weeks'); // 'all', 'next2weeks', 'thismonth', 'custom'
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [courseFilter, setCourseFilter] = useState(['CUL130', 'CUL160', 'CUL244', 'CUL260']);
  const [moduleFilter, setModuleFilter] = useState([]); // empty = all

  // Load requisitions
  useEffect(() => {
    async function load() {
      try {
        const data = await getRequisitions();
        // Parse items JSON and filter to only those with actual ingredients
        const processed = data.map(r => {
          let ingredients = [];
          // Try parsing items field (JSON string)
          if (r.items) {
            try {
              ingredients = typeof r.items === 'string' ? JSON.parse(r.items) : r.items;
            } catch (e) {
              console.error('Error parsing items for', r.id, e);
            }
          }
          // Fallback to ingredients field
          if ((!ingredients || ingredients.length === 0) && r.ingredients) {
            ingredients = typeof r.ingredients === 'string' ? JSON.parse(r.ingredients) : r.ingredients;
          }
          return { ...r, ingredients };
        });
        
        // Filter: pending/approved status AND has ingredients
        const active = processed.filter(r => {
          return r.status !== 'completed' && 
            r.status !== 'cancelled' &&
            r.ingredients && 
            r.ingredients.length > 0;
        });
        
        setRequisitions(active);
        // Don't auto-select all - let user choose
        setSelectedReqs([]);
      } catch (err) {
        console.error('Error loading requisitions:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Filter requisitions based on date range, course, module
  const filteredRequisitions = useMemo(() => {
    let filtered = [...requisitions];
    
    // Course filter
    if (courseFilter.length > 0) {
      filtered = filtered.filter(r => {
        const courseNormalized = (r.course || '').replace(/\s+/g, '').toUpperCase();
        return courseFilter.some(c => c.replace(/\s+/g, '').toUpperCase() === courseNormalized);
      });
    }
    
    // Date range filter
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (dateRangeFilter === 'next2weeks') {
      const twoWeeksOut = new Date(today);
      twoWeeksOut.setDate(twoWeeksOut.getDate() + 14);
      filtered = filtered.filter(r => {
        if (!r.class_date) return true; // Include if no date
        const classDate = new Date(r.class_date);
        return classDate >= today && classDate <= twoWeeksOut;
      });
    } else if (dateRangeFilter === 'thismonth') {
      const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      filtered = filtered.filter(r => {
        if (!r.class_date) return true;
        const classDate = new Date(r.class_date);
        return classDate >= today && classDate <= monthEnd;
      });
    } else if (dateRangeFilter === 'custom' && customStartDate && customEndDate) {
      const start = new Date(customStartDate);
      const end = new Date(customEndDate);
      filtered = filtered.filter(r => {
        if (!r.class_date) return true;
        const classDate = new Date(r.class_date);
        return classDate >= start && classDate <= end;
      });
    }
    // 'all' = no date filtering
    
    // Module filter
    if (moduleFilter.length > 0) {
      filtered = filtered.filter(r => {
        const weekField = r.week || r.name || '';
        const moduleMatch = weekField.match(/(?:module|mod|week|wk)\s*(\d+)/i) || weekField.match(/^(\d+)/);
        const moduleNum = moduleMatch ? parseInt(moduleMatch[1]) : 0;
        return moduleFilter.includes(moduleNum);
      });
    }
    
    return filtered;
  }, [requisitions, courseFilter, dateRangeFilter, customStartDate, customEndDate, moduleFilter]);

  // Get unique courses from all requisitions for filter options
  const availableCourses = useMemo(() => {
    const courses = new Set();
    requisitions.forEach(r => {
      if (r.course) courses.add(r.course.replace(/\s+/g, '').toUpperCase());
    });
    return Array.from(courses).sort();
  }, [requisitions]);

  // Consolidate ingredients when selection changes
  useEffect(() => {
    const selectedData = requisitions.filter(r => selectedReqs.includes(r.id));
    const itemMap = {};

    selectedData.forEach(req => {
      const ingredients = req.ingredients || [];
      ingredients.forEach(ing => {
        const normalizedName = normalizeIngredientName(ing.name);
        const normalizedUnit = normalizeUnit(ing.unit);
        // Use match key for grouping (alphabetized words catch "butter unsalted" = "unsalted butter")
        const matchKey = createMatchKey(ing.name);
        const key = `${matchKey}|${normalizedUnit}`;

        if (!itemMap[key]) {
          // Estimate if pantry item
          const isPantry = PANTRY_ITEMS.some(p => normalizedName.toLowerCase().includes(p));
          
          // Infer category from ingredient name if not provided
          const category = ing.category || inferCategory(normalizedName);
          
          itemMap[key] = {
            id: key,
            name: normalizedName,  // Display the clean normalized name
            unit: normalizedUnit,
            category: category,
            totalNeeded: 0,
            onHand: isPantry ? 5 : 0,
            onHandEstimated: isPantry,
            vendor: ing.vendor || 'sysco', // Default to Sysco
            packSize: ing.packSize || '',
            unitPrice: ing.unitPrice || 0,
            casePrice: ing.casePrice || 0,
            syscoNumber: ing.syscoNumber || ing.itemNumber || '',
            isPerishable: ing.isPerishable || false,
            sources: [],
            originalNames: [],
          };
        }

        itemMap[key].totalNeeded += parseFloat(ing.quantity) || 0;
        itemMap[key].sources.push(req.course || req.name);
        if (!itemMap[key].originalNames.includes(ing.name)) {
          itemMap[key].originalNames.push(ing.name);
        }
        // Use best available data
        if (ing.packSize && !itemMap[key].packSize) itemMap[key].packSize = ing.packSize;
        if (ing.unitPrice && !itemMap[key].unitPrice) itemMap[key].unitPrice = ing.unitPrice;
        if (ing.casePrice && !itemMap[key].casePrice) itemMap[key].casePrice = ing.casePrice;
        if (ing.syscoNumber && !itemMap[key].syscoNumber) itemMap[key].syscoNumber = ing.syscoNumber;
      });
    });

    // Calculate order quantities
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
    // Don't filter out "have it" items - show them grayed/strikethrough
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

    // Category order for sorting
    const categoryOrder = [
      'Produce', 'Dairy & Eggs', 'Meat & Poultry', 'Seafood', 
      'Baking & Pastry', 'Dry Goods', 'Oils & Vinegars', 
      'Spices & Seasonings', 'Canned & Jarred', 'Condiments & Sauces',
      'Nuts & Seeds', 'Beverages', 'Other'
    ];

    // Sort: by category first, then "have it" items at bottom within each category, then by name
    filtered.sort((a, b) => {
      // First sort by category
      const catA = categoryOrder.indexOf(a.category);
      const catB = categoryOrder.indexOf(b.category);
      if (catA !== catB) return catA - catB;
      
      // Within same category, "Have it" items go to bottom
      if (a.netNeeded === 0 && b.netNeeded > 0) return 1;
      if (a.netNeeded > 0 && b.netNeeded === 0) return -1;
      
      // Then sort by selected field
      let aVal = a[sortField];
      let bVal = b[sortField];
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [orderItems, searchTerm, vendorFilter, sortField, sortDir]);

  // Group items by category for display
  const groupedItems = useMemo(() => {
    const groups = {};
    displayItems.forEach(item => {
      const cat = item.category || 'Other';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    });
    return groups;
  }, [displayItems]);

  // Toggle requisition selection
  const toggleReq = (id) => {
    setSelectedReqs(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Update item vendor
  const updateVendor = (itemId, newVendor) => {
    setOrderItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, vendor: newVendor } : item
    ));
  };

  // Update on-hand quantity
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

  // Update order quantity
  const updateOrderQty = (itemId, delta) => {
    setOrderItems(prev => prev.map(item => {
      if (item.id !== itemId) return item;
      const newQty = Math.max(0, (item.orderQtyOverride ?? item.orderQty) + delta);
      return { ...item, orderQty: newQty, orderQtyOverride: newQty };
    }));
  };

  // Mark as "Have enough"
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

  // Undo "Have It" - reset to recalculate
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

  // Reset order qty to calculated
  const resetOrderQty = (itemId) => {
    setOrderItems(prev => prev.map(item => {
      if (item.id !== itemId) return item;
      const netNeeded = Math.max(0, item.totalNeeded - item.onHand);
      const packQty = parseFloat(item.packSize) || 1;
      const casesNeeded = packQty > 0 ? Math.ceil(netNeeded / packQty) : netNeeded;
      return { ...item, orderQty: casesNeeded, orderQtyOverride: null };
    }));
  };

  // Sort handler
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  // Print order grouped by vendor
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
          .item-number { color: #666; font-size: 11px; }
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
            <td class="item-number">${item.syscoNumber || '-'}</td>
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

      {/* Filters */}
      <div className="bg-white border rounded-lg p-4 mb-4">
        <div className="flex flex-wrap gap-4 items-end">
          {/* Date Range */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Date Range</label>
            <select
              value={dateRangeFilter}
              onChange={(e) => setDateRangeFilter(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Dates</option>
              <option value="next2weeks">Next 2 Weeks</option>
              <option value="thismonth">This Month</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>
          
          {/* Custom Date Range */}
          {dateRangeFilter === 'custom' && (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Start</label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="px-3 py-2 border rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">End</label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="px-3 py-2 border rounded-lg text-sm"
                />
              </div>
            </>
          )}
          
          {/* Course Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Courses</label>
            <div className="flex gap-1 flex-wrap">
              {['CUL130', 'CUL160', 'CUL244', 'CUL260'].map(course => (
                <button
                  key={course}
                  onClick={() => {
                    setCourseFilter(prev => 
                      prev.includes(course) 
                        ? prev.filter(c => c !== course)
                        : [...prev, course]
                    );
                  }}
                  className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                    courseFilter.includes(course)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {course}
                </button>
              ))}
            </div>
          </div>
          
          {/* Quick module select - directly selects requisitions for those modules */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Quick Select</label>
            <div className="flex gap-1">
              <button
                onClick={() => {
                  // Select all requisitions for modules 3 and 4
                  const targetModules = [3, 4];
                  const matchingReqIds = filteredRequisitions.filter(req => {
                    const weekField = req.week || req.name || '';
                    const moduleMatch = weekField.match(/(?:module|mod|week|wk)\s*(\d+)/i) || weekField.match(/^(\d+)/);
                    const moduleNum = moduleMatch ? parseInt(moduleMatch[1]) : 0;
                    return targetModules.includes(moduleNum);
                  }).map(r => r.id);
                  setSelectedReqs(matchingReqIds);
                  setModuleFilter([]); // Clear filter to show all
                }}
                className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200"
              >
                Mod 3-4
              </button>
              <button
                onClick={() => {
                  // Select all requisitions for modules 5 and 6
                  const targetModules = [5, 6];
                  const matchingReqIds = filteredRequisitions.filter(req => {
                    const weekField = req.week || req.name || '';
                    const moduleMatch = weekField.match(/(?:module|mod|week|wk)\s*(\d+)/i) || weekField.match(/^(\d+)/);
                    const moduleNum = moduleMatch ? parseInt(moduleMatch[1]) : 0;
                    return targetModules.includes(moduleNum);
                  }).map(r => r.id);
                  setSelectedReqs(matchingReqIds);
                  setModuleFilter([]);
                }}
                className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200"
              >
                Mod 5-6
              </button>
              <button
                onClick={() => {
                  setSelectedReqs([]);
                  setModuleFilter([]);
                }}
                className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
        
        <div className="mt-2 text-xs text-gray-500">
          Showing {filteredRequisitions.length} of {requisitions.length} requisitions
        </div>
      </div>

      {/* Module Selection */}
      <div className="bg-white border rounded-lg p-4 mb-6">
        <h2 className="font-semibold text-gray-700 mb-4">Select Modules to Order</h2>
        
        {/* Extract unique modules from filtered requisitions */}
        {(() => {
          // Group requisitions by module number (extract from week field)
          const moduleGroups = {};
          filteredRequisitions.forEach(req => {
            // Try to extract module/week number from week field
            const weekField = req.week || req.name || '';
            const moduleMatch = weekField.match(/(?:module|mod|week|wk)\s*(\d+)/i) || weekField.match(/^(\d+)/);
            const moduleNum = moduleMatch ? parseInt(moduleMatch[1]) : 0;
            
            if (!moduleGroups[moduleNum]) {
              moduleGroups[moduleNum] = { reqs: [], courses: new Set() };
            }
            moduleGroups[moduleNum].reqs.push(req);
            moduleGroups[moduleNum].courses.add(req.course);
          });
          
          const moduleNumbers = Object.keys(moduleGroups).map(Number).sort((a, b) => a - b);
          
          // Track which modules are selected
          const getSelectedModules = () => {
            const selected = new Set();
            selectedReqs.forEach(id => {
              const req = filteredRequisitions.find(r => r.id === id);
              if (req) {
                const weekField = req.week || req.name || '';
                const moduleMatch = weekField.match(/(?:module|mod|week|wk)\s*(\d+)/i) || weekField.match(/^(\d+)/);
                const moduleNum = moduleMatch ? parseInt(moduleMatch[1]) : 0;
                selected.add(moduleNum);
              }
            });
            return selected;
          };
          
          const selectedModules = getSelectedModules();
          
          const toggleModule = (moduleNum) => {
            const moduleReqIds = moduleGroups[moduleNum].reqs.map(r => r.id);
            const allSelected = moduleReqIds.every(id => selectedReqs.includes(id));
            
            if (allSelected) {
              // Deselect all in this module
              setSelectedReqs(prev => prev.filter(id => !moduleReqIds.includes(id)));
            } else {
              // Select all in this module
              setSelectedReqs(prev => [...new Set([...prev, ...moduleReqIds])]);
            }
          };
          
          return (
            <>
              <div className="flex flex-wrap gap-3 mb-4">
                {moduleNumbers.map(moduleNum => {
                  const group = moduleGroups[moduleNum];
                  const moduleReqIds = group.reqs.map(r => r.id);
                  const allSelected = moduleReqIds.every(id => selectedReqs.includes(id));
                  const someSelected = moduleReqIds.some(id => selectedReqs.includes(id));
                  const itemCount = group.reqs.reduce((sum, r) => sum + (r.ingredients?.length || 0), 0);
                  
                  return (
                    <button
                      key={moduleNum}
                      onClick={() => toggleModule(moduleNum)}
                      className={`px-4 py-3 rounded-lg border-2 transition-all ${
                        allSelected
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : someSelected
                          ? 'bg-blue-100 border-blue-400 text-blue-800'
                          : 'bg-white border-gray-200 text-gray-700 hover:border-blue-300'
                      }`}
                    >
                      <div className="text-lg font-bold">
                        {moduleNum === 0 ? 'Other' : `Module ${moduleNum}`}
                      </div>
                      <div className={`text-xs ${allSelected ? 'text-blue-100' : 'text-gray-500'}`}>
                        {group.reqs.length} reqs · {itemCount} items
                      </div>
                    </button>
                  );
                })}
              </div>
              
              {/* Summary of what's selected */}
              {selectedReqs.length > 0 && (
                <div className="bg-blue-50 rounded-lg p-3 text-sm">
                  <div className="font-medium text-blue-800 mb-1">
                    {selectedReqs.length} requisitions selected
                  </div>
                  <div className="text-blue-600 text-xs">
                    {(() => {
                      const courseCounts = {};
                      selectedReqs.forEach(id => {
                        const req = filteredRequisitions.find(r => r.id === id);
                        if (req) {
                          courseCounts[req.course] = (courseCounts[req.course] || 0) + 1;
                        }
                      });
                      return Object.entries(courseCounts)
                        .map(([course, count]) => `${course} (${count})`)
                        .join(' · ');
                    })()}
                  </div>
                </div>
              )}
              
              {/* Expand to see details (collapsible) */}
              {selectedReqs.length > 0 && (
                <details className="mt-3">
                  <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700">
                    View selected requisitions
                  </summary>
                  <div className="mt-2 max-h-48 overflow-y-auto border rounded">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-2 py-1 text-left">Course</th>
                          <th className="px-2 py-1 text-left">Week</th>
                          <th className="px-2 py-1 text-left">Date</th>
                          <th className="px-2 py-1 text-center">Items</th>
                          <th className="px-2 py-1"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {filteredRequisitions
                          .filter(r => selectedReqs.includes(r.id))
                          .sort((a, b) => (a.course || '').localeCompare(b.course || ''))
                          .map(req => (
                            <tr key={req.id} className="hover:bg-gray-50">
                              <td className="px-2 py-1 font-medium">{req.course}</td>
                              <td className="px-2 py-1">{req.week || '-'}</td>
                              <td className="px-2 py-1">
                                {req.class_date ? new Date(req.class_date).toLocaleDateString() : '-'}
                              </td>
                              <td className="px-2 py-1 text-center">{(req.ingredients || []).length}</td>
                              <td className="px-2 py-1">
                                <button
                                  onClick={() => toggleReq(req.id)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  ✕
                                </button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </details>
              )}
            </>
          );
        })()}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-4">
        {/* Search */}
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Search items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        {/* Vendor Filter Tabs */}
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
                <th 
                  className="px-4 py-3 text-left font-semibold text-gray-700 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('name')}
                >
                  Item {sortField === 'name' && (sortDir === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="px-4 py-3 text-left font-semibold text-gray-700 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('vendor')}
                >
                  Vendor {sortField === 'vendor' && (sortDir === 'asc' ? '↑' : '↓')}
                </th>
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
                    {orderItems.length === 0 
                      ? 'Select requisitions above to see items'
                      : 'No items match your filters'
                    }
                  </td>
                </tr>
              ) : (
                Object.entries(groupedItems).map(([category, items]) => (
                  <React.Fragment key={category}>
                    {/* Category Header */}
                    <tr className="bg-gray-100">
                      <td colSpan={9} className="px-4 py-2 font-semibold text-gray-700 text-sm">
                        {category} ({items.filter(i => i.netNeeded > 0).length} to order)
                      </td>
                    </tr>
                    {/* Items in this category */}
                    {items.map(item => {
                      const vendorInfo = VENDORS.find(v => v.id === item.vendor) || VENDORS[0];
                      const isCovered = item.netNeeded === 0;
                  return (
                    <tr key={item.id} className={`${isCovered ? 'bg-gray-50 opacity-60' : 'hover:bg-gray-50'}`}>
                      {/* Item Name */}
                      <td className="px-4 py-3">
                        <div className={`font-medium ${isCovered ? 'text-gray-400 line-through' : 'text-gray-900'}`}>{item.name}</div>
                        {item.originalNames.length > 1 && (
                          <div className="text-xs text-purple-600 mt-0.5">
                            [Consolidated from {item.originalNames.length} entries]
                          </div>
                        )}
                        <div className="text-xs text-gray-400 mt-0.5">
                          {item.sources.join(', ')}
                        </div>
                      </td>
                      
                      {/* Vendor Dropdown */}
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
                      
                      {/* Item Number */}
                      <td className={`px-4 py-3 text-xs font-mono ${isCovered ? 'text-gray-300 line-through' : 'text-gray-600'}`}>
                        {item.syscoNumber || '-'}
                      </td>
                      
                      {/* Pack Size */}
                      <td className={`px-4 py-3 ${isCovered ? 'text-gray-300' : 'text-gray-600'}`}>
                        {item.packSize || '-'}
                      </td>
                      
                      {/* Total Needed */}
                      <td className={`px-4 py-3 text-center ${isCovered ? 'text-gray-300 line-through' : 'text-gray-700'}`}>
                        {item.totalNeeded} {item.unit}
                      </td>
                      
                      {/* On Hand */}
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
                        {item.onHandEstimated && !isCovered && (
                          <div className="text-xs text-purple-500 text-center mt-0.5">est.</div>
                        )}
                        {isCovered && (
                          <div className="text-xs text-green-600 text-center mt-0.5">covered</div>
                        )}
                      </td>
                      
                      {/* Net Needed */}
                      <td className={`px-4 py-3 text-center font-medium ${isCovered ? 'text-gray-300' : 'text-gray-900'}`}>
                        {item.netNeeded} {item.unit}
                      </td>
                      
                      {/* Order Qty */}
                      <td className="px-4 py-3">
                        {isCovered ? (
                          <div className="text-center text-gray-300 line-through">0</div>
                        ) : (
                          <>
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
                            {item.orderQtyOverride !== null && (
                              <button
                                onClick={() => resetOrderQty(item.id)}
                                className="text-xs text-blue-500 hover:underline block mx-auto mt-0.5"
                              >
                                reset
                              </button>
                            )}
                          </>
                        )}
                      </td>
                      
                      {/* Actions */}
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
      {displayItems.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-600">
          {VENDORS.map(v => {
            const count = displayItems.filter(i => i.vendor === v.id && i.orderQty > 0).length;
            if (count === 0) return null;
            return (
              <div key={v.id} className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${v.color}`}>{v.name}</span>
                <span>{count} items</span>
                {v.id === 'sysco' && count < 15 && (
                  <span className="text-orange-600 text-xs">(min 15 for free delivery)</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
