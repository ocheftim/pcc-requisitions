import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

const ZONES = {
  COOL: { name: 'Walk-In Cooler', color: 'bg-sky-600' },
  FRZ: { name: 'Walk-In Freezer', color: 'bg-indigo-600' },
  DRY: { name: 'Dry Storage', color: 'bg-stone-600' },
  BAKE: { name: 'Baking Storage', color: 'bg-rose-600' }
};

const EXP_PRESETS = [
  { label: '3 Days', days: 3 },
  { label: '1 Week', days: 7 },
  { label: '2 Weeks', days: 14 },
  { label: '30 Days', days: 30 }
];

export default function InventoryCountPage() {
  const [searchParams] = useSearchParams();
  const initialZone = searchParams.get('zone');

  const [currentLocation, setCurrentLocation] = useState(null);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [quantity, setQuantity] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [notes, setNotes] = useState('');
  const [countedBy, setCountedBy] = useState('');
  const [instructors, setInstructors] = useState([]);
  const [locations, setLocations] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [recentScans, setRecentScans] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showLocationPicker, setShowLocationPicker] = useState(!initialZone);
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState(null);
  const [saving, setSaving] = useState(false);
  const [scanBuffer, setScanBuffer] = useState('');
  const [lastKeyTime, setLastKeyTime] = useState(0);
  const scanTimeoutRef = useRef(null);

  useEffect(() => {
    loadLocations();
    loadIngredients();
    loadInstructors();
    const stored = localStorage.getItem('inventory_counted_by');
    if (stored) setCountedBy(stored);
  }, []);

  useEffect(() => {
    function handleKeyDown(e) {
      const now = Date.now();
      const timeDiff = now - lastKeyTime;
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'Enter') {
        if (scanBuffer.length > 2) handleBarcodeScan(scanBuffer);
        setScanBuffer('');
        return;
      }
      if (e.key.length === 1) {
        if (timeDiff > 100) setScanBuffer(e.key);
        else setScanBuffer(prev => prev + e.key);
        setLastKeyTime(now);
        clearTimeout(scanTimeoutRef.current);
        scanTimeoutRef.current = setTimeout(() => setScanBuffer(''), 200);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => { window.removeEventListener('keydown', handleKeyDown); clearTimeout(scanTimeoutRef.current); };
  }, [scanBuffer, lastKeyTime]);

  async function loadLocations() {
    const { data } = await supabase.from('inventory_locations').select('*').eq('is_active', true).order('code');
    setLocations(data || []);
  }

  async function loadIngredients() {
    const { data } = await supabase.from('ingredients').select('*').order('name');
    setIngredients(data || []);
  }

  async function loadInstructors() {
    const { data } = await supabase.from('instructors').select('*').eq('is_active', true).order('name');
    setInstructors(data || []);
  }

  const handleBarcodeScan = useCallback((barcode) => {
    if (barcode.match(/^(COOL|DRY|FRZ|BAKE)-[A-Z]\d$/)) {
      const location = locations.find(l => l.code === barcode);
      if (location) { setCurrentLocation(location); showFeedback(`Location: ${location.code}`, 'success'); }
      else showFeedback(`Unknown location: ${barcode}`, 'error');
      return;
    }
    const ingredient = ingredients.find(i => i.sysco_number === barcode || i.upc === barcode || i.id === barcode);
    if (ingredient) { setCurrentProduct(ingredient); showFeedback(ingredient.name, 'success'); }
    else showFeedback(`Product not found: ${barcode}`, 'error');
  }, [locations, ingredients]);

  function showFeedback(message, type) {
    setFeedbackMessage({ message, type });
    setTimeout(() => setFeedbackMessage(null), 2000);
  }

  function setExpirationDays(days) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    setExpirationDate(date.toISOString().split('T')[0]);
  }

  async function saveCount() {
    if (!currentProduct || !quantity || !countedBy) { showFeedback('Please fill in all required fields', 'error'); return; }
    setSaving(true);
    try {
      const { data: current } = await supabase.from('inventory_current').select('quantity').eq('ingredient_id', currentProduct.id).single();
      const previousQty = current?.quantity || 0;
      const variance = parseFloat(quantity) - previousQty;
      const { error } = await supabase.from('inventory_counts').insert({
        ingredient_id: currentProduct.id,
        ingredient_name: currentProduct.name,
        location_code: currentLocation?.code,
        quantity: parseFloat(quantity),
        unit: currentProduct.unit || 'ea',
        expiration_date: expirationDate || null,
        previous_quantity: previousQty,
        variance: variance,
        counted_by: countedBy,
        notes: notes || null
      });
      if (error) throw error;
      localStorage.setItem('inventory_counted_by', countedBy);
      setRecentScans(prev => [{ id: Date.now(), ingredient_name: currentProduct.name, quantity, location_code: currentLocation?.code, variance, counted_at: new Date().toISOString() }, ...prev.slice(0, 9)]);
      showFeedback(`Saved: ${currentProduct.name} = ${quantity}`, 'success');
      setCurrentProduct(null);
      setQuantity('');
      setExpirationDate('');
      setNotes('');
    } catch (error) { console.error('Save error:', error); showFeedback('Error saving count', 'error'); }
    setSaving(false);
  }

  const filteredIngredients = searchQuery ? ingredients.filter(i => i.name.toLowerCase().includes(searchQuery.toLowerCase()) || i.sysco_number?.includes(searchQuery)).slice(0, 10) : [];
  const locationsByZone = locations.reduce((acc, loc) => { if (!acc[loc.zone_code]) acc[loc.zone_code] = []; acc[loc.zone_code].push(loc); return acc; }, {});

  return (
    <div className="min-h-screen bg-gray-50">
      {feedbackMessage && (
        <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-4 py-2 rounded shadow-lg text-white ${feedbackMessage.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {feedbackMessage.message}
        </div>
      )}

      <div className="bg-white border-b px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/inventory" className="text-gray-500 hover:text-gray-700">← Back</Link>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Take Inventory</h1>
              <p className="text-sm text-gray-500">Scan location, scan product, enter count</p>
            </div>
          </div>
          <select value={countedBy} onChange={(e) => setCountedBy(e.target.value)} className="border rounded px-3 py-2">
            <option value="">Select Counter</option>
            {instructors.map(i => <option key={i.id} value={i.name}>{i.name}</option>)}
          </select>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-4">
            <div onClick={() => setShowLocationPicker(true)} className={`rounded border p-4 cursor-pointer ${currentLocation ? `${ZONES[currentLocation.zone_code]?.color} text-white` : 'bg-white border-dashed border-2'}`}>
              {currentLocation ? (
                <div><div className="text-sm opacity-80">Location</div><div className="text-2xl font-bold">{currentLocation.code}</div><div className="text-sm opacity-80">{currentLocation.description}</div></div>
              ) : (
                <div className="text-center py-4 text-gray-400">Click to select location</div>
              )}
            </div>

            <div onClick={() => setShowProductSearch(true)} className={`rounded border p-4 cursor-pointer bg-white ${currentProduct ? 'border-green-300' : 'border-dashed border-2'}`}>
              {currentProduct ? (
                <div><div className="text-sm text-gray-500">Product</div><div className="text-xl font-semibold text-gray-900">{currentProduct.name}</div><div className="text-sm text-gray-500">{currentProduct.sysco_number && `#${currentProduct.sysco_number}`}</div></div>
              ) : (
                <div className="text-center py-4 text-gray-400">Click to select product</div>
              )}
            </div>

            {currentProduct && (
              <>
                <div className="bg-white rounded border p-4">
                  <div className="text-sm text-gray-500 mb-2">Quantity</div>
                  <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="0" className="text-4xl font-bold text-center w-full border-0 focus:ring-0" inputMode="decimal" autoFocus />
                  <div className="text-center text-gray-400">{currentProduct.unit || 'ea'}</div>
                </div>

                <div className="bg-white rounded border p-4">
                  <div className="text-sm text-gray-500 mb-2">Expiration Date (Optional)</div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {EXP_PRESETS.map(p => <button key={p.days} onClick={() => setExpirationDays(p.days)} className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200 text-sm">{p.label}</button>)}
                    <button onClick={() => setExpirationDate('')} className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200 text-sm text-gray-500">Clear</button>
                  </div>
                  <input type="date" value={expirationDate} onChange={(e) => setExpirationDate(e.target.value)} className="w-full p-2 border rounded" />
                </div>

                <div className="bg-white rounded border p-4">
                  <div className="text-sm text-gray-500 mb-2">Notes (Optional)</div>
                  <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any notes..." className="w-full p-2 border rounded" />
                </div>

                {quantity && (
                  <button onClick={saveCount} disabled={saving || !countedBy} className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white text-lg font-medium py-4 rounded">
                    {saving ? 'Saving...' : `Save Count: ${quantity} ${currentProduct.unit || 'ea'}`}
                  </button>
                )}
              </>
            )}
          </div>

          <div className="bg-white rounded border">
            <div className="bg-gray-50 px-4 py-2 border-b text-sm font-medium text-gray-600">Recent Counts</div>
            <div className="divide-y max-h-96 overflow-y-auto">
              {recentScans.length === 0 ? <div className="p-4 text-center text-gray-400 text-sm">No counts yet</div> : recentScans.map(s => (
                <div key={s.id} className="p-3 text-sm">
                  <div className="font-medium">{s.ingredient_name}</div>
                  <div className="text-gray-500 flex justify-between"><span>{s.location_code}</span><span>{s.quantity}</span></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showLocationPicker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-xl max-h-[80vh] overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b flex justify-between items-center">
              <span className="font-medium">Select Location</span>
              <button onClick={() => setShowLocationPicker(false)} className="text-gray-500 hover:text-gray-700">×</button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              {Object.entries(locationsByZone).map(([zoneCode, zoneLocs]) => (
                <div key={zoneCode} className="mb-4">
                  <div className={`${ZONES[zoneCode]?.color} text-white px-3 py-2 rounded-t text-sm font-medium`}>{ZONES[zoneCode]?.name}</div>
                  <div className="grid grid-cols-3 gap-2 p-2 bg-gray-50 rounded-b">
                    {zoneLocs.map(loc => (
                      <button key={loc.id} onClick={() => { setCurrentLocation(loc); setShowLocationPicker(false); }} className="p-2 rounded text-left bg-white hover:bg-gray-100 border text-sm">
                        <div className="font-medium">{loc.code}</div>
                        <div className="text-xs text-gray-500 truncate">{loc.description}</div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showProductSearch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-xl max-h-[80vh] overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b">
              <div className="flex justify-between items-center mb-3">
                <span className="font-medium">Search Product</span>
                <button onClick={() => setShowProductSearch(false)} className="text-gray-500 hover:text-gray-700">×</button>
              </div>
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search by name or Sysco #..." className="w-full p-2 border rounded" autoFocus />
            </div>
            <div className="overflow-y-auto max-h-[50vh] divide-y">
              {filteredIngredients.length === 0 ? <div className="p-4 text-center text-gray-400">{searchQuery ? 'No products found' : 'Type to search...'}</div> : filteredIngredients.map(ing => (
                <button key={ing.id} onClick={() => { setCurrentProduct(ing); setShowProductSearch(false); setSearchQuery(''); }} className="w-full p-3 text-left hover:bg-gray-50">
                  <div className="font-medium">{ing.name}</div>
                  <div className="text-sm text-gray-500">{ing.sysco_number && `#${ing.sysco_number}`}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
