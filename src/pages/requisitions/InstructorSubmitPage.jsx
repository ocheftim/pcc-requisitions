import React, { useState, useEffect } from 'react';
import { bakingIngredientsList, savoryIngredientsList } from '../../data/ingredients/ingredientsList';

const INSTRUCTORS = ['Cabrera', 'Mikesell', 'Redha', 'Wong'];
const WEEKS = Array.from({ length: 16 }, (_, i) => `Week ${i + 1}`);
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function InstructorSubmitPage() {
  const [formData, setFormData] = useState({
    instructor: '',
    week: '',
    classDay: '',
    classDate: '',
    recipe: '',
    studentCount: 12,
    budgetPerStudent: 12.50,
    studentCount: 12,
    budgetPerStudent: 12.50
  });
  
  const [items, setItems] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [selectedIngredient, setSelectedIngredient] = useState('');
  const [quantity, setQuantity] = useState('');
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customItem, setCustomItem] = useState({ name: '', quantity: '', unit: 'lb' });
  const [submitted, setSubmitted] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const units = ['lb', 'oz', 'g', 'kg', 'ea', 'doz', 'bunch', 'qt', 'gal', 'pt', 'cup', 'can', 'bottle', 'jar', 'bag', 'box', 'case'];

  useEffect(() => {
    const ingredientEdits = JSON.parse(localStorage.getItem("ingredientEdits") || "{}");
    const customIngredients = JSON.parse(localStorage.getItem("customIngredients") || "[]");
    const allIngredients = [...bakingIngredientsList, ...savoryIngredientsList, ...customIngredients]
      .map(ing => ({ ...ing, ...(ingredientEdits[ing.id] || {}) }))
      .sort((a, b) => a.name.localeCompare(b.name));
    setIngredients(allIngredients);
  }, []);

  const calculateTotal = () => {
    return items.reduce((sum, item) => {
      const ing = ingredients.find(i => i.id === item.ingredientId);
      if (ing) {
        const casePrice = ing.casePrice || ing.syscoPrice || 0;
        return sum + (casePrice * 0.1 * item.quantity);
      }
      return sum + (item.estimatedCost || 0);
    }, 0);
  };

  const handleAddIngredient = () => {
    if (!selectedIngredient || !quantity) return;
    
    const ing = ingredients.find(i => i.id === selectedIngredient);
    if (!ing) return;

    setItems(prev => [...prev, {
      id: Date.now(),
      ingredientId: ing.id,
      name: ing.name,
      quantity: parseFloat(quantity),
      unit: ing.unit,
      category: ing.category
    }]);
    
    setSelectedIngredient('');
    setQuantity('');
    setSearchTerm('');
  };

  const handleAddCustomItem = () => {
    if (!customItem.name || !customItem.quantity) return;
    
    setItems(prev => [...prev, {
      id: Date.now(),
      ingredientId: null,
      name: customItem.name,
      quantity: parseFloat(customItem.quantity),
      unit: customItem.unit,
      category: 'Custom',
      isCustom: true,
      estimatedCost: 5
    }]);
    
    setCustomItem({ name: '', quantity: '', unit: 'lb' });
    setShowCustomForm(false);
  };

  const handleRemoveItem = (id) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const handleSubmit = () => {
    if (!formData.instructor || !formData.week || !formData.classDay || items.length === 0) {
      alert('Please fill in all required fields and add at least one item.');
      return;
    }

    const requisition = {
      id: 'REQ-' + Date.now(),
      ...formData,
      items,
      totalEstimate: calculateTotal(),
      submittedAt: new Date().toISOString(),
      status: 'Pending Review'
    };

    const existingReqs = JSON.parse(localStorage.getItem('instructorRequisitions') || '[]');
    existingReqs.push(requisition);
    localStorage.setItem('instructorRequisitions', JSON.stringify(existingReqs));

    const savedReqs = JSON.parse(localStorage.getItem('savedRequisitions') || '[]');
    const formattedReq = {
      id: requisition.id,
      name: `${formData.instructor} - ${formData.week} - ${formData.recipe || 'Lab'}`,
      instructor: formData.instructor,
      week: formData.week,
      program: 'Culinary Arts',
      class: formData.classDay,
      date: formData.classDate,
      recipe: formData.recipe,
      budget: formData.labBudget,
      items: items.map(item => ({
        ingredient: item.name,
        quantity: item.quantity,
        unit: item.unit,
        category: item.category
      })),
      status: 'Submitted',
      submittedAt: requisition.submittedAt
    };
    savedReqs.push(formattedReq);
    localStorage.setItem('savedRequisitions', JSON.stringify(savedReqs));

    setSubmitted(true);
  };

  const handleNewRequisition = () => {
    setFormData({
      instructor: '',
      week: '',
      classDay: '',
      classDate: '',
      recipe: '',
      studentCount: 12,
    budgetPerStudent: 12.50,
    studentCount: 12,
    budgetPerStudent: 12.50
    });
    setItems([]);
    setSubmitted(false);
  };

  const filteredIngredients = ingredients.filter(ing => {
    const matchesSearch = ing.name.toLowerCase().includes(searchTerm.toLowerCase());
    const programs = ing.programs || ["Baking & Pastry Arts", "Culinary Arts", "Foodservice"];
    const matchesProgram = !formData.program || programs.includes(formData.program);
    return matchesSearch && matchesProgram;
  });

  const totalEstimate = calculateTotal();
  const isOverBudget = totalEstimate > formData.labBudget;

  // Header Component
  const Header = () => (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <img 
              src="/pcc-logo.png" 
              alt="Pima Community College" 
              className="h-14"
              onError={(e) => { 
                e.target.onerror = null;
                e.target.parentElement.innerHTML = '<div class="flex items-center gap-3 text-blue-700"><svg class="w-12 h-12" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" stroke-width="2"/><path d="M50 10 L50 90 M10 50 L90 50 M20 20 L80 80 M80 20 L20 80" stroke="currentColor" stroke-width="2"/></svg><span class="text-2xl font-semibold">PimaCommunityCollege</span></div>';
              }}
            />
            <div className="border-l-4 border-blue-600 pl-6">
              <h1 className="text-2xl font-bold text-gray-800">Lab Requisition</h1>
              <p className="text-sm text-gray-600">Culinary Arts and Baking & Pastry Arts</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header />
        <div className="flex items-center justify-center p-6 mt-12">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
            <div className="text-6xl mb-4 text-green-500">✓</div>
            <h1 className="text-2xl font-bold text-green-700 mb-2">Requisition Submitted!</h1>
            <p className="text-gray-600 mb-6">
              Your requisition for <strong>{formData.week}</strong> has been submitted for review.
            </p>
            <div className="bg-gray-50 rounded p-4 mb-6 text-left">
              <p><strong>Instructor:</strong> {formData.instructor}</p>
              <p><strong>Day:</strong> {formData.classDay}, {formData.classDate}</p>
              <p><strong>Recipe:</strong> {formData.recipe || '-'}</p>
              <p><strong>Items:</strong> {items.length}</p>
              <p><strong>Estimated Total:</strong> ${totalEstimate.toFixed(2)}</p>
            </div>
            <button
              onClick={handleNewRequisition}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Submit Another Requisition
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />

      <div className="max-w-4xl mx-auto p-6">
        {/* Class Info Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Class Information</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Instructor Name *</label>
              <select
                value={formData.instructor}
                onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Select...</option>
                {INSTRUCTORS.map(name => (
                  <option key={inst.name || inst} value={inst.name || inst}>{inst.name || inst}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Week *</label>
              <select
                value={formData.week}
                onChange={(e) => setFormData({ ...formData, week: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Select...</option>
                {WEEKS.map(week => (
                  <option key={week} value={week}>{week}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lab Budget ($)</label>
              <input
                type="number"
                value={formData.labBudget}
                onChange={(e) => setFormData({ ...formData, labBudget: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Class Day *</label>
              <select
                value={formData.classDay}
                onChange={(e) => setFormData({ ...formData, classDay: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Select...</option>
                {DAYS.map(day => (
                  <option key={day} value={day}>{day}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Class Date</label>
              <input
                type="date"
                value={formData.classDate}
                onChange={(e) => setFormData({ ...formData, classDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Recipe / Menu</label>
              <input
                type="text"
                value={formData.recipe}
                onChange={(e) => setFormData({ ...formData, recipe: e.target.value })}
                placeholder="e.g., White Bread, Pg 237"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Add Items Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-800">Ingredients</h2>
            <button
              onClick={() => setShowCustomForm(!showCustomForm)}
              className="text-sm px-3 py-1 bg-gray-100 rounded hover:bg-gray-200"
            >
              {showCustomForm ? '✕ Cancel' : '+ Add Custom Item'}
            </button>
          </div>

          {!showCustomForm && (
            <div className="flex gap-2 mb-4">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Search ingredients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
                {searchTerm && (
                  <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg mt-1 max-h-48 overflow-y-auto shadow-lg">
                    {filteredIngredients.slice(0, 20).map(ing => (
                      <div
                        key={ing.id}
                        onClick={() => {
                          setSelectedIngredient(ing.id);
                          setSearchTerm(ing.name);
                        }}
                        className={`px-3 py-2 cursor-pointer hover:bg-blue-50 ${selectedIngredient === ing.id ? 'bg-blue-100' : ''}`}
                      >
                        <span className="font-medium">{ing.name}</span>
                        <span className="text-xs text-gray-500 ml-2">({ing.unit})</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="w-24">
                <input
                  type="number"
                  placeholder="Qty"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  step="0.25"
                />
              </div>
              <button
                onClick={handleAddIngredient}
                disabled={!selectedIngredient || !quantity}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Add
              </button>
            </div>
          )}

          {showCustomForm && (
            <div className="flex gap-2 mb-4 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Item name..."
                  value={customItem.name}
                  onChange={(e) => setCustomItem({ ...customItem, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div className="w-20">
                <input
                  type="number"
                  placeholder="Qty"
                  value={customItem.quantity}
                  onChange={(e) => setCustomItem({ ...customItem, quantity: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  step="0.25"
                />
              </div>
              <div className="w-24">
                <select
                  value={customItem.unit}
                  onChange={(e) => setCustomItem({ ...customItem, unit: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  {units.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <button
                onClick={handleAddCustomItem}
                disabled={!customItem.name || !customItem.quantity}
                className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Add
              </button>
            </div>
          )}

          {items.length > 0 ? (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Item</th>
                    <th className="px-4 py-2 text-center text-sm font-medium text-gray-700">Quantity</th>
                    <th className="px-4 py-2 text-center text-sm font-medium text-gray-700">Unit</th>
                    <th className="px-4 py-2 text-center text-sm font-medium text-gray-700 w-16"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-2">
                        <span className="font-medium">{item.name}</span>
                        {item.isCustom && <span className="ml-2 text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">Custom</span>}
                      </td>
                      <td className="px-4 py-2 text-center">{item.quantity}</td>
                      <td className="px-4 py-2 text-center">{item.unit}</td>
                      <td className="px-4 py-2 text-center">
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg">
              No items added yet. Search for ingredients above.
            </div>
          )}
        </div>

        {/* Budget Summary */}
        <div className={`rounded-lg shadow p-6 mb-6 ${isOverBudget ? 'bg-red-50 border border-red-200' : 'bg-blue-50 border border-blue-200'}`}>
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold text-gray-800">Budget Summary</h3>
              <p className="text-sm text-gray-600">Lab Budget: ${formData.labBudget.toFixed(2)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Estimated Total</p>
              <p className={`text-2xl font-bold ${isOverBudget ? 'text-red-600' : 'text-blue-600'}`}>
                ${totalEstimate.toFixed(2)}
              </p>
              {isOverBudget && (
                <p className="text-sm text-red-600">Over budget by ${(totalEstimate - formData.labBudget).toFixed(2)}</p>
              )}
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-3">
          <button
            onClick={handleNewRequisition}
            className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
          >
            Clear All
          </button>
          <button
            onClick={handleSubmit}
            disabled={!formData.instructor || !formData.week || !formData.classDay || items.length === 0}
            className="px-8 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
          >
            Submit Requisition
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 py-4 text-center text-sm text-gray-500">
        Pima Community College • Culinary Arts Program
      </div>
    </div>
  );
}
