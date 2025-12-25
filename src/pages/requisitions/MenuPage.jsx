import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { bakingIngredientsList, savoryIngredientsList, shamrockIngredientsList, additionalIngredients } from "../../data/ingredients/ingredientsList";

export default function MenuPage() {
  const [activeTab, setActiveTab] = useState('items'); const [activeProgram, setActiveProgram] = useState('Foodservice'); const [selectedCategory, setSelectedCategory] = useState('');
  const [menuItems, setMenuItems] = useState([]);
  const [packages, setPackages] = useState([]);
  const [beos, setBeos] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showItemForm, setShowItemForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [itemForm, setItemForm] = useState({
    name: '', description: '', category: 'Breakfast', ingredients: [], components: [],
    targetFoodCostPercent: 32, menuPrice: 0, program: "Foodservice", isFixedCost: false, isPerPerson: false, servingSize: '1 portion', increment: 1, prepNotes: ''
  });

  const [showPackageForm, setShowPackageForm] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);
  const [packageForm, setPackageForm] = useState({
    name: '', description: '', category: 'Catering', items: [], addOns: [], pricePerPerson: 0, minimumGuests: 10
  });

  const [showBeoForm, setShowBeoForm] = useState(false); const [draggedItem, setDraggedItem] = useState(null);
  const [editingBeo, setEditingBeo] = useState(null);
  const [beoForm, setBeoForm] = useState({
    eventName: '', clientName: '', contactEmail: '', contactPhone: '', eventDate: '', eventTime: '', endTime: '', setupTime: '', breakdownTime: '',
    location: '', guestCount: 50, selectedPackage: null, selectedItems: [], 
    specialRequests: '', dietaryNotes: '', setupNotes: '', status: 'draft'
  });

  const [componentSearch, setComponentSearch] = useState(""); const [ingredientSearch, setIngredientSearch] = useState('');
  const [showIngredientDropdown, setShowIngredientDropdown] = useState(false);

  const categories = ['Breakfast', 'Lunch', 'Dinner', 'Appetizers', 'Desserts', 'Beverages', 'Catering', 'Add-Ons'];
  const packageCategories = ['Breakfast Packages', 'Lunch Packages', 'Dinner Packages', 'Reception Packages', 'Custom'];

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const customIngredients = JSON.parse(localStorage.getItem('customIngredients') || '[]');
    const ingredientEdits = JSON.parse(localStorage.getItem('ingredientEdits') || '{}');
    const baseIngredients = [...bakingIngredientsList, ...savoryIngredientsList, ...shamrockIngredientsList, ...additionalIngredients].map(ing => ({ ...ing, ...ingredientEdits[ing.id] }));
    setIngredients([...baseIngredients, ...customIngredients]);

    // Load from localStorage (primary for now)
    const localItems = JSON.parse(localStorage.getItem('menuItems') || '[]');
    const localPackages = JSON.parse(localStorage.getItem('menuPackages') || '[]');
    const localBeos = JSON.parse(localStorage.getItem('beos') || '[]');
    
    setMenuItems(localItems);
    setPackages(localPackages);
    setBeos(localBeos);

    // Try Supabase as secondary (merge if exists)
    try {
      const { data: itemsData, error: itemsErr } = await supabase.from('menu_items').select('*').order('name');
      if (!itemsErr && itemsData && itemsData.length > 0) {
        const merged = [...localItems];
        itemsData.forEach(item => { if (!merged.find(m => m.id === item.id)) merged.push(item); });
        setMenuItems(merged);
        localStorage.setItem('menuItems', JSON.stringify(merged));
      }
      
      const { data: packagesData, error: pkgErr } = await supabase.from('menu_packages').select('*').order('name');
      if (!pkgErr && packagesData && packagesData.length > 0) {
        const merged = [...localPackages];
        packagesData.forEach(pkg => { if (!merged.find(m => m.id === pkg.id)) merged.push(pkg); });
        setPackages(merged);
        localStorage.setItem('menuPackages', JSON.stringify(merged));
      }
      
      const { data: beosData, error: beoErr } = await supabase.from('beos').select('*').order('event_date', { ascending: false });
      if (!beoErr && beosData && beosData.length > 0) {
        const merged = [...localBeos];
        beosData.forEach(beo => { if (!merged.find(m => m.id === beo.id)) merged.push(beo); });
        setBeos(merged);
        localStorage.setItem('beos', JSON.stringify(merged));
      }
    } catch (error) {
      console.log('Supabase not available, using localStorage only');
    }
    setLoading(false);
  };

  const calculateFoodCost = (itemIngredients, itemComponents = [], allMenuItems = []) => { const ingCost = itemIngredients.reduce((total, ing) => total + ((ing.unitPrice || 0) * ing.quantity), 0); const compCost = itemComponents.reduce((total, comp) => { const menuItem = allMenuItems.find(m => m.id === comp.menuItemId); return total + (menuItem ? calculateFoodCost(menuItem.ingredients || [], menuItem.components || [], allMenuItems) * (comp.quantity || 1) : 0); }, 0); return ingCost + compCost; };

  const calculateMenuPrice = (foodCost, targetFCPercent) => foodCost && targetFCPercent ? foodCost / (targetFCPercent / 100) : 0;

  const filteredComponents = menuItems.filter(m => m.id !== editingItem?.id && m.name?.toLowerCase().includes(componentSearch.toLowerCase())).slice(0, 10); const filteredIngredients = ingredients.filter(ing => ing.name?.toLowerCase().includes(ingredientSearch.toLowerCase())).slice(0, 10);

  const addIngredientToItem = (ingredient) => {
    if (!itemForm.ingredients.find(i => i.ingredientId === ingredient.id)) {
      setItemForm({ ...itemForm, ingredients: [...itemForm.ingredients, { ingredientId: ingredient.id, name: ingredient.name, quantity: 1, unit: ingredient.unit || 'ea', unitPrice: ingredient.unitPrice || 0 }] });
    }
    setIngredientSearch(''); setShowIngredientDropdown(false);
  };

  const UNIT_OZ = { oz: 1, lb: 16, g: 0.035274, kg: 35.274, gal: 128, qt: 32, pt: 16, cup: 8, tbsp: 0.5, tsp: 0.1667, ea: 1, doz: 1, bunch: 1, can: 1, bottle: 1, jar: 1, bag: 1, box: 1 }; const updateIngredientUnit = (index, newUnit) => { const updated = [...itemForm.ingredients]; const ing = updated[index]; const oldUnit = ing.unit || "oz"; const baseUnit = ing.baseUnit || oldUnit; const basePrice = ing.baseUnitPrice || ing.unitPrice; const oldFactor = UNIT_OZ[oldUnit] || 1; const newFactor = UNIT_OZ[newUnit] || 1; const baseFactor = UNIT_OZ[baseUnit] || 1; updated[index] = { ...ing, unit: newUnit, unitPrice: basePrice * (newFactor / baseFactor), baseUnit: baseUnit, baseUnitPrice: basePrice }; setItemForm({ ...itemForm, ingredients: updated }); };
  const updateIngredientQuantity = (index, quantity) => {
    const updated = [...itemForm.ingredients];
    updated[index].quantity = parseFloat(quantity) || 0;
    setItemForm({ ...itemForm, ingredients: updated });
  };

  const removeIngredientFromItem = (index) => setItemForm({ ...itemForm, ingredients: itemForm.ingredients.filter((_, i) => i !== index) }); const addComponentToItem = (menuItem) => { if (!itemForm.components.find(c => c.menuItemId === menuItem.id)) { setItemForm({ ...itemForm, components: [...itemForm.components, { menuItemId: menuItem.id, name: menuItem.name, quantity: 1, foodCost: calculateFoodCost(menuItem.ingredients || [], menuItem.components || [], menuItems) }] }); } setComponentSearch(""); }; const updateComponentQuantity = (index, quantity) => { const updated = [...itemForm.components]; updated[index].quantity = parseFloat(quantity) || 0; setItemForm({ ...itemForm, components: updated }); }; const removeComponentFromItem = (index) => setItemForm({ ...itemForm, components: itemForm.components.filter((_, i) => i !== index) });

  const saveMenuItem = async () => {
    const foodCost = calculateFoodCost(itemForm.ingredients, itemForm.components, menuItems);
    const menuPrice = calculateMenuPrice(foodCost, itemForm.targetFoodCostPercent);
    const item = { ...itemForm, increment: itemForm.increment || 1, food_cost: foodCost, menu_price: menuPrice, updated_at: new Date().toISOString() };

    let updatedItems;
    if (editingItem) {
      item.id = editingItem.id;
      updatedItems = menuItems.map(i => i.id === editingItem.id ? { ...i, ...item } : i);
    } else {
      item.id = 'MI-' + Date.now();
      item.created_at = new Date().toISOString();
      updatedItems = [...menuItems, item];
    }
    
    // Always save to localStorage first
    localStorage.setItem('menuItems', JSON.stringify(updatedItems));
    setMenuItems(updatedItems);

    // Try Supabase in background
    try {
      if (editingItem) {
        await supabase.from('menu_items').upsert([item], { onConflict: 'id' });
      } else {
        await supabase.from('menu_items').insert([item]);
      }
    } catch (e) { console.log('Supabase sync skipped'); }

    resetItemForm();
  };

  const resetItemForm = () => { setItemForm({ name: '', description: '', category: 'Breakfast', ingredients: [], components: [], targetFoodCostPercent: 32, menuPrice: 0, program: "Foodservice", isFixedCost: false, isPerPerson: false, servingSize: '1 portion', increment: 1, prepNotes: '' }); setEditingItem(null); setShowItemForm(false); };

  const editMenuItem = (item) => { setItemForm({ name: item.name || '', description: item.description || '', category: item.category || 'Breakfast', ingredients: item.ingredients || [], components: item.components || [], targetFoodCostPercent: item.targetFoodCostPercent || 32, program: item.program || "Foodservice", menuPrice: item.menu_price || 0, isFixedCost: item.isFixedCost || false, isPerPerson: item.isPerPerson || false, servingSize: item.servingSize || '1 portion', increment: item.increment || 1, prepNotes: item.prepNotes || '' }); setEditingItem(item); setShowItemForm(true); };

  const deleteMenuItem = async (id) => {
    if (!window.confirm('Delete this menu item?')) return;
    const updatedItems = menuItems.filter(i => i.id !== id);
    localStorage.setItem('menuItems', JSON.stringify(updatedItems));
    setMenuItems(updatedItems);
    try { await supabase.from('menu_items').delete().eq('id', id); } catch (e) {}
  };

  const savePackage = async () => {
    const pkg = { ...packageForm, updated_at: new Date().toISOString() };
    
    let updatedPackages;
    if (editingPackage) {
      pkg.id = editingPackage.id;
      updatedPackages = packages.map(p => p.id === editingPackage.id ? { ...p, ...pkg } : p);
    } else {
      pkg.id = 'PKG-' + Date.now();
      pkg.created_at = new Date().toISOString();
      updatedPackages = [...packages, pkg];
    }
    
    localStorage.setItem('menuPackages', JSON.stringify(updatedPackages));
    setPackages(updatedPackages);
    
    try {
      if (editingPackage) {
        await supabase.from('menu_packages').upsert([pkg], { onConflict: 'id' });
      } else {
        await supabase.from('menu_packages').insert([pkg]);
      }
    } catch (e) { console.log('Supabase sync skipped'); }

    resetPackageForm();
  };

  const resetPackageForm = () => { setPackageForm({ name: '', description: '', category: 'Catering', items: [], addOns: [], pricePerPerson: 0, minimumGuests: 10 }); setEditingPackage(null); setShowPackageForm(false); };

  const deletePackage = async (id) => {
    if (!window.confirm('Delete this package?')) return;
    const updatedPackages = packages.filter(p => p.id !== id);
    localStorage.setItem('menuPackages', JSON.stringify(updatedPackages));
    setPackages(updatedPackages);
    try { await supabase.from('menu_packages').delete().eq('id', id); } catch (e) {}
  };

  const calculatePackagePrice = (items) => calculateMenuPrice(items.reduce((total, itemId) => total + (menuItems.find(i => i.id === itemId)?.food_cost || 0), 0), 32);

  const saveBeo = async () => {
    const beo = { ...beoForm, updated_at: new Date().toISOString() };
    let subtotal = 0;
    if (beo.selectedPackage) subtotal += (packages.find(p => p.id === beo.selectedPackage)?.pricePerPerson || 0) * beo.guestCount;
    beo.selectedItems?.forEach(id => { const item = menuItems.find(i => i.id === id); if (!item) return; const inc = item.increment || 1; const qty = beo.guestCount; subtotal += (item?.menu_price || 0) * (item?.isFixedCost ? 1 : qty); });
    beo.selectedAddOns?.forEach(id => { const item = menuItems.find(i => i.id === id); if (!item) return; const inc = item.increment || 1; const qty = beo.guestCount; subtotal += (item?.menu_price || 0) * (item?.isFixedCost ? 1 : qty); });
    beo.subtotal = subtotal; beo.tax = subtotal * 0.0825; beo.total = subtotal + beo.tax;

    let updatedBeos;
    if (editingBeo) {
      beo.id = editingBeo.id;
      updatedBeos = beos.map(b => b.id === editingBeo.id ? { ...b, ...beo } : b);
    } else {
      beo.id = 'BEO-' + Date.now();
      beo.created_at = new Date().toISOString();
      updatedBeos = [beo, ...beos];
    }
    
    localStorage.setItem('beos', JSON.stringify(updatedBeos));
    setBeos(updatedBeos);
    
    try {
      if (editingBeo) {
        await supabase.from('beos').upsert([beo], { onConflict: 'id' });
      } else {
        await supabase.from('beos').insert([beo]);
      }
    } catch (e) { console.log('Supabase sync skipped'); }

    resetBeoForm();
  };

  const handleDragStart = (e, item) => { setDraggedItem(item); e.dataTransfer.effectAllowed = "move"; }; const handleDragOver = (e, item) => { e.preventDefault(); if (!draggedItem || draggedItem.id === item.id) return; }; const handleDrop = async (e, targetItem) => { e.preventDefault(); if (!draggedItem || draggedItem.id === targetItem.id) return; const items = [...menuItems]; const dragIdx = items.findIndex(i => i.id === draggedItem.id); const dropIdx = items.findIndex(i => i.id === targetItem.id); items.splice(dragIdx, 1); items.splice(dropIdx, 0, draggedItem); const reordered = items.map((item, idx) => ({ ...item, sortOrder: idx })); setMenuItems(reordered); reordered.forEach(async (item) => { await supabase.from("menu_items").update({ sortOrder: item.sortOrder }).eq("id", item.id); }); setDraggedItem(null); }; const handleDragEnd = () => { setDraggedItem(null); }; const resetBeoForm = () => { setBeoForm({ eventName: '', clientName: '', contactEmail: '', contactPhone: '', eventDate: '', eventTime: '', endTime: '', setupTime: '', breakdownTime: '', location: '', guestCount: 50, selectedPackage: null, selectedItems: [],  specialRequests: '', dietaryNotes: '', setupNotes: '', status: 'draft' }); setEditingBeo(null); setShowBeoForm(false); };

  const deleteBeo = async (id) => {
    if (!window.confirm('Delete this BEO?')) return;
    const updatedBeos = beos.filter(b => b.id !== id);
    localStorage.setItem('beos', JSON.stringify(updatedBeos));
    setBeos(updatedBeos);
    try { await supabase.from('beos').delete().eq('id', id); } catch (e) {}
  };

  const printBeo = (beo) => {
    const pkg = packages.find(p => p.id === beo.selectedPackage);
    let calcSubtotal = 0; const items = beo.selectedItems?.map(id => menuItems.find(i => i.id === id)).filter(Boolean) || [];  items.forEach(item => { const inc = item.increment || 1; const qty = beo.guestCount; calcSubtotal += (item.menu_price || 0) * qty; });  const calcTax = calcSubtotal * 0.0825; const calcTotal = calcSubtotal + calcTax;
    const formatPhone = (phone) => { const cleaned = (phone || '').replace(/\D/g, ''); if (cleaned.length === 10) return `(${cleaned.slice(0,3)}) ${cleaned.slice(3,6)}-${cleaned.slice(6)}`; return phone || 'TBD'; };
    const printContent = `<html><head><title>BEO - ${beo.eventName}</title><style>body{font-family:Arial,sans-serif;padding:20px;max-width:800px;font-size:11px;line-height:1.4;margin:0 auto}h3{font-size:13px;color:#1e40af;margin:15px 0 8px 0;border-bottom:1px solid #1e40af;padding-bottom:4px}.info-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px}.info-row{display:flex;gap:8px}.info-label{font-weight:bold;min-width:80px;color:#374151}.menu-table{width:100%;border-collapse:collapse;margin:10px 0}.menu-table{border:none}.menu-table th{background:#1e40af;color:white;padding:4px 6px;text-align:left;font-weight:600;font-size:10px}.menu-table td{padding:4px 6px;font-size:10px;border:none}.menu-table tr:nth-child(even){background:#f3f4f6}.menu-table tr:nth-child(odd){background:white}.totals{text-align:right;margin-top:15px}.totals p{margin:3px 0}.foap{color:#374151;font-size:10px;margin-top:20px;text-align:center}@media print{body{padding:15px}}</style></head><body><div style="margin-bottom:10px"><img src="${window.location.origin}/pcc-logo.png" alt="Pima Community College" style="height:50px" /><div style="font-size:16px;font-weight:bold;color:#1e40af;margin-top:8px;text-align:center">BANQUET EVENT ORDER</div></div><p style="font-size:10px;color:#6b7280;margin:10px 0">BEO Created: ${new Date(beo.created_at).toLocaleDateString()}</p><h3>Event Contact</h3><div class="info-grid"><div class="info-row"><span class="info-label">Name:</span><span>${beo.clientName}</span></div><div class="info-row"><span class="info-label">Email:</span><span>${beo.contactEmail || 'TBD'}</span></div><div class="info-row"><span class="info-label">Phone:</span><span>${formatPhone(beo.contactPhone)}</span></div><div class="info-row"><span class="info-label">Status:</span><span>${beo.status || 'Draft'}</span></div></div><h3>Event Information</h3><div class="info-grid"><div class="info-row"><span class="info-label">Event:</span><span>${beo.eventName}</span></div><div class="info-row"><span class="info-label">Date:</span><span>${beo.eventDate}</span></div><div class="info-row"><span class="info-label">Location:</span><span>${beo.location || 'TBD'}</span></div><div class="info-row"><span class="info-label">Guests:</span><span style="font-weight:bold">${beo.guestCount}</span></div></div><div class="info-grid" style="margin-top:4px"><div class="info-row"><span class="info-label">Setup:</span><span>${beo.setupTime || 'TBD'}</span></div><div class="info-row"><span class="info-label">Start:</span><span>${beo.eventTime || 'TBD'}</span></div><div class="info-row"><span class="info-label">End:</span><span>${beo.endTime || 'TBD'}</span></div><div class="info-row"><span class="info-label">Breakdown:</span><span>${beo.breakdownTime || 'TBD'}</span></div></div><h3>Menu</h3>${items.length > 0 ? `<table class="menu-table"><thead><tr><th>Item</th><th>Description</th><th style="text-align:center;width:40px">Qty</th><th style="text-align:right;width:50px">Each</th><th style="text-align:right;width:60px">Total</th></tr></thead><tbody>${items.map(item => { const inc = item.increment || 1; const qty = beo.guestCount; const unitPrice = (item.menu_price || 0) / inc; return `<tr><td>${item.name}</td><td>${item.description || ''}</td><td style="text-align:center">${qty}</td><td style="text-align:right">$${unitPrice.toFixed(2)}</td><td style="text-align:right">$${(unitPrice * qty).toFixed(2)}</td></tr>`; }).join('')}</tbody></table>` : '<p>No menu items selected</p>'}<div class="totals"><p>Subtotal: $${calcSubtotal.toFixed(2)}</p><p>Tax (8.25%): $${calcTax.toFixed(2)}</p><p style="font-weight:bold;font-size:12px">Total: $${calcTotal.toFixed(2)}</p></div>${(beo.specialRequests || beo.dietaryNotes || beo.setupNotes) ? `<h3>Notes</h3>${beo.dietaryNotes ? `<p><strong>Dietary:</strong> ${beo.dietaryNotes}</p>` : ''}${beo.specialRequests ? `<p><strong>Special Requests:</strong> ${beo.specialRequests}</p>` : ''}${beo.setupNotes ? `<p><strong>Setup:</strong> ${beo.setupNotes}</p>` : ''}` : ''}<p class="foap">FOAP: 132000 | DVINPT | 54403 | 8FDSVC (internal only)</p></body></html>`; const printWindow = window.open("", "_blank"); printWindow.document.write(printContent); printWindow.document.close(); printWindow.print();
  };

  const itemFoodCost = calculateFoodCost(itemForm.ingredients, itemForm.components, menuItems);
  const itemMenuPrice = calculateMenuPrice(itemFoodCost, itemForm.targetFoodCostPercent);

  if (loading) return <div className="p-6 max-w-7xl mx-auto"><div className="bg-white rounded-lg shadow-lg p-6 text-center"><p className="text-gray-500">Loading menu data...</p></div></div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <div><h1 className="text-3xl font-bold text-gray-800">Menu Management</h1><p className="text-gray-600 mt-1">Foodservice & Catering Menu Builder</p></div>
            <div className="flex gap-2">
              {activeTab === 'items' && <button onClick={() => setShowItemForm(true)} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">+ New Menu Item</button>}
              {activeTab === 'packages' && <button onClick={() => setShowPackageForm(true)} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">+ New Package</button>}
              {activeTab === 'beo' && <button onClick={() => setShowBeoForm(true)} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">+ New BEO</button>}
            </div>
          </div>
          <div className="flex gap-4 mt-6">
            {[{ id: 'items', label: 'Recipes', count: menuItems.length },  { id: 'beo', label: 'BEO Generator', count: beos.length }].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === tab.id ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}>
                {tab.label}<span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-gray-200">{tab.count}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'items' && (
            <div>
              <div className="flex gap-2 mb-4">{["Baking & Pastry", "Culinary", "Foodservice"].map(p => <button key={p} onClick={() => setActiveProgram(p)} className={"px-4 py-2 rounded-lg font-medium " + (activeProgram === p ? "bg-blue-600 text-white" : "bg-gray-100 hover:bg-gray-200")}>{p}</button>)}</div>{activeProgram === "Foodservice" && <div className="flex gap-2 mb-4 flex-wrap">{["Breakfast", "Lunch", "Dinner", "Beverages", "Desserts", "Catering"].map(c => <button key={c} onClick={() => setSelectedCategory(c)} className={"px-3 py-1 rounded text-sm " + (selectedCategory === c ? "bg-green-600 text-white" : "bg-gray-100 hover:bg-gray-200")}>{c}</button>)}<button onClick={() => setSelectedCategory("")} className={"px-3 py-1 rounded text-sm " + (!selectedCategory ? "bg-green-600 text-white" : "bg-gray-100 hover:bg-gray-200")}>All</button></div>}<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {menuItems.filter(item => (item.program || "Foodservice") === activeProgram && (!selectedCategory || item.category === selectedCategory)).map(item => (
                  <div key={item.id} draggable onDragStart={(e) => handleDragStart(e, item)} onDragOver={(e) => handleDragOver(e, item)} onDrop={(e) => handleDrop(e, item)} onDragEnd={handleDragEnd} className={"border rounded-lg p-4 hover:shadow-md transition-shadow relative cursor-move " + (draggedItem?.id === item.id ? "opacity-50" : "")}><div className="absolute top-2 right-2 text-gray-300 hover:text-gray-500 cursor-grab text-lg">⋮⋮</div>
                    <div className="flex justify-between items-start">
                      <div><h3 className="font-semibold text-lg">{item.name}</h3><p className="text-sm text-gray-500">{item.category}</p></div>
                      
                    </div>
                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">{item.description || 'No description'}</p>
                    <div className="mt-4 flex justify-between items-center">
                      <div><p className="text-xs text-gray-500">Food Cost {item.increment > 1 ? `(per ${item.increment})` : ""}</p><p className="font-medium">${(item.food_cost || 0).toFixed(2)}</p></div>
                      <div><p className="text-xs text-gray-500">Menu Price {item.increment > 1 ? "(per person)" : ""}</p><input type="number" step="0.01" value={item.increment > 1 ? ((item.menu_price || 0) / item.increment).toFixed(2) : (item.menu_price || 0).toFixed(2)} onChange={(e) => { const inputPrice = parseFloat(e.target.value) || 0; const newPrice = item.increment > 1 ? inputPrice * item.increment : inputPrice; const updated = menuItems.map(m => m.id === item.id ? { ...m, menu_price: newPrice } : m); setMenuItems(updated); localStorage.setItem("toqueworks_menu_items", JSON.stringify(updated)); }} className="w-20 font-bold text-lg text-green-600 bg-transparent border-b border-transparent hover:border-green-300 focus:border-green-500 focus:outline-none text-center" />{(() => { const match = (item.servingSize || "").match(/(\d+)/); const servings = match ? parseInt(match[1]) : 0; return servings > 1 ? <p className="text-xs text-green-600">(${(item.menu_price / servings).toFixed(2)}/person)</p> : null; })()}</div>
                      <div><p className="text-xs text-gray-500">FC%</p><p className={`font-medium ${item.food_cost && item.menu_price && (item.food_cost / item.menu_price * 100) <= 35 ? 'text-green-600' : 'text-red-600'}`}>{item.menu_price ? ((item.food_cost / item.menu_price) * 100).toFixed(1) : '0'}%</p></div>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <button onClick={() => editMenuItem(item)} className="flex-1 px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200">Edit</button><button onClick={() => { setItemForm({ name: item.name + " (Copy)", description: item.description || "", category: item.category || "Breakfast", ingredients: [...(item.ingredients || [])], components: [...(item.components || [])], targetFoodCostPercent: item.targetFoodCostPercent || 32, program: item.program || "Foodservice", menuPrice: item.menu_price || 0, isFixedCost: item.isFixedCost || false, isPerPerson: item.isPerPerson || false, servingSize: item.servingSize || "1 portion", increment: item.increment || 1, prepNotes: item.prepNotes || "" }); setEditingItem(null); setShowItemForm(true); }} className="flex-1 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200">Duplicate</button>
                      <button onClick={() => deleteMenuItem(item.id)} className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded">Delete</button>
                    </div>
                  </div>
                ))}
              </div>
              {menuItems.length === 0 && !showItemForm && <div className="text-center py-12"><p className="text-gray-500 mb-4">No menu items yet</p><button onClick={() => setShowItemForm(true)} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Create Your First Menu Item</button></div>}
            </div>
          )}

          {activeTab === 'packages' && (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {packages.map(pkg => (
                  <div key={pkg.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <h3 className="font-semibold text-lg">{pkg.name}</h3>
                    <p className="text-sm text-gray-500">{pkg.category}</p>
                    <p className="text-sm text-gray-600 mt-2">{pkg.description || 'No description'}</p>
                    <div className="mt-4">
                      <p className="text-sm text-gray-500">Includes {pkg.items?.length || 0} items</p>
                      <p className="text-2xl font-bold text-green-600 mt-2">${(pkg.pricePerPerson || calculatePackagePrice(pkg.items || [])).toFixed(2)}<span className="text-sm font-normal text-gray-500">/person</span></p>
                      <p className="text-xs text-gray-500">Min. {pkg.minimumGuests || 10} guests</p>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <button onClick={() => { setPackageForm(pkg); setEditingPackage(pkg); setShowPackageForm(true); }} className="flex-1 px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200">Edit</button>
                      <button onClick={() => deletePackage(pkg.id)} className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded">Delete</button>
                    </div>
                  </div>
                ))}
              </div>
              {packages.length === 0 && !showPackageForm && <div className="text-center py-12"><p className="text-gray-500 mb-4">No packages yet</p><button onClick={() => setShowPackageForm(true)} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Create Your First Package</button></div>}
            </div>
          )}

          {activeTab === 'beo' && (
            <div>
              <div className="space-y-4">
                {beos.map(beo => (
                  <div key={beo.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-lg">{beo.eventName}</h3>
                          <span className={`px-2 py-1 text-xs rounded ${beo.status === 'confirmed' ? 'bg-green-100 text-green-800' : beo.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>{beo.status || 'draft'}</span>
                        </div>
                        <p className="text-sm text-gray-500">{beo.clientName}</p>
                      </div>
                      <div className="text-right"><p className="font-bold text-lg">${(beo.total || 0).toFixed(2)}</p><p className="text-sm text-gray-500">{beo.guestCount} guests</p></div>
                    </div>
                    <div className="mt-3 flex gap-6 text-sm text-gray-600"><span>📅 {beo.eventDate}</span><span>🕐 {beo.eventTime}</span><span>📍 {beo.location || 'TBD'}</span></div>
                    <div className="mt-4 flex gap-2">
                      <button onClick={() => printBeo(beo)} className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200">Print BEO</button>
                      <button onClick={() => { setBeoForm(beo); setEditingBeo(beo); setShowBeoForm(true); }} className="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200">Edit</button>
                      <button onClick={() => deleteBeo(beo.id)} className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded">Delete</button>
                    </div>
                  </div>
                ))}
              </div>
              {beos.length === 0 && !showBeoForm && <div className="text-center py-12"><p className="text-gray-500 mb-4">No BEOs yet</p><button onClick={() => setShowBeoForm(true)} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Create Your First BEO</button></div>}
            </div>
          )}
        </div>
      </div>

      {showItemForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-auto py-8">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto m-4">
            <div className="p-6 border-b sticky top-0 bg-white z-10"><h2 className="text-xl font-bold">{editingItem ? 'Edit Menu Item' : 'New Menu Item'}</h2></div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2"><label className="block text-sm font-medium mb-1">Item Name *</label><input type="text" value={itemForm.name} onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })} className="w-full px-3 py-2 border rounded" placeholder="e.g., Continental Breakfast" /></div>
                <div><label className="block text-sm font-medium mb-1">Category</label><select value={itemForm.category} onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })} className="w-full px-3 py-2 border rounded">{categories.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                <div><label className="block text-sm font-medium mb-1">Serving Size</label><input type="text" value={itemForm.servingSize} onChange={(e) => setItemForm({ ...itemForm, servingSize: e.target.value })} className="w-full px-3 py-2 border rounded" placeholder="e.g., 1 portion" /></div>
                <div><label className="block text-sm font-medium mb-1">Increment (guests)</label><input type="number" min="1" value={itemForm.increment || 1} onChange={(e) => setItemForm({ ...itemForm, increment: parseInt(e.target.value) || 1 })} className="w-full px-3 py-2 border rounded" /><p className="text-xs text-gray-500 mt-1">Min batch size (1=per person, 10=coffee)</p></div>
                <div className="col-span-2"><label className="block text-sm font-medium mb-1">Description</label><textarea value={itemForm.description} onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })} className="w-full px-3 py-2 border rounded" rows={2} placeholder="Brief description" /></div>
                
                
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Ingredients</label>
                <div className="relative mb-3">
                  <input type="text" value={ingredientSearch} onChange={(e) => { setIngredientSearch(e.target.value); setShowIngredientDropdown(true); }} onFocus={() => setShowIngredientDropdown(true)} className="w-full px-3 py-2 border rounded" placeholder="Search ingredients to add..." />
                  {showIngredientDropdown && ingredientSearch && (
                    <div className="absolute top-full left-0 right-0 bg-white border rounded-b shadow-lg max-h-48 overflow-y-auto z-20">
                      {filteredIngredients.map(ing => <button key={ing.id} onClick={() => addIngredientToItem(ing)} className="w-full text-left px-3 py-2 hover:bg-blue-50 flex justify-between"><span>{ing.name}</span><span className="text-gray-500 text-sm">${(ing.unitPrice || 0).toFixed(2)}/{ing.unit}</span></button>)}
                      {filteredIngredients.length === 0 && <p className="px-3 py-2 text-gray-500 text-sm">No ingredients found</p>}
                    </div>
                  )}
                </div>
                {itemForm.ingredients.length > 0 && (
                  <div className="border rounded overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50"><tr><th className="px-3 py-2 text-left">Ingredient</th><th className="px-3 py-2 text-center w-24">Qty</th><th className="px-3 py-2 text-center w-20">Unit</th><th className="px-3 py-2 text-right w-24">Each</th><th className="px-3 py-2 text-right w-24">Total</th><th className="px-3 py-2 w-10"></th></tr></thead>
                      <tbody>{itemForm.ingredients.map((ing, index) => <tr key={index} className="border-t"><td className="px-3 py-2">{ing.name}</td><td className="px-3 py-2"><input type="number" step="0.01" value={ing.quantity} onChange={(e) => updateIngredientQuantity(index, e.target.value)} className="w-full px-2 py-1 border rounded text-center" /></td><td className="px-3 py-2 text-center"><select value={ing.unit} onChange={(e) => updateIngredientUnit(index, e.target.value)} className="px-1 py-0.5 border rounded text-sm">{["oz","lb","ea","slice","piece","cup","tbsp","tsp","qt","gal","pt","g","kg","doz","bunch","can","bottle","jar","bag","box"].map(u => <option key={u} value={u}>{u}</option>)}</select></td><td className="px-3 py-2 text-right">${(ing.unitPrice || 0).toFixed(4)}</td><td className="px-3 py-2 text-right">${((ing.unitPrice || 0) * ing.quantity).toFixed(2)}</td><td className="px-3 py-2 text-center"><button onClick={() => removeIngredientFromItem(index)} className="text-red-500 hover:text-red-700">✕</button></td></tr>)}</tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="mt-4"><label className="block text-sm font-medium mb-1">Add Component Items (other menu items)</label><div className="relative"><input type="text" value={componentSearch} onChange={(e) => setComponentSearch(e.target.value)} className="w-full px-3 py-2 border rounded" placeholder="Search menu items to add as components..." />{componentSearch && filteredComponents.length > 0 && (<div className="absolute z-10 w-full bg-white border rounded-b shadow-lg max-h-48 overflow-y-auto">{filteredComponents.map(m => <button key={m.id} onClick={() => addComponentToItem(m)} className="w-full text-left px-3 py-2 hover:bg-blue-50 flex justify-between"><span>{m.name}</span><span className="text-gray-500 text-sm">${calculateFoodCost(m.ingredients || [], m.components || [], menuItems).toFixed(2)}</span></button>)}</div>)}</div></div>{itemForm.components.length > 0 && (<div className="mt-2 border rounded overflow-hidden"><table className="w-full text-sm"><thead className="bg-purple-50"><tr><th className="px-3 py-2 text-left">Component</th><th className="px-3 py-2 text-center w-24">Qty</th><th className="px-3 py-2 text-right w-24">Each</th><th className="px-3 py-2 text-right w-24">Total</th><th className="px-3 py-2 w-10"></th></tr></thead><tbody>{itemForm.components.map((comp, index) => <tr key={index} className="border-t"><td className="px-3 py-2 flex items-center gap-2"><input type="checkbox" checked={comp.hidden || false} onChange={(e) => { const updated = [...itemForm.components]; updated[index].hidden = e.target.checked; setItemForm({...itemForm, components: updated}); }} title="Hide from BEO" className="rounded" />{comp.name}</td><td className="px-3 py-2"><input type="number" step="1" value={comp.quantity} onChange={(e) => updateComponentQuantity(index, e.target.value)} className="w-full px-2 py-1 border rounded text-center" /></td><td className="px-3 py-2 text-right">${calculateFoodCost((menuItems.find(m => m.id === comp.menuItemId)?.ingredients || []), (menuItems.find(m => m.id === comp.menuItemId)?.components || []), menuItems).toFixed(2)}</td><td className="px-3 py-2 text-right">${(calculateFoodCost((menuItems.find(m => m.id === comp.menuItemId)?.ingredients || []), (menuItems.find(m => m.id === comp.menuItemId)?.components || []), menuItems) * comp.quantity).toFixed(2)}</td><td className="px-3 py-2"><button onClick={() => removeComponentFromItem(index)} className="text-red-500 hover:text-red-700">✕</button></td></tr>)}</tbody></table></div>)}<div className="bg-gray-50 rounded-lg p-4 mt-4">
                <h3 className="font-medium mb-4">Pricing Calculator</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div><label className="block text-sm text-gray-600 mb-1">Food Cost</label><p className="text-2xl font-bold">${itemFoodCost.toFixed(2)}</p></div>
                  <div><label className="block text-sm text-gray-600 mb-1">Target FC%</label><div className="flex items-center gap-2"><input type="range" min="25" max="40" value={itemForm.targetFoodCostPercent} onChange={(e) => setItemForm({ ...itemForm, targetFoodCostPercent: parseInt(e.target.value) })} className="flex-1" /><span className="font-bold w-12">{itemForm.targetFoodCostPercent}%</span></div></div>
                  <div><label className="block text-sm text-gray-600 mb-1">Menu Price</label><p className="text-2xl font-bold text-green-600">${itemMenuPrice.toFixed(2)}</p></div>
                </div>
              </div>

              <div><label className="block text-sm font-medium mb-1">Prep Notes</label><textarea value={itemForm.prepNotes} onChange={(e) => setItemForm({ ...itemForm, prepNotes: e.target.value })} className="w-full px-3 py-2 border rounded" rows={2} placeholder="Special preparation instructions..." /></div>
            </div>
            <div className="p-6 border-t bg-gray-50 flex justify-between sticky bottom-0">
              <button onClick={resetItemForm} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">Cancel</button>
              <button onClick={saveMenuItem} disabled={!itemForm.name} className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">{editingItem ? 'Update Item' : 'Create Item'}</button>
            </div>
          </div>
        </div>
      )}

      {showPackageForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-auto py-8">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto m-4">
            <div className="p-6 border-b sticky top-0 bg-white z-10"><h2 className="text-xl font-bold">{editingPackage ? 'Edit Package' : 'New Package'}</h2></div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2"><label className="block text-sm font-medium mb-1">Package Name *</label><input type="text" value={packageForm.name} onChange={(e) => setPackageForm({ ...packageForm, name: e.target.value })} className="w-full px-3 py-2 border rounded" placeholder="e.g., Continental Breakfast Package" /></div>
                <div><label className="block text-sm font-medium mb-1">Category</label><select value={packageForm.category} onChange={(e) => setPackageForm({ ...packageForm, category: e.target.value })} className="w-full px-3 py-2 border rounded">{packageCategories.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                <div><label className="block text-sm font-medium mb-1">Min. Guests</label><input type="number" value={packageForm.minimumGuests} onChange={(e) => setPackageForm({ ...packageForm, minimumGuests: parseInt(e.target.value) || 10 })} className="w-full px-3 py-2 border rounded" /></div>
                <div className="col-span-2"><label className="block text-sm font-medium mb-1">Description</label><textarea value={packageForm.description} onChange={(e) => setPackageForm({ ...packageForm, description: e.target.value })} className="w-full px-3 py-2 border rounded" rows={2} /></div>
              </div>

              <div><label className="block text-sm font-medium mb-2">Included Items</label><div className="border rounded max-h-48 overflow-y-auto">{menuItems.map(item => <label key={item.id} className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 cursor-pointer"><input type="checkbox" checked={packageForm.items?.includes(item.id)} onChange={(e) => setPackageForm({ ...packageForm, items: e.target.checked ? [...(packageForm.items || []), item.id] : packageForm.items?.filter(i => i !== item.id) || [] })} className="rounded" /><span className="flex-1">{item.name}</span><span className="text-gray-500 text-sm">${(item.menu_price || 0).toFixed(2)}</span></label>)}{menuItems.length === 0 && <p className="px-3 py-2 text-gray-500 text-sm">Create menu items first</p>}</div></div>

              <div><label className="block text-sm font-medium mb-2">Available Add-Ons</label><div className="border rounded max-h-36 overflow-y-auto">{menuItems.filter(i => i.isAddOn).map(item => <label key={item.id} className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 cursor-pointer"><input type="checkbox" checked={packageForm.addOns?.includes(item.id)} onChange={(e) => setPackageForm({ ...packageForm, addOns: e.target.checked ? [...(packageForm.addOns || []), item.id] : packageForm.addOns?.filter(i => i !== item.id) || [] })} className="rounded" /><span className="flex-1">{item.name}</span><span className="text-gray-500 text-sm">+${(item.menu_price || 0).toFixed(2)}</span></label>)}{menuItems.filter(i => i.isAddOn).length === 0 && <p className="px-3 py-2 text-gray-500 text-sm">No add-on items available</p>}</div></div>

              <div><label className="block text-sm font-medium mb-1">Price per Person ($)</label><input type="number" step="0.01" value={packageForm.pricePerPerson} onChange={(e) => setPackageForm({ ...packageForm, pricePerPerson: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 border rounded" /><p className="text-sm text-gray-500 mt-1">Suggested: ${calculatePackagePrice(packageForm.items || []).toFixed(2)} (based on 32% FC)</p></div>
            </div>
            <div className="p-6 border-t bg-gray-50 flex justify-between sticky bottom-0">
              <button onClick={resetPackageForm} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">Cancel</button>
              <button onClick={savePackage} disabled={!packageForm.name} className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">{editingPackage ? 'Update Package' : 'Create Package'}</button>
            </div>
          </div>
        </div>
      )}

      {showBeoForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-auto py-8">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto m-4">
            <div className="p-6 border-b sticky top-0 bg-white z-10"><h2 className="text-xl font-bold">{editingBeo ? 'Edit BEO' : 'New Banquet Event Order'}</h2></div>
            <div className="p-6 space-y-6">
              <div><h3 className="font-medium mb-3 text-gray-700">Event Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2"><label className="block text-sm font-medium mb-1">Event Name *</label><input type="text" value={beoForm.eventName} onChange={(e) => setBeoForm({ ...beoForm, eventName: e.target.value })} className="w-full px-3 py-2 border rounded" placeholder="e.g., Annual Board Meeting Breakfast" /></div>
                  <div><label className="block text-sm font-medium mb-1">Event Date *</label><input type="date" value={beoForm.eventDate} onChange={(e) => setBeoForm({ ...beoForm, eventDate: e.target.value })} className="w-full px-3 py-2 border rounded" /></div>
                  <div className="grid grid-cols-4 gap-2"><div><label className="block text-sm font-medium mb-1">Setup</label><input type="time" value={beoForm.setupTime} onChange={(e) => setBeoForm({ ...beoForm, setupTime: e.target.value })} className="w-full px-3 py-2 border rounded" /></div><div><label className="block text-sm font-medium mb-1">Start</label><input type="time" value={beoForm.eventTime} onChange={(e) => setBeoForm({ ...beoForm, eventTime: e.target.value })} className="w-full px-3 py-2 border rounded" /></div><div><label className="block text-sm font-medium mb-1">End</label><input type="time" value={beoForm.endTime} onChange={(e) => setBeoForm({ ...beoForm, endTime: e.target.value })} className="w-full px-3 py-2 border rounded" /></div><div><label className="block text-sm font-medium mb-1">Breakdown</label><input type="time" value={beoForm.breakdownTime} onChange={(e) => setBeoForm({ ...beoForm, breakdownTime: e.target.value })} className="w-full px-3 py-2 border rounded" /></div></div>
                  <div><label className="block text-sm font-medium mb-1">Location</label><input type="text" value={beoForm.location} onChange={(e) => setBeoForm({ ...beoForm, location: e.target.value })} className="w-full px-3 py-2 border rounded" placeholder="e.g., Main Dining Room" /></div>
                  <div><label className="block text-sm font-medium mb-1">Guest Count *</label><input type="number" value={beoForm.guestCount} onChange={(e) => setBeoForm({ ...beoForm, guestCount: parseInt(e.target.value) || 50 })} className="w-full px-3 py-2 border rounded" /></div>
                </div>
              </div>

              <div><h3 className="font-medium mb-3 text-gray-700">Client Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium mb-1">Client Name *</label><input type="text" value={beoForm.clientName} onChange={(e) => setBeoForm({ ...beoForm, clientName: e.target.value })} className="w-full px-3 py-2 border rounded" /></div>
                  <div><label className="block text-sm font-medium mb-1">Email</label><input type="email" value={beoForm.contactEmail} onChange={(e) => setBeoForm({ ...beoForm, contactEmail: e.target.value })} className="w-full px-3 py-2 border rounded" /></div>
                  <div><label className="block text-sm font-medium mb-1">Phone</label><input type="tel" value={beoForm.contactPhone} onChange={(e) => setBeoForm({ ...beoForm, contactPhone: e.target.value })} className="w-full px-3 py-2 border rounded" /></div>
                  <div><label className="block text-sm font-medium mb-1">Status</label><select value={beoForm.status} onChange={(e) => setBeoForm({ ...beoForm, status: e.target.value })} className="w-full px-3 py-2 border rounded"><option value="draft">Draft</option><option value="pending">Pending Approval</option><option value="confirmed">Confirmed</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select></div>
                </div>
              </div>

              <div><h3 className="font-medium mb-3 text-gray-700">Menu Selection</h3>
                
                <div className="mb-4"><label className="block text-sm font-medium mb-2">Menu Items</label><div className="border rounded max-h-48 overflow-y-auto">{menuItems.map(item => <label key={item.id} className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 cursor-pointer"><input type="checkbox" checked={beoForm.selectedItems?.includes(item.id)} onChange={(e) => setBeoForm({ ...beoForm, selectedItems: e.target.checked ? [...(beoForm.selectedItems || []), item.id] : beoForm.selectedItems?.filter(i => i !== item.id) || [] })} className="rounded" /><span className="flex-1">{item.name}</span><span className="text-gray-500 text-sm">${((item.menu_price || 0) / (item.increment || 1)).toFixed(2)}/person</span></label>)}{menuItems.length === 0 && <p className="px-3 py-2 text-gray-500 text-sm">Create menu items first</p>}</div></div>
                
              </div>

              <div><h3 className="font-medium mb-3 text-gray-700">Notes</h3>
                <div className="space-y-4">
                  <div><label className="block text-sm font-medium mb-1">Dietary Requirements</label><textarea value={beoForm.dietaryNotes} onChange={(e) => setBeoForm({ ...beoForm, dietaryNotes: e.target.value })} className="w-full px-3 py-2 border rounded" rows={2} placeholder="e.g., 5 vegetarian, 2 gluten-free" /></div>
                  <div><label className="block text-sm font-medium mb-1">Special Requests</label><textarea value={beoForm.specialRequests} onChange={(e) => setBeoForm({ ...beoForm, specialRequests: e.target.value })} className="w-full px-3 py-2 border rounded" rows={2} /></div>
                  <div><label className="block text-sm font-medium mb-1">Setup Notes</label><textarea value={beoForm.setupNotes} onChange={(e) => setBeoForm({ ...beoForm, setupNotes: e.target.value })} className="w-full px-3 py-2 border rounded" rows={2} placeholder="e.g., Round tables, buffet style" /></div>
                </div>
              </div>

              <div className="mt-4"><label className="block text-sm font-medium mb-1">Add Component Items (other menu items)</label><div className="relative"><input type="text" value={componentSearch} onChange={(e) => setComponentSearch(e.target.value)} className="w-full px-3 py-2 border rounded" placeholder="Search menu items to add as components..." />{componentSearch && filteredComponents.length > 0 && (<div className="absolute z-10 w-full bg-white border rounded-b shadow-lg max-h-48 overflow-y-auto">{filteredComponents.map(m => <button key={m.id} onClick={() => addComponentToItem(m)} className="w-full text-left px-3 py-2 hover:bg-blue-50 flex justify-between"><span>{m.name}</span><span className="text-gray-500 text-sm">${calculateFoodCost(m.ingredients || [], m.components || [], menuItems).toFixed(2)}</span></button>)}</div>)}</div></div>{itemForm.components.length > 0 && (<div className="mt-2 border rounded overflow-hidden"><table className="w-full text-sm"><thead className="bg-purple-50"><tr><th className="px-3 py-2 text-left">Component</th><th className="px-3 py-2 text-center w-24">Qty</th><th className="px-3 py-2 text-right w-24">Each</th><th className="px-3 py-2 text-right w-24">Total</th><th className="px-3 py-2 w-10"></th></tr></thead><tbody>{itemForm.components.map((comp, index) => <tr key={index} className="border-t"><td className="px-3 py-2 flex items-center gap-2"><input type="checkbox" checked={comp.hidden || false} onChange={(e) => { const updated = [...itemForm.components]; updated[index].hidden = e.target.checked; setItemForm({...itemForm, components: updated}); }} title="Hide from BEO" className="rounded" />{comp.name}</td><td className="px-3 py-2"><input type="number" step="1" value={comp.quantity} onChange={(e) => updateComponentQuantity(index, e.target.value)} className="w-full px-2 py-1 border rounded text-center" /></td><td className="px-3 py-2 text-right">${calculateFoodCost((menuItems.find(m => m.id === comp.menuItemId)?.ingredients || []), (menuItems.find(m => m.id === comp.menuItemId)?.components || []), menuItems).toFixed(2)}</td><td className="px-3 py-2 text-right">${(calculateFoodCost((menuItems.find(m => m.id === comp.menuItemId)?.ingredients || []), (menuItems.find(m => m.id === comp.menuItemId)?.components || []), menuItems) * comp.quantity).toFixed(2)}</td><td className="px-3 py-2"><button onClick={() => removeComponentFromItem(index)} className="text-red-500 hover:text-red-700">✕</button></td></tr>)}</tbody></table></div>)}<div className="bg-gray-50 rounded-lg p-4 mt-4">
                <h3 className="font-medium mb-3">Pricing Summary</h3>
                <div className="space-y-2 text-sm">
                  {beoForm.selectedPackage && <div className="flex justify-between"><span>{packages.find(p => p.id === beoForm.selectedPackage)?.name}</span><span>${((packages.find(p => p.id === beoForm.selectedPackage)?.pricePerPerson || 0) * beoForm.guestCount).toFixed(2)}</span></div>}
                  {beoForm.selectedItems?.map(itemId => { const item = menuItems.find(i => i.id === itemId); return item ? <div key={itemId} className="flex justify-between"><span>{item.name}</span><span>${((item.menu_price || 0) * beoForm.guestCount).toFixed(2)}</span></div> : null; })}
                  {beoForm.selectedAddOns?.map(itemId => { const item = menuItems.find(i => i.id === itemId); return item ? <div key={itemId} className="flex justify-between text-gray-600"><span>+ {item.name}</span><span>${((item.menu_price || 0) * beoForm.guestCount).toFixed(2)}</span></div> : null; })}
                  <div className="border-t pt-2 mt-2"><div className="flex justify-between font-medium"><span>Subtotal ({beoForm.guestCount} guests)</span><span>${(() => { let total = 0; if (beoForm.selectedPackage) total += (packages.find(p => p.id === beoForm.selectedPackage)?.pricePerPerson || 0) * beoForm.guestCount; beoForm.selectedItems?.forEach(id => { const item = menuItems.find(i => i.id === id); if (item) { const inc = item.increment || 1; const qty = Math.ceil(beoForm.guestCount / inc) * inc; total += (item.menu_price || 0) * qty; } }); beoForm.selectedAddOns?.forEach(id => { const item = menuItems.find(i => i.id === id); if (item) { const inc = item.increment || 1; const qty = Math.ceil(beoForm.guestCount / inc) * inc; total += (item.menu_price || 0) * qty; } }); return total.toFixed(2); })()}</span></div></div>
                </div>
              </div>
            </div>
            <div className="p-6 border-t bg-gray-50 flex justify-between sticky bottom-0">
              <button onClick={resetBeoForm} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">Cancel</button>
              <button onClick={saveBeo} disabled={!beoForm.eventName || !beoForm.clientName || !beoForm.eventDate} className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">{editingBeo ? 'Update BEO' : 'Create BEO'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
