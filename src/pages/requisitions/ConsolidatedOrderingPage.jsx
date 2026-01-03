import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase';

const ArchiveIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
  </svg>
);

const PrintIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
  </svg>
);

const SaveIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
  </svg>
);

const DeleteIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const CartIcon = () => (
  <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

// ===========================================
// EP → AP CONVERSION UTILITIES
// ===========================================

// Parse pack_size string to extract case info
// Formats: "6/30OZ", "15LB", "24ea", "6/#10", "750ML", "2/5LB"
const parsePackSize = (packSize) => {
  if (!packSize) return null;
  
  const normalized = packSize.toUpperCase().trim();
  
  // Format: "6/30OZ" or "6/30 OZ" (count/size unit)
  let match = normalized.match(/^(\d+)\/(\d+\.?\d*)\s*(OZ|LB|GAL|QT|PT|ML|L|CT|EA)?$/);
  if (match) {
    return {
      unitsPerCase: parseFloat(match[1]),
      unitSize: parseFloat(match[2]),
      unitType: match[3] || 'EA',
      totalVolume: parseFloat(match[1]) * parseFloat(match[2]),
      format: 'multi'
    };
  }
  
  // Format: "6/#10" (#10 cans)
  match = normalized.match(/^(\d+)\/#(\d+)$/);
  if (match) {
    // #10 can ≈ 96 oz, #5 can ≈ 56 oz
    const canSizes = { '10': 96, '5': 56, '2': 20, '1': 10 };
    const canOz = canSizes[match[2]] || 96;
    return {
      unitsPerCase: parseFloat(match[1]),
      unitSize: canOz,
      unitType: 'OZ',
      totalVolume: parseFloat(match[1]) * canOz,
      format: 'cans'
    };
  }
  
  // Format: "15LB" or "750ML" (single unit case)
  match = normalized.match(/^(\d+\.?\d*)\s*(OZ|LB|GAL|QT|PT|ML|L|CT|EA|PK)$/);
  if (match) {
    return {
      unitsPerCase: 1,
      unitSize: parseFloat(match[1]),
      unitType: match[2],
      totalVolume: parseFloat(match[1]),
      format: 'single'
    };
  }
  
  // Format: "24ea" or "200ea" (count only)
  match = normalized.match(/^(\d+)\s*(EA|CT|PK)$/);
  if (match) {
    return {
      unitsPerCase: parseFloat(match[1]),
      unitSize: 1,
      unitType: 'EA',
      totalVolume: parseFloat(match[1]),
      format: 'count'
    };
  }
  
  return null;
};

// Convert units to a common base (oz for weight/volume, ea for count)
const convertToBase = (qty, unit) => {
  const u = (unit || '').toLowerCase().trim();
  
  // Weight conversions (to oz)
  if (u === 'lb' || u === 'lbs') return { value: qty * 16, baseUnit: 'oz' };
  if (u === 'oz') return { value: qty, baseUnit: 'oz' };
  if (u === 'g') return { value: qty * 0.035274, baseUnit: 'oz' };
  if (u === 'kg') return { value: qty * 35.274, baseUnit: 'oz' };
  
  // Volume conversions (to fl oz)
  if (u === 'gal' || u === 'gallon') return { value: qty * 128, baseUnit: 'floz' };
  if (u === 'qt' || u === 'quart') return { value: qty * 32, baseUnit: 'floz' };
  if (u === 'pt' || u === 'pint') return { value: qty * 16, baseUnit: 'floz' };
  if (u === 'cup' || u === 'cups' || u === 'c') return { value: qty * 8, baseUnit: 'floz' };
  if (u === 'fl oz' || u === 'floz') return { value: qty, baseUnit: 'floz' };
  if (u === 'tbsp') return { value: qty * 0.5, baseUnit: 'floz' };
  if (u === 'tsp') return { value: qty * 0.167, baseUnit: 'floz' };
  if (u === 'ml') return { value: qty * 0.033814, baseUnit: 'floz' };
  if (u === 'l' || u === 'liter') return { value: qty * 33.814, baseUnit: 'floz' };
  
  // Count (already in base)
  if (u === 'ea' || u === 'each' || u === 'ct' || u === 'pk' || u === 'dz' || u === 'dozen') {
    const multiplier = (u === 'dz' || u === 'dozen') ? 12 : 1;
    return { value: qty * multiplier, baseUnit: 'ea' };
  }
  
  // Default: treat as count
  return { value: qty, baseUnit: 'ea' };
};

// Get AP case quantity needed for EP requirement
const calculateAPOrder = (epQty, epUnit, packSize) => {
  const parsed = parsePackSize(packSize);
  if (!parsed) {
    return { 
      casesNeeded: null, 
      apUnit: 'case',
      caseSize: packSize || 'N/A',
      epConverted: epQty
    };
  }
  
  // Convert EP quantity to base unit
  const epBase = convertToBase(epQty, epUnit);
  
  // Convert case total to base unit
  const caseBase = convertToBase(parsed.totalVolume, parsed.unitType);
  
  // If units are compatible (both weight or both volume or both count)
  if (epBase.baseUnit === caseBase.baseUnit || 
      (epBase.baseUnit === 'oz' && caseBase.baseUnit === 'oz') ||
      (epBase.baseUnit === 'floz' && caseBase.baseUnit === 'floz') ||
      (epBase.baseUnit === 'ea' && caseBase.baseUnit === 'ea')) {
    
    const casesNeeded = Math.ceil(epBase.value / caseBase.value);
    return {
      casesNeeded,
      apUnit: 'case',
      caseSize: packSize,
      epConverted: epBase.value,
      caseVolume: caseBase.value
    };
  }
  
  // Units not compatible - just return EP qty and flag it
  return {
    casesNeeded: null,
    apUnit: epUnit,
    caseSize: packSize,
    epConverted: epQty,
    incompatible: true
  };
};

// ===========================================
// END EP → AP CONVERSION UTILITIES
// ===========================================

// Categories that are perishable (short shelf life)
const PERISHABLE_CATEGORIES = ['Produce', 'Dairy & Eggs', 'Meat & Seafood', 'Bakery & Bread'];
const NON_PERISHABLE_CATEGORIES = ['Pantry', 'Beverages', 'Wine & Spirits', 'Production Items', 'Frozen Foods'];

// Items that should be flagged for grocery store purchase
const isGroceryStoreItem = (item, ingredient) => {
  // Only flag Produce items (especially fresh herbs)
  if (ingredient?.category !== 'Produce') return false;
  
  // Parse pack size to get case quantity
  const packSize = ingredient?.pack_size || '';
  const match = packSize.match(/^(\d+)\/(\d+\.?\d*)\s*(LB|OZ|CT|EA|GAL)?$/i) || packSize.match(/^(\d+\.?\d*)\s*(LB|OZ|CT|EA|GAL)?$/i);
  
  if (!match) return true; // No pack size info, flag it
  
  let caseQty;
  if (match[3] || (match[2] && isNaN(match[2]))) {
    // Format: 1/16OZ or 30CT
    const count = parseFloat(match[1]) || 1;
    const size = parseFloat(match[2]) || 1;
    const unit = (match[3] || match[2] || '').toUpperCase();
    
    if (unit === 'OZ') caseQty = (count * size) / 16; // Convert to lbs
    else if (unit === 'LB') caseQty = count * size;
    else caseQty = count * size; // CT, EA
  } else {
    caseQty = parseFloat(match[1]) || 1;
  }
  
  // Flag if quantity needed is less than 25% of case
  const qtyNeeded = item.quantity || 0;
  return qtyNeeded < (caseQty * 0.25);
};

// Get week range for a date
const getWeekRange = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday start
  const monday = new Date(d.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { start: monday, end: sunday };
};

// Format date for week display
const formatWeekLabel = (date) => {
  const { start, end } = getWeekRange(date);
  const opts = { month: 'short', day: 'numeric' };
  return `${start.toLocaleDateString('en-US', opts)} - ${end.toLocaleDateString('en-US', opts)}`;
};

export default function ConsolidatedOrderingPage() {
  const [requisitions, setRequisitions] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [consolidatedOrders, setConsolidatedOrders] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedVendor, setSelectedVendor] = useState('all');
  const [viewMode, setViewMode] = useState('current');
  const [archivedOrders, setArchivedOrders] = useState([]);
  const [selectedArchive, setSelectedArchive] = useState(null);
  
  // New filter states
  const [filterWeek, setFilterWeek] = useState('next'); // Default to NEXT week
  const [filterInstructor, setFilterInstructor] = useState('all');
  const [filterCourse, setFilterCourse] = useState('all');
  const [filterItemType, setFilterItemType] = useState('all'); // all, perishable, non-perishable
  const [showGroceryOnly, setShowGroceryOnly] = useState(false);
  const [inventory, setInventory] = useState({}); // Track on-hand inventory from Supabase
  const [savingInventory, setSavingInventory] = useState(false);
  const [onHandMode, setOnHandMode] = useState(false); // Simplified On-Hand entry mode

  // Load inventory from Supabase
  const loadInventory = async () => {
    try {
      const { data, error } = await supabase
        .from('inventory_current')
        .select('ingredient_name, quantity, unit, last_counted');
      
      if (error) throw error;
      
      const invMap = {};
      (data || []).forEach(item => {
        invMap[item.ingredient_name] = {
          quantity: item.quantity,
          unit: item.unit,
          lastCounted: item.last_counted
        };
      });
      setInventory(invMap);
    } catch (error) {
      console.error('Error loading inventory:', error);
    }
  };

  // Save on-hand value to Supabase
  const updateOnHand = async (vendor, itemName, value, unit) => {
    const qty = value === '' ? null : parseFloat(value) || 0;
    
    // Update local state immediately for responsiveness
    setInventory(prev => ({
      ...prev,
      [itemName]: { quantity: qty, unit, lastCounted: new Date().toISOString() }
    }));

    // Save to Supabase
    setSavingInventory(true);
    try {
      const { data: existing } = await supabase
        .from('inventory_current')
        .select('id')
        .eq('ingredient_name', itemName)
        .single();

      if (existing) {
        // Update existing record
        await supabase
          .from('inventory_current')
          .update({ 
            quantity: qty, 
            unit,
            last_counted: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('ingredient_name', itemName);
      } else {
        // Insert new record
        await supabase
          .from('inventory_current')
          .insert({ 
            ingredient_name: itemName,
            quantity: qty,
            unit,
            last_counted: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
      }
    } catch (error) {
      console.error('Error saving inventory:', error);
    }
    setSavingInventory(false);
  };

  // Get on-hand value for an item
  const getOnHand = (vendor, itemName) => {
    const inv = inventory[itemName];
    if (!inv || inv.quantity === null) return '';
    return inv.quantity;
  };

  // Calculate order quantity (need - on hand, minimum 0)
  const getOrderQty = (vendor, itemName, need) => {
    const onHand = getOnHand(vendor, itemName);
    if (onHand === '') return need; // If no on-hand entered, order full amount
    return Math.max(0, need - onHand);
  };

  // Clear all inventory counts
  const clearAllOnHand = async () => {
    if (!window.confirm('Clear all on-hand counts? This will reset inventory to uncounted.')) return;
    
    setSavingInventory(true);
    try {
      await supabase
        .from('inventory_current')
        .update({ quantity: null, last_counted: null })
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Update all rows
      
      setInventory({});
    } catch (error) {
      console.error('Error clearing inventory:', error);
    }
    setSavingInventory(false);
  };

  useEffect(() => { loadData(); loadArchivedOrders(); loadInventory(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: reqs } = await supabase.from('requisitions').select('*').order('created_at', { ascending: false });
      const { data: ings } = await supabase.from('ingredients').select('*');
      setRequisitions(reqs || []);
      setIngredients(ings || []);
    } catch (error) { console.error('Error loading data:', error); }
    setLoading(false);
  };

  const loadArchivedOrders = () => {
    const archived = localStorage.getItem('toqueworks_consolidated_archive');
    if (archived) setArchivedOrders(JSON.parse(archived));
  };

  // Extract unique values for filters


  // Session start dates for 2026
  const SESSION_1_START = new Date("2026-01-12"); // Monday of week containing Jan 15
  const SESSION_2_START = new Date("2026-03-23");

  // Get week number based on semester start
  const getWeekNumber = (classDate) => {
    const { start } = getWeekRange(classDate);
    if (start >= SESSION_2_START) {
      const diff = Math.round((start - SESSION_2_START) / (7 * 24 * 60 * 60 * 1000));
      return { session: 2, week: diff + 1 };
    } else {
      const diff = Math.round((start - SESSION_1_START) / (7 * 24 * 60 * 60 * 1000));
      return { session: 1, week: diff + 1 };
    }
  };

  // Extract unique values for filters
  const filterOptions = useMemo(() => {
    const weekMap = new Map();
    const instructors = new Set();
    const courses = new Set();
    
    requisitions.forEach(req => {
      if (req.class_date) {
        const { session, week } = getWeekNumber(req.class_date);
        const { start, end } = getWeekRange(req.class_date);
        const key = start.toISOString().split("T")[0];
        if (!weekMap.has(key)) {
          const opts = { month: "short", day: "numeric" };
          const label = "Week " + week + ": " + start.toLocaleDateString("en-US", opts) + " - " + end.toLocaleDateString("en-US", opts);
          weekMap.set(key, { key, label, start, week, session });
        }
      }
      if (req.instructor) instructors.add(req.instructor);
      if (req.course) courses.add(req.course);
    });
    
    const sortedWeeks = Array.from(weekMap.values()).filter(w => w.week > 0).sort((a, b) => a.start - b.start);
    
    return {
      weeks: sortedWeeks,
      instructors: Array.from(instructors).sort(),
      courses: Array.from(courses).sort()
    };
  }, [requisitions]);



  // Filter requisitions based on selected filters
  const filteredRequisitions = useMemo(() => {
    return requisitions.filter(req => {
      // Week filter
      if (filterWeek !== "all" && req.class_date) {
        const { start } = getWeekRange(req.class_date);
        const reqWeekKey = start.toISOString().split("T")[0];
        
        // Handle "next" week filter - calculate next Monday
        if (filterWeek === "next") {
          const today = new Date();
          const dayOfWeek = today.getDay();
          const daysUntilNextMonday = dayOfWeek === 0 ? 1 : (8 - dayOfWeek);
          const nextMonday = new Date(today);
          nextMonday.setDate(today.getDate() + daysUntilNextMonday);
          nextMonday.setHours(0, 0, 0, 0);
          const nextMondayKey = nextMonday.toISOString().split("T")[0];
          if (reqWeekKey !== nextMondayKey) return false;
        } else {
          if (reqWeekKey !== filterWeek) return false;
        }
      }
      
      // Instructor filter
      if (filterInstructor !== 'all' && req.instructor !== filterInstructor) return false;
      
      // Course filter
      if (filterCourse !== 'all' && req.course !== filterCourse) return false;
      
      return true;
    });
  }, [requisitions, filterWeek, filterInstructor, filterCourse]);

  // Build ingredient map
  const ingMap = useMemo(() => {
    const map = {};
    ingredients.forEach(ing => { map[ing.name?.toLowerCase()] = ing; });
    return map;
  }, [ingredients]);

  // Consolidate filtered requisitions
  const consolidateByVendor = useMemo(() => {
    const vendorMap = {};
    
    filteredRequisitions.forEach(req => {
      if (!req.items) return;
      const items = typeof req.items === 'string' ? JSON.parse(req.items) : req.items;
      
      items.forEach(item => {
        const ing = ingMap[item.name?.toLowerCase()] || {};
        const category = ing.category || 'Unknown';
        
        // Item type filter
        if (filterItemType === 'perishable' && !PERISHABLE_CATEGORIES.includes(category)) return;
        if (filterItemType === 'non-perishable' && !NON_PERISHABLE_CATEGORIES.includes(category)) return;
        
        const vendor = ing.vendor || 'Unassigned';
        if (!vendorMap[vendor]) vendorMap[vendor] = { items: {}, requisitions: new Set() };
        
        const key = item.name + '-' + (item.unit || ing.unit || 'ea');
        if (!vendorMap[vendor].items[key]) {
          vendorMap[vendor].items[key] = {
            name: item.name,
            unit: item.unit || ing.unit || 'ea',
            quantity: 0,
            itemNumber: ing.vendor_code || '',
            caseSize: ing.pack_size || '',
            casePrice: ing.case_price || 0,
            unitPrice: ing.unit_price || 0,
            category: category,
            subcategory: ing.subcategory || '',
            sources: [],
            isGrocery: false
          };
        }
        vendorMap[vendor].items[key].quantity += parseFloat(item.quantity) || 0;
        vendorMap[vendor].items[key].sources.push({
          reqId: req.id,
          course: req.course,
          instructor: req.instructor,
          date: req.class_date,
          quantity: item.quantity
        });
        vendorMap[vendor].requisitions.add(req.id);
      });
    });
    
    // Calculate grocery flag and totals
    Object.keys(vendorMap).forEach(vendor => {
      vendorMap[vendor].requisitions = Array.from(vendorMap[vendor].requisitions);
      vendorMap[vendor].itemsList = Object.values(vendorMap[vendor].items).map(item => {
        const ing = ingMap[item.name?.toLowerCase()] || {};
        item.isGrocery = isGroceryStoreItem(item, ing);
        return item;
      });
      
      // Apply grocery filter
      if (showGroceryOnly) {
        vendorMap[vendor].itemsList = vendorMap[vendor].itemsList.filter(item => item.isGrocery);
      }
      
      vendorMap[vendor].totalItems = vendorMap[vendor].itemsList.length;
      vendorMap[vendor].totalValue = vendorMap[vendor].itemsList.reduce((sum, item) => {
        // Estimate cost based on unit price * quantity
        const cost = (item.unitPrice || 0) * (item.quantity || 0);
        return sum + cost;
      }, 0);
      vendorMap[vendor].groceryCount = vendorMap[vendor].itemsList.filter(i => i.isGrocery).length;
    });
    
    // Remove empty vendors
    Object.keys(vendorMap).forEach(vendor => {
      if (vendorMap[vendor].totalItems === 0) delete vendorMap[vendor];
    });
    
    return vendorMap;
  }, [filteredRequisitions, ingMap, filterItemType, showGroceryOnly]);

  // Consolidate items by Category for On-Hand mode
  const consolidateByCategory = useMemo(() => {
    const categoryMap = {};
    
    // Flatten all items from all vendors
    Object.values(consolidateByVendor).forEach(vendorData => {
      vendorData.itemsList.forEach(item => {
        const category = item.category || 'Other';
        if (!categoryMap[category]) {
          categoryMap[category] = { items: [], totalItems: 0 };
        }
        
        // Check if item already exists in this category
        const existing = categoryMap[category].items.find(i => i.name === item.name);
        if (existing) {
          existing.quantity += item.quantity;
        } else {
          categoryMap[category].items.push({ ...item });
        }
      });
    });
    
    // Sort items within each category and calculate totals
    Object.keys(categoryMap).forEach(cat => {
      categoryMap[cat].items.sort((a, b) => a.name.localeCompare(b.name));
      categoryMap[cat].totalItems = categoryMap[cat].items.length;
    });
    
    return categoryMap;
  }, [consolidateByVendor]);

  // Define category order for On-Hand mode (matches storage locations)
  const categoryOrder = ['Produce', 'Dairy & Eggs', 'Meat & Seafood', 'Bakery & Bread', 'Frozen', 'Pantry', 'Beverages', 'Wine & Spirits', 'Other'];

  const saveToArchive = () => {
    const archiveEntry = {
      id: Date.now(),
      date: new Date().toISOString(),
      orders: consolidateByVendor,
      filters: { week: filterWeek, instructor: filterInstructor, course: filterCourse, itemType: filterItemType },
      requisitionIds: filteredRequisitions.map(r => r.id),
      summary: {
        vendors: Object.keys(consolidateByVendor).length,
        totalItems: Object.values(consolidateByVendor).reduce((sum, v) => sum + v.totalItems, 0),
        totalValue: Object.values(consolidateByVendor).reduce((sum, v) => sum + v.totalValue, 0)
      }
    };
    const updated = [archiveEntry, ...archivedOrders];
    localStorage.setItem('toqueworks_consolidated_archive', JSON.stringify(updated));
    setArchivedOrders(updated);
    alert('Order saved to archive!');
  };

  const deleteArchiveEntry = (id) => {
    if (!window.confirm('Delete this archived order?')) return;
    const updated = archivedOrders.filter(a => a.id !== id);
    localStorage.setItem('toqueworks_consolidated_archive', JSON.stringify(updated));
    setArchivedOrders(updated);
    if (selectedArchive?.id === id) setSelectedArchive(null);
  };

  const printOrder = (vendor, items) => {
    const printWindow = window.open('', '_blank');
    const date = new Date().toLocaleDateString();
    const filterInfo = [
      filterWeek !== 'all' ? `Week: ${filterWeek}` : '',
      filterInstructor !== 'all' ? `Instructor: ${filterInstructor}` : '',
      filterCourse !== 'all' ? `Course: ${filterCourse}` : '',
      filterItemType !== 'all' ? `Type: ${filterItemType}` : ''
    ].filter(Boolean).join(' | ');
    
    // Calculate AP order quantities and filter to items that need ordering
    const itemsToOrder = items.map(item => {
      const apCalc = calculateAPOrder(item.quantity, item.unit, item.caseSize);
      // Minimum 1 case even if EP need is tiny
      const casesNeeded = Math.max(1, apCalc.casesNeeded || Math.ceil(item.quantity));
      const onHand = getOnHand(vendor, item.name);
      const hasOnHand = onHand !== '';
      const orderCases = hasOnHand ? Math.max(0, casesNeeded - onHand) : casesNeeded;
      const casePrice = item.casePrice || item.unitPrice || 0;
      
      return {
        ...item,
        casesNeeded,
        onHand: hasOnHand ? onHand : '-',
        orderCases,
        estCost: orderCases * casePrice
      };
    }).filter(item => item.orderCases > 0);
    
    printWindow.document.write(`
      <html>
      <head>
        <title>Order - ${vendor}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #1e40af; border-bottom: 2px solid #1e40af; padding-bottom: 10px; }
          .filters { color: #666; font-size: 12px; margin-bottom: 10px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background: #f3f4f6; }
          .grocery { background: #fef3c7; }
          .grocery-label { color: #92400e; font-size: 11px; }
          .total { margin-top: 20px; text-align: right; font-weight: bold; font-size: 18px; }
          .order-col { background: #eff6ff; font-weight: bold; }
          .ep-need { color: #666; font-size: 12px; }
          @media print { button { display: none; } }
        </style>
      </head>
      <body>
        <h1>${vendor} Order</h1>
        <div>Date: ${date}</div>
        ${filterInfo ? `<div class="filters">${filterInfo}</div>` : ''}
        <table>
          <thead>
            <tr>
              <th>Item #</th>
              <th>Item Name</th>
              <th>EP Need</th>
              <th>Case/Pack</th>
              <th>On Hand</th>
              <th class="order-col">Order (Cases)</th>
              <th>Est. Cost</th>
            </tr>
          </thead>
          <tbody>
            ${itemsToOrder.map(item => `
              <tr class="${item.isGrocery ? 'grocery' : ''}">
                <td>${item.itemNumber || '-'}</td>
                <td>
                  ${item.name}
                  ${item.isGrocery ? '<br><span class="grocery-label">🛒 Consider grocery store</span>' : ''}
                </td>
                <td class="ep-need">${item.quantity} ${item.unit}</td>
                <td>${item.caseSize || '-'}<br><span class="ep-need">= ${item.casesNeeded} case${item.casesNeeded !== 1 ? 's' : ''}</span></td>
                <td>${item.onHand}</td>
                <td class="order-col">${item.orderCases}</td>
                <td>$${item.estCost.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="total">Total: $${itemsToOrder.reduce((sum, i) => sum + i.estCost, 0).toFixed(2)}</div>
        <button onclick="window.print()" style="margin-top:20px;padding:10px 20px">Print</button>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const clearFilters = () => {
    setFilterWeek('all');
    setFilterInstructor('all');
    setFilterCourse('all');
    setFilterItemType('all');
    setShowGroceryOnly(false);
    setSelectedVendor('all');
  };

  const vendors = Object.keys(consolidateByVendor).sort();
  const displayOrders = selectedArchive ? selectedArchive.orders : consolidateByVendor;
  const displayVendors = Object.keys(displayOrders).sort();
  
  const hasActiveFilters = filterWeek !== 'all' || filterInstructor !== 'all' || filterCourse !== 'all' || filterItemType !== 'all' || showGroceryOnly;

  if (loading) return <div className="p-6 flex items-center justify-center"><div className="text-gray-500">Loading orders...</div></div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-blue-800">Consolidated Orders</h1>
            <p className="text-gray-600">
              {viewMode === 'current' 
                ? `${filteredRequisitions.length} requisitions → ${vendors.length} vendors`
                : `${archivedOrders.length} archived orders`}
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => { setViewMode('current'); setSelectedArchive(null); setOnHandMode(false); }} className={`px-4 py-2 rounded font-medium transition-colors ${viewMode === 'current' && !onHandMode ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Orders</button>
            <button onClick={() => { setViewMode('current'); setSelectedArchive(null); setOnHandMode(true); }} className={`px-4 py-2 rounded font-medium transition-colors ${onHandMode ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>📋 On-Hand</button>
            <button onClick={() => { setViewMode('archive'); setOnHandMode(false); }} className={`px-4 py-2 rounded font-medium transition-colors flex items-center gap-2 ${viewMode === 'archive' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}><ArchiveIcon />Archive ({archivedOrders.length})</button>
          </div>
        </div>

        {/* Filters Section */}
        {viewMode === 'current' && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
            <div className="flex flex-wrap gap-3 items-center">
              <label className="text-sm font-medium text-gray-600">Filters:</label>
              
              {/* Week Filter */}
              <select value={filterWeek} onChange={(e) => setFilterWeek(e.target.value)} className="px-3 py-2 border rounded-lg text-sm font-medium">
                <option value="next">📅 Next Week</option>
                <option value="all">All Weeks</option>
                {filterOptions.weeks.map(w => <option key={w.key} value={w.key}>{w.label}</option>)}
              </select>
              
              {/* Instructor Filter */}
              <select value={filterInstructor} onChange={(e) => setFilterInstructor(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
                <option value="all">All Instructors</option>
                {filterOptions.instructors.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
              
              {/* Course Filter */}
              <select value={filterCourse} onChange={(e) => setFilterCourse(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
                <option value="all">All Courses</option>
                {filterOptions.courses.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              
              {/* Item Type Filter */}
              <select value={filterItemType} onChange={(e) => setFilterItemType(e.target.value)} className={`px-3 py-2 border rounded-lg text-sm ${filterItemType !== 'all' ? 'bg-blue-50 border-blue-300' : ''}`}>
                <option value="all">All Items</option>
                <option value="perishable">🥬 Perishables Only</option>
                <option value="non-perishable">📦 Non-Perishables Only</option>
              </select>
              
              {/* Vendor Filter */}
              <select value={selectedVendor} onChange={(e) => setSelectedVendor(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
                <option value="all">All Vendors ({vendors.length})</option>
                {vendors.map(v => <option key={v} value={v}>{v} ({consolidateByVendor[v]?.totalItems})</option>)}
              </select>
              
              {/* Grocery Only Toggle */}
              <label className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm cursor-pointer ${showGroceryOnly ? 'bg-amber-50 border-amber-300' : 'bg-white'}`}>
                <input type="checkbox" checked={showGroceryOnly} onChange={(e) => setShowGroceryOnly(e.target.checked)} />
                <CartIcon /> Grocery Only
              </label>
              
              {hasActiveFilters && (
                <button onClick={clearFilters} className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-lg">
                  ✕ Clear
                </button>
              )}
            </div>
            
            {/* Inventory Check Summary */}
            {Object.keys(inventory).filter(k => inventory[k]?.quantity !== null).length > 0 && (
              <div className="flex justify-between items-center mt-3 pt-3 border-t border-dashed border-blue-200 bg-blue-50 -mx-4 px-4 py-2">
                <div className="text-sm text-blue-700">
                  <span className="font-medium">📋 Inventory Check:</span> {Object.keys(inventory).filter(k => inventory[k]?.quantity !== null).length} items counted
                  {savingInventory && <span className="ml-2 text-blue-500">(saving...)</span>}
                </div>
                <button 
                  onClick={clearAllOnHand} 
                  disabled={savingInventory}
                  className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-100 rounded border border-blue-300 disabled:opacity-50"
                >
                  Clear All On Hand
                </button>
              </div>
            )}
            
            {/* Filter Summary & Actions */}
            <div className="flex justify-between items-center mt-3 pt-3 border-t">
              <div className="text-sm text-gray-600">
                {hasActiveFilters && (
                  <span className="text-blue-600 font-medium">
                    Filtered: {filteredRequisitions.length} of {requisitions.length} requisitions
                  </span>
                )}
              </div>
              <button onClick={saveToArchive} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm">
                <SaveIcon />Save to Archive
              </button>
            </div>
          </div>
        )}

        {/* Archive List */}
        {viewMode === 'archive' && !selectedArchive && (
          <div>
            {archivedOrders.length === 0 ? (
              <div className="text-center py-12 text-gray-500"><p className="mt-2">No archived orders yet</p></div>
            ) : (
              <div className="space-y-3">
                {archivedOrders.map(archive => (
                  <div key={archive.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border hover:border-blue-300">
                    <div className="flex-1 cursor-pointer" onClick={() => setSelectedArchive(archive)}>
                      <div className="font-medium text-gray-800">
                        {new Date(archive.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {archive.summary.vendors} vendors • {archive.summary.totalItems} items • ${archive.summary.totalValue.toFixed(2)} est.
                        {archive.filters && (archive.filters.week !== 'all' || archive.filters.course !== 'all') && (
                          <span className="ml-2 text-blue-600">
                            {[
                              archive.filters.week !== 'all' ? archive.filters.week : '',
                              archive.filters.course !== 'all' ? archive.filters.course : ''
                            ].filter(Boolean).join(' • ')}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setSelectedArchive(archive)} className="px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded text-sm font-medium">View</button>
                      <button onClick={() => deleteArchiveEntry(archive.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"><DeleteIcon /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Archive Viewing Banner */}
        {selectedArchive && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between">
            <div>
              <span className="text-amber-800 font-medium">Viewing Archived Order:</span>
              <span className="ml-2 text-amber-700">
                {new Date(selectedArchive.date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
              </span>
            </div>
            <button onClick={() => setSelectedArchive(null)} className="text-amber-700 hover:text-amber-900 font-medium">← Back to Archive</button>
          </div>
        )}

        {/* Orders Display */}
        {(viewMode === 'current' || selectedArchive) && !onHandMode && (
          <>
            {displayVendors.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p>No items match the current filters</p>
                {hasActiveFilters && (
                  <button onClick={clearFilters} className="mt-2 text-blue-600 hover:underline">Clear filters</button>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {displayVendors.filter(v => selectedVendor === 'all' || v === selectedVendor).map(vendor => {
                  const data = displayOrders[vendor];
                  if (!data || data.totalItems === 0) return null;
                  
                  return (
                    <div key={vendor} className="border rounded-lg overflow-hidden">
                      <div className="bg-gray-100 px-4 py-3 flex justify-between items-center">
                        <div>
                          <h2 className="text-lg font-semibold text-gray-800">{vendor}</h2>
                          <p className="text-sm text-gray-600">
                            {data.totalItems} items • Est. ${data.totalValue.toFixed(2)}
                            {data.groceryCount > 0 && (
                              <span className="ml-2 text-amber-600">
                                <CartIcon /> {data.groceryCount} grocery
                              </span>
                            )}
                          </p>
                        </div>
                        <button onClick={() => printOrder(vendor, data.itemsList)} className="flex items-center gap-2 px-3 py-1.5 bg-white border rounded hover:bg-gray-50 text-sm font-medium">
                          <PrintIcon />Print
                        </button>
                      </div>
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-50 border-b">
                            <th className="text-left px-4 py-2 font-medium text-gray-600">Item #</th>
                            <th className="text-left px-4 py-2 font-medium text-gray-600">Item Name</th>
                            <th className="text-left px-4 py-2 font-medium text-gray-600">EP Need</th>
                            <th className="text-left px-4 py-2 font-medium text-gray-600">Case/Pack</th>
                            <th className="text-center px-4 py-2 font-medium text-gray-600">On Hand</th>
                            <th className="text-right px-4 py-2 font-medium text-gray-600 bg-blue-50">Order</th>
                            <th className="text-right px-4 py-2 font-medium text-gray-600">Est. Cost</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.itemsList.map((item, idx) => {
                            // Calculate AP conversion
                            const apCalc = calculateAPOrder(item.quantity, item.unit, item.caseSize);
                            // Minimum 1 case even if EP need is tiny
                            const casesNeeded = Math.max(1, apCalc.casesNeeded || Math.ceil(item.quantity));
                            
                            // Get on-hand (in cases/AP units)
                            const onHand = getOnHand(vendor, item.name);
                            const hasOnHand = onHand !== '';
                            
                            // Calculate order qty (cases needed - on hand cases)
                            const orderCases = hasOnHand ? Math.max(0, casesNeeded - onHand) : casesNeeded;
                            
                            // Estimate cost based on case price
                            const casePrice = item.casePrice || item.unitPrice || 0;
                            const estCost = orderCases * casePrice;
                            
                            return (
                            <tr key={idx} className={`border-b hover:bg-gray-50 ${item.isGrocery ? 'bg-amber-50' : ''} ${hasOnHand && orderCases === 0 ? 'opacity-50' : ''}`}>
                              <td className="px-4 py-2 font-mono text-gray-500">{item.itemNumber || '-'}</td>
                              <td className="px-4 py-2">
                                <span className="font-medium">{item.name}</span>
                                {item.isGrocery && (
                                  <span className="ml-2 text-amber-600 text-xs"><CartIcon /> Grocery</span>
                                )}
                              </td>
                              <td className="px-4 py-2 text-gray-600">
                                <span className="font-medium">{item.quantity}</span>
                                <span className="text-gray-400 ml-1">{item.unit}</span>
                              </td>
                              <td className="px-4 py-2 text-gray-600 text-xs">
                                {item.caseSize || '-'}
                                {apCalc.casesNeeded && (
                                  <div className="text-blue-600">= {casesNeeded} case{casesNeeded !== 1 ? 's' : ''}</div>
                                )}
                              </td>
                              <td className="px-4 py-2 text-center">
                                <input
                                  type="number"
                                  min="0"
                                  step="1"
                                  value={onHand}
                                  onChange={(e) => updateOnHand(vendor, item.name, e.target.value, 'case')}
                                  placeholder="-"
                                  className={`w-16 px-2 py-1 text-center border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 ${savingInventory ? 'bg-gray-100' : ''}`}
                                />
                                <div className="text-xs text-gray-400">cases</div>
                              </td>
                              <td className={`px-4 py-2 text-right font-bold ${hasOnHand ? (orderCases > 0 ? 'text-blue-600 bg-blue-50' : 'text-green-600 bg-green-50') : ''}`}>
                                {orderCases}
                                <div className="text-xs font-normal text-gray-400">cases</div>
                              </td>
                              <td className="px-4 py-2 text-right">${estCost.toFixed(2)}</td>
                            </tr>
                            );
                          })}
                        </tbody>
                        <tfoot>
                          <tr className="bg-gray-50 font-medium">
                            <td colSpan="6" className="px-4 py-2 text-right">Vendor Total:</td>
                            <td className="px-4 py-2 text-right">${data.itemsList.reduce((sum, item) => {
                              const apCalc = calculateAPOrder(item.quantity, item.unit, item.caseSize);
                              const casesNeeded = Math.max(1, apCalc.casesNeeded || Math.ceil(item.quantity));
                              const onHand = getOnHand(vendor, item.name);
                              const hasOnHand = onHand !== '';
                              const orderCases = hasOnHand ? Math.max(0, casesNeeded - onHand) : casesNeeded;
                              const casePrice = item.casePrice || item.unitPrice || 0;
                              return sum + (orderCases * casePrice);
                            }, 0).toFixed(2)}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Grand Total */}
            {displayVendors.length > 0 && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg flex justify-between items-center">
                <div>
                  <span className="font-medium text-blue-800">Grand Total (Order)</span>
                  {hasActiveFilters && <span className="ml-2 text-sm text-blue-600">(filtered)</span>}
                </div>
                <span className="text-2xl font-bold text-blue-800">
                  ${Object.entries(displayOrders).reduce((sum, [vendor, v]) => {
                    if (!v || !v.itemsList) return sum;
                    return sum + v.itemsList.reduce((itemSum, item) => {
                      const apCalc = calculateAPOrder(item.quantity, item.unit, item.caseSize);
                      const casesNeeded = Math.max(1, apCalc.casesNeeded || Math.ceil(item.quantity));
                      const onHand = getOnHand(vendor, item.name);
                      const hasOnHand = onHand !== '';
                      const orderCases = hasOnHand ? Math.max(0, casesNeeded - onHand) : casesNeeded;
                      const casePrice = item.casePrice || item.unitPrice || 0;
                      return itemSum + (orderCases * casePrice);
                    }, 0);
                  }, 0).toFixed(2)}
                </span>
              </div>
            )}
          </>
        )}

        {/* On-Hand Mode - Simplified view by Category */}
        {viewMode === 'current' && onHandMode && (
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <h2 className="text-lg font-semibold text-green-800 mb-2">📋 On-Hand Entry Mode</h2>
              <p className="text-green-700">Walk through storage areas and enter current inventory counts (in cases/packs).</p>
            </div>
            
            {categoryOrder.filter(cat => consolidateByCategory[cat]).map(category => {
              const catData = consolidateByCategory[category];
              if (!catData || catData.items.length === 0) return null;
              
              // Category colors
              const catColors = {
                'Produce': 'bg-green-100 border-green-300',
                'Dairy & Eggs': 'bg-yellow-100 border-yellow-300',
                'Meat & Seafood': 'bg-red-100 border-red-300',
                'Bakery & Bread': 'bg-amber-100 border-amber-300',
                'Frozen': 'bg-blue-100 border-blue-300',
                'Pantry': 'bg-orange-100 border-orange-300',
                'Beverages': 'bg-purple-100 border-purple-300',
                'Wine & Spirits': 'bg-pink-100 border-pink-300',
              };
              const catColor = catColors[category] || 'bg-gray-100 border-gray-300';
              
              return (
                <div key={category} className={`border-2 rounded-lg overflow-hidden ${catColor}`}>
                  <div className="px-4 py-3">
                    <h2 className="text-xl font-bold text-gray-800">{category}</h2>
                    <p className="text-sm text-gray-600">{catData.items.length} items</p>
                  </div>
                  <div className="bg-white">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50 border-b">
                          <th className="text-left px-4 py-3 font-semibold text-gray-700 text-base">Item</th>
                          <th className="text-left px-4 py-3 font-semibold text-gray-700 text-base">EP Need</th>
                          <th className="text-left px-4 py-3 font-semibold text-gray-700 text-base">Case/Pack</th>
                          <th className="text-center px-4 py-3 font-semibold text-gray-700 text-base w-32">On Hand</th>
                          <th className="text-right px-4 py-3 font-semibold text-gray-700 text-base bg-blue-50 w-24">Order</th>
                        </tr>
                      </thead>
                      <tbody>
                        {catData.items.map((item, idx) => {
                          // Calculate AP conversion
                          const apCalc = calculateAPOrder(item.quantity, item.unit, item.caseSize);
                          // Minimum 1 case even if EP need is tiny
                          const casesNeeded = Math.max(1, apCalc.casesNeeded || Math.ceil(item.quantity));
                          
                          // Get on-hand (in cases/AP units)
                          const onHand = getOnHand(category, item.name);
                          const hasOnHand = onHand !== '';
                          
                          // Calculate order qty (cases needed - on hand cases)
                          const orderCases = hasOnHand ? Math.max(0, casesNeeded - onHand) : casesNeeded;
                          
                          return (
                            <tr key={idx} className={`border-b ${hasOnHand && orderCases === 0 ? 'bg-green-50 opacity-60' : ''}`}>
                              <td className="px-4 py-3">
                                <span className="font-medium text-base">{item.name}</span>
                              </td>
                              <td className="px-4 py-3 text-gray-600">
                                <span className="text-base">{item.quantity}</span>
                                <span className="text-gray-400 ml-1 text-sm">{item.unit}</span>
                              </td>
                              <td className="px-4 py-3 text-gray-600 text-sm">
                                {item.caseSize || '-'}
                                {apCalc.casesNeeded && (
                                  <div className="text-blue-600 font-medium">= {casesNeeded} case{casesNeeded !== 1 ? 's' : ''}</div>
                                )}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <input
                                  type="number"
                                  min="0"
                                  step="1"
                                  value={onHand}
                                  onChange={(e) => updateOnHand(category, item.name, e.target.value, 'case')}
                                  placeholder="0"
                                  className={`w-20 px-3 py-2 text-center text-lg border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 ${savingInventory ? 'bg-gray-100' : 'bg-white'}`}
                                />
                              </td>
                              <td className={`px-4 py-3 text-right text-lg font-bold ${hasOnHand ? (orderCases > 0 ? 'text-blue-600 bg-blue-50' : 'text-green-600 bg-green-50') : 'text-gray-700'}`}>
                                {orderCases}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
            
            {/* Summary in On-Hand Mode */}
            <div className="mt-6 p-4 bg-blue-100 rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <span className="font-semibold text-blue-800 text-lg">Total Items to Order</span>
                  <span className="ml-2 text-blue-600">(after inventory check)</span>
                </div>
                <span className="text-3xl font-bold text-blue-800">
                  {Object.entries(consolidateByCategory).reduce((sum, [catName, cat]) => {
                    return sum + cat.items.reduce((itemSum, item) => {
                      const apCalc = calculateAPOrder(item.quantity, item.unit, item.caseSize);
                      const casesNeeded = Math.max(1, apCalc.casesNeeded || Math.ceil(item.quantity));
                      const onHand = getOnHand(catName, item.name);
                      const hasOnHand = onHand !== '';
                      const orderCases = hasOnHand ? Math.max(0, casesNeeded - onHand) : casesNeeded;
                      return itemSum + orderCases;
                    }, 0);
                  }, 0)} cases
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
