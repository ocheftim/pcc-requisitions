import { useState, useEffect, useCallback } from 'react';
import { getIngredientCustomizations, supabase } from '../lib/supabase';

export const useIngredientLookup = () => {
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadIngredients();
  }, []);

  const loadIngredients = async () => {
    try {
      setLoading(true);
      const data = await getIngredientCustomizations();
      setIngredients(data);
    } catch (err) {
      console.error('Error loading ingredients:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const findIngredient = useCallback((name) => {
    if (!name) return null;
    const normalized = name.toLowerCase().trim();
    
    // Direct match
    let found = ingredients.find(i => 
      i.ingredient_name.toLowerCase() === normalized
    );
    if (found) return found;

    // Partial match (e.g., "Parsley" matches "Parsley, Fresh")
    found = ingredients.find(i => 
      i.ingredient_name.toLowerCase().includes(normalized) ||
      normalized.includes(i.ingredient_name.toLowerCase())
    );
    if (found) return found;

    // Common variations
    const variations = {
      'basil': 'Basil, Fresh',
      'parsley': 'Parsley, Fresh',
      'thyme': 'Thyme, Fresh',
      'chives': 'Chives, Fresh',
      'cilantro': 'Cilantro, Fresh',
      'sage': 'Sage, Fresh',
      'mace': 'Nutmeg, Ground', // Auto-substitute
      'mace, ground': 'Nutmeg, Ground',
      'oil, olive': 'Olive Oil',
      'oats, quick-cooking': 'Oats, Rolled',
      'oats quick cooking': 'Oats, Rolled',
    };
    
    const mapped = variations[normalized];
    if (mapped) {
      return ingredients.find(i => 
        i.ingredient_name.toLowerCase() === mapped.toLowerCase()
      );
    }

    return null;
  }, [ingredients]);

  const getVendorInfo = useCallback((name) => {
    const ing = findIngredient(name);
    if (!ing) return { vendor: 'Unknown', vendorCode: '', packSize: '', category: 'Other' };
    return {
      vendor: ing.vendor || 'Unknown',
      vendorCode: ing.vendor_code || '',
      packSize: ing.pack_size || '',
      casePrice: ing.case_price || 0,
      unit: ing.unit || 'ea',
      category: ing.category || 'Other',
      localSource: ing.local_source || ''
    };
  }, [findIngredient]);

  return { 
    ingredients, 
    loading, 
    error, 
    findIngredient, 
    getVendorInfo,
    refresh: loadIngredients 
  };
};

export default useIngredientLookup;
