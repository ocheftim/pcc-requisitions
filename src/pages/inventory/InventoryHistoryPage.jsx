import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

const ZONES = {
  COOL: { name: 'Walk-In Cooler' },
  FRZ: { name: 'Walk-In Freezer' },
  DRY: { name: 'Dry Storage' },
  BAKE: { name: 'Baking Storage' }
};

export default function InventoryHistoryPage() {
  const [counts, setCounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [zoneFilter, setZoneFilter] = useState('all');
  const [userFilter, setUserFilter] = useState('all');
  const [users, setUsers] = useState([]);

  useEffect(() => { loadHistory(); loadUsers(); }, []);

  async function loadUsers() {
    const { data } = await supabase.from('inventory_counts').select('counted_by').not('counted_by', 'is', null);
    setUsers([...new Set(data?.map(d => d.counted_by) || [])]);
  }

  async function loadHistory() {
    setLoading(true);
    let query = supabase.from('inventory_counts').select('*').order('counted_at', { ascending: false }).limit(100);
    if (dateFrom) query = query.gte('counted_at', new Date(dateFrom).toISOString());
    if (dateTo) { const end = new Date(dateTo); end.setDate(end.getDate() + 1); query = query.lt('counted_at', end.toISOString()); }
    if (zoneFilter !== 'all') query = query.like('location_code', zoneFilter + '-%');
    if (userFilter !== 'all') query = query.eq('counted_by', userFilter);
    const { data } = await query;
    setCounts(data || []);
    setLoading(false);
  }

  function applyFilters() { loadHistory(); }
  function clearFilters() { setDateFrom(''); setDateTo(''); setZoneFilter('all'); setUserFilter('all'); loadHistory(); }

  function exportCsv() {
    const rows = [['Date', 'Item', 'Location', 'Qty', 'Unit', 'Previous', 'Variance', 'Counted By', 'Notes']];
    counts.forEach(c => rows.push([new Date(c.counted_at).toLocaleString(), c.ingredient_name, c.location_code, c.quantity, c.unit, c.previous_quantity, c.variance, c.counted_by, c.notes]));
    const csv = rows.map(r => r.map(cell => '"' + (cell || '') + '"').join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'inventory-history-' + new Date().toISOString().split('T')[0] + '.csv';
    link.click();
  }

  function formatDate(d) { if (!d) return '-'; return new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }); }

  if (loading) return <div className="p-8 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div></div>;

  const totalPositive = counts.filter(c => c.variance > 0).reduce((sum, c) => sum + c.variance, 0);
  const totalNegative = counts.filter(c => c.variance < 0).reduce((sum, c) => sum + c.variance, 0);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link to="/inventory" className="text-gray-500 hover:text-gray-700">← Back</Link>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Inventory History</h1>
            <p className="text-sm text-gray-500">View past counts and export reports</p>
          </div>
        </div>
        <button onClick={exportCsv} disabled={counts.length === 0} className="bg-gray-800 hover:bg-gray-900 disabled:bg-gray-400 text-white px-4 py-2 rounded font-medium">Export CSV</button>
      </div>

      <div className="bg-white rounded border p-4 mb-6">
        <div className="grid grid-cols-6 gap-4">
          <div><label className="block text-sm text-gray-500 mb-1">From</label><input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-full border rounded px-3 py-2" /></div>
          <div><label className="block text-sm text-gray-500 mb-1">To</label><input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-full border rounded px-3 py-2" /></div>
          <div><label className="block text-sm text-gray-500 mb-1">Zone</label><select value={zoneFilter} onChange={(e) => setZoneFilter(e.target.value)} className="w-full border rounded px-3 py-2"><option value="all">All Zones</option>{Object.entries(ZONES).map(([code, zone]) => <option key={code} value={code}>{zone.name}</option>)}</select></div>
          <div><label className="block text-sm text-gray-500 mb-1">Counted By</label><select value={userFilter} onChange={(e) => setUserFilter(e.target.value)} className="w-full border rounded px-3 py-2"><option value="all">All Users</option>{users.map(u => <option key={u} value={u}>{u}</option>)}</select></div>
          <div className="flex items-end gap-2"><button onClick={applyFilters} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">Apply</button><button onClick={clearFilters} className="border px-4 py-2 rounded text-gray-600 hover:bg-gray-50">Clear</button></div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded border p-4"><div className="text-2xl font-semibold text-gray-900">{counts.length}</div><div className="text-sm text-gray-500">Total Counts</div></div>
        <div className="bg-white rounded border p-4"><div className="text-2xl font-semibold text-gray-900">{[...new Set(counts.map(c => c.ingredient_id))].length}</div><div className="text-sm text-gray-500">Unique Items</div></div>
        <div className="bg-white rounded border p-4"><div className="text-2xl font-semibold text-green-600">+{totalPositive.toFixed(1)}</div><div className="text-sm text-gray-500">Positive Variance</div></div>
        <div className="bg-white rounded border p-4"><div className="text-2xl font-semibold text-red-600">{totalNegative.toFixed(1)}</div><div className="text-sm text-gray-500">Negative Variance</div></div>
      </div>

      <div className="bg-white rounded border">
        {counts.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No history found</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-2 text-sm font-medium text-gray-600">Date</th>
                <th className="text-left px-4 py-2 text-sm font-medium text-gray-600">Item</th>
                <th className="text-left px-4 py-2 text-sm font-medium text-gray-600">Location</th>
                <th className="text-left px-4 py-2 text-sm font-medium text-gray-600">Qty</th>
                <th className="text-left px-4 py-2 text-sm font-medium text-gray-600">Variance</th>
                <th className="text-left px-4 py-2 text-sm font-medium text-gray-600">Counted By</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {counts.map(c => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-sm text-gray-500">{formatDate(c.counted_at)}</td>
                  <td className="px-4 py-2 font-medium">{c.ingredient_name}</td>
                  <td className="px-4 py-2 text-sm text-gray-500">{c.location_code}</td>
                  <td className="px-4 py-2 text-sm">{c.quantity} {c.unit}</td>
                  <td className="px-4 py-2 text-sm"><span className={c.variance > 0 ? 'text-green-600' : c.variance < 0 ? 'text-red-600' : 'text-gray-400'}>{c.variance > 0 ? '+' : ''}{c.variance || '-'}</span></td>
                  <td className="px-4 py-2 text-sm text-gray-500">{c.counted_by}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
