import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Download, Printer } from 'lucide-react';

const DATE_RANGES = [
  { id: '1/13-1/16', start: '2026-01-13', end: '2026-01-16', label: 'Jan 13 - 16' },
  { id: '1/20-1/23', start: '2026-01-20', end: '2026-01-23', label: 'Jan 20 - 23' },
  { id: '1/27-1/30', start: '2026-01-27', end: '2026-01-30', label: 'Jan 27 - 30' },
  { id: '2/3-2/6', start: '2026-02-03', end: '2026-02-06', label: 'Feb 3 - 6' },
  { id: '2/10-2/13', start: '2026-02-10', end: '2026-02-13', label: 'Feb 10 - 13' },
  { id: '2/17-2/20', start: '2026-02-17', end: '2026-02-20', label: 'Feb 17 - 20' },
  { id: '2/24-2/27', start: '2026-02-24', end: '2026-02-27', label: 'Feb 24 - 27' },
  { id: '3/3-3/6', start: '2026-03-03', end: '2026-03-06', label: 'Mar 3 - 6' },
  { id: '3/10-3/13', start: '2026-03-10', end: '2026-03-13', label: 'Mar 10 - 13' },
];

export default function BudgetReportPage() {
  const [requisitions, setRequisitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('term1');
  const [viewMode, setViewMode] = useState('weekly');

  useEffect(() => { loadRequisitions(); }, [dateRange]);

  const loadRequisitions = async () => {
    setLoading(true);
    let query = supabase.from('requisitions').select('*').order('class_date', { ascending: true });
    
    if (dateRange === 'term1') {
      query = query.gte('class_date', '2026-01-13').lte('class_date', '2026-03-06');
    } else if (dateRange === 'term2') {
      query = query.gte('class_date', '2026-03-09').lte('class_date', '2026-05-15');
    }
    
    const { data } = await query;
    setRequisitions(data || []);
    setLoading(false);
  };

  const getDate = (d) => d ? d.split('T')[0] : '';

  const calculateItemsTotal = (items) => {
    if (!items) return 0;
    const parsed = typeof items === 'string' ? JSON.parse(items) : items;
    return parsed.reduce((sum, item) => sum + (parseFloat(item.extended) || 0), 0);
  };

  const formatDate = (d) => {
    if (!d) return '';
    const str = d.split('T')[0];
    const [y, m, day] = str.split('-').map(Number);
    return new Date(y, m - 1, day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const extractTopic = (week) => {
    if (!week) return '';
    const match = week.match(/(?:Term \d+ )?(?:Week \d+[:\s-]*)?(?:Module \d+[:\s-]*)?(.+)$/i);
    return match ? match[1].replace(/^[\s-]+/, '').trim() : week;
  };

  // Group by course
  const courseData = requisitions.reduce((acc, req) => {
    const course = req.course || 'Unknown';
    if (!acc[course]) {
      acc[course] = { course, program: req.program, instructor: req.instructor, reqCount: 0, totalBudget: 0, totalActual: 0, weeks: [] };
    }
    acc[course].reqCount++;
    acc[course].totalBudget += parseFloat(req.budget) || 0;
    acc[course].totalActual += calculateItemsTotal(req.items);
    acc[course].weeks.push({
      date: req.class_date, week: req.week, budget: parseFloat(req.budget) || 0,
      actual: calculateItemsTotal(req.items),
      items: (typeof req.items === 'string' ? JSON.parse(req.items) : req.items)?.length || 0
    });
    return acc;
  }, {});

  // Group by week with running totals
  let runningBudget = 0;
  let runningActual = 0;
  const weeklyData = DATE_RANGES.map(range => {
    const weekReqs = requisitions.filter(r => {
      const d = getDate(r.class_date);
      return d >= range.start && d <= range.end;
    });
    const totalBudget = weekReqs.reduce((sum, r) => sum + (parseFloat(r.budget) || 0), 0);
    const totalActual = weekReqs.reduce((sum, r) => sum + calculateItemsTotal(r.items), 0);
    runningBudget += totalBudget;
    runningActual += totalActual;
    return {
      ...range,
      reqs: weekReqs,
      reqCount: weekReqs.length,
      totalBudget,
      totalActual,
      variance: totalBudget - totalActual,
      runningBudget,
      runningActual,
      runningVariance: runningBudget - runningActual
    };
  }).filter(w => w.reqCount > 0);

  const courses = Object.values(courseData).sort((a, b) => a.course.localeCompare(b.course));
  const grandTotalBudget = courses.reduce((sum, c) => sum + c.totalBudget, 0);
  const grandTotalActual = courses.reduce((sum, c) => sum + c.totalActual, 0);

  const exportCSV = () => {
    let csv = '';
    if (viewMode === 'course') {
      csv = 'Course,Program,Instructor,# Reqs,Total Budget,Total Actual,Variance\n';
      courses.forEach(c => {
        csv += `${c.course},${c.program},${c.instructor},${c.reqCount},${c.totalBudget.toFixed(2)},${c.totalActual.toFixed(2)},${(c.totalBudget - c.totalActual).toFixed(2)}\n`;
      });
    } else {
      csv = 'Week,# Reqs,Budget,Estimated,Variance,Budget to Date,Estimated to Date,Variance to Date\n';
      weeklyData.forEach(w => {
        csv += `${w.label},${w.reqCount},${w.totalBudget.toFixed(2)},${w.totalActual.toFixed(2)},${w.variance.toFixed(2)},${w.runningBudget.toFixed(2)},${w.runningActual.toFixed(2)},${w.runningVariance.toFixed(2)}\n`;
      });
    }
    csv += `\nTOTAL,,${grandTotalBudget.toFixed(2)},${grandTotalActual.toFixed(2)},${(grandTotalBudget - grandTotalActual).toFixed(2)}\n`;
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `budget-report-${viewMode}-${dateRange}.csv`;
    a.click();
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="no-print flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Budget Summary Report</h1>
          <p className="text-gray-500">Culinary Arts & Baking Programs</p>
        </div>
        <div className="flex gap-2">
          <select value={viewMode} onChange={(e) => setViewMode(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg">
            <option value="weekly">By Week</option>
            <option value="course">By Course</option>
          </select>
          <select value={dateRange} onChange={(e) => setDateRange(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg">
            <option value="term1">Term 1 (Jan - Mar)</option>
            <option value="term2">Term 2 (Mar - May)</option>
            <option value="all">All</option>
          </select>
          <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
            <Download className="w-4 h-4" /> Export
          </button>
          <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Printer className="w-4 h-4" /> Print
          </button>
        </div>
      </div>

      <div className="hidden print:block mb-6">
        <h1 className="text-2xl font-bold">Culinary Lab Budget Summary - {viewMode === 'weekly' ? 'Weekly' : 'By Course'}</h1>
        <p className="text-gray-600">Pima Community College - {dateRange === 'term1' ? 'Term 1' : dateRange === 'term2' ? 'Term 2' : 'All Terms'}</p>
        <p className="text-sm text-gray-500">Generated: {new Date().toLocaleDateString()}</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg border p-4">
              <p className="text-sm text-gray-500">Total Requisitions</p>
              <p className="text-2xl font-bold text-gray-900">{requisitions.length}</p>
            </div>
            <div className="bg-white rounded-lg border p-4">
              <p className="text-sm text-gray-500">Total Budget</p>
              <p className="text-2xl font-bold text-gray-900">${grandTotalBudget.toFixed(2)}</p>
            </div>
            <div className="bg-white rounded-lg border p-4">
              <p className="text-sm text-gray-500">Total Estimated</p>
              <p className="text-2xl font-bold text-gray-900">${grandTotalActual.toFixed(2)}</p>
            </div>
            <div className="bg-white rounded-lg border p-4">
              <p className="text-sm text-gray-500">Variance</p>
              <p className={`text-2xl font-bold ${grandTotalBudget - grandTotalActual >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${(grandTotalBudget - grandTotalActual).toFixed(2)}
              </p>
            </div>
          </div>

          {viewMode === 'weekly' ? (
            <>
              {/* Weekly Summary Table */}
              <div className="bg-white rounded-lg border overflow-hidden mb-6">
                <div className="px-4 py-3 bg-gray-50 border-b">
                  <h2 className="font-semibold text-gray-800">Weekly Summary</h2>
                </div>
                <table className="w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-2 text-left">Week</th>
                      <th className="px-4 py-2 text-center"># Reqs</th>
                      <th className="px-4 py-2 text-right">Budget</th>
                      <th className="px-4 py-2 text-right">Estimated</th>
                      <th className="px-4 py-2 text-right">Variance</th>
                      <th className="px-4 py-2 text-right bg-blue-50">Budget to Date</th>
                      <th className="px-4 py-2 text-right bg-blue-50">Est. to Date</th>
                      <th className="px-4 py-2 text-right bg-blue-50">Var. to Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {weeklyData.map(w => (
                      <tr key={w.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2 font-medium">{w.label}</td>
                        <td className="px-4 py-2 text-center">{w.reqCount}</td>
                        <td className="px-4 py-2 text-right">${w.totalBudget.toFixed(2)}</td>
                        <td className="px-4 py-2 text-right">${w.totalActual.toFixed(2)}</td>
                        <td className={`px-4 py-2 text-right font-medium ${w.variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ${w.variance.toFixed(2)}
                        </td>
                        <td className="px-4 py-2 text-right bg-blue-50 font-medium">${w.runningBudget.toFixed(2)}</td>
                        <td className="px-4 py-2 text-right bg-blue-50 font-medium">${w.runningActual.toFixed(2)}</td>
                        <td className={`px-4 py-2 text-right bg-blue-50 font-bold ${w.runningVariance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ${w.runningVariance.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-200 font-bold">
                    <tr>
                      <td className="px-4 py-2">TOTAL</td>
                      <td className="px-4 py-2 text-center">{requisitions.length}</td>
                      <td className="px-4 py-2 text-right">${grandTotalBudget.toFixed(2)}</td>
                      <td className="px-4 py-2 text-right">${grandTotalActual.toFixed(2)}</td>
                      <td className={`px-4 py-2 text-right ${grandTotalBudget - grandTotalActual >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${(grandTotalBudget - grandTotalActual).toFixed(2)}
                      </td>
                      <td className="px-4 py-2 text-right bg-blue-100"></td>
                      <td className="px-4 py-2 text-right bg-blue-100"></td>
                      <td className="px-4 py-2 text-right bg-blue-100"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Weekly Detail */}
              {weeklyData.map(w => (
                <div key={w.id} className="bg-white rounded-lg border overflow-hidden mb-4">
                  <div className="px-4 py-3 bg-gray-50 border-b flex justify-between items-center">
                    <h3 className="font-semibold text-gray-800">{w.label}</h3>
                    <div className="text-right text-sm">
                      <span className="mr-4">Budget: <strong>${w.totalBudget.toFixed(2)}</strong></span>
                      <span className="mr-4">Est: <strong>${w.totalActual.toFixed(2)}</strong></span>
                      <span className={w.variance >= 0 ? 'text-green-600' : 'text-red-600'}>Var: <strong>${w.variance.toFixed(2)}</strong></span>
                    </div>
                  </div>
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-2 text-left">Date</th>
                        <th className="px-4 py-2 text-left">Course</th>
                        <th className="px-4 py-2 text-left">Instructor</th>
                        <th className="px-4 py-2 text-left">Topic</th>
                        <th className="px-4 py-2 text-right">Budget</th>
                        <th className="px-4 py-2 text-right">Estimated</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {w.reqs.map((req, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-4 py-2">{formatDate(req.class_date)}</td>
                          <td className="px-4 py-2 font-medium">{req.course}</td>
                          <td className="px-4 py-2 text-gray-600">{req.instructor}</td>
                          <td className="px-4 py-2 text-gray-600">{extractTopic(req.week)}</td>
                          <td className="px-4 py-2 text-right">${(parseFloat(req.budget) || 0).toFixed(2)}</td>
                          <td className="px-4 py-2 text-right">${calculateItemsTotal(req.items).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </>
          ) : (
            <>
              {/* Course Summary Table */}
              <div className="bg-white rounded-lg border overflow-hidden mb-6">
                <div className="px-4 py-3 bg-gray-50 border-b">
                  <h2 className="font-semibold text-gray-800">Summary by Course</h2>
                </div>
                <table className="w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-2 text-left">Course</th>
                      <th className="px-4 py-2 text-left">Program</th>
                      <th className="px-4 py-2 text-left">Instructor</th>
                      <th className="px-4 py-2 text-center"># Reqs</th>
                      <th className="px-4 py-2 text-right">Budget</th>
                      <th className="px-4 py-2 text-right">Estimated</th>
                      <th className="px-4 py-2 text-right">Variance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {courses.map(c => (
                      <tr key={c.course} className="hover:bg-gray-50">
                        <td className="px-4 py-2 font-medium">{c.course}</td>
                        <td className="px-4 py-2 text-gray-600">{c.program}</td>
                        <td className="px-4 py-2 text-gray-600">{c.instructor}</td>
                        <td className="px-4 py-2 text-center">{c.reqCount}</td>
                        <td className="px-4 py-2 text-right">${c.totalBudget.toFixed(2)}</td>
                        <td className="px-4 py-2 text-right">${c.totalActual.toFixed(2)}</td>
                        <td className={`px-4 py-2 text-right font-medium ${c.totalBudget - c.totalActual >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ${(c.totalBudget - c.totalActual).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-blue-50 font-bold">
                    <tr>
                      <td colSpan={3} className="px-4 py-2">TOTAL</td>
                      <td className="px-4 py-2 text-center">{requisitions.length}</td>
                      <td className="px-4 py-2 text-right">${grandTotalBudget.toFixed(2)}</td>
                      <td className="px-4 py-2 text-right">${grandTotalActual.toFixed(2)}</td>
                      <td className={`px-4 py-2 text-right ${grandTotalBudget - grandTotalActual >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${(grandTotalBudget - grandTotalActual).toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Course Detail */}
              {courses.map(c => (
                <div key={c.course} className="bg-white rounded-lg border overflow-hidden mb-4">
                  <div className="px-4 py-3 bg-gray-50 border-b flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold text-gray-800">{c.course} - {c.program}</h3>
                      <p className="text-sm text-gray-500">Instructor: {c.instructor}</p>
                    </div>
                    <div className="text-right text-sm">
                      <span className="mr-4">Budget: <strong>${c.totalBudget.toFixed(2)}</strong></span>
                      <span className="mr-4">Est: <strong>${c.totalActual.toFixed(2)}</strong></span>
                      <span className={c.totalBudget - c.totalActual >= 0 ? 'text-green-600' : 'text-red-600'}>
                        Var: <strong>${(c.totalBudget - c.totalActual).toFixed(2)}</strong>
                      </span>
                    </div>
                  </div>
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-2 text-left">Date</th>
                        <th className="px-4 py-2 text-left">Topic</th>
                        <th className="px-4 py-2 text-center">Items</th>
                        <th className="px-4 py-2 text-right">Budget</th>
                        <th className="px-4 py-2 text-right">Estimated</th>
                        <th className="px-4 py-2 text-right">Variance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {c.weeks.map((w, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-4 py-2">{formatDate(w.date)}</td>
                          <td className="px-4 py-2 text-gray-600">{extractTopic(w.week)}</td>
                          <td className="px-4 py-2 text-center">{w.items}</td>
                          <td className="px-4 py-2 text-right">${w.budget.toFixed(2)}</td>
                          <td className="px-4 py-2 text-right">${w.actual.toFixed(2)}</td>
                          <td className={`px-4 py-2 text-right ${w.budget - w.actual >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ${(w.budget - w.actual).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </>
          )}
        </>
      )}

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
    </div>
  );
}
