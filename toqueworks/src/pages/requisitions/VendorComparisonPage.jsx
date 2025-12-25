import React, { useState } from 'react';
import { ingredientsList } from '../../data/ingredients/ingredientsList';

const vendors = ['shamrock', 'peddlers'];
const vendorNames = {
  shamrock: 'Shamrock Foods',
  peddlers: "Peddler's Son"
};

export default function VendorComparisonPage() {
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedItems, setSelectedItems] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [sortBy, setSortBy] = useState('name');
  const [showOnlySelected, setShowOnlySelected] = useState(false);

  const categories = ['ALL', ...new Set(ingredientsList.map(item => item.category))];

  const getVendorPrice = (item, vendor) => {
    if (vendor === 'shamrock') return item.shamrockPrice || 0;
    if (vendor === 'peddlers') return item.peddlersPrice || 0;
    return 0;
  };

  const getVendorCode = (item, vendor) => {
    if (vendor === 'shamrock') return item.shamrockCode || '';
    if (vendor === 'peddlers') return item.peddlersCode || '';
    return '';
  };

  const hasAnyPricing = (item) => {
    return vendors.some(v => getVendorPrice(item, v) > 0);
  };

  const filteredItems = showOnlySelected 
    ? ingredientsList.filter(item => selectedItems.includes(item.id))
    : selectedCategory === 'ALL' 
      ? ingredientsList.filter(item => hasAnyPricing(item))
      : ingredientsList.filter(item => item.category === selectedCategory && hasAnyPricing(item));

  const calculateItemSavings = (item) => {
    const prices = vendors.map(v => getVendorPrice(item, v)).filter(p => p > 0);
    if (prices.length === 0) return 0;
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    return max - min;
  };

  const sortedItems = [...filteredItems].sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'savings') {
      const aSavings = calculateItemSavings(a);
      const bSavings = calculateItemSavings(b);
      return bSavings - aSavings;
    }
    return 0;
  });

  const toggleItemSelection = (itemId) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
    
    if (!quantities[itemId]) {
      setQuantities(prev => ({ ...prev, [itemId]: 1 }));
    }
  };

  const updateQuantity = (itemId, quantity) => {
    setQuantities(prev => ({ ...prev, [itemId]: Math.max(1, quantity) }));
  };

  const calculateTotalForVendor = (vendor) => {
    return selectedItems.reduce((sum, itemId) => {
      const item = ingredientsList.find(i => i.id === itemId);
      const quantity = quantities[itemId] || 1;
      const price = getVendorPrice(item, vendor);
      return sum + (price * quantity);
    }, 0);
  };

  const calculateSavings = () => {
    const vendorTotals = vendors.map(v => calculateTotalForVendor(v)).filter(t => t > 0);
    if (vendorTotals.length === 0) return 0;
    const min = Math.min(...vendorTotals);
    const max = Math.max(...vendorTotals);
    return max - min;
  };

  const getBestVendorForItem = (item) => {
    let best = { vendor: null, price: Infinity };
    vendors.forEach(vendor => {
      const price = getVendorPrice(item, vendor);
      if (price > 0 && price < best.price) {
        best = { vendor, price };
      }
    });
    return best;
  };

  const getWorstVendorForItem = (item) => {
    let worst = { vendor: null, price: -Infinity };
    vendors.forEach(vendor => {
      const price = getVendorPrice(item, vendor);
      if (price > 0 && price > worst.price) {
        worst = { vendor, price };
      }
    });
    return worst;
  };

  const getPriceDifference = (item, vendor) => {
    const best = getBestVendorForItem(item);
    const currentPrice = getVendorPrice(item, vendor);
    if (currentPrice === 0 || best.price === Infinity) return 0;
    return currentPrice - best.price;
  };

  const exportComparison = () => {
    let csv = 'Vendor Price Comparison\n';
    csv += `Generated: ${new Date().toLocaleString()}\n\n`;
    
    csv += 'Item,Unit';
    vendors.forEach(v => {
      csv += `,${vendorNames[v]}`;
    });
    csv += ',Best Price,Savings\n';
    
    selectedItems.forEach(itemId => {
      const item = ingredientsList.find(i => i.id === itemId);
      const best = getBestVendorForItem(item);
      const worst = getWorstVendorForItem(item);
      const savings = worst.price - best.price;
      
      csv += `"${item.name}",${item.unit}`;
      vendors.forEach(v => {
        const price = getVendorPrice(item, v);
        csv += `,$${price > 0 ? price.toFixed(2) : 'N/A'}`;
      });
      csv += `,$${best.price < Infinity ? best.price.toFixed(2) : 'N/A'},$${savings.toFixed(2)}\n`;
    });
    
    csv += '\nVendor Totals\n';
    csv += ',';
    vendors.forEach(v => {
      csv += `,$${calculateTotalForVendor(v).toFixed(2)}`;
    });
    csv += `\n,Potential Savings:,$${calculateSavings().toFixed(2)}\n`;
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vendor_comparison_${Date.now()}.csv`;
    a.click();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Vendor Price Comparison</h1>
        <p className="text-gray-600">Compare prices between Shamrock Foods and Peddler's Son</p>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="name">Name (A-Z)</option>
              <option value="savings">Savings (High to Low)</option>
            </select>
          </div>

          <div className="flex items-end">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={showOnlySelected}
                onChange={(e) => setShowOnlySelected(e.target.checked)}
                className="mr-2 w-4 h-4 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Show Selected Only</span>
            </label>
          </div>

          <div className="flex items-end">
            <button
              onClick={exportComparison}
              disabled={selectedItems.length === 0}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Export CSV
            </button>
          </div>
        </div>

        {/* Selection Summary */}
        {selectedItems.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <div>
                <div className="font-semibold text-gray-900">
                  {selectedItems.length} items selected
                </div>
                <div className="text-sm text-gray-600">
                  Potential savings: ${calculateSavings().toFixed(2)}
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedItems([]);
                  setQuantities({});
                }}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Clear Selection
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Items with Pricing Notice */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-yellow-800">
          Showing {filteredItems.length} items with pricing data. Items without vendor pricing are hidden.
        </p>
      </div>

      {/* Comparison Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left w-10">
                  <input
                    type="checkbox"
                    checked={selectedItems.length === sortedItems.length && sortedItems.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedItems(sortedItems.map(i => i.id));
                        const newQuantities = {};
                        sortedItems.forEach(item => {
                          newQuantities[item.id] = quantities[item.id] || 1;
                        });
                        setQuantities(newQuantities);
                      } else {
                        setSelectedItems([]);
                        setQuantities({});
                      }
                    }}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">
                  Item
                </th>
                <th className="px-4 py-3 text-center font-medium text-gray-700">
                  Qty
                </th>
                {vendors.map(vendor => (
                  <th key={vendor} className="px-4 py-3 text-right font-medium text-gray-700">
                    {vendorNames[vendor]}
                  </th>
                ))}
                <th className="px-4 py-3 text-right font-medium text-gray-700">
                  Best
                </th>
                <th className="px-4 py-3 text-right font-medium text-gray-700">
                  Savings
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sortedItems.map(item => {
                const best = getBestVendorForItem(item);
                const worst = getWorstVendorForItem(item);
                const savings = worst.price > 0 && best.price < Infinity ? worst.price - best.price : 0;
                const isSelected = selectedItems.includes(item.id);
                const quantity = quantities[item.id] || 1;

                return (
                  <tr 
                    key={item.id} 
                    className={`hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleItemSelection(item.id)}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{item.name}</div>
                      <div className="text-xs text-gray-500">{item.category} • {item.unit}</div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {isSelected ? (
                        <input
                          type="number"
                          value={quantity}
                          onChange={(e) => updateQuantity(item.id, parseInt(e.target.value))}
                          min="1"
                          className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
                        />
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    {vendors.map(vendor => {
                      const price = getVendorPrice(item, vendor);
                      const code = getVendorCode(item, vendor);
                      const isBest = vendor === best.vendor;
                      const diff = getPriceDifference(item, vendor);
                      
                      return (
                        <td 
                          key={vendor} 
                          className={`px-4 py-3 text-right ${
                            isBest ? 'bg-green-50 font-semibold text-green-900' : ''
                          }`}
                        >
                          {price > 0 ? (
                            <>
                              <div>${(price * (isSelected ? quantity : 1)).toFixed(2)}</div>
                              {code && <div className="text-xs text-gray-500">{code}</div>}
                              {diff > 0 && (
                                <div className="text-xs text-red-600">
                                  +${(diff * (isSelected ? quantity : 1)).toFixed(2)}
                                </div>
                              )}
                            </>
                          ) : (
                            <span className="text-gray-400">N/A</span>
                          )}
                        </td>
                      );
                    })}
                    <td className="px-4 py-3 text-right font-semibold text-green-600">
                      {best.price < Infinity ? `$${(best.price * (isSelected ? quantity : 1)).toFixed(2)}` : 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-orange-600">
                      ${(savings * (isSelected ? quantity : 1)).toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            
            {/* Totals Footer */}
            {selectedItems.length > 0 && (
              <tfoot className="bg-gray-50 border-t-2 border-gray-300">
                <tr className="font-bold">
                  <td colSpan="3" className="px-4 py-3 text-right">
                    Totals ({selectedItems.length} items):
                  </td>
                  {vendors.map(vendor => {
                    const total = calculateTotalForVendor(vendor);
                    const allTotals = vendors.map(v => calculateTotalForVendor(v)).filter(t => t > 0);
                    const minTotal = allTotals.length > 0 ? Math.min(...allTotals) : 0;
                    const isBest = total > 0 && total === minTotal;
                    
                    return (
                      <td 
                        key={vendor}
                        className={`px-4 py-3 text-right ${
                          isBest ? 'bg-green-100 text-green-900' : ''
                        }`}
                      >
                        ${total.toFixed(2)}
                      </td>
                    );
                  })}
                  <td className="px-4 py-3 text-right text-green-600">
                    ${Math.min(...vendors.map(v => calculateTotalForVendor(v)).filter(t => t > 0) || [0]).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right text-orange-600">
                    ${calculateSavings().toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Vendor Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        {vendors.map(vendor => {
          const itemsWithPrice = ingredientsList.filter(item => getVendorPrice(item, vendor) > 0).length;
          const itemsWithBestPrice = ingredientsList.filter(item => 
            getBestVendorForItem(item).vendor === vendor
          ).length;
          const percentage = itemsWithPrice > 0 ? ((itemsWithBestPrice / itemsWithPrice) * 100).toFixed(1) : 0;
          
          return (
            <div key={vendor} className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-2">{vendorNames[vendor]}</h3>
              <div className="text-3xl font-bold text-blue-600">{itemsWithBestPrice}</div>
              <div className="text-sm text-gray-600">best prices ({percentage}% of priced items)</div>
              <div className="text-xs text-gray-500 mt-1">{itemsWithPrice} items with pricing</div>
              
              {selectedItems.length > 0 && (
                <div className="mt-3 pt-3 border-t">
                  <div className="text-sm text-gray-600">Selected Total:</div>
                  <div className="text-lg font-semibold">
                    ${calculateTotalForVendor(vendor).toFixed(2)}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Tips */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-2">💡 Tips</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Green highlighted prices show the best deal for each item</li>
          <li>• Select items to calculate total savings</li>
          <li>• Only items with vendor pricing data are shown</li>
          <li>• Use the category filter to focus on specific product types</li>
        </ul>
      </div>
    </div>
  );
}
