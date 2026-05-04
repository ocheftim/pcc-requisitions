import React, { useState, useEffect, useMemo, useRef } from 'react';
import { getRequisitions } from '../../lib/supabase';

export default function PullListPage() {
  const [requisitions, setRequisitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReqId, setSelectedReqId] = useState(null);
  const [dateFilter, setDateFilter] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const printRef = useRef();

  // Timezone-safe formatter for YYYY-MM-DD class_date strings.
  // new Date('2026-05-06') is parsed as UTC midnight, which renders as
  // the prior day in any TZ west of UTC (e.g., Tucson MST). Parse the
  // parts manually instead.
  const formatClassDate = (d) => {
    if (!d) return '-';
    const str = String(d).split('T')[0];
    const [y, m, day] = str.split('-').map(Number);
    if (!y || !m || !day) return '-';
    return new Date(y, m - 1, day).toLocaleDateString();
  };

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

  // Categorize ingredients — read the category field from the DB directly.
  // Falls back to 'Other' for legacy items with no category. Matching is
  // case-insensitive so legacy variants like 'BAKING' or 'dairy' group cleanly.
  const categorizedIngredients = useMemo(() => {
    if (!selectedReq) return {};

    // Display order — items grouped under these headers in this order.
    // Anything else (including null/missing category) falls into 'Other'.
    const CATEGORY_ORDER = [
      'Produce',
      'Dairy & Eggs',
      'Meat & Seafood',
      'Protein',
      'Flours',
      'Sugars',
      'Sweeteners',
      'Leaveners',
      'Spices',
      'Oils',
      'Pantry',
      'Pantry/Nuts',
      'Pantry/Dried Fruit & Nuts',
      'Chocolates',
      'Pantry/Chocolates',
      'Baking',
      'Frozen',
      'Frozen Foods',
      'Bakery & Bread',
      'Bread',
      'Beverages',
      'Wine & Spirits',
      'Fruit',
      'Supplies',
      'Equipment',
      'Other',
    ];

    // Build a lowercase lookup so DB category strings match the canonical label.
    const canonical = {};
    CATEGORY_ORDER.forEach(c => { canonical[c.toLowerCase()] = c; });

    const buckets = {};
    (selectedReq.ingredients || []).forEach(ing => {
      const raw = (ing.category || '').trim();
      const key = canonical[raw.toLowerCase()] || (raw ? raw : 'Other');
      if (!buckets[key]) buckets[key] = [];
      buckets[key].push(ing);
    });

    // Emit in CATEGORY_ORDER first, then any unrecognized categories alphabetically,
    // with 'Other' always last.
    const result = {};
    CATEGORY_ORDER.forEach(c => {
      if (c !== 'Other' && buckets[c]) result[c] = buckets[c];
    });
    Object.keys(buckets)
      .filter(k => !CATEGORY_ORDER.includes(k))
      .sort()
      .forEach(k => { result[k] = buckets[k]; });
    if (buckets['Other']) result['Other'] = buckets['Other'];
    return result;
  }, [selectedReq]);

  // Print handler
  const handlePrint = () => {
    const printContent = printRef.current;
    const printWindow = window.open('', '_blank');
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Pull List - ${selectedReq?.course} - ${formatClassDate(selectedReq?.class_date)}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
          h1 { font-size: 20px; margin-bottom: 5px; }
          .header-info { color: #666; font-size: 14px; margin-bottom: 20px; }
          .category { margin-bottom: 20px; }
          .category-title { font-size: 14px; font-weight: bold; background: #f0f0f0; padding: 8px; margin-bottom: 0; border-bottom: 2px solid #333; }
          table { width: 100%; border-collapse: collapse; }
          th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; font-size: 13px; }
          th { background: #f9f9f9; font-weight: 600; }
          .checkbox { width: 24px; height: 24px; border: 2px solid #333; display: inline-block; }
          .qty { font-weight: bold; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ccc; }
          .signature-line { margin-top: 20px; }
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
                  {req.class_date && <span className="ml-3">{formatClassDate(req.class_date)}</span>}
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
            <h1 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '4px' }}>
              PULL LIST - {selectedReq.course}
            </h1>
            <div className="header-info" style={{ color: '#666', marginBottom: '16px' }}>
              <div><strong>Topic:</strong> {selectedReq.week || selectedReq.name || '-'}</div>
              <div><strong>Date:</strong> {formatClassDate(selectedReq.class_date)}</div>
              <div><strong>Instructor:</strong> {selectedReq.instructor || '-'}</div>
              <div><strong>Students:</strong> {selectedReq.students || '-'}</div>
            </div>
            
            {Object.entries(categorizedIngredients).map(([category, items]) => (
              <div key={category} className="category" style={{ marginBottom: '16px' }}>
                <div className="category-title" style={{ 
                  fontSize: '13px', 
                  fontWeight: 'bold', 
                  background: '#f0f0f0', 
                  padding: '6px 8px',
                  borderBottom: '2px solid #333'
                }}>
                  {category}
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ width: '40px', padding: '8px', textAlign: 'center', borderBottom: '1px solid #ddd' }}>✓</th>
                      <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Item</th>
                      <th style={{ width: '100px', padding: '8px', textAlign: 'center', borderBottom: '1px solid #ddd' }}>Qty</th>
                      <th style={{ width: '100px', padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Unit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => (
                      <tr key={idx}>
                        <td style={{ padding: '8px', textAlign: 'center', borderBottom: '1px solid #eee' }}>
                          <span style={{ 
                            display: 'inline-block', 
                            width: '18px', 
                            height: '18px', 
                            border: '2px solid #333',
                            borderRadius: '2px'
                          }}></span>
                        </td>
                        <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{item.name}</td>
                        <td style={{ padding: '8px', textAlign: 'center', fontWeight: 'bold', borderBottom: '1px solid #eee' }}>
                          {item.quantity}
                        </td>
                        <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{item.unit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
            
            <div className="footer" style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #ccc' }}>
              <div style={{ display: 'flex', gap: '40px' }}>
                <div>Pulled by: _______________________</div>
                <div>Date: _____________</div>
                <div>Time: _____________</div>
              </div>
              <div style={{ marginTop: '16px' }}>
                <div>Notes:</div>
                <div style={{ border: '1px solid #ccc', height: '60px', marginTop: '4px' }}></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
