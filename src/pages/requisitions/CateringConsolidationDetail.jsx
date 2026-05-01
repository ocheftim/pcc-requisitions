import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

/**
 * CateringConsolidationDetail
 * ---------------------------
 * Displays a saved consolidation from `catering_consolidations`.
 * Pull/Shopping list groupable by Category, Storage, or Meal.
 * Items can be marked finalized (checkboxes); state persists to DB.
 */

const STORAGE_FALLBACK = {
  // Standard pantry/produce categories
  'Charcuterie': 'Walk-in Cooler', 'Cheese': 'Walk-in Cooler',
  'Protein': 'Freezer', 'Produce': 'Walk-in Cooler',
  'Dairy': 'Walk-in Cooler', 'Dairy & Eggs': 'Walk-in Cooler',
  'Meat & Seafood': 'Meat Cooler', 'Frozen': 'Freezer',
  'Accompaniment': 'Dry Storage', 'Pantry': 'Dry Storage',
  'Bakery': 'Dry Storage', 'Beverages': 'Dry Storage',
  'Garnish': 'Walk-in Cooler', 'Other': 'Dry Storage',
  // Catering-specific
  'Quiche': 'Walk-in Cooler', 'Fruit': 'Walk-in Cooler',
  'Bread': 'Dry Storage', 'GF Frittata': 'Walk-in Cooler',
  'Gyro Bar': 'Walk-in Cooler', 'Greek Salad': 'Walk-in Cooler',
  'Veg & Hummus': 'Walk-in Cooler', 'Dessert': 'Dry Storage',
  'GF Accommodation': 'Dry Storage',
  'Taco Bar': 'Walk-in Cooler', 'Hot Breakfast': 'Walk-in Cooler',
  'Potatoes': 'Dry Storage',
  'Coffee': 'Dry Storage', 'Tea': 'Dry Storage', 'Water': 'Dry Storage',
};

const STORAGE_CONFIG = {
  'Walk-in Cooler': { icon: '🧊', headerBg: 'bg-blue-100', headerText: 'text-blue-800' },
  'Meat Cooler':    { icon: '🥩', headerBg: 'bg-red-100',  headerText: 'text-red-800' },
  'Freezer':        { icon: '❄️', headerBg: 'bg-purple-100', headerText: 'text-purple-800' },
  'Dry Storage':    { icon: '📦', headerBg: 'bg-amber-100', headerText: 'text-amber-800' },
};
const STORAGE_ORDER = ['Walk-in Cooler', 'Meat Cooler', 'Freezer', 'Dry Storage'];
const MEAL_ORDER = ['Breakfast', 'Lunch', 'Dinner', 'Beverages', 'Unassigned'];

