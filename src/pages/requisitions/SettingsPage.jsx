import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useSettings } from '../../hooks/useSettings';

function ActionMenu({ onEdit, onDelete }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600">⋮</button>
      {open && (
        <div className="absolute right-0 top-8 bg-white border rounded-lg shadow-lg z-10 py-1 min-w-[100px]">
          {onEdit && <button onClick={() => { onEdit(); setOpen(false); }} className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100">Edit</button>}
          {onDelete && <button onClick={() => { onDelete(); setOpen(false); }} className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50">Delete</button>}
        </div>
      )}
    </div>
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('instructors');
  const [instructors, setInstructors] = useState([]);
  const [classes, setClasses] = useState([]);
  const [semester, setSemester] = useState({ 
    name: 'Spring 2026', 
    term1Start: '2026-01-15', 
    term1End: '2026-03-15', 
    term2Start: '2026-03-23', 
    term2End: '2026-05-17' 
  });
  const [noClassDates, setNoClassDates] = useState([]);
  
  const [newInstructor, setNewInstructor] = useState('');
  const [editingInstructor, setEditingInstructor] = useState(null);
  const [newClass, setNewClass] = useState({ code: '', title: '', days: '', time: '', instructor: '' });
  const [editingClass, setEditingClass] = useState(null);
  const [newNoClassDate, setNewNoClassDate] = useState({ date: '', reason: '' });
  
  const { 
    categoryStructure, 
    vendors, 
    brands,
    updateCategoryStructure,
    updateVendors,
    updateBrands,
  } = useSettings();

  const [localVendors, setLocalVendors] = useState([]);
  const [newVendor, setNewVendor] = useState('');
  const [editingVendor, setEditingVendor] = useState(null);
  const [newCategory, setNewCategory] = useState('');
  const [editingCategory, setEditingCategory] = useState(null);
  const [addingSubcategoryTo, setAddingSubcategoryTo] = useState(null);
  const [newSubcategory, setNewSubcategory] = useState('');
  const [editingSubcategory, setEditingSubcategory] = useState(null);
  const [editingBrandsFor, setEditingBrandsFor] = useState(null);
  const [newBrand, setNewBrand] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [ingredientCounts, setIngredientCounts] = useState({});

  useEffect(() => { loadSettings(); loadIngredientCounts(); }, []);
  useEffect(() => { setLocalVendors(vendors); }, [vendors]);

  const loadSettings = async () => {
    const { data } = await supabase.from('settings').select('*');
    data?.forEach(row => {
      if (row.key === 'instructors') setInstructors(row.value || []);
      if (row.key === 'classes') setClasses(row.value || []);
      if (row.key === 'semester') setSemester(row.value || { name: 'Spring 2026', term1Start: '2026-01-15', term1End: '2026-03-15', term2Start: '2026-03-23', term2End: '2026-05-17' });
      if (row.key === 'noClassDates') setNoClassDates(row.value || []);
    });
  };

  const loadIngredientCounts = async () => {
    const { data } = await supabase.from('ingredients').select('category, subcategory');
    const counts = {};
    data?.forEach(ing => {
      counts[ing.category] = (counts[ing.category] || 0) + 1;
      counts[`${ing.category}|${ing.subcategory}`] = (counts[`${ing.category}|${ing.subcategory}`] || 0) + 1;
    });
    setIngredientCounts(counts);
  };

  const saveSetting = async (key, value) => {
    await supabase.from('settings').upsert({ key, value }, { onConflict: 'key' });
  };

  // Instructors
  const addInstructor = async () => {
    if (!newInstructor.trim() || instructors.includes(newInstructor.trim())) return;
    const updated = [...instructors, newInstructor.trim()].sort();
    setInstructors(updated);
    await saveSetting('instructors', updated);
    setNewInstructor('');
  };

  const updateInstructor = async (oldName, newName) => {
    if (!newName.trim() || (newName !== oldName && instructors.includes(newName.trim()))) return;
    const updated = instructors.map(i => i === oldName ? newName.trim() : i).sort();
    setInstructors(updated);
    await saveSetting('instructors', updated);
    setEditingInstructor(null);
  };

  const removeInstructor = async (name) => {
    const updated = instructors.filter(i => i !== name);
    setInstructors(updated);
    await saveSetting('instructors', updated);
  };

  // Classes
  const addClass = async () => {
    if (!newClass.code || !newClass.title) return;
    const updated = [...classes, { ...newClass, id: Date.now() }];
    setClasses(updated);
    await saveSetting('classes', updated);
    setNewClass({ code: '', title: '', days: '', time: '', instructor: '' });
  };

  const updateClass = async (id, field, value) => {
    const updated = classes.map(c => c.id === id ? { ...c, [field]: value } : c);
    setClasses(updated);
    await saveSetting('classes', updated);
  };

  const removeClass = async (id) => {
    const updated = classes.filter(c => c.id !== id);
    setClasses(updated);
    await saveSetting('classes', updated);
  };

  // Semester
  const saveSemester = async () => {
    await saveSetting('semester', semester);
  };

  // No-Class Dates
  const addNoClassDate = async () => {
    if (!newNoClassDate.date) return;
    const updated = [...noClassDates, newNoClassDate].sort((a, b) => a.date.localeCompare(b.date));
    setNoClassDates(updated);
    await saveSetting('noClassDates', updated);
    setNewNoClassDate({ date: '', reason: '' });
  };

  const removeNoClassDate = async (date) => {
    const updated = noClassDates.filter(d => d.date !== date);
    setNoClassDates(updated);
    await saveSetting('noClassDates', updated);
  };

  // Vendors
  const addVendor = async () => {
    if (!newVendor.trim() || localVendors.includes(newVendor.trim())) return;
    const updated = [...localVendors, newVendor.trim()].sort();
    setLocalVendors(updated);
    await updateVendors(updated);
    setNewVendor('');
  };

  const editVendor = async (oldName, newName) => {
    if (!newName.trim() || (newName !== oldName && localVendors.includes(newName.trim()))) return;
    const updated = localVendors.map(v => v === oldName ? newName.trim() : v).sort();
    setLocalVendors(updated);
    await updateVendors(updated);
    setEditingVendor(null);
  };

  const removeVendor = async (name) => {
    const updated = localVendors.filter(v => v !== name);
    setLocalVendors(updated);
    await updateVendors(updated);
  };

  // Categories
  const addCategory = async () => {
    if (!newCategory.trim() || categoryStructure[newCategory.trim()]) return;
    await updateCategoryStructure({ ...categoryStructure, [newCategory.trim()]: ['Other'] });
    setNewCategory('');
  };

  const renameCategory = async (oldName, newName) => {
    if (!newName.trim() || newName === oldName || categoryStructure[newName.trim()]) return;
    const updated = {};
    Object.keys(categoryStructure).forEach(key => {
      updated[key === oldName ? newName.trim() : key] = categoryStructure[key];
    });
    await updateCategoryStructure(updated);
    const updatedBrands = {};
    Object.keys(brands).forEach(key => {
      updatedBrands[key.startsWith(oldName + '|') ? key.replace(oldName + '|', newName.trim() + '|') : key] = brands[key];
    });
    await updateBrands(updatedBrands);
    await supabase.from('ingredients').update({ category: newName.trim() }).eq('category', oldName);
    setEditingCategory(null);
    loadIngredientCounts();
  };

  const removeCategory = async (name) => {
    const updated = { ...categoryStructure };
    delete updated[name];
    await updateCategoryStructure(updated);
    const updatedBrands = {};
    Object.keys(brands).forEach(key => { if (!key.startsWith(name + '|')) updatedBrands[key] = brands[key]; });
    await updateBrands(updatedBrands);
    setDeleteConfirm(null);
    loadIngredientCounts();
  };

  const addSubcategory = async (category) => {
    if (!newSubcategory.trim() || categoryStructure[category]?.includes(newSubcategory.trim())) return;
    await updateCategoryStructure({
      ...categoryStructure,
      [category]: [...(categoryStructure[category] || []), newSubcategory.trim()].sort()
    });
    setNewSubcategory('');
    setAddingSubcategoryTo(null);
  };

  const renameSubcategory = async (category, oldName, newName) => {
    if (!newName.trim() || newName === oldName || categoryStructure[category]?.includes(newName.trim())) return;
    await updateCategoryStructure({
      ...categoryStructure,
      [category]: categoryStructure[category].map(s => s === oldName ? newName.trim() : s).sort()
    });
    const oldKey = `${category}|${oldName}`;
    const newKey = `${category}|${newName.trim()}`;
    if (brands[oldKey]) {
      const updatedBrands = { ...brands, [newKey]: brands[oldKey] };
      delete updatedBrands[oldKey];
      await updateBrands(updatedBrands);
    }
    await supabase.from('ingredients').update({ subcategory: newName.trim() }).eq('category', category).eq('subcategory', oldName);
    setEditingSubcategory(null);
    loadIngredientCounts();
  };

  const removeSubcategory = async (category, subcategory) => {
    await supabase.from('ingredients').update({ subcategory: 'Other' }).eq('category', category).eq('subcategory', subcategory);
    await updateCategoryStructure({
      ...categoryStructure,
      [category]: categoryStructure[category].filter(s => s !== subcategory)
    });
    const brandKey = `${category}|${subcategory}`;
    if (brands[brandKey]) {
      const updatedBrands = { ...brands };
      delete updatedBrands[brandKey];
      await updateBrands(updatedBrands);
    }
    setDeleteConfirm(null);
    loadIngredientCounts();
  };

  // Brands
  const addBrand = async (category, subcategory) => {
    if (!newBrand.trim()) return;
    const key = `${category}|${subcategory}`;
    const current = brands[key] || [];
    if (current.includes(newBrand.trim())) return;
    await updateBrands({ ...brands, [key]: [...current, newBrand.trim()].sort() });
    setNewBrand('');
  };

  const removeBrand = async (category, subcategory, brand) => {
    const key = `${category}|${subcategory}`;
    await updateBrands({ ...brands, [key]: (brands[key] || []).filter(b => b !== brand) });
  };

  const tabs = [
    { id: 'instructors', label: 'Instructors' },
    { id: 'classes', label: 'Classes' },
    { id: 'semester', label: 'Semester' },
    { id: 'noclass', label: 'No-Class Dates' },
    { id: 'vendors', label: 'Vendors' },
    { id: 'categories', label: 'Categories' },
    { id: 'brands', label: 'Brands' }
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-blue-600">Settings</h1>
        <p className="text-gray-500">{semester.name}</p>
      </div>

      <div className="flex gap-1 mb-6 border-b">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 font-medium text-sm ${activeTab === tab.id ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Delete Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md">
            <h3 className="text-lg font-bold mb-2">Confirm Delete</h3>
            <p className="text-gray-600 mb-4">
              {deleteConfirm.type === 'category' 
                ? <>Delete "<strong>{deleteConfirm.name}</strong>"? {ingredientCounts[deleteConfirm.name] > 0 && <span className="text-red-600">({ingredientCounts[deleteConfirm.name]} ingredients affected)</span>}</>
                : <>Delete "<strong>{deleteConfirm.subcategory}</strong>"? {ingredientCounts[`${deleteConfirm.category}|${deleteConfirm.subcategory}`] > 0 && <span className="text-red-600">({ingredientCounts[`${deleteConfirm.category}|${deleteConfirm.subcategory}`]} items moved to "Other")</span>}</>
              }
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Cancel</button>
              <button onClick={() => deleteConfirm.type === 'category' ? removeCategory(deleteConfirm.name) : removeSubcategory(deleteConfirm.category, deleteConfirm.subcategory)} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Instructors */}
      {activeTab === 'instructors' && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <input type="text" value={newInstructor} onChange={(e) => setNewInstructor(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && addInstructor()} placeholder="Add instructor..." className="flex-1 px-4 py-2 border rounded-lg" />
            <button onClick={addInstructor} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Add</button>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {instructors.map(name => (
              <div key={name} className="flex items-center justify-between bg-white p-3 rounded-lg border">
                {editingInstructor === name ? (
                  <input type="text" defaultValue={name} autoFocus onBlur={(e) => updateInstructor(name, e.target.value)} onKeyPress={(e) => e.key === 'Enter' && updateInstructor(name, e.target.value)} className="flex-1 border-b border-blue-500 focus:outline-none text-sm" />
                ) : (
                  <span className="text-sm">{name}</span>
                )}
                <ActionMenu onEdit={() => setEditingInstructor(name)} onDelete={() => removeInstructor(name)} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Classes */}
      {activeTab === 'classes' && (
        <div className="space-y-3">
          <div className="grid grid-cols-6 gap-2">
            <input type="text" value={newClass.code} onChange={(e) => setNewClass({...newClass, code: e.target.value})} placeholder="Code" className="px-3 py-2 border rounded text-sm" />
            <input type="text" value={newClass.title} onChange={(e) => setNewClass({...newClass, title: e.target.value})} placeholder="Title" className="px-3 py-2 border rounded text-sm col-span-2" />
            <input type="text" value={newClass.days} onChange={(e) => setNewClass({...newClass, days: e.target.value})} placeholder="Days" className="px-3 py-2 border rounded text-sm" />
            <input type="text" value={newClass.time} onChange={(e) => setNewClass({...newClass, time: e.target.value})} placeholder="Time" className="px-3 py-2 border rounded text-sm" />
            <button onClick={addClass} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">Add</button>
          </div>
          <div className="space-y-2">
            {classes.map(c => (
              <div key={c.id} className="flex items-center justify-between bg-white p-3 rounded-lg border">
                {editingClass === c.id ? (
                  <div className="flex-1 grid grid-cols-5 gap-2 mr-2">
                    <input type="text" defaultValue={c.code} onBlur={(e) => updateClass(c.id, 'code', e.target.value)} className="px-2 py-1 border rounded text-sm" />
                    <input type="text" defaultValue={c.title} onBlur={(e) => updateClass(c.id, 'title', e.target.value)} className="px-2 py-1 border rounded text-sm col-span-2" />
                    <input type="text" defaultValue={c.days} onBlur={(e) => updateClass(c.id, 'days', e.target.value)} className="px-2 py-1 border rounded text-sm" />
                    <input type="text" defaultValue={c.time} onBlur={(e) => updateClass(c.id, 'time', e.target.value)} className="px-2 py-1 border rounded text-sm" />
                  </div>
                ) : (
                  <span className="text-sm"><strong>{c.code}</strong> - {c.title} <span className="text-gray-500">({c.days} {c.time})</span></span>
                )}
                <ActionMenu onEdit={() => setEditingClass(editingClass === c.id ? null : c.id)} onDelete={() => removeClass(c.id)} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Semester */}
      {activeTab === 'semester' && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium">Active Semester:</label>
              <select value={semester.name} onChange={(e) => setSemester({...semester, name: e.target.value})} className="px-3 py-2 border rounded">
                <option value="Spring 2026">Spring 2026</option>
                <option value="Summer 2026">Summer 2026</option>
                <option value="Fall 2026">Fall 2026</option>
                <option value="Spring 2027">Spring 2027</option>
              </select>
              <button onClick={saveSemester} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">Save</button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-lg border p-4">
              <h3 className="font-medium text-blue-700 mb-3">Term 1 (8 weeks)</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Start</label>
                  <input type="date" value={semester.term1Start || ''} onChange={(e) => setSemester({...semester, term1Start: e.target.value})} className="w-full px-3 py-2 border rounded text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">End</label>
                  <input type="date" value={semester.term1End || ''} onChange={(e) => setSemester({...semester, term1End: e.target.value})} className="w-full px-3 py-2 border rounded text-sm" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg border p-4">
              <h3 className="font-medium text-blue-700 mb-3">Term 2 (8 weeks)</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Start</label>
                  <input type="date" value={semester.term2Start || ''} onChange={(e) => setSemester({...semester, term2Start: e.target.value})} className="w-full px-3 py-2 border rounded text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">End</label>
                  <input type="date" value={semester.term2End || ''} onChange={(e) => setSemester({...semester, term2End: e.target.value})} className="w-full px-3 py-2 border rounded text-sm" />
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
            <p className="font-medium mb-2">PCC Academic Calendar Reference:</p>
            <div className="grid grid-cols-3 gap-4">
              <div><strong>Spring:</strong> Jan-May</div>
              <div><strong>Summer:</strong> Jun-Aug</div>
              <div><strong>Fall:</strong> Aug-Dec</div>
            </div>
          </div>
        </div>
      )}

      {/* No-Class Dates */}
      {activeTab === 'noclass' && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <input type="date" value={newNoClassDate.date} onChange={(e) => setNewNoClassDate({...newNoClassDate, date: e.target.value})} className="px-3 py-2 border rounded" />
            <input type="text" value={newNoClassDate.reason} onChange={(e) => setNewNoClassDate({...newNoClassDate, reason: e.target.value})} placeholder="Reason" className="flex-1 px-3 py-2 border rounded" />
            <button onClick={addNoClassDate} className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Add</button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {noClassDates.map(d => (
              <div key={d.date} className="flex items-center justify-between bg-white p-3 rounded-lg border">
                <span className="text-sm"><strong>{d.date}</strong> — {d.reason}</span>
                <ActionMenu onDelete={() => removeNoClassDate(d.date)} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Vendors */}
      {activeTab === 'vendors' && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <input type="text" value={newVendor} onChange={(e) => setNewVendor(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && addVendor()} placeholder="Add vendor..." className="flex-1 px-4 py-2 border rounded-lg" />
            <button onClick={addVendor} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Add</button>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {localVendors.map(name => (
              <div key={name} className="flex items-center justify-between bg-white p-3 rounded-lg border">
                {editingVendor === name ? (
                  <input type="text" defaultValue={name} autoFocus onBlur={(e) => editVendor(name, e.target.value)} onKeyPress={(e) => e.key === 'Enter' && editVendor(name, e.target.value)} className="flex-1 border-b border-blue-500 focus:outline-none text-sm" />
                ) : (
                  <span className="text-sm">{name}</span>
                )}
                <ActionMenu onEdit={() => setEditingVendor(name)} onDelete={() => removeVendor(name)} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Categories */}
      {activeTab === 'categories' && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <input type="text" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && addCategory()} placeholder="Add category..." className="flex-1 px-4 py-2 border rounded-lg" />
            <button onClick={addCategory} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Add</button>
          </div>
          <div className="space-y-2">
            {Object.entries(categoryStructure).sort().map(([category, subcategories]) => (
              <div key={category} className="bg-white p-3 rounded-lg border">
                <div className="flex items-center justify-between mb-2">
                  {editingCategory === category ? (
                    <input type="text" defaultValue={category} autoFocus onBlur={(e) => renameCategory(category, e.target.value)} onKeyPress={(e) => e.key === 'Enter' && renameCategory(category, e.target.value)} className="font-medium text-blue-700 border-b border-blue-500 focus:outline-none" />
                  ) : (
                    <span className="font-medium text-blue-700">{category} <span className="text-xs text-gray-400 font-normal">({ingredientCounts[category] || 0})</span></span>
                  )}
                  <ActionMenu onEdit={() => setEditingCategory(category)} onDelete={() => setDeleteConfirm({ type: 'category', name: category })} />
                </div>
                <div className="flex flex-wrap gap-1">
                  {subcategories.map(sub => {
                    const subKey = `${category}|${sub}`;
                    return (
                      <span key={sub} className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">
                        {editingSubcategory === subKey ? (
                          <input type="text" defaultValue={sub} autoFocus onBlur={(e) => renameSubcategory(category, sub, e.target.value)} onKeyPress={(e) => e.key === 'Enter' && renameSubcategory(category, sub, e.target.value)} className="w-20 bg-transparent border-b border-blue-500 focus:outline-none" />
                        ) : (
                          <span onClick={() => setEditingSubcategory(subKey)} className="cursor-pointer">{sub}</span>
                        )}
                        <span className="text-gray-400">({ingredientCounts[subKey] || 0})</span>
                        <button onClick={() => setDeleteConfirm({ type: 'subcategory', category, subcategory: sub })} className="hover:text-red-500">×</button>
                      </span>
                    );
                  })}
                  {addingSubcategoryTo === category ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 rounded text-xs">
                      <input type="text" value={newSubcategory} onChange={(e) => setNewSubcategory(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && addSubcategory(category)} placeholder="name..." className="w-20 bg-transparent border-b border-blue-500 focus:outline-none" autoFocus />
                      <button onClick={() => addSubcategory(category)} className="text-blue-600">✓</button>
                      <button onClick={() => { setAddingSubcategoryTo(null); setNewSubcategory(''); }} className="text-gray-400">×</button>
                    </span>
                  ) : (
                    <button onClick={() => setAddingSubcategoryTo(category)} className="text-blue-600 text-xs hover:underline">+ add</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Brands */}
      {activeTab === 'brands' && (
        <div className="space-y-2">
          {Object.entries(categoryStructure).sort().map(([category, subcategories]) => (
            <div key={category} className="bg-white p-3 rounded-lg border">
              <h3 className="font-medium text-blue-700 mb-2">{category}</h3>
              <div className="space-y-2">
                {subcategories.map(sub => {
                  const key = `${category}|${sub}`;
                  const subBrands = brands[key] || [];
                  return (
                    <div key={sub} className="pl-3 border-l-2 border-blue-100">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm text-gray-600">{sub}</span>
                        <span className="text-xs text-gray-400">({subBrands.length})</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {subBrands.map(brand => (
                          <span key={brand} className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">
                            {brand}
                            <button onClick={() => removeBrand(category, sub, brand)} className="hover:text-red-500">×</button>
                          </span>
                        ))}
                        {editingBrandsFor === key ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 rounded text-xs">
                            <input type="text" value={newBrand} onChange={(e) => setNewBrand(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && addBrand(category, sub)} placeholder="brand..." className="w-20 bg-transparent border-b border-blue-500 focus:outline-none" autoFocus />
                            <button onClick={() => addBrand(category, sub)} className="text-blue-600">✓</button>
                            <button onClick={() => { setEditingBrandsFor(null); setNewBrand(''); }} className="text-gray-400">×</button>
                          </span>
                        ) : (
                          <button onClick={() => setEditingBrandsFor(key)} className="text-blue-600 text-xs hover:underline">+ add</button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
