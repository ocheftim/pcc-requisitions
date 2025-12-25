import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getItemByPccStock, vendorNames, formatDate } from '../../data/ingredients/ingredientsList';

export default function ProductDetailPage() {
  const { pccStock } = useParams();
  const navigate = useNavigate();
  const item = getItemByPccStock(pccStock);

  if (!item) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Product Not Found</h1>
          <button onClick={() => navigate(-1)} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Go Back</button>
        </div>
      </div>
    );
  }

  const vendorPrices = Object.entries(item.vendors)
    .map(([vendor, data]) => ({
      vendor,
      name: vendorNames[vendor],
      code: data.code,
      casePrice: data.casePrice || 0,
      packSize: data.packSize || 'N/A',
      lastUpdated: data.lastUpdated,
      available: data.available
    }))
    .filter(v => v.available)
    .sort((a, b) => a.casePrice - b.casePrice);

  const bestPrice = vendorPrices[0]?.casePrice || 0;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <button onClick={() => navigate(-1)} className="mb-4 text-blue-600">← Back</button>

      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 bg-blue-600 text-white">
          <div className="text-sm mb-1">PCC Stock Number</div>
          <div className="text-3xl font-bold mb-2">{item.pccStock}</div>
          <h1 className="text-2xl font-semibold">{item.name}</h1>
          <div className="text-sm mt-2 opacity-90">{item.category}</div>
        </div>

        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Vendor Case Pricing</h2>
          
          <table className="w-full border">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">Rank</th>
                <th className="px-4 py-3 text-left">Vendor</th>
                <th className="px-4 py-3 text-left">Ordering Code</th>
                <th className="px-4 py-3 text-left">Pack Size</th>
                <th className="px-4 py-3 text-right">Case Price</th>
                <th className="px-4 py-3 text-right">Last Updated</th>
                <th className="px-4 py-3 text-right">vs Best</th>
              </tr>
            </thead>
            <tbody>
              {vendorPrices.map((vendor, index) => {
                const isBest = vendor.casePrice === bestPrice;
                const difference = vendor.casePrice - bestPrice;
                
                return (
                  <tr key={vendor.vendor} className={isBest ? 'bg-green-50' : ''}>
                    <td className="px-4 py-4">#{index + 1}</td>
                    <td className="px-4 py-4 font-semibold">{vendor.name}</td>
                    <td className="px-4 py-4 font-mono text-sm text-blue-600">{vendor.code}</td>
                    <td className="px-4 py-4 text-sm text-gray-600">{vendor.packSize}</td>
                    <td className="px-4 py-4 text-right text-lg font-bold">${vendor.casePrice.toFixed(2)}</td>
                    <td className="px-4 py-4 text-right text-sm">{formatDate(vendor.lastUpdated)}</td>
                    <td className="px-4 py-4 text-right">
                      {isBest ? (
                        <span className="text-green-600 font-semibold">Best</span>
                      ) : (
                        <span className="text-red-600">+${difference.toFixed(2)}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
