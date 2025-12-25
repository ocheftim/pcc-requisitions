import React, { useState, useEffect } from 'react';
import { getVendorCatalog, saveVendorCatalog, resetCatalog, updateItem } from '../data/vendorManagement';
import { getInstructors, removeInstructor } from '../data/instructors';

function AdminSettingsPage({ onBack }) {
  const [catalog, setCatalog] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [editingItem, setEditingItem] = useState(null);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    setCatalog(getVendorCatalog());
    setInstructors(getInstructors());
  }, []);

  const handleStartEdit = (item) => {
    setEditingItem(item.id);
    setEditForm({ ...item });
  };

  const handleSaveEdit = () => {
    const updated = updateItem(editingItem, editForm);
    setCatalog(updated);
    setEditingItem(null);
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
    setEditForm({});
  };

  const handleRemoveInstructor = (name) => {
    if (window.confirm(`Remove ${name}?`)) {
      const updated = removeInstructor(name);
      setInstructors(updated);
    }
  };

  const handleResetCatalog = () => {
    if (window.confirm('Reset all prices to defaults? This cannot be undone.')) {
      const reset = resetCatalog();
      setCatalog(reset);
    }
  };

  const categories = [...new Set(catalog.map(item => item.category))];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gray-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Admin Settings</h1>
            <p className="text-gray-300 mt-1">Manage vendors, prices, and instructors</p>
          </div>
          <button
            onClick={onBack}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
          >
            ← Back to Requisition Form
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-white rounded-lg shadow-md border p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4">Manage Instructors</h2>
          <div className="space-y-2">
            {instructors.map(name => (
              <div key={name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">{name}</span>
                <button
                  onClick={() => handleRemoveInstructor(name)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md border p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Vendor Catalog</h2>
            <button
              onClick={handleResetCatalog}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Reset to Defaults
            </button>
          </div>

          {categories.map(category => (
            <div key={category} className="mb-8">
              <h3 className="text-xl font-bold text-gray-700 uppercase mb-4 pb-2 border-b-2">
                {category}
              </h3>
              <div className="space-y-2">
                {catalog.filter(item => item.category === category).map(item => (
                  <div key={item.id} className="border rounded-lg p-4">
                    {editingItem === item.id ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-1">Item Name</label>
                            <input
                              type="text"
                              value={editForm.name}
                              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                              className="w-full px-3 py-2 border rounded-lg"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Shamrock Code</label>
                            <input
                              type="text"
                              value={editForm.shamrockCode}
                              onChange={(e) => setEditForm({ ...editForm, shamrockCode: e.target.value })}
                              className="w-full px-3 py-2 border rounded-lg"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Unit Price ($)</label>
                            <input
                              type="number"
                              value={editForm.unitPrice}
                              onChange={(e) => setEditForm({ ...editForm, unitPrice: parseFloat(e.target.value) })}
                              step="0.01"
                              className="w-full px-3 py-2 border rounded-lg"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Unit</label>
                            <input
                              type="text"
                              value={editForm.unit}
                              onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })}
                              className="w-full px-3 py-2 border rounded-lg"
                            />
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <button
                            onClick={handleSaveEdit}
                            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
                          >
                            Save Changes
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-semibold text-lg">{item.name}</div>
                          <div className="text-sm text-gray-500">
                            Code: {item.shamrockCode} | ${item.unitPrice.toFixed(2)} per {item.unit}
                          </div>
                        </div>
                        <button
                          onClick={() => handleStartEdit(item)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          Edit
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export default AdminSettingsPage;
