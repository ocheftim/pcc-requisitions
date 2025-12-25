import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

const ZONES = {
  COOL: { name: 'Walk-In Cooler', color: 'bg-sky-600' },
  FRZ: { name: 'Walk-In Freezer', color: 'bg-indigo-600' },
  DRY: { name: 'Dry Storage', color: 'bg-stone-600' },
  BAKE: { name: 'Baking Storage', color: 'bg-rose-600' }
};

export default function InventoryExpiringPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [zoneFilter, setZoneFilter] = useState('all');
  const printRef = useRef();

  useEffect(() => { loadItems(); }, []);

  async function loadItems() {
    setLoading(true);
    const { data } = await supabase.from('inventory_expiration_status').select('*').gt('quantity', 0);
    setItems(data || []);
    setLoading(false);
  }

  async function markAsUsed(item) {
    if (!window.confirm('Mark ' + item.ingredient_name + ' as used?')) return;
    await supabase.from('inventory_current').update({ quantity: 0, updated_at: new Date().toISOString() }).eq('id', item.id);
    await supabase.from('inventory_counts').insert({ ingredient_id: item.ingredient_id, ingredient_name: item.ingredient_name, location_code: item.location_code, quantity: 0, unit: item.unit, previous_quantity: item.quantity, variance: -item.quantity, counted_by: 'System', notes: 'Marked as used' });
    loadItems();
  }

  const stats = {
    expired: items.filter(i => i.expiration_status === 'expired').length,
    critical: items.filter(i => i.expiration_status === 'critical').length,
    warning: items.filter(i => i.expiration_status === 'warning').length,
    good: items.filter(i => i.expiration_status === 'good').length
  };

  let filtered = items;
  if (filter !== 'all') filtered = filtered.filter(i => i.expiration_status === filter);
  if (zoneFilter !== 'all') filtered = filtered.filter(i => i.zone_code === zoneFilter);
  filtered = [...filtered].sort((a, b) => { if (!a.expiration_date) return 1; if (!b.expiration_date) return -1; return new Date(a.expiration_date) - new Date(b.expiration_date); });

  function formatDate(d) { if (!d) return '-'; return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); }
  function getDays(days) { if (days === null) return '-'; if (days < 0) return Math.abs(days) + 'd ago'; if (days === 0) return 'Today'; if (days === 1) return 'Tomorrow'; return days + ' days'; }

  function handlePrint() {
    const printWindow = window.open('', '_blank');
    printWindow.document.write('<!DOCTYPE html><html><head><title>Use First List</title><style>body{font-family:Arial,sans-serif;max-width:800px;margin:0 auto;padding:20px}h1{text-align:center}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background:#f5f5f5}.expired{color:#dc2626;font-weight:bold}.critical{color:#ea580c}.warning{color:#ca8a04}</style></head><body><h1>Use First List</h1><p style="text-align:center;color:#666">' + new Date().toLocaleString() + '</p>' + printRef.current.innerHTML + '</body></html>');
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  }

  if (loading) return <div className="p-8 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div></div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link to="/inventory" className="text-gray-500 hover:text-gray-700">← Back</Link>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Use First List</h1>
            <p className="text-sm text-gray-500">FIFO tracking - use expiring items first</p>
          </div>
        </div>
        <button onClick={handlePrint} className="bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded font-medium">Print List</button>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <button onClick={() => setFilter(filter === 'expired' ? 'all' : 'expired')} className={'rounded border p-4 text-left ' + (filter === 'expired' ? 'border-red-500 bg-red-50' : 'bg-white')}><div className="text-2xl font-semibold text-red-600">{stats.expired}</div><div className="text-sm text-gray-500">Expired</div></button>
        <button onClick={() => setFilter(filter === 'critical' ? 'all' : 'critical')} className={'rounded border p-4 text-left ' + (filter === 'critical' ? 'border-orange-500 bg-orange-50' : 'bg-white')}><div className="text-2xl font-semibold text-orange-600">{stats.critical}</div><div className="text-sm text-gray-500">1-2 Days</div></button>
        <button onClick={() => setFilter(filter === 'warning' ? 'all' : 'warning')} className={'rounded border p-4 text-left ' + (filter === 'warning' ? 'border-yellow-500 bg-yellow-50' : 'bg-white')}><div className="text-2xl font-semibold text-yellow-600">{stats.warning}</div><div className="text-sm text-gray-500">3-5 Days</div></button>
        <button onClick={() => setFilter(filter === 'good' ? 'all' : 'good')} className={'rounded border p-4 text-left ' + (filter === 'good' ? 'border-green-500 bg-green-50' : 'bg-white')}><div className="text-2xl font-semibold text-green-600">{stats.good}</div><div className="text-sm text-gray-500">6+ Days</div></button>
      </div>

      <div className="bg-white rounded border p-4 mb-6 flex gap-4 items-center">
        <select value={zoneFilter} onChange={(e) => setZoneFilter(e.target.value)} className="border rounded px-3 py-2">
          <option value="all">All Zones</option>
          {Object.entries(ZONES).map(([code, zone]) => <option key={code} value={code}>{zone.name}</option>)}
        </select>
        {(filter !== 'all' || zoneFilter !== 'all') && <button onClick={() => { setFilter('all'); setZoneFilter('all'); }} className="text-blue-600 hover:text-blue-800 text-sm">Clear filters</button>}
        <span className="ml-auto text-sm text-gray-500">{filtered.length} items</span>
      </div>

      <div className="bg-white rounded border">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No items found</div>
        ) : (
          <div ref={printRef}>
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-2 text-sm font-medium text-gray-600">Status</th>
                  <th className="text-left px-4 py-2 text-sm font-medium text-gray-600">Item</th>
                  <th className="text-left px-4 py-2 text-sm font-medium text-gray-600">Location</th>
                  <th className="text-left px-4 py-2 text-sm font-medium text-gray-600">Qty</th>
                  <th className="text-left px-4 py-2 text-sm font-medium text-gray-600">Expires</th>
                  <th className="text-left px-4 py-2 text-sm font-medium text-gray-600"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map(item => (
                  <tr key={item.id} className={item.expiration_status === 'expired' ? 'bg-red-50' : item.expiration_status === 'critical' ? 'bg-orange-50' : ''}>
                    <td className="px-4 py-2"><span className={'text-sm font-medium ' + (item.expiration_status === 'expired' ? 'text-red-600' : item.expiration_status === 'critical' ? 'text-orange-600' : item.expiration_status === 'warning' ? 'text-yellow-600' : 'text-green-600')}>{getDays(item.days_until_expiration)}</span></td>
                    <td className="px-4 py-2 font-medium">{item.ingredient_name}</td>
                    <td className="px-4 py-2 text-sm text-gray-500">{item.location_code}</td>
                    <td className="px-4 py-2 text-sm">{item.quantity} {item.unit}</td>
                    <td className="px-4 py-2 text-sm text-gray-500">{formatDate(item.expiration_date)}</td>
                    <td className="px-4 py-2 text-right"><button onClick={() => markAsUsed(item)} className="text-green-600 hover:text-green-800 text-sm">Mark Used</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
