import React from 'react';
import { getShamrockProduct, convertToVendorUnits } from '../data/shamrockMapping';
import { scaleRecipe } from '../data/quickBreadsRecipes';

function RecipeCard({ recipe, isSelected, onToggle, servingsNeeded }) {
  // Calculate scaled recipe and cost
  const scaledRecipe = scaleRecipe(recipe, servingsNeeded);
  
  const recipeCost = scaledRecipe.ingredients.reduce((sum, ing) => {
    const shamrockProduct = getShamrockProduct(ing.shamrockCode);
    if (!shamrockProduct) return sum;
    
    const vendorQty = convertToVendorUnits(ing.scaledQuantity, ing.unit, shamrockProduct);
    return sum + (vendorQty * shamrockProduct.unitPrice);
  }, 0);

  return (
    <div
      onClick={onToggle}
      className={`
        relative p-5 rounded-lg border-2 cursor-pointer transition-all duration-200
        ${isSelected
          ? 'bg-blue-50 border-blue-400 shadow-md'
          : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-sm'
        }
      `}
    >
      {/* Selection Checkbox */}
      <div className="absolute top-4 left-4">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => {}}
          className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Content */}
      <div className="ml-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {recipe.name}
        </h3>
        
        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
          <div className="flex items-center gap-1">
            <span className="font-medium">Servings:</span>
            <span>{recipe.servings} → {servingsNeeded}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-medium">Scale:</span>
            <span>{scaledRecipe.scaleFactor.toFixed(1)}×</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
          <span className="text-sm font-medium text-gray-700">
            {scaledRecipe.ingredients.length} ingredients
          </span>
          <span className="text-lg font-bold text-blue-600">
            ${recipeCost.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Selected Badge */}
      {isSelected && (
        <div className="absolute top-4 right-4">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-600 text-white">
            Selected
          </span>
        </div>
      )}
    </div>
  );
}

export default RecipeCard;
