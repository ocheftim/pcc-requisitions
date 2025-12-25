import React, { useState, useEffect } from 'react';
import { getRequisitions, updateRequisition, deleteRequisition } from '../../lib/supabase';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [filterCourse, setFilterCourse] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editingItemIdx, setEditingItemIdx] = useState(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const data = await getRequisitions();
      setOrders(data || []);
    } catch (error) {
      console.error('Error loading requisitions:', error);
      setOrders([]);
    }
  };

  const updateItemStatus = async (orderId, itemIdx, updates) => {
    const order = orders.find(o => o.id === orderId) || selectedOrder;
    if (!order) return;
    
    const updatedItems = [...order.items];
    updatedItems[itemIdx] = { ...updatedItems[itemIdx], ...updates };
    
    try {
      await updateRequisition(order.id, { items: updatedItems });
      loadOrders();
      if (selectedOrder && selectedOrder.id === order.id) {
        setSelectedOrder({ ...selectedOrder, items: updatedItems });
      }
    } catch (error) {
      console.error('Error updating item:', error);
      alert('Failed to update item');
    }
  };

  const getItemStatusColor = (status) => {
    const colors = {
      available: 'bg-green-100 text-green-800',
      unavailable: 'bg-red-100 text-red-800',
      substituted: 'bg-yellow-100 text-yellow-800',
      pending: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || colors.pending;
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      submitted: 'bg-blue-100 text-blue-800',
      approved: 'bg-green-100 text-green-800',
      ordered: 'bg-purple-100 text-purple-800',
      received: 'bg-teal-100 text-teal-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || colors.draft;
  };

  const getStatusLabel = (status) => {
    const labels = {
      draft: 'Draft',
      submitted: 'Submitted',
      approved: 'Approved',
      ordered: 'Ordered',
      received: 'Received',
      cancelled: 'Cancelled'
    };
    return labels[status] || status;
  };

  // Filter orders
  const filteredOrders = orders.filter(order => {
    if (filterCourse !== 'all' && order.course !== filterCourse) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchesInstructor = (order.instructor || '').toLowerCase().includes(term);
      const matchesCourse = (order.course || '').toLowerCase().includes(term);
      const matchesWeek = (order.week || '').toLowerCase().includes(term);
      const matchesRecipes = (order.recipes || '').toLowerCase().includes(term);
      if (!matchesInstructor && !matchesCourse && !matchesWeek && !matchesRecipes) return false;
    }
    return true;
  });

  // Sort by date (class_date or created_at), newest first
  const sortByDate = (a, b) => {
    const dateA = new Date(a.class_date || a.created_at || 0);
    const dateB = new Date(b.class_date || b.created_at || 0);
    return dateB - dateA;
  };

  // Split into pending and past
  const pendingStatuses = ['draft', 'submitted', 'approved', 'ordered'];
  const pastStatuses = ['received', 'cancelled'];
  
  const pendingOrders = filteredOrders
    .filter(o => pendingStatuses.includes(o.status))
    .sort(sortByDate);
  
  const pastOrders = filteredOrders
    .filter(o => pastStatuses.includes(o.status))
    .sort(sortByDate);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await updateRequisition(orderId, { status: newStatus });
      loadOrders();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (window.confirm('Are you sure you want to delete this order? This cannot be undone.')) {
      try {
        await deleteRequisition(orderId);
        loadOrders();
        setShowDetailModal(false);
      } catch (error) {
        console.error('Error deleting order:', error);
      }
    }
  };

  const handleViewDetails = (order) => {
    setSelectedOrder(order);
    setShowDetailModal(true);
  };

  const calculateTotal = (items) => {
    if (!items || !Array.isArray(items)) return 0;
    return items.reduce((sum, item) => {
      const cost = item.unitCost || item.price || 0;
      const qty = item.quantity || 0;
      return sum + (cost * qty);
    }, 0);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Get unique courses for filter
  const courses = [...new Set(orders.map(o => o.course).filter(Boolean))].sort();

  // Statistics
  const stats = {
    total: orders.length,
    pending: pendingOrders.length,
    past: pastOrders.length,
    totalValue: orders.reduce((sum, o) => sum + calculateTotal(o.items), 0)
  };

  const OrderTable = ({ orderList, title, emptyMessage }) => (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
      <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800">{title} ({orderList.length})</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Instructor</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Week</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {orderList.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              orderList.map(order => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {formatDate(order.class_date || order.created_at)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{order.instructor || '-'}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {order.course || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div>{order.week || '-'}</div>
                    {order.recipes && <div className="text-xs text-gray-500 truncate max-w-xs">{order.recipes}</div>}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {order.items?.length || 0}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    ${calculateTotal(order.items).toFixed(2)}
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={order.status || 'draft'}
                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                      className={`px-2 py-1 text-xs font-medium rounded-full border-0 cursor-pointer ${getStatusColor(order.status)}`}
                    >
                      <option value="draft">Draft</option>
                      <option value="submitted">Submitted</option>
                      <option value="approved">Approved</option>
                      <option value="ordered">Ordered</option>
                      <option value="received">Received</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleViewDetails(order)}
                        className="text-blue-600 hover:text-blue-900 font-medium"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleDeleteOrder(order.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Requisition Management</h1>
        <p className="text-gray-600">View and manage all lab requisitions</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="text-sm text-gray-600 mb-1">Total Requisitions</div>
          <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="text-sm text-gray-600 mb-1">Pending</div>
          <div className="text-3xl font-bold text-blue-600">{stats.pending}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="text-sm text-gray-600 mb-1">Completed</div>
          <div className="text-3xl font-bold text-green-600">{stats.past}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="text-sm text-gray-600 mb-1">Total Value</div>
          <div className="text-3xl font-bold text-gray-900">${stats.totalValue.toFixed(2)}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Instructor, course, week, recipes..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Course</label>
            <select
              value={filterCourse}
              onChange={(e) => setFilterCourse(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Courses</option>
              {courses.map(course => (
                <option key={course} value={course}>{course}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => { setFilterCourse('all'); setSearchTerm(''); }}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Pending Requisitions */}
      <OrderTable 
        orderList={pendingOrders} 
        title="Pending Requisitions" 
        emptyMessage="No pending requisitions"
      />

      {/* Past Requisitions */}
      <OrderTable 
        orderList={pastOrders} 
        title="Past Requisitions" 
        emptyMessage="No past requisitions"
      />

      {/* Detail Modal */}
      {showDetailModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">
                  {selectedOrder.course} - {selectedOrder.week}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedOrder.instructor} • {formatDate(selectedOrder.class_date)}
                  {selectedOrder.recipes && ` • ${selectedOrder.recipes}`}
                </p>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-6 py-4">
              {/* Order Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div>
                  <div className="text-sm text-gray-600">Status</div>
                  <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedOrder.status)}`}>
                    {getStatusLabel(selectedOrder.status)}
                  </span>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Students</div>
                  <div className="font-medium">{selectedOrder.students || '-'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Budget</div>
                  <div className="font-medium">${(selectedOrder.budget || 0).toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Total</div>
                  <div className={`font-bold ${calculateTotal(selectedOrder.items) > (selectedOrder.budget || 0) ? 'text-red-600' : 'text-green-600'}`}>
                    ${calculateTotal(selectedOrder.items).toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Items */}
              <div className="mb-6">
                <h4 className="font-semibold text-lg mb-3">Order Items ({selectedOrder.items?.length || 0})</h4>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left">Item</th>
                        <th className="px-4 py-2 text-center">Unit</th>
                        <th className="px-4 py-2 text-center">Qty</th>
                        <th className="px-4 py-2 text-center">Status</th>
                        <th className="px-4 py-2 text-left">Notes</th>
                        <th className="px-4 py-2 text-right">Unit Cost</th>
                        <th className="px-4 py-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {(!selectedOrder.items || selectedOrder.items.length === 0) ? (
                        <tr>
                          <td colSpan="7" className="px-4 py-8 text-center text-gray-500">No items in this requisition</td>
                        </tr>
                      ) : (
                        selectedOrder.items.filter(item => item.quantity > 0).map((item, idx) => (
                          <tr key={idx} className={item.itemStatus === 'unavailable' ? 'bg-red-50' : item.itemStatus === 'substituted' ? 'bg-yellow-50' : ''}>
                            <td className="px-4 py-2">
                              <div className="font-medium">{item.name}</div>
                            </td>
                            <td className="px-4 py-2 text-center text-gray-600">{item.unit}</td>
                            <td className="px-4 py-2 text-center">{item.quantity}</td>
                            <td className="px-4 py-2 text-center">
                              <select
                                value={item.itemStatus || 'pending'}
                                onChange={(e) => updateItemStatus(selectedOrder.id, idx, { itemStatus: e.target.value })}
                                className={`text-xs px-2 py-1 rounded-full border-0 ${getItemStatusColor(item.itemStatus || 'pending')}`}
                              >
                                <option value="pending">Pending</option>
                                <option value="available">Available</option>
                                <option value="unavailable">Unavailable</option>
                                <option value="substituted">Substituted</option>
                              </select>
                            </td>
                            <td className="px-4 py-2">
                              {editingItemIdx === idx ? (
                                <input
                                  type="text"
                                  defaultValue={item.note || item.substituteNotes || ''}
                                  placeholder="Add notes..."
                                  className="w-full text-xs px-2 py-1 border rounded"
                                  onBlur={(e) => {
                                    updateItemStatus(selectedOrder.id, idx, { note: e.target.value });
                                    setEditingItemIdx(null);
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      updateItemStatus(selectedOrder.id, idx, { note: e.target.value });
                                      setEditingItemIdx(null);
                                    }
                                  }}
                                  autoFocus
                                />
                              ) : (
                                <div
                                  onClick={() => setEditingItemIdx(idx)}
                                  className="text-xs text-gray-600 cursor-pointer hover:bg-gray-100 px-2 py-1 rounded min-h-[24px]"
                                >
                                  {item.note || item.substituteNotes || <span className="text-gray-400 italic">Click to add...</span>}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-2 text-right">${(item.unitCost || item.price || 0).toFixed(2)}</td>
                            <td className="px-4 py-2 text-right font-medium">
                              ${((item.unitCost || item.price || 0) * item.quantity).toFixed(2)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td colSpan="6" className="px-4 py-2 text-right font-semibold">Total:</td>
                        <td className="px-4 py-2 text-right font-bold text-lg">
                          ${calculateTotal(selectedOrder.items).toFixed(2)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    const items = selectedOrder.items?.filter(i => i.quantity > 0) || [];
                    let csv = 'Item,Unit,Quantity,Unit Cost,Total\n';
                    items.forEach(item => {
                      csv += `"${item.name}",${item.unit},${item.quantity},${(item.unitCost || 0).toFixed(2)},${((item.unitCost || 0) * item.quantity).toFixed(2)}\n`;
                    });
                    const blob = new Blob([csv], { type: 'text/csv' });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${selectedOrder.course}_${selectedOrder.week}.csv`;
                    a.click();
                  }}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Export CSV
                </button>
                <button
                  onClick={() => window.print()}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Print
                </button>
                <button
                  onClick={() => handleDeleteOrder(selectedOrder.id)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
