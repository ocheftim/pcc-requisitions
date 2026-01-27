import React, { useState, useEffect, useMemo, useRef } from 'react';
import { getRequisitions } from '../../lib/supabase';

export default function PullListPage() {
  const [requisitions, setRequisitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReqId, setSelectedReqId] = useState(null);
  const [dateFilter, setDateFilter] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const printRef = useRef();
  const [weekRange, setWeekRange] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await getRequisitions();
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

  const courses = useMemo(() => {
    const courseSet = new Set();
    requisitions.forEach(r => {
      if (r.course) courseSet.add(r.course);
    });
    return Array.from(courseSet).sort();
  }, [requisitions]);

  const filteredReqs = useMemo(() => {
    if (weekRange) {
      return requisitions.filter(r => 
        r.class_date >= weekRange.start && r.class_date <= weekRange.end
      ).sort((a, b) => a.class_date.localeCompare(b.class_date));
    }
    return requisitions.filter(r => {
      const matchesDate = !dateFilter || r.class_date === dateFilter;
      const matchesCourse = !courseFilter || r.course === courseFilter;
      return matchesDate && matchesCourse;
    });
  }, [requisitions, dateFilter, courseFilter, weekRange]);

  const selectedReq = useMemo(() => {
    return requisitions.find(r => r.id === selectedReqId);
  }, [requisitions, selectedReqId]);

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  // Use stored categories from items - same order as PrintRequisitionPage
  // Omit Equipment category
  const categoryOrder = ['Produce', 'Dairy & Eggs', 'Meat', 'Seafood', 'Pantry', 'Frozen', 'Bakery', 'Supplies', 'Other'];

  const categorizedIngredients = useMemo(() => {
    if (!selectedReq) return {};
    
    const categories = {};
    
    // Filter out Equipment items
    (selectedReq.ingredients || [])
      .filter(ing => ing.category !== 'Equipment')
      .forEach(ing => {
        const category = ing.category || 'Other';
        if (!categories[category]) {
          categories[category] = [];
        }
        categories[category].push(ing);
      });
    
    // Sort categories by defined order, then alphabetically within each
    const sorted = {};
    categoryOrder.forEach(cat => {
      if (categories[cat]) {
        sorted[cat] = categories[cat].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      }
    });
    // Add any categories not in the order list (except Equipment)
    Object.keys(categories).forEach(cat => {
      if (!sorted[cat] && cat !== 'Equipment') {
        sorted[cat] = categories[cat].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      }
    });
    
    return sorted;
  }, [selectedReq]);

  const weekReqs = useMemo(() => {
    if (!weekRange) return [];
    return requisitions.filter(r => 
      r.class_date >= weekRange.start && r.class_date <= weekRange.end
    ).sort((a, b) => a.class_date.localeCompare(b.class_date));
  }, [requisitions, weekRange]);

  const handlePrintWeek = () => {
    weekReqs.forEach((req, index) => {
      setTimeout(() => {
        const ingredients = req.ingredients || [];
        const categories = {};
        const catOrder = ['Produce', 'Dairy \& Eggs', 'Meat', 'Seafood', 'Pantry', 'Frozen', 'Bakery', 'Supplies', 'Other'];
        ingredients.filter(ing => ing.category !== 'Equipment').forEach(ing => {
          const cat = ing.category || 'Other';
          if (!categories[cat]) categories[cat] = [];
          categories[cat].push(ing);
        });
        const sorted = {};
        catOrder.forEach(cat => {
          if (categories[cat]) sorted[cat] = categories[cat].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        });
        let categoriesHtml = '';
        Object.entries(sorted).forEach(([category, items]) => {
          categoriesHtml += `<div style="margin-bottom:10px;"><div style="font-size:11px;font-weight:bold;background:#f0f0f0;padding:4px 6px;border-bottom:2px solid #333;">${category}</div><table style="width:100%;border-collapse:collapse;"><thead><tr><th style="width:30px;padding:4px 8px;text-align:center;border-bottom:1px solid #ddd;font-size:11px;">✓</th><th style="padding:4px 8px;text-align:left;border-bottom:1px solid #ddd;font-size:11px;">Item</th><th style="width:80px;padding:4px 8px;text-align:center;border-bottom:1px solid #ddd;font-size:11px;">Qty</th><th style="width:100px;padding:4px 8px;text-align:left;border-bottom:1px solid #ddd;font-size:11px;">Unit</th></tr></thead><tbody>${items.map(item => `<tr><td style="padding:4px 8px;text-align:center;border-bottom:1px solid #eee;"><span style="display:inline-block;width:14px;height:14px;border:2px solid #333;border-radius:2px;"></span></td><td style="padding:4px 8px;border-bottom:1px solid #eee;font-size:11px;">${item.name}</td><td style="padding:4px 8px;text-align:center;font-weight:bold;border-bottom:1px solid #eee;font-size:11px;">${item.quantity}</td><td style="padding:4px 8px;border-bottom:1px solid #eee;font-size:11px;">${item.unit}</td></tr>`).join('')}</tbody></table></div>`;
        });
        const pw = window.open('', '_blank');
        pw.document.write(`<!DOCTYPE html><html><head><title>Pull List - ${req.course}</title><style>body{font-family:Arial,sans-serif;padding:16px;max-width:800px;margin:0 auto;font-size:12px;}@media print{body{padding:0;}}</style></head><body><h1 style="font-size:18px;margin-bottom:4px;">PULL LIST - ${req.course}</h1><div style="color:#666;margin-bottom:12px;font-size:11px;line-height:1.4;"><div><strong>Module:</strong> ${req.week || '-'}</div><div><strong>Class Date:</strong> ${req.class_date}</div><div><strong>Instructor:</strong> ${req.instructor || '-'}</div><div><strong>Students:</strong> ${req.students || '-'}</div></div>${categoriesHtml}<div style="margin-top:16px;padding-top:12px;border-top:1px solid #ccc;"><div style="font-weight:bold;font-size:11px;">Notes:</div><div style="border:1px solid #ccc;min-height:80px;margin-top:4px;"></div></div></body></html>`);
        pw.document.close();
        pw.print();
      }, index * 1500);
    });
  };

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
          th, td { padding: 4px 8px; text-align: left; border-bottom: 1px solid #ddd; font-size: 11px; }
          th { background: #f9f9f9; font-weight: 600; }
          .qty { font-weight: bold; }
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
      
      <div className="bg-white border rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <button
                onClick={() => {
                  const today = new Date();
                  const dayOfWeek = today.getDay();
                  const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
                  const nextMonday = new Date(today);
                  nextMonday.setDate(today.getDate() + daysUntilMonday);
                  const nextFriday = new Date(nextMonday);
                  nextFriday.setDate(nextMonday.getDate() + 4);
                  setWeekRange({
                    start: nextMonday.toISOString().split("T")[0],
                    end: nextFriday.toISOString().split("T")[0]
                  });
                  setDateFilter("");
                  setCourseFilter("");
                  setSelectedReqId(null);
                }}
                className="px-3 py-2 text-sm bg-blue-100 rounded-lg hover:bg-blue-200 text-blue-700"
              >
                Next Week
              </button>
            </div>
          </div>
        </div>
      </div>
      

      {weekRange && weekReqs.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-semibold text-blue-800">
              Next Week: {weekRange.start} to {weekRange.end} ({weekReqs.length} classes)
            </h2>
            <button
              onClick={handlePrintWeek}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              Print All ({weekReqs.length})
            </button>
          </div>
          <div className="space-y-1">
            {weekReqs.map(req => (
              <div key={req.id} className="text-sm text-blue-700">
                {req.class_date} - {req.course} - {req.week} ({req.ingredients?.length || 0} items)
              </div>
            ))}
          </div>
        </div>
      )}

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
                    {req.ingredients?.filter(i => i.category !== 'Equipment').length || 0} items
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
          
          <div ref={printRef} className="p-4">
            <h1 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '4px' }}>
              PULL LIST - {selectedReq.course}
            </h1>
            <div className="header-info" style={{ color: '#666', marginBottom: '12px', fontSize: '11px', lineHeight: '1.4' }}>
              <div><strong>Module:</strong> {selectedReq.week || selectedReq.name || '-'}</div>
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
                      <th style={{ width: '30px', padding: '4px 8px', textAlign: 'center', borderBottom: '1px solid #ddd', fontSize: '11px' }}>✓</th>
                      <th style={{ padding: '4px 8px', textAlign: 'left', borderBottom: '1px solid #ddd', fontSize: '11px' }}>Item</th>
                      <th style={{ width: '80px', padding: '4px 8px', textAlign: 'center', borderBottom: '1px solid #ddd', fontSize: '11px' }}>Qty</th>
                      <th style={{ width: '100px', padding: '4px 8px', textAlign: 'left', borderBottom: '1px solid #ddd', fontSize: '11px' }}>Unit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => (
                      <tr key={idx}>
                        <td style={{ padding: '4px 8px', textAlign: 'center', borderBottom: '1px solid #eee' }}>
                          <span style={{
                            display: 'inline-block',
                            width: '14px',
                            height: '14px',
                            border: '2px solid #333',
                            borderRadius: '2px'
                          }}></span>
                        </td>
                        <td style={{ padding: '4px 8px', borderBottom: '1px solid #eee', fontSize: '11px' }}>
                          {item.name}
                        </td>
                        <td style={{ padding: '4px 8px', textAlign: 'center', fontWeight: 'bold', borderBottom: '1px solid #eee', fontSize: '11px' }}>
                          {item.quantity}
                        </td>
                        <td style={{ padding: '4px 8px', borderBottom: '1px solid #eee', fontSize: '11px' }}>{item.unit}</td>
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
          </div>
        </div>
      )}
    </div>
  );
}
