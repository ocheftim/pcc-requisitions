import React from 'react';

function IngredientRow({ ingredient, quantity, isSelected, onToggle, onQuantityChange }) {
  const itemCost = quantity > 0 ? quantity * ingredient.unitPrice : 0;

  return (
    <div className={`flex items-center gap-4 p-3 border-b hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''}`}>
      <input type="checkbox" checked={isSelected} onChange={() => onToggle(ingredient.id)} className="w-5 h-5" />
      <div className="flex-1">
        <div className="font-medium text-gray-900">{ingredient.name}</div>
        <div className="text-xs text-gray-500">Code: {ingredient.shamrockCode}</div>
      </div>
      <input
        type="number"
        value={quantity || ''}
        onChange={(e) => onQuantityChange(ingredient.id, parseFloat(e.target.value) || 0)}
        placeholder="0"
        step="0.25"
        disabled={!isSelected}
        className={`w-24 px-3 py-2 text-right border rounded-lg ${isSelected ? 'border-gray-300' : 'bg-gray-100'}`}
      />
      <span className="text-sm text-gray-600 w-16">{ingredient.unit}</span>
      <div className="text-right w-20">
        <div className="text-xs text-gray-500">@ ${ingredient.unitPrice.toFixed(2)}</div>
        <div className="font-semibold">{itemCost > 0 ? `$${itemCost.toFixed(2)}` : '-'}</div>
      </div>
    </div>
  );
}

export default IngredientRow;
