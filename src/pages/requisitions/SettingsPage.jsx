import React, { useState, useEffect } from 'react';

const defaultInstructors = [
  { name: "Cabrera", email: "acabrera@pima.edu" },
  { name: "Frazier", email: "vcfrazier@pima.edu" },
  { name: "Kouchit", email: "rkouchit@pima.edu" },
  { name: "McRoy", email: "kdmcroy@pima.edu" },
  { name: "Mikesell", email: "emikesell@pima.edu" },
  { name: "Moreno", email: "amoreno26@pima.edu" },
  { name: "O'Donnell", email: "todonnell7@pima.edu" },
  { name: "Quintana", email: "jquintana2@pima.edu" },
  { name: "Toscano", email: "ptoscano@pima.edu" },
  { name: "Wong", email: "dwong2@pima.edu" }
];

const defaultClasses = [
  { code: 'CUL130-22271', name: 'Savory Cuisine', program: 'Culinary Arts', term: '1', day: 'Wednesday', time: '8:01 AM - 5:25 PM', feePerStudent: 280.00, instructor: 'Cabrera', room: 'D119/D103', crn: '22271' },
  { code: 'CUL130-22272', name: 'Savory Cuisine', program: 'Culinary Arts', term: '2', day: 'Wednesday', time: '8:05 AM - 5:25 PM', feePerStudent: 280.00, instructor: '', room: 'D119/D103', crn: '22272' },
  { code: 'CUL130-22273', name: 'Savory Cuisine', program: 'Culinary Arts', term: '1', day: 'Tuesday', time: '8:05 AM - 1:45 PM', feePerStudent: 331.29, instructor: 'Cabrera', room: 'D119/D103', crn: '22273' },
  { code: 'CUL130-22274', name: 'Savory Cuisine', program: 'Culinary Arts', term: '2', day: 'Tuesday', time: '8:05 AM - 1:45 PM', feePerStudent: 331.29, instructor: 'Wong', room: 'D119/D103', crn: '22274' },
  { code: 'CUL130-22275', name: 'Savory Cuisine', program: 'Culinary Arts', term: '1', day: 'Saturday', time: '8:05 AM - 1:45 PM', feePerStudent: 331.29, instructor: 'Kouchit', room: 'D119/D103', crn: '22275' },
  { code: 'CUL130-22276', name: 'Savory Cuisine', program: 'Culinary Arts', term: '2', day: 'Saturday', time: '8:05 AM - 1:45 PM', feePerStudent: 331.29, instructor: 'Kouchit', room: 'D119/D103', crn: '22276' },
  { code: 'CUL150', name: 'Garde Manger', program: 'Culinary Arts', term: '2', day: 'Thursday', time: '8:05 AM - 5:25 PM', feePerStudent: 280.00, instructor: '', room: 'D119/D103', crn: '22277' },
  { code: 'CUL160-22278', name: 'Bakery and Pastry Production I', program: 'Baking & Pastry', term: '1', day: 'Friday', time: '8:05 AM - 5:25 PM', feePerStudent: 331.29, instructor: 'Mikesell', room: 'D119/D103', crn: '22278' },
  { code: 'CUL160-22279', name: 'Bakery and Pastry Production I', program: 'Baking & Pastry', term: '2', day: 'Friday', time: '8:05 AM - 5:25 PM', feePerStudent: 331.29, instructor: '', room: 'D119/D103', crn: '22279' },
  { code: 'CUL162', name: 'Art of Chocolate', program: 'Baking & Pastry', term: '1', day: 'Friday', time: '8:05 AM - 5:25 PM', feePerStudent: 295.39, instructor: '', room: 'D118/D104B', crn: '22280' },
  { code: 'CUL168', name: 'Specialty and Hearth Breads', program: 'Baking & Pastry', term: '2', day: 'Friday', time: '8:05 AM - 5:25 PM', feePerStudent: 280.00, instructor: 'Mikesell', room: 'D118/D104B', crn: '22288' },
  { code: 'CUL170', name: 'Dining Room Operations', program: 'Culinary Arts', term: '1', day: 'Wednesday', time: '8:15 AM - 1:45 PM', feePerStudent: 0.00, instructor: 'Wong', room: 'D118', crn: '22694' },
  { code: 'CUL174', name: 'From Garden to Table', program: 'Culinary Arts', term: 'full', day: 'Saturday', time: '8:00 AM - 1:00 PM', feePerStudent: 280.00, instructor: '', room: 'B151', crn: '22693' },
  { code: 'CUL180', name: 'Food in History', program: 'Culinary Arts', term: '2', day: 'Wednesday', time: '8:15 AM - 1:45 PM', feePerStudent: 0.00, instructor: '', room: 'D118', crn: '22695' },
  { code: 'CUL185', name: 'Catering Operations', program: 'Culinary Arts', term: '2', day: 'Monday', time: '8:15 AM - 5:25 PM', feePerStudent: 20.52, instructor: '', room: 'D119', crn: '21342' },
  { code: 'CUL244', name: 'Confections, Show Pcs, Desserts', program: 'Baking & Pastry', term: '1', day: 'Tuesday', time: '8:05 AM - 5:25 PM', feePerStudent: 312.06, instructor: '', room: 'D118/D104B', crn: '22301' },
  { code: 'CUL260', name: 'Pastry Arts II', program: 'Baking & Pastry', term: '1', day: 'Thursday', time: '8:05 AM - 5:25 PM', feePerStudent: 280.00, instructor: '', room: 'D118/D104B', crn: '22302' },
  { code: 'CUL266', name: 'Ice Cream, Bavarian, Mousse', program: 'Baking & Pastry', term: '2', day: 'Tuesday', time: '8:05 AM - 5:25 PM', feePerStudent: 309.50, instructor: '', room: 'D118/D104B', crn: '22303' },
  { code: 'CUL276', name: 'Pastry Production', program: 'Baking & Pastry', term: '2', day: 'Thursday', time: '8:05 AM - 5:25 PM', feePerStudent: 280.00, instructor: '', room: 'D118/D104B', crn: '22304' },
];

