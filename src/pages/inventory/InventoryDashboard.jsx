import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

const ZONES = {
  COOL: { name: 'Walk-In Cooler', color: 'bg-sky-600' },
  FRZ: { name: 'Walk-In Freezer', color: 'bg-indigo-600' },
  DRY: { name: 'Dry Storage', color: 'bg-stone-600' },
  BAKE: { name: 'Baking Storage', color: 'bg-rose-600' }
};

export default function InventoryDashboard() {
  const [summary, setSummary] = useState({
    total_items: 0,
    total_zones: 0,
    expired_count: 0,
    expiring_soon_count: 0,
    low_stock_count: 0
  });
  const [zoneStats, setZoneStats] = useState([]);
  const [recentCounts, setRecentCounts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    setLoading(true);
    try {
      const { data: summaryData } = await supabase.from('inventory_summary').select('*').single();
      if (summaryData) setSummary(summaryData);
      const { data: locations } = await supabase.from('inventory_locations').select('zone_code, code').eq('is_active', true);
      const { data: currentInventory } = await supabase.from('inventory_current').select('location_code, last_counted');
      const zoneData = Object.keys(ZONES).map(zoneCode => {
        const zoneLocations = locations?.filter(l => l.zone_code === zoneCode) || [];
        const zoneInventory = currentInventory?.filter(i => zoneLocations.some(l => l.code === i.location_code)) || [];
        const lastCounted = zoneInventory.map(i => i.last_counted).filter(Boolean).sort().pop();
        return { code: zoneCode, ...ZONES[zoneCode], locationCount: zoneLocations.length, itemCount: zoneInventory.length, lastCounted };
      });
      setZoneStats(zoneData);
      const { data: recent } = await supabase.from('inventory_counts').select('*').order('counted_at', { ascending: false }).limit(5);
      setRecentCounts(recent || []);
    } catch (error) { console.error('Error loading dashboard:', error); }
    setLoading(false);
  }

  function formatDate(dateString) {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return diffHours + 'h ago';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return diffDays + ' days ago';
    return date.toLocaleDateString();
  }

  if (loading) {
    return <div className="p-8 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div></div>;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Inventory</h1>
          <p className="text-sm text-gray-500">Manage stock levels and expiration tracking</p>
        </div>
        <Link to="/inventory/count" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-medium">Take Inventory</Link>
      </div>

      <div className="grid grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded border p-4"><div className="text-2xl font-semibold text-gray-900">{summary.total_items}</div><div className="text-sm text-gray-500">Total Items</div></div>
        <div className="bg-white rounded border p-4"><div className="text-2xl font-semibold text-gray-900">{summary.total_zones}</div><div className="text-sm text-gray-500">Storage Zones</div></div>
        <div className="bg-white rounded border p-4"><div className="text-2xl font-semibold text-red-600">{summary.expired_count}</div><div className="text-sm text-gray-500">Expired</div></div>
        <div className="bg-white rounded border p-4"><div className="text-2xl font-semibold text-orange-600">{summary.expiring_soon_count}</div><div className="text-sm text-gray-500">Expiring Soon</div></div>
        <div className="bg-white rounded border p-4"><div className="text-2xl font-semibold text-yellow-600">{summary.low_stock_count}</div><div className="text-sm text-gray-500">Low Stock</div></div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <Link to="/inventory/count" className="bg-white rounded border p-4 hover:border-green-300 text-center"><div className="font-medium text-gray-700">Take Inventory</div></Link>
        <Link to="/inventory/locations" className="bg-white rounded border p-4 hover:border-green-300 text-center"><div className="font-medium text-gray-700">Print Labels</div></Link>
        <Link to="/inventory/expiring" className="bg-white rounded border p-4 hover:border-green-300 text-center"><div className="font-medium text-gray-700">Use First List</div></Link>
        <Link to="/inventory/history" className="bg-white rounded border p-4 hover:border-green-300 text-center"><div className="font-medium text-gray-700">Reports</div></Link>
      </div>

      <h2 className="text-lg font-semibold text-gray-800 mb-3">Storage Zones</h2>
      <div className="grid grid-cols-4 gap-4 mb-6">
        {zoneStats.map(zone => (
          <Link key={zone.code} to={'/inventory/count?zone=' + zone.code} className="bg-white rounded border overflow-hidden hover:shadow-md">
            <div className={zone.color + ' px-4 py-2 text-white text-sm font-medium'}>{zone.name}</div>
            <div className="p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><div className="text-xl font-semibold text-gray-900">{zone.locationCount}</div><div className="text-gray-500">Locations</div></div>
                <div><div className="text-xl font-semibold text-gray-900">{zone.itemCount}</div><div className="text-gray-500">Items</div></div>
              </div>
              <div className="mt-3 pt-3 border-t text-xs text-gray-500">Last counted: {formatDate(zone.lastCounted)}</div>
            </div>
          </Link>
        ))}
      </div>

      <h2 className="text-lg font-semibold text-gray-800 mb-3">Recent Counts</h2>
      <div className="bg-white rounded border">
        {recentCounts.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No inventory counts yet</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-2 text-sm font-medium text-gray-600">Item</th>
                <th className="text-left px-4 py-2 text-sm font-medium text-gray-600">Location</th>
                <th className="text-left px-4 py-2 text-sm font-medium text-gray-600">Qty</th>
                <th className="text-left px-4 py-2 text-sm font-medium text-gray-600">Counted By</th>
                <th className="text-left px-4 py-2 text-sm font-medium text-gray-600">When</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {recentCounts.map(count => (
                <tr key={count.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-sm">{count.ingredient_name}</td>
                  <td className="px-4 py-2 text-sm">{count.location_code}</td>
                  <td className="px-4 py-2 text-sm">{count.quantity} {count.unit}</td>
                  <td className="px-4 py-2 text-sm">{count.counted_by}</td>
                  <td className="px-4 py-2 text-sm text-gray-500">{formatDate(count.counted_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
