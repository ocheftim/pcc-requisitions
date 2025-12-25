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
  const [filterWeek, setFilterWeek] = useState('all');
  const [filterInstructor, setFilterInstructor] = useState('all');
  const [filterCourse, setFilterCourse] = useState('all');
  const [filterItemType, setFilterItemType] = useState('all'); // all, perishable, non-perishable
  const [showGroceryOnly, setShowGroceryOnly] = useState(false);

  useEffect(() => { loadData(); loadArchivedOrders(); }, []);

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
      // Week filter - compare by Monday ISO date key
      if (filterWeek !== "all" && req.class_date) {
        const { start } = getWeekRange(req.class_date);
        const reqWeekKey = start.toISOString().split("T")[0];
        if (reqWeekKey !== filterWeek) return false;
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
            price: ing.case_price || 0,
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
          .total { margin-top: 20px; text-align: right; font-weight: bold; }
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
              <th>Case Size</th>
              <th>Qty</th>
              <th>Unit</th>
              <th>Est. Cost</th>
            </tr>
          </thead>
          <tbody>
            ${items.map(item => `
              <tr class="${item.isGrocery ? 'grocery' : ''}">
                <td>${item.itemNumber || '-'}</td>
                <td>
                  ${item.name}
                  ${item.isGrocery ? '<br><span class="grocery-label">🛒 Consider grocery store</span>' : ''}
                </td>
                <td>${item.caseSize || '-'}</td>
                <td>${item.quantity}</td>
                <td>${item.unit}</td>
                <td>$${((item.unitPrice || 0) * item.quantity).toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="total">Total: $${items.reduce((sum, i) => sum + ((i.unitPrice || 0) * i.quantity), 0).toFixed(2)}</div>
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
            <button onClick={() => { setViewMode('current'); setSelectedArchive(null); }} className={`px-4 py-2 rounded font-medium transition-colors ${viewMode === 'current' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Current</button>
            <button onClick={() => setViewMode('archive')} className={`px-4 py-2 rounded font-medium transition-colors flex items-center gap-2 ${viewMode === 'archive' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}><ArchiveIcon />Archive ({archivedOrders.length})</button>
          </div>
        </div>

        {/* Filters Section */}
        {viewMode === 'current' && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
            <div className="flex flex-wrap gap-3 items-center">
              <label className="text-sm font-medium text-gray-600">Filters:</label>
              
              {/* Week Filter */}
              <select value={filterWeek} onChange={(e) => setFilterWeek(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
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
        {(viewMode === 'current' || selectedArchive) && (
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
                            <th className="text-left px-4 py-2 font-medium text-gray-600">Category</th>
                            <th className="text-left px-4 py-2 font-medium text-gray-600">Case Size</th>
                            <th className="text-right px-4 py-2 font-medium text-gray-600">Qty</th>
                            <th className="text-left px-4 py-2 font-medium text-gray-600">Unit</th>
                            <th className="text-right px-4 py-2 font-medium text-gray-600">Est. Cost</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.itemsList.map((item, idx) => (
                            <tr key={idx} className={`border-b hover:bg-gray-50 ${item.isGrocery ? 'bg-amber-50' : ''}`}>
                              <td className="px-4 py-2 font-mono text-gray-500">{item.itemNumber || '-'}</td>
                              <td className="px-4 py-2">
                                <span className="font-medium">{item.name}</span>
                                {item.isGrocery && (
                                  <span className="ml-2 text-amber-600 text-xs"><CartIcon /> Grocery</span>
                                )}
                              </td>
                              <td className="px-4 py-2 text-gray-500 text-xs">{item.subcategory || item.category}</td>
                              <td className="px-4 py-2 text-gray-600">{item.caseSize || '-'}</td>
                              <td className="px-4 py-2 text-right font-medium">{item.quantity}</td>
                              <td className="px-4 py-2 text-gray-600">{item.unit}</td>
                              <td className="px-4 py-2 text-right">${((item.unitPrice || 0) * item.quantity).toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="bg-gray-50 font-medium">
                            <td colSpan="6" className="px-4 py-2 text-right">Vendor Total:</td>
                            <td className="px-4 py-2 text-right">${data.totalValue.toFixed(2)}</td>
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
                  <span className="font-medium text-blue-800">Grand Total</span>
                  {hasActiveFilters && <span className="ml-2 text-sm text-blue-600">(filtered)</span>}
                </div>
                <span className="text-2xl font-bold text-blue-800">
                  ${Object.values(displayOrders).reduce((sum, v) => sum + (v.totalValue || 0), 0).toFixed(2)}
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
