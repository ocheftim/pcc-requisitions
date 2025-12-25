import React, { useState } from 'react';
import { Package, DollarSign, TrendingUp, Save, X } from 'lucide-react';

const BulkIngredientUpdate = ({ 
  ingredientsNeedingAttention = [],
  vendors = [],
  onUpdateIngredients,
  onClose
}) => {
  const [updates, setUpdates] = useState({});
  const [saving, setSaving] = useState(false);

  const updateField = (ingredientName, field, value) => {
    setUpdates(prev => ({
      ...prev,
      [ingredientName]: {
        ...prev[ingredientName],
        [field]: value
      }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    if (onUpdateIngredients) {
      await onUpdateIngredients(updates);
    }
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="text-xl font-bold">Bulk Update Ingredients</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="flex-1 overflow-auto p-6">
          <div className="space-y-4">
            {ingredientsNeedingAttention.map((item, idx) => {
              const ingredientName = item.ingredient;
              const update = updates[ingredientName] || {};
              return (
                <div key={idx} className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-2">{ingredientName}</h3>
                  <p className="text-sm text-gray-600 mb-3">Used in: {item.requisition}</p>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        <Package className="w-3 h-3 inline mr-1" />Vendor
                      </label>
                      <select value={update.vendorId || ''} onChange={(e) => updateField(ingredientName, 'vendorId', e.target.value)} className="w-full px-3 py-2 border rounded text-sm">
                        <option value="">Select vendor...</option>
                        {vendors.map(vendor => (
                          <option key={vendor.id} value={vendor.id}>{vendor.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        <DollarSign className="w-3 h-3 inline mr-1" />AP Cost
                      </label>
                      <input type="number" step="0.01" value={update.apCost || ''} onChange={(e) => updateField(ingredientName, 'apCost', e.target.value)} className="w-full px-3 py-2 border rounded text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        <TrendingUp className="w-3 h-3 inline mr-1" />Yield %
                      </label>
                      <input type="number" step="0.1" value={update.yieldPercent || ''} onChange={(e) => updateField(ingredientName, 'yieldPercent', e.target.value)} className="w-full px-3 py-2 border rounded text-sm" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="px-6 py-4 border-t flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2 disabled:bg-gray-400">
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Updates'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkIngredientUpdate;
