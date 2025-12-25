import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';

export function useInventoryStock(ingredientIds) {
  const [stockLevels, setStockLevels] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchStock = useCallback(async () => {
    if (!ingredientIds || (Array.isArray(ingredientIds) && ingredientIds.length === 0)) { setStockLevels({}); return; }
    const ids = Array.isArray(ingredientIds) ? ingredientIds : [ingredientIds];
    const validIds = ids.filter(Boolean);
    if (validIds.length === 0) { setStockLevels({}); return; }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase.from('inventory_current').select('*').in('ingredient_id', validIds);
      if (fetchError) throw fetchError;
      const stockMap = {};
      (data || []).forEach(item => {
        stockMap[item.ingredient_id] = {
          ...item,
          isLowStock: item.par_level ? item.quantity < item.par_level : item.quantity < 2,
          isExpiring: item.expiration_date ? new Date(item.expiration_date) <= new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) : false,
          isExpired: item.expiration_date ? new Date(item.expiration_date) < new Date() : false
        };
      });
      setStockLevels(stockMap);
    } catch (err) {
      console.error('Error fetching stock:', err);
      setError(err.message);
    }
    setLoading(false);
  }, [JSON.stringify(ingredientIds)]);

  useEffect(() => { fetchStock(); }, [fetchStock]);

  return { stockLevels, loading, error, refetch: fetchStock, getStock: (id) => stockLevels[id] || null, hasStock: (id) => stockLevels[id]?.quantity > 0 };
}

export function useInventorySummary() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchSummary() {
      try {
        const { data, error: fetchError } = await supabase.from('inventory_summary').select('*').single();
        if (fetchError) throw fetchError;
        setSummary(data);
      } catch (err) { console.error('Error fetching inventory summary:', err); setError(err.message); }
      setLoading(false);
    }
    fetchSummary();
  }, []);

  return { summary, loading, error };
}

export function useExpiringItems(days = 7) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchExpiring() {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + days);
      try {
        const { data, error: fetchError } = await supabase.from('inventory_current').select('*').gt('quantity', 0).not('expiration_date', 'is', null).lte('expiration_date', futureDate.toISOString()).order('expiration_date', { ascending: true });
        if (fetchError) throw fetchError;
        setItems(data || []);
      } catch (err) { console.error('Error fetching expiring items:', err); setError(err.message); }
      setLoading(false);
    }
    fetchExpiring();
  }, [days]);

  return { items, loading, error };
}

export function useLowStockItems() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchLowStock() {
      try {
        const { data, error: fetchError } = await supabase.from('inventory_low_stock').select('*');
        if (fetchError) throw fetchError;
        setItems(data || []);
      } catch (err) { console.error('Error fetching low stock:', err); setError(err.message); }
      setLoading(false);
    }
    fetchLowStock();
  }, []);

  return { items, loading, error };
}

export default useInventoryStock;
