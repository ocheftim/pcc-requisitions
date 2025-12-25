import React, { useState, useEffect } from 'react';
import consolidatedData from '../../data/test/consolidated-requisition-week6.json';

export default function ManagementConsolidatedPage() {
  const [items, setItems] = useState([]);
  const [inventory, setInventory] = useState({});
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedVendor, setSelectedVendor] = useState('peddlers');

  useEffect(() => {
    if (consolidatedData && consolidatedData.items) {
      setItems(consolidatedData.items);
      
      // Initialize inventory (On-Hand) to 0 for all items
      const initialInventory = {};
      consolidatedData.items.forEach(item => {
        initialInventory[item.ingredientId || item.ingredientName] = 0;
      });
      setInventory(initialInventory);
    }
  }, []);

  const updateInventory = (itemKey, value) => {
    setInventory(prev => ({
      ...prev,
      [itemKey]: parseFloat(value) || 0
    }));
  };

  const updateRequested = (itemIndex, value) => {
    setItems(prev => {
      const updated = [...prev];
      updated[itemIndex] = {
        ...updated[itemIndex],
        requestedQty: parseFloat(value) || 0
      };
      return updated;
    });
  };

  // Parse case pack to get quantity per case
  const parseCasePack = (packSize) => {
    if (!packSize) return 1;
    
    // Examples: "36/1LB" = 36, "15 DZ" = 15, "5 LBS" = 5, "115ct" = 115
    const match = packSize.match(/(\d+)/);
    return match ? parseInt(match[1]) : 1;
  };

  // Calculate cases needed (round up to full cases)
  const calculateCasesNeeded = (epNeed, vendor, item) => {
    if (epNeed <= 0) return 0;
    
    let packSize = '';
    if (vendor === 'shamrock') packSize = item.shamrockPackSize || '';
    if (vendor === 'peddlers') packSize = item.peddlersPackSize || '';
    
    if (!packSize) return Math.ceil(epNeed); // Default: 1 unit per case
    
    const unitsPerCase = parseCasePack(packSize);
    return Math.ceil(epNeed / unitsPerCase);
  };

  // Calculate order quantity in EP units (what we'll actually receive)
  const calculateOrderEP = (requested, onHand, vendor, item) => {
    const epNeed = requested - onHand;
    if (epNeed <= 0) return 0;
    
    const casesNeeded = calculateCasesNeeded(epNeed, vendor, item);
    
    let packSize = '';
    if (vendor === 'shamrock') packSize = item.shamrockPackSize || '';
    if (vendor === 'peddlers') packSize = item.peddlersPackSize || '';
    
    const unitsPerCase = parseCasePack(packSize);
    return casesNeeded * unitsPerCase;
  };

  // Calculate cost for item
  const calculateItemCost = (requested, onHand, vendor, item) => {
    const epNeed = requested - onHand;
    if (epNeed <= 0) return 0;
    
    const casesNeeded = calculateCasesNeeded(epNeed, vendor, item);
    
    let pricePerCase = 0;
    if (vendor === 'shamrock') pricePerCase = item.shamrockPrice || 0;
    if (vendor === 'peddlers') pricePerCase = item.peddlersPrice || 0;
    
    return casesNeeded * pricePerCase;
  };

  // Calculate vendor totals
  const calculateVendorTotal = (vendor) => {
    return items.reduce((sum, item) => {
      const key = item.ingredientId || item.ingredientName;
      const onHand = inventory[key] || 0;
      return sum + calculateItemCost(item.requestedQty, onHand, vendor, item);
    }, 0);
  };

  // Get vendor minimums
  const vendorMinimums = {
    shamrock: 300,
    peddlers: 150,
    sysco: 250,
    merit: 200
  };

  const meetsMinimum = (vendor) => {
    const total = calculateVendorTotal(vendor);
    return total >= vendorMinimums[vendor];
  };

  const getBestVendor = () => {
    const vendors = ['shamrock', 'peddlers'];
    const totals = vendors.map(v => ({
      vendor: v,
      total: calculateVendorTotal(v),
      meetsMin: meetsMinimum(v)
    }));
    
    // Filter to only vendors that meet minimum
    const eligible = totals.filter(v => v.meetsMin && v.total > 0);
    
    if (eligible.length === 0) return null;
    
    // Return cheapest eligible vendor
    return eligible.reduce((best, current) => 
      current.total < best.total ? current : best
    );
  };

  const exportToCSV = () => {
    let csv = 'Purchase Order - Week 6\n';
    csv += `Generated: ${new Date().toLocaleDateString()}\n`;
    csv += `Vendor: ${selectedVendor === 'shamrock' ? 'Shamrock Foods' : "Peddler's Son"}\n`;
    csv += `Orders: ${consolidatedData.orders.map(o => `${o.instructor} ${o.course}`).join(', ')}\n\n`;
    csv += 'Item,Requested (EP),On-Hand (EP),Need (EP),Cases to Order,Units Received (AP),Unit Cost,Extended,Vendor Code\n';
    
    let orderTotal = 0;
    
    items.forEach(item => {
      const key = item.ingredientId || item.ingredientName;
      const onHand = inventory[key] || 0;
      const epNeed = item.requestedQty - onHand;
      
      if (epNeed > 0) {
        const cases = calculateCasesNeeded(epNeed, selectedVendor, item);
        const orderEP = calculateOrderEP(item.requestedQty, onHand, selectedVendor, item);
        const itemCost = calculateItemCost(item.requestedQty, onHand, selectedVendor, item);
        
        const code = selectedVendor === 'shamrock' ? item.shamrockCode : item.peddlersCode;
        const pricePerCase = selectedVendor === 'shamrock' ? item.shamrockPrice : item.peddlersPrice;
        
        csv += `"${item.ingredientName}",${item.requestedQty},${onHand},${epNeed.toFixed(1)},${cases},${orderEP},${pricePerCase.toFixed(2)},${itemCost.toFixed(2)},${code}\n`;
        orderTotal += itemCost;
      }
    });
    
    csv += `\n,,,,,TOTAL:,$${orderTotal.toFixed(2)}\n`;
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PO_${selectedVendor}_week6_${Date.now()}.csv`;
    a.click();
  };

  // Get unique categories
  const categories = ['ALL', ...new Set(items.map(item => item.category))].sort();

  // Filter items by category
  const filteredItems = selectedCategory === 'ALL' 
    ? items 
    : items.filter(item => item.category === selectedCategory);

  // Group items by category
  const itemsByCategory = filteredItems.reduce((acc, item) => {
    const category = item.category || 'Unknown';
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {});

  const bestVendor = getBestVendor();
  const shamrockTotal = calculateVendorTotal('shamrock');
  const peddlersTotal = calculateVendorTotal('peddlers');
  const savings = Math.abs(shamrockTotal - peddlersTotal);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Consolidated Requisition - Week 6</h1>
        <p className="text-gray-600">EP (Edible Portion) ordering with AP (As Purchased) case conversion</p>
      </div>

      {/* Vendor Comparison Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className={`bg-white rounded-lg shadow-sm p-4 border-l-4 ${
          selectedVendor === 'shamrock' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
        }`}>
          <div className="flex justify-between items-start mb-2">
            <div>
              <div className="text-sm font-medium text-gray-600">Shamrock Foods</div>
              <div className="text-2xl font-bold text-gray-900">${shamrockTotal.toFixed(2)}</div>
            </div>
            <button
              onClick={() => setSelectedVendor('shamrock')}
              className={`px-3 py-1 rounded text-sm ${
                selectedVendor === 'shamrock' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Select
            </button>
          </div>
          <div className="text-xs text-gray-600">
            Minimum: ${vendorMinimums.shamrock} {meetsMinimum('shamrock') ? '✓' : '✗'}
          </div>
          {bestVendor && bestVendor.vendor === 'shamrock' && (
            <div className="mt-2 text-xs font-semibold text-green-600">🏆 Best Price</div>
          )}
        </div>

        <div className={`bg-white rounded-lg shadow-sm p-4 border-l-4 ${
          selectedVendor === 'peddlers' ? 'border-green-500 bg-green-50' : 'border-gray-300'
        }`}>
          <div className="flex justify-between items-start mb-2">
            <div>
              <div className="text-sm font-medium text-gray-600">Peddler's Son</div>
              <div className="text-2xl font-bold text-gray-900">${peddlersTotal.toFixed(2)}</div>
            </div>
            <button
              onClick={() => setSelectedVendor('peddlers')}
              className={`px-3 py-1 rounded text-sm ${
                selectedVendor === 'peddlers' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Select
            </button>
          </div>
          <div className="text-xs text-gray-600">
            Minimum: ${vendorMinimums.peddlers} {meetsMinimum('peddlers') ? '✓' : '✗'}
          </div>
          {bestVendor && bestVendor.vendor === 'peddlers' && (
            <div className="mt-2 text-xs font-semibold text-green-600">🏆 Best Price</div>
          )}
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="text-sm font-medium text-gray-600">Savings Opportunity</div>
          <div className="text-2xl font-bold text-orange-600">${savings.toFixed(2)}</div>
          <div className="text-xs text-gray-600 mt-1">
            {bestVendor ? `Save by ordering from ${bestVendor.vendor === 'shamrock' ? 'Shamrock' : "Peddler's"}` : 'Compare vendors'}
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Category:</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div className="text-sm text-gray-600">
            Showing {filteredItems.length} of {items.length} items
          </div>
        </div>
        <button
          onClick={exportToCSV}
          className="px-4 py-2 text-white rounded-lg bg-green-600 hover:bg-green-700"
        >
          Generate PO - {selectedVendor === 'shamrock' ? 'Shamrock' : "Peddler's"}
        </button>
      </div>

      {/* Order Breakdown */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <h3 className="font-semibold mb-3">Orders Included:</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {consolidatedData.orders.map((order, idx) => (
            <div key={idx} className="bg-gray-50 rounded-lg p-3">
              <div className="text-xs text-gray-500 mb-1">{order.day}</div>
              <div className="font-medium text-gray-900">{order.instructor}</div>
              <div className="text-sm text-gray-600">{order.course}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Items Table with EP/AP Conversion */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-3 py-3 text-left font-semibold text-gray-700">Item</th>
                <th className="px-3 py-3 text-center font-semibold text-gray-700">Unit</th>
                <th className="px-3 py-3 text-right font-semibold text-gray-700 bg-green-50">Requested<br/><span className="text-xs font-normal">(EP)</span></th>
                <th className="px-3 py-3 text-right font-semibold text-gray-700 bg-yellow-50">On-Hand<br/><span className="text-xs font-normal">(EP)</span></th>
                <th className="px-3 py-3 text-right font-semibold text-gray-700 bg-red-50">Need<br/><span className="text-xs font-normal">(EP)</span></th>
                <th className="px-3 py-3 text-right font-semibold text-gray-700 bg-blue-100">Cases<br/><span className="text-xs font-normal">(AP)</span></th>
                <th className="px-3 py-3 text-right font-semibold text-gray-700 bg-blue-50">Receive<br/><span className="text-xs font-normal">(AP)</span></th>
                <th className="px-3 py-3 text-right font-semibold text-gray-700">$/Case</th>
                <th className="px-3 py-3 text-right font-semibold text-gray-700">Extended</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {Object.entries(itemsByCategory).map(([category, categoryItems]) => (
                <React.Fragment key={category}>
                  <tr className="bg-gray-100">
                    <td colSpan="9" className="px-3 py-2 font-semibold text-gray-700">
                      {category}
                    </td>
                  </tr>
                  {categoryItems.map((item, idx) => {
                    const itemIndex = items.findIndex(i => 
                      (i.ingredientId && i.ingredientId === item.ingredientId) || 
                      i.ingredientName === item.ingredientName
                    );
                    const key = item.ingredientId || item.ingredientName;
                    const onHand = inventory[key] || 0;
                    const epNeed = Math.max(0, item.requestedQty - onHand);
                    const cases = calculateCasesNeeded(epNeed, selectedVendor, item);
                    const orderEP = calculateOrderEP(item.requestedQty, onHand, selectedVendor, item);
                    const itemCost = calculateItemCost(item.requestedQty, onHand, selectedVendor, item);
                    
                    const pricePerCase = selectedVendor === 'shamrock' ? item.shamrockPrice : item.peddlersPrice;
                    const packSize = selectedVendor === 'shamrock' ? item.shamrockPackSize : item.peddlersPackSize;
                    const code = selectedVendor === 'shamrock' ? item.shamrockCode : item.peddlersCode;
                    
                    return (
                      <tr
                        key={key}
                        className={idx % 2 === 0 ? 'bg-white hover:bg-gray-50' : 'bg-gray-50 hover:bg-gray-100'}
                      >
                        <td className="px-3 py-3">
                          <div className="font-medium text-gray-900">{item.ingredientName}</div>
                          {code && <div className="text-xs text-gray-500">{code}</div>}
                          {packSize && <div className="text-xs text-blue-600">{packSize}</div>}
                        </td>
                        <td className="px-3 py-3 text-center text-gray-600">
                          {item.unit}
                        </td>
                        <td className="px-3 py-3 text-right bg-green-50">
                          <input
                            type="number"
                            min="0"
                            step="0.1"
                            value={item.requestedQty}
                            onChange={(e) => updateRequested(itemIndex, e.target.value)}
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-right font-semibold"
                            style={{backgroundColor: '#dcfce7'}}
                          />
                        </td>
                        <td className="px-3 py-3 text-right bg-yellow-50">
                          <input
                            type="number"
                            min="0"
                            step="0.1"
                            value={onHand}
                            onChange={(e) => updateInventory(key, e.target.value)}
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-right"
                            style={{backgroundColor: '#fef3c7'}}
                          />
                        </td>
                        <td className="px-3 py-3 text-right font-semibold text-red-700 bg-red-50">
                          {epNeed.toFixed(1)}
                        </td>
                        <td className="px-3 py-3 text-right font-bold text-blue-900 bg-blue-100">
                          {cases}
                        </td>
                        <td className="px-3 py-3 text-right font-semibold text-blue-700 bg-blue-50">
                          {orderEP}
                        </td>
                        <td className="px-3 py-3 text-right text-gray-700">
                          {pricePerCase > 0 ? `$${pricePerCase.toFixed(2)}` : '-'}
                        </td>
                        <td className="px-3 py-3 text-right font-bold text-gray-900">
                          {itemCost > 0 ? `$${itemCost.toFixed(2)}` : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </React.Fragment>
              ))}
            </tbody>
            <tfoot className="bg-gray-50 border-t-2 border-gray-300">
              <tr>
                <td colSpan="8" className="px-3 py-3 text-right font-bold text-gray-900">
                  ORDER TOTAL:
                </td>
                <td className="px-3 py-3 text-right font-bold text-green-700 text-lg">
                  ${calculateVendorTotal(selectedVendor).toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">EP/AP Conversion Guide:</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• <strong>EP (Edible Portion)</strong>: What instructors request and what's in inventory (5 lb, 12 ea)</li>
          <li>• <strong>AP (As Purchased)</strong>: What we buy in cases (36/1LB case, 115ct case)</li>
          <li>• <strong>Cases</strong>: Rounded UP to full cases (can't order partial cases)</li>
          <li>• <strong>Receive</strong>: AP units you'll actually receive (may be more than needed)</li>
          <li>• <strong>Perpetual Inventory</strong>: On-Hand persists week-to-week and updates when receiving</li>
        </ul>
      </div>
    </div>
  );
}
