import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const CATERING_EVENTS = [
  { id: 'cat-1', name: "Chancellor's Cabinet Dinner", date: '2025-12-10', guests: 15, location: "Marci's Home", status: 'completed', amount: null, foap: null, paidDate: 'Dec 2025', paidMethod: 'check' },
  { id: 'cat-2', name: 'VP Soto Campus Welcome Lunch', date: '2026-01-14', guests: 100, location: 'Desert Vista Cafeteria', status: 'completed', amount: 1027, foap: '132000 | DVINPT | 54403 | 8FDSVC', paidDate: 'Jan 15, 2026' },
  { id: 'cat-3', name: 'Hispanic Chamber Reception', date: '2026-01-21', guests: 125, location: 'Tucson Convention Center', status: 'completed', amount: 1217.25, foap: '132000 | DVINPT | 54403 | 8FDSVC', invoiceStatus: 'pending' },
  { id: 'cat-4', name: 'Spring Fest 2025', date: '2026-02-21', guests: 500, location: 'Desert Vista Campus', status: 'confirmed', amount: null, foap: null },
  { id: 'cat-5', name: 'Retirement - Michelle Nieuwenhuis', date: '2026-03-03', guests: 150, location: 'Downtown - Azurite Room', status: 'pending' },
  { id: 'cat-6', name: "Donor's Reception", date: '2026-03-10', guests: 150, location: 'Downtown - Azurite Room', status: 'pending' },
  { id: 'cat-7', name: 'Retirement - Gabriela De Echavarri', date: '2026-03-12', guests: 100, location: 'West Campus - Saguaro Room', status: 'pending' },
];

const COURSE_STUDENT_COUNTS = { '260': 12, '244': 13, '130': 7, '160': 12 };

const getStudentCount = (courseName) => {
  if (!courseName) return 0;
  const nums = courseName.match(/\d{3}/);
  return nums && COURSE_STUDENT_COUNTS[nums[0]] ? COURSE_STUDENT_COUNTS[nums[0]] : 0;
};

