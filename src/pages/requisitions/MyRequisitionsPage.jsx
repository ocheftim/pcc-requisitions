import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRequisitions, deleteRequisition, supabase } from '../../lib/supabase';

export default function MyRequisitionsPage({ initialFilter = null }) {
  const [requisitions, setRequisitions] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [selectedInstructor, setSelectedInstructor] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [viewFilter, setViewFilter] = useState(initialFilter);
  const navigate = useNavigate();

  const instructors = [
    'Cabrera',
    'Kouchit',
    'McKoy',
    'Mikesell',
    'Moreno',
    "O'Donnell",
    'Toscano',
    'Wong',
    'Kouchit'
  ];

  useEffect(() => { loadRequisitions(); }, [initialFilter]);

  const loadRequisitions = async () => {
    try {
      const data = await getRequisitions();
      setRequisitions(data || []);
      const { data: ings } = await supabase.from("ingredients").select("*");
      setIngredients(ings || []);
    } catch (error) {
      console.error('Error loading requisitions:', error);
      const orders = JSON.parse(localStorage.getItem('instructorOrders') || '[]');
      setRequisitions(orders);
    }
  };

  const filteredRequisitions = selectedInstructor
    ? requisitions.filter(req => req.instructor === selectedInstructor)
    : requisitions;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

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
    const diff = Math.ceil((target - today) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const isEditable = (req) => {
    if (!req.class_date) return true;
    const dueDate = getDueDate(req.class_date);
    return today < dueDate;
  };

  const isPending = (req) => {
    if (!req.class_date) return true;
    const classDate = new Date(req.class_date);
    classDate.setHours(0, 0, 0, 0);
    return classDate >= today;
  };

  const isLocked = (req) => {
    if (!req.class_date) return false;
    const dueDate = getDueDate(req.class_date);
    const classDate = new Date(req.class_date);
    classDate.setHours(0, 0, 0, 0);
    return today >= dueDate && classDate >= today;
  };

  const isArchived = (req) => {
    if (!req.class_date) return false;
    const classDate = new Date(req.class_date);
    classDate.setHours(0, 0, 0, 0);
    return classDate < today;
  };

  const sortByClassDate = (a, b, ascending = true) => {
    const dateA = new Date(a.class_date || '2099-12-31');
    const dateB = new Date(b.class_date || '2099-12-31');
    return ascending ? dateA - dateB : dateB - dateA;
  };

  const pendingReqs = filteredRequisitions
    .filter(req => isPending(req) && !isLocked(req))
    .sort((a, b) => sortByClassDate(a, b, true));

  const lockedReqs = filteredRequisitions
    .filter(req => isLocked(req))
    .sort((a, b) => sortByClassDate(a, b, true));

  const archivedReqs = filteredRequisitions
    .filter(req => isArchived(req))
    .sort((a, b) => sortByClassDate(a, b, false));

  const handleCopyRequisition = (req) => {
    localStorage.setItem('requisitionToCopy', JSON.stringify(req));
    localStorage.removeItem('requisitionToEdit');
    navigate('/requisitions/create');
  };

  const handleEditRequisition = (req) => {
    if (!isEditable(req)) {
      alert('This requisition is locked. The due date has passed.');
      return;
    }
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

  const formatDate = (dateStr) => {
    if (!dateStr) return 'No date set';
    const date = typeof dateStr === "string" ? new Date(dateStr + "T12:00:00") : dateStr;
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatShortDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = typeof dateStr === "string" ? new Date(dateStr + "T12:00:00") : dateStr;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };


  const enrichItemsWithPrices = (items) => {
    if (!items || !ingredients.length) return items || [];
    return items.map(item => {
      const ing = ingredients.find(i => i.name?.toLowerCase() === item.name?.toLowerCase());
      if (ing) {
        const unitPrice = ing.unit_price || 0;
        return { ...item, unitCost: unitPrice, extended: unitPrice * (item.quantity || 0) };
      }
      return { ...item, unitCost: item.unitCost || 0, extended: (item.unitCost || 0) * (item.quantity || 0) };
    });
  };

  const groupItemsByCategory = (items) => {
    const groups = {};
    items.forEach((item, idx) => {
      const cat = item.category || 'Other';
      const subcat = item.subcategory || 'General';
      if (!groups[cat]) groups[cat] = {};
      if (!groups[cat][subcat]) groups[cat][subcat] = [];
      groups[cat][subcat].push({ ...item, originalIndex: idx });
    });
    return groups;
  };

  const calculateTotal = (items) => {
    if (!items) return 0;
    return items.filter(i => !i.isNA).reduce((sum, item) => sum + (item.extended || 0), 0);
  };

  const renderRequisitionCard = (req, section) => {
    const displayTotal = calculateTotal(enrichItemsWithPrices(req.items));
    const isExpanded = expandedId === req.id;
    const dueDate = getDueDate(req.class_date);
    const daysUntilClass = getDaysUntil(req.class_date);
    const daysUntilDue = getDaysUntil(dueDate);
    const canEdit = isEditable(req);
    const locked = isLocked(req);

    return (
      <div key={req.id} className={`border rounded-lg p-4 transition-shadow ${locked ? 'border-orange-300 bg-orange-50' : section === 'archived' ? 'border-gray-200 bg-gray-50' : 'border-gray-200 bg-white hover:shadow-md'}`}>
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xl font-bold text-gray-800">
                {req.program} • {req.course}
              </h3>
              {locked && (
                <span className="px-2 py-1 bg-orange-200 text-orange-800 text-xs font-bold rounded">
                  🔒 LOCKED
                </span>
              )}
              {section === 'archived' && (
                <span className="px-2 py-1 bg-gray-300 text-gray-700 text-xs font-bold rounded">
                  ARCHIVED
                </span>
              )}
            </div>
            <p className="text-lg font-semibold text-blue-700">{req.instructor} - {req.week}</p>
            {req.recipes && <p className="text-sm text-gray-600 mt-1">📖 {req.recipes}</p>}
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-800">${displayTotal.toFixed(2)}</div>
            <div className={`text-sm font-medium ${((req.budget || 0) - displayTotal) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              Balance: ${((req.budget || 0) - displayTotal).toFixed(2)}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 mb-3 p-3 bg-gray-100 rounded-lg text-sm">
          <div>
            <span className="text-gray-500">Class Date:</span>
            <span className="ml-2 font-semibold">{formatDate(req.class_date)}</span>
            {daysUntilClass !== null && daysUntilClass >= 0 && (
              <span className="ml-2 text-blue-600">({daysUntilClass} days)</span>
            )}
          </div>
          {dueDate && section !== 'archived' && (
            <div>
              <span className="text-gray-500">Order Due:</span>
              <span className={`ml-2 font-semibold ${daysUntilDue < 0 ? 'text-red-600' : daysUntilDue <= 3 ? 'text-orange-600' : 'text-green-600'}`}>
                {formatShortDate(dueDate)}
              </span>
              {daysUntilDue !== null && (
                <span className={`ml-2 ${daysUntilDue < 0 ? 'text-red-600' : daysUntilDue <= 3 ? 'text-orange-600' : 'text-green-600'}`}>
                  {daysUntilDue < 0 ? '(Past due)' : daysUntilDue === 0 ? '(Due today!)' : `(${daysUntilDue} days left)`}
                </span>
              )}
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
                  <th className="text-center p-2">Unit</th>
                  <th className="text-right p-2">Qty</th>
                  <th className="text-right p-2">Unit Cost</th>
                  <th className="text-right p-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {req.items && Object.entries(groupItemsByCategory(enrichItemsWithPrices(req.items.filter(i => i.quantity > 0)))).map(([category, subcategories]) => (
                  <React.Fragment key={category}>
                    <tr className="bg-blue-100">
                      <td colSpan={5} className="p-2 font-bold text-blue-800">{category}</td>
                    </tr>
                    {Object.entries(subcategories).map(([subcategory, items]) => (
                      <React.Fragment key={subcategory}>
                        <tr className="bg-blue-50">
                          <td colSpan={5} className="p-1 pl-4 font-semibold text-blue-600 text-sm border-l-4 border-blue-400">{subcategory}</td>
                        </tr>
                        {items.map(item => (
                          <tr key={item.originalIndex} className={`border-t ${item.isNA ? 'bg-red-50' : ''}`}>
                            <td className={`p-2 pl-6 ${item.isNA ? 'line-through text-red-400' : ''}`}>
                              {item.name}
                              {item.isNA && <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded font-bold">N/A</span>}
                            </td>
                            <td className={`text-center p-2 ${item.isNA ? 'line-through text-red-400' : ''}`}>{item.unit}</td>
                            <td className={`text-right p-2 ${item.isNA ? 'line-through text-red-400' : ''}`}>{item.quantity}</td>
                            <td className={`text-right p-2 ${item.isNA ? 'line-through text-red-400' : ''}`}>${(item.unitCost || 0).toFixed(2)}</td>
                            <td className={`text-right p-2 font-medium ${item.isNA ? 'line-through text-red-400' : ''}`}>{item.isNA ? '$0.00' : `$${(item.extended || 0).toFixed(2)}`}</td>
                          </tr>
                        ))}
                      </React.Fragment>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 font-semibold">
                <tr>
                  <td colSpan={4} className="text-right p-2">Total:</td>
                  <td className="text-right p-2">${displayTotal.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </details>

        <div className="flex gap-3 mt-4 pt-4 border-t flex-wrap">
          {canEdit && (
            <button onClick={() => handleEditRequisition(req)} className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 text-sm font-medium">✏️ Edit / Add Items</button>
          )}
          <button onClick={() => handleCopyRequisition(req)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">📋 Copy & Reorder</button>
          <button onClick={() => { localStorage.setItem('requisitionToPrint', JSON.stringify(req)); window.open('/requisitions/print', '_blank'); }} className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm">🖨️ Print</button>
          {section !== 'archived' && (
            <button onClick={() => handleDeleteRequisition(req)} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm ml-auto">🗑️ Delete</button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Requisitions</h1>
          <button onClick={() => { localStorage.removeItem('requisitionToEdit'); localStorage.removeItem('requisitionToCopy'); navigate('/requisitions/create'); }} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">+ Create New</button>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Instructor</label>
          <select value={selectedInstructor} onChange={(e) => setSelectedInstructor(e.target.value)} className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-lg">
            <option value="">All Instructors</option>
            {instructors.map(inst => <option key={inst} value={inst}>{inst}</option>)}
          </select>
        </div>

        {pendingReqs.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4 pb-2 border-b-2 border-green-500">
              <h2 className="text-xl font-bold text-green-800">📝 Pending Requisitions</h2>
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">{pendingReqs.length}</span>
              <span className="text-sm text-gray-500">— Editable until 10 days before class</span>
            </div>
            <div className="space-y-4">
              {(() => {
                let lastWeek = null;
                return pendingReqs.map((req, idx) => {
                  const classDate = new Date(req.class_date);
                  const semesterStart = new Date("2026-01-12");
                  const weekNum = Math.ceil((classDate - semesterStart) / (7 * 24 * 60 * 60 * 1000));
                  const showHeader = weekNum !== lastWeek;
                  lastWeek = weekNum;
                  return (
                    <React.Fragment key={req.id}>
                      {showHeader && (
                        <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-4 py-2 rounded-lg font-bold text-lg mb-2 mt-4 first:mt-0">
                          📅 Week {weekNum === 99 ? 'Other' : weekNum}
                        </div>
                      )}
                      {renderRequisitionCard(req, 'pending')}
                    </React.Fragment>
                  );
                });
              })()}
            </div>
          </div>
        )}

        {lockedReqs.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4 pb-2 border-b-2 border-orange-500">
              <h2 className="text-xl font-bold text-orange-800">🔒 Locked Requisitions</h2>
              <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-semibold">{lockedReqs.length}</span>
              <span className="text-sm text-gray-500">— Within 10 days of class, no longer editable</span>
            </div>
            <div className="space-y-4">
              {lockedReqs.map(req => renderRequisitionCard(req, 'locked'))}
            </div>
          </div>
        )}

        {archivedReqs.length > 0 && (
          <div className="mb-8">
            <details>
              <summary className="cursor-pointer">
                <div className="inline-flex items-center gap-3 mb-4 pb-2 border-b-2 border-gray-400">
                  <h2 className="text-xl font-bold text-gray-600">📁 Archived Requisitions</h2>
                  <span className="px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-sm font-semibold">{archivedReqs.length}</span>
                  <span className="text-sm text-gray-500">— Past class dates</span>
                </div>
              </summary>
              <div className="space-y-4 mt-4">
                {archivedReqs.map(req => renderRequisitionCard(req, 'archived'))}
              </div>
            </details>
          </div>
        )}

        {filteredRequisitions.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg mb-4">No requisitions found</p>
            <button onClick={() => navigate('/requisitions/create')} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Create Your First Requisition</button>
          </div>
        )}

        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-2">💡 How It Works:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• <strong>Pending:</strong> Click "Edit / Add Items" to modify quantities or add ingredients</li>
            <li>• <strong>Locked:</strong> Within 10 days of class — orders are being processed, no changes allowed</li>
            <li>• <strong>Archived:</strong> Past class dates — view-only, use "Copy & Reorder" to create new</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
