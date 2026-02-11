import React, { useState, useEffect, useMemo, useRef } from 'react';
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

const ChevronDownIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

// ===========================================
// COURSE NAME LOOKUP
// ===========================================
const courseNames = {
  'CUL130': 'Savory Cuisine',
  'CUL140': 'Culinary Principles',
  'CUL150': 'Garde Manger',
  'CUL160': 'Bakery & Pastry Production I',
  'CUL162': 'Art of Chocolate',
  'CUL163': 'Sauces',
  'CUL168': 'Specialty and Hearth Breads',
  'CUL244': 'Confections, Show Pcs, Desserts',
  'CUL260': 'Pastry Arts II',
  'CUL266': 'Ice Cream, Bavarian, Mousse',
  'CUL276': 'Pastry Production',
  'CATERING': 'Catering Event',
  'PD-WORKSHOP': 'Professional Development'
};

const getCourseName = (code) => {
  const c = (code || '').replace(/\s+/g, '').toUpperCase();
  return courseNames[c] ? `${code} ${courseNames[c]}` : code || 'Unknown Course';
};

// ===========================================
// DATE FORMATTING HELPER (avoid timezone issues)
// ===========================================
const formatDate = (dateStr) => {
  if (!dateStr) return 'No date';
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US');
};

// ===========================================
// EP → AP CONVERSION UTILITIES
// ===========================================

