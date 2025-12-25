// UPDATE THIS SECTION in your ProductDetailPage.jsx

// In the vendor pricing table, change the Price column to show BOTH:

<th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Pack Size</th>
<th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Case Price</th>
<th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Unit Price</th>
<th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">vs Best</th>

// And in the tbody:

<td className="px-4 py-4">
  <div className="text-sm text-gray-600">{vendor.packSize}</div>
</td>
<td className="px-4 py-4 text-right">
  <div className="text-lg font-bold text-gray-900">
    ${vendor.casePrice.toFixed(2)}
  </div>
</td>
<td className="px-4 py-4 text-right">
  <div className={`text-sm font-semibold ${isBest ? 'text-green-600' : 'text-gray-600'}`}>
    ${vendor.unitPrice.toFixed(2)}/{item.unit}
  </div>
</td>
<td className="px-4 py-4 text-right">
  {isBest ? (
    <span className="font-semibold text-green-600">Best</span>
  ) : (
    <span className="text-red-600">+${(vendor.casePrice - bestPrice.casePrice).toFixed(2)}</span>
  )}
</td>
