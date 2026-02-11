import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

const TabButton = ({ active, onClick, children }) => (
  <button onClick={onClick}
    className={`px-4 py-2 rounded-lg font-medium transition-all ${
      active ? 'bg-emerald-600 text-white' : 'bg-white text-zinc-600 hover:bg-zinc-100 border border-zinc-200'
    }`}>{children}</button>
);

const getColor = (c) => ({
  emerald: { bg: 'bg-emerald-100', border: 'border-emerald-500', text: 'text-emerald-700', dark: 'bg-emerald-600' },
  blue: { bg: 'bg-blue-100', border: 'border-blue-500', text: 'text-blue-700', dark: 'bg-blue-600' },
  orange: { bg: 'bg-orange-100', border: 'border-orange-500', text: 'text-orange-700', dark: 'bg-orange-600' },
  amber: { bg: 'bg-amber-100', border: 'border-amber-500', text: 'text-amber-700', dark: 'bg-amber-600' },
}[c] || { bg: 'bg-zinc-100', border: 'border-zinc-500', text: 'text-zinc-700', dark: 'bg-zinc-600' });

export default function EventsPage() {
  const [tab, setTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [teams, setTeams] = useState([]);
  const [phases, setPhases] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [dayTimeline, setDayTimeline] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [stations, setStations] = useState([]);

  useEffect(() => {
    loadEventData();
  }, []);

  const loadEventData = async () => {
    setLoading(true);
    try {
      // Load event
      const { data: eventData } = await supabase
        .from('events')
        .select('*')
        .eq('id', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890')
        .single();
      setEvent(eventData);

      // Load menu items
      const { data: menuData } = await supabase
        .from('event_menu_items')
        .select('*')
        .eq('event_id', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890')
        .order('sort_order');
      setMenuItems(menuData || []);

      // Load teams
      const { data: teamsData } = await supabase
        .from('event_teams')
        .select('*')
        .eq('event_id', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890')
        .order('sort_order');
      setTeams(teamsData || []);

      // Load phases
      const { data: phasesData } = await supabase
        .from('event_timeline_phases')
        .select('*')
        .eq('event_id', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890')
        .order('sort_order');
      setPhases(phasesData || []);

      // Load tasks
      const { data: tasksData } = await supabase
        .from('event_tasks')
        .select('*')
        .eq('event_id', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890')
        .order('sort_order');
      setTasks(tasksData || []);

      // Load day timeline
      const { data: timelineData } = await supabase
        .from('event_day_timeline')
        .select('*')
        .eq('event_id', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890')
        .order('sort_order');
      setDayTimeline(timelineData || []);

      // Load inventory
      const { data: invData } = await supabase
        .from('event_inventory')
        .select('*')
        .eq('event_id', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890')
        .order('sort_order');
      setInventory(invData || []);

      // Load assembly stations
      const { data: stationsData } = await supabase
        .from('event_assembly_stations')
        .select('*')
        .eq('event_id', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890')
        .order('sort_order');
      setStations(stationsData || []);

    } catch (error) {
      console.error('Error loading event data:', error);
    }
    setLoading(false);
  };

  const toggleTask = async (taskId, currentStatus) => {
    const { error } = await supabase
      .from('event_tasks')
      .update({ 
        is_done: !currentStatus,
        completed_at: !currentStatus ? new Date().toISOString() : null
      })
      .eq('id', taskId);
    
    if (!error) {
      setTasks(tasks.map(t => 
        t.id === taskId ? { ...t, is_done: !currentStatus } : t
      ));
    }
  };

  const toggleInventory = async (itemId, currentStatus) => {
    const { error } = await supabase
      .from('event_inventory')
      .update({ 
        is_received: !currentStatus,
        received_at: !currentStatus ? new Date().toISOString() : null
      })
      .eq('id', itemId);
    
    if (!error) {
      setInventory(inventory.map(i => 
        i.id === itemId ? { ...i, is_received: !currentStatus } : i
      ));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="text-zinc-500">Loading event data...</div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="text-zinc-500">No event found</div>
      </div>
    );
  }

  const tasksDone = tasks.filter(t => t.is_done).length;
  const tasksTotal = tasks.length;
  const syscoItems = inventory.filter(i => i.category === 'sysco_donation');
  const otherItems = inventory.filter(i => i.category !== 'sysco_donation');

  return (
    <div className="min-h-screen bg-zinc-50 font-sans">
      {/* Header */}
      <div className="bg-white border-b border-zinc-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl font-bold text-zinc-800">{event.name}</h1>
            <p className="text-sm text-zinc-500">{event.description}</p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
            {event.status}
          </span>
        </div>
        <div className="flex gap-4 text-xs text-zinc-600 mb-3">
          <span>📅 {new Date(event.event_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
          <span>🕐 {event.start_time?.slice(0,5)} - {event.end_time?.slice(0,5)}</span>
          <span>📍 {event.location}</span>
          <span>👥 {event.guest_count} Guests</span>
        </div>
        <div className="flex gap-2 flex-wrap">
          {['overview', 'timeline', 'teams', 'assembly', 'inventory'].map(t => (
            <TabButton key={t} active={tab === t} onClick={() => setTab(t)}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </TabButton>
          ))}
        </div>
      </div>
      
      <div className="p-4 max-w-5xl mx-auto">
        {/* OVERVIEW */}
        {tab === 'overview' && (
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-3">
              {[
                { l: 'Menu Items', v: menuItems.length },
                { l: 'Guests', v: event.guest_count },
                { l: 'Prep Tasks', v: `${tasksDone}/${tasksTotal}` },
                { l: 'Teams', v: teams.length }
              ].map((s, i) => (
                <div key={i} className="bg-white rounded-lg p-3 border border-zinc-200 text-center">
                  <p className="text-2xl font-bold text-zinc-800">{s.v}</p>
                  <p className="text-xs text-zinc-500">{s.l}</p>
                </div>
              ))}
            </div>
            
            <div className="bg-white rounded-lg border border-zinc-200 p-4">
              <h2 className="font-bold text-zinc-800 mb-3">🍽️ Event Menu</h2>
              <div className="grid grid-cols-2 gap-2">
                {menuItems.map(m => (
                  <div key={m.id} className="flex justify-between p-2 bg-zinc-50 rounded text-sm">
                    <span>{m.name}</span>
                    <span className="text-zinc-500">{m.quantity} {m.unit}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-white rounded-lg border border-zinc-200 p-4">
              <h2 className="font-bold text-zinc-800 mb-3">👨‍🍳 Teams</h2>
              <div className="grid grid-cols-3 gap-3">
                {teams.map((t) => {
                  const c = getColor(t.color);
                  return (
                    <div key={t.id} className={`${c.bg} rounded-lg p-3 border-l-4 ${c.border}`}>
                      <p className={`font-bold ${c.text}`}>{t.name}</p>
                      <p className="text-xs text-zinc-600">{t.lead}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
        
        {/* TIMELINE */}
        {tab === 'timeline' && (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-lg border border-zinc-200 p-4">
              <h2 className="font-bold text-zinc-800 mb-3">Pre-Event Prep</h2>
              {phases.map((phase) => (
                <div key={phase.id} className="mb-4">
                  <p className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded mb-2">
                    {phase.phase_name}
                  </p>
                  {tasks.filter(t => t.phase_id === phase.id).map((t) => (
                    <div key={t.id} onClick={() => toggleTask(t.id, t.is_done)}
                      className={`flex items-center gap-2 p-2 rounded cursor-pointer text-sm ${t.is_done ? 'bg-emerald-50' : 'hover:bg-zinc-50'}`}>
                      <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${t.is_done ? 'bg-emerald-500 border-emerald-500' : 'border-zinc-300'}`}>
                        {t.is_done && <span className="text-white text-xs">✓</span>}
                      </span>
                      <span className={t.is_done ? 'line-through text-zinc-400' : ''}>{t.task}</span>
                      <span className="ml-auto text-xs text-zinc-400">{t.assignee}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <div className="bg-white rounded-lg border border-zinc-200 p-4">
              <h2 className="font-bold text-zinc-800 mb-3">Day-Of Timeline</h2>
              {dayTimeline.map((d) => (
                <div key={d.id} className={`flex gap-3 py-2 border-b border-zinc-100 text-sm ${d.is_highlight ? 'bg-emerald-50 -mx-2 px-2 rounded' : ''}`}>
                  <span className="w-20 font-mono text-zinc-500">{d.time_slot}</span>
                  <span className={d.is_highlight ? 'font-bold text-emerald-700' : ''}>{d.task}</span>
                  <span className="ml-auto text-xs text-zinc-400">{d.team}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* TEAMS */}
        {tab === 'teams' && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              {teams.map((t) => {
                const c = getColor(t.color);
                return (
                  <div key={t.id} className={`bg-white rounded-lg border-2 ${c.border} overflow-hidden`}>
                    <div className={`${c.dark} text-white p-3`}>
                      <p className="font-bold">{t.name}</p>
                      <p className="text-sm opacity-90">{t.lead}</p>
                    </div>
                    <div className="p-3">
                      {t.members?.length > 0 && (
                        <p className="text-xs text-zinc-500 mb-2">{t.members.join(', ')}</p>
                      )}
                      <ul className="text-sm space-y-1">
                        {t.tasks?.map((task, j) => (
                          <li key={j} className="flex items-start gap-2">
                            <span className={c.text}>✓</span> {task}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="bg-amber-50 rounded-lg border-2 border-amber-400 p-4">
              <h3 className="font-bold text-amber-800">🗓️ Friday Prep Team - February 20</h3>
              <p className="text-amber-700"><strong>Tim (Lead), Bridget, Shinatsu, Martin</strong></p>
              <p className="text-sm text-amber-600 mt-1">Maximum prep day — all vegetables cut, sauces portioned, stations staged.</p>
            </div>
          </div>
        )}
        
        {/* ASSEMBLY */}
        {tab === 'assembly' && (
          <div className="space-y-4">
            <div className="bg-amber-50 rounded-lg border border-amber-200 p-3 text-sm">
              <strong>Cooking:</strong> Chef Vince + Tim → <strong>Assembly:</strong> Chef Angela + Chef Wong + Volunteers
            </div>
            <div className="grid grid-cols-3 gap-4">
              {stations.map((s) => {
                const c = getColor(s.color);
                return (
                  <div key={s.id} className="bg-white rounded-lg border border-zinc-200 overflow-hidden">
                    <div className={`${c.dark} text-white p-3`}>
                      <p className="font-bold">{s.name}</p>
                      <p className="text-xs opacity-90">{s.lead} + {s.volunteer_count} Vol</p>
                      <p className="text-xs opacity-75">{s.target_rate}</p>
                    </div>
                    <div className="p-3">
                      <p className="text-xs text-zinc-500 mb-1">Flow</p>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {s.flow?.map((f, j) => (
                          <span key={j} className="text-xs bg-zinc-100 px-2 py-0.5 rounded">
                            {f}{j < s.flow.length - 1 ? ' →' : ''}
                          </span>
                        ))}
                      </div>
                      <p className="text-xs text-zinc-500 mb-1">Toppings</p>
                      <div className="flex flex-wrap gap-1">
                        {s.toppings?.map((t, j) => (
                          <span key={j} className={`text-xs ${c.bg} ${c.text} px-2 py-0.5 rounded`}>{t}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="bg-white rounded-lg border border-zinc-200 p-4">
              <h2 className="font-bold text-zinc-800 mb-3">Service Timeline</h2>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-zinc-100">
                    <th className="text-left p-2">Time</th>
                    <th className="text-left p-2">Flow</th>
                    <th className="text-left p-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b"><td className="p-2">11:00-11:30</td><td>Building</td><td>All stations full speed</td></tr>
                  <tr className="border-b bg-amber-50"><td className="p-2 font-bold">11:30-12:00</td><td className="font-bold text-amber-700">PEAK</td><td>All hands on deck</td></tr>
                  <tr className="border-b bg-amber-50"><td className="p-2 font-bold">12:00-12:30</td><td className="font-bold text-amber-700">Busy</td><td>Monitor supplies</td></tr>
                  <tr className="border-b"><td className="p-2">12:30-1:00</td><td>Slowing</td><td>Assess inventory</td></tr>
                  <tr><td className="p-2">1:00-1:30</td><td>Wind Down</td><td>Cook remaining</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {/* INVENTORY */}
        {tab === 'inventory' && (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-lg border border-zinc-200 p-4">
              <h2 className="font-bold text-zinc-800 mb-3">🚚 Sysco Donation</h2>
              {syscoItems.map((item) => (
                <div key={item.id} onClick={() => toggleInventory(item.id, item.is_received)}
                  className={`flex items-center gap-2 p-2 rounded cursor-pointer text-sm ${item.is_received ? 'bg-emerald-50' : 'hover:bg-zinc-50'}`}>
                  <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${item.is_received ? 'bg-emerald-500 border-emerald-500' : 'border-zinc-300'}`}>
                    {item.is_received && <span className="text-white text-xs">✓</span>}
                  </span>
                  <span className={item.is_received ? 'line-through text-zinc-400' : ''}>{item.item}</span>
                  <span className="ml-auto text-xs text-zinc-500">{item.quantity}</span>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-lg border border-zinc-200 p-4">
              <h2 className="font-bold text-zinc-800 mb-3">🛒 Additional Items</h2>
              {otherItems.map((item) => (
                <div key={item.id} onClick={() => toggleInventory(item.id, item.is_received)}
                  className={`flex items-center gap-2 p-2 rounded cursor-pointer text-sm ${item.is_received ? 'bg-emerald-50' : 'hover:bg-zinc-50'}`}>
                  <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${item.is_received ? 'bg-emerald-500 border-emerald-500' : 'border-zinc-300'}`}>
                    {item.is_received && <span className="text-white text-xs">✓</span>}
                  </span>
                  <span className={item.is_received ? 'line-through text-zinc-400' : ''}>{item.item}</span>
                  <span className="ml-auto text-xs text-zinc-500">{item.quantity}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
