import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function StockLevelBadge({ ingredientId, ingredientName, compact = false, showLocation = false }) {
  const [stock, setStock] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (ingredientId) {
      loadStock();
    } else {
      setLoading(false);
    }
  }, [ingredientId]);

  async function loadStock() {
    setLoading(true);
    const { data, error } = await supabase
      .from('inventory_current')
      .select('quantity, unit, location_code, expiration_date, last_counted')
      .eq('ingredient_id', ingredientId)
      .single();

    if (!error && data) {
      setStock(data);
    } else {
      setStock(null);
    }
    setLoading(false);
  }

  if (loading) {
    return <span className={`inline-flex items-center ${compact ? 'text-xs' : 'text-sm'} text-gray-400`}><span className="animate-pulse">...</span></span>;
  }

  if (!stock || stock.quantity === 0) {
    return <span className={`inline-flex items-center gap-1 ${compact ? 'text-xs px-1.5 py-0.5' : 'text-sm px-2 py-1'} bg-gray-100 text-gray-500 rounded`}><span>📦</span><span>No stock</span></span>;
  }

  const isExpiringSoon = stock.expiration_date && new Date(stock.expiration_date) <= new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
  const isLowStock = stock.quantity <= 2;

  let bgColor = 'bg-green-100 text-green-700';
  let icon = '✓';
  
  if (isExpiringSoon) {
    bgColor = 'bg-orange-100 text-orange-700';
    icon = '⚠️';
  } else if (isLowStock) {
    bgColor = 'bg-yellow-100 text-yellow-700';
    icon = '📉';
  }

  return (
    <div className={`inline-flex items-center gap-1 ${compact ? 'text-xs px-1.5 py-0.5' : 'text-sm px-2 py-1'} ${bgColor} rounded`}>
      <span>{icon}</span>
      <span className="font-medium">{stock.quantity} {stock.unit || 'ea'}</span>
      {showLocation && stock.location_code && <span className="text-gray-500 ml-1">@ {stock.location_code}</span>}
      {isExpiringSoon && <span className="ml-1 text-orange-600" title="Expiring soon">(exp {new Date(stock.expiration_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})</span>}
    </div>
  );
}

export function StockLevelTooltip({ ingredientId, children }) {
  const [stock, setStock] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  async function loadStock() {
    if (stock !== null || loading) return;
    setLoading(true);
    const { data } = await supabase.from('inventory_current').select('*').eq('ingredient_id', ingredientId).single();
    setStock(data || false);
    setLoading(false);
  }

  return (
    <div className="relative inline-block" onMouseEnter={() => { setShowTooltip(true); loadStock(); }} onMouseLeave={() => setShowTooltip(false)}>
      {children}
      {showTooltip && (
        <div className="absolute z-50 bottom-full left-0 mb-2 w-64 bg-white rounded-lg shadow-xl border p-3 text-sm">
          <div className="font-semibold text-gray-900 mb-2">📦 Current Stock</div>
          {loading ? (
            <div className="text-gray-400">Loading...</div>
          ) : !stock ? (
            <div className="text-gray-500">No inventory record</div>
          ) : (
            <div className="space-y-1">
              <div className="flex justify-between"><span className="text-gray-500">Quantity:</span><span className="font-medium">{stock.quantity} {stock.unit}</span></div>
              {stock.location_code && <div className="flex justify-between"><span className="text-gray-500">Location:</span><span>{stock.location_code}</span></div>}
              {stock.expiration_date && <div className="flex justify-between"><span className="text-gray-500">Expires:</span><span>{new Date(stock.expiration_date).toLocaleDateString()}</span></div>}
              {stock.last_counted && <div className="flex justify-between"><span className="text-gray-500">Last Count:</span><span>{new Date(stock.last_counted).toLocaleDateString()}</span></div>}
              {stock.par_level && <div className="flex justify-between"><span className="text-gray-500">Par Level:</span><span>{stock.par_level} {stock.unit}</span></div>}
            </div>
          )}
          <div className="absolute top-full left-4 w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-white"></div>
        </div>
      )}
    </div>
  );
}
