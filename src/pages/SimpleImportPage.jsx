import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { bakingIngredientsList, savoryIngredientsList } from '../data/ingredients/ingredientsList';

export default function SimpleImportPage() {
  const [jsonText, setJsonText] = useState('');
  const [status, setStatus] = useState(null);
  const navigate = useNavigate();
  
  const allIngredients = [...bakingIngredientsList, ...savoryIngredientsList];

  const findIngredient = (name) => {
    return allIngredients.find(ing => 
      ing.name.toLowerCase() === name.toLowerCase()
    );
  };

  const handleImport = () => {
    try {
      const data = JSON.parse(jsonText);
      const requisitions = data.requisitions || [data];
      
      const existingOrders = JSON.parse(localStorage.getItem('instructorOrders') || '[]');
      
      requisitions.forEach(req => {
        const items = req.items.map(item => {
          const dbIngredient = findIngredient(item.ingredient || item.name);
          const unitCost = dbIngredient?.unitPrice || item.unitCost || 0;
          const quantity = item.quantity || 0;
          
          return {
            id: dbIngredient?.id || `CUSTOM-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: item.ingredient || item.name,
            unit: item.unit || dbIngredient?.unit || 'ea',
            quantity: quantity,
            unitCost: unitCost,
            extended: quantity * unitCost,
            isCustom: !dbIngredient
          };
        }).filter(item => item.quantity > 0);

        const total = items.reduce((sum, item) => sum + item.extended, 0);
        const budget = req.budget || 500;

        const newRequisition = {
          instructor: req.instructor || 'Unknown',
          week: req.date || req.week || 'Week 1',
          program: req.program || 'Culinary Arts',
          course: req.class || req.course || 'CUL100',
          recipes: req.notes || req.recipes || '',
          budget: budget,
          total: total,
          balance: budget - total,
          items: items,
          timestamp: new Date().toISOString()
        };

        existingOrders.unshift(newRequisition);
      });

      localStorage.setItem('instructorOrders', JSON.stringify(existingOrders));
      setStatus({ type: 'success', message: `Successfully imported ${requisitions.length} requisition(s)!` });
      
      setTimeout(() => navigate('/instructor/my-requisitions'), 1500);
    } catch (error) {
      setStatus({ type: 'error', message: `Error: ${error.message}` });
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setJsonText(event.target.result);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-6">Quick Import Requisitions</h1>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Upload JSON File</label>
          <input type="file" accept=".json" onChange={handleFileUpload} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Or Paste JSON</label>
          <textarea value={jsonText} onChange={(e) => setJsonText(e.target.value)} placeholder='{"requisitions": [{"instructor": "Name", "items": [...]}]}' className="w-full h-64 px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm" />
        </div>

        {status && (
          <div className={`mb-4 p-3 rounded-lg ${status.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{status.message}</div>
        )}

        <div className="flex gap-3">
          <button onClick={handleImport} disabled={!jsonText.trim()} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">Import Requisitions</button>
          <button onClick={() => navigate('/instructor/my-requisitions')} className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600">Cancel</button>
        </div>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold mb-2">Expected JSON Format:</h3>
          <pre className="text-xs overflow-x-auto">{`{
  "requisitions": [{
    "instructor": "Cabrera",
    "class": "CUL130",
    "date": "Week 7",
    "budget": 500,
    "items": [
      {"ingredient": "Yellow Onion", "quantity": 12, "unit": "lb"},
      {"ingredient": "Garlic Bulb", "quantity": 6, "unit": "ea"}
    ]
  }]
}`}</pre>
        </div>
      </div>
    </div>
  );
}
