import React, { useState, useMemo } from 'react';
import { ingredientsList, categories } from '../data/ingredientsList';
import IngredientRow from './IngredientRow';
import RequisitionDisplay from './RequisitionDisplay';

function RequisitionModule() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedIngredients, setSelectedIngredients] = useState({});
  const [quantities, setQuantities] = useState({});
  const [requisitionName, setRequisitionName] = useState('');
  const [budget, setBudget] = useState(500);

  const filteredIngredients = selectedCategory === 'All' 
    ? ingredientsList 
    : ingredientsList.filter(ing => ing.category === selectedCategory);

  const selectedItems = useMemo(() => {
    return Object.keys(selectedIngredients)
      .filter(id => selectedIngredients[id])
      .map(id => {
        const ingredient = ingredientsList.find(ing => ing.id === id);
        const quantity = quantities[id] || 0;
        return { ...ingredient, quantity, totalCost: quantity * ingredient.unitPrice };
      })
      .filter(item => item.quantity > 0);
  }, [selectedIngredients, quantities]);

  const totalCost = selectedItems.reduce((sum, item) => sum + item.totalCost, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <h1 className="text-3xl font-bold text-gray-900">ToqueWorks</h1>
          <p className="text-sm text-gray-600 mt-1">Lab Requisition Module</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Requisition Details</h2>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Requisition Name</label>
              <input
                type="text"
                value={requisitionName}
                onChange={(e) => setRequisitionName(e.target.value)}
                placeholder="e.g., CUL 140 Week 3 - Quick Breads"
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Budget ($)</label>
              <input
                type="number"
                value={budget}
                onChange={(e) => setBudget(parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
          </div>
        </div>

        {selectedItems.length > 0 && (
          <div className={`rounded-lg p-4 mb-6 border-2 ${budget >= totalCost ? 'bg-green-50 border-green-400' : 'bg-red-50 border-red-400'}`}>
            <div className="flex justify-between">
              <div><span className="font-medium">Budget:</span> ${budget.toFixed(2)}</div>
              <div><span className="font-medium">Total:</span> ${totalCost.toFixed(2)}</div>
              <div className={`font-bold ${budget >= totalCost ? 'text-green-700' : 'text-red-700'}`}>
                {budget >= totalCost ? '✓' : '⚠'} ${Math.abs(budget - totalCost).toFixed(2)} {budget >= totalCost ? 'Under' : 'Over'}
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm border mb-6">
          <div className="px-6 py-5 border-b">
            <h2 className="text-xl font-semibold mb-4">Select Ingredients</h2>
            <div className="flex gap-2 overflow-x-auto">
              <button onClick={() => setSelectedCategory('All')} className={`px-4 py-2 rounded-lg whitespace-nowrap ${selectedCategory === 'All' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>All</button>
              {categories.map(cat => (
                <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-4 py-2 rounded-lg whitespace-nowrap ${selectedCategory === cat ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>{cat}</button>
              ))}
            </div>
          </div>
          <div>
            {filteredIngredients.map(ing => (
              <IngredientRow
                key={ing.id}
                ingredient={ing}
                quantity={quantities[ing.id] || 0}
                isSelected={selectedIngredients[ing.id] || false}
                onToggle={(id) => setSelectedIngredients(prev => ({ ...prev, [id]: !prev[id] }))}
                onQuantityChange={(id, qty) => {
                  setQuantities(prev => ({ ...prev, [id]: qty }));
                  if (qty > 0) setSelectedIngredients(prev => ({ ...prev, [id]: true }));
                }}
              />
            ))}
          </div>
        </div>

        {selectedItems.length > 0 ? (
          <RequisitionDisplay selectedItems={selectedItems} requisitionName={requisitionName} budget={budget} />
        ) : (
          <div className="bg-white rounded-lg border p-12 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-semibold mb-2">No Items Selected</h3>
            <p className="text-gray-600">Check boxes and enter quantities to build your requisition.</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default RequisitionModule;
