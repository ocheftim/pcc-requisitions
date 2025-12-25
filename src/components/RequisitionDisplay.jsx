import React from 'react';

function RequisitionDisplay({ selectedItems, requisitionName, budget }) {
  const groupedItems = selectedItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  const totalCost = selectedItems.reduce((sum, item) => sum + item.totalCost, 0);
  const budgetRemaining = budget - totalCost;

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="px-6 py-5 border-b">
        <h2 className="text-2xl font-bold mb-3">{requisitionName || 'Shamrock Foods Requisition'}</h2>
        <div className="text-sm">
          <span className="text-gray-600">Total Items:</span> 
          <span className="font-semibold ml-2">{selectedItems.length}</span>
        </div>
      </div>

      <div className="px-6 py-5">
        {Object.entries(groupedItems).map(([category, items]) => (
          <div key={category} className="mb-6 last:mb-0">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3 pb-2 border-b-2 border-gray-300">
              {category}
            </h3>
            {items.map((item, idx) => (
              <div key={idx} className="flex justify-between py-3 border-b border-gray-100 last:border-0">
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{item.name}</div>
                  <div className="text-xs text-gray-500 mt-1">Code: {item.shamrockCode}</div>
                </div>
                <div className="text-right ml-4">
                  <div className="font-semibold text-gray-900">
                    {item.quantity.toFixed(2)} {item.unit}
                  </div>
                  <div className="text-sm text-gray-600">${item.totalCost.toFixed(2)}</div>
                  <div className="text-xs text-gray-500">@ ${item.unitPrice.toFixed(2)}/{item.unit}</div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="px-6 py-5 bg-gray-50 border-t-2 border-gray-300">
        <div className="text-right">
          <div className="text-sm text-gray-600 mb-1">TOTAL COST</div>
          <div className="text-3xl font-bold text-gray-900">${totalCost.toFixed(2)}</div>
        </div>
        <div className={`text-right text-lg font-semibold mt-2 ${
          budgetRemaining >= 0 ? 'text-green-600' : 'text-red-600'
        }`}>
          {budgetRemaining >= 0 ? '✓' : '⚠'} Budget Remaining: ${Math.abs(budgetRemaining).toFixed(2)}
        </div>
      </div>

      <div className="px-6 py-5 border-t">
        <div className="flex gap-3">
          <button className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold">
            📄 Generate PDF
          </button>
          <button className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold">
            ✉️ Email to Shamrock
          </button>
        </div>
      </div>
    </div>
  );
}

export default RequisitionDisplay;
