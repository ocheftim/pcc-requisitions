import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

// Tab configuration
const TABS = [
  { id: 'build', label: 'Build Order', icon: 'plus' },
];

// Course configuration
const COURSES = [
  { id: 'CUL130', name: 'CUL130' },
  { id: 'CUL160', name: 'CUL160' },
  { id: 'CUL244', name: 'CUL244' },
  { id: 'CUL260', name: 'CUL260' },
];

const SESSION_START = new Date("2026-01-12");
const getWeekNumber = (d) => Math.max(1, Math.floor((new Date(d) - SESSION_START) / 604800000) + 1);
const getWeekRange = (w) => {
  const s = new Date(SESSION_START); s.setDate(s.getDate() + (w-1)*7);
  const e = new Date(s); e.setDate(e.getDate() + 6);
  return s.toLocaleDateString('en-US',{month:'short',day:'numeric'}) + ' - ' + e.toLocaleDateString('en-US',{month:'short',day:'numeric'});
};

export default function OrdersPage() {
  const { tab } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // State
  const [activeTab, setActiveTab] = useState(tab || 'build');
  const [requisitions, setRequisitions] = useState([]);
  const [selectedReqs, setSelectedReqs] = useState([]);
  const [consolidatedItems, setConsolidatedItems] = useState([]);
  const [selectedWeeks, setSelectedWeeks] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [selectedTerm, setSelectedTerm] = useState('Term 1');
  const [orderPeriod, setOrderPeriod] = useState('');

  // Check for reqs passed from Requisitions page
  useEffect(() => {
    const addReqs = searchParams.get('add');
    if (addReqs) {
      setSelectedReqs(addReqs.split(','));
    }
  }, [searchParams]);

  // Fetch data based on tab
  useEffect(() => {
    if (activeTab === 'build') {
      fetchApprovedRequisitions();
    } else if (activeTab === 'confirmations') {
      fetchConfirmations();
    } else {
      fetchOrders();
    }
  }, [activeTab, selectedCourse]);

  const fetchApprovedRequisitions = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('requisitions')
        .select('*')
        
        .order('class_date', { ascending: true });

      if (selectedCourse !== 'all') {
        query = query.eq('course', selectedCourse);
      }

      const { data, error } = await query;
      if (error) throw error;
      setRequisitions(data || []);
      
      // Auto-select reqs if passed via URL
      const addReqs = searchParams.get('add');
      if (addReqs && data) {
        const reqIds = addReqs.split(',');
        const validIds = reqIds.filter(id => data.some(r => r.id === id));
        setSelectedReqs(validIds);
      }
    } catch (error) {
      console.error('Error fetching requisitions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const status = activeTab === 'pending' ? 'pending' : 'sent';
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('status', status)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchConfirmations = async () => {
    setLoading(true);
    try {
      // Get requisitions that are part of sent orders
      const { data, error } = await supabase
        .from('requisitions')
        .select('*')
        .in('status', ['ordered', 'confirmed'])
        .order('instructor', { ascending: true });

      if (error) throw error;
      setRequisitions(data || []);
    } catch (error) {
      console.error('Error fetching confirmations:', error);
    } finally {
      setLoading(false);
    }
  };

  // Consolidate items from selected requisitions
  useEffect(() => {
    if (selectedReqs.length === 0) {
      setConsolidatedItems([]);
      return;
    }

    const selectedData = requisitions.filter(r => selectedReqs.includes(r.id));
    const itemMap = new Map();

    selectedData.forEach(req => {
      const items = parseItems(req.items);
      items.forEach(item => {
        const key = item.name.toLowerCase().trim();
        if (itemMap.has(key)) {
          const existing = itemMap.get(key);
          existing.quantity += parseFloat(item.quantity) || 0;
          existing.sources.push({ course: req.course, instructor: req.instructor, qty: item.quantity });
        } else {
          itemMap.set(key, {
            name: item.name,
            unit: item.unit,
            quantity: parseFloat(item.quantity) || 0,
            category: item.category || 'Other',
            sources: [{ course: req.course, instructor: req.instructor, qty: item.quantity }],
          });
        }
      });
    });

    setConsolidatedItems(Array.from(itemMap.values()).sort((a, b) => a.name.localeCompare(b.name)));
  }, [selectedReqs, requisitions]);

  const parseItems = (items) => {
    if (!items) return [];
    if (typeof items === 'string') {
      try {
        return JSON.parse(items);
      } catch {
        return [];
      }
    }
    return items;
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    navigate(`/orders/${tabId}`, { replace: true });
  };

  const handleSelectReq = (reqId) => {
    setSelectedReqs(prev => 
      prev.includes(reqId) 
        ? prev.filter(id => id !== reqId)
        : [...prev, reqId]
    );
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr + 'T12:00:00');
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' });
  };


  // Group requisitions by week
  const reqsByWeek = useMemo(() => {
    const w = {};
    requisitions.forEach(r => {
      const n = getWeekNumber(r.class_date);
      if (!w[n]) w[n] = { week: n, label: getWeekRange(n), reqs: [] };
      w[n].reqs.push(r);
    });
    return Object.values(w).sort((a, b) => a.week - b.week);
  }, [requisitions]);

  const toggleWeek = (n) => {
    const d = reqsByWeek.find(w => w.week === n);
    if (!d) return;
    const ids = d.reqs.map(r => r.id);
    if (ids.every(id => selectedReqs.includes(id))) {
      setSelectedReqs(p => p.filter(id => !ids.includes(id)));
      setSelectedWeeks(p => p.filter(w => w !== n));
    } else {
      setSelectedReqs(p => [...new Set([...p, ...ids])]);
      setSelectedWeeks(p => [...new Set([...p, n])]);
    }
  };

  const isWeekSelected = (n) => {
    const d = reqsByWeek.find(w => w.week === n);
    return d ? d.reqs.every(r => selectedReqs.includes(r.id)) : false;
  };

  const handlePrintOrder = () => {
    // Normalize and consolidate ingredients
    const normalize = (items) => {
      const grouped = {};
      
      items.forEach(item => {
        let name = item.name || '';
        let qty = parseFloat(item.quantity) || 0;
        let unit = (item.unit || 'ea').toLowerCase();
        let cat = item.category || 'Other';
        
        // Name normalization
        if (/clarified butter/i.test(name)) name = 'Butter, Unsalted';
        if (/cream.*heavy.*whip/i.test(name)) name = 'Cream, Heavy';
        if (/heavy whipping cream/i.test(name)) name = 'Cream, Heavy';
        
        // Unit fixes - remove invalid units like "basket"
        if (/basket/i.test(unit)) unit = 'pt';
        
        // Category corrections
        if (/evaporated milk|sweetened condensed|condensed milk/i.test(name)) cat = 'Pantry';
        if (/cocoa/i.test(name)) cat = 'Baking';
        
        const key = name.toLowerCase().trim();
        if (!grouped[key]) {
          grouped[key] = { name, quantities: [], category: cat };
        }
        grouped[key].quantities.push({ qty, unit });
        // Use most specific category
        if (cat !== 'Other') grouped[key].category = cat;
      });
      
      // Consolidate quantities
      return Object.values(grouped).map(item => {
        let totalQty = 0;
        let finalUnit = 'ea';
        const units = item.quantities.map(q => q.unit);
        
        // Cream/milk - convert to quarts
        if (/cream|milk|half.*half/i.test(item.name) && !/condensed|evaporated/i.test(item.name)) {
          item.quantities.forEach(q => {
            if (/gal/i.test(q.unit)) totalQty += q.qty * 4;
            else if (/qt|quart/i.test(q.unit)) totalQty += q.qty;
            else if (/pt|pint/i.test(q.unit)) totalQty += q.qty * 0.5;
            else if (/cup|c$/i.test(q.unit)) totalQty += q.qty * 0.25;
            else totalQty += q.qty;
          });
          finalUnit = 'qt';
        }
        // Eggs - convert to flats (30 ea)
        else if (/^eggs?$/i.test(item.name.trim())) {
          item.quantities.forEach(q => {
            if (/flat/i.test(q.unit)) totalQty += q.qty * 30;
            else if (/dz|doz/i.test(q.unit)) totalQty += q.qty * 12;
            else totalQty += q.qty;
          });
          const flats = Math.ceil(totalQty / 30);
          const remainder = totalQty % 30;
          finalUnit = 'flat';
          totalQty = flats;
          if (remainder > 0) {
            return { name: item.name, quantity: flats + ' (' + Math.round(totalQty * 30 / flats) + ' ea)', unit: finalUnit, category: item.category };
          }
        }
        // Weight - consolidate oz/lb
        else if (units.some(u => /oz|lb/i.test(u))) {
          item.quantities.forEach(q => {
            if (/oz/i.test(q.unit)) totalQty += q.qty / 16;
            else if (/lb/i.test(q.unit)) totalQty += q.qty;
            else totalQty += q.qty;
          });
          finalUnit = 'lb';
        }
        // Volume - consolidate cups/tbsp etc
        else if (units.some(u => /cup|tbsp|tsp/i.test(u))) {
          item.quantities.forEach(q => {
            if (/cup|c$/i.test(q.unit)) totalQty += q.qty;
            else if (/tbsp/i.test(q.unit)) totalQty += q.qty / 16;
            else if (/tsp/i.test(q.unit)) totalQty += q.qty / 48;
            else totalQty += q.qty;
          });
          finalUnit = 'cup';
        }
        // Count items
        else {
          item.quantities.forEach(q => totalQty += q.qty);
          finalUnit = units[0] || 'ea';
        }
        
        return { 
          name: item.name, 
          quantity: Math.round(totalQty * 100) / 100, 
          unit: finalUnit, 
          category: item.category 
        };
      });
    };
    
    const normalized = normalize(consolidatedItems);
    
    // Group by category
    const categories = {};
    normalized.forEach(item => {
      const cat = item.category || "Other";
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(item);
    });
    
    // Category order
    const catOrder = ["Produce", "Dairy", "Protein", "Baking", "Pantry", "Spices", "Supplies", "Wine & Spirits", "Other"];
    const sorted = {};
    catOrder.forEach(cat => {
      if (categories[cat]) sorted[cat] = categories[cat].sort((a, b) => a.name.localeCompare(b.name));
    });
    // Add any remaining categories
    Object.keys(categories).forEach(cat => {
      if (!sorted[cat]) sorted[cat] = categories[cat].sort((a, b) => a.name.localeCompare(b.name));
    });
    
    const today = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    const weekInfo = selectedReqs.length > 0 ? 'Selected' : '';
    
    let html = "<h1 style=\"font-family:Arial;font-size:18px;margin-bottom:8px;\">Consolidated Order</h1>";
    html += "<p style=\"font-family:Arial;font-size:12px;margin-bottom:16px;\">" + weekInfo + " | " + selectedReqs.length + " requisitions | " + normalized.length + " items | " + today + "</p>";
    html += "<table border=\"1\" cellpadding=\"6\" cellspacing=\"0\" style=\"border-collapse:collapse;width:100%;font-family:Arial;font-size:11px;\">";
    html += "<thead><tr style=\"background:#f0f0f0;\"><th style=\"width:30px\">✓</th><th align=\"left\">Item</th><th align=\"center\" style=\"width:60px\">Qty</th><th align=\"left\" style=\"width:50px\">Unit</th><th align=\"center\" style=\"width:70px\">On Hand</th></tr></thead><tbody>";
    Object.entries(sorted).forEach(([category, items]) => {
      html += "<tr><td colspan=\"5\" style=\"background:#e0e0e0;font-weight:bold;\">" + category + "</td></tr>";
      items.forEach(item => {
        html += "<tr><td style=\"text-align:center;\">☐</td><td>" + item.name + "</td><td style=\"text-align:center;\">" + item.quantity + "</td><td>" + item.unit + "</td><td style=\"border:1px solid #ccc;\"></td></tr>";
      });
    });
    html += "</tbody></table>";
    const pw = window.open("", "_blank");
    pw.document.write("<!DOCTYPE html><html><head><title>Consolidated Order</title><style>@media print { @page { margin: 0.5in; } }</style></head><body style=\"padding:20px;\">" + html + "</body></html>");
    pw.document.close();
    pw.print();
  };

  const handleSaveOrder = async () => {
    // Save order logic
    alert('Order saved as draft');
  };

  const handleSendOrder = async () => {
    // Send order logic
    alert('Order sent to vendor');
  };

  // Group confirmations by instructor
  const groupByInstructor = (reqs) => {
    const grouped = {};
    reqs.forEach(req => {
      if (!grouped[req.instructor]) {
        grouped[req.instructor] = [];
      }
      grouped[req.instructor].push(req);
    });
    return grouped;
  };

  const handlePrintConfirmation = (instructor) => {
    // Print single instructor confirmation
    window.print();
  };

  const handlePrintAllConfirmations = () => {
    window.print();
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-600">Build vendor orders and track confirmations</p>
        </div>
        {activeTab === 'build' && selectedReqs.length > 0 && (
          <button
            onClick={handlePrintOrder}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print Order
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200">
          <div className="flex">
            {TABS.map((t) => {
              const isActive = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => handleTabChange(t.id)}
                  className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    isActive
                      ? 'border-blue-600 text-blue-600 bg-blue-50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* BUILD ORDER TAB */}
        {activeTab === 'build' && (
          <div className="p-6">
            {/* Filters */}
            <div className="flex items-center gap-4 mb-6 pb-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Courses:</span>
                <button
                  onClick={() => setSelectedCourse('all')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    selectedCourse === 'all'
                      ? 'bg-gray-800 text-white'
                      : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  All
                </button>
                {COURSES.map((course) => (
                  <button
                    key={course.id}
                    onClick={() => setSelectedCourse(course.id)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      selectedCourse === course.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {course.name}
                  </button>
                ))}
              </div>
              
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-sm text-gray-600">Term:</span>
                <select
                  value={selectedTerm}
                  onChange={(e) => setSelectedTerm(e.target.value)}
                  className="px-3 py-1.5 rounded-lg text-sm border border-gray-300 bg-white"
                >
                  <option>Term 1</option>
                  <option>Term 2</option>
                  <option>Term 3</option>
                </select>
              </div>
            </div>

            {/* Week Selection */}
            {reqsByWeek.length > 0 && (
              <div className="mb-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-purple-800">Select Weeks:</span>
                  {selectedWeeks.length > 0 && <span className="text-sm text-purple-600">{selectedWeeks.length} week(s) • {selectedReqs.length} reqs</span>}
                </div>
                <div className="flex flex-wrap gap-2">
                  {reqsByWeek.map(w => (
                    <button key={w.week} onClick={() => toggleWeek(w.week)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium border-2 ${isWeekSelected(w.week) ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-700 border-gray-300 hover:border-purple-400'}`}>
                      <div>{isWeekSelected(w.week) && '✓ '}Week {w.week}</div>
                      <div className="text-xs opacity-75">{w.label}</div>
                      <div className="text-xs opacity-75">{w.reqs.length} reqs</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-6">
              {/* Left: Select Requisitions */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  Requisitions ({requisitions.length})
                </h3>
                
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  </div>
                ) : requisitions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No approved requisitions to order.</p>
                    <p className="text-sm mt-1">Approve requisitions first.</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {requisitions.map((req) => {
                      const items = parseItems(req.items);
                      const isSelected = selectedReqs.includes(req.id);
                      
                      return (
                        <label
                          key={req.id}
                          className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                            isSelected 
                              ? 'border-blue-300 bg-blue-50' 
                              : 'border-gray-200 bg-white hover:border-gray-300'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleSelectReq(req.id)}
                            className="mt-0.5 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900">{req.course}</span>
                              <span className="text-gray-500 text-sm">{req.instructor}</span>
                            </div>
                            <div className="text-sm text-gray-500">
                              {formatDate(req.class_date)} • {items.length} items
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Right: Consolidated Order */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  Consolidated Order ({consolidatedItems.length} items)
                </h3>
                
                {consolidatedItems.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 border border-dashed border-gray-300 rounded-lg">
                    <svg className="w-12 h-12 mx-auto text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <p>Select requisitions to build order</p>
                  </div>
                ) : (
                  <>
                    <div className="border border-gray-200 rounded-lg overflow-hidden max-h-80 overflow-y-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="text-left px-3 py-2 font-medium text-gray-700">Item</th>
                            <th className="text-right px-3 py-2 font-medium text-gray-700">Need</th>
                            <th className="text-right px-3 py-2 font-medium text-gray-700">Unit</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {consolidatedItems.map((item, idx) => (
                            <tr key={idx} className="hover:bg-gray-50">
                              <td className="px-3 py-2 text-gray-900">{item.name}</td>
                              <td className="px-3 py-2 text-right text-gray-700">{item.quantity}</td>
                              <td className="px-3 py-2 text-right text-gray-500">{item.unit}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* PENDING TAB */}
        {activeTab === 'pending' && (
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-1">No pending orders</h3>
                <p>Orders saved as drafts will appear here.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map((order) => (
                  <div key={order.id} className="p-4 rounded-lg border border-gray-200 bg-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium text-gray-900">Order #{order.id?.slice(0,8)}</span>
                        <span className="text-gray-500 ml-3">{formatDate(order.created_at)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">
                          Edit
                        </button>
                        <button className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                          Send
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SENT TAB */}
        {activeTab === 'sent' && (
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-1">No sent orders</h3>
                <p>Orders sent to vendors will appear here.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map((order) => (
                  <div key={order.id} className="p-4 rounded-lg border border-gray-200 bg-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium text-gray-900">Order #{order.id?.slice(0,8)}</span>
                        <span className="text-gray-500 ml-3">Sent {formatDate(order.sent_at)}</span>
                        <span className="ml-3 px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700">
                          {order.vendor || 'Sysco'}
                        </span>
                      </div>
                      <button className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700">
                        Mark Received
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CONFIRMATIONS TAB */}
        {activeTab === 'confirmations' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-semibold text-gray-700">
                Instructor Confirmations
              </h3>
              {requisitions.length > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrintAllConfirmations}
                    className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                  >
                    Print All
                  </button>
                  <button className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Email All
                  </button>
                </div>
              )}
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : requisitions.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-1">No confirmations</h3>
                <p>Confirmations will appear after orders are sent.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(groupByInstructor(requisitions)).map(([instructor, reqs]) => (
                  <div key={instructor} className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-gray-900">{instructor}</span>
                        <span className="text-gray-500 ml-2">({reqs.length} requisitions)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handlePrintConfirmation(instructor)}
                          className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-200 rounded"
                        >
                          Print
                        </button>
                        <button className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded">
                          Email
                        </button>
                      </div>
                    </div>
                    <div className="p-4">
                      {reqs.map((req) => {
                        const items = parseItems(req.items);
                        return (
                          <div key={req.id} className="mb-4 last:mb-0">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-medium text-gray-700">{req.course}</span>
                              <span className="text-gray-500">—</span>
                              <span className="text-gray-600">{req.week_number || req.module_name}</span>
                              <span className="text-gray-500">•</span>
                              <span className="text-gray-500">{formatDate(req.class_date)}</span>
                            </div>
                            <div className="pl-4 space-y-1">
                              {items.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-2 text-sm">
                                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                  <span className="text-gray-700">{item.name}</span>
                                  <span className="text-gray-500">— {item.quantity} {item.unit}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
