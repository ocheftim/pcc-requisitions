import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRequisitions, deleteRequisition, supabase } from '../../lib/supabase';

export default function MyRequisitionsPage() {
  const [requisitions, setRequisitions] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [selectedInstructor, setSelectedInstructor] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const navigate = useNavigate();

  // Updated instructor list - only active instructors
  const instructors = ['Mikesell', 'Moreno', 'Wong'];

  // Session dates for week calculation
  const SESSION_1_START = new Date("2026-01-12T12:00:00");
  const SESSION_2_START = new Date("2026-03-23T12:00:00");

  useEffect(() => { loadRequisitions(); }, []);

  const loadRequisitions = async () => {
    try {
      const data = await getRequisitions();
      setRequisitions(data || []);
      const { data: ings } = await supabase.from("ingredients").select("*");
      setIngredients(ings || []);
    } catch (error) {
      console.error('Error loading requisitions:', error);
    }
  };

  // Get unique instructors from actual data (fallback)
  const availableInstructors = [...new Set(requisitions.map(r => r.instructor).filter(Boolean))].sort();
  const instructorOptions = instructors.length ? instructors : availableInstructors;

  const filteredRequisitions = selectedInstructor
    ? requisitions.filter(req => req.instructor === selectedInstructor)
    : requisitions;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const getWeekRange = (dateStr) => {
    const d = new Date(dateStr + 'T12:00:00');
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d);
    monday.setDate(diff);
    monday.setHours(0, 0, 0, 0);
    return monday;
  };

  const getWeekNumber = (classDate) => {
    if (!classDate) return { session: 1, week: 99 };
    const weekStart = getWeekRange(classDate);
    if (weekStart >= SESSION_2_START) {
      const diff = Math.round((weekStart - SESSION_2_START) / (7 * 24 * 60 * 60 * 1000));
      return { session: 2, week: diff + 1 };
    } else {
      const diff = Math.round((weekStart - SESSION_1_START) / (7 * 24 * 60 * 60 * 1000));
      return { session: 1, week: diff + 1 };
    }
  };

  const getWeekLabel = (classDate) => {
    const { session, week } = getWeekNumber(classDate);
    if (week < 1 || week > 8) return 'Other';
    return session === 2 ? `Session 2 - Week ${week}` : `Week ${week}`;
  };

  const getDueDate = (classDate) => {
    if (!classDate) return null;
    const due = new Date(classDate + "T12:00:00");
    due.setDate(due.getDate() - 10);
    return due;
  };

  const getDaysUntil = (date) => {
    if (!date) return null;
    const target = new Date(date);
    target.setHours(0, 0, 0, 0);
    return Math.ceil((target - today) / (1000 * 60 * 60 * 24));
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'No date set';
    const date = new Date(dateStr + "T12:00:00");
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatShortDate = (dateInput) => {
    if (!dateInput) return '-';
    const date = dateInput instanceof Date ? dateInput : new Date(dateInput + "T12:00:00");
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Sort by class date and group by week
  const sortedRequisitions = [...filteredRequisitions].sort((a, b) => {
    const dateA = new Date(a.class_date || '2099-12-31');
    const dateB = new Date(b.class_date || '2099-12-31');
    return dateA - dateB;
  });

  // Group by week
  const groupedByWeek = {};
  sortedRequisitions.forEach(req => {
    const weekLabel = getWeekLabel(req.class_date);
    const { session, week } = getWeekNumber(req.class_date);
    const sortKey = session * 100 + week;
    if (!groupedByWeek[weekLabel]) {
      groupedByWeek[weekLabel] = { reqs: [], sortKey };
    }
    groupedByWeek[weekLabel].reqs.push(req);
  });

  const sortedWeeks = Object.entries(groupedByWeek)
    .sort((a, b) => a[1].sortKey - b[1].sortKey);

  const enrichItemsWithPrices = (items) => {
    if (!items || !ingredients.length) return items || [];
    return items.map(item => {
      const ing = ingredients.find(i => i.name?.toLowerCase() === item.name?.toLowerCase());
      if (ing) {
        const unitPrice = ing.unit_price || ing.unitPrice || 0;
        return { ...item, unitCost: unitPrice, extended: unitPrice * (item.quantity || 0) };
      }
      return { ...item, unitCost: item.unitCost || 0, extended: (item.unitCost || 0) * (item.quantity || 0) };
    });
  };

  const calculateTotal = (items) => {
    if (!items) return 0;
    return items.filter(i => !i.isNA).reduce((sum, item) => sum + (item.extended || 0), 0);
  };

  const handleCopyRequisition = (req) => {
    localStorage.setItem('requisitionToCopy', JSON.stringify(req));
    localStorage.removeItem('requisitionToEdit');
    navigate('/requisitions/create');
  };

  const handleEditRequisition = (req) => {
    localStorage.setItem('requisitionToEdit', JSON.stringify(req));
    localStorage.removeItem('requisitionToCopy');
    navigate('/requisitions/create');
  };

  const handleDeleteRequisition = async (req) => {
    if (window.confirm('Are you sure you want to delete this requisition?')) {
      try {
        if (req.id) {
          await deleteRequisition(req.id);
        }
        loadRequisitions();
      } catch (error) {
        console.error('Error deleting requisition:', error);
      }
    }
  };

  const renderRequisitionCard = (req) => {
    const displayTotal = calculateTotal(enrichItemsWithPrices(req.items));
    const isExpanded = expandedId === req.id;
    const dueDate = getDueDate(req.class_date);
    const daysUntilClass = getDaysUntil(req.class_date);
    const daysUntilDue = getDaysUntil(dueDate);
    const isPast = daysUntilClass !== null && daysUntilClass < 0;

    return (
      <div key={req.id} className={`border rounded-lg p-4 transition-shadow ${isPast ? 'border-gray-200 bg-gray-50 opacity-75' : 'border-gray-200 bg-white hover:shadow-md'}`}>
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xl font-bold text-gray-800">
                {req.program} • {req.course}
              </h3>
              {isPast && (
                <span className="px-2 py-1 bg-gray-300 text-gray-700 text-xs font-bold rounded">
                  PAST
                </span>
              )}
            </div>
            <p className="text-lg font-semibold text-blue-700">{req.instructor}</p>
            {req.recipes && <p className="text-sm text-gray-600 mt-1">📖 {req.recipes}</p>}
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-800">${displayTotal.toFixed(2)}</div>
            {req.students && (
              <div className="text-sm text-gray-500">{req.students} students</div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-4 mb-3 p-3 bg-gray-100 rounded-lg text-sm">
          <div>
            <span className="text-gray-500">Class:</span>
            <span className="ml-2 font-semibold">{formatDate(req.class_date)}</span>
            {daysUntilClass !== null && daysUntilClass >= 0 && (
              <span className="ml-2 text-blue-600">(in {daysUntilClass} days)</span>
            )}
          </div>
          {dueDate && !isPast && (
            <div className={`px-3 py-1 rounded-lg font-medium ${
              daysUntilDue < 0 ? 'bg-red-100 text-red-700' : 
              daysUntilDue === 0 ? 'bg-orange-100 text-orange-700' : 
              daysUntilDue <= 3 ? 'bg-yellow-100 text-yellow-700' : 
              'bg-green-100 text-green-700'
            }`}>
              {daysUntilDue < 0 
                ? `⚠️ Order ${Math.abs(daysUntilDue)} days overdue`
                : daysUntilDue === 0 
                ? '⚠️ Order due TODAY'
                : daysUntilDue === 1
                ? '📋 Order due tomorrow'
                : `📋 Order due in ${daysUntilDue} days`
              }
              <span className="ml-2 opacity-75">({formatShortDate(dueDate)})</span>
            </div>
          )}
        </div>

        {req.notes && (
          <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
            <span className="font-medium">📝 Notes:</span> {req.notes}
          </div>
        )}

        <details open={isExpanded}>
          <summary
            className="cursor-pointer text-blue-600 hover:text-blue-800 text-sm font-medium"
            onClick={(e) => { e.preventDefault(); setExpandedId(expandedId === req.id ? null : req.id); }}
          >
            ▶ View {req.items?.filter(i => i.quantity > 0).length || 0} Items
          </summary>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="text-left p-2">Item</th>
                  <th className="text-center p-2">Source</th>
                  <th className="text-center p-2">Unit</th>
                  <th className="text-right p-2">Qty</th>
                  <th className="text-right p-2">Unit Cost</th>
                  <th className="text-right p-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {enrichItemsWithPrices(req.items?.filter(i => i.quantity > 0) || []).map((item, idx) => (
                  <tr key={idx} className={`border-t ${item.source === 'recipe' ? 'bg-green-50' : ''}`}>
                    <td className="p-2">{item.name}</td>
                    <td className="p-2 text-center">
                      {item.source === 'recipe' ? (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded">📗 Recipe</span>
                      ) : (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">➕ Added</span>
                      )}
                    </td>
                    <td className="text-center p-2">{item.unit}</td>
                    <td className="text-right p-2">{item.quantity}</td>
                    <td className="text-right p-2">${(item.unitCost || 0).toFixed(2)}</td>
                    <td className="text-right p-2 font-medium">${(item.extended || 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 font-semibold">
                <tr>
                  <td colSpan={5} className="text-right p-2">Total:</td>
                  <td className="text-right p-2">${displayTotal.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </details>

        <div className="flex gap-3 mt-4 pt-4 border-t flex-wrap">
          <button onClick={() => handleEditRequisition(req)} className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 text-sm font-medium">✏️ Edit</button>
          <button onClick={() => handleCopyRequisition(req)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">📋 Copy</button>
          <button onClick={() => { localStorage.setItem('requisitionToPrint', JSON.stringify(req)); window.open('/requisitions/print', '_blank'); }} className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm">🖨️ Print</button>
          <button onClick={() => { localStorage.setItem('confirmationReq', JSON.stringify(req)); window.open('/confirmations?id=' + req.id, '_blank'); }} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm">📋 Confirm</button>
          <button onClick={() => handleDeleteRequisition(req)} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm ml-auto">🗑️ Delete</button>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Requisitions</h1>
            <p className="text-gray-500">{filteredRequisitions.length} requisitions</p>
          </div>
          <button onClick={() => { localStorage.removeItem('requisitionToEdit'); localStorage.removeItem('requisitionToCopy'); navigate('/requisitions/create'); }} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">+ Create New</button>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Instructor</label>
          <select value={selectedInstructor} onChange={(e) => setSelectedInstructor(e.target.value)} className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-lg">
            <option value="">All Instructors</option>
            {instructorOptions.map(inst => <option key={inst} value={inst}>{inst}</option>)}
          </select>
        </div>

        {sortedWeeks.length > 0 ? (
          <div className="space-y-6">
            {sortedWeeks.map(([weekLabel, { reqs }]) => (
              <div key={weekLabel}>
                <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-4 py-2 rounded-lg font-bold text-lg mb-3 flex justify-between items-center">
                  <span>📅 {weekLabel}</span>
                  <span className="text-sm font-normal opacity-90">{reqs.length} classes</span>
                </div>
                <div className="space-y-4">
                  {reqs.map(req => renderRequisitionCard(req))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg mb-4">No requisitions found</p>
            <button onClick={() => navigate('/requisitions/create')} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Create Your First Requisition</button>
          </div>
        )}
      </div>
    </div>
  );
}
