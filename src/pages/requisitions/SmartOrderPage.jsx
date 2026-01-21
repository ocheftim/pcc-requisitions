import React, { useState, useEffect, useMemo } from 'react';
import { getRequisitions } from '../../lib/supabase';

// Active courses this semester
const ACTIVE_COURSES = ['CUL130', 'CUL160', 'CUL244', 'CUL260'];

// Terms with date ranges
const TERMS = [
  { id: 'term1', name: 'Term 1', start: '2026-01-13', end: '2026-03-15' },
  { id: 'term2', name: 'Term 2', start: '2026-03-23', end: '2026-05-20' },
];

// Vendor options
const VENDORS = [
  { id: 'sysco', name: 'Sysco', color: 'bg-blue-100 text-blue-800' },
  { id: 'shamrock', name: 'Shamrock', color: 'bg-green-100 text-green-800' },
  { id: 'peddlers', name: "Peddler's Son", color: 'bg-orange-100 text-orange-800' },
  { id: 'costco', name: 'Costco', color: 'bg-red-100 text-red-800' },
  { id: 'local', name: 'Local/Other', color: 'bg-purple-100 text-purple-800' },
];

// Common pantry items
const PANTRY_ITEMS = ['salt', 'pepper', 'sugar', 'flour', 'oil', 'butter', 'garlic'];

// Category inference
const CATEGORY_KEYWORDS = {
  'Produce': ['lettuce', 'tomato', 'onion', 'garlic', 'carrot', 'celery', 'pepper', 'mushroom', 'potato', 'lemon', 'lime', 'orange', 'apple', 'berry', 'fruit', 'vegetable', 'herb', 'basil', 'parsley', 'cilantro', 'thyme', 'rosemary', 'mint', 'dill', 'chive', 'scallion', 'shallot', 'leek', 'spinach', 'kale', 'arugula', 'cabbage', 'broccoli', 'cauliflower', 'asparagus', 'zucchini', 'squash', 'eggplant', 'cucumber', 'avocado', 'ginger'],
  'Dairy & Eggs': ['milk', 'cream', 'butter', 'cheese', 'yogurt', 'egg', 'sour cream', 'half', 'buttermilk', 'ricotta', 'mascarpone', 'mozzarella', 'parmesan', 'cheddar', 'brie', 'feta'],
  'Meat & Poultry': ['beef', 'pork', 'chicken', 'turkey', 'lamb', 'veal', 'duck', 'bacon', 'ham', 'sausage', 'ground', 'steak', 'roast', 'chop', 'tenderloin', 'ribeye', 'sirloin', 'brisket', 'prosciutto', 'pancetta'],
  'Seafood': ['fish', 'salmon', 'tuna', 'shrimp', 'crab', 'lobster', 'scallop', 'mussel', 'clam', 'oyster', 'cod', 'halibut', 'tilapia', 'trout', 'bass', 'snapper', 'squid', 'calamari'],
  'Baking & Pastry': ['flour', 'sugar', 'yeast', 'baking powder', 'baking soda', 'vanilla', 'chocolate', 'cocoa', 'extract', 'gelatin', 'cornstarch', 'confectioner', 'powdered sugar', 'brown sugar', 'molasses', 'honey', 'maple'],
  'Dry Goods': ['rice', 'pasta', 'noodle', 'quinoa', 'couscous', 'barley', 'oat', 'bread', 'crumb', 'tortilla', 'bean', 'lentil'],
  'Oils & Vinegars': ['oil', 'olive', 'vegetable oil', 'canola', 'sesame', 'vinegar', 'balsamic'],
  'Spices & Seasonings': ['salt', 'pepper', 'cumin', 'paprika', 'oregano', 'cinnamon', 'nutmeg', 'clove', 'coriander', 'turmeric', 'curry', 'chili', 'cayenne', 'bay leaf'],
  'Canned & Jarred': ['tomato paste', 'tomato sauce', 'diced tomato', 'canned', 'jarred', 'pickle', 'olive', 'caper'],
  'Condiments & Sauces': ['mustard', 'ketchup', 'mayonnaise', 'soy sauce', 'worcestershire', 'hot sauce', 'sriracha'],
  'Beverages': ['wine', 'beer', 'brandy', 'rum', 'vodka', 'juice', 'stock', 'broth', 'coffee', 'tea'],
};

