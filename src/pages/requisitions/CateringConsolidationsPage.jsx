import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

/**
 * CateringConsolidationsPage
 * --------------------------
 * Lists rows from `catering_consolidations`, allows creating a new consolidation
 * by selecting two or more catering events, and links into the detail page.
 */
export default function CateringConsolidationsPage() {
  const navigate = useNavigate();
  const [consolidations, setConsolidations] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [selectedEvents, setSelectedEvents] = useState([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    const [{ data: cons }, { data: ev }] = await Promise.all([
      supabase.from('catering_consolidations').select('*').order('created_at', { ascending: false }),
      supabase.from('catering_events').select('id, event_name, event_date, guest_count, status, items').order('event_date', { ascending: true }),
    ]);
    setConsolidations(cons || []);
    setEvents(ev || []);
    setLoading(false);
  }

  function toggleEvent(id) {
    setSelectedEvents(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  /**
   * Build the consolidated items array client-side by merging items from selected events.
   * Strategy: group by (name, unit). Sum quantities. Aggregate categories/meals.
   */
  function buildConsolidatedItems(selectedEventRows) {
    const map = new Map();
    selectedEventRows.forEach(ev => {
      const items = Array.isArray(ev.items) ? ev.items : (typeof ev.items === 'string' ? JSON.parse(ev.items) : []);
      items.forEach(it => {
        const name = (it.name || '').trim();
        const unit = (it.unit || '').trim();
        if (!name) return;
        const key = `${name.toLowerCase()}|${unit.toLowerCase()}`;
        const qty = parseFloat(it.quantity) || 0;
        const unitCost = parseFloat(it.unit_cost) || 0;
        const evShort = ev.event_name?.split(' ').slice(0, 2).join(' ') || ev.event_name;
        const sourceLabel = `${evShort}(${qty})`;
        const cat = it.category || 'Other';
        const meal = it.meal || 'Unassigned';

        if (!map.has(key)) {
          map.set(key, {
            name, unit, qty: 0, unit_cost: unitCost,
            categories: new Set(), meals: new Set(),
            source_split_parts: [],
            vendor: it.vendor || null,
            vendor_code: it.vendor_code || null,
            notes_set: new Set(),
            finalized: false,
            storage_location: null,
          });
        }
        const cur = map.get(key);
        cur.qty += qty;
        if (unitCost > cur.unit_cost) cur.unit_cost = unitCost;
        cur.categories.add(cat);
        cur.meals.add(meal);
        cur.source_split_parts.push(sourceLabel);
        if (it.vendor && !cur.vendor) cur.vendor = it.vendor;
        if (it.vendor_code && !cur.vendor_code) cur.vendor_code = it.vendor_code;
        if (it.notes) cur.notes_set.add(it.notes);
      });
    });

    return Array.from(map.values()).map(v => ({
      name: v.name,
      unit: v.unit,
      qty: Number(v.qty.toFixed(3)),
      unit_cost: v.unit_cost,
      line_cost: Number((v.qty * v.unit_cost).toFixed(2)),
      categories: Array.from(v.categories).sort(),
      primary_category: Array.from(v.categories).sort()[0] || 'Other',
      meals: Array.from(v.meals).sort(),
      source_split: v.source_split_parts.join(' + '),
      vendor: v.vendor,
      vendor_code: v.vendor_code,
      notes: v.notes_set.size ? Array.from(v.notes_set).join(' | ') : null,
      storage_location: null,
      finalized: false,
    }));
  }

  async function createConsolidation() {
    if (!newName.trim() || selectedEvents.length < 2) {
      alert('Provide a name and select at least 2 events.');
      return;
    }
    setBusy(true);
    try {
      const selectedRows = events.filter(e => selectedEvents.includes(e.id));
      const items = buildConsolidatedItems(selectedRows);
      const total = items.reduce((s, i) => s + (i.line_cost || 0), 0);

      const { data, error } = await supabase
        .from('catering_consolidations')
        .insert({
          name: newName.trim(),
          event_ids: selectedEvents,
          items,
          group_by: 'category',
          total_food_cost: Number(total.toFixed(2)),
          status: 'draft',
          notes: `Consolidated ${selectedRows.length} events: ${selectedRows.map(e => e.event_name).join(', ')}.`,
        })
        .select('id')
        .single();
      if (error) throw error;
      setShowNew(false);
      setNewName('');
      setSelectedEvents([]);
      navigate(`/catering/consolidations/${data.id}`);
    } catch (err) {
      console.error(err);
      alert('Failed to create consolidation: ' + err.message);
    }
    setBusy(false);
  }

  async function deleteConsolidation(id, name) {
    if (!window.confirm(`Delete consolidation "${name}"?`)) return;
    const { error } = await supabase.from('catering_consolidations').delete().eq('id', id);
    if (error) alert('Delete failed: ' + error.message);
    else loadAll();
  }

  const eventsById = useMemo(() => {
    const m = {};
    events.forEach(e => { m[e.id] = e; });
    return m;
  }, [events]);

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-blue-600">Catering Consolidations</h1>
          <p className="text-gray-500">{consolidations.length} consolidation{consolidations.length === 1 ? '' : 's'} — merge events into a single shopping & pull list</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate('/catering')}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
          >
            ← Events
          </button>
          <button
            onClick={() => setShowNew(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            + New Consolidation
          </button>
        </div>
      </div>

      {consolidations.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          No consolidations yet. Click <span className="font-semibold">+ New Consolidation</span> to merge two or more events.
        </div>
      ) : (
        <div className="grid gap-4">
          {consolidations.map(c => {
            const lines = Array.isArray(c.items) ? c.items.length : 0;
            const events = (c.event_ids || []).map(id => eventsById[id]).filter(Boolean);
            const statusColor = c.status === 'finalized' ? 'bg-green-100 text-green-800'
              : c.status === 'ordered' ? 'bg-blue-100 text-blue-800'
              : c.status === 'complete' ? 'bg-gray-100 text-gray-700'
              : 'bg-yellow-100 text-yellow-800';
            return (
              <div key={c.id} className="bg-white rounded-lg shadow p-5 border border-gray-100">
                <div className="flex justify-between items-start gap-3 flex-wrap">
                  <div className="flex-1 min-w-[260px]">
                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                      <h3 className="text-lg font-bold text-gray-800">{c.name}</h3>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColor}`}>{c.status}</span>
                    </div>
                    <div className="text-sm text-gray-600 mb-2">
                      {events.length === 0 ? <em className="text-gray-400">No events linked</em> :
                        events.map(ev => (
                          <span key={ev.id} className="inline-block mr-3">
                            <span className="font-medium">{ev.event_name}</span>
                            <span className="text-gray-400 ml-1">({ev.event_date}, {ev.guest_count}g)</span>
                          </span>
                        ))
                      }
                    </div>
                    <div className="flex gap-4 text-sm">
                      <span><span className="text-gray-500">Lines:</span> <strong>{lines}</strong></span>
                      <span><span className="text-gray-500">Food cost:</span> <strong>${(c.total_food_cost || 0).toFixed(2)}</strong></span>
                      <span><span className="text-gray-500">Group by:</span> <strong>{c.group_by}</strong></span>
                    </div>
                    {c.notes && <p className="text-xs text-gray-500 mt-2">{c.notes}</p>}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/catering/consolidations/${c.id}`)}
                      className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                    >
                      Open
                    </button>
                    <button
                      onClick={() => deleteConsolidation(c.id, c.name)}
                      className="px-3 py-1.5 bg-red-50 text-red-700 rounded text-sm hover:bg-red-100"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New Consolidation modal */}
      {showNew && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold">New Consolidation</h2>
              <button onClick={() => setShowNew(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="e.g., May 5–6 Leadership Retreats"
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select 2+ events to merge</label>
                <div className="border rounded max-h-72 overflow-y-auto divide-y">
                  {events.length === 0 && <p className="p-4 text-gray-500 text-sm">No events found.</p>}
                  {events.map(ev => {
                    const isSelected = selectedEvents.includes(ev.id);
                    const itemCount = Array.isArray(ev.items) ? ev.items.length : 0;
                    return (
                      <label key={ev.id} className={`flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''}`}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleEvent(ev.id)}
                          className="w-4 h-4"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-sm">{ev.event_name}</div>
                          <div className="text-xs text-gray-500">{ev.event_date} · {ev.guest_count} guests · {itemCount} items · {ev.status}</div>
                        </div>
                      </label>
                    );
                  })}
                </div>
                <p className="text-xs text-gray-500 mt-1">{selectedEvents.length} selected</p>
              </div>
            </div>
            <div className="px-6 py-3 border-t flex justify-end gap-2 bg-gray-50">
              <button
                onClick={() => setShowNew(false)}
                className="px-4 py-2 bg-white border text-gray-700 rounded hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={createConsolidation}
                disabled={busy || selectedEvents.length < 2 || !newName.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {busy ? 'Building...' : 'Build Consolidation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