export default function CateringConsolidationDetail() {
  const { consolidationId } = useParams();
  const navigate = useNavigate();
  const [cons, setCons] = useState(null);
  const [linkedEvents, setLinkedEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [groupBy, setGroupBy] = useState('category');
  const [view, setView] = useState('pull'); // 'pull' | 'shopping'
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    load();
  }, [consolidationId]);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from('catering_consolidations')
      .select('*')
      .eq('id', consolidationId)
      .single();
    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }
    setCons(data);
    setGroupBy(data.group_by || 'category');
    if (data.event_ids?.length) {
      const { data: ev } = await supabase
        .from('catering_events')
        .select('id, event_name, event_date, guest_count, location, status')
        .in('id', data.event_ids);
      setLinkedEvents(ev || []);
    }
    setLoading(false);
  }

  // Items with computed storage_location (fallback to category map if missing)
  const items = useMemo(() => {
    if (!cons?.items) return [];
    return cons.items.map((it, idx) => ({
      ...it,
      _idx: idx,
      _storage: it.storage_location || STORAGE_FALLBACK[it.primary_category || it.categories?.[0]] || 'Dry Storage',
      _category: it.primary_category || it.categories?.[0] || 'Other',
      _meal: it.meals?.[0] || 'Unassigned',
    }));
  }, [cons]);

  async function persistItems(updatedItems) {
    setSaving(true);
    const total = updatedItems.reduce((s, i) => s + (i.line_cost || 0), 0);
    const { error } = await supabase
      .from('catering_consolidations')
      .update({ items: updatedItems, total_food_cost: Number(total.toFixed(2)) })
      .eq('id', consolidationId);
    setSaving(false);
    if (error) {
      alert('Save failed: ' + error.message);
      return;
    }
    setCons(c => ({ ...c, items: updatedItems, total_food_cost: Number(total.toFixed(2)) }));
  }

  async function persistGroupBy(g) {
    setGroupBy(g);
    const { error } = await supabase
      .from('catering_consolidations')
      .update({ group_by: g })
      .eq('id', consolidationId);
    if (error) console.error('group_by save failed', error);
  }

  async function persistStatus(status) {
    const { error } = await supabase
      .from('catering_consolidations')
      .update({ status })
      .eq('id', consolidationId);
    if (error) alert('Status update failed: ' + error.message);
    else setCons(c => ({ ...c, status }));
  }

  function toggleFinalized(idx) {
    if (!cons?.items) return;
    const updated = cons.items.map((it, i) => i === idx ? { ...it, finalized: !it.finalized } : it);
    persistItems(updated);
  }

  // Group items by selected key
  const grouped = useMemo(() => {
    if (!items.length) return { keys: [], byKey: {} };
    const byKey = {};
    items.forEach(it => {
      let key;
      if (groupBy === 'category') key = it._category;
      else if (groupBy === 'storage') key = it._storage;
      else if (groupBy === 'meal') key = it._meal;
      else key = 'All';
      if (!byKey[key]) byKey[key] = [];
      byKey[key].push(it);
    });
    let keys = Object.keys(byKey);
    if (groupBy === 'storage') keys = STORAGE_ORDER.filter(k => byKey[k]).concat(keys.filter(k => !STORAGE_ORDER.includes(k)));
    else if (groupBy === 'meal') keys = MEAL_ORDER.filter(k => byKey[k]).concat(keys.filter(k => !MEAL_ORDER.includes(k)));
    else keys = keys.sort();
    Object.values(byKey).forEach(arr => arr.sort((a, b) => a.name.localeCompare(b.name)));
    return { keys, byKey };
  }, [items, groupBy]);

  const totals = useMemo(() => {
    const lines = items.length;
    const finalized = items.filter(i => i.finalized).length;
    const cost = items.reduce((s, i) => s + (i.line_cost || 0), 0);
    return { lines, finalized, cost };
  }, [items]);

  function printList() {
    const printContent = document.getElementById('cons-print')?.innerHTML;
    if (!printContent) return;
    const win = window.open('', '_blank');
    win.document.write(`
      <html>
        <head>
          <title>${cons?.name || 'Consolidation'} — ${view === 'pull' ? 'Pull List' : 'Shopping List'}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { font-size: 18px; margin-bottom: 5px; }
            h2 { font-size: 14px; color: #666; margin-bottom: 20px; }
            h3 { font-size: 14px; background: #f0f0f0; padding: 8px; margin: 15px 0 5px 0; border-radius: 4px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
            th, td { border: 1px solid #ddd; padding: 6px 10px; text-align: left; font-size: 12px; }
            th { background: #f5f5f5; font-weight: bold; }
            .qty { text-align: right; font-weight: bold; }
            .checkbox { width: 14px; height: 14px; border: 1.5px solid #444; display: inline-block; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <h1>${cons?.name || 'Consolidation'}</h1>
          <h2>${view === 'pull' ? 'Pull List' : 'Shopping List'} · grouped by ${groupBy} · ${totals.lines} lines · $${totals.cost.toFixed(2)}</h2>
          ${printContent}
        </body>
      </html>
    `);
    win.document.close();
    win.print();
  }

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (!cons) return <div className="p-8 text-center text-red-600">Consolidation not found.</div>;

  const groupHeaderColor = (key) => {
    if (groupBy === 'storage') {
      const cfg = STORAGE_CONFIG[key];
      if (cfg) return `${cfg.headerBg} ${cfg.headerText}`;
    }
    return 'bg-gray-100 text-gray-800';
  };
  const groupIcon = (key) => {
    if (groupBy === 'storage') return STORAGE_CONFIG[key]?.icon || '📦';
    if (groupBy === 'category') return '🏷️';
    if (groupBy === 'meal') return key === 'Breakfast' ? '☕' : key === 'Lunch' ? '🍽️' : key === 'Beverages' ? '🥤' : '🍴';
    return '•';
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-start gap-3 mb-4 flex-wrap">
        <div>
          <button onClick={() => navigate('/catering/consolidations')} className="text-blue-600 hover:underline text-sm mb-1">← All Consolidations</button>
          <h1 className="text-2xl font-bold text-gray-800">{cons.name}</h1>
          <p className="text-gray-500 text-sm">
            {linkedEvents.length} events · {totals.lines} lines · ${totals.cost.toFixed(2)}
            {totals.finalized > 0 && <span className="ml-2 text-green-700">· {totals.finalized}/{totals.lines} finalized</span>}
            {saving && <span className="ml-2 text-blue-600">· saving...</span>}
          </p>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          <select
            value={cons.status}
            onChange={e => persistStatus(e.target.value)}
            className="px-3 py-2 border rounded text-sm"
          >
            <option value="draft">Draft</option>
            <option value="finalized">Finalized</option>
            <option value="ordered">Ordered</option>
            <option value="complete">Complete</option>
          </select>
          <button onClick={printList} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            🖨️ Print
          </button>
        </div>
      </div>

      {/* Linked events */}
      {linkedEvents.length > 0 && (
        <div className="bg-white rounded-lg border p-3 mb-4">
          <div className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Linked Events</div>
          <div className="flex flex-wrap gap-2">
            {linkedEvents.map(ev => (
              <button
                key={ev.id}
                onClick={() => navigate(`/catering/${ev.id}`)}
                className="px-3 py-1.5 bg-gray-50 hover:bg-blue-50 border rounded text-sm flex items-center gap-2"
              >
                <span className="font-medium">{ev.event_name}</span>
                <span className="text-gray-500 text-xs">{ev.event_date} · {ev.guest_count}g</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* View + Group toggles */}
      <div className="bg-white rounded-lg shadow p-4 mb-4 flex justify-between items-center flex-wrap gap-3">
        <div className="flex gap-1 bg-gray-100 p-1 rounded">
          {[{v:'pull',l:'📦 Pull List'},{v:'shopping',l:'🛒 Shopping List'}].map(o => (
            <button
              key={o.v}
              onClick={() => setView(o.v)}
              className={`px-4 py-1.5 rounded text-sm font-medium ${view === o.v ? 'bg-white shadow text-blue-700' : 'text-gray-600 hover:text-gray-800'}`}
            >
              {o.l}
            </button>
          ))}
        </div>
        <div className="inline-flex rounded-lg border border-gray-300 overflow-hidden text-sm">
          <span className="px-3 py-2 bg-gray-50 text-gray-600 font-medium border-r border-gray-300">Group by:</span>
          {[{v:'category',l:'🏷️ Category'},{v:'storage',l:'📦 Storage'},{v:'meal',l:'🍽️ Meal'}].map(o => (
            <button
              key={o.v}
              onClick={() => persistGroupBy(o.v)}
              className={`px-3 py-2 border-r last:border-r-0 border-gray-300 transition ${
                groupBy === o.v ? 'bg-blue-600 text-white font-semibold' : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {o.l}
            </button>
          ))}
        </div>
      </div>

      {/* Items list */}
      <div id="cons-print" className="bg-white rounded-lg shadow p-6">
        {grouped.keys.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No items in this consolidation.</p>
        ) : grouped.keys.map(key => {
          const rows = grouped.byKey[key];
          const groupCost = rows.reduce((s, r) => s + (r.line_cost || 0), 0);
          return (
            <div key={key} className="mb-6">
              <h3 className={`font-bold text-base px-4 py-2 rounded-t flex justify-between items-center ${groupHeaderColor(key)}`}>
                <span>{groupIcon(key)} {key}</span>
                <span className="text-sm opacity-75">{rows.length} items · ${groupCost.toFixed(2)}</span>
              </h3>
              <table className="w-full border">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="w-10 px-3 py-2 border">✓</th>
                    <th className="text-left px-3 py-2 border">Item</th>
                    {view === 'pull'
                      ? <th className="text-left px-3 py-2 border w-32">{groupBy === 'storage' ? 'Category' : 'Storage'}</th>
                      : <th className="text-left px-3 py-2 border w-32">Source split</th>}
                    <th className="text-right px-3 py-2 border w-20">Qty</th>
                    <th className="text-left px-3 py-2 border w-20">Unit</th>
                    {view === 'shopping' && <th className="text-right px-3 py-2 border w-24">Line $</th>}
                  </tr>
                </thead>
                <tbody>
                  {rows.map(item => (
                    <tr key={item._idx} className={`hover:bg-gray-50 ${item.finalized ? 'bg-green-50' : ''}`}>
                      <td className="px-3 py-2 border text-center">
                        <input
                          type="checkbox"
                          checked={!!item.finalized}
                          onChange={() => toggleFinalized(item._idx)}
                          className="w-4 h-4 cursor-pointer"
                        />
                      </td>
                      <td className="px-3 py-2 border font-medium">
                        {item.name}
                        {item.notes && <div className="text-xs text-gray-500 mt-0.5">{item.notes}</div>}
                        {item.vendor && <div className="text-xs text-blue-600 mt-0.5">{item.vendor}{item.vendor_code ? ` · ${item.vendor_code}` : ''}</div>}
                      </td>
                      {view === 'pull'
                        ? <td className="px-3 py-2 border text-xs text-gray-600">{groupBy === 'storage' ? item._category : item._storage}</td>
                        : <td className="px-3 py-2 border text-xs text-gray-600">{item.source_split || '-'}</td>}
                      <td className="px-3 py-2 border text-right font-bold">{item.qty}</td>
                      <td className="px-3 py-2 border">{item.unit}</td>
                      {view === 'shopping' && <td className="px-3 py-2 border text-right">${(item.line_cost || 0).toFixed(2)}</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}

        {/* Totals row */}
        <div className="mt-4 pt-4 border-t flex justify-end gap-6 text-sm">
          <div><span className="text-gray-500">Lines:</span> <strong>{totals.lines}</strong></div>
          <div><span className="text-gray-500">Finalized:</span> <strong>{totals.finalized}/{totals.lines}</strong></div>
          <div><span className="text-gray-500">Total food cost:</span> <strong className="text-blue-700">${totals.cost.toFixed(2)}</strong></div>
        </div>
      </div>

      {cons.notes && (
        <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded p-3 text-sm text-gray-700">
          <span className="font-semibold">Notes:</span> {cons.notes}
        </div>
      )}
    </div>
  );
}
