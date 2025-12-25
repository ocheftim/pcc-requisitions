import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

const ArchiveIcon = () => (<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>);
const PrintIcon = () => (<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>);
const SaveIcon = () => (<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>);
const DeleteIcon = () => (<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>);
const CheckIcon = () => (<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>);

export default function PullListPage() {
  const [requisitions, setRequisitions] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [pullList, setPullList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState('');
  const [groupBy, setGroupBy] = useState('location');
  const [viewMode, setViewMode] = useState('current');
  const [archivedLists, setArchivedLists] = useState([]);
  const [selectedArchive, setSelectedArchive] = useState(null);
  const [checkedItems, setCheckedItems] = useState(new Set());

  useEffect(() => { loadData(); loadArchivedLists(); }, []);
  useEffect(() => { if (requisitions.length > 0 && ingredients.length > 0) generatePullList(); }, [requisitions, ingredients, selectedDate]);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: reqs } = await supabase.from('requisitions').select('*').eq('status', 'approved').order('class_date', { ascending: true });
      const { data: ings } = await supabase.from('ingredients').select('*');
      const { data: inv } = await supabase.from('inventory').select('*');
      setRequisitions(reqs || []); setIngredients(ings || []); setInventory(inv || []);
    } catch (error) { console.error('Error:', error); }
    setLoading(false);
  };

  const loadArchivedLists = () => { const archived = localStorage.getItem('toqueworks_pulllist_archive'); if (archived) setArchivedLists(JSON.parse(archived)); };

  const generatePullList = () => {
    const ingMap = {}; ingredients.forEach(ing => { ingMap[ing.name?.toLowerCase()] = ing; });
    const invMap = {}; inventory.forEach(inv => { invMap[inv.ingredient_id] = inv; });
    const list = [];
    const filteredReqs = selectedDate ? requisitions.filter(r => r.class_date === selectedDate) : requisitions;
    filteredReqs.forEach(req => {
      if (!req.items) return;
      const items = typeof req.items === 'string' ? JSON.parse(req.items) : req.items;
      items.forEach(item => {
        const ing = ingMap[item.name?.toLowerCase()] || {};
        const inv = invMap[ing.id] || {};
        list.push({ id: req.id + '-' + item.name, name: item.name, quantity: parseFloat(item.quantity) || 0, unit: item.unit || ing.unit || 'ea', location: ing.storageLocation || inv.location || 'Unassigned', class: req.class_name, instructor: req.instructor, classDate: req.class_date, requisitionId: req.id, onHand: inv.quantity || 0, itemNumber: ing.itemNumber || '' });
      });
    });
    list.sort((a, b) => a.location !== b.location ? a.location.localeCompare(b.location) : a.name.localeCompare(b.name));
    setPullList(list); setCheckedItems(new Set());
  };

  const saveToArchive = () => {
    const archiveEntry = { id: Date.now(), date: new Date().toISOString(), filterDate: selectedDate || 'All Dates', pullList, checkedItems: Array.from(checkedItems), summary: { totalItems: pullList.length, locations: [...new Set(pullList.map(i => i.location))].length, classes: [...new Set(pullList.map(i => i.class))].length } };
    const updated = [archiveEntry, ...archivedLists];
    localStorage.setItem('toqueworks_pulllist_archive', JSON.stringify(updated));
    setArchivedLists(updated); alert('Pull list saved to archive!');
  };

  const deleteArchiveEntry = (id) => { if (!window.confirm('Delete this archived pull list?')) return; const updated = archivedLists.filter(a => a.id !== id); localStorage.setItem('toqueworks_pulllist_archive', JSON.stringify(updated)); setArchivedLists(updated); if (selectedArchive?.id === id) setSelectedArchive(null); };

  const toggleChecked = (itemId) => { const newChecked = new Set(checkedItems); if (newChecked.has(itemId)) newChecked.delete(itemId); else newChecked.add(itemId); setCheckedItems(newChecked); };

  const groupedList = () => {
    const displayList = selectedArchive ? selectedArchive.pullList : pullList;
    const displayChecked = selectedArchive ? new Set(selectedArchive.checkedItems) : checkedItems;
    const groups = {};
    if (groupBy === 'location') { displayList.forEach(item => { const key = item.location || 'Unassigned'; if (!groups[key]) groups[key] = []; groups[key].push({ ...item, isChecked: displayChecked.has(item.id) }); }); }
    else if (groupBy === 'class') { displayList.forEach(item => { const key = item.class + ' (' + item.instructor + ')'; if (!groups[key]) groups[key] = []; groups[key].push({ ...item, isChecked: displayChecked.has(item.id) }); }); }
    else { groups['All Items'] = displayList.map(item => ({ ...item, isChecked: displayChecked.has(item.id) })); }
    return groups;
  };

  const printPullList = () => {
    const groups = groupedList();
    const printWindow = window.open('', '_blank');
    const date = new Date().toLocaleDateString();
    printWindow.document.write('<html><head><title>Pull List</title><style>body{font-family:Arial,sans-serif;padding:20px}h1{color:#1e40af}h2{color:#374151;margin-top:30px;background:#f3f4f6;padding:8px;border-radius:4px}table{width:100%;border-collapse:collapse;margin-top:10px}th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background:#f9fafb;font-size:12px}.checkbox{width:20px;height:20px;border:2px solid #999;display:inline-block;margin-right:8px}@media print{button{display:none}}</style></head><body><h1>Pull List</h1><div>Date: ' + date + '</div>' + Object.entries(groups).map(function(entry) { return '<h2>' + entry[0] + ' (' + entry[1].length + ' items)</h2><table><thead><tr><th style="width:30px">✓</th><th>Item</th><th>Qty</th><th>Unit</th><th>Class</th><th>On Hand</th></tr></thead><tbody>' + entry[1].map(function(item) { return '<tr><td><span class="checkbox"></span></td><td>' + item.name + '</td><td>' + item.quantity + '</td><td>' + item.unit + '</td><td>' + item.class + '</td><td>' + item.onHand + '</td></tr>'; }).join('') + '</tbody></table>'; }).join('') + '<button onclick="window.print()" style="margin-top:20px;padding:10px 20px">Print</button></body></html>');
    printWindow.document.close();
  };

  const availableDates = [...new Set(requisitions.map(r => r.class_date))].filter(Boolean).sort();

  if (loading) return <div className="p-6 flex items-center justify-center"><div className="text-gray-500">Loading...</div></div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <div><h1 className="text-3xl font-bold text-blue-800">Pull List</h1><p className="text-gray-600">{viewMode === 'current' ? pullList.length + ' items from ' + [...new Set(pullList.map(i => i.location))].length + ' locations' : archivedLists.length + ' archived lists'}</p></div>
          <div className="flex gap-2">
            <button onClick={() => { setViewMode('current'); setSelectedArchive(null); }} className={'px-4 py-2 rounded font-medium ' + (viewMode === 'current' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200')}>Current</button>
            <button onClick={() => setViewMode('archive')} className={'px-4 py-2 rounded font-medium flex items-center gap-2 ' + (viewMode === 'archive' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200')}><ArchiveIcon />Archive ({archivedLists.length})</button>
          </div>
        </div>

        {viewMode === 'archive' && !selectedArchive && (
          <div>{archivedLists.length === 0 ? <div className="text-center py-12 text-gray-500"><p>No archived pull lists yet</p></div> : (
            <div className="space-y-3">{archivedLists.map(archive => (
              <div key={archive.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border hover:border-blue-300">
                <div className="flex-1 cursor-pointer" onClick={() => setSelectedArchive(archive)}>
                  <div className="font-medium text-gray-800">{new Date(archive.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                  <div className="text-sm text-gray-600 mt-1">{archive.summary.totalItems} items • {archive.summary.locations} locations{archive.filterDate !== 'All Dates' && ' • For: ' + archive.filterDate}</div>
                  <div className="text-xs text-green-600 mt-1">{(archive.checkedItems?.length || 0)} / {archive.summary.totalItems} completed</div>
                </div>
                <div className="flex gap-2"><button onClick={() => setSelectedArchive(archive)} className="px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded text-sm font-medium">View</button><button onClick={() => deleteArchiveEntry(archive.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"><DeleteIcon /></button></div>
              </div>
            ))}</div>
          )}</div>
        )}

        {selectedArchive && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between">
            <div><span className="text-amber-800 font-medium">Viewing Archived:</span><span className="ml-2 text-amber-700">{new Date(selectedArchive.date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span></div>
            <button onClick={() => setSelectedArchive(null)} className="text-amber-700 hover:text-amber-900 font-medium">← Back</button>
          </div>
        )}

        {(viewMode === 'current' || selectedArchive) && (
          <>
            {viewMode === 'current' && (
              <div className="flex flex-wrap justify-between items-center mb-6 p-4 bg-gray-50 rounded-lg gap-4">
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-2"><label className="text-sm font-medium text-gray-600">Date:</label>
                    <select value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="px-3 py-2 border rounded-lg">
                      <option value="">All Dates</option>
                      {availableDates.map(date => <option key={date} value={date}>{new Date(date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</option>)}
                    </select>
                  </div>
                  <div className="flex items-center gap-2"><label className="text-sm font-medium text-gray-600">Group:</label>
                    <select value={groupBy} onChange={(e) => setGroupBy(e.target.value)} className="px-3 py-2 border rounded-lg"><option value="location">Location</option><option value="class">Class</option><option value="item">All Items</option></select>
                  </div>
                </div>
                <div className="flex gap-2"><button onClick={printPullList} className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg hover:bg-gray-50"><PrintIcon />Print</button><button onClick={saveToArchive} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"><SaveIcon />Save to Archive</button></div>
              </div>
            )}

            {pullList.length > 0 && viewMode === 'current' && (
              <div className="mb-6"><div className="flex justify-between text-sm text-gray-600 mb-1"><span>Progress</span><span>{checkedItems.size} / {pullList.length} items pulled</span></div><div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-green-500 h-2 rounded-full transition-all" style={{ width: (checkedItems.size / pullList.length * 100) + '%' }} /></div></div>
            )}

            {Object.keys(groupedList()).length === 0 ? <div className="text-center py-12 text-gray-500"><p>No items to pull</p></div> : (
              <div className="space-y-6">
                {Object.entries(groupedList()).map(([group, items]) => (
                  <div key={group} className="border rounded-lg overflow-hidden">
                    <div className="bg-gray-100 px-4 py-3 flex justify-between items-center"><h2 className="text-lg font-semibold text-gray-800">{group}</h2><span className="text-sm text-gray-600">{items.filter(i => i.isChecked).length} / {items.length} pulled</span></div>
                    <table className="w-full text-sm">
                      <thead><tr className="bg-gray-50 border-b"><th className="w-12 px-4 py-2"></th><th className="text-left px-4 py-2 font-medium text-gray-600">Item</th><th className="text-right px-4 py-2 font-medium text-gray-600">Qty</th><th className="text-left px-4 py-2 font-medium text-gray-600">Unit</th>{groupBy !== 'class' && <th className="text-left px-4 py-2 font-medium text-gray-600">Class</th>}{groupBy !== 'location' && <th className="text-left px-4 py-2 font-medium text-gray-600">Location</th>}<th className="text-right px-4 py-2 font-medium text-gray-600">On Hand</th></tr></thead>
                      <tbody>{items.map(item => (
                        <tr key={item.id} className={'border-b transition-colors ' + (item.isChecked ? 'bg-green-50 text-gray-400' : 'hover:bg-gray-50')}>
                          <td className="px-4 py-2">{viewMode === 'current' ? <button onClick={() => toggleChecked(item.id)} className={'w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ' + (checkedItems.has(item.id) ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 hover:border-green-400')}>{checkedItems.has(item.id) && <CheckIcon />}</button> : <div className={'w-6 h-6 rounded border-2 flex items-center justify-center ' + (item.isChecked ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300')}>{item.isChecked && <CheckIcon />}</div>}</td>
                          <td className={'px-4 py-2 font-medium ' + (item.isChecked ? 'line-through' : '')}>{item.name}</td>
                          <td className="px-4 py-2 text-right font-medium">{item.quantity}</td>
                          <td className="px-4 py-2">{item.unit}</td>
                          {groupBy !== 'class' && <td className="px-4 py-2 text-gray-600">{item.class}</td>}
                          {groupBy !== 'location' && <td className="px-4 py-2 text-gray-600">{item.location}</td>}
                          <td className={'px-4 py-2 text-right ' + (item.onHand < item.quantity ? 'text-red-600 font-medium' : '')}>{item.onHand}</td>
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
