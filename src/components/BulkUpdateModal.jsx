import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const calcUnitPrice = (item) => {
  if (!item.pack_size || !item.case_price) return null;
  const pack = item.pack_size.toString().trim();
  const casePrice = parseFloat(item.case_price) || 0;
  const unit = (item.unit || '').toLowerCase();
  
  const toOz = (num, measure) => {
    const m = (measure || '').toUpperCase();
    if (m === 'OZ') return num;
    if (m === 'LB') return num * 16;
    if (m === 'G') return num / 28.35;
    if (m === 'KG') return num * 35.27;
    return null;
  };
  
  let unitOz = null;
  if (unit === 'lb') unitOz = 16;
  else if (unit === 'oz') unitOz = 1;
  else {
    const m = unit.match(/(\d+\.?\d*)\s*(oz|lb|g|kg)/i);
    if (m) unitOz = toOz(parseFloat(m[1]), m[2]);
  }
  
  let packOz = null;
  const slash = pack.match(/^(\d+)\/(\d+\.?\d*)\s*(oz|lb|g|kg)?$/i);
  if (slash) {
    const cnt = parseFloat(slash[1]);
    const sz = parseFloat(slash[2]);
    const msr = slash[3] || 'lb';
    packOz = cnt * toOz(sz, msr);
  }
  if (!packOz) {
    const wt = pack.match(/^(\d+\.?\d*)\s*(oz|lb|g|kg)$/i);
    if (wt) packOz = toOz(parseFloat(wt[1]), wt[2]);
  }
  
  if (unitOz && packOz) {
    const numUnits = packOz / unitOz;
    return numUnits > 0 ? casePrice / numUnits : null;
  }
  
  const cnt = pack.match(/^(\d+)/);
  if (cnt) return casePrice / parseFloat(cnt[1]);
  
  return null;
};

const PROGRAMS = ['Baking & Pastry Arts', 'Culinary Arts', 'Foodservice'];
const PROGRAM_SHORT = { 'Baking & Pastry Arts': 'B', 'Culinary Arts': 'C', 'Foodservice': 'F' };

