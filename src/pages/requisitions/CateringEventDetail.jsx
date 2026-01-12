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

// Category colors
const categoryColors = {
  'Produce': { bg: 'bg-green-100', border: 'border-green-300', text: 'text-green-800', header: 'bg-green-600' },
  'Dairy': { bg: 'bg-yellow-100', border: 'border-yellow-300', text: 'text-yellow-800', header: 'bg-yellow-600' },
  'Meat & Seafood': { bg: 'bg-red-100', border: 'border-red-300', text: 'text-red-800', header: 'bg-red-600' },
  'Frozen': { bg: 'bg-blue-100', border: 'border-blue-300', text: 'text-blue-800', header: 'bg-blue-600' },
  'Pantry': { bg: 'bg-amber-100', border: 'border-amber-300', text: 'text-amber-800', header: 'bg-amber-600' },
  'Bakery': { bg: 'bg-orange-100', border: 'border-orange-300', text: 'text-orange-800', header: 'bg-orange-600' },
  'Beverages': { bg: 'bg-purple-100', border: 'border-purple-300', text: 'text-purple-800', header: 'bg-purple-600' },
};

const categoryOrder = ['Produce', 'Dairy', 'Meat & Seafood', 'Frozen', 'Pantry', 'Bakery', 'Beverages'];

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
      // Load event
      const { data: eventData, error: eventError } = await supabase
        .from('catering_events')
        .select('*')
        .eq('id', eventId)
        .single();
      
      if (eventError) throw eventError;
      setEvent(eventData);

      // Load linked recipes
      if (eventData.recipe_ids && eventData.recipe_ids.length > 0) {
        const { data: recipeData } = await supabase
          .from('recipes')
          .select('*')
          .in('id', eventData.recipe_ids);
        setRecipes(recipeData || []);
      }

      // Load ingredients for pricing
      const { data: ingData } = await supabase
        .from('ingredients')
        .select('name, category, vendor, pack_size, case_price, unit_price, unit');
      setIngredients(ingData || []);

      // Load prep tasks from event or use defaults
      if (eventData.prep_tasks) {
        setPrepTasks(eventData.prep_tasks);
      } else {
        setPrepTasks(defaultPrepTasks);
      }

      // Load completed tasks from localStorage
      const saved = localStorage.getItem(`catering-tasks-${eventId}`);
      if (saved) setCompletedTasks(JSON.parse(saved));

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

  // Consolidate shopping list from all recipes
  const shoppingList = useMemo(() => {
    const consolidated = {};
    
    recipes.forEach(recipe => {
      const recipeIngs = typeof recipe.ingredients === 'string' 
        ? JSON.parse(recipe.ingredients) 
        : recipe.ingredients || [];
      
      recipeIngs.forEach(item => {
        const key = item.name?.toLowerCase();
        const ingInfo = ingMap[key] || {};
        const category = ingInfo.category || 'Other';
        
        if (!consolidated[category]) {
          consolidated[category] = {};
        }
        
        if (!consolidated[category][item.name]) {
          consolidated[category][item.name] = {
            name: item.name,
            quantity: 0,
            unit: item.unit,
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
        // Estimate cost based on unit price or case price
        if (ingInfo.unit_price) {
          total += (parseFloat(item.quantity) || 0) * ingInfo.unit_price;
        } else if (ingInfo.case_price) {
          // Rough estimate: assume using fraction of case
          total += ingInfo.case_price * 0.25;
        }
      });
      
      costs[recipe.id] = total;
    });
    
    return costs;
  }, [recipes, ingMap]);

  const totalFoodCost = useMemo(() => {
    return Object.values(recipeCosts).reduce((sum, cost) => sum + cost, 0);
  }, [recipeCosts]);

  // Toggle task completion
  const toggleTask = (day, index) => {
    const key = `${day}-${index}`;
    const updated = { ...completedTasks, [key]: !completedTasks[key] };
    setCompletedTasks(updated);
    localStorage.setItem(`catering-tasks-${eventId}`, JSON.stringify(updated));
  };

  // Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return 'TBD';
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  };

  // Get prep day labels
  const getPrepDayLabel = (dayKey) => {
    if (!event?.event_date) return dayKey;
    const eventDate = new Date(event.event_date + 'T12:00:00');
    
    if (dayKey === 'day-0') {
      return `${eventDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })} (Event Day)`;
    } else if (dayKey === 'day-1') {
      const d = new Date(eventDate);
      d.setDate(d.getDate() - 1);
      return `${d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })} (Day Before)`;
    } else if (dayKey === 'day-2') {
      const d = new Date(eventDate);
      d.setDate(d.getDate() - 2);
      return `${d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })} (2 Days Before)`;
    }
    return dayKey;
  };

  // Print prep plan
  const printPrepPlan = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
      <head>
        <title>${event?.event_name} - Prep Plan</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
          h1 { color: #1e40af; border-bottom: 2px solid #1e40af; padding-bottom: 10px; }
          h2 { color: #374151; margin-top: 24px; }
          .event-info { background: #f3f4f6; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background: #f3f4f6; }
          .checkbox { width: 20px; text-align: center; }
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
        ${categoryOrder.filter(cat => shoppingList[cat]).map(cat => `
          <h3>${cat}</h3>
          <table>
            <thead><tr><th>Item</th><th>Qty</th><th>Vendor</th><th>Pack</th></tr></thead>
            <tbody>
              ${Object.values(shoppingList[cat]).map(item => `
                <tr>
                  <td>${item.name}</td>
                  <td>${item.quantity} ${item.unit}</td>
                  <td>${item.vendor}</td>
                  <td>${item.packSize}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `).join('')}
        
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
        {['overview', 'recipes', 'shopping', 'prep'].map(tab => (
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
            {tab === 'shopping' && '🛒 Shopping List'}
            {tab === 'prep' && '✅ Prep Tasks'}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
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

          {/* Cost Summary */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Cost Summary</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Food Cost (Est.):</span>
                <span className="font-medium">${totalFoodCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Menu Price:</span>
                <span className="font-medium">${event.total_price?.toFixed(2) || '0.00'}</span>
              </div>
              <hr />
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

          {/* Menu */}
          <div className="bg-white rounded-lg shadow p-6 lg:col-span-2">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Menu</h2>
            {recipes.length === 0 ? (
              <p className="text-gray-500">No recipes linked to this event.</p>
            ) : (
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
          </div>
        </div>
      )}

      {/* Recipes Tab */}
      {activeTab === 'recipes' && (
        <div className="space-y-6">
          {recipes.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
              No recipes linked to this event.
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
                    {/* Ingredients */}
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
                    
                    {/* Procedure */}
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

      {/* Shopping List Tab */}
      {activeTab === 'shopping' && (
        <div className="space-y-6">
          {categoryOrder.filter(cat => shoppingList[cat]).map(cat => {
            const colors = categoryColors[cat] || categoryColors['Pantry'];
            const items = Object.values(shoppingList[cat]);
            
            return (
              <div key={cat} className={`rounded-lg border-2 ${colors.border} overflow-hidden`}>
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
                            {item.casePrice > 0 ? `$${(item.casePrice * 0.25).toFixed(2)}` : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Prep Tasks Tab */}
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
                    {Math.round((completedCount / tasks.length) * 100) || 0}%
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