export default function DashboardPage() {
  const [requisitions, setRequisitions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const { data, error } = await supabase
          .from('requisitions')
          .select('*')
          .order('class_date', { ascending: true });
        if (!error && data) setRequisitions(data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  const upcomingReqs = useMemo(() => {
    const twoWeeks = new Date(today);
    twoWeeks.setDate(twoWeeks.getDate() + 14);
    return requisitions.filter(r => {
      const d = new Date(r.class_date + 'T00:00:00');
      return d >= today && d <= twoWeeks;
    }).sort((a, b) => new Date(a.class_date) - new Date(b.class_date));
  }, [requisitions, todayStr]);

  const upcomingCatering = useMemo(() => {
    return CATERING_EVENTS.filter(e => e.status !== 'completed')
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, []);

  const completedCatering = useMemo(() => {
    return CATERING_EVENTS.filter(e => e.status === 'completed')
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, []);

  const stats = useMemo(() => {
    const thisWeekEnd = new Date(today);
    thisWeekEnd.setDate(thisWeekEnd.getDate() + 7);
    const thisWeekReqs = requisitions.filter(r => {
      const d = new Date(r.class_date + 'T00:00:00');
      return d >= today && d <= thisWeekEnd;
    });
    const confirmedEvents = CATERING_EVENTS.filter(e => e.status === 'confirmed' || e.status === 'pending');
    const totalCateringGuests = confirmedEvents.reduce((sum, e) => sum + e.guests, 0);
    return {
      thisWeekClasses: thisWeekReqs.length,
      upcomingEvents: confirmedEvents.length,
      totalCateringGuests,
      completedEvents: CATERING_EVENTS.filter(e => e.status === 'completed').length
    };
  }, [requisitions, todayStr]);

  const formatDate = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const getDaysUntil = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00');
    d.setHours(0, 0, 0, 0);
    const diffTime = d.getTime() - today.getTime();
    const diff = Math.round(diffTime / (1000 * 60 * 60 * 24));
    if (diff === 0) return { text: 'Today', urgent: true };
    if (diff === 1) return { text: 'Tomorrow', urgent: true };
    if (diff < 0) return { text: `${Math.abs(diff)}d ago`, past: true };
    return { text: `${diff} days`, urgent: diff <= 7 };
  };

  if (loading) {
    return <div className="p-6"><div className="animate-pulse text-gray-500">Loading dashboard...</div></div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-800">Operations Dashboard</h1>
        <p className="text-slate-500 text-sm">{today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
          <div className="text-2xl font-semibold text-slate-700">{stats.thisWeekClasses}</div>
          <div className="text-xs text-slate-500 uppercase tracking-wide mt-1">Classes This Week</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
          <div className="text-2xl font-semibold text-slate-700">{stats.upcomingEvents}</div>
          <div className="text-xs text-slate-500 uppercase tracking-wide mt-1">Upcoming Events</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
          <div className="text-2xl font-semibold text-slate-700">{stats.totalCateringGuests.toLocaleString()}</div>
          <div className="text-xs text-slate-500 uppercase tracking-wide mt-1">Total Guests</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
          <div className="text-2xl font-semibold text-slate-700">{stats.completedEvents}</div>
          <div className="text-xs text-slate-500 uppercase tracking-wide mt-1">Events Completed</div>
        </div>
      </div>

      {/* Spring Fest Banner */}
      {(() => {
        const springFest = CATERING_EVENTS.find(e => e.name === 'Spring Fest 2025');
        if (!springFest) return null;
        const days = getDaysUntil(springFest.date);
        if (days.past || parseInt(days.text) > 60) return null;
        const daysNum = days.text === 'Today' ? 0 : days.text === 'Tomorrow' ? 1 : parseInt(days.text);
        return (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-blue-600 uppercase tracking-wide font-medium mb-1">Featured Event</div>
                <h2 className="text-lg font-semibold text-slate-800">Spring Fest 2025</h2>
                <p className="text-sm text-slate-600">February 21 · 500 guests · Desert Vista Campus</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-semibold text-blue-600">{daysNum}</div>
                <div className="text-xs text-slate-500">days</div>
              </div>
            </div>
            <div className="mt-4 flex gap-6 text-sm">
              <div className="text-slate-600"><span className="text-slate-500">Sysco:</span> <span className="font-medium">Request Sent</span></div>
              <div className="text-slate-600"><span className="text-slate-500">Menu:</span> <span className="font-medium">Confirmed</span></div>
              <div className="text-slate-600"><span className="text-slate-500">Production:</span> <span className="font-medium">In Progress</span></div>
            </div>
          </div>
        );
      })()}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Catering Events */}
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
            <h2 className="font-semibold text-slate-700">Catering Events</h2>
          </div>
          <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
            {upcomingCatering.map(event => {
              const days = getDaysUntil(event.date);
              return (
                <div key={event.id} className="p-4 hover:bg-slate-50">
                  <div className="flex justify-between items-start mb-1">
                    <div className="font-medium text-slate-800">{event.name}</div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      event.status === 'confirmed' 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {event.status === 'confirmed' ? 'Confirmed' : 'Pending'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <div className="text-slate-500">
                      {formatDate(event.date)} · {event.guests} guests
                    </div>
                    <span className={`text-sm ${days.urgent ? 'font-medium text-amber-600' : 'text-slate-400'}`}>
                      {days.text}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1">{event.location}</div>
                </div>
              );
            })}
          </div>
          {completedCatering.length > 0 && (
            <div className="border-t border-slate-200 px-4 py-2 bg-slate-50">
              <details className="text-sm">
                <summary className="text-slate-500 cursor-pointer hover:text-slate-700">
                  {completedCatering.length} completed events
                </summary>
                <div className="mt-2 space-y-3">
                  {completedCatering.map(event => (
                    <div key={event.id} className="text-xs border-l-2 border-slate-200 pl-3">
                      <div className="font-medium text-slate-600">{event.name}</div>
                      <div className="text-slate-400">{formatDate(event.date)} · {event.guests} guests</div>
                      {event.amount && (
                        <div className="text-slate-500 mt-1">
                          ${event.amount.toLocaleString()} 
                          {event.paidDate ? (
                            <span className="text-emerald-600 ml-2">✓ Paid {event.paidDate}</span>
                          ) : event.invoiceStatus === 'pending' ? (
                            <span className="text-amber-600 ml-2">⏳ Invoice pending</span>
                          ) : null}
                        </div>
                      )}
                      {!event.amount && event.paidDate && (
                        <div className="text-emerald-600 mt-1">✓ Paid ({event.paidMethod || 'processed'})</div>
                      )}
                    </div>
                  ))}
                </div>
              </details>
            </div>
          )}
        </div>

        {/* Upcoming Classes */}
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
            <h2 className="font-semibold text-slate-700">Upcoming Classes</h2>
            <Link to="/pull-list" className="text-xs text-blue-600 hover:text-blue-700 font-medium">
              Pull Lists →
            </Link>
          </div>
          <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
            {upcomingReqs.length === 0 ? (
              <div className="p-4 text-slate-500 text-sm">No classes scheduled in the next 2 weeks</div>
            ) : (
              upcomingReqs.map(req => {
                const studentCount = getStudentCount(req.course);
                const days = getDaysUntil(req.class_date);
                return (
                  <div key={req.id} className={`p-4 hover:bg-slate-50 ${days.past ? 'opacity-50' : ''}`}>
                    <div className="flex justify-between items-start mb-1">
                      <div>
                        <span className="font-medium text-slate-800">{req.course}</span>
                        <span className="text-slate-500 ml-2 text-sm">- {req.week || 'No topic'}</span>
                      </div>
                      {studentCount > 0 && (
                        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                          {studentCount} students
                        </span>
                      )}
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <div className="text-slate-500">
                        {formatDate(req.class_date)}
                        {req.instructor && <span className="ml-2">· {req.instructor}</span>}
                      </div>
                      <span className={`text-sm ${days.past ? 'text-slate-400' : days.urgent ? 'font-medium text-amber-600' : 'text-slate-400'}`}>
                        {days.text}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
        <h2 className="font-semibold text-slate-700 mb-3">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link to="/requisitions" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
            View Requisitions
          </Link>
          <Link to="/pull-list" className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 text-sm font-medium">
            Generate Pull List
          </Link>
          <Link to="/consolidated" className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 text-sm font-medium">
            Consolidated Orders
          </Link>
        </div>
      </div>
    </div>
  );
}
