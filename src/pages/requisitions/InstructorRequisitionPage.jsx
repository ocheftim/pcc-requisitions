import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getIngredients, saveRequisition, updateRequisition, supabase } from '../../lib/supabase';
import { calculateUnitPrice } from "../../utils/packSizeParser";
import { sendRequisitionEmails } from '../../lib/emailService';
import RecipeSelector from '../../components/requisitions/RecipeSelector';

export default function InstructorRequisitionPage({ hideNav = false }) {
  const navigate = useNavigate();
  const [instructor, setInstructor] = useState('');
  const [classDate, setClassDate] = useState('');
  const [program, setProgram] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [recipes, setRecipes] = useState('');
  const [labRecipes, setLabRecipes] = useState([]);
  const [reqModule, setReqModule] = useState(null);
  const [orderItems, setOrderItems] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [customItemName, setCustomItemName] = useState('');
  const [customItemUnit, setCustomItemUnit] = useState('lb');
  const [customItemCost, setCustomItemCost] = useState('');
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [ingredientFilter, setIngredientFilter] = useState('all');
  const [submitted, setSubmitted] = useState(false);
  const [submittedReq, setSubmittedReq] = useState(null);
  const [detailedView, setDetailedView] = useState(false);
  const [studentCount, setStudentCount] = useState(14);
  const [baseStudentCount, setBaseStudentCount] = useState(14);
  const [editingRequisitionId, setEditingRequisitionId] = useState(null);
  const [editingItemId, setEditingItemId] = useState(null);
  const [swapSearch, setSwapSearch] = useState('');
  const [pendingEdits, setPendingEdits] = useState([]);
  const [notes, setNotes] = useState('');

  const instructors = [
    'Cabrera',
    'Kouchit',
    'McKoy',
    'Mikesell',
    'Moreno',
    "O'Donnell",
    'Toscano',
    'Wong',
    'Kouchit'
  ];

  useEffect(() => {
    // Check URL params for edit/view mode
    const urlParams = new URLSearchParams(window.location.search);
    const editId = urlParams.get("edit");
    const viewId = urlParams.get("view");
    const reqId = editId || viewId;
    
    if (reqId) {
      const loadRequisition = async () => {
        const { data } = await supabase.from("requisitions").select("*").eq("id", reqId).single();
        if (data) {
          setEditingRequisitionId(data.id);
          setInstructor(data.instructor || "");
          setClassDate(data.class_date?.split("T")[0] || "");
          setProgram(data.program || "");
          setSelectedClass(data.course || "");
          setRecipes(data.recipes || "");
          setStudentCount(data.students || 12);
          setNotes(data.notes || "");
          setReqModule(data.module || null);
          const items = {};
          (data.items || []).forEach(item => {
            const itemId = item.id || `item-${item.name}`;
            items[itemId] = { ...item, id: itemId };
          });
          setOrderItems(items);
        }
      };
      loadRequisition();
      return;
    }


    const reqToEdit = localStorage.getItem('requisitionToEdit');
    const reqToCopy = localStorage.getItem('requisitionToCopy');
    
    if (reqToEdit) {
      try {
        const req = JSON.parse(reqToEdit);
        setEditingRequisitionId(req.id);
        setInstructor(req.instructor || '');
        setClassDate(req.class_date?.split('T')[0] || '');
        setProgram(req.program || '');
        setSelectedClass(req.course || '');
        setRecipes(req.recipes || '');
        setStudentCount(req.students || 12);
        setNotes(req.notes || '');
        
        const items = {};
        (req.items || []).forEach(item => {
          const itemId = item.id || `item-${item.name}`;
          items[itemId] = { ...item, id: itemId };
        });
        setOrderItems(items);
        localStorage.removeItem('requisitionToEdit');
      } catch (e) {
        console.error('Error loading requisition to edit:', e);
      }
    } else if (reqToCopy) {
      try {
        const req = JSON.parse(reqToCopy);
        setInstructor(req.instructor || '');
        setProgram(req.program || '');
        setSelectedClass(req.course || '');
        setRecipes(req.recipes || '');
        setStudentCount(req.students || 12);
        
        const items = {};
        (req.items || []).forEach(item => {
          const itemId = item.id || `item-${item.name}`;
          items[itemId] = { ...item, id: itemId };
        });
        setOrderItems(items);
        localStorage.removeItem('requisitionToCopy');
      } catch (e) {
        console.error('Error loading requisition to copy:', e);
      }
    }
  }, []);

  const classes = {
    'Culinary Arts': [
      { code: 'CUL105', name: 'Culinary Fundamentals', day: 'Monday', studentFee: 280.00 },
      { code: 'CUL110', name: 'Culinary Principles II', day: 'Tuesday', studentFee: 280.00 },
      { code: 'CUL130', name: 'Savory Cuisine', day: 'Wednesday', studentFee: 280.00 },
      { code: 'CUL140', name: 'Culinary Principles', day: 'Tuesday', studentFee: 331.29 },
      { code: 'CUL150', name: 'Garde Manger', day: 'Thursday', studentFee: 280.00 },
      { code: 'CUL163', name: 'Sauces', day: 'Wednesday', studentFee: 280.00 },
      { code: 'CUL189', name: 'Culinary Arts Capstone I', day: 'Friday', studentFee: 280.00 },
      { code: 'CUL205', name: 'International Cuisines', day: 'Monday', studentFee: 280.00 },
      { code: 'CUL210', name: 'Advanced Culinary', day: 'Tuesday', studentFee: 280.00 },
      { code: 'CUL289', name: 'Culinary Arts Capstone II', day: 'Friday', studentFee: 280.00 },
    ],
    'Baking & Pastry': [
      { code: 'CUL160', name: 'Bakery and Pastry Production I', day: 'Wednesday', studentFee: 331.29 },
      { code: 'CUL162', name: 'Art of Chocolate', day: 'Friday', studentFee: 295.39 },
      { code: 'CUL164', name: 'Cakes and Decorating', day: 'Thursday', studentFee: 280.00 },
      { code: 'CUL168', name: 'Specialty and Hearth Breads', day: 'Monday', studentFee: 280.00 },
      { code: 'CUL244', name: 'Confections, Show Pcs, Desserts', day: 'Tuesday', studentFee: 312.06 },
      { code: 'CUL260', name: 'Pastry Arts II', day: 'Thursday', studentFee: 280.00 },
      { code: 'CUL264', name: 'Wedding Cakes', day: 'Wednesday', studentFee: 280.00 },
      { code: 'CUL266', name: 'Ice Cream, Bavarian, Mousse', day: 'Tuesday', studentFee: 309.50 },
      { code: 'CUL268', name: 'Baking & Pastry Capstone', day: 'Friday', studentFee: 280.00 },
    ],
    'Childcare': [
      { code: 'CDC-GEN', name: 'General', day: 'Varies', studentFee: 0 },
    ],
    'Foodservice': [
      { code: 'FSO-CAT', name: 'Catering', day: 'Varies', studentFee: 0 },
      { code: 'FSO-BIS', name: 'Bistro', day: 'Varies', studentFee: 0 },
      { code: 'FSO-GRL', name: 'Grill', day: 'Varies', studentFee: 0 },
      { code: 'FSO-OTH', name: 'Other', day: 'Varies', studentFee: 0 },
    ]
  };

  const selectedClassData = program && selectedClass ? classes[program]?.find(c => c.code === selectedClass) : null;
  const studentFee = selectedClassData?.studentFee || 0;
  const labBudget = (studentCount * studentFee) / 8;

  const [allIngredients, setAllIngredients] = useState([]);

  useEffect(() => {
    // Check URL params for edit/view mode
    const urlParams = new URLSearchParams(window.location.search);
    const editId = urlParams.get("edit");
    const viewId = urlParams.get("view");
    const reqId = editId || viewId;
    
    if (reqId) {
      const loadRequisition = async () => {
        const { data } = await supabase.from("requisitions").select("*").eq("id", reqId).single();
        if (data) {
          setEditingRequisitionId(data.id);
          setInstructor(data.instructor || "");
          setClassDate(data.class_date?.split("T")[0] || "");
          setProgram(data.program || "");
          setSelectedClass(data.course || "");
          setRecipes(data.recipes || "");
          setStudentCount(data.students || 12);
          setNotes(data.notes || "");
          setReqModule(data.module || null);
          const items = {};
          (data.items || []).forEach(item => {
            const itemId = item.id || `item-${item.name}`;
            items[itemId] = { ...item, id: itemId };
          });
          setOrderItems(items);
        }
      };
      loadRequisition();
      return;
    }


    const loadAllIngredients = async () => {
      try {
        const ingredients = await getIngredients();
        setAllIngredients(ingredients);
      } catch (error) {
        console.error('Error loading ingredients:', error);
      }
    };
    loadAllIngredients();
  }, []);

  const filteredIngredients = useMemo(() => {
    let items = allIngredients.filter(ing => !ing.hiddenFromInstructor);
    
    if (ingredientFilter === 'baking') {
      items = items.filter(item =>
        ['BAKING', 'DAIRY', 'DAIRY & EGGS', 'PANTRY'].includes(item.category?.toUpperCase())
      );
    } else if (ingredientFilter === 'culinary') {
      items = items.filter(item =>
        ['PRODUCE', 'PROTEIN', 'MEAT', 'SEAFOOD', 'DAIRY', 'DAIRY & EGGS', 'PANTRY'].includes(item.category?.toUpperCase())
      );
    }
    
    items.sort((a, b) => {
      if (a.category !== b.category) return (a.category || '').localeCompare(b.category || '');
      if (a.subcategory !== b.subcategory) return (a.subcategory || '').localeCompare(b.subcategory || '');
      return a.name.localeCompare(b.name);
    });
    
    return items;
  }, [ingredientFilter, allIngredients]);

  const searchResults = useMemo(() => {
    if (!searchTerm) return [];
    const term = searchTerm.toLowerCase();
    return filteredIngredients.filter(item =>
      item.name.toLowerCase().includes(term)
    ).slice(0, 10);
  }, [searchTerm, filteredIngredients]);

  const groupedIngredients = useMemo(() => {
    const groups = {};
    filteredIngredients.forEach(item => {
      const cat = item.category || 'Other';
      const subcat = item.subcategory || 'General';
      if (!groups[cat]) groups[cat] = {};
      if (!groups[cat][subcat]) groups[cat][subcat] = [];
      groups[cat][subcat].push(item);
    });
    return groups;
  }, [filteredIngredients]);

  const getUnitCost = (item) => {
    if (item.isCustom) return item.unitCost || 0;
    // Look up current price from ingredients list
    const ing = allIngredients.find(i => i.name?.toLowerCase() === item.name?.toLowerCase());
    if (ing) {
      if (ing.unitPrice) return ing.unitPrice;
      if (ing.casePrice && ing.packSize) {
        const calculated = calculateUnitPrice(ing.casePrice, ing.packSize, ing.unit || 'ea');
        if (calculated !== null) return calculated;
      }
    }
    return item.unitCost || item.unitPrice || 0;
  };

  

  // Track edit and swap item
  const swapItem = async (oldItem, newItem, reason = '') => {
    const edit = {
      requisition_id: editingRequisitionId,
      original_item: { name: oldItem.name, unit: oldItem.unit, quantity: oldItem.quantity },
      new_item: { name: newItem.name, unit: newItem.unit, quantity: oldItem.quantity },
      edit_type: 'substitution',
      reason: reason || 'Manager substitution',
      edited_by: 'Manager',
      instructor: instructor
    };
    
    // Save to pending edits (will be saved when requisition is updated)
    setPendingEdits(prev => [...prev, edit]);
    
    // Update order items - preserve position with correct pricing
    const unitCost = getUnitCost(newItem);
    const newItems = {};
    Object.entries(orderItems).forEach(([key, val]) => {
      if (key === oldItem.id) {
        newItems[newItem.id] = {
          ...newItem,
          quantity: oldItem.quantity,
          unitCost: unitCost,
          isFromMainList: true,
          note: `Sub for ${oldItem.name}${reason ? ': ' + reason : ''}`
        };
      } else {
        newItems[key] = val;
      }
    });
    setOrderItems(newItems);
    setEditingItemId(null);
    setSwapSearch('');
  };

  // Save edits to database
  const saveEditsToDb = async (reqId) => {
    if (pendingEdits.length === 0) return;
    for (const edit of pendingEdits) {
      await supabase.from('requisition_edits').insert({ ...edit, requisition_id: reqId });
    }
    setPendingEdits([]);
  };

  // Swap search results
  const swapSearchResults = useMemo(() => {
    if (!swapSearch || swapSearch.length < 2) return [];
    const term = swapSearch.toLowerCase();
    return allIngredients.filter(i => 
      i.name?.toLowerCase().includes(term) && !orderItems[i.id]
    ).slice(0, 8);
  }, [swapSearch, allIngredients, orderItems]);

  const updateQuantity = (itemId, value) => {
    const qty = parseFloat(value) || 0;
    if (qty <= 0) {
      const newItems = { ...orderItems };
      delete newItems[itemId];
      setOrderItems(newItems);
    } else {
      const item = filteredIngredients.find(i => i.id === itemId) ||
                   Object.values(orderItems).find(i => i.id === itemId);
      if (item) {
        setOrderItems({
          ...orderItems,
          [itemId]: { ...item, quantity: qty }
        });
      }
    }
  };

  const updateItemNote = (itemId, note) => {
    if (orderItems[itemId]) {
      setOrderItems({
        ...orderItems,
        [itemId]: { ...orderItems[itemId], note }
      });
    }
  };

  const addFromSearch = (item) => {
    setOrderItems({
      ...orderItems,
      [item.id]: { ...item, quantity: 1 }
    });
    setSearchTerm('');
  };

  const addCustomItem = () => {
    if (!customItemName || !customItemCost) return;
    const id = `CUSTOM-${Date.now()}`;
    setOrderItems({
      ...orderItems,
      [id]: {
        id,
        name: customItemName,
        unit: customItemUnit,
        unitCost: parseFloat(customItemCost),
        quantity: 1,
        isCustom: true
      }
    });
    setCustomItemName('');
    setCustomItemCost('');
    setShowCustomForm(false);
  };

  const totalCost = useMemo(() => {
    return Object.values(orderItems).reduce((sum, item) => {
      return sum + (getUnitCost(item) * (item.quantity || 0));
    }, 0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderItems]);

  const handleSubmit = async () => {
    if (!instructor || !program || !selectedClass) {
      alert('Please fill in all required fields');
      return;
    }
    const items = Object.values(orderItems).filter(i => i.quantity > 0).map(item => {
      const unitCost = getUnitCost(item);
      return {
        ...item,
        unitCost,
        extended: (item.quantity || 0) * unitCost
      };
    });
    if (items.length === 0) {
      alert('Please add at least one item');
      return;
    }
    
    const requisition = {
      instructor,
      class_date: classDate || null,
      program,
      course: selectedClass,
      week: selectedClassData?.name || selectedClass,
      recipes,
      students: studentCount,
      budget: labBudget,
      items,
      notes,
      status: 'submitted'
    };
    
    try {
      let saved;
      if (editingRequisitionId) {
        await updateRequisition(editingRequisitionId, requisition);
        saved = { id: editingRequisitionId, ...requisition };
      } else {
        saved = await saveRequisition(requisition);
      }
      
      setSubmittedReq({ ...requisition, id: saved.id, totalCost });
      if (!editingRequisitionId) {
        sendRequisitionEmails({ ...requisition, totalCost }).catch(err => console.error("Email error:", err));
      }
      setSubmitted(true);
      clearForm();
    } catch (error) {
      console.error('Error saving requisition:', error);
      alert('Error saving requisition: ' + error.message);
    }
  };

  const clearForm = () => {
    setOrderItems({});
    setRecipes('');
    setNotes('');
    setEditingRequisitionId(null);
  };

  if (submitted && submittedReq) {
    return (
      <div className="min-h-screen bg-gray-50">
        {hideNav && (
          <header className="bg-white border-b border-gray-200 shadow-sm">
            <div className="max-w-7xl mx-auto px-6 py-4">
              <div className="flex items-center gap-6">
                <img src="/pcc-logo.png" alt="Pima Community College" className="h-14" />
                <div className="border-l-4 border-blue-600 pl-6">
                  <h1 className="text-2xl font-bold text-gray-800">Lab Requisition</h1>
                  <p className="text-sm text-gray-600">Culinary Arts and Baking & Pastry Arts</p>
                </div>
              </div>
            </div>
          </header>
        )}
        <div className="max-w-2xl mx-auto p-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              {editingRequisitionId ? 'Requisition Updated' : 'Requisition Submitted'}
            </h2>
            <p className="text-gray-600 mb-6">
              {editingRequisitionId ? 'Your changes have been saved.' : 'Your requisition has been submitted and is pending review.'}
            </p>
            <div className="bg-gray-50 rounded-lg p-4 text-left mb-6">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-gray-500">Instructor:</div>
                <div className="font-medium">{submittedReq.instructor}</div>
                <div className="text-gray-500">Class:</div>
                <div className="font-medium">{submittedReq.course} - {submittedReq.week}</div>
                <div className="text-gray-500">Date:</div>
                <div className="font-medium">{submittedReq.class_date || "Not specified"}</div>
                <div className="text-gray-500">Items:</div>
                <div className="font-medium">{submittedReq.items.length} items</div>
                <div className="text-gray-500">Total:</div>
                <div className="font-medium">${submittedReq.totalCost.toFixed(2)}</div>
              </div>
            </div>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => navigate('/requisitions/my-orders')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                View My Requisitions
              </button>
              <button
                onClick={() => { setSubmitted(false); setSubmittedReq(null); clearForm(); }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Create Another
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {hideNav && (
        <header className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center gap-6">
              <img src="/pcc-logo.png" alt="Pima Community College" className="h-14" />
              <div className="border-l-4 border-blue-600 pl-6">
                <h1 className="text-2xl font-bold text-gray-800">Lab Requisition</h1>
                <p className="text-sm text-gray-600">Culinary Arts and Baking & Pastry Arts</p>
              </div>
            </div>
          </div>
        </header>
      )}
      
      <div className="p-6 max-w-7xl mx-auto">
        {editingRequisitionId && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-300 rounded-lg flex justify-between items-center">
            <div>
              <span className="font-bold text-yellow-800">✏️ Editing Requisition</span>
              <span className="text-yellow-700 ml-2">Make changes and click "Update Requisition" to save</span>
            </div>
            <button
              onClick={() => navigate('/requisitions/my-orders')}
              className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm"
            >
              Cancel
            </button>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-blue-800 mb-4">Class Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Instructor <span className="text-red-500">*</span>
              </label>
              <select
                value={instructor}
                onChange={(e) => setInstructor(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Instructor</option>
                {instructors.map(inst => (
                  <option key={inst} value={inst}>{inst}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Class Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={classDate}
                onChange={(e) => setClassDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Program <span className="text-red-500">*</span>
              </label>
              <select
                value={program}
                onChange={(e) => { setProgram(e.target.value); setSelectedClass(''); }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Program</option>
                <option value="Culinary Arts">Culinary Arts</option>
                <option value="Baking & Pastry">Baking & Pastry</option>
                <option value="Foodservice">Foodservice</option>
                <option value="Childcare">Childcare</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Class <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={!program}
              >
                <option value="">Select Class</option>
                {program && classes[program]?.map(cls => (
                  <option key={cls.code} value={cls.code}>{cls.code} - {cls.name}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="flex justify-between items-center mb-1"><label className="block text-sm font-medium text-gray-700">Recipe / Menu</label>{selectedClass && <a href={`/recipes?class=${selectedClass}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 text-sm">📖 View Class Recipes</a>}</div>
              <input
                type="text"
                value={recipes}
                onChange={(e) => setRecipes(e.target.value)}
                placeholder="e.g., White Bread, Pg 237; Cookies"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Students/Guests</label>
              <input
                type="number"
                min="1"
                max="30"
                value={studentCount}
                onChange={(e) => {
                  const newCount = parseInt(e.target.value) || 1;
                  const oldCount = studentCount || 14;
                  if (newCount !== oldCount && Object.keys(orderItems).length > 0) {
                    const scale = newCount / oldCount;
                    const scaledItems = {};
                    Object.entries(orderItems).forEach(([key, item]) => {
                      const newQty = Math.round((item.quantity || 0) * scale * 100) / 100;
                      scaledItems[key] = { ...item, quantity: newQty };
                    });
                    setOrderItems(scaledItems);
                  }
                  setStudentCount(newCount);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Special instructions..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Recipe Selector */}
        <div className="mb-6">
          <RecipeSelector
            courseCode={selectedClass}
            initialRecipeNames={recipes}
            moduleNumber={reqModule}
            studentCount={studentCount}
            onApplyIngredients={(ingredients) => {
              const newItems = {};
              ingredients.forEach((ing, idx) => {
                const id = `recipe-ing-${idx}`;
                newItems[id] = {
                  id,
                  name: ing.name,
                  unit: ing.unit,
                  quantity: Math.ceil(ing.quantity * 10) / 10,
                  cost_per_unit: 0,
                  total: 0,
                  notes: ""
                };
              });
              setOrderItems(newItems);
            }}
            onIngredientsChange={(ingredients) => {
              const newItems = {};
              ingredients.forEach((ing, idx) => {
                const id = `recipe-ing-${idx}`;
                newItems[id] = {
                  id,
                  name: ing.name,
                  unit: ing.unit,
                  quantity: Math.ceil(ing.quantity * 10) / 10,
                  cost_per_unit: 0,
                  notes: `From: ${ing.sources.map(s => s.recipe).join(", ")}`
                };
              });
              setOrderItems(prev => ({ ...prev, ...newItems }));
            }}
            onRecipesChange={(recs) => {
              setLabRecipes(recs);
              setRecipes(recs.map(r => r.name).join("; "));
            }}
            initialRecipes={labRecipes}
          />
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex justify-between items-center">
          <div>
            <span className="font-semibold text-blue-800">Budget:</span>
            <span className="ml-2 text-blue-700">${labBudget.toFixed(2)}</span>
          </div>
          <div>
            <span className="font-semibold text-blue-800">Current Total:</span>
            <span className={`ml-2 text-xl font-bold ${totalCost > labBudget ? 'text-red-600' : 'text-green-600'}`}>
              ${totalCost.toFixed(2)}
            </span>
          </div>
          <div>
            <span className="font-semibold text-blue-800">Remaining:</span>
            <span className={`ml-2 font-bold ${labBudget - totalCost < 0 ? 'text-red-600' : 'text-green-600'}`}>
              ${(labBudget - totalCost).toFixed(2)}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex gap-4 items-end">
            <div className="flex-1 relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">Search Ingredients</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Type to search..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              {searchResults.length > 0 && (
                <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg mt-1 shadow-lg max-h-60 overflow-auto">
                  {searchResults.map(item => (
                    <div
                      key={item.id}
                      onClick={() => addFromSearch(item)}
                      className="px-3 py-2 hover:bg-blue-50 cursor-pointer border-b"
                    >
                      <span className="font-medium">{item.name}{!allIngredients.find(ing => ing.name?.toLowerCase() === item.name?.toLowerCase()) && <span className="ml-1 text-xs text-orange-500" title="Custom item - not in main list">⚠️</span>}</span>
                      <span className="text-gray-500 text-sm ml-2">({item.unit}) - ${getUnitCost(item).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => setShowCustomForm(!showCustomForm)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              + Custom Item
            </button>
          </div>
          
          {showCustomForm && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg flex gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
                <input
                  type="text"
                  value={customItemName}
                  onChange={(e) => setCustomItemName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div className="w-24">
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                <select
                  value={customItemUnit}
                  onChange={(e) => setCustomItemUnit(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="lb">lb</option>
                  <option value="oz">oz</option>
                  <option value="ea">ea</option>
                  <option value="qt">qt</option>
                  <option value="gal">gal</option>
                  <option value="bu">bu</option>
                </select>
              </div>
              <div className="w-28">
                <label className="block text-sm font-medium text-gray-700 mb-1">Cost/Unit</label>
                <input
                  type="number"
                  step="0.01"
                  value={customItemCost}
                  onChange={(e) => setCustomItemCost(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <button
                onClick={addCustomItem}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Add
              </button>
            </div>
          )}
        </div>

        {Object.keys(orderItems).length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-blue-800">Your Order ({Object.keys(orderItems).length} items)</h3>
              <div className="flex gap-2">
                <button onClick={clearForm} className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 text-sm">Clear All</button>
                <button 
                  onClick={handleSubmit} 
                  className={`px-4 py-2 text-white rounded-lg text-sm font-medium ${editingRequisitionId ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-green-600 hover:bg-green-700'}`}
                >
                  {editingRequisitionId ? '💾 Update Requisition' : '✓ Submit Requisition'}
                </button>
              </div>
            </div>
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-3 py-2">Item</th>
                  <th className="text-left px-3 py-2">Unit</th>
                  <th className="text-right px-3 py-2">Cost/Unit</th>
                  <th className="text-center px-3 py-2 w-24">Qty</th>
                  <th className="text-right px-3 py-2">Total</th>
                  <th className="px-3 py-2 w-32">Notes</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {Object.values(orderItems).map(item => (
                  <tr key={item.id} className="border-t">
                    <td className="px-3 py-2 font-medium">
                      {editingItemId === item.id ? (
                        <div className="relative">
                          <input
                            type="text"
                            value={swapSearch}
                            onChange={(e) => setSwapSearch(e.target.value)}
                            placeholder="Search replacement..."
                            className="w-full px-2 py-1 border border-blue-400 rounded text-sm"
                            autoFocus
                          />
                          {swapSearchResults.length > 0 && (
                            <div className="absolute z-20 w-64 bg-white border shadow-lg rounded mt-1 max-h-48 overflow-auto">
                              {swapSearchResults.map(ing => (
                                <div
                                  key={ing.id}
                                  onClick={() => swapItem(item, ing)}
                                  className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm border-b"
                                >
                                  <div className="font-medium">{ing.name}</div>
                                  <div className="text-gray-500 text-xs">{ing.unit} - ${getUnitCost(ing).toFixed(2)}</div>
                                </div>
                              ))}
                            </div>
                          )}
                          <button 
                            onClick={() => { setEditingItemId(null); setSwapSearch(''); }}
                            className="absolute right-1 top-1 text-gray-400 hover:text-gray-600"
                          >✕</button>
                        </div>
                      ) : (
                        <span 
                          onClick={() => setEditingItemId(item.id)}
                          className="cursor-pointer hover:text-blue-600 hover:underline"
                          title="Click to swap ingredient"
                        >{item.name}</span>
                      )}
                    </td>
                    <td className="px-3 py-2">{item.unit}</td>
                    <td className="px-3 py-2 text-right">${getUnitCost(item).toFixed(2)}</td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={item.quantity || ''}
                        onChange={(e) => updateQuantity(item.id, e.target.value)}
                        className="w-20 px-2 py-1 border border-gray-300 rounded text-center"
                      />
                    </td>
                    <td className="px-3 py-2 text-right font-medium">
                      ${(getUnitCost(item) * (item.quantity || 0)).toFixed(2)}
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        placeholder="Note..."
                        value={item.note || ''}
                        onChange={(e) => updateItemNote(item.id, e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <button
                        onClick={() => updateQuantity(item.id, 0)}
                        className="text-red-500 hover:text-red-700"
                      >✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td colSpan="4" className="px-3 py-2 text-right font-semibold">Total:</td>
                  <td className="px-3 py-2 text-right font-bold text-lg">${totalCost.toFixed(2)}</td>
                  <td colSpan="2"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-4">
              <h3 className="text-lg font-semibold text-blue-800">Available Ingredients ({filteredIngredients.length})</h3>
              <button
                onClick={() => setDetailedView(!detailedView)}
                className={`px-3 py-1 text-sm rounded-lg ${detailedView ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
              >
                {detailedView ? '✓ Detailed' : 'Simple'}
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setIngredientFilter('all')}
                className={`px-4 py-2 rounded-lg ${ingredientFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
              >
                All
              </button>
              <button
                onClick={() => setIngredientFilter('culinary')}
                className={`px-4 py-2 rounded-lg ${ingredientFilter === 'culinary' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
              >
                Culinary
              </button>
              <button
                onClick={() => setIngredientFilter('baking')}
                className={`px-4 py-2 rounded-lg ${ingredientFilter === 'baking' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
              >
                Baking
              </button>
            </div>
          </div>
          
          {Object.entries(groupedIngredients).map(([category, subcategories]) => (
            <div key={category} className="mb-6">
              <h4 className="font-bold text-blue-800 bg-blue-100 px-3 py-2 rounded text-lg">{category}</h4>
              <table className="w-full mt-2">
                <thead className="text-xs text-gray-500 bg-gray-50">
                  <tr>
                    <th className="text-left px-3 py-2">Item</th>
                    <th className="text-left px-3 py-2 w-16">Unit</th>
                    {detailedView && <th className="text-left px-3 py-2 w-24">Pack</th>}
                    {detailedView && <th className="text-right px-3 py-2 w-20">Case $</th>}
                    <th className="text-right px-3 py-2 w-20">$/Unit</th>
                    <th className="text-center px-3 py-2 w-20">Qty</th>
                    {detailedView && <th className="text-right px-3 py-2 w-20">Extended</th>}
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(subcategories).map(([subcategory, items]) => (
                    <React.Fragment key={subcategory}>
                      <tr className="bg-blue-50">
                        <td colSpan={detailedView ? 7 : 4} className="px-3 py-1 font-semibold text-blue-600 border-l-4 border-blue-400">{subcategory} ({items.length})</td>
                      </tr>
                      {items.map(item => {
                        const qty = orderItems[item.id]?.quantity || 0;
                        const unitCost = getUnitCost(item);
                        return (
                          <tr key={item.id} className={`border-t border-gray-100 hover:bg-gray-50 ${qty > 0 ? 'bg-green-50' : ''}`}>
                            <td className="px-3 py-1 pl-6">{item.name}</td>
                            <td className="px-3 py-1 text-gray-600">{item.unit}</td>
                            {detailedView && <td className="px-3 py-1 text-gray-500 text-xs">{item.packSize || '-'}</td>}
                            {detailedView && <td className="px-3 py-1 text-right text-gray-500 text-xs">${(item.casePrice || 0).toFixed(2)}</td>}
                            <td className="px-3 py-1 text-right">${unitCost.toFixed(2)}</td>
                            <td className="px-3 py-1 text-center">
                              <input
                                type="number"
                                min="0"
                                step="0.5"
                                value={qty || ''}
                                onChange={(e) => updateQuantity(item.id, e.target.value)}
                                className="w-16 px-2 py-1 border border-gray-300 rounded text-center text-sm"
                              />
                            </td>
                            {detailedView && <td className="px-3 py-1 text-right font-medium">{qty > 0 ? `$${(unitCost * qty).toFixed(2)}` : '-'}</td>}
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

        {Object.keys(orderItems).length > 0 && (
          <div className="sticky bottom-4 bg-white rounded-lg shadow-lg border border-gray-300 p-4 flex justify-between items-center">
            <div className="text-lg">
              <span className="text-gray-600">Total:</span>
              <span className={`ml-2 font-bold ${totalCost > labBudget ? 'text-red-600' : 'text-green-600'}`}>${totalCost.toFixed(2)}</span>
              <span className="text-gray-400 mx-2">/</span>
              <span className="text-gray-600">${labBudget.toFixed(2)} budget</span>
            </div>
            <button 
              onClick={handleSubmit} 
              className={`px-6 py-3 text-white rounded-lg font-medium ${editingRequisitionId ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-green-600 hover:bg-green-700'}`}
            >
              {editingRequisitionId ? '💾 Update Requisition' : '✓ Submit Requisition'}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
