import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

// Icons
const BackIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

const PrintIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

// Category colors — expanded for catering items
const categoryColors = {
  'Produce': { bg: 'bg-green-100', border: 'border-green-300', text: 'text-green-800', header: 'bg-green-600' },
  'Dairy': { bg: 'bg-yellow-100', border: 'border-yellow-300', text: 'text-yellow-800', header: 'bg-yellow-600' },
  'Dairy & Eggs': { bg: 'bg-yellow-100', border: 'border-yellow-300', text: 'text-yellow-800', header: 'bg-yellow-600' },
  'Meat & Seafood': { bg: 'bg-red-100', border: 'border-red-300', text: 'text-red-800', header: 'bg-red-600' },
  'Frozen': { bg: 'bg-blue-100', border: 'border-blue-300', text: 'text-blue-800', header: 'bg-blue-600' },
  'Pantry': { bg: 'bg-amber-100', border: 'border-amber-300', text: 'text-amber-800', header: 'bg-amber-600' },
  'Bakery': { bg: 'bg-orange-100', border: 'border-orange-300', text: 'text-orange-800', header: 'bg-orange-600' },
  'Beverages': { bg: 'bg-purple-100', border: 'border-purple-300', text: 'text-purple-800', header: 'bg-purple-600' },
  'Charcuterie': { bg: 'bg-rose-100', border: 'border-rose-300', text: 'text-rose-800', header: 'bg-rose-700' },
  'Cheese': { bg: 'bg-amber-100', border: 'border-amber-300', text: 'text-amber-800', header: 'bg-amber-700' },
  'Accompaniment': { bg: 'bg-emerald-100', border: 'border-emerald-300', text: 'text-emerald-800', header: 'bg-emerald-700' },
  'Garnish': { bg: 'bg-lime-100', border: 'border-lime-300', text: 'text-lime-800', header: 'bg-lime-700' },
  'Protein': { bg: 'bg-red-100', border: 'border-red-300', text: 'text-red-800', header: 'bg-red-700' },
  'Other': { bg: 'bg-gray-100', border: 'border-gray-300', text: 'text-gray-800', header: 'bg-gray-600' },
};

const categoryOrder = [
  'Charcuterie', 'Cheese', 'Protein', 'Meat & Seafood',
  'Produce', 'Dairy', 'Dairy & Eggs', 'Frozen',
  'Accompaniment', 'Pantry', 'Bakery', 'Beverages', 'Garnish', 'Other'
];

// Default prep tasks by day
const defaultPrepTasks = {
  'day-2': [
    { task: 'Pull all dry goods from storage, verify quantities', time: '8:00 AM' },
    { task: 'Check produce delivery, inspect quality', time: '8:30 AM' },
    { task: 'Begin sauce prep (can hold 2+ days)', time: '9:00 AM' },
    { task: 'Prep vinaigrettes and dressings', time: '10:00 AM' },
    { task: 'Wash and prep salad greens', time: '11:00 AM' },
    { task: 'Prep vegetables for cooking', time: '12:00 PM' },
    { task: 'Label & date all prepped items', time: '2:00 PM' },
  ],
  'day-1': [
    { task: 'Final inventory check', time: '9:00 AM' },
    { task: 'Prep remaining items', time: '10:00 AM' },
    { task: 'Test equipment (coffee urns, chafers)', time: '11:00 AM' },
    { task: 'Set up dry storage area', time: '12:00 PM' },
    { task: 'Confirm event space access', time: '1:00 PM' },
  ],
  'day-0': [
    { task: 'Set up buffet tables, linens, chafers', time: '9:00 AM' },
    { task: 'Turn on coffee urn to warm', time: '9:00 AM' },
    { task: 'Cook pasta, proteins as needed', time: '9:30 AM' },
    { task: 'Finish hot dishes', time: '10:30 AM' },
    { task: 'Set up beverage station', time: '11:00 AM' },
    { task: 'Final taste, adjust seasoning', time: '11:30 AM' },
    { task: 'Load chafers, light sternos', time: '11:45 AM' },
    { task: 'SERVICE', time: '12:00 PM' },
    { task: 'Breakdown & cleanup', time: '1:00 PM' },
  ],
};

