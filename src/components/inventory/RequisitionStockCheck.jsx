import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function RequisitionStockCheck({ items = [], onClose, onAdjust }) {
  const [stockLevels, setStockLevels] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStockLevels();
  }, [items]);

  async function loadStockLevels() {
    if (!items.length) { setLoading(false); return; }
    setLoading(true);
    const ingredientIds = items.map(i => i.ingredient_id).filter(Boolean);
    const { data, error } = await supabase.from('inventory_current').select('*').in('ingredient_id', ingredientIds);
    if (!error && data) {
      const stockMap = {};
      data.forEach(s => { stockMap[s.ingredient_id] = s; });
      setStockLevels(stockMap);
    }
    setLoading(false);
  }

  const inStock = [], lowStock = [], noStock = [], expiringSoon = [];

  items.forEach(item => {
    const stock = stockLevels[item.ingredient_id];
    if (!stock || stock.quantity === 0) {
      noStock.push({ ...item, stock: null });
    } else {
      const isExpiring = stock.expiration_date && new Date(stock.expiration_date) <= new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
      if (isExpiring) { expiringSoon.push({ ...item, stock }); }
      else if (stock.quantity < item.quantity) { lowStock.push({ ...item, stock }); }
      else { inStock.push({ ...item, stock }); }
    }
  });

  const itemsWithStock = items.filter(i => stockLevels[i.ingredient_id]?.quantity > 0);

  return (
    <div className="bg-white rounded-xl shadow-lg border overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-3">
        <div className="flex items-center justify-between">
          <div><h2 className="font-semibold text-lg">📦 Stock Check</h2><p className="text-blue-100 text-sm">Review inventory before ordering</p></div>
          {onClose && <button onClick={onClose} className="text-white hover:bg-white/20 rounded-lg p-2">✕</button>}
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div><p className="mt-2 text-gray-500">Checking inventory...</p></div>
      ) : (
        <>
          <div className="grid grid-cols-4 gap-px bg-gray-200 border-b">
            <div className="bg-green-50 p-3 text-center"><div className="text-2xl font-bold text-green-600">{inStock.length}</div><div className="text-xs text-green-700">In Stock</div></div>
            <div className="bg-yellow-50 p-3 text-center"><div className="text-2xl font-bold text-yellow-600">{lowStock.length}</div><div className="text-xs text-yellow-700">Low Stock</div></div>
            <div className="bg-orange-50 p-3 text-center"><div className="text-2xl font-bold text-orange-600">{expiringSoon.length}</div><div className="text-xs text-orange-700">Use First</div></div>
            <div className="bg-gray-50 p-3 text-center"><div className="text-2xl font-bold text-gray-600">{noStock.length}</div><div className="text-xs text-gray-700">No Stock</div></div>
          </div>

          {itemsWithStock.length > 0 && (
            <div className="bg-green-50 border-b border-green-200 px-4 py-3">
              <div className="flex items-center gap-2 text-green-800"><span className="text-xl">💡</span><span className="font-medium">{itemsWithStock.length} item(s) available in inventory</span></div>
              <p className="text-sm text-green-700 mt-1 ml-7">Consider using existing stock before ordering more</p>
            </div>
          )}

          <div className="max-h-[400px] overflow-y-auto">
            {expiringSoon.length > 0 && (
              <div className="border-b">
                <div className="bg-orange-100 px-4 py-2 text-sm font-medium text-orange-800 sticky top-0">🟠 Use First - Expiring Soon</div>
                {expiringSoon.map((item, idx) => <StockCheckRow key={idx} item={item} onAdjust={onAdjust} type="expiring" />)}
              </div>
            )}
            {inStock.length > 0 && (
              <div className="border-b">
                <div className="bg-green-100 px-4 py-2 text-sm font-medium text-green-800 sticky top-0">✓ In Stock - Review Quantity</div>
                {inStock.map((item, idx) => <StockCheckRow key={idx} item={item} onAdjust={onAdjust} type="instock" />)}
              </div>
            )}
            {lowStock.length > 0 && (
              <div className="border-b">
                <div className="bg-yellow-100 px-4 py-2 text-sm font-medium text-yellow-800 sticky top-0">📉 Low Stock - Partial Available</div>
                {lowStock.map((item, idx) => <StockCheckRow key={idx} item={item} onAdjust={onAdjust} type="low" />)}
              </div>
            )}
            {noStock.length > 0 && (
              <div>
                <div className="bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 sticky top-0">📦 Not in Inventory</div>
                {noStock.map((item, idx) => <StockCheckRow key={idx} item={item} onAdjust={onAdjust} type="none" />)}
              </div>
            )}
          </div>

          <div className="bg-gray-50 px-4 py-3 border-t flex justify-between items-center">
            <div className="text-sm text-gray-500">{items.length} items in requisition</div>
            {onClose && <button onClick={onClose} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium">Done</button>}
          </div>
        </>
      )}
    </div>
  );
}

function StockCheckRow({ item, onAdjust, type }) {
  const stock = item.stock;
  const needToOrder = stock ? Math.max(0, item.quantity - stock.quantity) : item.quantity;
  
  return (
    <div className="px-4 py-3 hover:bg-gray-50 flex items-center gap-4 border-b border-gray-100 last:border-0">
      <div className="flex-1 min-w-0">
        <div className="font-medium text-gray-900 truncate">{item.ingredient_name || item.name}</div>
        <div className="text-sm text-gray-500">Requesting: {item.quantity} {item.unit || 'ea'}</div>
      </div>
      <div className="text-right">
        {stock ? (
          <>
            <div className="font-semibold text-gray-900">{stock.quantity} {stock.unit} in stock</div>
            <div className="text-xs text-gray-500">📍 {stock.location_code}</div>
            {stock.expiration_date && <div className={`text-xs ${type === 'expiring' ? 'text-orange-600 font-medium' : 'text-gray-400'}`}>Exp: {new Date(stock.expiration_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>}
          </>
        ) : <div className="text-gray-400">—</div>}
      </div>
      <div className="w-32 text-right">
        {type === 'instock' && stock?.quantity >= item.quantity && (
          <div className="text-green-600 text-sm">
            <div className="font-medium">May not need</div>
            {onAdjust && <button onClick={() => onAdjust(item.ingredient_id, 0)} className="text-xs text-green-700 hover:underline">Set to 0</button>}
          </div>
        )}
        {type === 'low' && (
          <div className="text-yellow-600 text-sm">
            <div className="font-medium">Order {needToOrder}</div>
            {onAdjust && <button onClick={() => onAdjust(item.ingredient_id, needToOrder)} className="text-xs text-yellow-700 hover:underline">Adjust qty</button>}
          </div>
        )}
        {type === 'expiring' && <div className="text-orange-600 text-sm font-medium">Use existing first</div>}
        {type === 'none' && <div className="text-gray-400 text-sm">Order all</div>}
      </div>
    </div>
  );
}

export function StockCheckButton({ itemCount, onClick }) {
  return (
    <button onClick={onClick} className="flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-medium transition-colors">
      <span>📦</span><span>Check Stock</span>
      {itemCount > 0 && <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">{itemCount}</span>}
    </button>
  );
}
