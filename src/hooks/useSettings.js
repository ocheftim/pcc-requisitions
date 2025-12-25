import { useState, useEffect } from 'react';

export const defaultCategoryStructure = {
  'Produce': ['Fruit', 'Vegetables', 'Herbs', 'Other'],
  'Meat & Seafood': ['Poultry', 'Beef', 'Pork', 'Seafood', 'Other'],
  'Dairy & Eggs': ['Eggs', 'Cheese', 'Milk & Cream', 'Cultured Dairy', 'Butter', 'Other'],
  'Bakery & Bread': ['Breads', 'Rolls', 'Pastries', 'Other'],
  'Pantry': [
    'Oils & Vinegars', 
    'Spices & Seasonings', 
    'Condiments', 
    'Pasta & Rice', 
    'Canned Goods', 
    'Dry Goods', 
    'Flours', 
    'Grains',
    'Sweeteners', 
    'Thickeners', 
    'Baking Ingredients', 
    'Sauces', 
    'Nuts & Seeds', 
    'Extracts & Flavorings',
    'Dried Fruits',
    'Chocolate & Cocoa',
    'Leaveners',
    'Jams & Preserves',
    'Nut Butters',
    'Other'
  ],
  'Frozen Foods': ['Frozen Vegetables', 'Frozen Fruit', 'Frozen Appetizers', 'Frozen Breads', 'Other'],
  'Beverages': ['Juices', 'Sodas', 'Coffee & Tea', 'Other'],
  'Wine & Spirits': ['Cooking Wine', 'Liqueurs', 'Spirits', 'Other'],
  'Stock': ['Chicken Stock', 'Beef Stock', 'Vegetable Stock', 'Other'],
  'Uncategorized': ['Other']
};

export const defaultVendors = [
  'Sysco',
  'Shamrock',
  'Merit Foods',
  "Peddler's",
  'Amazon',
  'Restaurant Depot',
  'Costco',
  "Fry's",
  'Safeway',
  'House-Made'
];

export function useSettings() {
  const [categoryStructure, setCategoryStructure] = useState(() => {
    const saved = localStorage.getItem('categoryStructure');
    return saved ? JSON.parse(saved) : defaultCategoryStructure;
  });

  const [vendors, setVendors] = useState(() => {
    const saved = localStorage.getItem('vendors');
    return saved ? JSON.parse(saved) : defaultVendors;
  });

  useEffect(() => {
    const handleStorageChange = () => {
      const savedCategories = localStorage.getItem('categoryStructure');
      const savedVendors = localStorage.getItem('vendors');
      if (savedCategories) setCategoryStructure(JSON.parse(savedCategories));
      if (savedVendors) setVendors(JSON.parse(savedVendors));
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleStorageChange);
    };
  }, []);

  const categories = Object.keys(categoryStructure);

  return { categoryStructure, categories, vendors };
}
