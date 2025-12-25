import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import JsBarcode from 'jsbarcode';

const ZONES = {
  COOL: { name: 'Walk-In Cooler', color: 'bg-sky-600' },
  FRZ: { name: 'Walk-In Freezer', color: 'bg-indigo-600' },
  DRY: { name: 'Dry Storage', color: 'bg-stone-600' },
  BAKE: { name: 'Baking Storage', color: 'bg-rose-600' }
};

const LABEL_SIZES = {
  '5163': { name: 'Avery 5163', width: '4in', height: '2in', cols: 2, rows: 5, marginTop: '0.5in', marginLeft: '0.156in', gapX: '0.188in', gapY: '0in' },
  '5164': { name: 'Avery 5164', width: '4in', height: '3.333in', cols: 2, rows: 3, marginTop: '0.5in', marginLeft: '0.156in', gapX: '0.188in', gapY: '0in' }
};

export default function InventoryLocationsPage() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const [selectedForPrint, setSelectedForPrint] = useState([]);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [formData, setFormData] = useState({ zone_code: 'COOL', shelf: 'A', position: '1', description: '' });

  useEffect(() => { loadLocations(); }, []);

  async function loadLocations() {
    setLoading(true);
    const { data } = await supabase.from('inventory_locations').select('*').order('zone_code').order('shelf').order('position');
    setLocations(data || []);
    setLoading(false);
  }

  const locationsByZone = locations.reduce((acc, loc) => { if (!acc[loc.zone_code]) acc[loc.zone_code] = []; acc[loc.zone_code].push(loc); return acc; }, {});

  async function handleSave() {
    const code = formData.zone_code + '-' + formData.shelf + formData.position;
    const locationData = { code, zone: ZONES[formData.zone_code].name, zone_code: formData.zone_code, shelf: formData.shelf, position: formData.position, description: formData.description };
    try {
      if (editingLocation) { await supabase.from('inventory_locations').update(locationData).eq('id', editingLocation.id); }
      else { await supabase.from('inventory_locations').insert(locationData); }
      await loadLocations();
      setShowAddModal(false);
      setEditingLocation(null);
      setFormData({ zone_code: 'COOL', shelf: 'A', position: '1', description: '' });
    } catch (error) { alert('Error saving location: ' + error.message); }
  }

  async function handleDelete(location) {
    if (!window.confirm('Delete location ' + location.code + '?')) return;
    await supabase.from('inventory_locations').delete().eq('id', location.id);
    loadLocations();
  }

  function toggleSelectForPrint(location) {
    setSelectedForPrint(prev => prev.find(l => l.id === location.id) ? prev.filter(l => l.id !== location.id) : [...prev, location]);
  }

  function selectAllInZone(zoneCode) {
    const zoneLocs = locations.filter(l => l.zone_code === zoneCode);
    const allSelected = zoneLocs.every(l => selectedForPrint.find(s => s.id === l.id));
    if (allSelected) setSelectedForPrint(prev => prev.filter(l => l.zone_code !== zoneCode));
    else setSelectedForPrint(prev => [...prev.filter(l => l.zone_code !== zoneCode), ...zoneLocs]);
  }

  if (loading) return <div className="p-8 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div></div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link to="/inventory" className="text-gray-500 hover:text-gray-700">← Back</Link>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Location Manager</h1>
            <p className="text-sm text-gray-500">Define storage locations and print barcode labels</p>
          </div>
        </div>
        <div className="flex gap-2">
          {selectedForPrint.length > 0 && <button onClick={() => setShowPrintPreview(true)} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-medium">Print {selectedForPrint.length} Labels</button>}
          <button onClick={() => { setEditingLocation(null); setFormData({ zone_code: 'COOL', shelf: 'A', position: '1', description: '' }); setShowAddModal(true); }} className="bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded font-medium">Add Location</button>
        </div>
      </div>

      {Object.entries(ZONES).map(([zoneCode, zone]) => {
        const zoneLocs = locationsByZone[zoneCode] || [];
        const allSelected = zoneLocs.length > 0 && zoneLocs.every(l => selectedForPrint.find(s => s.id === l.id));
        return (
          <div key={zoneCode} className="mb-6">
            <div className={zone.color + ' text-white px-4 py-2 rounded-t flex items-center justify-between'}>
              <span className="font-medium">{zone.name} ({zoneLocs.length})</span>
              {zoneLocs.length > 0 && <button onClick={() => selectAllInZone(zoneCode)} className="text-sm bg-white bg-opacity-20 hover:bg-opacity-30 px-2 py-1 rounded">{allSelected ? 'Deselect All' : 'Select All'}</button>}
            </div>
            {zoneLocs.length === 0 ? (
              <div className="bg-white rounded-b border border-t-0 p-6 text-center text-gray-400">No locations</div>
            ) : (
              <div className="bg-white rounded-b border border-t-0">
                <table className="w-full">
                  <tbody className="divide-y">
                    {zoneLocs.map(loc => (
                      <tr key={loc.id} className={selectedForPrint.find(s => s.id === loc.id) ? 'bg-green-50' : ''}>
                        <td className="px-4 py-2 w-10"><input type="checkbox" checked={!!selectedForPrint.find(s => s.id === loc.id)} onChange={() => toggleSelectForPrint(loc)} className="rounded" /></td>
                        <td className="px-4 py-2 font-medium">{loc.code}</td>
                        <td className="px-4 py-2 text-gray-500">{loc.description || '-'}</td>
                        <td className="px-4 py-2 text-right">
                          <button onClick={() => { setEditingLocation(loc); setFormData({ zone_code: loc.zone_code, shelf: loc.shelf, position: loc.position, description: loc.description || '' }); setShowAddModal(true); }} className="text-blue-600 hover:text-blue-800 mr-3">Edit</button>
                          <button onClick={() => handleDelete(loc)} className="text-red-600 hover:text-red-800">Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="px-4 py-3 border-b flex justify-between items-center">
              <span className="font-medium">{editingLocation ? 'Edit Location' : 'Add Location'}</span>
              <button onClick={() => setShowAddModal(false)} className="text-gray-500 hover:text-gray-700">×</button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Zone</label>
                <select value={formData.zone_code} onChange={(e) => setFormData({ ...formData, zone_code: e.target.value })} className="w-full p-2 border rounded">{Object.entries(ZONES).map(([code, zone]) => <option key={code} value={code}>{zone.name}</option>)}</select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Shelf</label>
                  <select value={formData.shelf} onChange={(e) => setFormData({ ...formData, shelf: e.target.value })} className="w-full p-2 border rounded">{['A','B','C','D','E','F'].map(s => <option key={s} value={s}>{s}</option>)}</select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                  <select value={formData.position} onChange={(e) => setFormData({ ...formData, position: e.target.value })} className="w-full p-2 border rounded">{['1','2','3','4','5','6'].map(p => <option key={p} value={p}>{p}</option>)}</select>
                </div>
              </div>
              <div className="bg-gray-100 rounded p-3 text-center"><span className="text-sm text-gray-500">Code: </span><span className="text-xl font-bold">{formData.zone_code}-{formData.shelf}{formData.position}</span></div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input type="text" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="e.g., Butter, Cream, Eggs" className="w-full p-2 border rounded" />
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={() => setShowAddModal(false)} className="flex-1 px-4 py-2 border rounded text-gray-700 hover:bg-gray-50">Cancel</button>
                <button onClick={handleSave} className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">{editingLocation ? 'Update' : 'Add'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showPrintPreview && <PrintPreview locations={selectedForPrint} onClose={() => setShowPrintPreview(false)} />}
    </div>
  );
}

function PrintPreview({ locations, onClose }) {
  const [labelSize, setLabelSize] = useState('5163');
  const printRef = useRef();
  
  useEffect(() => { 
    setTimeout(() => {
      locations.forEach(loc => { 
        const svg = document.getElementById('barcode-' + loc.id); 
        if (svg) JsBarcode(svg, loc.code, { format: 'CODE128', width: 2, height: labelSize === '5164' ? 60 : 40, displayValue: false, margin: 0 }); 
      }); 
    }, 100);
  }, [locations, labelSize]);

  const size = LABEL_SIZES[labelSize];

  function handlePrint() {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`<!DOCTYPE html><html><head><title>Labels</title>
<style>
@page { size: letter; margin: 0; }
body { margin: 0; padding: 0; font-family: Arial, sans-serif; }
.sheet { 
  width: 8.5in; 
  padding-top: ${size.marginTop}; 
  padding-left: ${size.marginLeft}; 
  box-sizing: border-box;
}
.grid { 
  display: grid; 
  grid-template-columns: repeat(${size.cols}, ${size.width}); 
  column-gap: ${size.gapX};
  row-gap: ${size.gapY};
}
.label { 
  width: ${size.width}; 
  height: ${size.height}; 
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 8px;
  overflow: hidden;
}
.zone { font-size: 11px; color: #666; margin-bottom: 4px; }
.code { font-size: ${labelSize === '5164' ? '28px' : '22px'}; font-weight: bold; margin: 6px 0; }
.desc { font-size: 10px; color: #666; margin-top: 4px; }
svg { max-width: 90%; }
</style></head><body>` + printRef.current.innerHTML + '</body></html>');
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 250);
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="px-4 py-3 border-b flex justify-between items-center">
          <div className="flex items-center gap-4">
            <span className="font-medium">Print Preview - {locations.length} Labels</span>
            <select value={labelSize} onChange={(e) => setLabelSize(e.target.value)} className="border rounded px-3 py-1 text-sm">
              {Object.entries(LABEL_SIZES).map(([key, val]) => <option key={key} value={key}>{val.name} ({val.cols}×{val.rows})</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={handlePrint} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-medium">Print</button>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-xl px-2">×</button>
          </div>
        </div>
        <div className="p-6 overflow-y-auto max-h-[75vh] bg-gray-100">
          <div ref={printRef}>
            <div className="sheet bg-white" style={{ paddingTop: size.marginTop, paddingLeft: size.marginLeft }}>
              <div className="grid" style={{ display: 'grid', gridTemplateColumns: `repeat(${size.cols}, ${size.width})`, columnGap: size.gapX, rowGap: size.gapY }}>
                {locations.map(loc => (
                  <div key={loc.id} className="label" style={{ width: size.width, height: size.height, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '8px', border: '1px dashed #ccc' }}>
                    <div className="zone" style={{ fontSize: '11px', color: '#666' }}>{ZONES[loc.zone_code]?.name}</div>
                    <div className="code" style={{ fontSize: labelSize === '5164' ? '28px' : '22px', fontWeight: 'bold', margin: '6px 0' }}>{loc.code}</div>
                    <svg id={'barcode-' + loc.id}></svg>
                    {loc.description && <div className="desc" style={{ fontSize: '10px', color: '#666', marginTop: '4px' }}>{loc.description}</div>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="px-4 py-3 border-t bg-gray-50 text-sm text-gray-500">
          {size.name}: {size.cols} columns × {size.rows} rows per sheet ({size.cols * size.rows} labels/sheet)
        </div>
      </div>
    </div>
  );
}