const parsePackSize = (packSize) => {
  if (!packSize) return null;
  
  const normalized = packSize.toUpperCase().trim();
  
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
  
  match = normalized.match(/^(\d+)\/#(\d+)$/);
  if (match) {
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

const convertToBase = (qty, unit) => {
  const u = (unit || '').toLowerCase().trim();
  
  if (u === 'lb' || u === 'lbs') return { value: qty * 16, baseUnit: 'oz' };
  if (u === 'oz') return { value: qty, baseUnit: 'oz' };
  if (u === 'g') return { value: qty * 0.035274, baseUnit: 'oz' };
  if (u === 'kg') return { value: qty * 35.274, baseUnit: 'oz' };
  
  if (u === 'gal' || u === 'gallon') return { value: qty * 128, baseUnit: 'floz' };
  if (u === 'qt' || u === 'quart') return { value: qty * 32, baseUnit: 'floz' };
  if (u === 'pt' || u === 'pint') return { value: qty * 16, baseUnit: 'floz' };
  if (u === 'cup' || u === 'cups' || u === 'c') return { value: qty * 8, baseUnit: 'floz' };
  if (u === 'fl oz' || u === 'floz') return { value: qty, baseUnit: 'floz' };
  if (u === 'tbsp') return { value: qty * 0.5, baseUnit: 'floz' };
  if (u === 'tsp') return { value: qty * 0.167, baseUnit: 'floz' };
  if (u === 'ml') return { value: qty * 0.033814, baseUnit: 'floz' };
  if (u === 'l' || u === 'liter') return { value: qty * 33.814, baseUnit: 'floz' };
  
  if (u === 'ea' || u === 'each' || u === 'ct' || u === 'pk' || u === 'dz' || u === 'dozen') {
    const multiplier = (u === 'dz' || u === 'dozen') ? 12 : 1;
    return { value: qty * multiplier, baseUnit: 'ea' };
  }
  
  return { value: qty, baseUnit: 'ea' };
};

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
  
  const epBase = convertToBase(epQty, epUnit);
  const caseBase = convertToBase(parsed.totalVolume, parsed.unitType);
  
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
  
  return {
    casesNeeded: null,
    apUnit: epUnit,
    caseSize: packSize,
    epConverted: epQty,
    incompatible: true
  };
};

const PERISHABLE_CATEGORIES = ['Produce', 'Dairy & Eggs', 'Meat & Seafood', 'Bakery & Bread'];
const NON_PERISHABLE_CATEGORIES = ['Pantry', 'Beverages', 'Wine & Spirits', 'Production Items', 'Frozen Foods'];

const isGroceryStoreItem = (item, ingredient) => {
  if (ingredient?.category !== 'Produce') return false;
  
  const packSize = ingredient?.pack_size || '';
  const match = packSize.match(/^(\d+)\/(\d+\.?\d*)\s*(LB|OZ|CT|EA|GAL)?$/i) || packSize.match(/^(\d+\.?\d*)\s*(LB|OZ|CT|EA|GAL)?$/i);
  
  if (!match) return true;
  
  let caseQty;
  if (match[3] || (match[2] && isNaN(match[2]))) {
    const count = parseFloat(match[1]) || 1;
    const size = parseFloat(match[2]) || 1;
    const unit = (match[3] || match[2] || '').toUpperCase();
    
    if (unit === 'OZ') caseQty = (count * size) / 16;
    else if (unit === 'LB') caseQty = count * size;
    else caseQty = count * size;
  } else {
    caseQty = parseFloat(match[1]) || 1;
  }
  
  const qtyNeeded = item.quantity || 0;
  return qtyNeeded < (caseQty * 0.25);
};

const getWeekRange = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { start: monday, end: sunday };
};

// ===========================================
// MULTI-SELECT DROPDOWN COMPONENT
// ===========================================
const MultiSelectDropdown = ({ label, options, selected, onChange, countSuffix = '', renderOption = null }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (option) => {
    if (selected.includes(option)) {
      onChange(selected.filter(s => s !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  const selectAll = () => {
    if (selected.length === options.length) {
      onChange([]);
    } else {
      onChange([...options]);
    }
  };

  const displayText = selected.length === 0 
    ? `All ${label}` 
    : selected.length === 1 
      ? selected[0] 
      : `${selected.length} ${label}${countSuffix}`;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm min-w-[140px] justify-between ${selected.length > 0 ? 'bg-blue-50 border-blue-300' : 'bg-white'}`}
      >
        <span className="truncate">{displayText}</span>
        <ChevronDownIcon />
      </button>
      
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-white border rounded-lg shadow-lg z-30 max-h-80 overflow-hidden">
          <div className="p-2 border-b bg-gray-50">
            <button
              onClick={selectAll}
              className="w-full text-left px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded"
            >
              {selected.length === options.length ? '✓ Deselect All' : '☐ Select All'}
            </button>
          </div>
          <div className="max-h-60 overflow-y-auto p-2">
            {options.map(option => (
              <label
                key={option}
                className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(option)}
                  onChange={() => toggleOption(option)}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <span className="text-sm flex-1">{renderOption ? renderOption(option) : option}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
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
  
  // Filter states - CHANGED to arrays for multi-select
  const [filterWeeks, setFilterWeeks] = useState([]); // Multi-week selection
  const [filterInstructors, setFilterInstructors] = useState([]); // Changed from single to array
  const [filterCourses, setFilterCourses] = useState([]); // Changed from single to array
  const [filterItemType, setFilterItemType] = useState('all');
  const [showGroceryOnly, setShowGroceryOnly] = useState(false);
  const [inventory, setInventory] = useState({});
  const [savingInventory, setSavingInventory] = useState(false);
  const [orderOverrides, setOrderOverrides] = useState({});
  const [sortBy, setSortBy] = useState('vendor');
  const [vendorAlternatives, setVendorAlternatives] = useState({});
  const [vendorOverrides, setVendorOverrides] = useState({});
  const [showConfirmations, setShowConfirmations] = useState(false);
  
  const [showInvoiceUpload, setShowInvoiceUpload] = useState(false);
  const [invoiceData, setInvoiceData] = useState(null);
  const [invoiceMatches, setInvoiceMatches] = useState([]);
  const [processingInvoice, setProcessingInvoice] = useState(false);

  const loadVendorAlternatives = async () => {
    try {
      const { data, error } = await supabase
        .from('ingredient_vendors')
        .select('*')
        .order('is_preferred', { ascending: false });
      
      if (error) throw error;
      
      const altMap = {};
      (data || []).forEach(v => {
        const key = v.ingredient_name?.toLowerCase();
        if (!key) return;
        if (!altMap[key]) {
          altMap[key] = [];
        }
        altMap[key].push(v);
      });
      setVendorAlternatives(altMap);
    } catch (error) {
      console.error('Error loading vendor alternatives:', error);
    }
  };

  const getSelectedVendor = (itemName) => {
    const key = itemName?.toLowerCase();
    if (vendorOverrides[key]) {
      return vendorOverrides[key];
    }
    const alts = vendorAlternatives[key];
    if (alts && alts.length > 0) {
      const preferred = alts.find(v => v.is_preferred) || alts[0];
      return preferred;
    }
    return null;
  };

  const setVendorOverride = (itemName, vendorData) => {
    const key = itemName?.toLowerCase();
    setVendorOverrides(prev => ({
      ...prev,
      [key]: vendorData
    }));
  };

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

  const updateOnHand = async (vendor, itemName, value, unit) => {
    const qty = value === '' ? null : parseFloat(value) || 0;
    
    setInventory(prev => ({
      ...prev,
      [itemName]: { quantity: qty, unit, lastCounted: new Date().toISOString() }
    }));

    setSavingInventory(true);
    try {
      const { data: existing } = await supabase
        .from('inventory_current')
        .select('id')
        .eq('ingredient_name', itemName)
        .single();

      if (existing) {
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

  const getOnHand = (vendor, itemName) => {
    const inv = inventory[itemName];
    if (!inv || inv.quantity === null) return '';
    return inv.quantity;
  };

  const getLastCounted = (itemName) => {
    const inv = inventory[itemName];
    if (!inv || !inv.lastCounted) return null;
    const date = new Date(inv.lastCounted);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'today';
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getOrderOverride = (vendor, itemName) => {
    const key = `${vendor}:${itemName}`;
    const override = orderOverrides[key];
    if (override === undefined || override === null) return '';
    return override;
  };

  const setOrderOverride = (vendor, itemName, value) => {
    const key = `${vendor}:${itemName}`;
    setOrderOverrides(prev => ({
      ...prev,
      [key]: value === '' ? null : parseFloat(value) || 0
    }));
  };

  const getEffectiveOrder = (vendor, itemName, calculatedOrder) => {
    const override = getOrderOverride(vendor, itemName);
    if (override !== '') return override;
    
    const onHand = getOnHand(vendor, itemName);
    if (onHand !== '') {
      return Math.max(0, calculatedOrder - onHand);
    }
    
    return calculatedOrder;
  };

  const clearAllOnHand = async () => {
    if (!window.confirm('Clear all on-hand counts? This will reset inventory to uncounted.')) return;
    
    setSavingInventory(true);
    try {
      await supabase
        .from('inventory_current')
        .update({ quantity: null, last_counted: null })
        .neq('id', '00000000-0000-0000-0000-000000000000');
      
      setInventory({});
    } catch (error) {
      console.error('Error clearing inventory:', error);
    }
    setSavingInventory(false);
  };

  const parseSyscoInvoice = (csvText) => {
    const lines = csvText.split('\n').filter(l => l.trim());
    let invoiceInfo = {};
    const items = [];
    
    for (const line of lines) {
      const parts = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          parts.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      parts.push(current.trim());
      
      if (parts[0] === 'H') {
        invoiceInfo = {
          orderDate: parts[4],
          deliveryDate: parts[5],
          invoiceNumber: parts[9] || parts[10],
          totalAmount: parseFloat(parts[11]) || 0,
          itemCount: parseInt(parts[12]) || 0,
          status: parts[13]
        };
      } else if (parts[0] === 'P') {
        items.push({
          supc: parts[1],
          caseQty: parseInt(parts[2]) || 0,
          splitQty: parseInt(parts[3]) || 0,
          packSize: parts[5],
          brand: parts[6],
          description: parts[7],
          casePrice: parseFloat(parts[10]) || 0,
          eachPrice: parseFloat(parts[11]) || 0
        });
      }
    }
    
    return { invoiceInfo, items };
  };

  const matchInvoiceItems = async (items) => {
    const { data: vendors } = await supabase
      .from('ingredient_vendors')
      .select('ingredient_name, item_number, vendor_description')
      .eq('vendor', 'Sysco');
    
    const vendorMap = {};
    (vendors || []).forEach(v => {
      if (v.item_number) vendorMap[v.item_number] = v;
    });
    
    const { data: allIngredients } = await supabase
      .from('ingredients')
      .select('name');
    
    const ingredientNames = (allIngredients || []).map(i => i.name.toLowerCase());
    
    return items.map(item => {
      const vendorMatch = vendorMap[item.supc];
      if (vendorMatch) {
        return {
          ...item,
          matched: true,
          matchType: 'supc',
          ingredientName: vendorMatch.ingredient_name,
          confidence: 'high'
        };
      }
      
      const desc = item.description.toLowerCase();
      let bestMatch = null;
      let bestScore = 0;
      
      for (const name of ingredientNames) {
        const descWords = desc.split(/\s+/);
        const nameWords = name.split(/[\s,]+/);
        let matches = 0;
        for (const nw of nameWords) {
          if (descWords.some(dw => dw.includes(nw) || nw.includes(dw))) matches++;
        }
        const score = matches / nameWords.length;
        if (score > bestScore && score >= 0.5) {
          bestScore = score;
          bestMatch = (allIngredients || []).find(i => i.name.toLowerCase() === name)?.name;
        }
      }
      
      if (bestMatch) {
        return {
          ...item,
          matched: true,
          matchType: 'fuzzy',
          ingredientName: bestMatch,
          confidence: bestScore >= 0.8 ? 'high' : 'medium'
        };
      }
      
      return {
        ...item,
        matched: false,
        matchType: 'none',
        ingredientName: '',
        confidence: 'none'
      };
    });
  };

  const handleInvoiceUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const text = await file.readAsText ? await file.readAsText() : await new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.readAsText(file);
    });
    
    const parsed = parseSyscoInvoice(text);
    setInvoiceData(parsed);
    
    const matches = await matchInvoiceItems(parsed.items);
    setInvoiceMatches(matches);
    setShowInvoiceUpload(true);
  };

  const processInvoice = async () => {
    setProcessingInvoice(true);
    const now = new Date().toISOString();
    
    try {
      for (const item of invoiceMatches) {
        if (!item.matched || !item.ingredientName) continue;
        
        const qty = item.caseQty + (item.splitQty > 0 ? item.splitQty / 6 : 0);
        
        await supabase.from('inventory_transactions').insert({
          ingredient_name: item.ingredientName,
          transaction_type: 'received',
          quantity: qty,
          unit: 'case',
          vendor: 'Sysco',
          vendor_item_number: item.supc,
          unit_cost: item.casePrice,
          invoice_number: invoiceData.invoiceInfo.invoiceNumber,
          invoice_date: invoiceData.invoiceInfo.deliveryDate,
          notes: `${item.packSize} - ${item.description}`
        });
        
        const { data: existing } = await supabase
          .from('inventory_current')
          .select('quantity')
          .eq('ingredient_name', item.ingredientName)
          .single();
        
        if (existing) {
          await supabase
            .from('inventory_current')
            .update({
              quantity: (existing.quantity || 0) + qty,
              last_counted: now
            })
            .eq('ingredient_name', item.ingredientName);
        } else {
          await supabase
            .from('inventory_current')
            .insert({
              ingredient_name: item.ingredientName,
              quantity: qty,
              unit: 'case',
              last_counted: now
            });
        }
        
        await supabase
          .from('ingredient_vendors')
          .update({
            case_price: item.casePrice,
            vendor_description: item.description,
            item_number: item.supc,
            pack_size: item.packSize
          })
          .eq('ingredient_name', item.ingredientName)
          .eq('vendor', 'Sysco');
        
        await supabase
          .from('ingredients')
          .update({
            case_price: item.casePrice,
            pack_size: item.packSize,
            updated_at: now
          })
          .eq('name', item.ingredientName);
      }
      
      await loadInventory();
      
      setShowInvoiceUpload(false);
      setInvoiceData(null);
      setInvoiceMatches([]);
      alert(`✓ Processed ${invoiceMatches.filter(m => m.matched).length} items from invoice`);
    } catch (error) {
      console.error('Error processing invoice:', error);
      alert('Error processing invoice: ' + error.message);
    }
    
    setProcessingInvoice(false);
  };

  useEffect(() => { loadData(); loadArchivedOrders(); loadInventory(); loadVendorAlternatives(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: reqs } = await supabase.from('requisitions').select('*').order('created_at', { ascending: false });
      
      const { data: events } = await supabase
        .from('catering_events')
        .select('*')
        .in('status', ['confirmed', 'inquiry', 'quoted'])
        .order('event_date', { ascending: true });
      
      const { data: workshops } = await supabase
        .from('pd_workshops')
        .select('*')
        .in('status', ['confirmed', 'planned'])
        .order('workshop_date', { ascending: true });
      
      const eventReqs = (events || []).filter(e => e.items && e.items.length > 0).map(e => ({
        id: e.id,
        course: 'CATERING',
        class_date: e.event_date,
        instructor: e.contact_name || 'Catering',
        students: e.guest_count,
        recipes: e.event_name,
        items: e.items,
        status: e.status,
        source: 'catering',
        event_type: e.event_type,
        department: e.department
      }));
      
      const workshopReqs = (workshops || []).filter(w => w.items && w.items.length > 0).map(w => ({
        id: w.id,
        course: 'PD-WORKSHOP',
        class_date: w.workshop_date,
        instructor: w.leader || 'Staff',
        students: w.attendee_count,
        recipes: w.workshop_name,
        items: w.items,
        status: w.status,
        source: 'pd',
        target_audience: w.target_audience
      }));
      
      const allReqs = [...(reqs || []), ...eventReqs, ...workshopReqs];
      
      const { data: ings } = await supabase.from('ingredients').select('*');
      setRequisitions(allReqs);
      setIngredients(ings || []);
    } catch (error) { console.error('Error loading data:', error); }
    setLoading(false);
  };

  const loadArchivedOrders = () => {
    const archived = localStorage.getItem('toqueworks_consolidated_archive');
    if (archived) setArchivedOrders(JSON.parse(archived));
  };

  const SESSION_1_START = new Date("2026-01-12");
  const SESSION_2_START = new Date("2026-03-23");

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
          const label = start.toLocaleDateString("en-US", opts) + " - " + end.toLocaleDateString("en-US", opts);
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

  useEffect(() => {
    if (filterWeeks.length === 0 && filterOptions.weeks.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const upcomingWeek = filterOptions.weeks.find(w => w.start >= today);
      
      if (upcomingWeek) {
        setFilterWeeks([upcomingWeek.key]); // Default to upcoming week
      }
    }
  }, [filterOptions.weeks, filterWeeks.length]);

  // UPDATED: Filter requisitions based on multi-select (including weeks)
  const filteredRequisitions = useMemo(() => {
    return requisitions.filter(req => {
      // Week filter - NOW MULTI-SELECT
      if (filterWeeks.length > 0 && req.class_date) {
        const { start } = getWeekRange(req.class_date);
        const reqWeekKey = start.toISOString().split("T")[0];
        if (!filterWeeks.includes(reqWeekKey)) return false;
      }
      
      // Instructor filter - MULTI-SELECT
      if (filterInstructors.length > 0 && !filterInstructors.includes(req.instructor)) return false;
      
      // Course filter - MULTI-SELECT
      if (filterCourses.length > 0 && !filterCourses.includes(req.course)) return false;
      
      return true;
    });
  }, [requisitions, filterWeeks, filterInstructors, filterCourses]);

  const ingMap = useMemo(() => {
    const map = {};
    ingredients.forEach(ing => { map[ing.name?.toLowerCase()] = ing; });
    return map;
  }, [ingredients]);

  const consolidateByVendor = useMemo(() => {
    const vendorMap = {};
    
    filteredRequisitions.forEach(req => {
      if (!req.items) return;
      const items = typeof req.items === 'string' ? JSON.parse(req.items) : req.items;
      
      items.forEach(item => {
        const ing = ingMap[item.name?.toLowerCase()] || {};
        const category = ing.category || 'Unknown';
        
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
    
    Object.keys(vendorMap).forEach(vendor => {
      vendorMap[vendor].requisitions = Array.from(vendorMap[vendor].requisitions);
      vendorMap[vendor].itemsList = Object.values(vendorMap[vendor].items).map(item => {
        const ing = ingMap[item.name?.toLowerCase()] || {};
        item.isGrocery = isGroceryStoreItem(item, ing);
        return item;
      });
      
      if (showGroceryOnly) {
        vendorMap[vendor].itemsList = vendorMap[vendor].itemsList.filter(item => item.isGrocery);
      }
      
      vendorMap[vendor].totalItems = vendorMap[vendor].itemsList.length;
      vendorMap[vendor].totalValue = vendorMap[vendor].itemsList.reduce((sum, item) => {
        const cost = (item.unitPrice || 0) * (item.quantity || 0);
        return sum + cost;
      }, 0);
      vendorMap[vendor].groceryCount = vendorMap[vendor].itemsList.filter(i => i.isGrocery).length;
    });
    
    Object.keys(vendorMap).forEach(vendor => {
      if (vendorMap[vendor].totalItems === 0) delete vendorMap[vendor];
    });
    
    return vendorMap;
  }, [filteredRequisitions, ingMap, filterItemType, showGroceryOnly]);

  const consolidateByCategory = useMemo(() => {
    const categoryMap = {};
    
    Object.values(consolidateByVendor).forEach(vendorData => {
      vendorData.itemsList.forEach(item => {
        const category = item.category || 'Other';
        if (!categoryMap[category]) {
          categoryMap[category] = { items: [], totalItems: 0 };
        }
        
        const existing = categoryMap[category].items.find(i => i.name === item.name);
        if (existing) {
          existing.quantity += item.quantity;
        } else {
          categoryMap[category].items.push({ ...item });
        }
      });
    });
    
    Object.keys(categoryMap).forEach(cat => {
      categoryMap[cat].items.sort((a, b) => a.name.localeCompare(b.name));
      categoryMap[cat].totalItems = categoryMap[cat].items.length;
    });
    
    return categoryMap;
  }, [consolidateByVendor]);

  const categoryOrder = ['Produce', 'Dairy & Eggs', 'Meat & Seafood', 'Bakery & Bread', 'Frozen', 'Pantry', 'Beverages', 'Wine & Spirits', 'Other'];

  const saveToArchive = () => {
    const archiveEntry = {
      id: Date.now(),
      date: new Date().toISOString(),
      orders: consolidateByVendor,
      filters: { weeks: filterWeeks, instructors: filterInstructors, courses: filterCourses, itemType: filterItemType },
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
      filterWeeks.length > 0 ? `Weeks: ${filterWeeks.length}` : '',
      filterInstructors.length > 0 ? `Instructors: ${filterInstructors.join(', ')}` : '',
      filterCourses.length > 0 ? `Courses: ${filterCourses.join(', ')}` : '',
      filterItemType !== 'all' ? `Type: ${filterItemType}` : ''
    ].filter(Boolean).join(' | ');
    
    const itemsToOrder = items.map(item => {
      const alternatives = vendorAlternatives[item.name?.toLowerCase()] || [];
      const selectedVendorData = getSelectedVendor(item.name);
      
      const activePackSize = selectedVendorData?.pack_size || item.caseSize;
      const activeCasePrice = selectedVendorData?.case_price || item.casePrice || item.unitPrice || 0;
      const activeItemNumber = selectedVendorData?.item_number || item.itemNumber;
      const activeVendor = selectedVendorData?.vendor || item.vendor;
      
      const apCalc = calculateAPOrder(item.quantity, item.unit, activePackSize);
      const calculatedOrder = Math.max(1, apCalc.casesNeeded || Math.ceil(item.quantity));
      const onHand = getOnHand(vendor, item.name);
      const override = getOrderOverride(vendor, item.name);
      let effectiveOrder = calculatedOrder;
      if (override !== '') effectiveOrder = override;
      else if (onHand !== '') effectiveOrder = Math.max(0, calculatedOrder - onHand);
      
      const isUnit = activePackSize?.startsWith('1/');
      
      return {
        ...item,
        itemNumber: activeItemNumber,
        caseSize: activePackSize,
        casePrice: activeCasePrice,
        activeVendor: activeVendor,
        vendorChanged: selectedVendorData && selectedVendorData.vendor !== item.vendor,
        onHand: onHand !== '' ? onHand : '-',
        orderQty: effectiveOrder,
        estCost: effectiveOrder * activeCasePrice,
        isUnit
      };
    }).filter(item => item.orderQty > 0);
    
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
          .vendor-change { color: #7c3aed; font-size: 11px; font-weight: bold; }
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
              <th>Pack Size</th>
              <th class="order-col">Order</th>
              <th>Est. Cost</th>
            </tr>
          </thead>
          <tbody>
            ${itemsToOrder.map(item => `
              <tr class="${item.isGrocery ? 'grocery' : ''}">
                <td>${item.itemNumber || '-'}</td>
                <td>
                  ${item.name}
                  ${item.vendorChanged ? `<br><span class="vendor-change">→ ${item.activeVendor}</span>` : ''}
                  ${item.isGrocery ? '<br><span class="grocery-label">🛒 Consider grocery store</span>' : ''}
                </td>
                <td>${item.caseSize || '-'}</td>
                <td class="order-col">${item.orderQty} ${item.isUnit ? '' : 'cases'}</td>
                <td>$${item.estCost.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="total">Total: $${itemsToOrder.reduce((sum, i) => sum + i.estCost, 0).toFixed(2)}</div>
        <button onclick="window.print()" style="margin-top:20px;padding:10px 20px">Print Again</button>
      </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 100);
  };

  const getInstructorConfirmations = () => {
    const byInstructor = {};
    filteredRequisitions.forEach(req => {
      const instructor = req.instructor || 'Unknown';
      if (!byInstructor[instructor]) {
        byInstructor[instructor] = {
          instructor,
          email: req.instructor_email || null,
          requisitions: []
        };
      }
      const items = typeof req.items === 'string' ? JSON.parse(req.items) : (req.items || []);
      byInstructor[instructor].requisitions.push({
        id: req.id,
        course: req.course,
        classDate: req.class_date,
        students: req.students || 0,
        recipes: req.recipes || '',
        items: items,
        equipment: req.equipment,
        recipe_citations: req.recipe_citations
      });
    });
    return Object.values(byInstructor);
  };

  const printConfirmation = (conf) => {
    const printWindow = window.open('', '_blank');
    const date = new Date().toLocaleDateString();
    
    const standardizeUnit = (qty, unit) => {
      const u = unit.toLowerCase().replace(/\s+/g, '');
      
      if (u === 'oz') return { qty, unit: 'oz' };
      if (u === 'lb') return { qty, unit: 'lb' };
      if (u === 'g') return { qty: qty * 0.035274, unit: 'oz' };
      if (u === 'kg') return { qty: qty * 2.20462, unit: 'lb' };
      
      if (u === 'floz' || u === 'fl oz') return { qty, unit: 'oz' };
      if (u === 'cup') return { qty: qty * 8, unit: 'oz' };
      if (u === 'pt') return { qty: qty * 16, unit: 'oz' };
      if (u === 'qt') return { qty: qty * 32, unit: 'oz' };
      if (u === 'gal') return { qty: qty * 128, unit: 'oz' };
      if (u === 'ml') return { qty: qty * 0.033814, unit: 'oz' };
      if (u === 'l') return { qty: qty * 33.814, unit: 'oz' };
      
      if (u === 'ct' || u === 'ea' || u === 'each') return { qty, unit: 'ct' };
      if (u === 'doz') return { qty: qty * 12, unit: 'ct' };
      if (u === 'bunch' || u === 'bu') return { qty, unit: 'ct' };
      
      return { qty, unit: 'ct' };
    };
    
    const processedReqs = conf.requisitions.map(req => {
      const aggregated = {};
      req.items.forEach(item => {
        const key = item.name;
        if (!aggregated[key]) {
          aggregated[key] = {
            name: item.name,
            rawQty: 0,
            rawUnit: item.unit
          };
        }
        aggregated[key].rawQty += parseFloat(item.quantity) || 0;
      });
      
      Object.values(aggregated).forEach(item => {
        const std = standardizeUnit(item.rawQty, item.rawUnit);
        item.epQty = std.qty;
        item.epUnit = std.unit;
      });
      
      return {
        ...req,
        processedItems: Object.values(aggregated).sort((a, b) => a.name.localeCompare(b.name))
      };
    });
    
    printWindow.document.write(`
      <html>
      <head>
        <title>Order Confirmation - ${conf.instructor}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; max-width: 900px; margin: 0 auto; }
          h1 { color: #1e40af; border-bottom: 2px solid #1e40af; padding-bottom: 10px; }
          h2 { color: #374151; margin-top: 20px; }
          .header-info { background: #f3f4f6; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
          .header-info p { margin: 5px 0; }
          .class-block { border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; margin-bottom: 20px; page-break-inside: avoid; }
          .class-header { font-weight: bold; color: #1e40af; margin-bottom: 10px; font-size: 16px; }
          .class-meta { display: flex; gap: 20px; margin-bottom: 10px; }
          .recipes { color: #6b7280; font-style: italic; margin-bottom: 15px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; font-size: 13px; }
          th { background: #f3f4f6; }
          th:nth-child(2), th:nth-child(3), th:nth-child(4) { text-align: center; width: 60px; }
          td:nth-child(2), td:nth-child(3), td:nth-child(4) { text-align: right; width: 60px; }
          @media print { button { display: none; } }
        </style>
      </head>
      <body>
        <h1>📋 Order Confirmation</h1>
        <div class="header-info">
          <p><strong>Instructor:</strong> ${conf.instructor}</p>
          <p><strong>Generated:</strong> ${date}</p>
          <p><strong>Order Period:</strong> ${filterWeeks.length > 0 ? filterWeeks.length + ' week(s)' : 'All Periods'}</p>
        </div>
        
        ${processedReqs.map(req => `
          <div class="class-block">
            <div class="class-header">${getCourseName(req.course)} - ${req.classDate ? formatDate(req.classDate) : 'No date'}</div>
            <div class="class-meta">
              <span><strong>Students:</strong> ${req.students} (${Math.ceil(parseInt(req.students) / (parseInt(req.students) <= 8 ? 2 : 3))} teams)</span>
            </div>
            <div class="recipes" style="background:#eff6ff;padding:8px 12px;border-radius:4px;margin-bottom:8px;">
              <strong style="color:#1e40af;">Recipes:</strong><br/>
              ${(() => {
                let cites = [];
                try { cites = typeof req.recipe_citations === 'string' ? JSON.parse(req.recipe_citations) : (req.recipe_citations || []); } catch(e) {}
                if (cites.length) {
                  return cites.map(c => '<span>' + c.recipe + '</span> <span style="color:#666;font-size:10px;">(' + c.source + ', ' + c.edition + ' Ed., p.' + c.page + ')</span>').join('<br/>');
                }
                return req.recipes || 'None specified';
              })()}
            </div>
            <p style="background:#f0fdf4;padding:6px 10px;border-radius:4px;margin:8px 0;font-size:11px;border:1px solid #bbf7d0;"><strong style="color:#166534;">Production:</strong> Each team produces 1× of each recipe. Total: ${Math.ceil(parseInt(req.students) / (parseInt(req.students) <= 8 ? 2 : 3))}× batches per recipe.</p>
            
            <table>
              <thead>
                <tr>
                  <th>Ingredient</th>
                  <th>OZ</th>
                  <th>LB</th>
                  <th>CT</th>
                </tr>
              </thead>
              <tbody>
                ${req.processedItems.map(item => {
                  let ozVal = '', lbVal = '', ctVal = '';
                  if (item.epUnit === 'oz') {
                    ozVal = item.epQty.toFixed(2);
                  } else if (item.epUnit === 'lb') {
                    if (item.epQty < 1) {
                      ozVal = (item.epQty * 16).toFixed(2);
                    } else {
                      lbVal = item.epQty.toFixed(2);
                    }
                  } else if (item.epUnit === 'ct') {
                    ctVal = item.epQty.toFixed(0);
                  }
                  return '<tr><td>' + item.name + '</td><td>' + ozVal + '</td><td>' + lbVal + '</td><td>' + ctVal + '</td></tr>';
                }).join('')}
              </tbody>
            </table>
            ${(() => {
              let equip = [];
              try { equip = typeof req.equipment === 'string' ? JSON.parse(req.equipment) : (req.equipment || []); } catch(e) {}
              const exclude = ['sheeter','proof box','proof box/cabinet','deck oven','convection oven','marble slab','marble slab or cold table'];
              equip = equip.filter(e => !exclude.includes(e.name.toLowerCase()));
              if (!equip.length) return '';
              return '<h3 style="margin:15px 0 5px;font-size:13px;">Equipment</h3><table><thead><tr><th>Item</th><th style="width:50px;text-align:center">Qty</th></tr></thead><tbody>' + equip.map(e => '<tr><td>' + e.name + '</td><td style="text-align:center">' + e.quantity + '</td></tr>').join('') + '</tbody></table>';
            })()}
            
          </div>
        `).join('')}
        
        <div style="margin-top:15px;">
          <button onclick="window.print()" style="padding:10px 20px;margin-right:10px;cursor:pointer;">Print</button>
          <button onclick="copyForEmail()" id="copyBtn" style="padding:10px 20px;background:#059669;color:white;border:none;border-radius:4px;cursor:pointer;">Copy for Email</button>
        </div>
        <script>
        function copyForEmail() {
          var range = document.createRange();
          var content = document.body.cloneNode(true);
          content.querySelectorAll('button').forEach(function(b){b.remove();});
          content.querySelectorAll('script').forEach(function(s){s.remove();});
          var div = document.createElement('div');
          div.innerHTML = content.innerHTML;
          document.body.appendChild(div);
          range.selectNodeContents(div);
          window.getSelection().removeAllRanges();
          window.getSelection().addRange(range);
          document.execCommand('copy');
          window.getSelection().removeAllRanges();
          document.body.removeChild(div);
          document.getElementById('copyBtn').textContent = 'Copied!';
          setTimeout(function() { document.getElementById('copyBtn').textContent = 'Copy for Email'; }, 2000);
        }
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
  };

  const emailConfirmation = (conf) => {
    const classDetails = conf.requisitions.map(req => {
      const aggregated = {};
      req.items.forEach(item => {
        const key = `${item.name}|${item.unit}`;
        if (!aggregated[key]) {
          aggregated[key] = { name: item.name, quantity: 0, unit: item.unit };
        }
        aggregated[key].quantity += parseFloat(item.quantity) || 0;
      });
      
      const ingredientList = Object.values(aggregated)
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(item => `    - ${item.name}: ${item.quantity.toFixed(2)} ${item.unit}`)
        .join('\n');
      
      return `• ${getCourseName(req.course)} - ${req.classDate ? formatDate(req.classDate) : 'No date'}\n  Students: ${req.students}\n  Recipes: ${req.recipes || 'None specified'}\n  Ingredients:\n${ingredientList}`;
    }).join('\n\n');
    
    const subject = encodeURIComponent(`Order Confirmation - ${filterWeek || 'Upcoming'}`);
    const body = encodeURIComponent(
      `Hi ${conf.instructor},\n\n` +
      `This is your order confirmation for ${filterWeeks.length > 0 ? 'the selected weeks' : 'the upcoming week'}.\n\n` +
      `${classDetails}\n\n` +
      `Please review and let me know if you have any questions.\n\n` +
      `Best regards,\nProgram Manager`
    );
    
    const email = conf.email || '';
    window.open(`mailto:${email}?subject=${subject}&body=${body}`, '_blank');
  };

  const clearFilters = () => {
    setFilterWeeks([]);
    setFilterInstructors([]);
    setFilterCourses([]);
    setFilterItemType('all');
    setShowGroceryOnly(false);
    setSelectedVendor('all');
  };

  const vendors = Object.keys(consolidateByVendor).sort();
  const displayOrders = selectedArchive ? selectedArchive.orders : consolidateByVendor;
  const displayVendors = Object.keys(displayOrders).sort();
  
  const hasActiveFilters = filterWeeks.length > 0 || filterInstructors.length > 0 || filterCourses.length > 0 || filterItemType !== 'all' || showGroceryOnly;

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
            <button onClick={() => { setViewMode('current'); setSelectedArchive(null); }} className={`px-4 py-2 rounded font-medium transition-colors ${viewMode === 'current' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Orders</button>
            <button onClick={() => setViewMode('archive')} className={`px-4 py-2 rounded font-medium transition-colors flex items-center gap-2 ${viewMode === 'archive' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}><ArchiveIcon />Archive ({archivedOrders.length})</button>
            <button
              onClick={() => setShowConfirmations(true)}
              disabled={filteredRequisitions.length === 0}
              className="px-4 py-2 rounded font-medium transition-colors bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              📋 Confirmations
            </button>
            <label className="px-4 py-2 rounded font-medium transition-colors bg-purple-600 text-white hover:bg-purple-700 cursor-pointer">
              📥 Upload Invoice
              <input
                type="file"
                accept=".csv"
                onChange={handleInvoiceUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Filters Section */}
        {viewMode === 'current' && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
            <div className="flex flex-wrap gap-3 items-center">
              <label className="text-sm font-medium text-gray-600">Filters:</label>
              
              {/* Order Period Filter - MULTI-SELECT */}
              <MultiSelectDropdown
                label="Weeks"
                options={filterOptions.weeks.map(w => w.key)}
                selected={filterWeeks}
                onChange={setFilterWeeks}
                renderOption={(key) => {
                  const week = filterOptions.weeks.find(w => w.key === key);
                  return week ? `Week ${week.week}: ${week.label}` : key;
                }}
              />
              
              {/* Instructor Multi-Select */}
              <MultiSelectDropdown
                label="Instructors"
                options={filterOptions.instructors}
                selected={filterInstructors}
                onChange={setFilterInstructors}
              />
              
              {/* Course Multi-Select */}
              <MultiSelectDropdown
                label="Courses"
                options={filterOptions.courses}
                selected={filterCourses}
                onChange={setFilterCourses}
              />
              
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
            
            {/* Active Filter Badges */}
            {(filterWeeks.length > 0 || filterInstructors.length > 0 || filterCourses.length > 0) && (
              <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t">
                {filterWeeks.map(weekKey => {
                  const week = filterOptions.weeks.find(w => w.key === weekKey);
                  return (
                    <span key={weekKey} className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">
                      {week ? `Wk ${week.week}: ${week.label}` : weekKey}
                      <button onClick={() => setFilterWeeks(filterWeeks.filter(w => w !== weekKey))} className="hover:text-purple-900 ml-1">×</button>
                    </span>
                  );
                })}
                {filterInstructors.map(inst => (
                  <span key={inst} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                    {inst}
                    <button onClick={() => setFilterInstructors(filterInstructors.filter(i => i !== inst))} className="hover:text-blue-900 ml-1">×</button>
                  </span>
                ))}
                {filterCourses.map(course => (
                  <span key={course} className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                    {course}
                    <button onClick={() => setFilterCourses(filterCourses.filter(c => c !== course))} className="hover:text-green-900 ml-1">×</button>
                  </span>
                ))}
              </div>
            )}
            
            {/* Sort Toggle */}
            <div className="flex items-center gap-2 mt-3 pt-3 border-t">
              <span className="text-sm font-medium text-gray-600">Group by:</span>
              <button
                onClick={() => setSortBy('vendor')}
                className={`px-3 py-1.5 rounded text-sm font-medium ${sortBy === 'vendor' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                Vendor
              </button>
              <button
                onClick={() => setSortBy('category')}
                className={`px-3 py-1.5 rounded text-sm font-medium ${sortBy === 'category' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                📦 Category
              </button>
            </div>
            
            {/* Filter Summary & Actions */}
            <div className="flex justify-between items-center mt-3 pt-3 border-t">
              <div className="text-sm text-gray-600 flex gap-4">
                {hasActiveFilters && (
                  <span className="text-blue-600 font-medium">
                    Filtered: {filteredRequisitions.length} of {requisitions.length} requisitions
                  </span>
                )}
                {/* Fulfillment Summary */}
                {(() => {
                  let totalItems = 0;
                  let fulfilledItems = 0;
                  Object.values(consolidateByVendor).forEach(vendorData => {
                    vendorData.itemsList.forEach(item => {
                      totalItems++;
                      const onHand = getOnHand(vendorData.vendor || 'Unknown', item.name);
                      const apCalc = calculateAPOrder(item.quantity, item.unit, item.caseSize);
                      const calculatedOrder = Math.max(1, apCalc.casesNeeded || Math.ceil(item.quantity));
                      if (onHand !== '' && onHand >= calculatedOrder) {
                        fulfilledItems++;
                      }
                    });
                  });
                  const remaining = totalItems - fulfilledItems;
                  if (totalItems > 0) {
                    return (
                      <span className="flex gap-3">
                        <span className="text-green-600">✓ {fulfilledItems} fulfilled</span>
                        {remaining > 0 && <span className="text-orange-600">⏳ {remaining} remaining</span>}
                        <span className="text-gray-400">({Math.round(fulfilledItems/totalItems*100)}%)</span>
                      </span>
                    );
                  }
                  return null;
                })()}
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
                        {archive.filters && ((archive.filters.weeks && archive.filters.weeks.length > 0) || (archive.filters.courses && archive.filters.courses.length > 0)) && (
                          <span className="ml-2 text-blue-600">
                            {[
                              archive.filters.weeks?.length > 0 ? `${archive.filters.weeks.length} week(s)` : '',
                              archive.filters.courses?.length > 0 ? archive.filters.courses.join(', ') : ''
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
        {(viewMode === 'current' || selectedArchive) && (
          <>
            {displayVendors.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p>No items match the current filters</p>
                {hasActiveFilters && (
                  <button onClick={clearFilters} className="mt-2 text-blue-600 hover:underline">Clear filters</button>
                )}
              </div>
            ) : sortBy === 'vendor' ? (
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
                            <th className="text-left px-4 py-2 font-medium text-gray-600">Pack Size</th>
                            <th className="text-center px-4 py-2 font-medium text-gray-600">On Hand</th>
                            <th className="text-center px-4 py-2 font-medium text-gray-600 bg-blue-50">Order</th>
                            <th className="text-right px-4 py-2 font-medium text-gray-600">Est. Cost</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.itemsList.map((item, idx) => {
                            const alternatives = vendorAlternatives[item.name?.toLowerCase()] || [];
                            const selectedVendorData = getSelectedVendor(item.name);
                            const hasAlternatives = alternatives.length > 1;
                            
                            const activePackSize = selectedVendorData?.pack_size || item.caseSize;
                            const activeCasePrice = selectedVendorData?.case_price || item.casePrice || item.unitPrice || 0;
                            const activeItemNumber = selectedVendorData?.item_number || item.itemNumber;
                            const activeVendor = selectedVendorData?.vendor || item.vendor;
                            
                            const apCalc = calculateAPOrder(item.quantity, item.unit, activePackSize);
                            const calculatedOrder = Math.max(1, apCalc.casesNeeded || Math.ceil(item.quantity));
                            const isUnit = activePackSize?.startsWith('1/');
                            
                            const onHand = getOnHand(vendor, item.name);
                            const orderOverride = getOrderOverride(vendor, item.name);
                            
                            let effectiveOrder = calculatedOrder;
                            if (orderOverride !== '') {
                              effectiveOrder = orderOverride;
                            } else if (onHand !== '') {
                              effectiveOrder = Math.max(0, calculatedOrder - onHand);
                            }
                            
                            const hasInput = onHand !== '' || orderOverride !== '';
                            const estCost = effectiveOrder * activeCasePrice;
                            
                            return (
                            <tr key={idx} className={`border-b hover:bg-gray-50 ${item.isGrocery ? 'bg-amber-50' : ''} ${hasInput && effectiveOrder === 0 ? 'bg-green-50' : ''}`}>
                              <td className="px-4 py-2 font-mono text-gray-500">{activeItemNumber || '-'}</td>
                              <td className="px-4 py-2">
                                <span className={`font-medium ${hasInput && effectiveOrder === 0 ? 'line-through text-gray-400' : ''}`}>
                                  {item.name}
                                </span>
                                {hasInput && effectiveOrder === 0 && (
                                  <span className="ml-2 text-green-600 text-sm">✓</span>
                                )}
                                {item.isGrocery && (
                                  <span className="ml-2 text-amber-600 text-xs"><CartIcon /> Grocery</span>
                                )}
                                {hasAlternatives && (
                                  <select
                                    value={activeVendor}
                                    onChange={(e) => {
                                      const selected = alternatives.find(a => a.vendor === e.target.value);
                                      if (selected) setVendorOverride(item.name, selected);
                                    }}
                                    className="ml-2 text-xs px-1 py-0.5 border rounded bg-purple-50 text-purple-700"
                                  >
                                    {alternatives.map(alt => (
                                      <option key={alt.id} value={alt.vendor}>
                                        {alt.vendor} - {alt.pack_size} @ ${alt.case_price?.toFixed(2) || '?'}
                                      </option>
                                    ))}
                                  </select>
                                )}
                              </td>
                              <td className="px-4 py-2 text-gray-600">
                                <span className="font-medium">{item.quantity}</span>
                                <span className="text-gray-400 ml-1">{item.unit}</span>
                              </td>
                              <td className="px-4 py-2 text-gray-600 text-xs">
                                {activePackSize || '-'}
                              </td>
                              <td className="px-4 py-2 text-center">
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  value={onHand}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === '' || /^\d*$/.test(val)) {
                                      updateOnHand(vendor, item.name, val, 'case');
                                    }
                                  }}
                                  placeholder="-"
                                  className="w-16 px-2 py-1 text-center border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                                />
                                {getLastCounted(item.name) && (
                                  <div className="text-xs text-gray-400 mt-0.5">{getLastCounted(item.name)}</div>
                                )}
                              </td>
                              <td className="px-4 py-2 text-center bg-blue-50">
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  value={orderOverride !== '' ? orderOverride : effectiveOrder}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === '' || /^\d*$/.test(val)) {
                                      setOrderOverride(vendor, item.name, val);
                                    }
                                  }}
                                  placeholder="-"
                                  className={`w-16 px-2 py-1 text-center border rounded text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-300 ${effectiveOrder > 0 ? 'text-blue-600' : 'text-green-600'}`}
                                />
                                <div className="text-xs text-gray-400">{activePackSize || ''}</div>
                              </td>
                              <td className="px-4 py-2 text-right text-gray-500">{activeCasePrice > 0 ? `$${estCost.toFixed(2)}` : '-'}</td>
                            </tr>
                            );
                          })}
                        </tbody>
                        <tfoot>
                          <tr className="bg-gray-50 font-medium">
                            <td colSpan="6" className="px-4 py-2 text-right">Vendor Total:</td>
                            <td className="px-4 py-2 text-right">{(() => {
                              let total = 0;
                              let hasAnyInput = false;
                              data.itemsList.forEach(item => {
                                const selectedVendorData = getSelectedVendor(item.name);
                                const activePackSize = selectedVendorData?.pack_size || item.caseSize;
                                const activeCasePrice = selectedVendorData?.case_price || item.casePrice || item.unitPrice || 0;
                                
                                const apCalc = calculateAPOrder(item.quantity, item.unit, activePackSize);
                                const calculatedOrder = Math.max(1, apCalc.casesNeeded || Math.ceil(item.quantity));
                                const onHand = getOnHand(vendor, item.name);
                                const orderOverride = getOrderOverride(vendor, item.name);
                                const hasInput = onHand !== '' || orderOverride !== '';
                                if (hasInput) {
                                  hasAnyInput = true;
                                  let effectiveOrder = calculatedOrder;
                                  if (orderOverride !== '') effectiveOrder = orderOverride;
                                  else if (onHand !== '') effectiveOrder = Math.max(0, calculatedOrder - onHand);
                                  total += effectiveOrder * activeCasePrice;
                                }
                              });
                              return hasAnyInput ? `$${total.toFixed(2)}` : '-';
                            })()}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Category View */
              <div className="space-y-6">
                {categoryOrder.filter(cat => consolidateByCategory[cat]).map(category => {
                  const catData = consolidateByCategory[category];
                  if (!catData || catData.items.length === 0) return null;
                  
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
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-gray-50 border-b">
                              <th className="text-left px-4 py-2 font-medium text-gray-600">Item Name</th>
                              <th className="text-left px-4 py-2 font-medium text-gray-600">EP Need</th>
                              <th className="text-left px-4 py-2 font-medium text-gray-600">Pack Size</th>
                              <th className="text-center px-4 py-2 font-medium text-gray-600">On Hand</th>
                              <th className="text-center px-4 py-2 font-medium text-gray-600 bg-blue-50">Order</th>
                              <th className="text-right px-4 py-2 font-medium text-gray-600">Est. Cost</th>
                            </tr>
                          </thead>
                          <tbody>
                            {catData.items.map((item, idx) => {
                              const alternatives = vendorAlternatives[item.name?.toLowerCase()] || [];
                              const selectedVendorData = getSelectedVendor(item.name);
                              const hasAlternatives = alternatives.length > 1;
                              
                              const activePackSize = selectedVendorData?.pack_size || item.caseSize;
                              const activeCasePrice = selectedVendorData?.case_price || item.casePrice || item.unitPrice || 0;
                              const activeVendor = selectedVendorData?.vendor || item.vendor;
                              
                              const apCalc = calculateAPOrder(item.quantity, item.unit, activePackSize);
                              const calculatedOrder = Math.max(1, apCalc.casesNeeded || Math.ceil(item.quantity));
                              const isUnit = activePackSize?.startsWith('1/');
                              
                              const onHand = getOnHand(category, item.name);
                              const orderOverride = getOrderOverride(category, item.name);
                              
                              let effectiveOrder = calculatedOrder;
                              if (orderOverride !== '') {
                                effectiveOrder = orderOverride;
                              } else if (onHand !== '') {
                                effectiveOrder = Math.max(0, calculatedOrder - onHand);
                              }
                              
                              const hasInput = onHand !== '' || orderOverride !== '';
                              const estCost = effectiveOrder * activeCasePrice;
                              
                              return (
                                <tr key={idx} className={`border-b hover:bg-gray-50 ${hasInput && effectiveOrder === 0 ? 'bg-green-50' : ''}`}>
                                  <td className="px-4 py-2">
                                    <span className={`font-medium ${hasInput && effectiveOrder === 0 ? 'line-through text-gray-400' : ''}`}>
                                      {item.name}
                                    </span>
                                    {hasInput && effectiveOrder === 0 && (
                                      <span className="ml-2 text-green-600 text-sm">✓</span>
                                    )}
                                    {hasAlternatives && (
                                      <select
                                        value={activeVendor}
                                        onChange={(e) => {
                                          const selected = alternatives.find(a => a.vendor === e.target.value);
                                          if (selected) setVendorOverride(item.name, selected);
                                        }}
                                        className="ml-2 text-xs px-1 py-0.5 border rounded bg-purple-50 text-purple-700"
                                      >
                                        {alternatives.map(alt => (
                                          <option key={alt.id} value={alt.vendor}>
                                            {alt.vendor} - {alt.pack_size} @ ${alt.case_price?.toFixed(2) || '?'}
                                          </option>
                                        ))}
                                      </select>
                                    )}
                                  </td>
                                  <td className="px-4 py-2 text-gray-600">
                                    <span className="font-medium">{item.quantity}</span>
                                    <span className="text-gray-400 ml-1">{item.unit}</span>
                                  </td>
                                  <td className="px-4 py-2 text-gray-600 text-xs">{activePackSize || '-'}</td>
                                  <td className="px-4 py-2 text-center">
                                    <input
                                      type="text"
                                      inputMode="numeric"
                                      value={onHand}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        if (val === '' || /^\d*$/.test(val)) {
                                          updateOnHand(category, item.name, val, 'case');
                                        }
                                      }}
                                      placeholder="-"
                                      className="w-16 px-2 py-1 text-center border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                                    />
                                    {getLastCounted(item.name) && (
                                      <div className="text-xs text-gray-400 mt-0.5">{getLastCounted(item.name)}</div>
                                    )}
                                  </td>
                                  <td className="px-4 py-2 text-center bg-blue-50">
                                    <input
                                      type="text"
                                      inputMode="numeric"
                                      value={orderOverride !== '' ? orderOverride : effectiveOrder}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        if (val === '' || /^\d*$/.test(val)) {
                                          setOrderOverride(category, item.name, val);
                                        }
                                      }}
                                      placeholder="-"
                                      className={`w-16 px-2 py-1 text-center border rounded text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-300 ${effectiveOrder > 0 ? 'text-blue-600' : 'text-green-600'}`}
                                    />
                                    <div className="text-xs text-gray-400">{activePackSize || ''}</div>
                                  </td>
                                  <td className="px-4 py-2 text-right text-gray-500">{activeCasePrice > 0 ? `$${estCost.toFixed(2)}` : '-'}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Grand Total */}
            {displayVendors.length > 0 && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg flex justify-between items-center">
                <div>
                  <span className="font-medium text-blue-800">Grand Total</span>
                  {hasActiveFilters && <span className="ml-2 text-sm text-blue-600">(filtered)</span>}
                </div>
                <span className="text-2xl font-bold text-blue-800">
                  {(() => {
                    let total = 0;
                    let hasAnyInput = false;
                    Object.entries(displayOrders).forEach(([vendor, v]) => {
                      if (!v || !v.itemsList) return;
                      v.itemsList.forEach(item => {
                        const selectedVendorData = getSelectedVendor(item.name);
                        const activePackSize = selectedVendorData?.pack_size || item.caseSize;
                        const activeCasePrice = selectedVendorData?.case_price || item.casePrice || item.unitPrice || 0;
                        
                        const apCalc = calculateAPOrder(item.quantity, item.unit, activePackSize);
                        const calculatedOrder = Math.max(1, apCalc.casesNeeded || Math.ceil(item.quantity));
                        const onHand = getOnHand(vendor, item.name);
                        const orderOverride = getOrderOverride(vendor, item.name);
                        const hasInput = onHand !== '' || orderOverride !== '';
                        if (hasInput) {
                          hasAnyInput = true;
                          let effectiveOrder = calculatedOrder;
                          if (orderOverride !== '') effectiveOrder = orderOverride;
                          else if (onHand !== '') effectiveOrder = Math.max(0, calculatedOrder - onHand);
                          total += effectiveOrder * activeCasePrice;
                        }
                      });
                    });
                    return hasAnyInput ? `$${total.toFixed(2)}` : '-';
                  })()}
                </span>
              </div>
            )}
          </>
        )}

        {/* Instructor Confirmations Modal */}
        {showConfirmations && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowConfirmations(false)}>
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="bg-green-600 text-white px-6 py-4 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold">📋 Order Confirmations</h2>
                  <p className="text-sm text-green-100">{filterWeeks.length > 0 ? `${filterWeeks.length} week(s) selected` : 'All Weeks'} • {filteredRequisitions.length} requisitions</p>
                </div>
                <button onClick={() => setShowConfirmations(false)} className="text-white hover:text-green-200 text-2xl">&times;</button>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
                {getInstructorConfirmations().length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No requisitions found for current filters.</p>
                ) : (
                  <div className="space-y-6">
                    {getInstructorConfirmations().map((conf, idx) => (
                      <div key={idx} className="border rounded-lg overflow-hidden">
                        <div className="bg-gray-100 px-4 py-3 flex justify-between items-center">
                          <div>
                            <h3 className="font-bold text-lg text-gray-800">{conf.instructor}</h3>
                            <p className="text-sm text-gray-600">{conf.requisitions.length} class{conf.requisitions.length !== 1 ? 'es' : ''}</p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => printConfirmation(conf)}
                              className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 flex items-center gap-1"
                            >
                              <PrintIcon /> Print
                            </button>
                            <button
                              onClick={() => emailConfirmation(conf)}
                              className="px-3 py-1.5 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                            >
                              ✉️ Email
                            </button>
                          </div>
                        </div>
                        
                        <div className="p-4">
                          {conf.requisitions.map((req, reqIdx) => (
                            <div key={reqIdx} className="mb-4 last:mb-0 pb-4 last:pb-0 border-b last:border-b-0">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <span className="font-semibold text-blue-700">{getCourseName(req.course)}</span>
                                  <span className="mx-2 text-gray-400">•</span>
                                  <span className="text-gray-600">{req.classDate ? formatDate(req.classDate) : 'No date'}</span>
                                </div>
                                <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-sm">{req.students} students</span>
                              </div>
                              <div className="text-sm text-gray-600 mb-2">
                                <span className="font-medium">Recipes:</span> {req.recipes || <span className="italic text-gray-400">None specified</span>}
                              </div>
                              <div className="text-sm">
                                <span className="font-medium text-gray-700">Ingredients:</span>
                                <div className="mt-1 flex flex-wrap gap-1">
                                  {req.items.slice(0, 8).map((item, iIdx) => (
                                    <span key={iIdx} className="bg-gray-100 px-2 py-0.5 rounded text-xs">
                                      {item.name} ({item.quantity} {item.unit})
                                    </span>
                                  ))}
                                  {req.items.length > 8 && (
                                    <span className="text-gray-500 text-xs">+{req.items.length - 8} more</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="mt-6 pt-4 border-t flex justify-between items-center">
                  <p className="text-sm text-gray-500">
                    Print or email confirmations to verify orders with instructors.
                  </p>
                  <button
                    onClick={() => {
                      getInstructorConfirmations().forEach(conf => printConfirmation(conf));
                    }}
                    className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                  >
                    Print All
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Invoice Upload Modal */}
        {showInvoiceUpload && invoiceData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              <div className="px-6 py-4 border-b bg-purple-50">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-purple-900">📥 Import Sysco Invoice</h2>
                  <button onClick={() => { setShowInvoiceUpload(false); setInvoiceData(null); setInvoiceMatches([]); }} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
                </div>
                <div className="mt-2 flex gap-4 text-sm">
                  <span><strong>Invoice #:</strong> {invoiceData.invoiceInfo.invoiceNumber}</span>
                  <span><strong>Delivery:</strong> {invoiceData.invoiceInfo.deliveryDate}</span>
                  <span><strong>Total:</strong> ${invoiceData.invoiceInfo.totalAmount?.toFixed(2)}</span>
                  <span><strong>Items:</strong> {invoiceData.invoiceInfo.itemCount}</span>
                </div>
              </div>
              
              <div className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left">SUPC</th>
                      <th className="px-4 py-2 text-left">Invoice Description</th>
                      <th className="px-4 py-2 text-center">Qty</th>
                      <th className="px-4 py-2 text-right">Price</th>
                      <th className="px-4 py-2 text-left">→ Matched Ingredient</th>
                      <th className="px-4 py-2 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoiceMatches.map((item, idx) => (
                      <tr key={idx} className={`border-b ${item.matched ? 'bg-green-50' : 'bg-red-50'}`}>
                        <td className="px-4 py-2 font-mono text-gray-500">{item.supc}</td>
                        <td className="px-4 py-2">
                          <div className="font-medium">{item.description}</div>
                          <div className="text-xs text-gray-500">{item.brand} • {item.packSize}</div>
                        </td>
                        <td className="px-4 py-2 text-center">
                          {item.caseQty > 0 && <span className="font-medium">{item.caseQty} cs</span>}
                          {item.splitQty > 0 && <span className="text-gray-500 ml-1">+{item.splitQty} split</span>}
                        </td>
                        <td className="px-4 py-2 text-right">${item.casePrice?.toFixed(2) || item.eachPrice?.toFixed(2)}</td>
                        <td className="px-4 py-2">
                          {item.matched ? (
                            <div>
                              <span className="font-medium text-green-700">{item.ingredientName}</span>
                              <span className={`ml-2 text-xs px-1 rounded ${item.confidence === 'high' ? 'bg-green-200' : 'bg-yellow-200'}`}>
                                {item.matchType === 'supc' ? 'SUPC' : 'fuzzy'}
                              </span>
                            </div>
                          ) : (
                            <select
                              className="w-full px-2 py-1 border rounded text-sm"
                              value={item.ingredientName}
                              onChange={(e) => {
                                const updated = [...invoiceMatches];
                                updated[idx] = { ...item, ingredientName: e.target.value, matched: !!e.target.value, matchType: 'manual' };
                                setInvoiceMatches(updated);
                              }}
                            >
                              <option value="">-- Select ingredient --</option>
                              {ingredients.sort((a, b) => a.name.localeCompare(b.name)).map(ing => (
                                <option key={ing.id} value={ing.name}>{ing.name}</option>
                              ))}
                            </select>
                          )}
                        </td>
                        <td className="px-4 py-2 text-center">
                          {item.matched ? (
                            <span className="text-green-600">✓</span>
                          ) : (
                            <span className="text-red-500">?</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="px-6 py-4 border-t bg-gray-50 flex justify-between items-center">
                <div className="text-sm">
                  <span className="text-green-600 font-medium">✓ {invoiceMatches.filter(m => m.matched).length} matched</span>
                  <span className="mx-2">•</span>
                  <span className="text-red-500">{invoiceMatches.filter(m => !m.matched).length} unmatched</span>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => { setShowInvoiceUpload(false); setInvoiceData(null); setInvoiceMatches([]); }}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={processInvoice}
                    disabled={processingInvoice || invoiceMatches.filter(m => m.matched).length === 0}
                    className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
                  >
                    {processingInvoice ? 'Processing...' : `Import ${invoiceMatches.filter(m => m.matched).length} Items`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
