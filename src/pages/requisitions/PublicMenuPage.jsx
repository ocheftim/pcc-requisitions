import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function PublicMenuPage() {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMenu = async () => {
      const { data } = await supabase.from('menu_items').select('*').order('name');
      console.log('Menu items loaded:', data);
      setMenuItems(data || []);
      setLoading(false);
    };
    loadMenu();
  }, []);

  // DEBUG: Show ALL items to see what's in database
  const breakfastItems = menuItems;

  if (loading) return <div className="min-h-screen bg-gray-100 flex items-center justify-center"><p className="text-gray-500">Loading menu...</p></div>;

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-4xl mx-auto py-12 px-4">
        <div className="text-center mb-10">
          <img src="/pcc-logo.png" alt="Pima Community College" className="h-16 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-blue-800">Breakfast Menu</h1>
          <p className="text-gray-600 mt-2">Hospitality Leadership Program</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-blue-800 text-white py-4 px-6">
            <h2 className="text-xl font-semibold">Morning Selections ({menuItems.length} total items)</h2>
          </div>
          
          <div className="divide-y divide-gray-200">
            {breakfastItems.map(item => {
              const price = item.increment > 1 
                ? (item.menu_price / item.increment).toFixed(2)
                : (item.menu_price || 0).toFixed(2);
              
              return (
                <div key={item.id} className="p-6 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 pr-4">
                      <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                      <p className="text-xs text-gray-400">Program: {item.program || 'null'} | Category: {item.category || 'null'}</p>
                      {item.description && (
                        <p className="text-gray-600 mt-1">{item.description}</p>
                      )}
                    </div>
                    <div className="text-lg font-bold text-blue-800">${price}</div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {breakfastItems.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              No menu items found in database
            </div>
          )}
        </div>
        
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>Pima Community College • Desert Vista Campus</p>
          <p className="mt-1">Prices subject to change</p>
        </div>
      </div>
    </div>
  );
}
