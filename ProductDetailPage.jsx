import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getItemByPccStock, getBestPrice, vendorNames, formatDate } from '../../data/ingredients/ingredientsList';

export default function ProductDetailPage() {
  const { pccStock } = useParams();
  const navigate = useNavigate();
  const item = getItemByPccStock(pccStock);

  if (!item) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Product Not Found</h1>
          <p className="text-gray-600 mb-4">Stock number {pccStock} not found in system.</p>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 text-white rounded-lg"
            style={{backgroundColor: '#2563eb'}}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const bestPrice = getBestPrice(item);
  
  // Sort vendors by UNIT price (fair comparison)
  const vendorPrices = Object.entries(item.vendors)
    .map(([vendor, data]) => ({
      vendor,
      name: vendorNames[vendor],
      ...data
    }))
    .sort((a, b) => a.unitPrice - b.unitPrice);

  const priceDifference = vendorPrices[vendorPrices.length - 1].unitPrice - vendorPrices[0].unitPrice;
  const percentageDiff = ((priceDifference / vendorPrices[0].unitPrice) * 100).toFixed(1);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <button
        onClick={() => navigate(-1)}
        className="mb-4 flex items-center gap-2"
        style={{color: '#2563eb', textDecoration: 'none', backgroundColor: 'transparent', border: 'none', cursor: 'pointer'}}
      >
        ← Back
      </button>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {/* Product Header */}
        <div className="p-6" style={{backgroundColor: '#2563eb', color: 'white'}}>
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm opacity-90 mb-1">PCC Stock Number</div>
              <div className="text-3xl font-bold mb-2">{item.pccStock}</div>
              <h1 className="text-2xl font-semibold">{item.name}</h1>
            </div>
            <div className="text-right">
              <div className="text-sm opacity-90">Category</div>
              <div className="text-lg font-semibold">{item.category}</div>
            </div>
          </div>
        </div>

        {/* Product Info */}
        <div className="p-6 border-b">
          <div className="grid grid-cols-3 gap-6">
            <div>
              <div className="text-sm text-gray-600 mb-1">Best Unit Price</div>
              <div className="text-xl font-semibold" style={{color: '#059669'}}>
                ${bestPrice.unitPrice.toFixed(2)}
              </div>
              <div className="text-xs text-gray-500">from {vendorNames[bestPrice.vendor]}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Best Case Price</div>
              <div className="text-xl font-semibold" style={{color: '#059669'}}>
                ${bestPrice.casePrice.toFixed(2)}
              </div>
              <div className="text-xs text-gray-500">{bestPrice.packSize}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Price Range</div>
              <div className="text-xl font-semibold text-gray-900">
                ${priceDifference.toFixed(2)}
              </div>
              <div className="text-xs text-gray-500">{percentageDiff}% difference</div>
            </div>
          </div>
        </div>

        {/* Vendor Pricing Table with Ordering Codes */}
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Vendor Pricing & Ordering Information</h2>
          
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Rank</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Vendor</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Ordering Code</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Pack Size</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Case Price</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Unit Price</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Last Updated</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">vs Best</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {vendorPrices.map((vendor, index) => {
                  const isBest = vendor.unitPrice === bestPrice.unitPrice;
                  const unitDifference = vendor.unitPrice - bestPrice.unitPrice;
                  const caseDifference = vendor.casePrice - bestPrice.casePrice;
                  
                  const daysSinceUpdate = Math.floor((new Date() - new Date(vendor.lastUpdated)) / (1000 * 60 * 60 * 24));
                  const isStale = daysSinceUpdate > 14;
                  
                  return (
                    <tr key={vendor.vendor} style={isBest ? {backgroundColor: '#dcfce7'} : {}}>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          {index === 0 && <span className="text-2xl">🥇</span>}
                          {index === 1 && <span className="text-2xl">🥈</span>}
                          {index === 2 && <span className="text-2xl">🥉</span>}
                          <span className="font-semibold text-gray-900">#{index + 1}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-semibold text-gray-900">{vendor.name}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="bg-gray-100 px-3 py-2 rounded font-mono text-sm font-semibold inline-block" style={{color: '#2563eb'}}>
                          {vendor.code}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-gray-600">{vendor.packSize}</div>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="text-lg font-bold text-gray-900">
                          ${vendor.casePrice.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className={`text-base font-semibold ${isBest ? 'text-green-600' : 'text-gray-700'}`}>
                          ${vendor.unitPrice.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className={`text-sm ${isStale ? 'text-orange-600 font-semibold' : 'text-gray-600'}`}>
                          {formatDate(vendor.lastUpdated)}
                        </div>
                        {isStale && (
                          <div className="text-xs text-orange-600">⚠ Update needed</div>
                        )}
                      </td>
                      <td className="px-4 py-4 text-right">
                        {isBest ? (
                          <span className="font-semibold" style={{color: '#059669'}}>Best</span>
                        ) : (
                          <div>
                            <div style={{color: '#dc2626'}}>+${unitDifference.toFixed(2)}/unit</div>
                            <div className="text-xs text-gray-500">+${caseDifference.toFixed(2)}/case</div>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4 text-center">
                        {vendor.available ? (
                          <span className="px-3 py-1 text-xs font-medium rounded-full" style={{backgroundColor: '#dcfce7', color: '#166534'}}>
                            Available
                          </span>
                        ) : (
                          <span className="px-3 py-1 text-xs font-medium rounded-full" style={{backgroundColor: '#fee2e2', color: '#991b1b'}}>
                            Unavailable
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Price Analysis */}
        <div className="p-6 bg-gray-50 border-t">
          <h3 className="font-semibold mb-3">Price Analysis</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4 border">
              <div className="text-sm text-gray-600 mb-1">Average Unit Price</div>
              <div className="text-xl font-bold">
                ${(vendorPrices.reduce((sum, v) => sum + v.unitPrice, 0) / vendorPrices.length).toFixed(2)}
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 border">
              <div className="text-sm text-gray-600 mb-1">Maximum Savings</div>
              <div className="text-xl font-bold text-green-600">
                ${(vendorPrices[vendorPrices.length - 1].casePrice - vendorPrices[0].casePrice).toFixed(2)}
              </div>
              <div className="text-xs text-gray-500">per case by choosing {vendorNames[bestPrice.vendor]}</div>
            </div>
            <div className="bg-white rounded-lg p-4 border">
              <div className="text-sm text-gray-600 mb-1">Available Vendors</div>
              <div className="text-xl font-bold">
                {vendorPrices.filter(v => v.available).length}/4
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
