import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export const defaultCategoryStructure = {
  'Produce': ['Fruit', 'Vegetables', 'Herbs', 'Other'],
  'Meat & Seafood': ['Beef', 'Pork', 'Poultry', 'Fish', 'Shellfish', 'Breakfast Meats', 'Deli Meats', 'Other'],
  'Dairy & Eggs': ['Eggs', 'Cheese', 'Cream & Milk', 'Cultured Dairy', 'Butter', 'Other'],
  'Bread': ['Bread', 'Breakfast Pastries', 'Rolls', 'Other'],
  'Pantry': ['Baking - Chocolate', 'Baking - Decorating', 'Baking - Dried Fruit', 'Baking - Extracts', 'Baking - Fillings', 'Baking - Flour', 'Baking - Leavening', 'Baking - Nuts & Seeds', 'Baking - Other', 'Baking - Sweeteners', 'Breading', 'Canned Goods', 'Condiments', 'Grains & Pasta', 'Oils & Fats', 'Spices & Seasonings', 'Other'],
  'Beverages': ['Coffee & Tea', 'Juices', 'Other'],
  'Wine & Spirits': ['Wine', 'Liqueurs', 'Spirits'],
  'Other': ['Other']
};

export const defaultVendors = ['Sysco', 'Shamrock', 'US Foods', 'Restaurant Depot', 'Costco', 'Total Wine', 'Amazon', 'Local', 'Other'];

export const defaultBrands = {};

export function useSettings() {
  const [categoryStructure, setCategoryStructure] = useState(defaultCategoryStructure);
  const [vendors, setVendors] = useState(defaultVendors);
  const [brands, setBrands] = useState(defaultBrands);
  const [loading, setLoading] = useState(true);

  const loadSettings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('key, value')
        .in('key', ['categoryStructure', 'vendors', 'brands']);

      if (error) throw error;

      data?.forEach(row => {
        if (row.key === 'categoryStructure' && row.value) {
          setCategoryStructure(row.value);
        } else if (row.key === 'vendors' && row.value) {
          setVendors(row.value);
        } else if (row.key === 'brands' && row.value) {
          setBrands(row.value);
        }
      });
    } catch (err) {
      console.error('Error loading settings:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const categories = Object.keys(categoryStructure);

  const getBrandsForSubcategory = useCallback((category, subcategory) => {
    const key = `${category}|${subcategory}`;
    return brands[key] || [];
  }, [brands]);

  const updateCategoryStructure = useCallback(async (newStructure) => {
    setCategoryStructure(newStructure);
    await supabase
      .from('settings')
      .upsert({ key: 'categoryStructure', value: newStructure }, { onConflict: 'key' });
  }, []);

  const updateVendors = useCallback(async (newVendors) => {
    setVendors(newVendors);
    await supabase
      .from('settings')
      .upsert({ key: 'vendors', value: newVendors }, { onConflict: 'key' });
  }, []);

  const updateBrands = useCallback(async (newBrands) => {
    setBrands(newBrands);
    await supabase
      .from('settings')
      .upsert({ key: 'brands', value: newBrands }, { onConflict: 'key' });
  }, []);

  return { 
    categoryStructure, 
    categories, 
    vendors, 
    brands,
    loading,
    getBrandsForSubcategory,
    updateCategoryStructure,
    updateVendors,
    updateBrands,
    refreshSettings: loadSettings
  };
}