function inferCategory(ingredientName) {
  const nameLower = ingredientName.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (nameLower.includes(keyword)) return category;
    }
  }
  return 'Other';
}

function createMatchKey(name) {
  if (!name) return '';
  return name.toLowerCase().replace(/[,\-()]/g, ' ').replace(/\s+/g, ' ').trim().split(' ').filter(w => w.length > 0).sort().join(' ');
}

function normalizeIngredientName(name) {
  if (!name) return '';
  return name.toLowerCase().replace(/,\s*/g, ' ').replace(/\s+/g, ' ').trim().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

function normalizeUnit(unit) {
  if (!unit) return '';
  const unitMap = { 'lbs': 'lb', 'pound': 'lb', 'pounds': 'lb', 'ozs': 'oz', 'ounce': 'oz', 'ounces': 'oz', 'dozen': 'doz', 'dz': 'doz', 'each': 'ea', 'gallon': 'gal', 'quart': 'qt', 'bunch': 'bn' };
  const lower = unit.toLowerCase().trim();
  return unitMap[lower] || lower;
}

function formatShortDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return `${days[date.getDay()]} ${date.getMonth() + 1}/${date.getDate()}`;
}

function extractTopic(weekField) {
  if (!weekField) return '';
  const match = weekField.match(/[-–]\s*(.+)$/);
  return match ? match[1].trim() : '';
}

function extractModuleNumber(weekField) {
  if (!weekField) return 0;
  const match = weekField.match(/(?:module|mod|week|wk)\s*(\d+)/i) || weekField.match(/Week\s*(\d+)/i);
  return match ? parseInt(match[1]) : 0;
}

function getTermForDate(dateStr) {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  for (const term of TERMS) {
    const start = new Date(term.start);
    const end = new Date(term.end);
    if (date >= start && date <= end) return term.id;
  }
  return null;
}

