import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalRequisitions: 0,
    pendingRequisitions: 0,
    totalSpent: 0,
    recentRequisitions: []
  });

  useEffect(() => {
    const orders = JSON.parse(localStorage.getItem('instructorOrders') || '[]');
    const pending = orders.filter(o => o.status === 'Submitted' || o.status === 'Pending');
    const totalSpent = orders.reduce((sum, o) => sum + (o.totalCost || 0), 0);
    
    setStats({
      totalRequisitions: orders.length,
      pendingRequisitions: pending.length,
      totalSpent,
      recentRequisitions: orders.slice(-5).reverse()
    });
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-xs text-gray-500 uppercase tracking-wide">Total Requisitions</div>
          <div className="text-2xl font-semibold text-gray-800 mt-1">{stats.totalRequisitions}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-xs text-gray-500 uppercase tracking-wide">Pending Review</div>
          <div className="text-2xl font-semibold text-yellow-600 mt-1">{stats.pendingRequisitions}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-xs text-gray-500 uppercase tracking-wide">Total Spent</div>
          <div className="text-2xl font-semibold text-gray-800 mt-1">${stats.totalSpent.toFixed(2)}</div>
        </div>
      </div>

      {/* Recent Requisitions */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="flex justify-between items-center px-4 py-3 border-b border-gray-200">
          <h2 className="text-sm font-medium text-gray-700">Recent Requisitions</h2>
          <button
            onClick={() => navigate('/requisitions')}
            className="text-blue-600 hover:text-blue-700 text-xs font-medium"
          >
            View All →
          </button>
        </div>
        
        {stats.recentRequisitions.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            <p className="mb-3">No requisitions yet</p>
            <button
              onClick={() => navigate('/create')}
              className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
            >
              Create Your First Requisition
            </button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                <th className="text-left px-4 py-2 font-medium">Date</th>
                <th className="text-left px-4 py-2 font-medium">Instructor</th>
                <th className="text-left px-4 py-2 font-medium">Class</th>
                <th className="text-right px-4 py-2 font-medium">Total</th>
                <th className="text-center px-4 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentRequisitions.map((req, idx) => (
                <tr key={idx} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-2.5 text-gray-600">
                    {req.submittedAt ? new Date(req.submittedAt).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-2.5 text-gray-800">{req.instructor || '—'}</td>
                  <td className="px-4 py-2.5 text-gray-600">{req.className || req.class || '—'}</td>
                  <td className="px-4 py-2.5 text-right text-gray-800">${(req.totalCost || 0).toFixed(2)}</td>
                  <td className="px-4 py-2.5 text-center">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      req.status === 'Approved' ? 'bg-green-100 text-green-700' :
                      req.status === 'Submitted' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {req.status || 'Draft'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
