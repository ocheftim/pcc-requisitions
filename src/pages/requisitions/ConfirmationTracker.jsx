import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

const COURSE_NAMES = {
  'CUL130': 'Savory Cuisine',
  'CUL140': 'Culinary Principles',
  'CUL150': 'Garde Manger',
  'CUL160': 'Bakery & Pastry Production I',
  'CUL244': 'Confections, Show Pieces, Desserts',
  'CUL260': 'Pastry Arts II',
  'CUL266': 'Ice Cream, Bavarian, Mousse'
};

const TEXTBOOKS = {
  'CUL130': 'On Cooking',
  'CUL140': 'On Cooking',
  'CUL150': 'On Cooking',
  'CUL160': 'On Baking',
  'CUL244': 'On Baking',
  'CUL260': 'On Baking',
  'CUL266': 'On Baking'
};

export default function ConfirmationTracker() {
  const [requisitions, setRequisitions] = useState([]);
  const [confirmations, setConfirmations] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedClasses, setSelectedClasses] = useState([]);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [dbRules, setDbRules] = useState([]);
  const [dbSubRecipes, setDbSubRecipes] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    
    const { data: reqs } = await supabase
      .from('requisitions')
      .select('*')
      .gte('class_date', '2026-01-13')
      .order('class_date', { ascending: true });
    
    setRequisitions(reqs || []);
    
    // Load ingredient rules from DB
    const { data: rules } = await supabase
      .from('ingredient_rules')
      .select('*')
      .eq('is_active', true);
    setDbRules(rules || []);
    
    // Load sub-recipes with ingredients
    const { data: recipes } = await supabase
      .from('sub_recipes')
      .select('*');
    
    const { data: recipeIngs } = await supabase
      .from('sub_recipe_ingredients')
      .select('*')
      .order('sort_order');
    
    // Combine
    const recipesWithIngs = (recipes || []).map(r => ({
      ...r,
      ingredients: (recipeIngs || []).filter(i => i.sub_recipe_id === r.id)
    }));
    setDbSubRecipes(recipesWithIngs);
    
    const saved = localStorage.getItem('confirmationStatus');
    if (saved) {
      setConfirmations(JSON.parse(saved));
    }
    
    setLoading(false);
  };

  const saveConfirmations = (newConfirmations) => {
    setConfirmations(newConfirmations);
    localStorage.setItem('confirmationStatus', JSON.stringify(newConfirmations));
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const getWeekNumber = (classDate) => {
    if (!classDate) return 99;
    const d = new Date(classDate + 'T12:00:00');
    const moduleStart = new Date('2026-01-15T12:00:00');
    const diff = Math.floor((d - moduleStart) / (7 * 24 * 60 * 60 * 1000));
    return Math.max(1, diff + 1);
  };
  
  const getModuleDateRange = (week) => {
    const ranges = {
      1: 'Jan 15-21', 2: 'Jan 22-28', 3: 'Jan 29-Feb 4', 4: 'Feb 5-11',
      5: 'Feb 12-18', 6: 'Feb 19-25', 7: 'Feb 26-Mar 4', 8: 'Mar 5-11'
    };
    return ranges[week] || '';
  };

  const getDueDate = (classDate) => {
    if (!classDate) return null;
    const d = new Date(classDate + 'T12:00:00');
    d.setDate(d.getDate() - 10);
    return d;
  };

  const getDaysUntil = (date) => {
    if (!date) return null;
    const target = date instanceof Date ? date : new Date(date);
    target.setHours(0, 0, 0, 0);
    return Math.ceil((target - today) / (1000 * 60 * 60 * 24));
  };

  const formatDate = (d) => {
    if (!d) return '';
    const date = typeof d === 'string' ? new Date(d + 'T12:00:00') : d;
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const upcomingClasses = requisitions.map(req => {
    const classDate = new Date(req.class_date + 'T12:00:00');
    const week = getWeekNumber(req.class_date);
    const classKey = `${req.instructor}-${req.course}-${week}`;
    const confirmation = confirmations[classKey] || {};
    const dueDate = getDueDate(req.class_date);
    const daysUntilDue = getDaysUntil(dueDate);
    const daysUntilClass = getDaysUntil(classDate);
    
    let items = [];
    try {
      items = typeof req.items === 'string' ? JSON.parse(req.items) : (req.items || []);
    } catch(e) { items = []; }
    
    return {
      key: classKey,
      instructor: req.instructor,
      course: req.course,
      courseName: COURSE_NAMES[req.course] || req.course,
      textbook: TEXTBOOKS[req.course] || 'On Cooking',
      week, classDate, dueDate, daysUntilClass, daysUntilDue,
      requisition: req,
      hasIngredients: items.length > 0,
      hasStudentCount: !!req.students,
      hasRecipes: !!req.recipes,
      confirmation,
      status: getStatus(req, confirmation, daysUntilDue)
    };
  });

  function getStatus(req, confirmation, daysUntilDue) {
    if (confirmation?.confirmed) return 'confirmed';
    if (confirmation?.reminderSent && !req?.items?.length) return 'awaiting';
    if (req?.items?.length > 0 && req?.students && req?.recipes) return 'complete';
    if (req?.items?.length > 0) return 'partial';
    if (daysUntilDue < 0) return 'overdue';
    if (daysUntilDue <= 3) return 'due-soon';
    return 'pending';
  }

  const statusColors = {
    'confirmed': 'bg-green-100 text-green-800 border-green-300',
    'complete': 'bg-blue-100 text-blue-800 border-blue-300',
    'partial': 'bg-yellow-100 text-yellow-800 border-yellow-300',
    'awaiting': 'bg-purple-100 text-purple-800 border-purple-300',
    'overdue': 'bg-red-100 text-red-800 border-red-300',
    'due-soon': 'bg-orange-100 text-orange-800 border-orange-300',
    'pending': 'bg-gray-100 text-gray-800 border-gray-300'
  };

  const statusLabels = {
    'confirmed': 'Confirmed',
    'complete': 'Complete',
    'partial': 'Partial',
    'awaiting': 'Awaiting Response',
    'overdue': 'OVERDUE',
    'due-soon': 'Due Soon',
    'pending': 'Pending'
  };

  const toggleSelect = (classKey) => {
    setSelectedClasses(prev =>
      prev.includes(classKey) ? prev.filter(k => k !== classKey) : [...prev, classKey]
    );
  };

  const selectAll = (status) => {
    const matching = upcomingClasses.filter(c => c.status === status).map(c => c.key);
    setSelectedClasses(matching);
  };

  const markReminderSent = () => {
    const newConfirmations = { ...confirmations };
    selectedClasses.forEach(key => {
      newConfirmations[key] = { ...newConfirmations[key], reminderSent: true, reminderDate: new Date().toISOString() };
    });
    saveConfirmations(newConfirmations);
    setSelectedClasses([]);
  };

  const markConfirmed = () => {
    const newConfirmations = { ...confirmations };
    selectedClasses.forEach(key => {
      newConfirmations[key] = { ...newConfirmations[key], confirmed: true, confirmedDate: new Date().toISOString() };
    });
    saveConfirmations(newConfirmations);
    setSelectedClasses([]);
  };

  const selectedClassData = upcomingClasses.filter(c => selectedClasses.includes(c.key));

  const groupedByWeek = {};
  upcomingClasses.forEach(c => {
    if (!groupedByWeek[c.week]) groupedByWeek[c.week] = [];
    groupedByWeek[c.week].push(c);
  });
  Object.keys(groupedByWeek).forEach(week => {
    groupedByWeek[week].sort((a, b) => a.classDate - b.classDate);
  });

  // Process items - check DB rules first, then hardcoded fallback
  const processItemsWithRules = (items) => {
    const displayItems = [];
    const notices = [];
    
    if (!items || !Array.isArray(items)) {
      return { displayItems: [], notices: [] };
    }
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item || !item.name) continue;
      
      const name = item.name.toLowerCase();
      
      // Check DB rules first
      const dbRule = dbRules.find(r => 
        name === r.requested_item.toLowerCase() || 
        name.includes(r.requested_item.toLowerCase())
      );
      
      if (dbRule) {
        // Use DB rule
        if (dbRule.rule_type === 'substitute') {
          notices.push('<strong>SUBSTITUTION:</strong> ' + item.name + ' — replaced with ' + dbRule.substitute_item);
          displayItems.push({ name: dbRule.substitute_item, qty: item.quantity || 1, unit: item.unit || '' });
        } else if (dbRule.rule_type === 'make_in_house') {
          const subRecipe = dbSubRecipes.find(r => 
            r.name.toLowerCase() === (dbRule.recipe_name || '').toLowerCase()
          );
          notices.push('<strong>MADE IN-HOUSE:</strong> ' + item.name + ' — per ' + (dbRule.recipe_source || dbRule.recipe_name) + ', ingredients added');
          if (subRecipe && subRecipe.ingredients && subRecipe.ingredients.length > 0) {
            for (const ing of subRecipe.ingredients) {
              displayItems.push({ name: ing.ingredient_name, qty: ing.amount, unit: ing.unit });
            }
          } else {
            // No sub-recipe ingredients found, use hardcoded fallback for known items
            addHardcodedSubRecipe(name, item, displayItems);
          }
        } else if (dbRule.rule_type === 'use_fresh') {
          const isLime = name.includes('lime');
          const fruitName = isLime ? 'Limes, Fresh' : 'Lemons, Fresh';
          const yieldPer = isLime ? 0.75 : 1.0;
          const count = Math.ceil((parseFloat(item.quantity) || 4) / yieldPer);
          notices.push('<strong>USE FRESH:</strong> ' + item.name + ' — ' + count + ' ' + fruitName + ' added');
          displayItems.push({ name: fruitName, qty: count, unit: 'ea' });
        } else if (dbRule.rule_type === 'unavailable') {
          notices.push('<strong>UNAVAILABLE:</strong> ' + item.name + ' — not available');
        }
      } else {
        // No DB rule - check hardcoded rules
        if (name.includes('candied orange peel') || name.includes('candied citrus')) {
          notices.push('<strong>MADE IN-HOUSE:</strong> ' + item.name + ' — per OnBaking p.737, ingredients added');
          displayItems.push({ name: 'Oranges', qty: 5, unit: 'ea' });
          displayItems.push({ name: 'Water', qty: 1, unit: 'qt' });
          displayItems.push({ name: 'Salt', qty: 0.1, unit: 'oz' });
          displayItems.push({ name: 'Granulated Sugar', qty: 1, unit: 'lb' });
          displayItems.push({ name: 'Corn Syrup', qty: 7, unit: 'oz' });
        } else if (name.includes('mace') && !name.includes('nutmace')) {
          notices.push('<strong>SUBSTITUTION:</strong> ' + item.name + ' — replaced with Ground Nutmeg');
          displayItems.push({ name: 'Ground Nutmeg', qty: item.quantity || 1, unit: item.unit || 'oz' });
        } else if (name.includes('lemon juice') && !name.includes('fresh')) {
          const count = Math.ceil((parseFloat(item.quantity) || 4) / 1);
          notices.push('<strong>USE FRESH:</strong> ' + item.name + ' — ' + count + ' Lemons added');
          displayItems.push({ name: 'Lemons, Fresh', qty: count, unit: 'ea' });
        } else if (name.includes('lime juice') && !name.includes('fresh')) {
          const count = Math.ceil((parseFloat(item.quantity) || 3) / 0.75);
          notices.push('<strong>USE FRESH:</strong> ' + item.name + ' — ' + count + ' Limes added');
          displayItems.push({ name: 'Limes, Fresh', qty: count, unit: 'ea' });
        } else if (name.includes('pie dough')) {
          notices.push('<strong>MADE IN-HOUSE:</strong> ' + item.name + ' — per 3-2-1 method, ingredients added');
          displayItems.push({ name: 'All-Purpose Flour', qty: 1, unit: 'lb' });
          displayItems.push({ name: 'Unsalted Butter', qty: 10.67, unit: 'oz' });
          displayItems.push({ name: 'Water', qty: 5.33, unit: 'oz' });
          displayItems.push({ name: 'Salt', qty: 0.25, unit: 'oz' });
        } else if (name.includes('poured fondant') || name === 'fondant') {
          notices.push('<strong>MADE IN-HOUSE:</strong> ' + item.name + ' — per OnCooking p.245, ingredients added');
          displayItems.push({ name: 'Granulated Sugar', qty: 2, unit: 'lb' });
          displayItems.push({ name: 'Water', qty: 9, unit: 'fl oz' });
          displayItems.push({ name: 'Cream of Tartar', qty: 0.04, unit: 'oz' });
          displayItems.push({ name: 'Corn Syrup', qty: 4, unit: 'oz' });
        } else if (name.includes('clarified butter')) {
          notices.push('<strong>MADE IN-HOUSE:</strong> ' + item.name + ' — ingredients added');
          displayItems.push({ name: 'Unsalted Butter', qty: (parseFloat(item.quantity) || 1) * 1.25, unit: 'lb' });
        } else {
          displayItems.push({ name: item.name, qty: item.quantity || '', unit: item.unit || '' });
        }
      }
    }
    
    return { displayItems, notices };
  };
  
  // Helper for hardcoded sub-recipe ingredients when DB doesn't have them
  const addHardcodedSubRecipe = (name, item, displayItems) => {
    if (name.includes('candied orange') || name.includes('candied citrus')) {
      displayItems.push({ name: 'Oranges', qty: 5, unit: 'ea' });
      displayItems.push({ name: 'Water', qty: 1, unit: 'qt' });
      displayItems.push({ name: 'Salt', qty: 0.1, unit: 'oz' });
      displayItems.push({ name: 'Granulated Sugar', qty: 1, unit: 'lb' });
      displayItems.push({ name: 'Corn Syrup', qty: 7, unit: 'oz' });
    } else if (name.includes('pie dough')) {
      displayItems.push({ name: 'All-Purpose Flour', qty: 1, unit: 'lb' });
      displayItems.push({ name: 'Unsalted Butter', qty: 10.67, unit: 'oz' });
      displayItems.push({ name: 'Water', qty: 5.33, unit: 'oz' });
      displayItems.push({ name: 'Salt', qty: 0.25, unit: 'oz' });
    } else if (name.includes('fondant')) {
      displayItems.push({ name: 'Granulated Sugar', qty: 2, unit: 'lb' });
      displayItems.push({ name: 'Water', qty: 9, unit: 'fl oz' });
      displayItems.push({ name: 'Cream of Tartar', qty: 0.04, unit: 'oz' });
      displayItems.push({ name: 'Corn Syrup', qty: 4, unit: 'oz' });
    } else if (name.includes('clarified butter')) {
      displayItems.push({ name: 'Unsalted Butter', qty: (parseFloat(item.quantity) || 1) * 1.25, unit: 'lb' });
    }
  };

  const sendOrderConfirmation = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Popup blocked!');
      return;
    }
    
    const byInstructor = {};
    for (let i = 0; i < selectedClassData.length; i++) {
      const c = selectedClassData[i];
      if (!byInstructor[c.instructor]) byInstructor[c.instructor] = [];
      byInstructor[c.instructor].push(c);
    }

    let html = '<!DOCTYPE html><html><head><title>Order Confirmation</title>';
    html += '<style>';
    html += 'body { font-family: Arial, sans-serif; font-size: 11pt; max-width: 650px; margin: 0 auto; padding: 20px; }';
    html += '.header { border-bottom: 2px solid #059669; padding-bottom: 10px; margin-bottom: 15px; }';
    html += '.header h1 { color: #059669; margin: 0; }';
    html += '.class-section { border: 1px solid #059669; padding: 12px; margin: 12px 0; background: #f0fdf4; }';
    html += '.class-section h2 { color: #059669; margin: 0 0 8px 0; font-size: 14pt; }';
    html += '.item-list { margin: 0; padding-left: 20px; }';
    html += '.item-list li { margin: 3px 0; }';
    html += '.notice { background: #dbeafe; border: 1px solid #3b82f6; padding: 8px; margin: 8px 0; border-radius: 4px; }';
    html += '.footer { margin-top: 15px; padding-top: 10px; border-top: 1px solid #ccc; font-size: 9pt; color: #666; }';
    html += '.btn { padding: 8px 16px; margin-right: 10px; cursor: pointer; border: none; border-radius: 4px; }';
    html += '.btn-copy { background: #059669; color: white; }';
    html += '.btn-print { background: #2563eb; color: white; }';
    html += '@media print { .actions { display: none; } }';
    html += '</style></head><body>';
    html += '<div class="actions" style="margin-bottom:15px;">';
    html += '<button class="btn btn-copy" onclick="copyContent()">Copy</button>';
    html += '<button class="btn btn-print" onclick="window.print()">Print</button>';
    html += '</div>';
    html += '<script>function copyContent() { document.querySelector(\".actions\").style.display = \"none\"; var range = document.createRange(); range.selectNodeContents(document.body); window.getSelection().removeAllRanges(); window.getSelection().addRange(range); document.execCommand(\"copy\"); window.getSelection().removeAllRanges(); document.querySelector(\".actions\").style.display = \"block\"; }</script>';

    const instructors = Object.keys(byInstructor);
    for (let i = 0; i < instructors.length; i++) {
      const instructor = instructors[i];
      const classes = byInstructor[instructor];
      classes.sort((a, b) => a.classDate - b.classDate);
      
      html += '<div class="header">';
      html += '<h1>Order Confirmation</h1>';
      html += '<p>Pima Community College • Culinary Arts & Baking and Pastry Arts</p>';
      html += '</div>';
      html += '<p><strong>To:</strong> Chef ' + instructor + '<br>';
      html += '<strong>From:</strong> Tim O\'Donnell, Program Manager<br>';
      html += '<strong>Date:</strong> ' + new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) + '</p>';
      html += '<p>This confirms the ingredients I am ordering for your upcoming class(es).</p>';
      html += '<p><strong>Order Deadline:</strong> Orders placed Monday for Wed/Thu delivery.</p>';

      for (let j = 0; j < classes.length; j++) {
        const c = classes[j];
        
        let items = [];
        try {
          const raw = c.requisition ? c.requisition.items : null;
          if (typeof raw === 'string' && raw.length > 0) {
            items = JSON.parse(raw);
          } else if (Array.isArray(raw)) {
            items = raw;
          }
        } catch(e) {
          items = [];
        }
        
        const { displayItems, notices } = processItemsWithRules(items);
        
        html += '<div class="class-section">';
        html += '<h2>' + c.course + ' - ' + c.courseName + '</h2>';
        html += '<p>' + c.classDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
        html += ' | ' + (c.requisition ? c.requisition.students || '?' : '?') + ' students<br>';
        html += 'Recipes: ' + (c.requisition ? c.requisition.recipes || 'No recipes listed' : 'No recipes listed') + '</p>';
        
        html += '<ul class="item-list">';
        if (displayItems.length > 0) {
          for (let k = 0; k < displayItems.length; k++) {
            const item = displayItems[k];
            html += '<li>' + item.name + ' - ' + item.qty + ' ' + item.unit + '</li>';
          }
        } else {
          html += '<li>No items listed</li>';
        }
        html += '</ul>';
        
        if (notices.length > 0) {
          html += '<div class="notice">';
          html += '<strong>Notes:</strong><br>';
          html += notices.join('<br>');
          html += '</div>';
        }
        
        html += '</div>';
      }

      html += '<div class="footer">';
      html += 'Questions? Tim O\'Donnell • todonnell@pima.edu';
      html += '</div>';
    }

    html += '</body></html>';
    
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const printForms = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Popup blocked!');
      return;
    }
    
    const byInstructor = {};
    selectedClassData.forEach(c => {
      if (!byInstructor[c.instructor]) byInstructor[c.instructor] = [];
      byInstructor[c.instructor].push(c);
    });

    let html = '<!DOCTYPE html><html><head><title>Requisition Forms</title>';
    html += '<style>@page { margin: 0.5in; } body { font-family: Arial; font-size: 11pt; }';
    html += '.form-section { border: 2px solid #1e40af; padding: 15px; margin: 20px 0; background: #f8fafc; }';
    html += '.form-section h2 { color: #1e40af; margin: 0 0 5px 0; border-bottom: 2px solid #1e40af; padding-bottom: 8px; }';
    html += '.form-field { margin: 10px 0; } .form-field label { display: block; font-weight: bold; margin-bottom: 3px; }';
    html += '.fill-line { border-bottom: 1px solid #333; height: 22px; }';
    html += '.fill-box { border: 1px solid #333; min-height: 45px; }';
    html += '.checkbox { display: inline-block; width: 14px; height: 14px; border: 2px solid #333; margin-right: 8px; }';
    html += '@media print { .actions { display: none; } }</style></head><body>';
    html += '<div class="actions" style="margin-bottom:15px;"><button onclick="window.print()">Print</button></div>';

    Object.entries(byInstructor).forEach(([instructor, classes]) => {
      classes.forEach(c => {
        html += '<div class="form-section">';
        html += '<h2>' + c.course + ' ' + c.courseName + ' — Module ' + c.week + '</h2>';
        html += '<p>Class: ' + c.classDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) + '</p>';
        html += '<div class="form-field"><label>1. Number of Students:</label><div class="fill-line"></div></div>';
        html += '<div class="form-field"><label>2. Recipes (Name + Page #):</label><div class="fill-box"></div></div>';
        html += '<div class="form-field"><label>3. Ingredient List:</label>';
        if (c.hasIngredients) {
          html += '<div><span class="checkbox"></span> APPROVED as submitted</div>';
          html += '<div><span class="checkbox"></span> CHANGES NEEDED:</div>';
        }
        html += '<div class="fill-box"></div></div>';
        html += '</div>';
      });
    });

    html += '</body></html>';
    
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  };

  if (loading) {
    return <div className="p-6 max-w-7xl mx-auto"><div className="text-center py-12">Loading...</div></div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Confirmation Tracker</h1>
            <p className="text-gray-500">Track requisition status and send reminders</p>
          </div>
          <div className="text-right text-sm text-gray-500">
            {today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
          {Object.entries(statusLabels).map(([status, label]) => {
            const count = upcomingClasses.filter(c => c.status === status).length;
            return (
              <button
                key={status}
                onClick={() => selectAll(status)}
                className={`p-3 rounded-lg border-2 text-center ${statusColors[status]} hover:opacity-80`}
              >
                <div className="text-2xl font-bold">{count}</div>
                <div className="text-xs">{label}</div>
              </button>
            );
          })}
        </div>

        {selectedClasses.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex flex-wrap gap-3 items-center">
            <span className="font-medium">{selectedClasses.length} selected</span>
            <button onClick={() => setShowPrintModal(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Request Info
            </button>
            <button onClick={sendOrderConfirmation} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
              Send Order Confirmation
            </button>
            <button onClick={markReminderSent} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
              Mark Reminder Sent
            </button>
            <button onClick={markConfirmed} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
              Mark Confirmed
            </button>
            <button onClick={() => setSelectedClasses([])} className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600">
              Clear
            </button>
          </div>
        )}

        {Object.entries(groupedByWeek).sort((a, b) => a[0] - b[0]).map(([week, classes]) => (
          <div key={week} className="mb-6">
            <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-4 py-2 rounded-lg font-bold mb-3 flex justify-between items-center">
              <span>Module {week}: {getModuleDateRange(parseInt(week))}</span>
              <span className="text-sm font-normal opacity-90">
                {classes.filter(c => c.status === 'overdue').length > 0 && (
                  <span className="bg-red-500 px-2 py-1 rounded mr-2">
                    {classes.filter(c => c.status === 'overdue').length} overdue
                  </span>
                )}
                {classes.length} classes
              </span>
            </div>
            
            <div className="space-y-2">
              {classes.map(c => (
                <div
                  key={c.key}
                  className={`border rounded-lg p-4 flex items-center gap-4 ${
                    selectedClasses.includes(c.key) ? 'ring-2 ring-blue-500 bg-blue-50' : 'bg-white'
                  } ${c.daysUntilClass < 0 ? 'opacity-50 bg-gray-100' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={selectedClasses.includes(c.key)}
                    onChange={() => toggleSelect(c.key)}
                    className="w-5 h-5"
                  />
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-lg">{c.course}</span>
                      <span className="text-gray-600">{c.courseName}</span>
                      <span className="text-blue-600 font-medium">{c.instructor}</span>
                    </div>
                    <div className="text-sm text-gray-500">
                      Class: {formatDate(c.classDate)}
                      {c.daysUntilClass >= 0 && ` (${c.daysUntilClass} days)`}
                      {' | '}
                      Order Due: {formatDate(c.dueDate)}
                      {c.daysUntilDue < 0 ? ` (${Math.abs(c.daysUntilDue)} days overdue)` : c.daysUntilDue === 0 ? ' (TODAY)' : ` (${c.daysUntilDue} days)`}
                    </div>
                  </div>

                  <div className="flex gap-2 items-center">
                    <span className={`px-2 py-1 rounded text-xs ${c.hasIngredients ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {c.hasIngredients ? 'Yes' : 'No'} Items
                    </span>
                    <span className={`px-2 py-1 rounded text-xs ${c.hasStudentCount ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {c.hasStudentCount ? 'Yes' : 'No'} Students
                    </span>
                    <span className={`px-2 py-1 rounded text-xs ${c.hasRecipes ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {c.hasRecipes ? 'Yes' : 'No'} Recipes
                    </span>
                  </div>

                  <div className={`px-3 py-1 rounded-lg border ${statusColors[c.status]} font-medium text-sm`}>
                    {statusLabels[c.status]}
                  </div>

                  {c.confirmation?.reminderSent && (
                    <span className="text-xs text-purple-600">Sent</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {showPrintModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-lg w-full mx-4">
              <h2 className="text-xl font-bold mb-4">Generate Forms</h2>
              <p className="text-gray-600 mb-4">Selected: {selectedClassData.length} classes</p>
              <div className="flex gap-3 justify-end">
                <button onClick={() => setShowPrintModal(false)} className="px-4 py-2 bg-gray-200 rounded-lg">Cancel</button>
                <button onClick={() => { printForms(); setShowPrintModal(false); }} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Print</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
