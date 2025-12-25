import React, { useState, useMemo } from 'react';
import { bakingIngredientsList, savoryIngredientsList } from '../../data/ingredients/ingredientsList';

export default function InstructorRequisitionPage() {
  const [instructor, setInstructor] = useState('');
  const [week, setWeek] = useState('');
  const [course, setCourse] = useState('');
  const [recipes, setRecipes] = useState('');
  const [program, setProgram] = useState('');
  const [orderItems, setOrderItems] = useState({});
  const [budget, setBudget] = useState('');
  const [customIngredients, setCustomIngredients] = useState([]);
  const [showAddCustom, setShowAddCustom] = useState(false);
  
  const [customName, setCustomName] = useState('');
  const [customUnit, setCustomUnit] = useState('');
  const [customCost, setCustomCost] = useState('');
  const [customQty, setCustomQty] = useState('');

  const instructors = [
    'McKoy',
    'Wong',
    'Mikesell',
    'Cabrera',
    "O'Donnell",
    'Moreno',
    'Toscano'
  ];

  const weeks = Array.from({ length: 16 }, (_, i) => `Week ${i + 1}`);

  const courses = {
    'Baking & Pastry': ['CUL160', 'CUL260', 'CUL168'],
    'Culinary Arts': ['CUL140', 'CUL130', 'CUL150'],
    'Foodservice': ['FSM101', 'FSM201']
  };

  const parseCasePack = (packSize) => {
    if (!packSize) return 1;
    const ctMatch = packSize.match(/(\d+)ct/i);
    if (ctMatch) return parseInt(ctMatch[1]);
    const slashMatch = packSize.match(/^(\d+)\//);
    if (slashMatch) return parseInt(slashMatch[1]);
    const lbsMatch = packSize.match(/^(\d+)\s*LBS?$/i);
    if (lbsMatch) return parseInt(lbsMatch[1]);
    return 1;
  };

  const getUnitCost = (ingredient) => {
    if (ingredient.isCustom) {
      return ingredient.unitCost || 0;
    }
    
    // Handle flat vendor structure (syscoPrice, shamrockPrice, etc.)
    const vendor = ingredient.preferredVendor || 'sysco';
    let casePrice = 0;
    let packSize = '';
    
    if (vendor === 'sysco') {
      casePrice = ingredient.syscoPrice || 0;
      packSize = ingredient.syscoPackSize || '';
    } else if (vendor === 'shamrock') {
      casePrice = ingredient.shamrockPrice || 0;
      packSize = ingredient.shamrockPackSize || '';
    } else if (vendor === 'peddlers') {
      casePrice = ingredient.peddlersPrice || 0;
      packSize = ingredient.peddlersPackSize || '';
    }
    
    // Fallback to nested vendor structure for backwards compatibility
    if (!casePrice && ingredient.vendors?.[vendor]) {
      casePrice = ingredient.vendors[vendor].casePrice || 0;
      packSize = ingredient.vendors[vendor].packSize || '';
    }
    
    const unitsPerCase = parseCasePack(packSize);
    return unitsPerCase > 0 ? casePrice / unitsPerCase : 0;
  };
  const updateQuantity = (itemId, value) => {
    setOrderItems(prev => ({
      ...prev,
      [itemId]: value
    }));
  };

  const handleAddCustomIngredient = () => {
    if (!customName || !customUnit || !customCost || !customQty) {
      alert('Please fill in all fields for custom ingredient');
      return;
    }
    const customId = `CUSTOM_${Date.now()}`;
    const newCustom = {
      id: customId,
      name: customName,
      unit: customUnit,
      unitCost: parseFloat(customCost),
      isCustom: true,
      category: 'CUSTOM'
    };
    setCustomIngredients(prev => [...prev, newCustom]);
    setOrderItems(prev => ({
      ...prev,
      [customId]: customQty
    }));
    setCustomName('');
    setCustomUnit('');
    setCustomCost('');
    setCustomQty('');
    setShowAddCustom(false);
  };

  const removeCustomIngredient = (customId) => {
    setCustomIngredients(prev => prev.filter(item => item.id !== customId));
    setOrderItems(prev => {
      const newItems = { ...prev };
      delete newItems[customId];
      return newItems;
    });
  };

  const calculations = useMemo(() => {
    const allIngredients = [...bakingIngredientsList, ...savoryIngredientsList, ...customIngredients];
    let total = 0;
    const lineItems = allIngredients.map(item => {
      const quantity = parseFloat(orderItems[item.id]) || 0;
      const unitCost = getUnitCost(item);
      const extended = quantity * unitCost;
      if (quantity > 0) {
        total += extended;
      }
      return {
        ...item,
        quantity,
        unitCost,
        extended
      };
    });
    const budgetAmount = parseFloat(budget) || 0;
    const balance = budgetAmount - total;
    return {
      lineItems,
      total,
      budget: budgetAmount,
      balance
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderItems, budget, customIngredients, getUnitCost]);

  const groupedIngredients = useMemo(() => {
    // Use the correct list based on program
    let filteredList = [];
    
    if (program === 'Baking & Pastry') {
      filteredList = bakingIngredientsList;
    } else if (program === 'Culinary Arts') {
      filteredList = savoryIngredientsList;
    } else {
      // Default to combined list if no program selected
      filteredList = [...bakingIngredientsList, ...savoryIngredientsList];
    }
    
    const groups = {};
    filteredList.forEach(item => {
      if (!groups[item.category]) {
        groups[item.category] = [];
      }
      groups[item.category].push(item);
    });
    return groups;
  }, [program]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const order = {
      instructor,
      week,
      course,
      program,
      recipes,
      budget: calculations.budget,
      items: calculations.lineItems
        .filter(item => item.quantity > 0)
        .map(item => ({
          id: item.id,
          name: item.name,
          unit: item.unit,
          quantity: item.quantity,
          unitCost: item.unitCost,
          extended: item.extended,
          isCustom: item.isCustom || false
        })),
      total: calculations.total,
      balance: calculations.balance,
      timestamp: new Date().toISOString()
    };
    const existingOrders = JSON.parse(localStorage.getItem('instructorOrders') || '[]');
    existingOrders.push(order);
    localStorage.setItem('instructorOrders', JSON.stringify(existingOrders));
    alert('Requisition submitted successfully!');
    setInstructor('');
    setWeek('');
    setCourse('');
    setRecipes('');
    setProgram('');
    setOrderItems({});
    setBudget('');
    setCustomIngredients([]);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-start mb-6 print:block">
          <h1 className="text-3xl font-bold text-gray-800">
            Instructor Lab Requisition
          </h1>
          {program && (
            <button onClick={handlePrint} className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 print:hidden">
              🖨️ Print
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 pb-6 border-b">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Instructor Name *</label>
            <select value={instructor} onChange={(e) => setInstructor(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" required>
              <option value="">Select Instructor</option>
              {instructors.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Week *</label>
            <select value={week} onChange={(e) => setWeek(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" required>
              <option value="">Select Week</option>
              {weeks.map(w => (
                <option key={w} value={w}>{w}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Program *</label>
            <select value={program} onChange={(e) => { setProgram(e.target.value); setCourse(''); }} className="w-full px-3 py-2 border border-gray-300 rounded-lg" required>
              <option value="">Select Program</option>
              <option value="Baking & Pastry">Baking & Pastry</option>
              <option value="Culinary Arts">Culinary Arts</option>
              <option value="Foodservice">Foodservice</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Class *</label>
            <select value={course} onChange={(e) => setCourse(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" disabled={!program} required>
              <option value="">Select Class</option>
              {program && courses[program]?.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Recipe/Menu & Page #</label>
            <input type="text" value={recipes} onChange={(e) => setRecipes(e.target.value)} placeholder="e.g., White Bread, Page 237" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Lab Budget *</label>
            <input type="number" value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="e.g., 500.00" step="0.01" min="0" className="w-full px-3 py-2 border border-gray-300 rounded-lg" required />
          </div>
        </div>
        {program && (
          <>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Order Items - {program === 'Baking & Pastry' ? 'Baking Ingredients' : program === 'Culinary Arts' ? 'Savory Ingredients' : 'All Ingredients'}</h2>
              <button onClick={() => setShowAddCustom(!showAddCustom)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 print:hidden">+ Add Item</button>
            </div>
            {showAddCustom && (
              <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200 print:hidden">
                <h3 className="font-semibold mb-3">Add Custom Ingredient</h3>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                  <input type="text" placeholder="Item Name" value={customName} onChange={(e) => setCustomName(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg" />
                  <input type="text" placeholder="Unit (lb, ea, etc)" value={customUnit} onChange={(e) => setCustomUnit(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg" />
                  <input type="number" placeholder="Unit Cost ($)" value={customCost} onChange={(e) => setCustomCost(e.target.value)} step="0.01" min="0" className="px-3 py-2 border border-gray-300 rounded-lg" />
                  <input type="number" placeholder="Quantity" value={customQty} onChange={(e) => setCustomQty(e.target.value)} step="0.25" min="0" className="px-3 py-2 border border-gray-300 rounded-lg" />
                  <button onClick={handleAddCustomIngredient} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Add</button>
                </div>
              </div>
            )}
            {customIngredients.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-lg mb-3 text-blue-700">Custom Items</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-blue-100 border-b">
                        <th className="text-left p-2 font-semibold">Item</th>
                        <th className="text-center p-2 font-semibold w-20">Unit</th>
                        <th className="text-right p-2 font-semibold w-24">Unit Cost</th>
                        <th className="text-center p-2 font-semibold w-24 print:hidden">Order</th>
                        <th className="text-right p-2 font-semibold w-24">Qty</th>
                        <th className="text-right p-2 font-semibold w-28">Extended</th>
                        <th className="w-20 print:hidden"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {customIngredients.map(item => {
                        const lineItem = calculations.lineItems.find(li => li.id === item.id);
                        return (
                          <tr key={item.id} className="border-b hover:bg-gray-50">
                            <td className="p-2">{item.name}</td>
                            <td className="text-center p-2">{item.unit}</td>
                            <td className="text-right p-2 text-gray-600">${lineItem.unitCost.toFixed(2)}</td>
                            <td className="text-center p-2 print:hidden">
                              <input type="number" min="0" step="0.25" value={orderItems[item.id] || ''} onChange={(e) => updateQuantity(item.id, e.target.value)} className="w-24 px-2 py-1 border border-gray-300 rounded text-center" />
                            </td>
                            <td className="text-right p-2 font-medium">{lineItem.quantity > 0 ? lineItem.quantity.toFixed(2) : ''}</td>
                            <td className="text-right p-2 font-medium">{lineItem.quantity > 0 ? `$${lineItem.extended.toFixed(2)}` : ''}</td>
                            <td className="text-center p-2 print:hidden">
                              <button onClick={() => removeCustomIngredient(item.id)} className="text-red-600 hover:text-red-800">✕</button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {Object.entries(groupedIngredients).map(([category, items]) => (
              <div key={category} className="mb-6">
                <h3 className="font-semibold text-lg mb-3 text-gray-700 border-b pb-2">{category}</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-gray-100 border-b">
                        <th className="text-left p-2 font-semibold">Item</th>
                        <th className="text-center p-2 font-semibold w-20">Unit</th>
                        <th className="text-right p-2 font-semibold w-24">Unit Cost</th>
                        <th className="text-center p-2 font-semibold w-24 print:hidden">Order</th>
                        <th className="text-right p-2 font-semibold w-24">Qty</th>
                        <th className="text-right p-2 font-semibold w-28">Extended</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map(item => {
                        const lineItem = calculations.lineItems.find(li => li.id === item.id);
                        const hasQuantity = lineItem.quantity > 0;
                        return (
                          <tr key={item.id} className={`border-b hover:bg-gray-50 ${!hasQuantity ? 'print:hidden' : ''}`}>
                            <td className="p-2">{item.name}</td>
                            <td className="text-center p-2">{item.unit}</td>
                            <td className="text-right p-2 text-gray-600">${lineItem.unitCost.toFixed(2)}</td>
                            <td className="text-center p-2 print:hidden">
                              <input type="number" min="0" step="0.25" value={orderItems[item.id] || ''} onChange={(e) => updateQuantity(item.id, e.target.value)} className="w-24 px-2 py-1 border border-gray-300 rounded text-center" placeholder="0" />
                            </td>
                            <td className="text-right p-2 font-medium">{hasQuantity ? lineItem.quantity.toFixed(2) : ''}</td>
                            <td className="text-right p-2 font-medium">{hasQuantity ? `$${lineItem.extended.toFixed(2)}` : ''}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
            <div className="border-t-2 border-gray-300 pt-4 mb-6 mt-8">
              <div className="flex justify-end">
                <div className="w-96 space-y-2">
                  <div className="flex justify-between text-lg">
                    <span className="font-medium">Requisition Total:</span>
                    <span className="font-bold">${calculations.total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg">
                    <span className="font-medium">Lab Budget:</span>
                    <span>${calculations.budget.toFixed(2)}</span>
                  </div>
                  <div className={`flex justify-between text-xl font-bold pt-2 border-t ${calculations.balance < 0 ? 'text-red-600' : 'text-green-600'}`}>
                    <span>Balance:</span>
                    <span>${calculations.balance.toFixed(2)}</span>
                  </div>
                  {calculations.balance < 0 && (
                    <div className="text-sm text-red-600 text-right print:hidden">⚠️ Over budget by ${Math.abs(calculations.balance).toFixed(2)}</div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-4 print:hidden">
              <button onClick={() => { setInstructor(''); setWeek(''); setCourse(''); setRecipes(''); setProgram(''); setOrderItems({}); setBudget(''); setCustomIngredients([]); }} className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600">Clear</button>
              <button onClick={handleSubmit} disabled={!instructor || !week || !course || !program || !budget || calculations.total === 0} className="px-6 py-2 bg-pcc-500 text-white rounded-lg hover:bg-pcc-600 disabled:opacity-50 disabled:cursor-not-allowed">Submit Requisition</button>
            </div>
          </>
        )}
        {!program && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-blue-800">👆 Select your name, week, program, class, and budget to view available ingredients.</p>
          </div>
        )}
      </div>
      <style>{`
        @media print {
          body { margin: 0; padding: 20px; }
          .print\\:hidden { display: none !important; }
          .print\\:block { display: block !important; }
          table { page-break-inside: avoid; }
          thead { display: table-header-group; }
          tr { page-break-inside: avoid; }
          select { appearance: none; background: white !important; border: none !important; font-weight: 600; }
          input[type="text"], input[type="number"] { border: none !important; font-weight: 600; }
        }
      `}</style>
    </div>
  );
}
