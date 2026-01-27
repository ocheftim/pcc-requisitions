import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { ChevronDown, ChevronRight } from 'lucide-react';

const COURSES = ['CUL130', 'CUL160', 'CUL244', 'CUL260'];

const DATE_RANGES = [
  { id: '1/13-1/16', start: '2026-01-13', end: '2026-01-16', label: 'Jan 13 - 16', term: 'Term 1' },
  { id: '1/20-1/23', start: '2026-01-20', end: '2026-01-23', label: 'Jan 20 - 23', term: 'Term 1' },
  { id: '1/27-1/30', start: '2026-01-27', end: '2026-01-30', label: 'Jan 27 - 30', term: 'Term 1' },
  { id: '2/3-2/6', start: '2026-02-03', end: '2026-02-06', label: 'Feb 3 - 6', term: 'Term 1' },
  { id: '2/10-2/13', start: '2026-02-10', end: '2026-02-13', label: 'Feb 10 - 13', term: 'Term 1' },
  { id: '2/17-2/20', start: '2026-02-17', end: '2026-02-20', label: 'Feb 17 - 20', term: 'Term 1' },
  { id: '2/24-2/27', start: '2026-02-24', end: '2026-02-27', label: 'Feb 24 - 27', term: 'Term 1' },
  { id: '3/3-3/6', start: '2026-03-03', end: '2026-03-06', label: 'Mar 3 - 6', term: 'Term 1' },
  { id: '3/10-3/13', start: '2026-03-10', end: '2026-03-13', label: 'Mar 10 - 13', term: 'Term 2' },
];

const parseDate = (d) => {
  if (!d) return null;
  const str = d.split('T')[0];
  const [y, m, day] = str.split('-').map(Number);
  return new Date(y, m - 1, day);
};

const formatDate = (d) => {
  const date = parseDate(d);
  if (!date) return '';
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' });
};

// Extract module info - keeps "Module X - Topic" or "Week X - Topic"
const formatModule = (week) => {
  if (!week) return '';
  
  // Remove "Term X Week X:" prefix if present, but keep Module info
  let result = week.replace(/^Term \d+\s+Week \d+[:\s-]*/i, '').trim();
  
  // If it starts with just "Week X" (no module), keep it
  // If it has Module, that's already clean
  return result;
};

export default function RequisitionsPage() {
  const navigate = useNavigate();
  const [requisitions, setRequisitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [expandedRanges, setExpandedRanges] = useState({});

  useEffect(() => { fetchRequisitions(); }, [selectedCourse]);

  const fetchRequisitions = async () => {
    setLoading(true);
    let query = supabase.from('requisitions').select('*').order('class_date', { ascending: true });
    if (selectedCourse !== 'all') query = query.eq('course', selectedCourse);
    const { data } = await query;
    setRequisitions(data || []);
    const expanded = {};
    const today = new Date().toISOString().split('T')[0];
    DATE_RANGES.forEach(r => { expanded[r.id] = r.end >= today; });
    expanded['past'] = false;
    expanded['other'] = true;
    setExpandedRanges(expanded);
    setLoading(false);
  };

  const today = new Date().toISOString().split('T')[0];

  const getDate = (d) => d ? d.split('T')[0] : '';

  const getReqsForRange = (start, end) => {
    return requisitions.filter(r => {
      const d = getDate(r.class_date);
      return d >= start && d <= end;
    });
  };

  const getPastReqs = () => {
    const firstRangeStart = DATE_RANGES[0]?.start;
    return requisitions.filter(r => getDate(r.class_date) < firstRangeStart);
  };

  const getOtherReqs = () => {
    const lastRangeEnd = DATE_RANGES[DATE_RANGES.length - 1]?.end;
    return requisitions.filter(r => getDate(r.class_date) > lastRangeEnd);
  };

  const toggleRange = (id) => {
    setExpandedRanges(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const ReqRow = ({ req }) => {
    const isPast = getDate(req.class_date) < today;
    const itemCount = Array.isArray(req.items) ? req.items.length : 0;
    
    return (
      <tr className={`hover:bg-gray-50 ${isPast ? 'opacity-40' : ''}`}>
        <td className="px-4 py-2 text-gray-700 w-20 whitespace-nowrap">{formatDate(req.class_date)}</td>
        <td className="px-3 py-2 font-medium text-gray-900 w-16 whitespace-nowrap">{req.course}</td>
        <td className="px-3 py-2 text-gray-600 w-20 whitespace-nowrap">{req.instructor}</td>
        <td className="px-3 py-2 text-gray-700 whitespace-nowrap">
          <span className="font-medium">{formatModule(req.week)}</span>
        </td>
        <td className="px-3 py-2 text-right w-12">
          {itemCount > 0 ? (
            <span className="text-gray-600">{itemCount}</span>
          ) : (
            <span className="text-orange-500 text-xs">Empty</span>
          )}
        </td>
        <td className="px-3 py-2 text-right w-24">
          <button onClick={() => navigate(`/requisitions/print/${req.id}`)} className="text-gray-400 hover:text-gray-600 mr-3">View</button>
          <button onClick={() => navigate(`/requisitions/edit/${req.id}`)} className="text-blue-600 hover:text-blue-800">Edit</button>
        </td>
      </tr>
    );
  };

  const Section = ({ id, label, term, reqs, faded }) => {
    if (reqs.length === 0) return null;
    return (
      <div className="bg-white rounded-lg border overflow-hidden">
        <button onClick={() => toggleRange(id)} className="w-full px-4 py-2 flex items-center justify-between bg-gray-50 hover:bg-gray-100 text-left">
          <div className="flex items-center gap-3">
            <span className={`font-medium ${faded ? 'text-gray-400' : 'text-gray-800'}`}>{label}</span>
            {term && <span className="text-xs text-gray-400">{term}</span>}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">{reqs.length}</span>
            {expandedRanges[id] ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
          </div>
        </button>
        {expandedRanges[id] && (
          <table className="w-full text-sm">
            <tbody className="divide-y divide-gray-100">
              {reqs.map(req => <ReqRow key={req.id} req={req} />)}
            </tbody>
          </table>
        )}
      </div>
    );
  };

  const pastReqs = getPastReqs();
  const otherReqs = getOtherReqs();

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Requisitions</h1>
        <div className="flex gap-2">
          <button onClick={() => navigate('/reports/budget')} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm">Budget Report</button>
          <button onClick={() => navigate('/requisitions/new')} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">+ New</button>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <button onClick={() => setSelectedCourse('all')} className={`px-3 py-1.5 rounded text-sm ${selectedCourse === 'all' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700'}`}>All</button>
        {COURSES.map(c => (
          <button key={c} onClick={() => setSelectedCourse(c)} className={`px-3 py-1.5 rounded text-sm ${selectedCourse === c ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}>{c}</button>
        ))}
      </div>

      {loading ? <div className="text-center py-8 text-gray-500">Loading...</div> : (
        <div className="space-y-2">
          <Section id="past" label="Past" term="" reqs={pastReqs} faded={true} />
          {DATE_RANGES.map(range => (
            <Section key={range.id} id={range.id} label={range.label} term={range.term} reqs={getReqsForRange(range.start, range.end)} faded={range.end < today} />
          ))}
          <Section id="other" label="Future" term="" reqs={otherReqs} faded={false} />
        </div>
      )}
    </div>
  );
}