export default function CateringEventDetail() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  
  const [event, setEvent] = useState(null);
  const [recipes, setRecipes] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [prepTasks, setPrepTasks] = useState({});
  const [completedTasks, setCompletedTasks] = useState({});

  useEffect(() => {
    loadEvent();
  }, [eventId]);

  const loadEvent = async () => {
    setLoading(true);
    try {
      const { data: eventData, error: eventError } = await supabase
        .from('catering_events')
        .select('*')
        .eq('id', eventId)
        .single();
      
      if (eventError) throw eventError;
      setEvent(eventData);

      if (eventData.recipe_ids && eventData.recipe_ids.length > 0) {
        const { data: recipeData } = await supabase
          .from('recipes')
          .select('*')
          .in('id', eventData.recipe_ids);
        setRecipes(recipeData || []);
      }

      const { data: ingData } = await supabase
        .from('ingredients')
        .select('name, category, vendor, pack_size, case_price, unit_price, unit');
      setIngredients(ingData || []);

      if (eventData.prep_tasks) {
        setPrepTasks(eventData.prep_tasks);
        const completed = {};
        Object.entries(eventData.prep_tasks).forEach(([day, tasks]) => {
          tasks.forEach((task, idx) => {
            if (task.done) completed[`${day}-${idx}`] = true;
          });
        });
        setCompletedTasks(completed);
      } else {
        setPrepTasks(defaultPrepTasks);
      }

    } catch (error) {
      console.error('Error loading event:', error);
    }
    setLoading(false);
  };

  // Build ingredient lookup map
  const ingMap = useMemo(() => {
    const map = {};
    ingredients.forEach(ing => {
      map[ing.name?.toLowerCase()] = ing;
    });
    return map;
  }, [ingredients]);

  // Parse event items from JSONB
  const eventItems = useMemo(() => {
    if (!event?.items) return [];
    try {
      return typeof event.items === 'string' ? JSON.parse(event.items) : event.items;
    } catch {
      return [];
    }
  }, [event]);

  // Calculate direct items cost (from items JSONB with unit_cost)
  const directItemsCost = useMemo(() => {
    return eventItems.reduce((sum, item) => {
      const qty = parseFloat(item.quantity) || 0;
      const cost = parseFloat(item.unit_cost) || 0;
      return sum + (qty * cost);
    }, 0);
  }, [eventItems]);

  // Group direct items by category for shopping list
  const directItemsByCategory = useMemo(() => {
    const grouped = {};
    eventItems.forEach(item => {
      const category = item.category || 'Other';
      if (!grouped[category]) grouped[category] = [];
      grouped[category].push(item);
    });
    return grouped;
  }, [eventItems]);

  // Helper to parse pack size
  const parsePackSize = (packSize) => {
    if (!packSize) return { qty: 1, unit: 'each' };
    const str = packSize.toLowerCase().trim();
    const slashMatch = str.match(/(\d+)\s*\/\s*(\d+\.?\d*)\s*(lb|oz|ct|each|gal|qt|pt)?/);
    if (slashMatch) {
      return { qty: parseFloat(slashMatch[1]) * parseFloat(slashMatch[2]), unit: slashMatch[3] || 'each' };
    }
    const simpleMatch = str.match(/(\d+\.?\d*)\s*(lb|oz|ct|each|gal|qt|pt|bunch)?/);
    if (simpleMatch) return { qty: parseFloat(simpleMatch[1]), unit: simpleMatch[2] || 'each' };
    return { qty: 1, unit: 'each' };
  };

  const convertToPackUnits = (qty, recipeUnit, packUnit) => {
    const ru = (recipeUnit || 'each').toLowerCase();
    const pu = (packUnit || 'each').toLowerCase();
    if (ru === pu) return qty;
    if (ru === 'oz' && pu === 'lb') return qty / 16;
    if (ru === 'lb' && pu === 'oz') return qty * 16;
    if (ru === 'qt' && pu === 'gal') return qty / 4;
    if (ru === 'gal' && pu === 'qt') return qty * 4;
    if (ru === 'pt' && pu === 'qt') return qty / 2;
    if (ru === 'qt' && pu === 'pt') return qty * 2;
    if (ru === 'oz' && pu === 'gal') return qty / 128;
    if (ru === 'gal' && pu === 'oz') return qty * 128;
    if (ru === 'cup' && pu === 'gal') return qty / 16;
    if (ru === 'tbsp' && pu === 'oz') return qty / 2;
    if (ru === 'tbsp' && pu === 'lb') return qty / 32;
    if (pu === 'ct' || pu === 'each') return qty;
    return qty;
  };

  // Consolidate shopping list from recipes (existing behavior)
  const recipeShoppingList = useMemo(() => {
    const consolidated = {};
    recipes.forEach(recipe => {
      const recipeIngs = typeof recipe.ingredients === 'string'
        ? JSON.parse(recipe.ingredients)
        : recipe.ingredients || [];
      recipeIngs.forEach(item => {
        const key = item.name?.toLowerCase();
        const ingInfo = ingMap[key] || {};
        const category = ingInfo.category || 'Other';
        if (!consolidated[category]) consolidated[category] = {};
        if (!consolidated[category][item.name]) {
          consolidated[category][item.name] = {
            name: item.name, quantity: 0, unit: item.unit,
            vendor: ingInfo.vendor || 'Unassigned',
            packSize: ingInfo.pack_size || '',
            casePrice: ingInfo.case_price || 0,
            unitPrice: ingInfo.unit_price || 0,
            sources: []
          };
        }
        consolidated[category][item.name].quantity += parseFloat(item.quantity) || 0;
        consolidated[category][item.name].sources.push(recipe.name);
      });
    });
    return consolidated;
  }, [recipes, ingMap]);

  // Calculate recipe costs
  const recipeCosts = useMemo(() => {
    const costs = {};
    recipes.forEach(recipe => {
      let total = 0;
      const recipeIngs = typeof recipe.ingredients === 'string'
        ? JSON.parse(recipe.ingredients)
        : recipe.ingredients || [];
      recipeIngs.forEach(item => {
        const ingInfo = ingMap[item.name?.toLowerCase()] || {};
        const qty = parseFloat(item.quantity) || 0;
        const recipeUnit = item.unit || 'each';
        if (qty === 0) return;
        if (ingInfo.case_price && ingInfo.pack_size) {
          const pack = parsePackSize(ingInfo.pack_size);
          const costPerPackUnit = ingInfo.case_price / pack.qty;
          const convertedQty = convertToPackUnits(qty, recipeUnit, pack.unit);
          total += convertedQty * costPerPackUnit;
        } else if (ingInfo.unit_price) {
          total += qty * ingInfo.unit_price;
        } else if (ingInfo.case_price) {
          total += ingInfo.case_price * 0.25;
        }
      });
      costs[recipe.id] = total;
    });
    return costs;
  }, [recipes, ingMap]);

  const recipesFoodCost = useMemo(() => {
    return Object.values(recipeCosts).reduce((sum, cost) => sum + cost, 0);
  }, [recipeCosts]);

  // TOTAL food cost = recipes + direct items
  const totalFoodCost = recipesFoodCost + directItemsCost;

  // Check if we have direct items
  const hasDirectItems = eventItems.length > 0;
  const hasRecipes = recipes.length > 0;

  // Toggle task completion
  const toggleTask = async (day, index) => {
    const key = `${day}-${index}`;
    const newValue = !completedTasks[key];
    const updated = { ...completedTasks, [key]: newValue };
    setCompletedTasks(updated);
    const updatedPrepTasks = { ...prepTasks };
    if (updatedPrepTasks[day] && updatedPrepTasks[day][index]) {
      updatedPrepTasks[day][index] = { ...updatedPrepTasks[day][index], done: newValue };
    }
    await supabase.from('catering_events').update({ prep_tasks: updatedPrepTasks }).eq('id', eventId);
    setPrepTasks(updatedPrepTasks);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'TBD';
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  };

  const getPrepDayLabel = (dayKey) => {
    if (!event?.event_date) return dayKey;
    const eventDate = new Date(event.event_date + 'T12:00:00');
    if (dayKey === 'day-0') {
      return `${eventDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })} (Event Day)`;
    } else if (dayKey === 'day-1') {
      const d = new Date(eventDate); d.setDate(d.getDate() - 1);
      return `${d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })} (Day Before)`;
    } else if (dayKey === 'day-2') {
      const d = new Date(eventDate); d.setDate(d.getDate() - 2);
      return `${d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })} (2 Days Before)`;
    }
    return dayKey;
  };

  // Print prep plan
  const printPrepPlan = () => {
    const printWindow = window.open('', '_blank');
    
    // Build shopping list HTML from both sources
    let shoppingHTML = '';
    
    // Direct items (from items JSONB)
    if (hasDirectItems) {
      const cats = categoryOrder.filter(cat => directItemsByCategory[cat]);
      cats.forEach(cat => {
        const items = directItemsByCategory[cat];
        shoppingHTML += `<h3>${cat}</h3><table><thead><tr><th>Item</th><th>Qty</th><th>Unit</th><th>Notes</th><th>Est. Cost</th></tr></thead><tbody>`;
        items.sort((a, b) => a.name.localeCompare(b.name)).forEach(item => {
          const cost = (parseFloat(item.quantity) || 0) * (parseFloat(item.unit_cost) || 0);
          shoppingHTML += `<tr><td>${item.name}</td><td>${item.quantity}</td><td>${item.unit}</td><td>${item.notes || ''}</td><td>$${cost.toFixed(2)}</td></tr>`;
        });
        shoppingHTML += `</tbody></table>`;
      });
    }
    
    // Recipe-based items
    if (hasRecipes) {
      const cats = categoryOrder.filter(cat => recipeShoppingList[cat]);
      cats.forEach(cat => {
        shoppingHTML += `<h3>${cat} (from recipes)</h3><table><thead><tr><th>Item</th><th>Qty</th><th>Vendor</th><th>Pack</th></tr></thead><tbody>`;
        Object.values(recipeShoppingList[cat]).forEach(item => {
          shoppingHTML += `<tr><td>${item.name}</td><td>${item.quantity} ${item.unit}</td><td>${item.vendor}</td><td>${item.packSize}</td></tr>`;
        });
        shoppingHTML += `</tbody></table>`;
      });
    }

    printWindow.document.write(`
      <html>
      <head>
        <title>${event?.event_name} - Prep Plan</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
          h1 { color: #1e40af; border-bottom: 2px solid #1e40af; padding-bottom: 10px; }
          h2 { color: #374151; margin-top: 24px; }
          h3 { color: #555; font-size: 14px; background: #f0f0f0; padding: 6px 10px; margin: 12px 0 4px 0; }
          .event-info { background: #f3f4f6; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 5px; margin-bottom: 10px; }
          th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; font-size: 12px; }
          th { background: #f3f4f6; }
          .checkbox { width: 20px; text-align: center; }
          .cost-summary { background: #e8f5e9; padding: 12px; border-radius: 6px; margin: 15px 0; font-weight: bold; }
          @media print { button { display: none; } }
        </style>
      </head>
      <body>
        <h1>${event?.event_name}</h1>
        <div class="event-info">
          <p><strong>Date:</strong> ${formatDate(event?.event_date)}</p>
          <p><strong>Time:</strong> ${event?.event_time || 'TBD'}</p>
          <p><strong>Guests:</strong> ${event?.guest_count || 'TBD'}</p>
          <p><strong>Location:</strong> ${event?.location || 'TBD'}</p>
        </div>
        <div class="cost-summary">Estimated Food Cost: $${totalFoodCost.toFixed(2)}</div>
        
        ${['day-2', 'day-1', 'day-0'].map(day => `
          <h2>${getPrepDayLabel(day)}</h2>
          <table>
            <thead><tr><th>Time</th><th>Task</th><th class="checkbox">✓</th></tr></thead>
            <tbody>
              ${(prepTasks[day] || []).map(t => `
                <tr><td>${t.time}</td><td>${t.task}</td><td class="checkbox">☐</td></tr>
              `).join('')}
            </tbody>
          </table>
        `).join('')}
        
        <h2>Shopping List</h2>
        ${shoppingHTML}
        
        <button onclick="window.print()" style="margin-top:20px;padding:10px 20px">Print</button>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-gray-500">Loading event...</div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="p-6">
        <div className="text-red-600">Event not found</div>
        <button onClick={() => navigate('/catering')} className="mt-4 text-blue-600 hover:underline">
          ← Back to Catering
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/catering')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4"
        >
          <BackIcon /> Back to Catering
        </button>
        
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-blue-800">{event.event_name}</h1>
            <p className="text-gray-600 mt-1">
              {formatDate(event.event_date)} • {event.event_time || 'Time TBD'} • {event.guest_count || '?'} guests
            </p>
            <p className="text-gray-500">{event.location || 'Location TBD'}</p>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={printPrepPlan}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              <PrintIcon /> Print Prep Plan
            </button>
            <span className={`px-3 py-2 rounded-lg text-sm font-medium ${
              event.status === 'confirmed' ? 'bg-green-100 text-green-800' :
              event.status === 'inquiry' ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {event.status?.charAt(0).toUpperCase() + event.status?.slice(1)}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b">
        {['overview', 'recipes', 'shopping', 'pull', 'prep'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-medium rounded-t-lg transition-colors ${
              activeTab === tab
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tab === 'overview' && '📋 Overview'}
            {tab === 'recipes' && `🍽️ Recipes (${recipes.length})`}
            {tab === 'shopping' && `🛒 Shopping List${hasDirectItems ? ` (${eventItems.length})` : ''}`}
            {tab === 'pull' && '📦 Pull List'}
            {tab === 'prep' && '✅ Prep Tasks'}
          </button>
        ))}
      </div>

      {/* ============ Overview Tab ============ */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Event Details */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Event Details</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Client:</span>
                <span className="font-medium">{event.contact_name || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Department:</span>
                <span className="font-medium">{event.department || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Event Type:</span>
                <span className="font-medium">{event.event_type || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Service Style:</span>
                <span className="font-medium">{event.service_style || 'Buffet'}</span>
              </div>
              {event.foap && (
                <div className="flex justify-between">
                  <span className="text-gray-600">FOAP:</span>
                  <span className="font-medium font-mono text-sm">{event.foap}</span>
                </div>
              )}
            </div>
          </div>

          {/* Cost Summary — now includes direct items */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Cost Summary</h2>
            <div className="space-y-3">
              {hasDirectItems && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Direct Items ({eventItems.length}):</span>
                  <span className="font-medium">${directItemsCost.toFixed(2)}</span>
                </div>
              )}
              {hasRecipes && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Recipe Items:</span>
                  <span className="font-medium">${recipesFoodCost.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Food Cost (Est.):</span>
                <span className="font-bold text-lg">${totalFoodCost.toFixed(2)}</span>
              </div>
              {event.guest_count > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Cost per guest:</span>
                  <span className="text-gray-600">${(totalFoodCost / event.guest_count).toFixed(2)}</span>
                </div>
              )}
              <hr />
              <div className="flex justify-between">
                <span className="text-gray-600">Menu Price:</span>
                <span className="font-medium">${event.total_price?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="flex justify-between text-lg">
                <span className="text-gray-800 font-medium">Gross Margin:</span>
                <span className="font-bold text-green-600">
                  ${((event.total_price || 0) - totalFoodCost).toFixed(2)}
                  {event.total_price > 0 && (
                    <span className="text-sm text-gray-500 ml-2">
                      ({(((event.total_price - totalFoodCost) / event.total_price) * 100).toFixed(0)}%)
                    </span>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Menu / Items Summary */}
          <div className="bg-white rounded-lg shadow p-6 lg:col-span-2">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Menu</h2>
            
            {/* Direct items summary by category */}
            {hasDirectItems && (
              <div className="mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {categoryOrder.filter(cat => directItemsByCategory[cat]).map(cat => {
                    const items = directItemsByCategory[cat];
                    const colors = categoryColors[cat] || categoryColors['Other'];
                    const catCost = items.reduce((s, i) => s + (parseFloat(i.quantity) || 0) * (parseFloat(i.unit_cost) || 0), 0);
                    return (
                      <div key={cat} className={`rounded-lg border ${colors.border} p-4 ${colors.bg}`}>
                        <h3 className={`font-bold ${colors.text} mb-2`}>{cat}</h3>
                        <ul className="text-sm space-y-1">
                          {items.map((item, idx) => (
                            <li key={idx} className="text-gray-700">
                              {item.name} <span className="text-gray-500">({item.quantity} {item.unit})</span>
                            </li>
                          ))}
                        </ul>
                        <p className={`text-sm font-medium ${colors.text} mt-2 pt-2 border-t ${colors.border}`}>
                          Subtotal: ${catCost.toFixed(2)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Recipe-linked menu items */}
            {hasRecipes && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recipes.map(recipe => (
                  <div key={recipe.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <h3 className="font-semibold text-gray-800">{recipe.name}</h3>
                    <p className="text-sm text-gray-600">{recipe.portions} portions</p>
                    <p className="text-sm text-gray-500">{recipe.course}</p>
                    <p className="text-sm font-medium text-blue-600 mt-2">
                      Est. ${recipeCosts[recipe.id]?.toFixed(2) || '0.00'}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {!hasDirectItems && !hasRecipes && (
              <p className="text-gray-500">No recipes or items linked to this event.</p>
            )}

            {/* Event Notes */}
            {event?.notes && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg shadow p-6 mt-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">📝 Event Notes</h2>
                <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">{event.notes}</pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============ Recipes Tab ============ */}
      {activeTab === 'recipes' && (
        <div className="space-y-6">
          {recipes.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
              No recipes linked to this event.
              {hasDirectItems && (
                <p className="mt-2 text-sm">This event has {eventItems.length} direct items — see the Shopping List tab.</p>
              )}
            </div>
          ) : (
            recipes.map(recipe => {
              const recipeIngs = typeof recipe.ingredients === 'string'
                ? JSON.parse(recipe.ingredients)
                : recipe.ingredients || [];
              const procedure = recipe.procedure || [];
              
              return (
                <div key={recipe.id} className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="bg-blue-800 text-white px-6 py-4">
                    <h2 className="text-xl font-bold">{recipe.name}</h2>
                    <p className="text-blue-200">
                      {recipe.portions} portions • {recipe.course} • {recipe.source}
                    </p>
                  </div>
                  <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-bold text-gray-800 mb-3">Ingredients</h3>
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="text-left px-3 py-2">Item</th>
                            <th className="text-right px-3 py-2">Qty</th>
                            <th className="text-left px-3 py-2">Unit</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recipeIngs.map((ing, idx) => (
                            <tr key={idx} className="border-b">
                              <td className="px-3 py-2">{ing.name}</td>
                              <td className="px-3 py-2 text-right">{ing.quantity}</td>
                              <td className="px-3 py-2">{ing.unit}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <p className="text-sm text-blue-600 font-medium mt-3">
                        Est. Food Cost: ${recipeCosts[recipe.id]?.toFixed(2) || '0.00'}
                      </p>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800 mb-3">Procedure</h3>
                      <ol className="space-y-2 text-sm">
                        {procedure.map((step, idx) => (
                          <li key={idx} className="flex gap-2">
                            <span className="text-blue-600 font-medium">{idx + 1}.</span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ol>
                      {recipe.notes && (
                        <p className="mt-4 text-sm text-gray-600 bg-yellow-50 p-3 rounded">
                          <strong>Notes:</strong> {recipe.notes}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ============ Shopping List Tab ============ */}
      {activeTab === 'shopping' && (
        <div className="space-y-6">
          {/* Direct items from event.items JSONB */}
          {hasDirectItems && (
            <>
              {categoryOrder.filter(cat => directItemsByCategory[cat]).map(cat => {
                const colors = categoryColors[cat] || categoryColors['Other'];
                const items = directItemsByCategory[cat];
                const catTotal = items.reduce((s, i) => s + (parseFloat(i.quantity) || 0) * (parseFloat(i.unit_cost) || 0), 0);
                
                return (
                  <div key={cat} className={`rounded-lg border-2 ${colors.border} overflow-hidden`}>
                    <div className={`${colors.header} text-white px-4 py-3 flex justify-between items-center`}>
                      <div>
                        <h2 className="text-lg font-bold">{cat}</h2>
                        <p className="text-sm opacity-80">{items.length} items</p>
                      </div>
                      <span className="text-lg font-bold">${catTotal.toFixed(2)}</span>
                    </div>
                    
                    <div className="bg-white">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-50 border-b">
                            <th className="text-left px-4 py-2">Item</th>
                            <th className="text-right px-4 py-2">Qty</th>
                            <th className="text-left px-4 py-2">Unit</th>
                            <th className="text-left px-4 py-2">Source</th>
                            <th className="text-right px-4 py-2">Unit Cost</th>
                            <th className="text-right px-4 py-2">Line Total</th>
                            <th className="text-left px-4 py-2">Notes</th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.sort((a, b) => a.name.localeCompare(b.name)).map((item, idx) => {
                            const qty = parseFloat(item.quantity) || 0;
                            const unitCost = parseFloat(item.unit_cost) || 0;
                            const lineTotal = qty * unitCost;
                            const source = item.costco_item ? `Costco #${item.costco_item}` : (item.vendor || '');
                            return (
                              <tr key={idx} className="border-b hover:bg-gray-50">
                                <td className="px-4 py-2 font-medium">{item.name}</td>
                                <td className="px-4 py-2 text-right font-semibold">{item.quantity}</td>
                                <td className="px-4 py-2 text-gray-600">{item.unit}</td>
                                <td className="px-4 py-2 text-gray-500 text-xs">{source}</td>
                                <td className="px-4 py-2 text-right text-gray-600">
                                  {unitCost > 0 ? `$${unitCost.toFixed(2)}` : '-'}
                                </td>
                                <td className="px-4 py-2 text-right font-medium text-green-700">
                                  {lineTotal > 0 ? `$${lineTotal.toFixed(2)}` : '-'}
                                </td>
                                <td className="px-4 py-2 text-gray-500 text-xs max-w-xs truncate" title={item.notes}>
                                  {item.notes || ''}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}

              {/* Direct items total */}
              <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4 flex justify-between items-center">
                <div>
                  <span className="text-lg font-bold text-green-800">Estimated Total</span>
                  <span className="text-sm text-green-600 ml-3">({eventItems.length} items)</span>
                </div>
                <span className="text-2xl font-bold text-green-700">${directItemsCost.toFixed(2)}</span>
              </div>

              {event.guest_count > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center text-sm text-blue-700">
                  <strong>${(directItemsCost / event.guest_count).toFixed(2)}</strong> per guest
                  ({event.guest_count} guests)
                </div>
              )}
            </>
          )}

          {/* Recipe-based shopping list (existing behavior) */}
          {hasRecipes && (
            <>
              {hasDirectItems && (
                <div className="border-t-2 border-gray-300 pt-6 mt-6">
                  <h2 className="text-xl font-bold text-gray-700 mb-4">📋 From Linked Recipes</h2>
                </div>
              )}
              {categoryOrder.filter(cat => recipeShoppingList[cat]).map(cat => {
                const colors = categoryColors[cat] || categoryColors['Other'];
                const items = Object.values(recipeShoppingList[cat]);
                
                return (
                  <div key={`recipe-${cat}`} className={`rounded-lg border-2 ${colors.border} overflow-hidden`}>
                    <div className={`${colors.header} text-white px-4 py-3`}>
                      <h2 className="text-lg font-bold">{cat}</h2>
                      <p className="text-sm opacity-80">{items.length} items</p>
                    </div>
                    <div className="bg-white">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-50 border-b">
                            <th className="text-left px-4 py-2">Item</th>
                            <th className="text-right px-4 py-2">Qty</th>
                            <th className="text-left px-4 py-2">Unit</th>
                            <th className="text-left px-4 py-2">Vendor</th>
                            <th className="text-left px-4 py-2">Pack Size</th>
                            <th className="text-right px-4 py-2">Est. Cost</th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.sort((a, b) => a.name.localeCompare(b.name)).map((item, idx) => (
                            <tr key={idx} className="border-b hover:bg-gray-50">
                              <td className="px-4 py-2 font-medium">{item.name}</td>
                              <td className="px-4 py-2 text-right">{item.quantity}</td>
                              <td className="px-4 py-2">{item.unit}</td>
                              <td className="px-4 py-2 text-gray-600">{item.vendor}</td>
                              <td className="px-4 py-2 text-gray-600">{item.packSize || '-'}</td>
                              <td className="px-4 py-2 text-right text-gray-600">
                                {(() => {
                                  if (!item.casePrice || !item.packSize) return '-';
                                  const pack = parsePackSize(item.packSize);
                                  const costPerPackUnit = item.casePrice / pack.qty;
                                  const convertedQty = convertToPackUnits(item.quantity, item.unit, pack.unit);
                                  return `$${(convertedQty * costPerPackUnit).toFixed(2)}`;
                                })()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {!hasDirectItems && !hasRecipes && (
            <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
              No items or recipes linked to this event yet.
            </div>
          )}
        </div>
      )}

      {/* ============ Pull List Tab ============ */}
      {activeTab === 'pull' && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Pull List - {event?.event_name}</h2>
            <button
              onClick={() => {
                const printContent = document.getElementById('pull-list-print')?.innerHTML;
                if (!printContent) return;
                const win = window.open('', '_blank');
                win.document.write(`
                  <html>
                    <head>
                      <title>Pull List - ${event?.event_name}</title>
                      <style>
                        body { font-family: Arial, sans-serif; padding: 20px; }
                        h1 { font-size: 18px; margin-bottom: 5px; }
                        h2 { font-size: 14px; color: #666; margin-bottom: 20px; }
                        h3 { font-size: 14px; background: #f0f0f0; padding: 8px; margin: 15px 0 5px 0; }
                        table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
                        th, td { border: 1px solid #ddd; padding: 6px 10px; text-align: left; font-size: 12px; }
                        th { background: #f5f5f5; font-weight: bold; }
                        .qty { text-align: right; font-weight: bold; }
                        @media print { body { padding: 0; } }
                      </style>
                    </head>
                    <body>${printContent}</body>
                  </html>
                `);
                win.document.close();
                win.print();
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              🖨️ Print Pull List
            </button>
          </div>

          <div id="pull-list-print">
            {/* Direct items pull list — grouped by storage location */}
            {hasDirectItems && (() => {
              // Map categories to storage locations
              const storageMap = {
                'Charcuterie': 'Walk-in Cooler',
                'Cheese': 'Walk-in Cooler',
                'Protein': 'Freezer',
                'Produce': 'Walk-in Cooler',
                'Dairy': 'Walk-in Cooler',
                'Dairy & Eggs': 'Walk-in Cooler',
                'Meat & Seafood': 'Meat Cooler',
                'Frozen': 'Freezer',
                'Accompaniment': 'Dry Storage',
                'Pantry': 'Dry Storage',
                'Bakery': 'Dry Storage',
                'Beverages': 'Dry Storage',
                'Garnish': 'Walk-in Cooler',
                'Other': 'Dry Storage',
              };
              
              const byStorage = {};
              eventItems.forEach(item => {
                const loc = storageMap[item.category] || 'Dry Storage';
                if (!byStorage[loc]) byStorage[loc] = [];
                byStorage[loc].push(item);
              });

              const storageConfig = {
                'Walk-in Cooler': { icon: '🧊', headerBg: 'bg-blue-100', headerText: 'text-blue-800' },
                'Meat Cooler': { icon: '🥩', headerBg: 'bg-red-100', headerText: 'text-red-800' },
                'Freezer': { icon: '❄️', headerBg: 'bg-purple-100', headerText: 'text-purple-800' },
                'Dry Storage': { icon: '📦', headerBg: 'bg-amber-100', headerText: 'text-amber-800' },
              };
              
              const storageOrder = ['Walk-in Cooler', 'Meat Cooler', 'Freezer', 'Dry Storage'];

              return storageOrder.filter(loc => byStorage[loc]?.length > 0).map(loc => {
                const config = storageConfig[loc];
                const items = byStorage[loc].sort((a, b) => a.name.localeCompare(b.name));
                return (
                  <div key={loc} className="mb-6">
                    <h3 className={`font-bold text-lg ${config.headerBg} ${config.headerText} px-4 py-2 rounded-t`}>
                      {config.icon} {loc}
                    </h3>
                    <table className="w-full border">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="w-10 px-3 py-2 border">✓</th>
                          <th className="text-left px-3 py-2 border">Item</th>
                          <th className="text-left px-3 py-2 border w-24">Category</th>
                          <th className="text-right px-3 py-2 border w-20">Qty</th>
                          <th className="text-left px-3 py-2 border w-20">Unit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-3 py-2 border text-center">
                              <div className="w-5 h-5 border-2 border-gray-400 rounded"></div>
                            </td>
                            <td className="px-3 py-2 border font-medium">{item.name}</td>
                            <td className="px-3 py-2 border text-xs text-gray-500">{item.category}</td>
                            <td className="px-3 py-2 border text-right font-bold">{item.quantity}</td>
                            <td className="px-3 py-2 border">{item.unit}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              });
            })()}

            {/* Recipe-based pull list (existing) */}
            {hasRecipes && !hasDirectItems && (
              <>
                <div className="mb-6">
                  <h3 className="font-bold text-lg bg-blue-100 text-blue-800 px-4 py-2 rounded-t">🧊 Walk-in Cooler</h3>
                  <table className="w-full border">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="w-10 px-3 py-2 border">✓</th>
                        <th className="text-left px-3 py-2 border">Item</th>
                        <th className="text-right px-3 py-2 border w-20">Qty</th>
                        <th className="text-left px-3 py-2 border w-20">Unit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(recipeShoppingList)
                        .filter(([cat]) => ['Produce', 'Dairy'].includes(cat))
                        .flatMap(([, items]) => Object.values(items))
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .map((item, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-3 py-2 border text-center">
                              <div className="w-5 h-5 border-2 border-gray-400 rounded"></div>
                            </td>
                            <td className="px-3 py-2 border font-medium">{item.name}</td>
                            <td className="px-3 py-2 border text-right font-bold">{item.quantity}</td>
                            <td className="px-3 py-2 border">{item.unit}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>

                {recipeShoppingList['Meat & Seafood'] && Object.keys(recipeShoppingList['Meat & Seafood']).length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-bold text-lg bg-red-100 text-red-800 px-4 py-2 rounded-t">🥩 Meat Cooler</h3>
                    <table className="w-full border">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="w-10 px-3 py-2 border">✓</th>
                          <th className="text-left px-3 py-2 border">Item</th>
                          <th className="text-right px-3 py-2 border w-20">Qty</th>
                          <th className="text-left px-3 py-2 border w-20">Unit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.values(recipeShoppingList['Meat & Seafood'])
                          .sort((a, b) => a.name.localeCompare(b.name))
                          .map((item, idx) => (
                            <tr key={idx} className="hover:bg-gray-50">
                              <td className="px-3 py-2 border text-center">
                                <div className="w-5 h-5 border-2 border-gray-400 rounded"></div>
                              </td>
                              <td className="px-3 py-2 border font-medium">{item.name}</td>
                              <td className="px-3 py-2 border text-right font-bold">{item.quantity}</td>
                              <td className="px-3 py-2 border">{item.unit}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="font-bold text-lg bg-amber-100 text-amber-800 px-4 py-2 rounded-t">📦 Dry Storage</h3>
                  <table className="w-full border">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="w-10 px-3 py-2 border">✓</th>
                        <th className="text-left px-3 py-2 border">Item</th>
                        <th className="text-right px-3 py-2 border w-20">Qty</th>
                        <th className="text-left px-3 py-2 border w-20">Unit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(recipeShoppingList)
                        .filter(([cat]) => ['Pantry', 'Bakery', 'Beverages'].includes(cat))
                        .flatMap(([, items]) => Object.values(items))
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .map((item, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-3 py-2 border text-center">
                              <div className="w-5 h-5 border-2 border-gray-400 rounded"></div>
                            </td>
                            <td className="px-3 py-2 border font-medium">{item.name}</td>
                            <td className="px-3 py-2 border text-right font-bold">{item.quantity}</td>
                            <td className="px-3 py-2 border">{item.unit}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {!hasDirectItems && !hasRecipes && (
              <p className="text-gray-500 text-center py-8">No items to pull.</p>
            )}
          </div>
        </div>
      )}

      {/* ============ Prep Tasks Tab ============ */}
      {activeTab === 'prep' && (
        <div className="space-y-6">
          {['day-2', 'day-1', 'day-0'].map(day => {
            const tasks = prepTasks[day] || [];
            const completedCount = tasks.filter((_, idx) => completedTasks[`${day}-${idx}`]).length;
            const isEventDay = day === 'day-0';
            
            return (
              <div key={day} className={`bg-white rounded-lg shadow overflow-hidden ${isEventDay ? 'ring-2 ring-red-500' : ''}`}>
                <div className={`px-6 py-4 flex justify-between items-center ${isEventDay ? 'bg-red-600 text-white' : 'bg-gray-100'}`}>
                  <div>
                    <h2 className="text-lg font-bold">{getPrepDayLabel(day)}</h2>
                    <p className={`text-sm ${isEventDay ? 'text-red-200' : 'text-gray-600'}`}>
                      {completedCount} of {tasks.length} tasks completed
                    </p>
                  </div>
                  <div className={`text-2xl font-bold ${isEventDay ? 'text-white' : 'text-gray-400'}`}>
                    {tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0}%
                  </div>
                </div>
                
                <div className="divide-y">
                  {tasks.map((task, idx) => {
                    const isComplete = completedTasks[`${day}-${idx}`];
                    return (
                      <div
                        key={idx}
                        onClick={() => toggleTask(day, idx)}
                        className={`flex items-center gap-4 px-6 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                          isComplete ? 'bg-green-50' : ''
                        }`}
                      >
                        <div className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
                          isComplete
                            ? 'bg-green-500 border-green-500 text-white'
                            : 'border-gray-300'
                        }`}>
                          {isComplete && <CheckIcon />}
                        </div>
                        <span className="text-sm font-medium text-gray-500 w-20">{task.time}</span>
                        <span className={`flex-1 ${isComplete ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                          {task.task}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