export default function SmartOrderPage() {
  const [requisitions, setRequisitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReqs, setSelectedReqs] = useState([]);
  const [orderItems, setOrderItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [vendorFilter, setVendorFilter] = useState('all');
  
  // Filters
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('term1');

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
        
        const active = processed.filter(r => 
          r.status !== 'completed' && r.status !== 'cancelled' && r.ingredients && r.ingredients.length > 0
        );
        
        setRequisitions(active);
      } catch (err) {
        console.error('Error loading requisitions:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Get available courses
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

  // Auto-select first course
  useEffect(() => {
    if (!selectedCourse && availableCourses.length > 0) {
      setSelectedCourse(availableCourses[0]);
    }
  }, [availableCourses, selectedCourse]);

  // Filter requisitions by course and term
  const filteredRequisitions = useMemo(() => {
    if (!selectedCourse) return [];
    return requisitions.filter(r => {
      const courseNormalized = (r.course || '').replace(/\s+/g, '').toUpperCase();
      if (courseNormalized !== selectedCourse) return false;
      
      // Filter by term
      const term = getTermForDate(r.class_date);
      if (selectedTerm && term !== selectedTerm) return false;
      
      return true;
    });
  }, [requisitions, selectedCourse, selectedTerm]);

  // Build module list
  const modules = useMemo(() => {
    const moduleList = [];
    
    filteredRequisitions.forEach(req => {
      const moduleNum = extractModuleNumber(req.week);
      const topic = extractTopic(req.week);
      const dateStr = formatShortDate(req.class_date);
      
      moduleList.push({
        id: req.id,
        moduleNum,
        topic,
        dateStr,
        date: req.class_date ? new Date(req.class_date) : null,
        itemCount: (req.ingredients || []).length,
      });
    });
    
    // Sort by date
    moduleList.sort((a, b) => {
      if (a.date && b.date) return a.date - b.date;
      return a.moduleNum - b.moduleNum;
    });
    
    return moduleList;
  }, [filteredRequisitions]);

  // Consolidate ingredients
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
            category,
            totalNeeded: 0,
            onHand: isPantry ? 5 : 0,
            onHandEstimated: isPantry,
            vendor: ing.vendor || 'sysco',
            packSize: ing.packSize || '',
            unitPrice: ing.unitPrice || 0,
            syscoNumber: ing.syscoNumber || ing.itemNumber || '',
            sources: [],
          };
        }

        itemMap[key].totalNeeded += parseFloat(ing.quantity) || 0;
        itemMap[key].sources.push(req.course || req.name);
        if (ing.packSize && !itemMap[key].packSize) itemMap[key].packSize = ing.packSize;
        if (ing.syscoNumber && !itemMap[key].syscoNumber) itemMap[key].syscoNumber = ing.syscoNumber;
      });
    });

    const items = Object.values(itemMap).map(item => {
      const netNeeded = Math.max(0, item.totalNeeded - item.onHand);
      const packQty = parseFloat(item.packSize) || 1;
      const casesNeeded = packQty > 0 ? Math.ceil(netNeeded / packQty) : netNeeded;
      return { ...item, netNeeded, orderQty: casesNeeded, orderQtyOverride: null };
    });

    setOrderItems(items);
  }, [requisitions, selectedReqs]);

  // Display items
  const displayItems = useMemo(() => {
    let filtered = [...orderItems];
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(item => item.name.toLowerCase().includes(term) || item.syscoNumber?.includes(term));
    }
    
    if (vendorFilter !== 'all') {
      filtered = filtered.filter(item => item.vendor === vendorFilter);
    }

    const categoryOrder = ['Produce', 'Dairy & Eggs', 'Meat & Poultry', 'Seafood', 'Baking & Pastry', 'Dry Goods', 'Oils & Vinegars', 'Spices & Seasonings', 'Canned & Jarred', 'Condiments & Sauces', 'Beverages', 'Other'];

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

  // Toggle module
  const toggleModule = (reqId) => {
    setSelectedReqs(prev => prev.includes(reqId) ? prev.filter(x => x !== reqId) : [...prev, reqId]);
  };

  // Select all modules
  const selectAllModules = () => {
    const allIds = modules.map(m => m.id);
    const allSelected = allIds.every(id => selectedReqs.includes(id));
    setSelectedReqs(allSelected ? [] : allIds);
  };

  // Update functions
  const updateVendor = (itemId, newVendor) => {
    setOrderItems(prev => prev.map(item => item.id === itemId ? { ...item, vendor: newVendor } : item));
  };

  const updateOnHand = (itemId, delta) => {
    setOrderItems(prev => prev.map(item => {
      if (item.id !== itemId) return item;
      const newOnHand = Math.max(0, item.onHand + delta);
      const netNeeded = Math.max(0, item.totalNeeded - newOnHand);
      const packQty = parseFloat(item.packSize) || 1;
      const casesNeeded = packQty > 0 ? Math.ceil(netNeeded / packQty) : netNeeded;
      return { ...item, onHand: newOnHand, onHandEstimated: false, netNeeded, orderQty: item.orderQtyOverride ?? casesNeeded };
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
      return { ...item, onHand: item.totalNeeded, onHandEstimated: false, netNeeded: 0, orderQty: 0, orderQtyOverride: 0 };
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
      return { ...item, onHand, onHandEstimated: isPantry, netNeeded, orderQty: casesNeeded, orderQtyOverride: null };
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
    
    // Get selected module info for header
    const selectedModules = modules.filter(m => selectedReqs.includes(m.id));
    const moduleInfo = selectedModules.map(m => `Mod ${m.moduleNum} (${m.dateStr})`).join(', ');
    
    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Order - ${selectedCourse} - ${new Date().toLocaleDateString()}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { font-size: 18px; margin-bottom: 5px; }
          .meta { color: #666; font-size: 12px; margin-bottom: 15px; }
          h2 { font-size: 14px; color: #333; margin: 15px 0 8px; padding-bottom: 4px; border-bottom: 2px solid #333; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 11px; }
          th, td { border: 1px solid #ccc; padding: 4px 6px; text-align: left; }
          th { background: #f5f5f5; font-weight: bold; }
          .qty { text-align: center; font-weight: bold; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <h1>${selectedCourse} Order</h1>
        <div class="meta">
          <div>${moduleInfo}</div>
          <div>Generated: ${new Date().toLocaleString()}</div>
        </div>
    `;

    Object.entries(grouped).forEach(([vendor, items]) => {
      html += `<h2>${vendorNames[vendor] || vendor} (${items.length} items)</h2>`;
      html += `<table><thead><tr><th>#</th><th>Item</th><th>Item #</th><th>Pack</th><th class="qty">Qty</th><th>Unit</th></tr></thead><tbody>`;
      items.forEach((item, idx) => {
        html += `<tr><td>${idx + 1}</td><td>${item.name}</td><td>${item.syscoNumber || '-'}</td><td>${item.packSize || '-'}</td><td class="qty">${item.orderQty}</td><td>${item.unit}</td></tr>`;
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
    return <div className="p-6"><div className="animate-pulse text-gray-500">Loading orders...</div></div>;
  }

  const itemsToOrder = displayItems.filter(i => i.netNeeded > 0).length;
  const itemsCovered = displayItems.filter(i => i.netNeeded === 0).length;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header Row */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Current Order</h1>
          <p className="text-gray-500 text-sm mt-1">
            {itemsToOrder > 0 ? (
              <>
                <span className="font-semibold text-gray-700">{itemsToOrder} items</span> to order
                {itemsCovered > 0 && <span className="text-green-600"> · {itemsCovered} covered</span>}
                {selectedReqs.length > 0 && <span> · from {selectedReqs.length} modules</span>}
              </>
            ) : (
              'Select modules below to build order'
            )}
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

      {/* Compact Filter Bar */}
      <div className="bg-white border rounded-lg p-3 mb-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Course Dropdown */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-600">Course:</label>
            <select
              value={selectedCourse}
              onChange={(e) => {
                setSelectedCourse(e.target.value);
                setSelectedReqs([]);
              }}
              className="px-3 py-1.5 border rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500"
            >
              {availableCourses.map(course => (
                <option key={course} value={course}>{course}</option>
              ))}
            </select>
          </div>

          {/* Term Dropdown */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-600">Term:</label>
            <select
              value={selectedTerm}
              onChange={(e) => {
                setSelectedTerm(e.target.value);
                setSelectedReqs([]);
              }}
              className="px-3 py-1.5 border rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500"
            >
              {TERMS.map(term => (
                <option key={term.id} value={term.id}>{term.name}</option>
              ))}
            </select>
          </div>

          {/* Divider */}
          <div className="h-6 w-px bg-gray-300" />

          {/* Module Pills */}
          <div className="flex items-center gap-2 flex-wrap flex-1">
            <span className="text-sm font-medium text-gray-600">Modules:</span>
            {modules.map(mod => {
              const isSelected = selectedReqs.includes(mod.id);
              const label = mod.topic 
                ? `${mod.moduleNum} ${mod.topic} ${mod.dateStr}`
                : `${mod.moduleNum} ${mod.dateStr}`;
              return (
                <button
                  key={mod.id}
                  onClick={() => toggleModule(mod.id)}
                  className={`px-2 py-1 rounded text-xs font-medium transition-all whitespace-nowrap ${
                    isSelected
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  title={`${mod.itemCount} items`}
                >
                  {label}
                </button>
              );
            })}
            {modules.length > 0 && (
              <button
                onClick={selectAllModules}
                className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                  modules.every(m => selectedReqs.includes(m.id))
                    ? 'bg-gray-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                All
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Order Table Section */}
      {selectedReqs.length > 0 && (
        <>
          {/* Search and Vendor Filter */}
          <div className="flex flex-wrap gap-3 mb-3">
            <input
              type="text"
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 min-w-[200px] px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setVendorFilter('all')}
                className={`px-2 py-1 rounded text-xs font-medium ${vendorFilter === 'all' ? 'bg-white shadow text-gray-900' : 'text-gray-600'}`}
              >
                All ({vendorCounts.all || 0})
              </button>
              {VENDORS.map(v => (
                <button
                  key={v.id}
                  onClick={() => setVendorFilter(v.id)}
                  className={`px-2 py-1 rounded text-xs font-medium ${vendorFilter === v.id ? 'bg-white shadow text-gray-900' : 'text-gray-600'}`}
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
                    <th className="px-3 py-2 text-left font-semibold text-gray-700">Item</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-700">Vendor</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-700">Item #</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-700">Pack</th>
                    <th className="px-3 py-2 text-center font-semibold text-gray-700">Needed</th>
                    <th className="px-3 py-2 text-center font-semibold text-gray-700">On Hand</th>
                    <th className="px-3 py-2 text-center font-semibold text-gray-700">Net</th>
                    <th className="px-3 py-2 text-center font-semibold text-gray-700">Order</th>
                    <th className="px-3 py-2 text-center font-semibold text-gray-700"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {displayItems.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-8 text-center text-gray-500">No items match your filters</td>
                    </tr>
                  ) : (
                    Object.entries(groupedItems).map(([category, items]) => (
                      <React.Fragment key={category}>
                        <tr className="bg-gray-100">
                          <td colSpan={9} className="px-3 py-1.5 font-semibold text-gray-700 text-xs uppercase tracking-wide">
                            {category} ({items.filter(i => i.netNeeded > 0).length})
                          </td>
                        </tr>
                        {items.map(item => {
                          const vendorInfo = VENDORS.find(v => v.id === item.vendor) || VENDORS[0];
                          const isCovered = item.netNeeded === 0;
                          return (
                            <tr key={item.id} className={isCovered ? 'bg-gray-50 opacity-50' : 'hover:bg-gray-50'}>
                              <td className="px-3 py-2">
                                <span className={isCovered ? 'text-gray-400 line-through' : 'text-gray-900'}>{item.name}</span>
                              </td>
                              <td className="px-3 py-2">
                                <select
                                  value={item.vendor}
                                  onChange={(e) => updateVendor(item.id, e.target.value)}
                                  disabled={isCovered}
                                  className={`px-1.5 py-0.5 rounded text-xs font-medium border-0 ${isCovered ? 'bg-gray-200 text-gray-400' : vendorInfo.color}`}
                                >
                                  {VENDORS.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                                </select>
                              </td>
                              <td className={`px-3 py-2 text-xs font-mono ${isCovered ? 'text-gray-300' : 'text-gray-500'}`}>
                                {item.syscoNumber || '-'}
                              </td>
                              <td className={`px-3 py-2 text-xs ${isCovered ? 'text-gray-300' : 'text-gray-500'}`}>
                                {item.packSize || '-'}
                              </td>
                              <td className={`px-3 py-2 text-center text-xs ${isCovered ? 'text-gray-300' : ''}`}>
                                {item.totalNeeded} {item.unit}
                              </td>
                              <td className="px-3 py-2">
                                <div className="flex items-center justify-center gap-0.5">
                                  <button onClick={() => updateOnHand(item.id, -1)} className="w-5 h-5 rounded bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs">-</button>
                                  <span className={`w-8 text-center text-xs ${item.onHandEstimated ? 'text-purple-600 italic' : ''}`}>{item.onHand}</span>
                                  <button onClick={() => updateOnHand(item.id, 1)} className="w-5 h-5 rounded bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs">+</button>
                                </div>
                              </td>
                              <td className={`px-3 py-2 text-center text-xs font-medium ${isCovered ? 'text-gray-300' : ''}`}>
                                {item.netNeeded} {item.unit}
                              </td>
                              <td className="px-3 py-2">
                                {isCovered ? (
                                  <div className="text-center text-gray-300 text-xs">0</div>
                                ) : (
                                  <div className="flex items-center justify-center gap-0.5">
                                    <button onClick={() => updateOrderQty(item.id, -1)} className="w-5 h-5 rounded bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs">-</button>
                                    <span className={`w-8 text-center text-xs font-bold ${item.orderQtyOverride !== null ? 'text-yellow-600' : 'text-blue-600'}`}>{item.orderQty}</span>
                                    <button onClick={() => updateOrderQty(item.id, 1)} className="w-5 h-5 rounded bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs">+</button>
                                  </div>
                                )}
                              </td>
                              <td className="px-3 py-2 text-center">
                                {isCovered ? (
                                  <button onClick={() => undoHaveIt(item.id)} className="px-1.5 py-0.5 rounded text-xs bg-gray-200 text-gray-500 hover:bg-gray-300">Undo</button>
                                ) : (
                                  <button onClick={() => markAsHave(item.id)} className="px-1.5 py-0.5 rounded text-xs bg-green-100 text-green-700 hover:bg-green-200">Have</button>
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

          {/* Vendor Summary */}
          <div className="mt-3 flex flex-wrap gap-3 text-xs text-gray-600">
            {VENDORS.map(v => {
              const count = displayItems.filter(i => i.vendor === v.id && i.orderQty > 0).length;
              if (count === 0) return null;
              return (
                <div key={v.id} className="flex items-center gap-1">
                  <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${v.color}`}>{v.name}</span>
                  <span>{count} items</span>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Empty state */}
      {selectedReqs.length === 0 && (
        <div className="bg-white border rounded-lg p-12 text-center text-gray-500">
          <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-lg font-medium text-gray-700 mb-1">Select modules to build your order</p>
          <p className="text-sm">Click the module pills above to add items</p>
        </div>
      )}
    </div>
  );
}
