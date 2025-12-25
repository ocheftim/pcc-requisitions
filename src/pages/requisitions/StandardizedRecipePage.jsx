import React, { useState, useEffect } from 'react';
import { Plus, Save, X, Clock, Users, DollarSign, Search, Edit2, Check, RefreshCw } from 'lucide-react';
import { bakingIngredientsList, savoryIngredientsList, shamrockIngredientsList, additionalIngredients, syscoOrderGuide } from '../../data/ingredients/ingredientsList';
import { defaultRecipes, cul163Recipes } from '../../data/recipes/defaultRecipes';

const StandardizedRecipePage = () => {
  const [recipes, setRecipes] = useState([]);
  const [view, setView] = useState('list');
  const [currentRecipe, setCurrentRecipe] = useState(null);
  const [availableIngredients, setAvailableIngredients] = useState([]);
  const [ingredientSearch, setIngredientSearch] = useState('');
  const [editingIngredient, setEditingIngredient] = useState(null);
  const [replacingIngredient, setReplacingIngredient] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSubcategory, setSelectedSubcategory] = useState("all");

  const [recipeForm, setRecipeForm] = useState({
    name: '',
    category: '',
    yield: 10,
    portionSize: '',
    prepTime: '',
    cookTime: '',
    holdingStyle: '',
    allergens: [],
    equipment: [],
    ingredients: [],
    instructions: []
  });

  useEffect(() => {
    loadRecipes();
    loadIngredients();
  }, []);

  const loadRecipes = () => {
    const saved = JSON.parse(localStorage.getItem("standardized_recipes") || "[]");
    const defaultIds = defaultRecipes.map(r => r.id);
    const customRecipes = saved.filter(r => !defaultIds.includes(r.id));
    const mergedRecipes = [...defaultRecipes, ...cul163Recipes, ...customRecipes];
    setRecipes(mergedRecipes);
  };

  const calculateUnitPrice = (ing) => {
    if (ing.unitPrice) return ing.unitPrice;
    const price = ing.syscoPrice || ing.vendorPrice || 0;
    const packSize = ing.syscoPackSize || ing.vendorPackSize || '';
    const match = packSize.match(/^(\d+)?\/?(\d*\.?\d+)?(LB|OZ|GAL|QT|LTR|L|CT|EA)?$/i);
    if (!match) return price;
    const count = parseInt(match[1]) || 1;
    const size = parseFloat(match[2]) || 1;
    const packUnit = (match[3] || '').toUpperCase();
    let totalUnits = count * size;
    if (packUnit === 'LB' && ing.unit === 'oz') totalUnits *= 16;
    if (packUnit === 'GAL' && ing.unit === 'oz') totalUnits *= 128;
    if (packUnit === 'QT' && ing.unit === 'oz') totalUnits *= 32;
    if ((packUnit === 'LTR' || packUnit === 'L') && ing.unit === 'oz') totalUnits *= 33.814;
    return totalUnits > 0 ? (price / totalUnits) : price;
  };

  const loadIngredients = () => {
    const customIngredients = JSON.parse(localStorage.getItem('customIngredients') || '[]');
    const ingredientEdits = JSON.parse(localStorage.getItem('ingredientEdits') || '{}');
    const baseIngredients = [...bakingIngredientsList, ...savoryIngredientsList, ...shamrockIngredientsList, ...additionalIngredients, ...syscoOrderGuide].map(ing => {
      const edits = ingredientEdits[ing.id] || {};
      const unitPrice = calculateUnitPrice(ing);
      return { ...ing, unitPrice, vendor: ing.vendor || 'Sysco', ...edits };
    });
    const allIngredients = [...baseIngredients, ...customIngredients];
    setAvailableIngredients(allIngredients);
  };

  const saveRecipes = (updated) => {
    localStorage.setItem('standardized_recipes', JSON.stringify(updated));
    setRecipes(updated);
  };

  const saveIngredientEdit = (ingredientId, updates) => {
    const customEdits = JSON.parse(localStorage.getItem('ingredientEdits') || '{}');
    customEdits[ingredientId] = { ...(customEdits[ingredientId] || {}), ...updates };
    localStorage.setItem('ingredientEdits', JSON.stringify(customEdits));
    loadIngredients();
  };

  const addIngredientToRecipe = (ingredient) => {
    if (!ingredient) return;
    const unitPrice = ingredient.unitPrice || calculateUnitPrice(ingredient);
    const newRecipeIngredient = {
      id: Date.now(),
      ingredientId: ingredient.id,
      name: ingredient.name,
      amount: replacingIngredient ? replacingIngredient.amount : "",
      unit: ingredient.unit || "oz",
      vendor: ingredient.vendor || "Sysco",
      vendorCode: ingredient.syscoCode || ingredient.vendorCode || "",
      packSize: ingredient.syscoPackSize || ingredient.vendorPackSize || "",
      casePrice: ingredient.syscoPrice || ingredient.vendorPrice || 0,
      unitPrice: unitPrice,
      epCost: replacingIngredient ? (replacingIngredient.amount * unitPrice).toFixed(2) : 0
    };
    if (replacingIngredient) {
      const idx = recipeForm.ingredients.findIndex(i => i.id === replacingIngredient.id);
      const updatedIngredients = [...recipeForm.ingredients];
      updatedIngredients[idx] = newRecipeIngredient;
      setRecipeForm({ ...recipeForm, ingredients: updatedIngredients });
      setReplacingIngredient(null);
    } else {
      setRecipeForm({ ...recipeForm, ingredients: [...recipeForm.ingredients, newRecipeIngredient] });
    }
    setIngredientSearch("");
  };

  const updateIngredient = (id, field, value) => {
    setRecipeForm({
      ...recipeForm,
      ingredients: recipeForm.ingredients.map(ing => {
        if (ing.id === id) {
          const updated = { ...ing, [field]: value };
          if (field === 'amount' || field === 'unitPrice') {
            const amount = parseFloat(field === 'amount' ? value : ing.amount) || 0;
            const unitPrice = parseFloat(field === 'unitPrice' ? value : ing.unitPrice) || 0;
            updated.epCost = (amount * unitPrice).toFixed(2);
          }
          return updated;
        }
        return ing;
      })
    });
  };

  const saveIngredientChangesToMaster = (ing) => {
    saveIngredientEdit(ing.ingredientId, {
      name: ing.name,
      vendor: ing.vendor,
      unit: ing.unit,
      unitPrice: ing.unitPrice
    });
    setEditingIngredient(null);
  };

  const removeIngredient = (id) => {
    setRecipeForm({
      ...recipeForm,
      ingredients: recipeForm.ingredients.filter(ing => ing.id !== id)
    });
  };

  const addInstruction = () => {
    setRecipeForm({
      ...recipeForm,
      instructions: [...recipeForm.instructions, { id: Date.now(), title: '', details: '' }]
    });
  };

  const updateInstruction = (id, field, value) => {
    setRecipeForm({
      ...recipeForm,
      instructions: recipeForm.instructions.map(inst =>
        inst.id === id ? { ...inst, [field]: value } : inst
      )
    });
  };

  const removeInstruction = (id) => {
    setRecipeForm({
      ...recipeForm,
      instructions: recipeForm.instructions.filter(inst => inst.id !== id)
    });
  };

  const calculateTotalCost = () => {
    return recipeForm.ingredients.reduce((sum, ing) => sum + (parseFloat(ing.epCost) || 0), 0);
  };

  const calculateCostPerPortion = () => {
    const total = calculateTotalCost();
    return recipeForm.yield > 0 ? (total / recipeForm.yield) : 0;
  };

  const calculateMenuPrice = () => {
    return (calculateCostPerPortion() / 0.35).toFixed(2);
  };

  const saveRecipe = () => {
    const recipe = {
      id: currentRecipe?.id || `RECIPE-${Date.now()}`,
      ...recipeForm,
      totalCost: calculateTotalCost(),
      costPerPortion: calculateCostPerPortion(),
      suggestedMenuPrice: calculateMenuPrice(),
      createdDate: currentRecipe?.createdDate || new Date().toISOString(),
      updatedDate: new Date().toISOString()
    };
    const updated = currentRecipe
      ? recipes.map(r => r.id === currentRecipe.id ? recipe : r)
      : [...recipes, recipe];
    saveRecipes(updated);
    setView('list');
    resetForm();
  };

  const resetForm = () => {
    setRecipeForm({
      name: '', category: '', yield: 10, portionSize: '', prepTime: '',
      cookTime: '', holdingStyle: '', allergens: [], equipment: [],
      ingredients: [], instructions: []
    });
    setCurrentRecipe(null);
    setIngredientSearch('');
    setEditingIngredient(null);
  };

  const editRecipe = (recipe) => {
    setCurrentRecipe(recipe);
    setRecipeForm({
      ...recipe,
      allergens: recipe.allergens || [],
      equipment: recipe.equipment || [],
      ingredients: recipe.ingredients || [],
      instructions: recipe.instructions || []
    });
    setView('edit');
  };

  const filteredIngredients = availableIngredients.filter(ing =>
    ing.name.toLowerCase().includes(ingredientSearch.toLowerCase()) ||
    (ing.category && ing.category.toLowerCase().includes(ingredientSearch.toLowerCase()))
  );

  const allergenOptions = ['Dairy', 'Eggs', 'Fish', 'Shellfish', 'Tree Nuts', 'Peanuts', 'Wheat/Gluten', 'Soy', 'Sesame'];
  const categoryOptions = ['Soup', 'Salad', 'Appetizer', 'Entrée', 'Side Dish', 'Sauce', 'Dessert', 'Beverage', 'Condiment', 'CUL163'];

  const categories = [...new Set(recipes.map(r => r.category))].sort();
  const subcategories = selectedCategory === 'all' ? [] : [...new Set(recipes.filter(r => r.category === selectedCategory).map(r => r.subcategory))].filter(Boolean).sort();
  const filteredRecipes = recipes.filter(r => { if (selectedCategory !== 'all' && r.category !== selectedCategory) return false; if (selectedSubcategory !== 'all' && r.subcategory !== selectedSubcategory) return false; return true; });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-blue-800">Standardized Recipes</h1>
              <p className="text-gray-600 mt-1">Professional Recipe Development with Auto-Costing</p>
            </div>
            <button onClick={() => { resetForm(); setView('edit'); }} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
              <Plus size={20} />New Recipe
            </button>
          </div>
        </div>

        {view === 'list' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex gap-4 mb-4">
              <select value={selectedCategory} onChange={(e) => { setSelectedCategory(e.target.value); setSelectedSubcategory("all"); }} className="px-3 py-2 border rounded-lg">
                <option value="all">All Categories</option>
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
              {subcategories.length > 0 && (
                <select value={selectedSubcategory} onChange={(e) => setSelectedSubcategory(e.target.value)} className="px-3 py-2 border rounded-lg">
                  <option value="all">All Weeks</option>
                  {subcategories.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                </select>
              )}
              <span className="text-gray-500 self-center">{filteredRecipes.length} recipes</span>
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-4">All Recipes ({recipes.length})</h2>
            {filteredRecipes.length === 0 ? (
              <div className="text-center py-12 text-gray-500"><p>No recipes yet. Create your first standardized recipe.</p></div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredRecipes.map(recipe => (
                  <div key={recipe.id} onClick={() => editRecipe(recipe)} className="border rounded-lg p-4 hover:border-blue-500 cursor-pointer">
                    <h3 className="font-bold text-lg mb-2">{recipe.name}</h3>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p><span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">{recipe.category}</span></p>
                      <p className="flex items-center gap-2"><Users size={14} />Yield: {recipe.yield} portions @ {recipe.portionSize}</p>
                      <p className="flex items-center gap-2"><Clock size={14} />Prep: {recipe.prepTime} | Cook: {recipe.cookTime}</p>
                      <p className="flex items-center gap-2"><DollarSign size={14} />Cost/Portion: ${recipe.costPerPortion?.toFixed(2)}</p>
                      {!recipe.isSubRecipe && <p className="text-green-600 font-medium">Menu Price: ${recipe.suggestedMenuPrice} ({recipe.foodCostPercent ? recipe.foodCostPercent + "% FC" : "35% FC"})</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {view === 'edit' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex gap-4 mb-4">
              <select value={selectedCategory} onChange={(e) => { setSelectedCategory(e.target.value); setSelectedSubcategory("all"); }} className="px-3 py-2 border rounded-lg">
                <option value="all">All Categories</option>
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
              {subcategories.length > 0 && (
                <select value={selectedSubcategory} onChange={(e) => setSelectedSubcategory(e.target.value)} className="px-3 py-2 border rounded-lg">
                  <option value="all">All Weeks</option>
                  {subcategories.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                </select>
              )}
              <span className="text-gray-500 self-center">{filteredRecipes.length} recipes</span>
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-6">{currentRecipe ? 'Edit Recipe' : 'Create New Recipe'}</h2>

            <div className="mb-6">
              <h3 className="font-semibold text-gray-700 mb-3">Recipe Header</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Recipe Name *</label>
                  <input type="text" value={recipeForm.name} onChange={(e) => setRecipeForm({ ...recipeForm, name: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="e.g., Tomato Basil Soup" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                  <select value={recipeForm.category} onChange={(e) => setRecipeForm({ ...recipeForm, category: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                    <option value="">Select Category</option>
                    {categoryOptions.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Yield</label>
                  <input type="number" value={recipeForm.yield} onChange={(e) => setRecipeForm({ ...recipeForm, yield: parseInt(e.target.value) || 10 })} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Portion Size</label>
                  <input type="text" value={recipeForm.portionSize} onChange={(e) => setRecipeForm({ ...recipeForm, portionSize: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="e.g., 6 oz" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prep Time</label>
                  <input type="text" value={recipeForm.prepTime} onChange={(e) => setRecipeForm({ ...recipeForm, prepTime: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="e.g., 15 min" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cook Time</label>
                  <input type="text" value={recipeForm.cookTime} onChange={(e) => setRecipeForm({ ...recipeForm, cookTime: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="e.g., 45 min" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Equipment</label>
                  <input type="text" value={recipeForm.equipment.join(', ')} onChange={(e) => setRecipeForm({ ...recipeForm, equipment: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} className="w-full px-3 py-2 border rounded-lg" placeholder="e.g., Tilt skillet, Oven" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Allergens</label>
                  <div className="flex flex-wrap gap-2">
                    {allergenOptions.map(allergen => (
                      <label key={allergen} className="flex items-center gap-2 px-3 py-1 border rounded cursor-pointer hover:bg-gray-50">
                        <input type="checkbox" checked={recipeForm.allergens.includes(allergen)} onChange={(e) => {
                          if (e.target.checked) setRecipeForm({ ...recipeForm, allergens: [...recipeForm.allergens, allergen] });
                          else setRecipeForm({ ...recipeForm, allergens: recipeForm.allergens.filter(a => a !== allergen) });
                        }} />
                        <span className="text-sm">{allergen}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold text-gray-700 mb-3">Ingredients ({availableIngredients.length} available)</h3>
              <div className="mb-4 relative">
                {replacingIngredient && (
                  <div className="mb-2 p-2 bg-orange-100 border border-orange-300 rounded-lg flex justify-between items-center">
                    <span className="text-orange-700">Replacing: <strong>{replacingIngredient.name}</strong> - Search for new ingredient</span>
                    <button onClick={() => setReplacingIngredient(null)} className="text-orange-700 hover:text-orange-900"><X size={16} /></button>
                  </div>
                )}
                <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                <input type="text" value={ingredientSearch} onChange={(e) => setIngredientSearch(e.target.value)} className="w-full pl-10 pr-3 py-2 border rounded-lg" placeholder="Search ingredients..." />
                {ingredientSearch && (
                  <div className="mt-2 border rounded-lg max-h-60 overflow-y-auto absolute bg-white w-full z-10 shadow-lg">
                    {filteredIngredients.length === 0 ? (
                      <p className="p-4 text-gray-500 text-center">No ingredients found</p>
                    ) : (
                      filteredIngredients.slice(0, 20).map(ing => (
                        <div key={ing.id} onClick={() => addIngredientToRecipe(ing)} className="p-3 hover:bg-blue-50 cursor-pointer border-b">
                          <div className="flex justify-between">
                            <div>
                              <p className="font-medium">{ing.name}</p>
                              <p className="text-xs text-gray-500">{ing.vendor || 'Sysco'} • {ing.syscoCode || ing.vendorCode || 'N/A'}</p>
                            </div>
                            <div className="text-right text-sm">
                              <p>${(ing.unitPrice || 0).toFixed(2)}/{ing.unit}</p>
                              <p className="text-xs text-gray-500">{ing.category}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="text-left px-3 py-2">Ingredient</th>
                    <th className="text-left px-3 py-2">Vendor</th>
                    <th className="text-left px-3 py-2">Code</th>
                    <th className="text-left px-3 py-2">Pack Size</th>
                    <th className="text-left px-3 py-2">Amount</th>
                    <th className="text-left px-3 py-2">Unit</th>
                    <th className="text-left px-3 py-2">$/Unit</th>
                    <th className="text-left px-3 py-2">Cost</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {recipeForm.ingredients.map(ing => (
                    <tr key={ing.id} className="border-t">
                      <td className="px-3 py-2">
                        {editingIngredient === ing.id ? (
                          <input type="text" value={ing.name} onChange={(e) => updateIngredient(ing.id, 'name', e.target.value)} className="w-full px-2 py-1 border rounded text-sm" />
                        ) : <span className="font-medium">{ing.name}</span>}
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-600">{ing.vendor}</td>
                      <td className="px-3 py-2 text-xs text-gray-500">{ing.vendorCode || "-"}</td>
                      <td className="px-3 py-2 text-xs text-gray-500">{ing.packSize || "-"}</td>
                      <td className="px-3 py-2">
                        <input type="number" step="0.01" value={ing.amount} onChange={(e) => updateIngredient(ing.id, 'amount', e.target.value)} className="w-16 px-2 py-1 border rounded" />
                      </td>
                      <td className="px-3 py-2">{ing.unit}</td>
                      <td className="px-3 py-2">${parseFloat(ing.unitPrice || 0).toFixed(2)}/{ing.unit}</td>
                      <td className="px-3 py-2 font-semibold text-green-600">${ing.epCost || '0.00'}</td>
                      <td className="px-3 py-2 flex gap-1">
                        {editingIngredient === ing.id ? (
                          <button onClick={() => saveIngredientChangesToMaster(ing)} className="text-green-600"><Check size={16} /></button>
                        ) : (
                          <><button onClick={() => setReplacingIngredient(ing)} className="text-orange-500" title="Replace ingredient"><RefreshCw size={16} /></button>
                          <button onClick={() => setEditingIngredient(ing.id)} className="text-blue-600"><Edit2 size={16} /></button></>
                        )}
                        <button onClick={() => removeIngredient(ing.id)} className="text-red-600"><X size={16} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="mt-4 bg-blue-50 rounded-lg p-4 grid grid-cols-3 gap-4 text-sm">
                <div><p className="text-gray-600">Total Cost:</p><p className="text-2xl font-bold text-blue-800">${calculateTotalCost().toFixed(2)}</p></div>
                <div><p className="text-gray-600">Cost/Portion:</p><p className="text-2xl font-bold text-blue-800">${calculateCostPerPortion().toFixed(2)}</p></div>
                <div><p className="text-gray-600">Menu Price:</p><p className="text-2xl font-bold text-green-600">${calculateMenuPrice()}</p></div>
              </div>
            </div>

            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-gray-700">Instructions</h3>
                <button onClick={addInstruction} className="px-3 py-1 bg-blue-600 text-white rounded text-sm flex items-center gap-1"><Plus size={16} />Add Step</button>
              </div>
              {recipeForm.instructions.map((inst, idx) => (
                <div key={inst.id} className="border rounded-lg p-4 mb-3">
                  <div className="flex justify-between mb-2">
                    <span className="font-bold text-blue-700">Step {idx + 1}</span>
                    <button onClick={() => removeInstruction(inst.id)} className="text-red-600"><X size={16} /></button>
                  </div>
                  <input type="text" value={inst.title} onChange={(e) => updateInstruction(inst.id, 'title', e.target.value)} className="w-full px-3 py-2 border rounded-lg mb-2" placeholder="Step title" />
                  <textarea value={inst.details} onChange={(e) => updateInstruction(inst.id, 'details', e.target.value)} className="w-full px-3 py-2 border rounded-lg" rows={2} placeholder="Details..." />
                </div>
              ))}
            </div>

            <div className="flex gap-3 justify-end">
              <button onClick={() => { setView('list'); resetForm(); }} className="px-4 py-2 border rounded-lg">Cancel</button>
              <button onClick={saveRecipe} className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2"><Save size={20} />Save Recipe</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StandardizedRecipePage;
