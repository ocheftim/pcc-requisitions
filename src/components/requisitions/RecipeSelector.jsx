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
  initialRecipeNames = '',  // Comma-separated recipe names from requisition
  initialRecipes = []
}) {
  const [availableRecipes, setAvailableRecipes] = useState([]);
  const [selectedRecipes, setSelectedRecipes] = useState(initialRecipes);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddRecipe, setShowAddRecipe] = useState(false);
  const [autoLoaded, setAutoLoaded] = useState(false);

  // Fetch recipes when course changes
  useEffect(() => {
    if (!courseCode) {
      setAvailableRecipes([]);
      return;
    }

    const fetchRecipes = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('recipes')
          .select('id, name, yield_amount, yield_unit, ingredients, category')
          .eq('course', courseCode)
          .eq('active', true)
          .order('name');

        if (error) throw error;
        setAvailableRecipes(data || []);
        
        // Auto-match recipes from initialRecipeNames
        if (data && initialRecipeNames && !autoLoaded) {
          const recipeNames = initialRecipeNames.split(',').map(n => n.trim().toLowerCase());
          const matched = [];
          
          recipeNames.forEach(name => {
            if (!name) return;
            // Find best match
            const exactMatch = data.find(r => r.name.toLowerCase() === name);
            if (exactMatch) {
              matched.push({
                id: exactMatch.id,
                name: exactMatch.name,
                yield_amount: exactMatch.yield_amount || 1,
                yield_unit: exactMatch.yield_unit || 'batch',
                ingredients: exactMatch.ingredients || [],
                category: exactMatch.category,
                scale_factor: 1,
                production_method: 'pairs',
                num_batches: calculateBatches('pairs', studentCount)
              });
            } else {
              // Try partial match
              const partialMatch = data.find(r => 
                r.name.toLowerCase().includes(name) || 
                name.includes(r.name.toLowerCase())
              );
              if (partialMatch && !matched.find(m => m.id === partialMatch.id)) {
                matched.push({
                  id: partialMatch.id,
                  name: partialMatch.name,
                  yield_amount: partialMatch.yield_amount || 1,
                  yield_unit: partialMatch.yield_unit || 'batch',
                  ingredients: partialMatch.ingredients || [],
                  category: partialMatch.category,
                  scale_factor: 1,
                  production_method: 'pairs',
                  num_batches: calculateBatches('pairs', studentCount)
                });
              }
            }
          });
          
          if (matched.length > 0) {
            setSelectedRecipes(matched);
            setAutoLoaded(true);
          }
        }
      } catch (err) {
        console.error('Error fetching recipes:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecipes();
  }, [courseCode, initialRecipeNames, autoLoaded, studentCount]);

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

  // Recalculate batches when student count changes
  useEffect(() => {
    if (selectedRecipes.length > 0) {
      setSelectedRecipes(prev => prev.map(recipe => ({
        ...recipe,
        num_batches: calculateBatches(recipe.production_method, studentCount)
      })));
    }
  }, [studentCount]);

  // Aggregate ingredients
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

  // Notify parent of changes
  useEffect(() => {
    if (onIngredientsChange) {
      onIngredientsChange(aggregatedIngredients);
    }
    if (onRecipesChange) {
      onRecipesChange(selectedRecipes);
    }
  }, [aggregatedIngredients, selectedRecipes, onIngredientsChange, onRecipesChange]);

  // Filter available recipes
  const filteredAvailable = availableRecipes.filter(r => 
    !selectedRecipes.find(s => s.id === r.id) &&
    r.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!courseCode) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 text-gray-500 text-center">
        Select a class to view available recipes
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-blue-800">
          Lab Recipes
          {selectedRecipes.length > 0 && (
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({selectedRecipes.length} selected)
            </span>
          )}
        </h3>
        <button
          onClick={() => setShowAddRecipe(!showAddRecipe)}
          className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 flex items-center gap-1"
        >
          {showAddRecipe ? '✕ Close' : '+ Add Recipe'}
        </button>
      </div>

      {/* Add Recipe Panel */}
      {showAddRecipe && (
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

      {/* Selected Recipes Table */}
      {selectedRecipes.length === 0 ? (
        <div className="text-gray-500 text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
          {loading ? 'Loading recipes...' : 'No recipes matched. Click "Add Recipe" to add manually.'}
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
                <th className="text-center px-3 py-2 font-medium text-gray-600 w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {selectedRecipes.map(recipe => (
                <tr key={recipe.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2">
                    <div className="font-medium text-gray-800">{recipe.name}</div>
                    <div className="text-xs text-gray-500">
                      {recipe.ingredients?.length || 0} ingredients
                    </div>
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
                  <td className="px-3 py-2 text-center">
                    <button
                      onClick={() => removeRecipe(recipe.id)}
                      className="text-red-500 hover:text-red-700 text-lg"
                      title="Remove recipe"
                    >
                      ×
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Ingredients Summary */}
      {aggregatedIngredients.length > 0 && (
        <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
          <h4 className="font-medium text-green-800 mb-2">
            Calculated Ingredients ({aggregatedIngredients.length} items)
          </h4>
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
