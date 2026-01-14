import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

export default function CateringEventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [ingredients, setIngredients] = useState([]);
  const navigate = useNavigate();
  
  // Form state
  const [form, setForm] = useState({
    event_name: '',
    event_type: 'luncheon',
    event_date: '',
    event_time: '',
    location: '',
    guest_count: 0,
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    department: '',
    menu_description: '',
    items: [],
    food_cost: 0,
    labor_cost: 0,
    overhead_percent: 15,
    price_per_person: 0,
    total_price: 0,
    deposit_amount: 0,
    deposit_paid: false,
    status: 'inquiry',
    notes: ''
  });

  const eventTypes = ['luncheon', 'reception', 'meeting', 'buffet', 'plated', 'boxed', 'other'];
  const statusOptions = ['inquiry', 'quoted', 'confirmed', 'completed', 'cancelled'];

  useEffect(() => {
    loadEvents();
    loadIngredients();
  }, []);

  const loadEvents = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('catering_events')
      .select('*')
      .order('event_date', { ascending: true });
    if (!error) setEvents(data || []);
    setLoading(false);
  };

  const loadIngredients = async () => {
    const { data } = await supabase.from('ingredients').select('name, category, unit').order('name');
    setIngredients(data || []);
  };

  const resetForm = () => {
    setForm({
      event_name: '',
      event_type: 'luncheon',
      event_date: '',
      event_time: '',
      location: '',
      guest_count: 0,
      contact_name: '',
      contact_email: '',
      contact_phone: '',
      department: '',
      menu_description: '',
      items: [],
      food_cost: 0,
      labor_cost: 0,
      overhead_percent: 15,
      price_per_person: 0,
      total_price: 0,
      deposit_amount: 0,
      deposit_paid: false,
      status: 'inquiry',
      notes: ''
    });
    setEditingEvent(null);
  };

  const openNewEvent = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditEvent = (event) => {
    setForm({
      ...event,
      items: event.items || []
    });
    setEditingEvent(event);
    setShowModal(true);
  };

  const calculatePricing = (updatedForm) => {
    const foodCost = parseFloat(updatedForm.food_cost) || 0;
    const laborCost = parseFloat(updatedForm.labor_cost) || 0;
    const overhead = parseFloat(updatedForm.overhead_percent) || 0;
    const guests = parseInt(updatedForm.guest_count) || 1;
    
    const subtotal = foodCost + laborCost;
    const totalWithOverhead = subtotal * (1 + overhead / 100);
    const perPerson = guests > 0 ? totalWithOverhead / guests : 0;
    
    return {
      ...updatedForm,
      total_price: Math.round(totalWithOverhead * 100) / 100,
      price_per_person: Math.round(perPerson * 100) / 100
    };
  };

  const handleFormChange = (field, value) => {
    const updated = { ...form, [field]: value };
    if (['food_cost', 'labor_cost', 'overhead_percent', 'guest_count'].includes(field)) {
      setForm(calculatePricing(updated));
    } else {
      setForm(updated);
    }
  };

  const addItem = () => {
    setForm({
      ...form,
      items: [...form.items, { name: '', quantity: 0, unit: '', category: '' }]
    });
  };

  const updateItem = (index, field, value) => {
    const newItems = [...form.items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Auto-fill unit/category when ingredient selected
    if (field === 'name') {
      const ing = ingredients.find(i => i.name === value);
      if (ing) {
        newItems[index].unit = ing.unit;
        newItems[index].category = ing.category;
      }
    }
    
    setForm({ ...form, items: newItems });
  };

  const removeItem = (index) => {
    setForm({
      ...form,
      items: form.items.filter((_, i) => i !== index)
    });
  };

  const saveEvent = async () => {
    const eventData = {
      ...form,
      guest_count: parseInt(form.guest_count) || 0,
      food_cost: parseFloat(form.food_cost) || 0,
      labor_cost: parseFloat(form.labor_cost) || 0,
      overhead_percent: parseFloat(form.overhead_percent) || 15,
      price_per_person: parseFloat(form.price_per_person) || 0,
      total_price: parseFloat(form.total_price) || 0,
      deposit_amount: parseFloat(form.deposit_amount) || 0,
      updated_at: new Date().toISOString()
    };

    if (editingEvent) {
      await supabase
        .from('catering_events')
        .update(eventData)
        .eq('id', editingEvent.id);
    } else {
      await supabase
        .from('catering_events')
        .insert(eventData);
    }

    setShowModal(false);
    resetForm();
    loadEvents();
  };

  const deleteEvent = async (id) => {
    if (!window.confirm('Delete this event?')) return;
    await supabase.from('catering_events').delete().eq('id', id);
    loadEvents();
  };

  const duplicateEvent = (event) => {
    setForm({
      ...event,
      id: undefined,
      event_name: event.event_name + ' (Copy)',
      event_date: '',
      status: 'inquiry',
      deposit_paid: false,
      items: event.items || []
    });
    setEditingEvent(null);
    setShowModal(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'inquiry': return 'bg-yellow-100 text-yellow-800';
      case 'quoted': return 'bg-blue-100 text-blue-800';
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const today = new Date(); today.setHours(0,0,0,0); const upcomingEvents = events.filter(e => new Date(e.event_date) >= today && e.status !== 'cancelled');
  const pastEvents = events.filter(e => new Date(e.event_date) < today || e.status === 'cancelled');

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-blue-600">Catering Events</h1>
          <p className="text-gray-500">{upcomingEvents.length} upcoming events</p>
        </div>
        <button
          onClick={openNewEvent}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          + New Event
        </button>
      </div>

      {/* Upcoming Events */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-700 mb-3">Upcoming Events</h2>
        {upcomingEvents.length === 0 ? (
          <p className="text-gray-500 italic">No upcoming events</p>
        ) : (
          <div className="grid gap-4">
            {upcomingEvents.map(event => (
              <div key={event.id} className="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-bold text-lg">{event.event_name}</h3>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(event.status)}`}>
                        {event.status}
                      </span>
                      <span className="px-2 py-0.5 rounded text-xs bg-purple-100 text-purple-800">
                        {event.event_type}
                      </span>
                    </div>
                    <div className="text-gray-600 text-sm flex flex-wrap gap-4">
                      <span>📅 {formatDate(event.event_date)} {event.event_time && `@ ${event.event_time}`}</span>
                      <span>📍 {event.location || 'TBD'}</span>
                      <span>👥 {event.guest_count} guests</span>
                      <span>🏢 {event.department || 'N/A'}</span>
                    </div>
                    {event.contact_name && (
                      <div className="text-gray-500 text-sm mt-1">
                        Contact: {event.contact_name} {event.contact_email && `(${event.contact_email})`}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg text-green-600">${event.total_price?.toFixed(2)}</div>
                    <div className="text-xs text-gray-500">${event.price_per_person?.toFixed(2)}/person</div>
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => navigate(`/catering/${event.id}`)} className="px-2 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">View</button>
                      <button onClick={() => openEditEvent(event)} className="px-2 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200">Edit</button>
                      <button onClick={() => duplicateEvent(event)} className="px-2 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200">Copy</button>
                      <button onClick={() => deleteEvent(event.id)} className="px-2 py-1 text-sm text-red-600 hover:bg-red-50 rounded">Delete</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Past Events */}
      {pastEvents.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-500 mb-3">Past/Cancelled Events</h2>
          <div className="grid gap-2">
            {pastEvents.slice(0, 10).map(event => (
              <div key={event.id} className="bg-gray-50 border rounded-lg p-3 flex justify-between items-center opacity-70">
                <div>
                  <span className="font-medium">{event.event_name}</span>
                  <span className="text-gray-500 text-sm ml-3">{formatDate(event.event_date)}</span>
                  <span className={`ml-2 px-2 py-0.5 rounded text-xs ${getStatusColor(event.status)}`}>{event.status}</span>
                </div>
                <div className="text-gray-600">${event.total_price?.toFixed(2)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold">{editingEvent ? 'Edit Event' : 'New Catering Event'}</h2>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Event Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Event Name *</label>
                  <input
                    type="text"
                    value={form.event_name}
                    onChange={(e) => handleFormChange('event_name', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="e.g., President's Spring Luncheon"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
                  <select
                    value={form.event_type}
                    onChange={(e) => handleFormChange('event_type', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    {eventTypes.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => handleFormChange('status', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    {statusOptions.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Event Date *</label>
                  <input
                    type="date"
                    value={form.event_date}
                    onChange={(e) => handleFormChange('event_date', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Event Time</label>
                  <input
                    type="text"
                    value={form.event_time}
                    onChange={(e) => handleFormChange('event_time', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="e.g., 11:30am - 1:00pm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input
                    type="text"
                    value={form.location}
                    onChange={(e) => handleFormChange('location', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="e.g., D Building Courtyard"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Guest Count</label>
                  <input
                    type="number"
                    value={form.guest_count}
                    onChange={(e) => handleFormChange('guest_count', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              {/* Contact Info */}
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Contact Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name</label>
                    <input
                      type="text"
                      value={form.contact_name}
                      onChange={(e) => handleFormChange('contact_name', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                    <input
                      type="text"
                      value={form.department}
                      onChange={(e) => handleFormChange('department', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="e.g., President's Office"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={form.contact_email}
                      onChange={(e) => handleFormChange('contact_email', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={form.contact_phone}
                      onChange={(e) => handleFormChange('contact_phone', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* Menu Description */}
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Menu</h3>
                <textarea
                  value={form.menu_description}
                  onChange={(e) => handleFormChange('menu_description', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={3}
                  placeholder="Describe the menu items..."
                />
              </div>

              {/* Items/Ingredients */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold">Ingredients for Ordering</h3>
                  <button onClick={addItem} className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200">
                    + Add Item
                  </button>
                </div>
                {form.items.length === 0 ? (
                  <p className="text-gray-500 text-sm italic">No items added yet</p>
                ) : (
                  <div className="space-y-2">
                    {form.items.map((item, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <select
                          value={item.name}
                          onChange={(e) => updateItem(idx, 'name', e.target.value)}
                          className="flex-1 px-2 py-1 border rounded text-sm"
                        >
                          <option value="">-- Select ingredient --</option>
                          {ingredients.map(i => <option key={i.name} value={i.name}>{i.name}</option>)}
                        </select>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateItem(idx, 'quantity', parseFloat(e.target.value) || 0)}
                          className="w-20 px-2 py-1 border rounded text-sm text-center"
                          placeholder="Qty"
                        />
                        <span className="text-gray-500 text-sm w-12">{item.unit}</span>
                        <button onClick={() => removeItem(idx)} className="text-red-500 hover:text-red-700">✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Pricing */}
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Pricing</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Food Cost</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-gray-500">$</span>
                      <input
                        type="number"
                        step="0.01"
                        value={form.food_cost}
                        onChange={(e) => handleFormChange('food_cost', e.target.value)}
                        className="w-full pl-7 pr-3 py-2 border rounded-lg"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Labor Cost</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-gray-500">$</span>
                      <input
                        type="number"
                        step="0.01"
                        value={form.labor_cost}
                        onChange={(e) => handleFormChange('labor_cost', e.target.value)}
                        className="w-full pl-7 pr-3 py-2 border rounded-lg"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Overhead %</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        value={form.overhead_percent}
                        onChange={(e) => handleFormChange('overhead_percent', e.target.value)}
                        className="w-full pr-7 pl-3 py-2 border rounded-lg"
                      />
                      <span className="absolute right-3 top-2 text-gray-500">%</span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 p-4 bg-green-50 rounded-lg grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm text-gray-600">Total Price</div>
                    <div className="text-2xl font-bold text-green-600">${form.total_price?.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Per Person</div>
                    <div className="text-xl font-semibold text-green-700">${form.price_per_person?.toFixed(2)}</div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Deposit Amount</label>
                    <div className="flex gap-2 items-center">
                      <span className="text-gray-500">$</span>
                      <input
                        type="number"
                        step="0.01"
                        value={form.deposit_amount}
                        onChange={(e) => handleFormChange('deposit_amount', e.target.value)}
                        className="w-24 px-2 py-1 border rounded"
                      />
                      <label className="flex items-center gap-1 text-sm">
                        <input
                          type="checkbox"
                          checked={form.deposit_paid}
                          onChange={(e) => handleFormChange('deposit_paid', e.target.checked)}
                        />
                        Paid
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="border-t pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => handleFormChange('notes', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={2}
                  placeholder="Special requests, dietary restrictions, etc."
                />
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex justify-end gap-3">
              <button
                onClick={() => { setShowModal(false); resetForm(); }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={saveEvent}
                disabled={!form.event_name || !form.event_date}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {editingEvent ? 'Save Changes' : 'Create Event'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
