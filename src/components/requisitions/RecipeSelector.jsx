import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase';

const SCALE_OPTIONS = [
  { value: 0.25, label: '¼x' },
  { value: 0.5, label: '½x' },
  { value: 0.75, label: '¾x' },
  { value: 1, label: '1x' },
  { value: 1.5, label: '1½x' },
  { value: 2, label: '2x' },
];

const PRODUCTION_METHODS = [
  { id: 'demo', label: 'Demo', groupSize: null },
  { id: 'individual', label: 'Individual', groupSize: 1 },
  { id: 'pairs', label: 'Pairs', groupSize: 2 },
  { id: 'groups_3', label: 'Groups of 3', groupSize: 3 },
  { id: 'groups_4', label: 'Groups of 4', groupSize: 4 },
];

export default function RecipeSelector({ 
  courseCode, 
  studentCount = 14,
  onIngredientsChange,
  onRecipesChange,
  onApplyIngredients,
  moduleNumber = null,
  isEditing = false,
  hideNav = false,
  initialRecipes = []
}) {
  const [availableRecipes, setAvailableRecipes] = useState([]);
  const [selectedRecipes, setSelectedRecipes] = useState(initialRecipes);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddRecipe, setShowAddRecipe] = useState(false);
  const [expandedRecipeId, setExpandedRecipeId] = useState(null);

  // Fetch recipes filtered by course AND module
  useEffect(() => {
    if (!courseCode) {
      setAvailableRecipes([]);
      setSelectedRecipes([]);
      return;
    }

    const fetchRecipes = async () => {
      setLoading(true);
      try {
        let query = supabase
          .from('recipes')
          .select('id, name, yield_amount, yield_unit, ingredients, category, module')
          .eq('course', courseCode)
          .eq('active', true);
        
        if (moduleNumber) {
          query = query.eq('module', moduleNumber);
        }
        
        const { data, error } = await query.order('name');

        if (error) throw error;
        
        if (data && data.length > 0 && moduleNumber) {
          const autoSelected = data.map(recipe => ({
            id: recipe.id,
            name: recipe.name,
            yield_amount: recipe.yield_amount || 1,
            yield_unit: recipe.yield_unit || 'batch',
            ingredients: recipe.ingredients || [],
            category: recipe.category,
            scale_factor: 1,
            production_method: 'demo',
            num_batches: 1
          }));
          setSelectedRecipes(autoSelected);
          
          // Auto-apply ingredients when editing module-based requisition
          if (isEditing && onApplyIngredients) {
            const aggregated = [];
            const ingredientMap = new Map();
            autoSelected.forEach(recipe => {
              (recipe.ingredients || []).forEach(ing => {
                const key = `${ing.name}-${ing.unit}`.toLowerCase();
                if (ingredientMap.has(key)) {
                  ingredientMap.get(key).quantity += (ing.quantity || 0);
                } else {
                  ingredientMap.set(key, { name: ing.name, unit: ing.unit, quantity: ing.quantity || 0 });
                }
              });
            });
            onApplyIngredients(Array.from(ingredientMap.values()));
          }
        }
        
        setAvailableRecipes(data || []);
      } catch (err) {
        console.error('Error fetching recipes:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecipes();
  }, [courseCode, moduleNumber]);

  const calculateBatches = (method, students) => {
    const methodConfig = PRODUCTION_METHODS.find(m => m.id === method);
    if (!methodConfig || method === 'demo') return 1;
    return Math.ceil(students / methodConfig.groupSize);
  };

  const addRecipe = (recipe) => {
    if (selectedRecipes.find(r => r.id === recipe.id)) return;
    
    const newRecipe = {
      id: recipe.id,
      name: recipe.name,
      yield_amount: recipe.yield_amount || 1,
      yield_unit: recipe.yield_unit || 'batch',
      ingredients: recipe.ingredients || [],
      category: recipe.category,
      scale_factor: 1,
      production_method: 'pairs',
      num_batches: calculateBatches('pairs', studentCount)
    };
    
    setSelectedRecipes(prev => [...prev, newRecipe]);
  };

  const removeRecipe = (recipeId) => {
    setSelectedRecipes(prev => prev.filter(r => r.id !== recipeId));
  };

  const updateRecipe = (recipeId, field, value) => {
    setSelectedRecipes(prev => prev.map(recipe => {
      if (recipe.id !== recipeId) return recipe;
      
      const updated = { ...recipe, [field]: value };
      
      if (field === 'production_method') {
        updated.num_batches = calculateBatches(value, studentCount);
      }
      
      return updated;
    }));
  };

  useEffect(() => {
    if (selectedRecipes.length > 0) {
      setSelectedRecipes(prev => prev.map(recipe => ({
        ...recipe,
        num_batches: calculateBatches(recipe.production_method, studentCount)
      })));
    }
  }, [studentCount]);

  const aggregatedIngredients = useMemo(() => {
    const ingredientMap = new Map();

    selectedRecipes.forEach(recipe => {
      const multiplier = recipe.scale_factor * recipe.num_batches;
      
      (recipe.ingredients || []).forEach(ing => {
        const key = `${ing.name}-${ing.unit}`.toLowerCase();
        const scaledQty = (ing.quantity || 0) * multiplier;
        
        if (ingredientMap.has(key)) {
          const existing = ingredientMap.get(key);
          existing.quantity += scaledQty;
          existing.sources.push({ recipe: recipe.name, qty: scaledQty });
        } else {
          ingredientMap.set(key, {
            name: ing.name,
            unit: ing.unit,
            quantity: scaledQty,
            sources: [{ recipe: recipe.name, qty: scaledQty }]
          });
        }
      });
    });

    return Array.from(ingredientMap.values());
  }, [selectedRecipes]);

  useEffect(() => {
    if (onIngredientsChange) {
      onIngredientsChange(aggregatedIngredients);
    }
    if (onRecipesChange) {
      onRecipesChange(selectedRecipes);
    }
  }, [aggregatedIngredients, selectedRecipes]);

  const filteredAvailable = availableRecipes.filter(r => 
    !selectedRecipes.find(s => s.id === r.id) &&
    r.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleApplyIngredients = () => {
    if (onApplyIngredients && aggregatedIngredients.length > 0) {
      onApplyIngredients(aggregatedIngredients);
    }
  };

  if (!courseCode) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 text-gray-500 text-center">
        Select a class to view available recipes
      </div>
    );
  }

  if (isEditing && moduleNumber === null) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 text-gray-500 text-center">
        Loading module recipes...
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-blue-800">
          Lab Recipes {moduleNumber && <span className="text-sm font-normal text-gray-500">(Module {moduleNumber})</span>}
          {selectedRecipes.length > 0 && (
            <span className="ml-2 text-sm font-normal text-gray-500">
              - {selectedRecipes.length} recipe{selectedRecipes.length > 1 ? 's' : ''}
            </span>
          )}
        </h3>
        {!moduleNumber && (
          <button
            onClick={() => setShowAddRecipe(!showAddRecipe)}
            className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 flex items-center gap-1"
          >
            {showAddRecipe ? '✕ Close' : '+ Add Recipe'}
          </button>
        )}
      </div>

      {showAddRecipe && !moduleNumber && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <input
            type="text"
            placeholder="Search recipes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2 focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
          {loading ? (
            <div className="text-gray-500 text-center py-2">Loading recipes...</div>
          ) : filteredAvailable.length === 0 ? (
            <div className="text-gray-500 text-center py-2">
              {availableRecipes.length === 0 
                ? `No recipes found for ${courseCode}` 
                : 'No matching recipes'}
            </div>
          ) : (
            <div className="max-h-48 overflow-y-auto">
              {filteredAvailable.map(recipe => (
                <button
                  key={recipe.id}
                  onClick={() => addRecipe(recipe)}
                  className="w-full text-left px-3 py-2 hover:bg-blue-100 rounded flex justify-between items-center"
                >
                  <div>
                    <span className="font-medium">{recipe.name}</span>
                    {recipe.category && (
                      <span className="ml-2 text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded">
                        {recipe.category}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">
                    {recipe.ingredients?.length || 0} items
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {selectedRecipes.length === 0 ? (
        <div className="text-gray-500 text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
          {loading ? 'Loading recipes...' : moduleNumber ? 'No recipes assigned to this module' : 'No recipes selected'}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-3 py-2 font-medium text-gray-600">Recipe</th>
                <th className="text-center px-3 py-2 font-medium text-gray-600 w-24">Scale</th>
                <th className="text-center px-3 py-2 font-medium text-gray-600 w-32">Method</th>
                <th className="text-center px-3 py-2 font-medium text-gray-600 w-20">Batches</th>
                {!moduleNumber && <th className="text-center px-3 py-2 font-medium text-gray-600 w-16"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {selectedRecipes.map(recipe => (
                <tr key={recipe.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-800">{recipe.name}</span>
                      <button
                        onClick={() => setExpandedRecipeId(expandedRecipeId === recipe.id ? null : recipe.id)}
                        className="text-blue-600 hover:text-blue-800 text-xs ml-2"
                      >
                        {expandedRecipeId === recipe.id ? "Hide ▲" : "View ▼"}
                      </button>
                    </div>
                    <div className="text-xs text-gray-500">
                      {recipe.ingredients?.length || 0} ingredients • Yields: {recipe.yield_amount || 1} {recipe.yield_unit || "batch"}
                    </div>
                    {expandedRecipeId === recipe.id && (
                      <div className="mt-2 p-2 bg-blue-50 rounded border text-xs">
                        <div className="font-medium text-blue-800 mb-1">Scaled Ingredients:</div>
                        {(recipe.ingredients || []).map((ing, idx) => (
                          <div key={idx} className="flex justify-between py-0.5">
                            <span>{ing.name}</span>
                            <span className="font-medium">{(ing.quantity * recipe.scale_factor * recipe.num_batches).toFixed(2)} {ing.unit}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <select
                      value={recipe.scale_factor}
                      onChange={(e) => updateRecipe(recipe.id, 'scale_factor', parseFloat(e.target.value))}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-center bg-white"
                    >
                      {SCALE_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <select
                      value={recipe.production_method}
                      onChange={(e) => updateRecipe(recipe.id, 'production_method', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded bg-white"
                    >
                      {PRODUCTION_METHODS.map(method => (
                        <option key={method.id} value={method.id}>{method.label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2 text-center font-medium text-blue-600">
                    {recipe.num_batches}
                  </td>
                  {!moduleNumber && (
                    <td className="px-3 py-2 text-center">
                      <button
                        onClick={() => removeRecipe(recipe.id)}
                        className="text-red-500 hover:text-red-700 text-lg"
                        title="Remove recipe"
                      >
                        ×
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {aggregatedIngredients.length > 0 && !hideNav && (
        <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-medium text-green-800">
              Calculated Ingredients ({aggregatedIngredients.length} items)
            </h4>
            <button
              onClick={handleApplyIngredients}
              className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700"
            >
              ✓ Use These Ingredients
            </button>
          </div>
          <div className="text-xs text-gray-600 space-y-1 max-h-32 overflow-y-auto">
            {aggregatedIngredients.slice(0, 10).map((ing, idx) => (
              <div key={idx} className="flex justify-between">
                <span>{ing.name}</span>
                <span className="text-gray-500">
                  {ing.quantity.toFixed(2)} {ing.unit}
                </span>
              </div>
            ))}
            {aggregatedIngredients.length > 10 && (
              <div className="text-gray-500 italic">
                +{aggregatedIngredients.length - 10} more items...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