const defaultSemester = {
  name: 'Spring 2026',
  terms: [
    { id: '1', name: 'Term 1', startDate: '2026-01-15', endDate: '2026-03-15', weeks: 8 },
    { id: '2', name: 'Term 2', startDate: '2026-03-23', endDate: '2026-05-17', weeks: 8 },
    { id: 'full', name: 'Full Semester', startDate: '2026-01-17', endDate: '2026-05-18', weeks: 16 }
  ]
};

const defaultNoClassDates = [
  { date: '2026-01-19', name: 'MLK Day', type: 'holiday' },
  { date: '2026-02-16', name: 'Presidents Day', type: 'holiday' },
  { date: '2026-03-16', name: 'Spring Break', type: 'break' },
  { date: '2026-03-17', name: 'Spring Break', type: 'break' },
  { date: '2026-03-18', name: 'Spring Break', type: 'break' },
  { date: '2026-03-19', name: 'Spring Break', type: 'break' },
  { date: '2026-03-20', name: 'Spring Break', type: 'break' },
];

const defaultVendors = ['Sysco', 'Shamrock', 'US Foods', 'Restaurant Depot', 'Costco'];

// SVG Icons
const EditIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const DeleteIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('instructors');
  const [instructors, setInstructors] = useState([]);
  const [classes, setClasses] = useState([]);
  const [semester, setSemester] = useState(defaultSemester);
  const [noClassDates, setNoClassDates] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [newInstructor, setNewInstructor] = useState({ name: '', email: '' });
  const [newClass, setNewClass] = useState({ code: '', name: '', program: 'Culinary Arts', term: '1', day: 'Monday', time: '8:05 AM - 5:25 PM', feePerStudent: 280, instructor: '', room: '', crn: '' });
  const [newVendor, setNewVendor] = useState('');
  const [newNoClass, setNewNoClass] = useState({ date: '', name: '', type: 'holiday' });
  const [editingVendor, setEditingVendor] = useState(null);
  const [editingInstructor, setEditingInstructor] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [classFilter, setClassFilter] = useState('all');

  useEffect(() => { loadSettings(); }, []);

  const loadSettings = () => {
    const si = localStorage.getItem('toqueworks_instructors');
    const sc = localStorage.getItem('toqueworks_classes');
    const ss = localStorage.getItem('toqueworks_semester');
    const sv = localStorage.getItem('vendors');
    const sn = localStorage.getItem('toqueworks_noclassdates');
    
    let loadedInstructors = si ? JSON.parse(si) : defaultInstructors;
    if (loadedInstructors.length > 0 && typeof loadedInstructors[0] === 'string') {
      loadedInstructors = loadedInstructors.map(name => ({ name, email: '' }));
    }
    
    let loadedClasses = sc ? JSON.parse(sc) : defaultClasses;
    if (loadedClasses.length > 0 && !loadedClasses[0].term) {
      loadedClasses = defaultClasses;
    }
    
    let loadedSemester = ss ? JSON.parse(ss) : defaultSemester;
    if (!loadedSemester.terms) {
      loadedSemester = defaultSemester;
    }
    
    setInstructors(loadedInstructors);
    setClasses(loadedClasses);
    setSemester(loadedSemester);
    setVendors(sv ? JSON.parse(sv) : defaultVendors);
    setNoClassDates(sn ? JSON.parse(sn) : defaultNoClassDates);
  };

  const saveInstructors = (d) => { localStorage.setItem('toqueworks_instructors', JSON.stringify(d)); setInstructors(d); };
  const saveClasses = (d) => { localStorage.setItem('toqueworks_classes', JSON.stringify(d)); setClasses(d); };
  const saveSemester = (d) => { localStorage.setItem('toqueworks_semester', JSON.stringify(d)); setSemester(d); };
  const saveVendors = (d) => { localStorage.setItem('vendors', JSON.stringify(d)); setVendors(d); };
  const saveNoClassDates = (d) => { localStorage.setItem('toqueworks_noclassdates', JSON.stringify(d)); setNoClassDates(d); };

  const addInstructor = () => {
    if (!newInstructor.name.trim()) return;
    if (instructors.find(i => i.name === newInstructor.name.trim())) return;
    saveInstructors([...instructors, { name: newInstructor.name.trim(), email: newInstructor.email.trim() }].sort((a, b) => a.name.localeCompare(b.name)));
    setNewInstructor({ name: '', email: '' });
  };

  const addClass = () => {
    if (!newClass.code || !newClass.name || classes.find(c => c.code === newClass.code)) return;
    saveClasses([...classes, { ...newClass }]);
    setNewClass({ code: '', name: '', program: 'Culinary Arts', term: '1', day: 'Monday', time: '8:05 AM - 5:25 PM', feePerStudent: 280, instructor: '', room: '', crn: '' });
  };
  const updateClass = (code, field, value) => saveClasses(classes.map(c => c.code === code ? { ...c, [field]: value } : c));
  const deleteClass = (code) => { if (window.confirm(`Delete "${code}"?`)) saveClasses(classes.filter(c => c.code !== code)); };

  const addVendor = () => {
    if (!newVendor.trim() || vendors.includes(newVendor.trim())) return;
    saveVendors([...vendors, newVendor.trim()]);
    setNewVendor('');
  };
  const updateVendor = (old) => {
    if (!editValue.trim() || editValue === old) { setEditingVendor(null); return; }
    saveVendors(vendors.map(v => v === old ? editValue.trim() : v));
    setEditingVendor(null);
  };
  const deleteVendor = (name) => { if (window.confirm(`Delete "${name}"?`)) saveVendors(vendors.filter(v => v !== name)); };

  const addNoClassDate = () => {
    if (!newNoClass.date || !newNoClass.name) return;
    if (noClassDates.find(d => d.date === newNoClass.date)) return;
    saveNoClassDates([...noClassDates, { ...newNoClass }].sort((a, b) => a.date.localeCompare(b.date)));
    setNewNoClass({ date: '', name: '', type: 'holiday' });
  };
  const deleteNoClassDate = (date) => {
    if (window.confirm(`Remove this no-class date?`)) saveNoClassDates(noClassDates.filter(d => d.date !== date));
  };

  const updateTerm = (termId, field, value) => {
    const updatedTerms = semester.terms.map(t => t.id === termId ? { ...t, [field]: value } : t);
    saveSemester({ ...semester, terms: updatedTerms });
  };

  const resetAll = () => {
    if (!window.confirm('Reset ALL settings to Spring 2026 defaults?')) return;
    ['toqueworks_instructors','toqueworks_classes','toqueworks_semester','vendors','toqueworks_noclassdates'].forEach(k => localStorage.removeItem(k));
    loadSettings();
  };

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const programs = ['Culinary Arts', 'Baking & Pastry', 'Foodservice', 'Childcare'];
  const times = ['8:00 AM - 1:00 PM', '8:01 AM - 5:25 PM', '8:05 AM - 1:45 PM', '8:05 AM - 5:25 PM', '8:15 AM - 1:45 PM', '8:15 AM - 5:25 PM'];

  const filteredClasses = classFilter === 'all' ? classes : classes.filter(c => c.term === classFilter);

  const getClassMeetingDates = (classItem) => {
    const term = semester.terms?.find(t => t.id === classItem.term);
    if (!term) return [];
    const dayMap = { 'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6 };
    const targetDay = dayMap[classItem.day];
    const dates = [];
    const start = new Date(term.startDate + 'T12:00:00');
    const end = new Date(term.endDate + 'T12:00:00');
    let current = new Date(start);
    while (current <= end) {
      if (current.getDay() === targetDay) {
        const dateStr = current.toISOString().split('T')[0];
        const isNoClass = noClassDates.some(nc => nc.date === dateStr);
        dates.push({ date: dateStr, isNoClass });
      }
      current.setDate(current.getDate() + 1);
    }
    return dates;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-blue-800">Settings</h1>
            <p className="text-gray-600">{semester.name}</p>
          </div>
          <button onClick={resetAll} className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">Reset to Defaults</button>
        </div>

        <div className="flex gap-1 mb-6 border-b overflow-x-auto">
          {['instructors', 'classes', 'semester', 'calendar', 'vendors'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 font-medium capitalize whitespace-nowrap ${activeTab === tab ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-gray-500 hover:text-gray-700'}`}>
              {tab === 'calendar' ? 'No-Class Dates' : tab}
            </button>
          ))}
        </div>

        {activeTab === 'instructors' && (
          <div>
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <div className="flex gap-2">
                <input type="text" value={newInstructor.name} onChange={(e) => setNewInstructor({ ...newInstructor, name: e.target.value })}
                  placeholder="Name (e.g., Smith)" className="flex-1 px-3 py-2 border rounded" />
                <input type="email" value={newInstructor.email} onChange={(e) => setNewInstructor({ ...newInstructor, email: e.target.value })}
                  placeholder="Email (e.g., jsmith@pima.edu)" className="flex-1 px-3 py-2 border rounded" />
                <button onClick={addInstructor} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Add</button>
              </div>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left px-3 py-2 font-medium text-gray-700">Name</th>
                  <th className="text-left px-3 py-2 font-medium text-gray-700">Email</th>
                  <th className="text-right px-3 py-2 font-medium text-gray-700 w-24">Actions</th>
                </tr>
              </thead>
              <tbody>
                {instructors.map((inst, idx) => (
                  <tr key={idx} className="border-b hover:bg-gray-50">
                    <td className="px-3 py-2">
                      {editingInstructor === idx ? (
                        <input type="text" value={inst.name || ''} 
                          onChange={(e) => { const updated = instructors.map((i, j) => j === idx ? { ...i, name: e.target.value } : i); saveInstructors(updated); }}
                          className="w-full px-2 py-1.5 border border-blue-500 rounded text-sm font-medium" autoFocus />
                      ) : (
                        <span className="font-medium text-gray-800">{inst.name || '-'}</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {editingInstructor === idx ? (
                        <input type="email" value={inst.email || ''} 
                          onChange={(e) => { const updated = instructors.map((i, j) => j === idx ? { ...i, email: e.target.value } : i); saveInstructors(updated); }}
                          className="w-full px-2 py-1.5 border border-blue-500 rounded text-sm" />
                      ) : (
                        <span className="text-gray-600">{inst.email || '-'}</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setEditingInstructor(editingInstructor === idx ? null : idx)}
                          className={`p-1.5 rounded transition-colors ${editingInstructor === idx ? 'text-blue-600 bg-blue-50' : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'}`}
                          title="Edit instructor"><EditIcon /></button>
                        <button onClick={() => { if (window.confirm(`Delete "${inst.name}"?`)) saveInstructors(instructors.filter((_, j) => j !== idx)); }}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete instructor"><DeleteIcon /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'classes' && (
          <div>
            <div className="mb-4 flex gap-4 items-center">
              <span className="text-sm font-medium text-gray-600">Filter:</span>
              <div className="flex gap-2">
                <button onClick={() => setClassFilter('all')} className={`px-3 py-1 rounded text-sm ${classFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>All ({classes.length})</button>
                {semester.terms?.map(term => (
                  <button key={term.id} onClick={() => setClassFilter(term.id)} className={`px-3 py-1 rounded text-sm ${classFilter === term.id ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>
                    {term.name} ({classes.filter(c => c.term === term.id).length})
                  </button>
                ))}
              </div>
            </div>

            {['Culinary Arts', 'Baking & Pastry'].map(program => {
              const programClasses = filteredClasses.filter(c => c.program === program);
              if (programClasses.length === 0) return null;
              return (
                <div key={program} className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-700 mb-3 pb-2 border-b">{program}</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-gray-50">
                          <th className="text-left px-2 py-2 font-medium text-gray-600">CRN</th>
                          <th className="text-left px-2 py-2 font-medium text-gray-600">Code</th>
                          <th className="text-left px-2 py-2 font-medium text-gray-600">Name</th>
                          <th className="text-left px-2 py-2 font-medium text-gray-600">Term</th>
                          <th className="text-left px-2 py-2 font-medium text-gray-600">Day</th>
                          <th className="text-left px-2 py-2 font-medium text-gray-600">Time</th>
                          <th className="text-left px-2 py-2 font-medium text-gray-600">Fee</th>
                          <th className="text-left px-2 py-2 font-medium text-gray-600">Instructor</th>
                          <th className="text-left px-2 py-2 font-medium text-gray-600">Room</th>
                          <th className="text-right px-2 py-2 font-medium text-gray-600 w-16">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {programClasses.sort((a, b) => a.term.localeCompare(b.term) || a.day.localeCompare(b.day)).map(c => (
                          <tr key={c.code} className="border-b hover:bg-gray-50">
                            <td className="px-2 py-2 font-mono text-gray-500 text-xs">{c.crn || '-'}</td>
                            <td className="px-2 py-2 font-mono font-medium text-blue-600">{c.code.split('-')[0]}</td>
                            <td className="px-2 py-2"><input type="text" value={c.name} onChange={(e) => updateClass(c.code, 'name', e.target.value)} className="w-full px-2 py-1 border border-gray-200 rounded text-sm" /></td>
                            <td className="px-2 py-2">
                              <select value={c.term} onChange={(e) => updateClass(c.code, 'term', e.target.value)} className="w-full px-1 py-1 border border-gray-200 rounded text-sm">
                                {semester.terms?.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                              </select>
                            </td>
                            <td className="px-2 py-2">
                              <select value={c.day} onChange={(e) => updateClass(c.code, 'day', e.target.value)} className="w-full px-1 py-1 border border-gray-200 rounded text-sm">
                                {days.map(d => <option key={d}>{d}</option>)}
                              </select>
                            </td>
                            <td className="px-2 py-2">
                              <select value={c.time || '8:05 AM - 5:25 PM'} onChange={(e) => updateClass(c.code, 'time', e.target.value)} className="w-full px-1 py-1 border border-gray-200 rounded text-sm">
                                {times.map(t => <option key={t}>{t}</option>)}
                              </select>
                            </td>
                            <td className="px-2 py-2">
                              <div className="flex items-center">
                                <span className="text-gray-400 mr-1">$</span>
                                <input type="number" value={c.feePerStudent} onChange={(e) => updateClass(c.code, 'feePerStudent', parseFloat(e.target.value) || 0)} className="w-16 px-1 py-1 border border-gray-200 rounded text-sm" step="0.01" />
                              </div>
                            </td>
                            <td className="px-2 py-2">
                              <select value={c.instructor} onChange={(e) => updateClass(c.code, 'instructor', e.target.value)} className="w-full px-1 py-1 border border-gray-200 rounded text-sm">
                                <option value="">Select...</option>
                                {instructors.map(i => <option key={i.name} value={i.name}>{i.name}</option>)}
                              </select>
                            </td>
                            <td className="px-2 py-2"><input type="text" value={c.room || ''} onChange={(e) => updateClass(c.code, 'room', e.target.value)} className="w-20 px-2 py-1 border border-gray-200 rounded text-sm" placeholder="Room" /></td>
                            <td className="px-2 py-2">
                              <button onClick={() => deleteClass(c.code)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Delete class"><DeleteIcon /></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'semester' && (
          <div className="max-w-2xl">
            <div className="mb-6">
              <label className="block text-sm font-medium mb-1">Semester Name</label>
              <input type="text" value={semester.name} onChange={(e) => saveSemester({ ...semester, name: e.target.value })} className="w-full px-3 py-2 border rounded" />
            </div>
            <h3 className="text-lg font-semibold mb-4">Terms</h3>
            <div className="space-y-4">
              {semester.terms?.map(term => (
                <div key={term.id} className="p-4 bg-gray-50 rounded-lg border">
                  <div className="grid grid-cols-4 gap-4">
                    <div><label className="block text-xs font-medium text-gray-500 mb-1">Term Name</label>
                      <input type="text" value={term.name} onChange={(e) => updateTerm(term.id, 'name', e.target.value)} className="w-full px-3 py-2 border rounded" /></div>
                    <div><label className="block text-xs font-medium text-gray-500 mb-1">Start Date</label>
                      <input type="date" value={term.startDate} onChange={(e) => updateTerm(term.id, 'startDate', e.target.value)} className="w-full px-3 py-2 border rounded" /></div>
                    <div><label className="block text-xs font-medium text-gray-500 mb-1">End Date</label>
                      <input type="date" value={term.endDate} onChange={(e) => updateTerm(term.id, 'endDate', e.target.value)} className="w-full px-3 py-2 border rounded" /></div>
                    <div><label className="block text-xs font-medium text-gray-500 mb-1">Weeks</label>
                      <input type="number" value={term.weeks} onChange={(e) => updateTerm(term.id, 'weeks', parseInt(e.target.value) || 0)} className="w-full px-3 py-2 border rounded" /></div>
                  </div>
                  <div className="mt-3 text-sm text-gray-600">Classes in {term.name}: {classes.filter(c => c.term === term.id).length}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'calendar' && (
          <div>
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium mb-3">Add No-Class Date</h3>
              <div className="flex gap-2">
                <input type="date" value={newNoClass.date} onChange={(e) => setNewNoClass({ ...newNoClass, date: e.target.value })} className="px-3 py-2 border rounded" />
                <input type="text" value={newNoClass.name} onChange={(e) => setNewNoClass({ ...newNoClass, name: e.target.value })} placeholder="Reason (e.g., MLK Day)" className="flex-1 px-3 py-2 border rounded" />
                <select value={newNoClass.type} onChange={(e) => setNewNoClass({ ...newNoClass, type: e.target.value })} className="px-3 py-2 border rounded">
                  <option value="holiday">Holiday</option>
                  <option value="break">Break</option>
                  <option value="other">Other</option>
                </select>
                <button onClick={addNoClassDate} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Add</button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-700 mb-3">No-Class Dates for {semester.name}</h3>
                <div className="space-y-2">
                  {noClassDates.length === 0 ? <p className="text-gray-500 italic">No dates configured</p> : (
                    noClassDates.map(d => (
                      <div key={d.date} className="flex items-center justify-between p-3 bg-gray-50 rounded border hover:border-gray-300">
                        <div>
                          <span className="font-medium">{new Date(d.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                          <span className="ml-2 text-gray-600">— {d.name}</span>
                          <span className={`ml-2 text-xs px-2 py-0.5 rounded ${d.type === 'holiday' ? 'bg-red-100 text-red-700' : d.type === 'break' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-200 text-gray-600'}`}>{d.type}</span>
                        </div>
                        <button onClick={() => deleteNoClassDate(d.date)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Delete"><DeleteIcon /></button>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-700 mb-3">Affected Classes</h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {noClassDates.map(ncd => {
                    const affectedClasses = classes.filter(c => getClassMeetingDates(c).some(m => m.date === ncd.date));
                    if (affectedClasses.length === 0) return null;
                    return (
                      <div key={ncd.date} className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                        <div className="font-medium text-yellow-800">{new Date(ncd.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })} — {ncd.name}</div>
                        <div className="mt-1 text-sm text-yellow-700">Affected: {affectedClasses.map(c => c.code.split('-')[0]).join(', ')}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'vendors' && (
          <div>
            <div className="mb-6 p-4 bg-blue-50 rounded-lg flex gap-2">
              <input type="text" value={newVendor} onChange={(e) => setNewVendor(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && addVendor()} placeholder="New vendor..." className="flex-1 px-3 py-2 border rounded" />
              <button onClick={addVendor} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Add</button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {vendors.map(name => (
                <div key={name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border hover:border-gray-300">
                  {editingVendor === name ? (
                    <input type="text" value={editValue} onChange={(e) => setEditValue(e.target.value)} onBlur={() => updateVendor(name)} onKeyPress={(e) => e.key === 'Enter' && updateVendor(name)} className="flex-1 px-2 py-1 border border-blue-500 rounded mr-2" autoFocus />
                  ) : <span className="font-medium text-gray-800">{name}</span>}
                  <div className="flex gap-1">
                    <button onClick={() => { setEditingVendor(name); setEditValue(name); }} className={`p-1.5 rounded transition-colors ${editingVendor === name ? 'text-blue-600 bg-blue-50' : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'}`} title="Edit vendor"><EditIcon /></button>
                    <button onClick={() => deleteVendor(name)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Delete vendor"><DeleteIcon /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
