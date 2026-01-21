import React, { useState, useEffect, useMemo, useRef } from 'react';
import { getRequisitions } from '../../lib/supabase';

export default function PullListPage() {
  const [requisitions, setRequisitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReqId, setSelectedReqId] = useState(null);
  const [dateFilter, setDateFilter] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const printRef = useRef();

  // Load requisitions
  useEffect(() => {
    async function load() {
      try {
        const data = await getRequisitions();
        // Parse items JSON
        const processed = data.map(r => {
          let ingredients = [];
          if (r.items) {
            try {
              ingredients = typeof r.items === 'string' ? JSON.parse(r.items) : r.items;
            } catch (e) {
              console.error('Error parsing items for', r.id, e);
            }
          }
          if ((!ingredients || ingredients.length === 0) && r.ingredients) {
            ingredients = typeof r.ingredients === 'string' ? JSON.parse(r.ingredients) : r.ingredients;
          }
          return { ...r, ingredients };
        }).filter(r => r.ingredients && r.ingredients.length > 0);
        
        setRequisitions(processed);
        
        // Default date filter to today
        const today = new Date().toISOString().split('T')[0];
        setDateFilter(today);
      } catch (err) {
        console.error('Error loading requisitions:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Get unique courses
  const courses = useMemo(() => {
    const courseSet = new Set();
    requisitions.forEach(r => {
      if (r.course) courseSet.add(r.course);
    });
    return Array.from(courseSet).sort();
  }, [requisitions]);

  // Filter requisitions by date and course
  const filteredReqs = useMemo(() => {
    return requisitions.filter(r => {
      const matchesDate = !dateFilter || r.class_date === dateFilter;
      const matchesCourse = !courseFilter || r.course === courseFilter;
      return matchesDate && matchesCourse;
    });
  }, [requisitions, dateFilter, courseFilter]);

  // Selected requisition details
  const selectedReq = useMemo(() => {
    return requisitions.find(r => r.id === selectedReqId);
  }, [requisitions, selectedReqId]);

  // Format date correctly (fix timezone offset issue)
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    // Parse as local date to avoid timezone shift
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  // Clean item name - remove "Fresh" from produce items
  const cleanItemName = (name, category) => {
    if (!name) return name;
    // Remove "Fresh " or "fresh " from produce items
    if (category === 'Produce') {
      return name.replace(/^fresh\s+/i, '');
    }
    return name;
  };

  // Item notes for special handling
  const getItemNote = (name) => {
    const nameLower = (name || '').toLowerCase();
    if (nameLower.includes('candied') && (nameLower.includes('orange') || nameLower.includes('citrus') || nameLower.includes('lemon'))) {
      return '(make in class - ingredients supplied)';
    }
    if (nameLower.includes('mace')) {
      return '(sub: Nutmeg)';
    }
    if (nameLower.includes('lemon juice') && !nameLower.includes('lemons')) {
      return '(use fresh lemons)';
    }
    return null;
  };

  // Recipes to include based on items
  const recipesToInclude = useMemo(() => {
    if (!selectedReq) return [];
    const recipes = [];
    
    const hasCandiledCitrus = (selectedReq.ingredients || []).some(ing => {
      const name = (ing.name || '').toLowerCase();
      return name.includes('candied') && (name.includes('orange') || name.includes('citrus') || name.includes('lemon'));
    });
    
    if (hasCandiledCitrus) {
      recipes.push({
        title: 'CANDIED CITRUS PEEL',
        yield: '50-100 Candied Strips',
        ingredients: [
          { name: 'Citrus fruit', qty: '5-10 fruits' },
          { name: 'Water', qty: '1 qt (1 lt)' },
          { name: 'Salt', qty: '0.1 oz / ½ tsp (3 g)' },
          { name: 'Granulated sugar', qty: '1 lb (480 g)' },
          { name: 'Glucose or corn syrup', qty: '7 oz (210 g)' },
        ],
        method: [
          'Wash the fruit. With a paring knife, carefully score the peels in quarters from the stem to blossom end. Remove the peels and reserve the fruit for another use. With a paring knife, remove as much of the white pith from the peel as possible.',
          'Cut the peel into long, thin strips, approximately ¼ inch (6 mm) wide.',
          'Bring 16 fl oz (480 ml) of the water and the salt to boil in a saucepan large enough to hold the citrus peel. Add the peel and simmer 2 minutes. Drain.',
          'Bring the remaining 16 fl oz (480 ml) of water, the sugar and glucose syrup to a boil. Add the blanched citrus peel, and reduce the heat to a low simmer. Cook the peels approximately 1½–2 hours, until they are translucent and tender. Drain the peels on a greased wire rack until cool. Toss the drained peels in granulated sugar. Place the sugar-coated peels on a clean, dry wire rack, and allow them to dry overnight. Store candied peels in an airtight container.',
        ],
        note: 'Organic produce is recommended.',
      });
    }
    
    return recipes;
  }, [selectedReq]);

  // Categorize ingredients
  const categorizedIngredients = useMemo(() => {
    if (!selectedReq) return {};
    
    const categories = {
      'Produce': [],
      'Dairy & Eggs': [],
      'Meat & Seafood': [],
      'Chocolate & Confections': [],
      'Baking': [],
      'Dry Goods & Bread': [],
      'Nuts & Dried Fruit': [],
      'Spices & Seasonings': [],
      'Condiments & Sauces': [],
      'Canned & Jarred': [],
      'Decorating Supplies': [],
      'Equipment': [],
      'Other': [],
    };
    
    const categoryKeywords = {
      'Produce': ['strawberry', 'strawberries', 'lettuce', 'tomato', 'onion', 'garlic', 'carrot', 'celery', 'pepper', 'mushroom', 'herb', 'basil', 'parsley', 'cilantro', 'lemon', 'lime', 'orange', 'apple', 'berry', 'fruit', 'vegetable', 'fresh', 'asparagus', 'broccoli', 'spinach', 'kale', 'cabbage', 'zucchini', 'squash', 'eggplant', 'cucumber', 'avocado', 'potato', 'chipotle', 'jalapeno', 'poblano', 'serrano pepper', 'habanero'],
      'Dairy & Eggs': ['butter', 'cream', 'cheese', 'yogurt', 'egg', 'sour cream', 'milk powder', 'buttermilk'],
      'Meat & Seafood': ['beef', 'pork', 'chicken', 'turkey', 'lamb', 'fish', 'salmon', 'shrimp', 'bacon', 'sausage', 'ham', 'prosciutto', 'serrano', 'crab', 'lobster', 'scallop', 'mussel', 'clam', 'oyster', 'tuna', 'anchovy'],
      'Chocolate & Confections': ['chocolate', 'couverture', 'cocoa', 'candy', 'caramel', 'fondant', 'ganache'],
      'Baking': ['flour', 'sugar', 'yeast', 'baking powder', 'baking soda', 'vanilla', 'extract', 'gelatin'],
      'Dry Goods & Bread': ['rice', 'pasta', 'noodle', 'bean', 'lentil', 'oil', 'vinegar', 'pretzel', 'cracker', 'bread', 'muffin', 'roll', 'baguette', 'tortilla', 'pita'],
      'Nuts & Dried Fruit': ['pecan', 'cashew', 'almond', 'walnut', 'pistachio', 'peanut', 'nut', 'raisin', 'cranberr', 'dried', 'candied'],
      'Spices & Seasonings': ['salt', 'pepper', 'cumin', 'paprika', 'oregano', 'cinnamon', 'nutmeg', 'spice', 'seasoning', 'mace', 'allspice', 'clove', 'ginger', 'cardamom', 'turmeric', 'bay leaf', 'thyme', 'rosemary', 'sage'],
      'Condiments & Sauces': ['sauce', 'tabasco', 'hot sauce', 'mustard', 'ketchup', 'mayo', 'sriracha', 'soy sauce', 'worcestershire', 'vinaigrette', 'dressing'],
      'Canned & Jarred': ['canned', 'can', 'jarred', 'jar'],
      'Decorating Supplies': ['luster', 'dust', 'dye', 'color', 'sprinkle', 'gold', 'silver', 'edible', 'transfer'],
      'Equipment': ['saucepan', 'stockpot', 'saucepot', 'machine', 'scraper', 'brush', 'slab', 'sheet', 'skewer', 'stick', 'kit', 'warmer', 'mold', 'cutter', 'acetate', 'parchment', 'thermometer', 'spatula', 'bowl', 'whisk', 'dipping', 'knife', 'knives', 'paring', 'tongs', 'ladle', 'strainer', 'colander', 'cutting board', 'sheet pan', 'hotel pan', 'bain marie'],
    };
    
    // Deduplicate ingredients by name
    const seen = new Set();
    const uniqueIngredients = (selectedReq.ingredients || []).filter(ing => {
      const key = (ing.name || '').toLowerCase().trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    uniqueIngredients.forEach(ing => {
      const name = (ing.name || '').toLowerCase();
      let assigned = false;
      let assignedCategory = 'Other';
      
      // Check categories in priority order (equipment first to catch "dipping kits")
      const priorityOrder = [
        'Equipment', 
        'Decorating Supplies',
        'Chocolate & Confections',
        'Nuts & Dried Fruit',
        'Condiments & Sauces',
        'Meat & Seafood',
        'Canned & Jarred',
        'Produce',
        'Dairy & Eggs',
        'Baking',
        'Dry Goods & Bread',
        'Spices & Seasonings',
      ];
      
      for (const category of priorityOrder) {
        const keywords = categoryKeywords[category];
        if (keywords.some(kw => name.includes(kw))) {
          assignedCategory = category;
          assigned = true;
          break;
        }
      }
      
      // Store with category info for cleaning
      const ingWithCategory = { ...ing, _category: assignedCategory };
      
      if (assigned) {
        categories[assignedCategory].push(ingWithCategory);
      } else {
        categories['Other'].push(ingWithCategory);
      }
    });
    
    // Remove empty categories
    return Object.fromEntries(
      Object.entries(categories).filter(([_, items]) => items.length > 0)
    );
  }, [selectedReq]);

  // Print handler
  const handlePrint = () => {
    const printContent = printRef.current;
    const printWindow = window.open('', '_blank');
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Pull List - ${selectedReq?.course} - ${selectedReq?.class_date}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 16px; max-width: 800px; margin: 0 auto; font-size: 12px; }
          h1 { font-size: 18px; margin-bottom: 4px; }
          .header-info { color: #666; font-size: 11px; margin-bottom: 12px; line-height: 1.4; }
          .category { margin-bottom: 10px; }
          .category-title { font-size: 11px; font-weight: bold; background: #f0f0f0; padding: 4px 6px; margin-bottom: 0; border-bottom: 2px solid #333; }
          table { width: 100%; border-collapse: collapse; }
          th, td { padding: 3px 6px; text-align: left; border-bottom: 1px solid #ddd; font-size: 11px; }
          th { background: #f9f9f9; font-weight: 600; }
          .checkbox { width: 16px; height: 16px; border: 2px solid #333; display: inline-block; }
          .qty { font-weight: bold; }
          .note { color: #059669; font-size: 10px; font-style: italic; }
          .footer { margin-top: 16px; padding-top: 12px; border-top: 1px solid #ccc; }
          .notes-section { margin-top: 8px; }
          .notes-box { border: 1px solid #ccc; min-height: 80px; margin-top: 4px; }
          @media print { 
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        ${printContent.innerHTML}
      </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.print();
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse text-gray-500">Loading requisitions...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Generate Pull List</h1>
      
      {/* Filters */}
      <div className="bg-white border rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Date Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Class Date</label>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                setSelectedReqId(null);
              }}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {/* Course Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
            <select
              value={courseFilter}
              onChange={(e) => {
                setCourseFilter(e.target.value);
                setSelectedReqId(null);
              }}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Courses</option>
              {courses.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          
          {/* Quick Date Buttons */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quick Select</label>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const today = new Date().toISOString().split('T')[0];
                  setDateFilter(today);
                  setSelectedReqId(null);
                }}
                className="px-3 py-2 text-sm bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Today
              </button>
              <button
                onClick={() => {
                  const tomorrow = new Date();
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  setDateFilter(tomorrow.toISOString().split('T')[0]);
                  setSelectedReqId(null);
                }}
                className="px-3 py-2 text-sm bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Tomorrow
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Matching Requisitions */}
      <div className="bg-white border rounded-lg p-4 mb-6">
        <h2 className="font-semibold text-gray-700 mb-3">
          {filteredReqs.length} Requisition{filteredReqs.length !== 1 ? 's' : ''} Found
        </h2>
        
        {filteredReqs.length === 0 ? (
          <p className="text-gray-500 text-sm">No requisitions match the selected filters.</p>
        ) : (
          <div className="space-y-2">
            {filteredReqs.map(req => (
              <button
                key={req.id}
                onClick={() => setSelectedReqId(req.id)}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                  selectedReqId === req.id
                    ? 'bg-blue-50 border-blue-300'
                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-medium text-gray-900">{req.course}</span>
                    <span className="text-gray-500 ml-2">- {req.week || req.name || 'No topic'}</span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {req.ingredients?.length || 0} items
                  </span>
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  {req.instructor && <span>Instructor: {req.instructor}</span>}
                  {req.class_date && <span className="ml-3">{formatDate(req.class_date)}</span>}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
      
      {/* Pull List Preview & Print */}
      {selectedReq && (
        <div className="bg-white border rounded-lg overflow-hidden">
          <div className="bg-gray-50 border-b px-4 py-3 flex justify-between items-center">
            <h2 className="font-semibold text-gray-700">Pull List Preview</h2>
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print Pull List
            </button>
          </div>
          
          {/* Printable Content */}
          <div ref={printRef} className="p-4">
            <h1 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '4px' }}>
              PULL LIST - {selectedReq.course} {selectedReq.name ? `- ${selectedReq.name}` : ''}
            </h1>
            <div className="header-info" style={{ color: '#666', marginBottom: '12px', fontSize: '11px', lineHeight: '1.4' }}>
              <div><strong>Topic:</strong> {selectedReq.week || selectedReq.name || '-'}</div>
              <div><strong>Class Date:</strong> {formatDate(selectedReq.class_date)}</div>
              <div><strong>Instructor:</strong> {selectedReq.instructor || '-'}</div>
              <div><strong>Students:</strong> {selectedReq.students || '-'}</div>
            </div>
            
            {Object.entries(categorizedIngredients).map(([category, items]) => (
              <div key={category} className="category" style={{ marginBottom: '10px' }}>
                <div className="category-title" style={{ 
                  fontSize: '11px', 
                  fontWeight: 'bold', 
                  background: '#f0f0f0', 
                  padding: '4px 6px',
                  borderBottom: '2px solid #333'
                }}>
                  {category}
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ width: '30px', padding: '3px 6px', textAlign: 'center', borderBottom: '1px solid #ddd', fontSize: '11px' }}>✓</th>
                      <th style={{ padding: '3px 6px', textAlign: 'left', borderBottom: '1px solid #ddd', fontSize: '11px' }}>Item</th>
                      <th style={{ width: '80px', padding: '3px 6px', textAlign: 'center', borderBottom: '1px solid #ddd', fontSize: '11px' }}>Qty</th>
                      <th style={{ width: '80px', padding: '3px 6px', textAlign: 'left', borderBottom: '1px solid #ddd', fontSize: '11px' }}>Unit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => (
                      <tr key={idx}>
                        <td style={{ padding: '3px 6px', textAlign: 'center', borderBottom: '1px solid #eee' }}>
                          <span style={{ 
                            display: 'inline-block', 
                            width: '14px', 
                            height: '14px', 
                            border: '2px solid #333',
                            borderRadius: '2px'
                          }}></span>
                        </td>
                        <td style={{ padding: '3px 6px', borderBottom: '1px solid #eee', fontSize: '11px' }}>
                          {cleanItemName(item.name, item._category)}
                          {getItemNote(item.name) && (
                            <span className="note" style={{ color: '#059669', fontSize: '10px', fontStyle: 'italic', marginLeft: '6px' }}>
                              {getItemNote(item.name)}
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '3px 6px', textAlign: 'center', fontWeight: 'bold', borderBottom: '1px solid #eee', fontSize: '11px' }}>
                          {item.quantity}
                        </td>
                        <td style={{ padding: '3px 6px', borderBottom: '1px solid #eee', fontSize: '11px' }}>{item.unit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
            
            <div className="footer" style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #ccc' }}>
              <div className="notes-section">
                <div style={{ fontWeight: 'bold', fontSize: '11px' }}>Notes:</div>
                <div className="notes-box" style={{ border: '1px solid #ccc', minHeight: '80px', marginTop: '4px' }}></div>
              </div>
            </div>
            
            {/* Recipes Section */}
            {recipesToInclude.length > 0 && (
              <div style={{ marginTop: '24px', pageBreakBefore: 'always' }}>
                <h2 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '12px', borderBottom: '2px solid #333', paddingBottom: '4px' }}>
                  RECIPES - Make in Class
                </h2>
                {recipesToInclude.map((recipe, idx) => (
                  <div key={idx} style={{ marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '6px' }}>{recipe.title}</h3>
                    <div style={{ fontSize: '10px', color: '#666', marginBottom: '6px' }}>
                      Yield: {recipe.yield}
                      {recipe.note && <span style={{ marginLeft: '12px', fontStyle: 'italic' }}>{recipe.note}</span>}
                    </div>
                    
                    <div style={{ marginBottom: '8px' }}>
                      <strong style={{ fontSize: '10px' }}>Ingredients:</strong>
                      <table style={{ width: '50%', borderCollapse: 'collapse', marginTop: '2px', fontSize: '10px' }}>
                        <tbody>
                          {recipe.ingredients.map((ing, i) => (
                            <tr key={i}>
                              <td style={{ padding: '1px 6px 1px 0', borderBottom: '1px solid #eee' }}>{ing.name}</td>
                              <td style={{ padding: '1px 0', borderBottom: '1px solid #eee', textAlign: 'right' }}>{ing.qty}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    
                    <div>
                      <strong style={{ fontSize: '10px' }}>Method:</strong>
                      <ol style={{ fontSize: '10px', marginTop: '2px', paddingLeft: '16px', lineHeight: '1.4' }}>
                        {recipe.method.map((step, i) => (
                          <li key={i} style={{ marginBottom: '4px' }}>{step}</li>
                        ))}
                      </ol>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
