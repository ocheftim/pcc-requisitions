import React, { useState, useMemo, useRef, useEffect } from 'react';
import { bakingIngredientsList, savoryIngredientsList, shamrockIngredientsList } from '../../data/ingredients/ingredientsList';
import { getRequisitions } from '../../lib/supabase';

export default function IngredientManagementPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [editingItem, setEditingItem] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [showAddNew, setShowAddNew] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);
  const menuRef = useRef(null);

  const [overrides, setOverrides] = useState(() => {
    const saved = localStorage.getItem('ingredientOverrides');
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const loadCustomFromSupabase = async () => {
      try { console.log("Loading from Supabase..."); console.log("Loading from Supabase...");
        const orders = await getRequisitions();
        const customItems = [];
        const seen = new Set();
        const existingNames = new Set(Object.values(overrides).map(i => i.name?.toLowerCase()));
        
        orders.forEach(order => {
          (order.items || []).forEach(item => {
            if (item.isCustom && !seen.has(item.name.toLowerCase()) && !existingNames.has(item.name.toLowerCase())) {
              seen.add(item.name.toLowerCase());
              const customId = `CUSTOM-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
              customItems.push({
                id: customId,
                name: item.name,
                unit: item.unit,
                syscoCode: '',
                syscoPrice: item.unitCost,
                syscoPackSize: '1/1' + (item.unit || 'EA').toUpperCase(),
                preferredVendor: 'sysco',
                category: 'DRY GOODS',
                lastUpdated: new Date().toISOString()
              });
            }
          });
        });
        
        console.log("Custom items found:", customItems); console.log("Custom items found:", customItems); if (customItems.length > 0) {
          const newOverrides = { ...overrides };
          customItems.forEach(item => {
            newOverrides[item.id] = item;
          });
          setOverrides(newOverrides);
          localStorage.setItem('ingredientOverrides', JSON.stringify(newOverrides));
        }
      } catch (error) {
        console.error('Error loading custom ingredients:', error);
      }
    };
    loadCustomFromSupabase();
  }, []);

  const allIngredients = useMemo(() => {
    const combined = [...bakingIngredientsList, ...savoryIngredientsList, ...shamrockIngredientsList];
    const overrideList = Object.values(overrides).filter(o => !combined.find(c => c.id === o.id));
    return [...combined, ...overrideList].map(item => ({
      ...item,
      ...(overrides[item.id] || {}),
      lastUpdated: overrides[item.id]?.lastUpdated || item.lastUpdated || new Date().toISOString()
    }));
  }, [overrides]);

  const filteredIngredients = useMemo(() => {
    return allIngredients.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'ALL' || item.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [allIngredients, searchTerm, categoryFilter]);

  const categories = ['ALL', ...new Set(allIngredients.map(i => i.category))];

  const handleEdit = (item) => {
    setEditingItem(item.id);
    setEditForm({
      name: item.name,
      syscoCode: item.syscoCode || '',
      syscoPrice: item.syscoPrice || 0,
      syscoPackSize: item.syscoPackSize || '',
      unit: item.unit,
      category: item.category
    });
    setOpenMenuId(null);
  };

  const handleSave = () => {
    const newOverrides = {
      ...overrides,
      [editingItem]: {
        id: editingItem,
        ...editForm,
        lastUpdated: new Date().toISOString()
      }
    };
    setOverrides(newOverrides);
    localStorage.setItem('ingredientOverrides', JSON.stringify(newOverrides));
    setEditingItem(null);
    alert('✅ Saved!');
  };

  const handleAddNew = () => {
    if (!editForm.name || !editForm.unit) {
      alert('Name and Unit are required');
      return;
    }
    const newId = `NEW-${Date.now()}`;
    const newOverrides = {
      ...overrides,
      [newId]: {
        id: newId,
        ...editForm,
        lastUpdated: new Date().toISOString()
      }
    };
    setOverrides(newOverrides);
    localStorage.setItem('ingredientOverrides', JSON.stringify(newOverrides));
    setShowAddNew(false);
    setEditForm({});
    alert('✅ Ingredient added!');
  };

  const handleDelete = (itemId) => {
    if (!window.confirm('Delete this ingredient?')) return;
    const newOverrides = { ...overrides };
    delete newOverrides[itemId];
    setOverrides(newOverrides);
    localStorage.setItem('ingredientOverrides', JSON.stringify(newOverrides));
    setOpenMenuId(null);
  };

  const parseCasePack = (packSize) => {
    if (!packSize) return 1;
    const match = packSize.match(/^(\d+)\/(\d+)/);
    if (match) {
      const count = parseInt(match[1]);
      const size = parseInt(match[2]);
      return count === 1 ? size : count;
    }
    const numMatch = packSize.match(/(\d+)/);
    return numMatch ? parseInt(numMatch[1]) : 1;
  };

  const calculateEP = (item) => { if (item.unitPrice) return item.unitPrice;
    return (item.syscoPrice || 0) / parseCasePack(item.syscoPackSize);
  };

  const formatDate = (isoString) => {
    if (!isoString) return new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return new Date(isoString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-3">
            <button onClick={() => window.location.href='/instructor/requisition'} className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">📝 Create Requisition</button>
            <button onClick={() => window.location.href='/instructor/my-requisitions'} className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">📋 Requisition History</button>
          </div>
          <h1 className="text-3xl font-bold">Ingredient Management</h1>
          <div className="flex gap-3">
            <button onClick={() => setShowAddNew(true)} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">+ Add New</button>
          </div>
        </div>

        {showAddNew && (
          <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
            <h3 className="font-semibold mb-3">Add New Ingredient</h3>
            <div className="grid grid-cols-6 gap-3 mb-3">
              <input type="text" placeholder="Name *" value={editForm.name || ''} onChange={(e) => setEditForm({...editForm, name: e.target.value})} className="px-3 py-2 border rounded" />
              <input type="text" placeholder="Sysco Code" value={editForm.syscoCode || ''} onChange={(e) => setEditForm({...editForm, syscoCode: e.target.value})} className="px-3 py-2 border rounded" />
              <input type="text" placeholder="Unit *" value={editForm.unit || ''} onChange={(e) => setEditForm({...editForm, unit: e.target.value})} className="px-3 py-2 border rounded" />
              <input type="number" placeholder="Case Price" value={editForm.syscoPrice || ''} onChange={(e) => setEditForm({...editForm, syscoPrice: parseFloat(e.target.value)})} className="px-3 py-2 border rounded" />
              <input type="text" placeholder="Pack Size" value={editForm.syscoPackSize || ''} onChange={(e) => setEditForm({...editForm, syscoPackSize: e.target.value})} className="px-3 py-2 border rounded" />
              <select value={editForm.category || 'DRY GOODS'} onChange={(e) => setEditForm({...editForm, category: e.target.value})} className="px-3 py-2 border rounded">
                <option>DRY GOODS</option>
                <option>DAIRY</option>
                <option>PRODUCE</option>
                <option>MEAT</option>
              </select>
            </div>
            <div className="flex gap-3">
              <button onClick={handleAddNew} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Add</button>
              <button onClick={() => { setShowAddNew(false); setEditForm({}); }} className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">Cancel</button>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search..."
            className="px-4 py-2 border rounded-lg"
          />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          >
            {categories.map(cat => <option key={cat}>{cat}</option>)}
          </select>
        </div>

        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="text-left p-3">Name</th>
              <th className="text-left p-3">Code</th>
              <th className="text-center p-3">Unit</th>
              <th className="text-right p-3">Case $</th>
              <th className="text-left p-3">Pack</th>
              <th className="text-right p-3">EP $</th>
              <th className="text-center p-3">Updated</th>
              <th className="text-center p-3 w-12"></th>
            </tr>
          </thead>
          <tbody>
            {filteredIngredients.map(item => (
              editingItem === item.id ? (
                <tr key={item.id} className="border-b bg-blue-50">
                  <td className="p-3"><input value={editForm.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})} className="w-full px-2 py-1 border rounded" /></td>
                  <td className="p-3"><input value={editForm.syscoCode} onChange={(e) => setEditForm({...editForm, syscoCode: e.target.value})} className="w-full px-2 py-1 border rounded" /></td>
                  <td className="p-3"><input value={editForm.unit} onChange={(e) => setEditForm({...editForm, unit: e.target.value})} className="w-20 px-2 py-1 border rounded" /></td>
                  <td className="p-3"><input type="number" value={editForm.syscoPrice} onChange={(e) => setEditForm({...editForm, syscoPrice: parseFloat(e.target.value)})} className="w-24 px-2 py-1 border rounded text-right" /></td>
                  <td className="p-3"><input value={editForm.syscoPackSize} onChange={(e) => setEditForm({...editForm, syscoPackSize: e.target.value})} className="w-24 px-2 py-1 border rounded" /></td>
                  <td className="text-right p-3">${((editForm.syscoPrice || 0) / parseCasePack(editForm.syscoPackSize)).toFixed(2)}</td>
                  <td className="text-center p-3">-</td>
                  <td className="p-3 text-center">
                    <button onClick={handleSave} className="px-3 py-1 bg-green-600 text-white rounded text-xs mr-1">Save</button>
                    <button onClick={() => setEditingItem(null)} className="px-3 py-1 bg-gray-500 text-white rounded text-xs">Cancel</button>
                  </td>
                </tr>
              ) : (
                <tr key={item.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">{item.name}</td>
                  <td className="p-3">{item.syscoCode || '-'}</td>
                  <td className="text-center p-3">{item.unit}</td>
                  <td className="text-right p-3">${(item.syscoPrice || item.unitPrice || 0).toFixed(2)}</td>
                  <td className="p-3">{item.syscoPackSize}</td>
                  <td className="text-right p-3 font-medium">${calculateEP(item).toFixed(2)}</td>
                  <td className="text-center p-3 text-xs text-gray-600">{formatDate(item.lastUpdated)}</td>
                  <td className="p-3 text-center relative">
                    <button 
                      onClick={() => setOpenMenuId(openMenuId === item.id ? null : item.id)}
                      className="text-gray-600 hover:text-gray-800 text-xl font-bold"
                    >
                      ⋮
                    </button>
                    {openMenuId === item.id && (
                      <div ref={menuRef} className="absolute right-0 mt-2 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                        <button
                          onClick={() => handleEdit(item)}
                          className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm text-red-600"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              )
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