export default function BulkUpdateModal({ isOpen, onClose, onSave }) {
  const [items, setItems] = useState([]);
  const [originalItems, setOriginalItems] = useState({});
  const [modifiedIds, setModifiedIds] = useState({});
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => { if (isOpen) loadItems(); }, [isOpen]);

  const loadItems = async () => {
    const { data } = await supabase.from('ingredients').select('*')
      .or('unit_price.eq.0,unit_price.is.null,case_price.eq.0,case_price.is.null,pack_size.is.null')
      .not('availability', 'in', '("Limited","Not Available")')
      .order('category').order('name');
    setItems(data || []);
    // Store original values for comparison
    const originals = {};
    (data || []).forEach(item => { originals[item.id] = { ...item }; });
    setOriginalItems(originals);
    setModifiedIds({});
  };

  const updateItem = (id, field, value) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
    setModifiedIds(prev => ({ ...prev, [id]: true }));
  };

  const toggleProgram = (id, program) => {
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      const current = item.programs || [];
      const updated = current.includes(program) ? current.filter(p => p !== program) : [...current, program];
      return { ...item, programs: updated };
    }));
    setModifiedIds(prev => ({ ...prev, [id]: true }));
  };

  const deleteItem = async (id) => {
    await supabase.from('ingredients').delete().eq('id', id);
    setItems(prev => prev.filter(item => item.id !== id));
    setModifiedIds(prev => { const n = { ...prev }; delete n[id]; return n; });
    setDeleteConfirm(null);
    if (onSave) onSave();
  };

  const saveChanges = async () => {
    setSaving(true);
    const toSave = items.filter(item => modifiedIds[item.id]);
    for (const item of toSave) {
      const unitPrice = calcUnitPrice(item) || item.unit_price || 0;
      await supabase.from('ingredients').update({
        name: item.name,
        pack_size: item.pack_size, 
        case_price: item.case_price, 
        unit_price: unitPrice,
        vendor_code: item.vendor_code, 
        brand: item.brand,
        availability: item.availability || 'Available',
        programs: item.programs || []
      }).eq('id', item.id);
    }
    setSaving(false);
    setModifiedIds({});
    if (onSave) onSave();
    await loadItems();
  };

  const filteredItems = items.filter(item => !filter || item.name?.toLowerCase().includes(filter.toLowerCase()) || item.category?.toLowerCase().includes(filter.toLowerCase()));
  const modifiedCount = Object.keys(modifiedIds).length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-[98vw] max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b flex justify-between items-center bg-amber-50">
          <div>
            <h2 className="text-xl font-bold text-amber-700">Items Needing Updates</h2>
            <p className="text-sm text-gray-600">{items.length} items total - {modifiedCount} modified</p>
          </div>
          <div className="flex gap-2 items-center">
            <input type="text" placeholder="Filter..." value={filter} onChange={(e) => setFilter(e.target.value)} className="px-3 py-2 border rounded text-sm" />
            <button onClick={saveChanges} disabled={saving || modifiedCount === 0} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400">
              {saving ? 'Saving...' : 'Save Changes (' + modifiedCount + ')'}
            </button>
            <button onClick={onClose} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">Close</button>
          </div>
        </div>
        <div className="overflow-auto flex-1">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 sticky top-0">
              <tr>
                <th className="px-2 py-2 text-left w-8"></th>
                <th className="px-2 py-2 text-left w-48">Name</th>
                <th className="px-2 py-2 text-left">Category</th>
                <th className="px-2 py-2 text-left w-12">Unit</th>
                <th className="px-2 py-2 text-left w-24">SUPC</th>
                <th className="px-2 py-2 text-left w-28">Pack Size</th>
                <th className="px-2 py-2 text-left w-24">Case $</th>
                <th className="px-2 py-2 text-left w-24">Unit $</th>
                <th className="px-2 py-2 text-left w-28">Brand</th>
                <th className="px-2 py-2 text-center w-20">Programs</th>
                <th className="px-2 py-2 text-left w-32">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map(item => {
                const isModified = modifiedIds[item.id];
                const unitPrice = calcUnitPrice(item);
                const programs = item.programs || [];
                const isUnavailable = item.availability === 'Limited' || item.availability === 'Not Available';
                return (
                  <tr key={item.id} className={isModified ? "bg-yellow-50 border-b" : "border-b hover:bg-gray-50"}>
                    <td className="px-2 py-1">
                      <button onClick={() => setDeleteConfirm(item)} className="text-red-400 hover:text-red-600 text-lg" title="Delete">×</button>
                    </td>
                    <td className="px-2 py-1">
                      <input type="text" value={item.name || ''} onChange={(e) => updateItem(item.id, 'name', e.target.value)} className={`w-full px-1 py-0.5 border rounded text-xs font-medium ${isModified ? 'border-yellow-400' : ''}`} />
                    </td>
                    <td className="px-2 py-1 text-gray-600 text-xs">{item.category}<br/><span className="text-gray-400">{item.subcategory}</span></td>
                    <td className="px-2 py-1 text-xs">{item.unit}</td>
                    <td className="px-2 py-1"><input type="text" value={item.vendor_code || ''} onChange={(e) => updateItem(item.id, 'vendor_code', e.target.value)} className={`w-full px-1 py-0.5 border rounded text-xs ${isModified ? 'border-yellow-400' : ''}`} /></td>
                    <td className="px-2 py-1"><input type="text" value={item.pack_size || ''} onChange={(e) => updateItem(item.id, 'pack_size', e.target.value)} className={`w-full px-1 py-0.5 border rounded text-xs ${isModified ? 'border-yellow-400' : ''} ${isUnavailable ? 'bg-gray-100' : ''}`} placeholder="e.g. 6/5LB" disabled={isUnavailable} /></td>
                    <td className="px-2 py-1"><input type="number" step="0.01" value={item.case_price || ''} onChange={(e) => updateItem(item.id, 'case_price', parseFloat(e.target.value) || 0)} className={`w-full px-1 py-0.5 border rounded text-xs ${isModified ? 'border-yellow-400' : ''} ${isUnavailable ? 'bg-gray-100' : ''}`} disabled={isUnavailable} /></td>
                    <td className="px-2 py-1"><div className="text-xs font-mono bg-gray-100 px-1 py-0.5 rounded text-center">{unitPrice !== null ? '$' + unitPrice.toFixed(4) : '-'}</div></td>
                    <td className="px-2 py-1"><input type="text" value={item.brand || ''} onChange={(e) => updateItem(item.id, 'brand', e.target.value)} className={`w-full px-1 py-0.5 border rounded text-xs ${isModified ? 'border-yellow-400' : ''}`} /></td>
                    <td className="px-2 py-1">
                      <div className="flex gap-1 justify-center">
                        {PROGRAMS.map(p => (
                          <button key={p} onClick={() => toggleProgram(item.id, p)} className={`w-6 h-6 rounded text-xs font-bold ${programs.includes(p) ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'}`} title={p}>{PROGRAM_SHORT[p]}</button>
                        ))}
                      </div>
                    </td>
                    <td className="px-2 py-1">
                      <select value={item.availability || 'Available'} onChange={(e) => updateItem(item.id, 'availability', e.target.value)} className={`w-full px-1 py-0.5 border rounded text-xs ${item.availability === 'Not Available' ? 'bg-red-100 text-red-700' : item.availability === 'Limited' ? 'bg-yellow-100 text-yellow-700' : ''} ${isModified ? 'border-yellow-400' : ''}`}>
                        <option value="Available">Available</option>
                        <option value="Limited">Limited</option>
                        <option value="Not Available">Not Available</option>
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-2">Delete Ingredient?</h3>
            <p className="text-gray-600 mb-4">Are you sure you want to delete <strong>{deleteConfirm.name}</strong>? This cannot be undone.</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Cancel</button>
              <button onClick={() => deleteItem(deleteConfirm.id)} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
