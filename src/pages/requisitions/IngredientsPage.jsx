import React, { useState, useEffect, useRef, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
// Ingredients now loaded from Supabase
import { getRequisitions, updateRequisition, supabase, getIngredientCustomizations, saveIngredientCustomization, deleteIngredientDB, setInstructorVisibility, bulkSetInstructorVisibility, getIngredients, saveIngredient, deleteIngredient } from "../../lib/supabase";
import { useSettings } from "../../hooks/useSettings";
import { calculateUnitPrice } from "../../utils/packSizeParser";

export default function IngredientsPage() {
  const [searchParams] = useSearchParams();
  const { categoryStructure, categories, vendors } = useSettings();
  const [ingredients, setIngredients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterVendor, setFilterVendor] = useState('');
  const [filterSubcategory, setFilterSubcategory] = useState('');
  const [filterProgram, setFilterProgram] = useState('');
  const [filterMissing, setFilterMissing] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [sortColumn, setSortColumn] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [showImportModal, setShowImportModal] = useState(false);
  const [importData, setImportData] = useState([]);
  const [importMatches, setImportMatches] = useState({});
  const [openMenuId, setOpenMenuId] = useState(null);
  const [viewMode, setViewMode] = useState('grouped');
  const [showAllColumns, setShowAllColumns] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [pendingChanges, setPendingChanges] = useState({});
  const [pendingDeletes, setPendingDeletes] = useState(new Set());
  const [instructorHidden, setInstructorHidden] = useState(new Set());
  const [matchingItem, setMatchingItem] = useState(null);
  const [matchSearch, setMatchSearch] = useState('');
  const [columnOrder, setColumnOrder] = useState(['name', 'brand', 'category', 'subcategory', 'unit', 'vendor', 'vendorCode', 'packSize', 'casePrice', 'unitPrice', 'programs', 'instructor', 'lastUpdated']);
  const [draggedColumn, setDraggedColumn] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);
  const fileInputRef = useRef(null);
  
  const [newIngredient, setNewIngredient] = useState({
    name: '', category: 'Produce', subcategory: 'Other', unit: 'lb',
    vendor: 'Sysco', vendorCode: '', packSize: '', casePrice: 0, unitPrice: 0, servingsPerCase: 0, programs: []
  });

  const units = ['lb', 'oz', 'g', 'kg', 'ea', 'doz', 'bunch', 'qt', 'gal', 'pt', 'cup', 'can', 'bottle', 'jar', 'bag', 'box', 'case', 'c', 'L', 'mL'];

  // Load ingredients from Supabase
  useEffect(() => {
    loadIngredients();
    const editName = searchParams.get('edit');
    if (editName) setSearchTerm(editName);
  }, [searchParams]);

  const loadIngredients = async () => {
    try {
      const { data, error } = await supabase.from('ingredients').select('*').order('name');
      if (error) throw error;
      const mapped = data.map(row => ({
        id: row.id,
        name: row.name,
        category: row.category,
        subcategory: row.subcategory,
        unit: row.unit,
        vendor: row.vendor || 'Sysco',
        vendorCode: row.vendor_code,
        packSize: row.pack_size,
        casePrice: row.case_price || 0,
        unitPrice: row.unit_price || 0,
        brand: row.brand,
        programs: row.programs || ['Baking & Pastry Arts', 'Culinary Arts', 'Foodservice'],
        storage: row.storage,
        lastUpdated: row.updated_at,
        hiddenFromInstructor: row.hidden_from_instructor
      }));
      setIngredients(mapped);
      const hidden = new Set(mapped.filter(i => i.hiddenFromInstructor).map(i => i.id));
      setInstructorHidden(hidden);
    } catch (err) {
      console.error('Error loading ingredients:', err);
    }
  };

  // Calculate unit price from pack size
  const calculateUnitPriceFromPack = (item) => {
    if (!item.packSize || !item.casePrice) return item.unitPrice || 0;
    const pack = item.packSize;
    const casePrice = item.casePrice || 0;
    const match = pack.match(/^(\d+)\/(\d+\.?\d*)\s*(LB|OZ|GAL|QT|CT|EA|PC|DZ|KG|G|L|ML)?$/i);
    if (match) {
      const count = parseFloat(match[1]);
      const size = parseFloat(match[2]);
      const unitType = (match[3] || '').toUpperCase();
      let totalUnits = count * size;
      if (unitType === 'OZ') totalUnits = totalUnits / 16;
      else if (unitType === 'G') totalUnits = totalUnits / 453.6;
      else if (unitType === 'ML') totalUnits = totalUnits / 946;
      if (totalUnits > 0) return casePrice / totalUnits;
    }
    const singleMatch = pack.match(/^(\d+\.?\d*)\s*(LB|OZ|GAL|QT|CT|EA|PC|DZ|KG|G|L|ML)?$/i);
    if (singleMatch) {
      let units = parseFloat(singleMatch[1]);
      const unitType = (singleMatch[2] || '').toUpperCase();
      if (unitType === 'OZ') units = units / 16;
      else if (unitType === 'G') units = units / 453.6;
      if (units > 0) return casePrice / units;
    }
    return item.unitPrice || 0;
  };

  const getCalculatedPrices = (item) => {
    const casePrice = item.casePrice || item.syscoPrice || 0;
    const unitPrice = calculateUnitPriceFromPack({ ...item, casePrice }) || item.unitPrice || 0;
    return { casePrice, unitPrice };
  };

  // Column definitions
  const columnDefs = {
    name: { label: 'Name', align: 'left', sortable: true, render: (ing) => <span className="font-medium">{ing.name}</span> },
    brand: { label: 'Brand', align: 'left', sortable: true, render: (ing) => ing.brand || '-' },
    category: { label: 'Category', align: 'left', sortable: true, render: (ing) => ing.category },
    subcategory: { label: 'Subcategory', align: 'left', sortable: true, render: (ing) => ing.subcategory || '-' },
    unit: { label: 'Unit', align: 'center', sortable: true, render: (ing) => ing.unit },
    vendor: { label: 'Vendor', align: 'left', sortable: true, render: (ing) => ing.vendor || 'Sysco' },
    vendorCode: { label: 'UPC', align: 'left', sortable: true, render: (ing) => <span className="font-mono text-xs">{ing.vendorCode || '-'}</span> },
    packSize: { label: 'Pack', align: 'left', sortable: true, render: (ing) => ing.packSize || '-' },
    casePrice: { label: 'Case $', align: 'right', sortable: true, render: (ing) => `$${(ing.casePrice || 0).toFixed(2)}` },
    unitPrice: { label: '$/Unit', align: 'right', sortable: true, render: (ing) => <span className="text-green-700 font-medium">${(calculateUnitPriceFromPack(ing) || ing.unitPrice || 0).toFixed(4)}</span> },
    programs: { label: 'Prog', align: 'center', sortable: false, render: (ing) => <span className="text-xs">{(ing.programs || []).map(p => p === 'Baking & Pastry Arts' ? 'B' : p === 'Culinary Arts' ? 'C' : 'F').join('')}</span> },
    instructor: { label: 'Vis', align: 'center', sortable: false, render: (ing) => <button onClick={() => toggleInstructorVisibility(ing.id)} className={`text-lg ${instructorHidden.has(ing.id) ? 'text-red-500' : 'text-green-600'}`}>{instructorHidden.has(ing.id) ? '✕' : '✓'}</button> },
    lastUpdated: { label: 'Updated', align: 'left', sortable: true, render: (ing) => ing.lastUpdated ? new Date(ing.lastUpdated).toLocaleDateString() : '-' }
  };

  // Get unique values for filters
  const allCategories = [...new Set(ingredients.map(i => i.category))].filter(Boolean).sort();
  const allSubcategories = [...new Set(ingredients.filter(i => !filterCategory || i.category === filterCategory).map(i => i.subcategory))].filter(Boolean).sort();
  const allVendors = [...new Set(ingredients.map(i => i.vendor))].filter(Boolean).sort();

  // Toggle instructor visibility
  const toggleInstructorVisibility = async (id) => {
    const newHidden = !instructorHidden.has(id);
    setInstructorHidden(prev => {
      const next = new Set(prev);
      if (newHidden) next.add(id);
      else next.delete(id);
      return next;
    });
    await setInstructorVisibility(id, newHidden);
  };

  const hideSelectedFromInstructor = async () => {
    const ids = Array.from(selectedItems);
    setInstructorHidden(prev => new Set([...prev, ...ids]));
    await bulkSetInstructorVisibility(ids, true);
  };

  const showSelectedToInstructor = async () => {
    const ids = Array.from(selectedItems);
    setInstructorHidden(prev => {
      const next = new Set(prev);
      ids.forEach(id => next.delete(id));
      return next;
    });
    await bulkSetInstructorVisibility(ids, false);
  };

  // Toggle program for ingredient
  const toggleProgram = async (id, program) => {
    const ing = ingredients.find(i => i.id === id);
    if (!ing) return;
    const current = ing.programs || [];
    const updated = current.includes(program)
      ? current.filter(p => p !== program)
      : [...current, program];
    await saveIngredientEdit(id, { programs: updated });
    setIngredients(prev => prev.map(i => i.id === id ? { ...i, programs: updated } : i));
  };

  // Save ingredient edit to Supabase
  const saveIngredientEdit = async (id, updates) => {
    const timestamp = new Date().toISOString();
    const validFields = ['name', 'category', 'subcategory', 'unit', 'vendor', 'brand', 'programs', 'storage'];
    const fieldMap = {
      vendorCode: 'vendor_code',
      packSize: 'pack_size',
      casePrice: 'case_price',
      unitPrice: 'unit_price',
      hiddenFromInstructor: 'hidden_from_instructor'
    };
    const dbUpdates = { updated_at: timestamp };
    for (const [key, value] of Object.entries(updates)) {
      if (validFields.includes(key)) {
        dbUpdates[key] = value;
      } else if (fieldMap[key]) {
        dbUpdates[fieldMap[key]] = value;
      }
    }
    const { error } = await supabase.from('ingredients').update(dbUpdates).eq('id', id);
    if (error) {
      console.error('Save error:', error);
      alert('Save failed: ' + error.message);
    }
    return timestamp;
  };

  // Inline edit handler
  const handleInlineEdit = async (id, field, value) => {
    await saveIngredientEdit(id, { [field]: value });
    setIngredients(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  // Edit modal handlers
  const handleEdit = (ingredient) => {
    setEditingId(ingredient.id);
    setEditForm({
      ...ingredient,
      vendor: ingredient.vendor || 'Sysco',
      vendorCode: ingredient.vendorCode || '',
      packSize: ingredient.packSize || '',
      casePrice: ingredient.casePrice || 0,
      unitPrice: ingredient.unitPrice || 0,
      subcategory: ingredient.subcategory || 'Other',
      programs: ingredient.programs || ['Baking & Pastry Arts', 'Culinary Arts', 'Foodservice']
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    const timestamp = await saveIngredientEdit(editingId, editForm);
    setIngredients(prev => prev.map(i => i.id === editingId ? { ...i, ...editForm, lastUpdated: timestamp } : i));
    setEditingId(null);
    setEditForm({});
    setShowEditModal(false);
  };

  const handleCancelEdit = () => { setEditingId(null); setEditForm({}); setShowEditModal(false); };

  // Add new ingredient
  const handleAddIngredient = async () => {
    if (!newIngredient.name.trim()) { alert('Please enter an ingredient name'); return; }
    const id = 'CUSTOM-' + Date.now();
    const timestamp = new Date().toISOString();
    const ingredient = { ...newIngredient, id, lastUpdated: timestamp };
    await saveIngredientCustomization(id, ingredient, true);
    setIngredients(prev => [...prev, ingredient]);
    setNewIngredient({ name: '', category: 'Produce', subcategory: 'Other', unit: 'lb', vendor: 'Sysco', vendorCode: '', packSize: '', casePrice: 0, unitPrice: 0, servingsPerCase: 0, programs: [] });
    setShowAddForm(false);
  };

  // Delete ingredient
  const handleDeleteIngredient = async (id) => {
    const ing = ingredients.find(i => i.id === id);
    if (!window.confirm("Delete " + (ing?.name || "this ingredient") + "?")) return;
    await deleteIngredientDB(id);
    setIngredients(prev => prev.filter(i => i.id !== id));
    setOpenMenuId(null);
  };

  // Duplicate ingredient
  const handleDuplicateIngredient = async (ing) => {
    const id = "CUSTOM-" + Date.now();
    const duplicate = { ...ing, id, name: ing.name + " (Copy)", lastUpdated: new Date().toISOString() };
    await saveIngredientCustomization(id, duplicate, true);
    setIngredients(prev => [...prev, duplicate]);
    setOpenMenuId(null);
  };

  // Export to CSV
  const exportIngredients = () => {
    let csv = 'Name,Brand,Category,Subcategory,Unit,Vendor,Code,Pack Size,Case Price,Unit Price\n';
    filteredIngredients.forEach(ing => {
      csv += `"${ing.name}","${ing.brand || ''}","${ing.category}","${ing.subcategory || ''}","${ing.unit}","${ing.vendor || 'Sysco'}","${ing.vendorCode || ''}","${ing.packSize || ''}",${(ing.casePrice || 0).toFixed(2)},${(ing.unitPrice || 0).toFixed(4)}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ingredients.csv';
    a.click();
  };

  // Selection handlers
  const toggleSelected = (id) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelectedItems(new Set(filteredIngredients.map(i => i.id)));
  const selectNone = () => setSelectedItems(new Set());

  // Bulk update handlers
  const bulkUpdateCategory = async (category) => {
    if (!category) return;
    const ids = Array.from(selectedItems);
    for (const id of ids) {
      await saveIngredientEdit(id, { category });
    }
    setIngredients(prev => prev.map(i => selectedItems.has(i.id) ? { ...i, category } : i));
  };

  const bulkUpdateVendor = async (vendor) => {
    if (!vendor) return;
    const ids = Array.from(selectedItems);
    for (const id of ids) {
      await saveIngredientEdit(id, { vendor });
    }
    setIngredients(prev => prev.map(i => selectedItems.has(i.id) ? { ...i, vendor } : i));
  };

  // Sort handler
  const handleSort = (column) => {
    if (!columnDefs[column]?.sortable) return;
    if (sortColumn === column) setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortColumn(column); setSortDirection('asc'); }
  };

  const getSortValue = (ing, col) => {
    switch (col) {
      case 'name': return ing.name || '';
      case 'brand': return ing.brand || '';
      case 'category': return ing.category || '';
      case 'subcategory': return ing.subcategory || '';
      case 'unit': return ing.unit || '';
      case 'vendor': return ing.vendor || '';
      case 'vendorCode': return ing.vendorCode || '';
      case 'packSize': return ing.packSize || '';
      case 'casePrice': return ing.casePrice || 0;
      case 'unitPrice': return ing.unitPrice || 0;
      case 'lastUpdated': return ing.lastUpdated || '';
      default: return '';
    }
  };

  // Column drag handlers
  const handleColumnDragStart = (e, col) => { setDraggedColumn(col); e.dataTransfer.effectAllowed = 'move'; };
  const handleColumnDragOver = (e, col) => { e.preventDefault(); setDragOverColumn(col); };
  const handleColumnDrop = (e, col) => {
    e.preventDefault();
    if (!draggedColumn || draggedColumn === col) return;
    const newOrder = [...columnOrder];
    const fromIdx = newOrder.indexOf(draggedColumn);
    const toIdx = newOrder.indexOf(col);
    newOrder.splice(fromIdx, 1);
    newOrder.splice(toIdx, 0, draggedColumn);
    setColumnOrder(newOrder);
    setDraggedColumn(null);
    setDragOverColumn(null);
  };
  const handleColumnDragEnd = () => { setDraggedColumn(null); setDragOverColumn(null); };

  // Filter ingredients
  const filteredIngredients = ingredients.filter(ing => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = !term || ing.name.toLowerCase().includes(term) || (ing.brand || '').toLowerCase().includes(term) || (ing.vendorCode || '').toLowerCase().includes(term);
    const matchesCategory = !filterCategory || ing.category === filterCategory;
    const matchesVendor = !filterVendor || ing.vendor === filterVendor;
    const matchesSubcategory = !filterSubcategory || ing.subcategory === filterSubcategory;
    const matchesProgram = !filterProgram || (ing.programs || []).includes(filterProgram);
    const casePrice = ing.casePrice || 0;
    const vendorCode = ing.vendorCode || '';
    const matchesMissing = !filterMissing || 
      (filterMissing === 'price' && casePrice === 0) ||
      (filterMissing === 'code' && !vendorCode) ||
      (filterMissing === 'both' && (casePrice === 0 || !vendorCode));
    return matchesSearch && matchesCategory && matchesVendor && matchesSubcategory && matchesProgram && matchesMissing;
  }).sort((a, b) => {
    const aVal = getSortValue(a, sortColumn);
    const bVal = getSortValue(b, sortColumn);
    const cmp = typeof aVal === 'number' ? aVal - bVal : String(aVal).localeCompare(String(bVal));
    return sortDirection === 'asc' ? cmp : -cmp;
  });

  // Group ingredients by category/subcategory
  const groupedIngredients = useMemo(() => {
    const groups = {};
    filteredIngredients.forEach(item => {
      const cat = item.category || 'Other';
      const subcat = item.subcategory || 'General';
      if (!groups[cat]) groups[cat] = {};
      if (!groups[cat][subcat]) groups[cat][subcat] = [];
      groups[cat][subcat].push(item);
    });
    const sortedGroups = {};
    Object.keys(groups).sort().forEach(cat => {
      sortedGroups[cat] = {};
      Object.keys(groups[cat]).sort().forEach(subcat => {
        sortedGroups[cat][subcat] = groups[cat][subcat];
      });
    });
    return sortedGroups;
  }, [filteredIngredients]);

  const visibleColumns = showAllColumns
    ? columnOrder
    : columnOrder.filter(c => !['vendorCode', 'lastUpdated'].includes(c));

  const allInViewSelected = filteredIngredients.length > 0 && filteredIngredients.every(i => selectedItems.has(i.id));

  // Ingredient Card component for card view
  const IngredientCard = ({ ing }) => {
    const isSelected = selectedItems.has(ing.id);
    const isHidden = instructorHidden.has(ing.id);
    return (
      <div className={`border rounded-lg shadow-sm hover:shadow-md transition-shadow ${isSelected ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-white'}`}>
        <div className="p-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <button onClick={() => toggleSelected(ing.id)} className={`w-5 h-5 rounded border flex items-center justify-center text-xs flex-shrink-0 ${isSelected ? 'bg-green-500 text-white border-green-600' : 'bg-white border-gray-400'}`}>{isSelected ? '✓' : ''}</button>
              <div>
                <h4 className="font-medium text-sm">{ing.name}</h4>
                {ing.brand && <p className="text-xs text-blue-600">{ing.brand}</p>}
              </div>
            </div>
            <button onClick={() => toggleInstructorVisibility(ing.id)} className={`text-sm px-1 ${isHidden ? 'text-red-500' : 'text-green-600'}`}>{isHidden ? '✕' : '✓'}</button>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            <p>{ing.category} › {ing.subcategory || 'General'}</p>
            <p>{ing.vendor || 'Sysco'} {ing.vendorCode && `• ${ing.vendorCode}`}</p>
          </div>
          <div className="mt-2 flex justify-between items-center">
            <span className="text-xs">{ing.packSize || '-'}</span>
            <div className="text-right">
              <p className="text-sm font-medium">${(ing.casePrice || 0).toFixed(2)}</p>
              <p className="text-xs text-green-700">${(calculateUnitPriceFromPack(ing) || 0).toFixed(4)}/{ing.unit}</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 max-w-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Ingredients</h2>
          <p className="text-sm text-gray-500">{filteredIngredients.length} of {ingredients.length} items</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowAddForm(true)} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">+ Add</button>
          <button onClick={exportIngredients} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">↓ Export</button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border rounded-lg p-4 mb-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex-1 min-w-64">
            <input
              type="text"
              placeholder="Search ingredients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>
          <select value={filterCategory} onChange={(e) => { setFilterCategory(e.target.value); setFilterSubcategory(''); }} className="px-3 py-2 border rounded-lg">
            <option value="">All Categories</option>
            {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={filterSubcategory} onChange={(e) => setFilterSubcategory(e.target.value)} className="px-3 py-2 border rounded-lg">
            <option value="">All Subcategories</option>
            {allSubcategories.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={filterVendor} onChange={(e) => setFilterVendor(e.target.value)} className="px-3 py-2 border rounded-lg">
            <option value="">All Vendors</option>
            {allVendors.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
          <select value={filterProgram} onChange={(e) => setFilterProgram(e.target.value)} className="px-3 py-2 border rounded-lg">
            <option value="">All Programs</option>
            <option value="Baking & Pastry Arts">Baking</option>
            <option value="Culinary Arts">Culinary</option>
            <option value="Foodservice">Foodservice</option>
          </select>
          <select value={filterMissing} onChange={(e) => setFilterMissing(e.target.value)} className="px-3 py-2 border rounded-lg bg-yellow-50">
            <option value="">All Items</option>
            <option value="price">Missing Price</option>
            <option value="code">Missing Code</option>
            <option value="both">Missing Any</option>
          </select>
        </div>
        <div className="flex justify-between items-center mt-3 pt-3 border-t">
          <div className="flex items-center gap-2">
            <button onClick={() => setEditMode(!editMode)} className={`px-3 py-1.5 text-sm rounded ${editMode ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {editMode ? '✓ Edit Mode' : '✎ Edit Mode'}
            </button>
            <span className="text-sm text-gray-500 ml-4">{filteredIngredients.length} items</span>
          </div>
          <div className="flex items-center">
            <button onClick={() => setViewMode('grouped')} className={`px-3 py-1.5 text-sm rounded-l border ${viewMode === 'grouped' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}>Grouped</button>
            <button onClick={() => setViewMode('table')} className={`px-3 py-1.5 text-sm rounded-r border-t border-b border-r ${viewMode === 'table' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}>Table</button>
            {viewMode === 'table' && <label className="flex items-center gap-1 text-xs ml-2"><input type="checkbox" checked={showAllColumns} onChange={(e) => setShowAllColumns(e.target.checked)} /> All Cols</label>}
          </div>
        </div>
      </div>

      {/* Bulk actions */}
      {selectedItems.size > 0 && (
        <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-300 flex flex-wrap gap-3 items-center">
          <span className="font-bold text-green-800">✓ {selectedItems.size}</span>
          <select onChange={(e) => { bulkUpdateCategory(e.target.value); e.target.value = ''; }} className="px-2 py-1 border rounded text-xs">
            <option value="">Category...</option>
            {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select onChange={(e) => { bulkUpdateVendor(e.target.value); e.target.value = ''; }} className="px-2 py-1 border rounded text-xs">
            <option value="">Vendor...</option>
            {allVendors.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
          <button onClick={hideSelectedFromInstructor} className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs">Hide</button>
          <button onClick={showSelectedToInstructor} className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">Show</button>
          <button onClick={selectNone} className="px-2 py-1 bg-gray-200 rounded text-xs">Clear</button>
        </div>
      )}

      {/* Grouped View */}
      {viewMode === 'grouped' && (
        <div className="space-y-6">
          {Object.entries(groupedIngredients).map(([category, subcategories]) => (
            <div key={category} className="border rounded-lg overflow-hidden">
              <h4 className="font-bold text-blue-800 bg-blue-100 px-4 py-3 text-lg">{category}</h4>
              <table className="w-full">
                <thead className="text-xs text-gray-500 bg-gray-50">
                  <tr>
                    <th className="w-6 p-1"></th>
                    <th className="w-8 p-2"></th>
                    <th className="text-left px-3 py-2">Item</th>
                    <th className="text-left px-3 py-2 w-20">Unit</th>
                    <th className="text-right px-3 py-2 w-24">Case $</th>
                    <th className="text-right px-3 py-2 w-20">$/Unit</th>
                    <th className="w-16 p-2 text-center">Prog</th>
                    <th className="w-12 p-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(subcategories).map(([subcategory, items]) => (
                    <React.Fragment key={subcategory}>
                      <tr className="bg-blue-50">
                        <td colSpan={8} className="px-4 py-2 font-semibold text-blue-600 border-l-4 border-blue-400">
                          {subcategory} ({items.length})
                        </td>
                      </tr>
                      {items.map(item => {
                        const isSelected = selectedItems.has(item.id);
                        const isHidden = instructorHidden.has(item.id);
                        const casePrice = item.casePrice || 0;
                        const unitPrice = calculateUnitPriceFromPack(item) || item.unitPrice || 0;
                        return (
                          <tr key={item.id} className={`border-t border-gray-100 hover:bg-gray-50 ${isSelected ? 'bg-green-50' : ''} `}>
                            <td className="p-1 text-center cursor-grab text-gray-400 hover:text-gray-600">⋮⋮</td>
                            <td className="p-2 text-center">
                              <button onClick={() => toggleSelected(item.id)} className={`w-5 h-5 rounded border flex items-center justify-center text-xs mx-auto ${isSelected ? 'bg-green-500 text-white border-green-600' : 'bg-white border-gray-400'}`}>
                                {isSelected ? '✓' : ''}
                              </button>
                            </td>
                            <td className="px-3 py-2">
                              <div className="font-semibold text-gray-900">{item.name}</div>
                              <div className="text-xs text-gray-500">{item.vendorCode || '0000000'} | {item.vendor || '-'} | {item.packSize || '-'} | {item.brand || '-'}</div>
                            </td>
                            <td className="px-3 py-2 text-gray-600">{item.unit}</td>
                            <td className="px-3 py-2 text-right">${casePrice.toFixed(2)}</td>
                            <td className="px-3 py-2 text-right font-medium text-green-700">${unitPrice.toFixed(4)}</td>
                            <td className="p-2 text-center text-xs">{(item.programs || []).map(p => p === 'Baking & Pastry Arts' ? 'B' : p === 'Culinary Arts' ? 'C' : 'F').join('')}</td>
                            <td className="p-2 text-center relative">
                              <button onClick={() => setOpenMenuId(openMenuId === item.id ? null : item.id)} className="px-2 py-1 text-gray-500 hover:bg-gray-100 rounded">⋮</button>
                              {openMenuId === item.id && (
                                <div className="absolute right-0 top-8 bg-white border rounded-lg shadow-lg z-50 py-1 min-w-32">
                                  <button onClick={() => { handleEdit(item); setOpenMenuId(null); }} className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100">✏️ Edit</button>
                                  <button onClick={() => { handleDuplicateIngredient(item); }} className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100">⧉ Copy</button>
                                  <button onClick={() => { handleDeleteIngredient(item.id); }} className="block w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50">🗑 Delete</button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border w-8">
                  <button onClick={() => allInViewSelected ? selectNone() : selectAll()} className={`w-5 h-5 rounded border flex items-center justify-center text-xs mx-auto ${allInViewSelected ? 'bg-green-500 text-white' : 'bg-white border-gray-400'}`}>{allInViewSelected ? '✓' : ''}</button>
                </th>
                {visibleColumns.map(col => {
                  const def = columnDefs[col];
                  if (!def) return null;
                  const isActive = sortColumn === col;
                  return (
                    <th
                      key={col}
                      className={`p-2 border cursor-pointer hover:bg-gray-200 select-none ${def.align === 'right' ? 'text-right' : def.align === 'center' ? 'text-center' : 'text-left'}`}
                      onClick={() => handleSort(col)}
                    >
                      <div className={`flex items-center gap-1 ${def.align === 'right' ? 'justify-end' : def.align === 'center' ? 'justify-center' : ''}`}>
                        <span>{def.label}</span>
                        {def.sortable && <span className={`text-xs ${isActive ? 'text-blue-600' : 'text-gray-400'}`}>{isActive ? (sortDirection === 'asc' ? '▲' : '▼') : '⇅'}</span>}
                      </div>
                    </th>
                  );
                })}
                <th className="p-2 border w-12">⋮</th>
              </tr>
            </thead>
            <tbody>
              {filteredIngredients.map((ing, idx) => {
                const isSelected = selectedItems.has(ing.id);
                return (
                  <tr key={ing.id} className={`border-t hover:bg-blue-50 ${isSelected ? 'bg-green-100' : idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <td className="p-2 border text-center">
                      <button onClick={() => toggleSelected(ing.id)} className={`w-5 h-5 rounded border flex items-center justify-center text-xs mx-auto ${isSelected ? 'bg-green-500 text-white' : 'bg-white border-gray-400'}`}>{isSelected ? '✓' : ''}</button>
                    </td>
                    {visibleColumns.map(col => {
                      const def = columnDefs[col];
                      if (!def) return null;
                      if (col === 'instructor') {
                        return (
                          <td key={col} className="p-2 border text-center">
                            <button onClick={() => toggleInstructorVisibility(ing.id)} className={instructorHidden.has(ing.id) ? 'text-red-500' : 'text-green-600'}>{instructorHidden.has(ing.id) ? '✗' : '✓'}</button>
                          </td>
                        );
                      }
                      return (
                        <td key={col} className={`p-2 border ${def.align === 'right' ? 'text-right' : def.align === 'center' ? 'text-center' : ''}`}>
                          {def.render(ing)}
                        </td>
                      );
                    })}
                    <td className="p-2 border text-center relative">
                      <button onClick={() => setOpenMenuId(openMenuId === ing.id ? null : ing.id)} className="text-gray-500 hover:text-gray-700 text-lg">⋮</button>
                      {openMenuId === ing.id && (
                        <div className="absolute right-0 top-8 bg-white border rounded shadow-lg z-50 min-w-24">
                          <button onClick={() => { handleEdit(ing); setOpenMenuId(null); }} className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100">✎ Edit</button>
                          <button onClick={() => handleDuplicateIngredient(ing)} className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100">⧉ Copy</button>
                          <button onClick={() => { handleDeleteIngredient(ing.id); setOpenMenuId(null); }} className="block w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50">🗑 Delete</button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Edit Ingredient</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">Name</label>
                <input type="text" value={editForm.name || ''} onChange={(e) => setEditForm({...editForm, name: e.target.value})} className="w-full px-3 py-2 border rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <select value={editForm.category || ''} onChange={(e) => setEditForm({...editForm, category: e.target.value})} className="w-full px-3 py-2 border rounded">
                  {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Subcategory</label>
                <input type="text" value={editForm.subcategory || ''} onChange={(e) => setEditForm({...editForm, subcategory: e.target.value})} className="w-full px-3 py-2 border rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Unit</label>
                <select value={editForm.unit || 'lb'} onChange={(e) => setEditForm({...editForm, unit: e.target.value})} className="w-full px-3 py-2 border rounded">
                  {units.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Brand</label>
                <input type="text" value={editForm.brand || ''} onChange={(e) => setEditForm({...editForm, brand: e.target.value})} className="w-full px-3 py-2 border rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Vendor</label>
                <select value={editForm.vendor || 'Sysco'} onChange={(e) => setEditForm({...editForm, vendor: e.target.value, vendorCode: ''})} className="w-full px-3 py-2 border rounded">
                  <option value="Sysco">Sysco</option>
                  <option value="US Foods">US Foods</option>
                  <option value="Restaurant Depot">Restaurant Depot</option>
                  <option value="Shamrock">Shamrock</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Vendor Code</label>
                <input type="text" value={editForm.vendorCode || ''} onChange={(e) => setEditForm({...editForm, vendorCode: e.target.value})} className="w-full px-3 py-2 border rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Pack Size</label>
                <input type="text" value={editForm.packSize || ''} onChange={(e) => setEditForm({...editForm, packSize: e.target.value})} className="w-full px-3 py-2 border rounded" placeholder="e.g., 6/5LB" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Case Price</label>
                <input type="number" step="0.01" value={editForm.casePrice || 0} onChange={(e) => setEditForm({...editForm, casePrice: parseFloat(e.target.value) || 0})} className="w-full px-3 py-2 border rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Unit Price</label>
                <input type="number" step="0.0001" value={editForm.unitPrice || 0} onChange={(e) => setEditForm({...editForm, unitPrice: parseFloat(e.target.value) || 0})} className="w-full px-3 py-2 border rounded" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">Programs</label>
                <div className="flex gap-2">
                  {['Baking & Pastry Arts', 'Culinary Arts', 'Foodservice'].map(p => (
                    <label key={p} className="flex items-center gap-1">
                      <input type="checkbox" checked={(editForm.programs || []).includes(p)} onChange={(e) => {
                        const current = editForm.programs || [];
                        const updated = e.target.checked ? [...current, p] : current.filter(x => x !== p);
                        setEditForm({...editForm, programs: updated});
                      }} />
                      <span className="text-sm">{p === 'Baking & Pastry Arts' ? 'Baking' : p === 'Culinary Arts' ? 'Culinary' : 'Foodservice'}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={handleCancelEdit} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">Cancel</button>
              <button onClick={handleSaveEdit} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Ingredient Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
            <h2 className="text-xl font-bold mb-4">Add Ingredient</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">Name</label>
                <input type="text" value={newIngredient.name} onChange={(e) => setNewIngredient({...newIngredient, name: e.target.value})} className="w-full px-3 py-2 border rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <select value={newIngredient.category} onChange={(e) => setNewIngredient({...newIngredient, category: e.target.value})} className="w-full px-3 py-2 border rounded">
                  {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Subcategory</label>
                <input type="text" value={newIngredient.subcategory} onChange={(e) => setNewIngredient({...newIngredient, subcategory: e.target.value})} className="w-full px-3 py-2 border rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Unit</label>
                <select value={newIngredient.unit} onChange={(e) => setNewIngredient({...newIngredient, unit: e.target.value})} className="w-full px-3 py-2 border rounded">
                  {units.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Vendor</label>
                <select value={newIngredient.vendor} onChange={(e) => setNewIngredient({...newIngredient, vendor: e.target.value})} className="w-full px-3 py-2 border rounded">
                  <option value="Sysco">Sysco</option>
                  <option value="US Foods">US Foods</option>
                  <option value="Restaurant Depot">Restaurant Depot</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Pack Size</label>
                <input type="text" value={newIngredient.packSize} onChange={(e) => setNewIngredient({...newIngredient, packSize: e.target.value})} className="w-full px-3 py-2 border rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Case Price</label>
                <input type="number" step="0.01" value={newIngredient.casePrice} onChange={(e) => setNewIngredient({...newIngredient, casePrice: parseFloat(e.target.value) || 0})} className="w-full px-3 py-2 border rounded" />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowAddForm(false)} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">Cancel</button>
              <button onClick={handleAddIngredient} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Add</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
