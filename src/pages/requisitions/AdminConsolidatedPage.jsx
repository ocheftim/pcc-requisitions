import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase';

const AdminConsolidatedPage = () => {
  // View state - default to pending requisitions
  const [activeView, setActiveView] = useState('pending');
  
  // Data states
  const [pendingRequisitions, setPendingRequisitions] = useState([]);
  const [consolidatedItems, setConsolidatedItems] = useState([]);
  const [inventory, setInventory] = useState({});
  const [vendorCaseSizes, setVendorCaseSizes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Filter states
  const [selectedWeek, setSelectedWeek] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showGroceryOnly, setShowGroceryOnly] = useState(false);

  // Load all data on mount
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadPendingRequisitions(),
        loadInventory(),
        loadVendorCaseSizes()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    }
    setLoading(false);
  };

  const loadPendingRequisitions = async () => {
    const { data, error } = await supabase
      .from('requisitions')
      .select('*')
      .in('status', ['pending', 'submitted'])
      .order('class_date', { ascending: true });
    
    if (error) {
      console.error('Error loading requisitions:', error);
      return;
    }
    setPendingRequisitions(data || []);
    consolidateItems(data || []);
  };

  const loadInventory = async () => {
    const { data, error } = await supabase
      .from('inventory_current')
      .select('*');
    
    if (error) {
      console.error('Error loading inventory:', error);
      return;
    }
    
    const invMap = {};
    (data || []).forEach(item => {
      invMap[item.ingredient_name] = item;
    });
    setInventory(invMap);
  };

  const loadVendorCaseSizes = async () => {
    const { data, error } = await supabase
      .from('vendor_case_sizes')
      .select('*');
    
    if (error) {
      console.error('Error loading vendor case sizes:', error);
      return;
    }
    setVendorCaseSizes(data || []);
  };

  // Consolidate items from all pending requisitions
  const consolidateItems = (requisitions) => {
    const itemMap = {};
    
    requisitions.forEach(req => {
      const items = req.items || [];
      items.forEach(item => {
        const key = item.name || item.id;
        if (!itemMap[key]) {
          itemMap[key] = {
            name: item.name,
            category: item.category || 'Uncategorized',
            subcategory: item.subcategory || '',
            unit: item.unit,
            totalRequested: 0,
            requestedBy: [],
            unitCost: item.unitCost || 0
          };
        }
        itemMap[key].totalRequested += (item.quantity || 0);
        itemMap[key].requestedBy.push({
          instructor: req.instructor,
          course: req.course,
          week: req.week,
          quantity: item.quantity
        });
      });
    });

    const consolidated = Object.values(itemMap).sort((a, b) => {
      if (a.category !== b.category) return a.category.localeCompare(b.category);
      return a.name.localeCompare(b.name);
    });

    setConsolidatedItems(consolidated);
  };

  // Get vendor info for an item
  const getVendorInfo = (itemName) => {
    return vendorCaseSizes.filter(v => 
      v.ingredient_name.toLowerCase() === itemName.toLowerCase()
    );
  };

  // Calculate suggested vendor based on rules
  const suggestVendor = (item, stockOnHand) => {
    const needed = Math.max(item.totalRequested - stockOnHand, 0);
    if (needed === 0) return { vendor: 'None', reason: 'In stock' };

    const vendors = getVendorInfo(item.name);
    const syscoVendor = vendors.find(v => v.vendor === 'Sysco');
    const groceryVendor = vendors.find(v => v.vendor === 'Grocery');
    
    // Check if perishable with small quantity
    const isSmallQty = syscoVendor && needed < (syscoVendor.units_per_case * 0.5);
    const isPerishable = syscoVendor?.is_perishable || groceryVendor?.is_perishable;
    
    // Rule 1: Small quantity perishables -> Grocery
    if (isSmallQty && isPerishable && groceryVendor) {
      return { 
        vendor: 'Grocery', 
        reason: `Need ${needed} ${item.unit}, case is ${syscoVendor?.units_per_case} - perishable`,
        isGrocery: true,
        caseSize: groceryVendor.case_size,
        caseCost: groceryVendor.case_cost,
        casesToOrder: Math.ceil(needed),
        unitsReceived: Math.ceil(needed)
      };
    }
    
    // Rule 2: No Sysco option -> Grocery
    if (!syscoVendor && groceryVendor) {
      return {
        vendor: 'Grocery',
        reason: 'No case option available',
        isGrocery: true,
        caseSize: groceryVendor.case_size,
        caseCost: groceryVendor.case_cost,
        casesToOrder: Math.ceil(needed),
        unitsReceived: Math.ceil(needed)
      };
    }
    
    // Rule 3: Has Sysco case option
    if (syscoVendor) {
      const casesToOrder = Math.ceil(needed / syscoVendor.units_per_case);
      const unitsReceived = casesToOrder * syscoVendor.units_per_case;
      
      return {
        vendor: 'Sysco',
        reason: `${casesToOrder} case(s) of ${syscoVendor.case_size}`,
        isGrocery: false,
        caseSize: syscoVendor.case_size,
        caseCost: syscoVendor.case_cost,
        casesToOrder,
        unitsReceived,
        itemCode: syscoVendor.item_code
      };
    }
    
    // Fallback
    return { vendor: 'Unknown', reason: 'No vendor data', isGrocery: true };
  };

  // Update stock on hand
  const updateStockOnHand = async (itemName, newValue) => {
    const numValue = parseFloat(newValue) || 0;
    
    const { error } = await supabase
      .from('inventory_current')
      .upsert({
        ingredient_name: itemName,
        on_hand: numValue,
        updated_at: new Date().toISOString()
      }, { onConflict: 'ingredient_name' });
    
    if (error) {
      console.error('Error updating inventory:', error);
      return;
    }
    
    setInventory(prev => ({
      ...prev,
      [itemName]: { ...prev[itemName], on_hand: numValue, ingredient_name: itemName }
    }));
  };

  // Override vendor selection
  const overrideVendor = (itemName, vendor) => {
    setConsolidatedItems(prev => prev.map(item => 
      item.name === itemName ? { ...item, overrideVendor: vendor } : item
    ));
  };

  // Approve requisition
  const approveRequisition = async (id) => {
    const { error } = await supabase
      .from('requisitions')
      .update({ status: 'approved', updated_at: new Date().toISOString() })
      .eq('id', id);
    
    if (!error) {
      loadPendingRequisitions();
    }
  };

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set(consolidatedItems.map(item => item.category));
    return ['all', ...Array.from(cats).sort()];
  }, [consolidatedItems]);

  // Get unique weeks
  const weeks = useMemo(() => {
    const wks = new Set(pendingRequisitions.map(req => req.week));
    return ['all', ...Array.from(wks).sort()];
  }, [pendingRequisitions]);

  // Filter consolidated items
  const filteredItems = useMemo(() => {
    return consolidatedItems.filter(item => {
      if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
      
      const stockOnHand = inventory[item.name]?.on_hand || 0;
      const suggestion = suggestVendor(item, stockOnHand);
      
      if (showGroceryOnly && !suggestion.isGrocery) return false;
      
      return true;
    });
  }, [consolidatedItems, selectedCategory, showGroceryOnly, inventory]);

  // Calculate totals
  const totals = useMemo(() => {
    let syscoTotal = 0;
    let groceryTotal = 0;
    let groceryItems = 0;
    
    filteredItems.forEach(item => {
      const stockOnHand = inventory[item.name]?.on_hand || 0;
      const suggestion = suggestVendor(item, stockOnHand);
      
      if (suggestion.vendor === 'Sysco' && suggestion.casesToOrder > 0) {
        syscoTotal += (suggestion.casesToOrder * suggestion.caseCost);
      } else if (suggestion.isGrocery && suggestion.casesToOrder > 0) {
        groceryTotal += (suggestion.casesToOrder * suggestion.caseCost);
        groceryItems++;
      }
    });
    
    return { syscoTotal, groceryTotal, groceryItems };
  }, [filteredItems, inventory]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600">Manage requisitions and consolidated orders</p>
      </div>

      {/* View Tabs */}
      <div className="flex gap-2 mb-6 border-b">
        <button
          onClick={() => setActiveView('pending')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeView === 'pending' 
              ? 'border-blue-600 text-blue-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Pending Requisitions
          {pendingRequisitions.length > 0 && (
            <span className="ml-2 px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded-full">
              {pendingRequisitions.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveView('consolidated')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeView === 'consolidated' 
              ? 'border-blue-600 text-blue-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Consolidated Orders
        </button>
        <button
          onClick={() => setActiveView('grocery')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeView === 'grocery' 
              ? 'border-green-600 text-green-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Grocery List
          {totals.groceryItems > 0 && (
            <span className="ml-2 px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">
              {totals.groceryItems}
            </span>
          )}
        </button>
      </div>

      {/* Pending Requisitions View */}
      {activeView === 'pending' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Pending Requisitions</h2>
            <button 
              onClick={loadPendingRequisitions}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
            >
              Refresh
            </button>
          </div>
          
          {pendingRequisitions.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-500">No pending requisitions</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingRequisitions.map(req => (
                <div key={req.id} className="bg-white border rounded-lg p-4 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium text-gray-900">
                        {req.course} - {req.week}
                      </div>
                      <div className="text-sm text-gray-600">
                        {req.instructor} • {req.class_date} • {req.students} students
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {(req.items || []).length} items • Budget: ${req.budget?.toFixed(2) || '0.00'}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        req.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        req.status === 'submitted' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {req.status}
                      </span>
                      <button
                        onClick={() => approveRequisition(req.id)}
                        className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        Approve
                      </button>
                    </div>
                  </div>
                  
                  {/* Expandable items preview */}
                  <details className="mt-3">
                    <summary className="text-sm text-blue-600 cursor-pointer hover:underline">
                      View items ({(req.items || []).length})
                    </summary>
                    <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                      {(req.items || []).slice(0, 8).map((item, idx) => (
                        <div key={idx} className="bg-gray-50 px-2 py-1 rounded">
                          {item.quantity} {item.unit} {item.name}
                        </div>
                      ))}
                      {(req.items || []).length > 8 && (
                        <div className="text-gray-500">+{(req.items || []).length - 8} more...</div>
                      )}
                    </div>
                  </details>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Consolidated Orders View */}
      {(activeView === 'consolidated' || activeView === 'grocery') && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-4 items-center bg-gray-50 p-4 rounded-lg">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="border rounded px-3 py-1.5 text-sm"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat === 'all' ? 'All Categories' : cat}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-xs text-gray-500 mb-1">Week</label>
              <select
                value={selectedWeek}
                onChange={(e) => setSelectedWeek(e.target.value)}
                className="border rounded px-3 py-1.5 text-sm"
              >
                {weeks.map(wk => (
                  <option key={wk} value={wk}>
                    {wk === 'all' ? 'All Weeks' : wk}
                  </option>
                ))}
              </select>
            </div>

            <div className="ml-auto flex gap-4 items-center">
              <div className="text-sm">
                <span className="text-gray-500">Sysco Total:</span>
                <span className="ml-2 font-semibold text-blue-700">${totals.syscoTotal.toFixed(2)}</span>
              </div>
              <div className="text-sm">
                <span className="text-gray-500">Grocery:</span>
                <span className="ml-2 font-semibold text-green-700">${totals.groceryTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto bg-white rounded-lg border shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-700">Item</th>
                  <th className="text-center px-3 py-3 font-medium text-gray-700 w-24">Stock</th>
                  <th className="text-center px-3 py-3 font-medium text-gray-700 w-24">Needed</th>
                  <th className="text-center px-3 py-3 font-medium text-gray-700 w-28">Order</th>
                  <th className="text-center px-3 py-3 font-medium text-gray-700 w-28">Vendor</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-700 w-24">Cost</th>
                  <th className="text-left px-3 py-3 font-medium text-gray-700">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredItems
                  .filter(item => activeView === 'grocery' ? suggestVendor(item, inventory[item.name]?.on_hand || 0).isGrocery : true)
                  .map((item, idx) => {
                    const stockOnHand = inventory[item.name]?.on_hand || 0;
                    const needed = Math.max(item.totalRequested - stockOnHand, 0);
                    const suggestion = suggestVendor(item, stockOnHand);
                    const isGrocery = suggestion.isGrocery;
                    
                    return (
                      <tr 
                        key={idx} 
                        className={`hover:bg-gray-50 ${isGrocery ? 'bg-green-50' : ''}`}
                      >
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">{item.name}</div>
                          <div className="text-xs text-gray-500">{item.category} • {item.unit}</div>
                        </td>
                        
                        {/* Stock - Editable */}
                        <td className="px-3 py-3 text-center">
                          <input
                            type="number"
                            value={stockOnHand}
                            onChange={(e) => updateStockOnHand(item.name, e.target.value)}
                            className="w-20 text-center border rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            min="0"
                            step="0.5"
                          />
                        </td>
                        
                        {/* Needed - Calculated */}
                        <td className="px-3 py-3 text-center">
                          <span className={`font-medium ${needed > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {needed > 0 ? needed.toFixed(1) : '✓'}
                          </span>
                          <div className="text-xs text-gray-400">
                            of {item.totalRequested} {item.unit}
                          </div>
                        </td>
                        
                        {/* Order */}
                        <td className="px-3 py-3 text-center">
                          {suggestion.casesToOrder > 0 ? (
                            <div>
                              <div className="font-medium">{suggestion.casesToOrder}</div>
                              <div className="text-xs text-gray-500">{suggestion.caseSize}</div>
                            </div>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        
                        {/* Vendor */}
                        <td className="px-3 py-3 text-center">
                          <select
                            value={item.overrideVendor || suggestion.vendor}
                            onChange={(e) => overrideVendor(item.name, e.target.value)}
                            className={`text-xs px-2 py-1 rounded border ${
                              isGrocery 
                                ? 'bg-green-100 border-green-300 text-green-800' 
                                : 'bg-blue-100 border-blue-300 text-blue-800'
                            }`}
                          >
                            <option value="Sysco">Sysco</option>
                            <option value="Shamrock">Shamrock</option>
                            <option value="Grocery">Grocery</option>
                            <option value="None">None</option>
                          </select>
                        </td>
                        
                        {/* Cost */}
                        <td className="px-4 py-3 text-right">
                          {suggestion.casesToOrder > 0 ? (
                            <span className="font-medium">
                              ${(suggestion.casesToOrder * suggestion.caseCost).toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        
                        {/* Notes */}
                        <td className="px-3 py-3 text-xs text-gray-500">
                          {suggestion.reason}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center pt-4">
            <div className="text-sm text-gray-500">
              {filteredItems.length} items • {totals.groceryItems} for grocery run
            </div>
            <div className="flex gap-3">
              <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                Print Grocery List
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                Generate Sysco Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminConsolidatedPage;
