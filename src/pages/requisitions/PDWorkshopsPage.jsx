import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function PDWorkshopsPage() {
  const [workshops, setWorkshops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingWorkshop, setEditingWorkshop] = useState(null);
  const [ingredients, setIngredients] = useState([]);
  
  const [form, setForm] = useState({
    workshop_name: '',
    workshop_date: '',
    workshop_time: '',
    location: '',
    attendee_count: 0,
    leader: '',
    leader_email: '',
    target_audience: 'staff',
    items: [],
    food_cost: 0,
    budget_code: '',
    status: 'planned',
    notes: ''
  });

  const audienceOptions = ['staff', 'faculty', 'external', 'mixed'];
  const statusOptions = ['planned', 'confirmed', 'completed', 'cancelled'];

  useEffect(() => {
    loadWorkshops();
    loadIngredients();
  }, []);

  const loadWorkshops = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('pd_workshops')
      .select('*')
      .order('workshop_date', { ascending: true });
    if (!error) setWorkshops(data || []);
    setLoading(false);
  };

  const loadIngredients = async () => {
    const { data } = await supabase.from('ingredients').select('name, category, unit').order('name');
    setIngredients(data || []);
  };

  const resetForm = () => {
    setForm({
      workshop_name: '',
      workshop_date: '',
      workshop_time: '',
      location: '',
      attendee_count: 0,
      leader: '',
      leader_email: '',
      target_audience: 'staff',
      items: [],
      food_cost: 0,
      budget_code: '',
      status: 'planned',
      notes: ''
    });
    setEditingWorkshop(null);
  };

  const openNewWorkshop = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditWorkshop = (workshop) => {
    setForm({
      ...workshop,
      items: workshop.items || []
    });
    setEditingWorkshop(workshop);
    setShowModal(true);
  };

  const handleFormChange = (field, value) => {
    setForm({ ...form, [field]: value });
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

  const saveWorkshop = async () => {
    const workshopData = {
      ...form,
      attendee_count: parseInt(form.attendee_count) || 0,
      food_cost: parseFloat(form.food_cost) || 0,
      updated_at: new Date().toISOString()
    };

    if (editingWorkshop) {
      await supabase
        .from('pd_workshops')
        .update(workshopData)
        .eq('id', editingWorkshop.id);
    } else {
      await supabase
        .from('pd_workshops')
        .insert(workshopData);
    }

    setShowModal(false);
    resetForm();
    loadWorkshops();
  };

  const deleteWorkshop = async (id) => {
    if (!window.confirm('Delete this workshop?')) return;
    await supabase.from('pd_workshops').delete().eq('id', id);
    loadWorkshops();
  };

  const duplicateWorkshop = (workshop) => {
    setForm({
      ...workshop,
      id: undefined,
      workshop_name: workshop.workshop_name + ' (Copy)',
      workshop_date: '',
      status: 'planned',
      items: workshop.items || []
    });
    setEditingWorkshop(null);
    setShowModal(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'planned': return 'bg-yellow-100 text-yellow-800';
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

  const upcomingWorkshops = workshops.filter(w => new Date(w.workshop_date) >= new Date() && w.status !== 'cancelled');
  const pastWorkshops = workshops.filter(w => new Date(w.workshop_date) < new Date() || w.status === 'cancelled');

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-purple-600">Professional Development</h1>
          <p className="text-gray-500">{upcomingWorkshops.length} upcoming workshops</p>
        </div>
        <button
          onClick={openNewWorkshop}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
        >
          + New Workshop
        </button>
      </div>

      {/* Upcoming Workshops */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-700 mb-3">Upcoming Workshops</h2>
        {upcomingWorkshops.length === 0 ? (
          <p className="text-gray-500 italic">No upcoming workshops</p>
        ) : (
          <div className="grid gap-4">
            {upcomingWorkshops.map(workshop => (
              <div key={workshop.id} className="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-bold text-lg">{workshop.workshop_name}</h3>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(workshop.status)}`}>
                        {workshop.status}
                      </span>
                      <span className="px-2 py-0.5 rounded text-xs bg-purple-100 text-purple-800">
                        {workshop.target_audience}
                      </span>
                    </div>
                    <div className="text-gray-600 text-sm flex flex-wrap gap-4">
                      <span>📅 {formatDate(workshop.workshop_date)} {workshop.workshop_time && `@ ${workshop.workshop_time}`}</span>
                      <span>📍 {workshop.location || 'TBD'}</span>
                      <span>👥 {workshop.attendee_count} attendees</span>
                    </div>
                    {workshop.leader && (
                      <div className="text-gray-500 text-sm mt-1">
                        Leader: {workshop.leader} {workshop.leader_email && `(${workshop.leader_email})`}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    {workshop.food_cost > 0 && (
                      <div className="font-medium text-gray-600">${workshop.food_cost?.toFixed(2)} food</div>
                    )}
                    {workshop.budget_code && (
                      <div className="text-xs text-gray-500">Budget: {workshop.budget_code}</div>
                    )}
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => openEditWorkshop(workshop)} className="px-2 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200">Edit</button>
                      <button onClick={() => duplicateWorkshop(workshop)} className="px-2 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200">Copy</button>
                      <button onClick={() => deleteWorkshop(workshop.id)} className="px-2 py-1 text-sm text-red-600 hover:bg-red-50 rounded">Delete</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Past Workshops */}
      {pastWorkshops.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-500 mb-3">Past/Cancelled Workshops</h2>
          <div className="grid gap-2">
            {pastWorkshops.slice(0, 10).map(workshop => (
              <div key={workshop.id} className="bg-gray-50 border rounded-lg p-3 flex justify-between items-center opacity-70">
                <div>
                  <span className="font-medium">{workshop.workshop_name}</span>
                  <span className="text-gray-500 text-sm ml-3">{formatDate(workshop.workshop_date)}</span>
                  <span className={`ml-2 px-2 py-0.5 rounded text-xs ${getStatusColor(workshop.status)}`}>{workshop.status}</span>
                </div>
                <div className="text-gray-600">{workshop.attendee_count} attendees</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold">{editingWorkshop ? 'Edit Workshop' : 'New PD Workshop'}</h2>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Workshop Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Workshop Name *</label>
                  <input
                    type="text"
                    value={form.workshop_name}
                    onChange={(e) => handleFormChange('workshop_name', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="e.g., Knife Skills Refresher"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                  <input
                    type="date"
                    value={form.workshop_date}
                    onChange={(e) => handleFormChange('workshop_date', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                  <input
                    type="text"
                    value={form.workshop_time}
                    onChange={(e) => handleFormChange('workshop_time', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="e.g., 9:00am - 12:00pm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input
                    type="text"
                    value={form.location}
                    onChange={(e) => handleFormChange('location', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="e.g., D118 Kitchen Lab"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Attendee Count</label>
                  <input
                    type="number"
                    value={form.attendee_count}
                    onChange={(e) => handleFormChange('attendee_count', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target Audience</label>
                  <select
                    value={form.target_audience}
                    onChange={(e) => handleFormChange('target_audience', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    {audienceOptions.map(a => <option key={a} value={a}>{a.charAt(0).toUpperCase() + a.slice(1)}</option>)}
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
              </div>

              {/* Leader Info */}
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Workshop Leader</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Leader Name</label>
                    <input
                      type="text"
                      value={form.leader}
                      onChange={(e) => handleFormChange('leader', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Leader Email</label>
                    <input
                      type="email"
                      value={form.leader_email}
                      onChange={(e) => handleFormChange('leader_email', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* Items/Ingredients */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold">Ingredients for Ordering</h3>
                  <button onClick={addItem} className="px-3 py-1 bg-purple-100 text-purple-700 rounded text-sm hover:bg-purple-200">
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

              {/* Budget */}
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Budget</h3>
                <div className="grid grid-cols-2 gap-4">
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Budget Code</label>
                    <input
                      type="text"
                      value={form.budget_code}
                      onChange={(e) => handleFormChange('budget_code', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="e.g., 12345-6789"
                    />
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
                  placeholder="Additional details..."
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
                onClick={saveWorkshop}
                disabled={!form.workshop_name || !form.workshop_date}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                {editingWorkshop ? 'Save Changes' : 'Create Workshop'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
