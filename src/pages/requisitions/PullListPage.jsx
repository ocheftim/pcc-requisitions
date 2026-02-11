import React, { useState, useEffect, useMemo } from 'react';
import { getRequisitions } from '../../lib/supabase';

const COURSE_STUDENT_COUNTS = {
  '260': 12,
  '244': 12,
  '130': 7,
  '160': 12
};

const getStudentCount = (courseName) => {
  if (!courseName) return 0;
  const nums = courseName.match(/\d{3}/);
  if (nums && COURSE_STUDENT_COUNTS[nums[0]]) {
    return COURSE_STUDENT_COUNTS[nums[0]];
  }
  return 0;
};

export default function PullListPage() {
  const [requisitions, setRequisitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReqId, setSelectedReqId] = useState(null);
  const [dateFilter, setDateFilter] = useState('');
  const [courseFilter, setCourseFilter] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const data = await getRequisitions();
        const processed = data.map(r => {
          let ingredients = [];
          if (r.items) {
            try { ingredients = typeof r.items === 'string' ? JSON.parse(r.items) : r.items; } catch (e) {}
          }
          if ((!ingredients || ingredients.length === 0) && r.ingredients) {
            ingredients = typeof r.ingredients === 'string' ? JSON.parse(r.ingredients) : r.ingredients;
          }
          return { ...r, ingredients };
        }).filter(r => r.ingredients && r.ingredients.length > 0);
        setRequisitions(processed);
        setDateFilter(new Date().toISOString().split('T')[0]);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  const courses = useMemo(() => Array.from(new Set(requisitions.map(r => r.course).filter(Boolean))).sort(), [requisitions]);
  const filteredReqs = useMemo(() => requisitions.filter(r => (!dateFilter || r.class_date === dateFilter) && (!courseFilter || r.course === courseFilter)), [requisitions, dateFilter, courseFilter]);
  const selectedReq = useMemo(() => requisitions.find(r => r.id === selectedReqId), [requisitions, selectedReqId]);
  const studentCount = useMemo(() => selectedReq ? getStudentCount(selectedReq.course) : 0, [selectedReq]);

  const categorizedIngredients = useMemo(() => {
    if (!selectedReq) return {};
    const categories = { 'Refrigerated': [], 'Freezer': [], 'Dry Storage': [], 'Supplies': [], 'Equipment': [] };
    
    const REFRIGERATED_CATS = ['produce', 'dairy & eggs', 'dairy', 'meat & seafood', 'fruit'];
    const FREEZER_CATS = ['frozen', 'frozen foods'];
    const SUPPLY_CATS = ['supplies'];
    const EQUIPMENT_KW = ['pan', 'pot', 'machine', 'scraper', 'brush', 'slab', 'skewer', 'stick', 'kit', 'warmer', 'mold', 'cutter', 'thermometer', 'spatula', 'whisk', 'bowl', 'rolling pin', 'piping', 'torch', 'scale', 'mixer', 'sheet tray', 'parchment', 'offset'];

    (selectedReq.ingredients || []).forEach(ing => {
      const cat = (ing.category || '').toLowerCase();
      const name = (ing.name || '').toLowerCase();
      
      if (EQUIPMENT_KW.some(kw => name.includes(kw))) { categories['Equipment'].push(ing); }
      else if (SUPPLY_CATS.includes(cat)) { categories['Supplies'].push(ing); }
      else if (FREEZER_CATS.includes(cat)) { categories['Freezer'].push(ing); }
      else if (REFRIGERATED_CATS.includes(cat)) { categories['Refrigerated'].push(ing); }
      else { categories['Dry Storage'].push(ing); }
    });
    return Object.fromEntries(Object.entries(categories).filter(([_, items]) => items.length > 0));
  }, [selectedReq]);

  const handlePrint = () => {
    const pw = window.open('', '_blank');
    const styles = { 'Refrigerated': { e: '🧊', bg: '#e0f2fe', b: '#0ea5e9' }, 'Freezer': { e: '❄️', bg: '#e0e7ff', b: '#6366f1' }, 'Dry Storage': { e: '📦', bg: '#fef3c7', b: '#d97706' }, 'Equipment': { e: '🔧', bg: '#fed7aa', b: '#ea580c' }, 'Supplies': { e: '🧹', bg: '#e5e7eb', b: '#4b5563' }, 'Linens': { e: '🧺', bg: '#fce7f3', b: '#db2777' } };
    let html = Object.entries(categorizedIngredients).map(([cat, items]) => {
      const s = styles[cat] || { e: '📋', bg: '#f3f4f6', b: '#6b7280' };
      return `<div style="margin-bottom:20px"><div style="background:${s.bg};border-left:4px solid ${s.b};padding:8px 12px;font-weight:bold">${s.e} ${cat}</div><table style="width:100%;border-collapse:collapse"><thead><tr style="background:#f9fafb"><th style="width:40px;padding:8px;border-bottom:1px solid #ddd">✓</th><th style="padding:8px;text-align:left;border-bottom:1px solid #ddd">Item</th><th style="width:80px;padding:8px;text-align:right;border-bottom:1px solid #ddd">Qty</th><th style="width:80px;padding:8px;border-bottom:1px solid #ddd">Unit</th></tr></thead><tbody>${items.map(i => `<tr><td style="padding:8px;text-align:center;border-bottom:1px solid #eee"><span style="display:inline-block;width:18px;height:18px;border:2px solid #333"></span></td><td style="padding:8px;border-bottom:1px solid #eee">${i.name}</td><td style="padding:8px;text-align:right;font-weight:bold;border-bottom:1px solid #eee">${i.quantity}</td><td style="padding:8px;border-bottom:1px solid #eee">${i.unit}</td></tr>`).join('')}</tbody></table></div>`;
    }).join('');
    const sc = studentCount > 0 ? studentCount : 12;
    const linens = `<div style="margin-bottom:20px"><div style="background:#fce7f3;border-left:4px solid #db2777;padding:8px 12px;font-weight:bold">🧺 Linens</div><table style="width:100%;border-collapse:collapse"><thead><tr style="background:#f9fafb"><th style="width:40px;padding:8px;border-bottom:1px solid #ddd">✓</th><th style="padding:8px;text-align:left;border-bottom:1px solid #ddd">Item</th><th style="width:80px;padding:8px;text-align:right;border-bottom:1px solid #ddd">Qty</th><th style="width:80px;padding:8px;border-bottom:1px solid #ddd">Unit</th></tr></thead><tbody><tr><td style="padding:8px;text-align:center;border-bottom:1px solid #eee"><span style="display:inline-block;width:18px;height:18px;border:2px solid #333"></span></td><td style="padding:8px;border-bottom:1px solid #eee">Towels</td><td style="padding:8px;text-align:right;font-weight:bold;border-bottom:1px solid #eee">${sc * 2}</td><td style="padding:8px;border-bottom:1px solid #eee">ea</td></tr><tr><td style="padding:8px;text-align:center;border-bottom:1px solid #eee"><span style="display:inline-block;width:18px;height:18px;border:2px solid #333"></span></td><td style="padding:8px;border-bottom:1px solid #eee">Aprons</td><td style="padding:8px;text-align:right;font-weight:bold;border-bottom:1px solid #eee">${sc}</td><td style="padding:8px;border-bottom:1px solid #eee">ea</td></tr></tbody></table></div>`;
    pw.document.write(`<!DOCTYPE html><html><head><title>Pull List</title><style>body{font-family:Arial,sans-serif;padding:20px;max-width:800px;margin:0 auto}</style></head><body><h1 style="font-size:22px;margin-bottom:4px">PULL LIST - ${selectedReq?.course || ''}</h1><div style="color:#666;margin-bottom:20px;display:grid;grid-template-columns:1fr 1fr;gap:4px"><div><strong>Topic:</strong> ${selectedReq?.week || '-'}</div><div><strong>Instructor:</strong> ${selectedReq?.instructor || '-'}</div><div><strong>Date:</strong> ${selectedReq?.class_date || '-'}</div><div><strong>Students:</strong> ${sc}</div></div>${html}${linens}<div style="margin-top:30px;padding-top:16px;border-top:1px solid #ccc"><div style="display:flex;gap:40px"><div>Pulled by: _______________________</div><div>Date: _____________</div><div>Time: _____________</div></div></div></body></html>`);
    pw.document.close();
    pw.print();
  };

  if (loading) return <div className="p-6"><div className="animate-pulse text-gray-500">Loading...</div></div>;

  const displayStudentCount = studentCount > 0 ? studentCount : 12;
  const linensItems = [
    { name: 'Towels', quantity: displayStudentCount * 2, unit: 'ea' },
    { name: 'Aprons', quantity: displayStudentCount, unit: 'ea' }
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Generate Pull List</h1>
      <div className="bg-white border rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Class Date</label>
            <input type="date" value={dateFilter} onChange={(e) => { setDateFilter(e.target.value); setSelectedReqId(null); }} className="w-full px-3 py-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
            <select value={courseFilter} onChange={(e) => { setCourseFilter(e.target.value); setSelectedReqId(null); }} className="w-full px-3 py-2 border rounded-lg">
              <option value="">All Courses</option>
              {courses.map(c => <option key={c} value={c}>{c} ({getStudentCount(c) || 12} students)</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quick Select</label>
            <div className="flex gap-2">
              <button onClick={() => { setDateFilter(new Date().toISOString().split('T')[0]); setSelectedReqId(null); }} className="px-3 py-2 text-sm bg-gray-100 rounded-lg hover:bg-gray-200">Today</button>
              <button onClick={() => { const t = new Date(); t.setDate(t.getDate() + 1); setDateFilter(t.toISOString().split('T')[0]); setSelectedReqId(null); }} className="px-3 py-2 text-sm bg-gray-100 rounded-lg hover:bg-gray-200">Tomorrow</button>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-white border rounded-lg p-4 mb-6">
        <h2 className="font-semibold text-gray-700 mb-3">{filteredReqs.length} Requisition{filteredReqs.length !== 1 ? 's' : ''} Found</h2>
        {filteredReqs.length === 0 ? <p className="text-gray-500 text-sm">No requisitions match.</p> : (
          <div className="space-y-2">
            {filteredReqs.map(req => (
              <button key={req.id} onClick={() => setSelectedReqId(req.id)} className={`w-full text-left p-3 rounded-lg border ${selectedReqId === req.id ? 'bg-blue-50 border-blue-300' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}`}>
                <div className="flex justify-between"><div><span className="font-medium">{req.course}</span><span className="text-gray-500 ml-2">- {req.week || 'No topic'}</span><span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">{getStudentCount(req.course) || 12} students</span></div><span className="text-sm text-gray-500">{req.ingredients?.length || 0} items</span></div>
                <div className="text-sm text-gray-500 mt-1">{req.instructor && <span>Instructor: {req.instructor}</span>}{req.class_date && <span className="ml-3">{req.class_date}</span>}</div>
              </button>
            ))}
          </div>
        )}
      </div>
      {selectedReq && (
        <div className="bg-white border rounded-lg overflow-hidden">
          <div className="bg-gray-50 border-b px-4 py-3 flex justify-between items-center">
            <div><h2 className="font-semibold text-gray-700">Pull List Preview</h2><div className="text-sm text-gray-500 mt-1">{displayStudentCount} students</div></div>
            <button onClick={handlePrint} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">🖨️ Print</button>
          </div>
          <div className="p-4">
            {Object.entries(categorizedIngredients).map(([cat, items]) => (
              <div key={cat} className={`mb-4 border rounded-lg overflow-hidden ${cat === 'Refrigerated' ? 'border-sky-300' : cat === 'Freezer' ? 'border-indigo-300' : cat === 'Equipment' ? 'border-orange-300' : cat === 'Supplies' ? 'border-gray-400' : 'border-amber-300'}`}>
                <div className={`px-3 py-2 font-semibold text-sm ${cat === 'Refrigerated' ? 'bg-sky-50' : cat === 'Freezer' ? 'bg-indigo-50' : cat === 'Equipment' ? 'bg-orange-50' : cat === 'Supplies' ? 'bg-gray-100' : 'bg-amber-50'}`}>{cat === 'Refrigerated' ? '🧊' : cat === 'Freezer' ? '❄️' : cat === 'Equipment' ? '🔧' : cat === 'Supplies' ? '🧹' : '📦'} {cat} ({items.length})</div>
                <table className="w-full bg-white"><tbody>{items.map((i, idx) => <tr key={idx} className="border-t"><td className="px-3 py-2 text-sm">{i.name}</td><td className="px-3 py-2 text-sm text-right font-medium w-20">{i.quantity}</td><td className="px-3 py-2 text-sm text-gray-500 w-20">{i.unit}</td></tr>)}</tbody></table>
              </div>
            ))}
            <div className="mb-4 border border-pink-300 rounded-lg overflow-hidden">
              <div className="px-3 py-2 font-semibold text-sm bg-pink-50">🧺 Linens ({linensItems.length})</div>
              <table className="w-full bg-white"><tbody>{linensItems.map((i, idx) => <tr key={idx} className="border-t"><td className="px-3 py-2 text-sm">{i.name}</td><td className="px-3 py-2 text-sm text-right font-medium w-20">{i.quantity}</td><td className="px-3 py-2 text-sm text-gray-500 w-20">{i.unit}</td></tr>)}</tbody></table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
