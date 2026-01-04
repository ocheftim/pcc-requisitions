import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function IngredientVendorsModal({ ingredient, onClose, onUpdate }) {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newVendor, setNewVendor] = useState({
    vendor: '',
    item_number: '',
    pack_size: '',
    case_price: '',
    unit_price: '',
    notes: ''
  });

  // Common vendors list
  const vendorOptions = [
    'Sysco', 'Shamrock Foods', 'Restaurant Depot', 'Costco', 
    'Fry\'s', 'Safeway', 'Walmart', 'Sam\'s Club', 'US Foods',
    'Spiceology', 'Amazon', 'Other'
  ];

  useEffect(() => {
    loadVendors();
  }, [ingredient]);

  const loadVendors = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('ingredient_vendors')
      .select('*')
      .eq('ingredient_name', ingredient.name)
      .order('is_preferred', { ascending: false });
    
    if (error) {
      console.error('Error loading vendors:', error);
    } else {
      setVendors(data || []);
    }
    setLoading(false);
  };

  const handleAddVendor = async () => {
    if (!newVendor.vendor || !newVendor.pack_size) {
      alert('Vendor and Pack Size are required');
      return;
    }

    setSaving(true);
    const { error } = await supabase
      .from('ingredient_vendors')
      .insert({
        ingredient_name: ingredient.name,
        vendor: newVendor.vendor,
        item_number: newVendor.item_number || null,
        pack_size: newVendor.pack_size,
        case_price: newVendor.case_price ? parseFloat(newVendor.case_price) : null,
        unit_price: newVendor.unit_price ? parseFloat(newVendor.unit_price) : null,
        notes: newVendor.notes || null,
        is_preferred: vendors.length === 0 // First vendor is preferred
      });

    if (error) {
      console.error('Error adding vendor:', error);
      alert('Error adding vendor: ' + error.message);
    } else {
      setNewVendor({ vendor: '', item_number: '', pack_size: '', case_price: '', unit_price: '', notes: '' });
      setShowAddForm(false);
      loadVendors();
      onUpdate?.();
    }
    setSaving(false);
  };

  const handleSetPreferred = async (vendorId) => {
    setSaving(true);
    // Unset all as preferred first
    await supabase
      .from('ingredient_vendors')
      .update({ is_preferred: false })
      .eq('ingredient_name', ingredient.name);
    
    // Set selected as preferred
    await supabase
      .from('ingredient_vendors')
      .update({ is_preferred: true })
      .eq('id', vendorId);
    
    loadVendors();
    onUpdate?.();
    setSaving(false);
  };

  const handleDeleteVendor = async (vendorId) => {
    if (!window.confirm('Delete this vendor option?')) return;
    
    setSaving(true);
    const { error } = await supabase
      .from('ingredient_vendors')
      .delete()
      .eq('id', vendorId);

    if (error) {
      console.error('Error deleting vendor:', error);
    } else {
      loadVendors();
      onUpdate?.();
    }
    setSaving(false);
  };

  const handleUpdateVendor = async (vendorId, field, value) => {
    const { error } = await supabase
      .from('ingredient_vendors')
      .update({ [field]: value })
      .eq('id', vendorId);

    if (error) {
      console.error('Error updating vendor:', error);
    } else {
      loadVendors();
      onUpdate?.();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 text-white px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">Vendor Options</h2>
            <p className="text-blue-100">{ingredient.name}</p>
          </div>
          <button onClick={onClose} className="text-white hover:bg-blue-700 rounded p-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : (
            <>
              {/* Existing Vendors */}
              {vendors.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No vendors configured for this ingredient
                </div>
              ) : (
                <table className="w-full text-sm mb-6">
                  <thead>
                    <tr className="bg-gray-100 border-b">
                      <th className="text-left px-3 py-2">Vendor</th>
                      <th className="text-left px-3 py-2">Item #</th>
                      <th className="text-left px-3 py-2">Pack Size</th>
                      <th className="text-right px-3 py-2">Case Price</th>
                      <th className="text-right px-3 py-2">Unit Price</th>
                      <th className="text-center px-3 py-2">Preferred</th>
                      <th className="text-center px-3 py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vendors.map(v => (
                      <tr key={v.id} className={`border-b ${v.is_preferred ? 'bg-green-50' : 'hover:bg-gray-50'}`}>
                        <td className="px-3 py-2 font-medium">{v.vendor}</td>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={v.item_number || ''}
                            onChange={(e) => handleUpdateVendor(v.id, 'item_number', e.target.value)}
                            className="w-24 px-2 py-1 border rounded text-sm"
                            placeholder="-"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={v.pack_size || ''}
                            onChange={(e) => handleUpdateVendor(v.id, 'pack_size', e.target.value)}
                            className="w-20 px-2 py-1 border rounded text-sm"
                          />
                        </td>
                        <td className="px-3 py-2 text-right">
                          <input
                            type="number"
                            step="0.01"
                            value={v.case_price || ''}
                            onChange={(e) => handleUpdateVendor(v.id, 'case_price', e.target.value ? parseFloat(e.target.value) : null)}
                            className="w-20 px-2 py-1 border rounded text-sm text-right"
                            placeholder="-"
                          />
                        </td>
                        <td className="px-3 py-2 text-right">
                          <input
                            type="number"
                            step="0.0001"
                            value={v.unit_price || ''}
                            onChange={(e) => handleUpdateVendor(v.id, 'unit_price', e.target.value ? parseFloat(e.target.value) : null)}
                            className="w-20 px-2 py-1 border rounded text-sm text-right"
                            placeholder="-"
                          />
                        </td>
                        <td className="px-3 py-2 text-center">
                          {v.is_preferred ? (
                            <span className="text-green-600 font-bold">★</span>
                          ) : (
                            <button
                              onClick={() => handleSetPreferred(v.id)}
                              className="text-gray-400 hover:text-green-600"
                              title="Set as preferred"
                            >
                              ☆
                            </button>
                          )}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <button
                            onClick={() => handleDeleteVendor(v.id)}
                            className="text-red-500 hover:text-red-700"
                            title="Delete"
                          >
                            🗑
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* Add New Vendor Form */}
              {showAddForm ? (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-medium text-blue-800 mb-3">Add Vendor Option</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Vendor *</label>
                      <select
                        value={newVendor.vendor}
                        onChange={(e) => setNewVendor({ ...newVendor, vendor: e.target.value })}
                        className="w-full px-3 py-2 border rounded"
                      >
                        <option value="">Select...</option>
                        {vendorOptions.map(v => (
                          <option key={v} value={v}>{v}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Item #</label>
                      <input
                        type="text"
                        value={newVendor.item_number}
                        onChange={(e) => setNewVendor({ ...newVendor, item_number: e.target.value })}
                        className="w-full px-3 py-2 border rounded"
                        placeholder="Optional"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Pack Size *</label>
                      <input
                        type="text"
                        value={newVendor.pack_size}
                        onChange={(e) => setNewVendor({ ...newVendor, pack_size: e.target.value })}
                        className="w-full px-3 py-2 border rounded"
                        placeholder="e.g., 1/16OZ, 6/30OZ"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Case Price</label>
                      <input
                        type="number"
                        step="0.01"
                        value={newVendor.case_price}
                        onChange={(e) => setNewVendor({ ...newVendor, case_price: e.target.value })}
                        className="w-full px-3 py-2 border rounded"
                        placeholder="$"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price</label>
                      <input
                        type="number"
                        step="0.0001"
                        value={newVendor.unit_price}
                        onChange={(e) => setNewVendor({ ...newVendor, unit_price: e.target.value })}
                        className="w-full px-3 py-2 border rounded"
                        placeholder="$/unit"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                      <input
                        type="text"
                        value={newVendor.notes}
                        onChange={(e) => setNewVendor({ ...newVendor, notes: e.target.value })}
                        className="w-full px-3 py-2 border rounded"
                        placeholder="Optional"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={handleAddVendor}
                      disabled={saving}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                      {saving ? 'Saving...' : 'Add Vendor'}
                    </button>
                    <button
                      onClick={() => setShowAddForm(false)}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2"
                >
                  <span>+</span> Add Vendor Option
                </button>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex justify-end border-t">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
