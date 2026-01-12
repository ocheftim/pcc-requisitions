import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [requisitions, setRequisitions] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    pendingRequisitions: 0,
    approvedThisWeek: 0,
    totalBudgetUsed: 0,
    upcomingClasses: 0
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Load requisitions
      const { data: reqData, error: reqError } = await supabase
        .from('requisitions')
        .select('*')
        .order('class_date', { ascending: true });

      if (reqError) throw reqError;
      setRequisitions(reqData || []);

      // Load catering events if table exists
      const { data: eventData } = await supabase
        .from('catering_events')
        .select('*')
        .order('event_date', { ascending: true });

      setEvents(eventData || []);

      // Calculate stats
      const now = new Date();
      const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      const pending = (reqData || []).filter(r => r.status === 'submitted' || r.status === 'pending').length;
      const approved = (reqData || []).filter(r => {
        const classDate = new Date(r.class_date);
        return r.status === 'approved' && classDate >= now && classDate <= weekFromNow;
      }).length;
      const upcoming = (reqData || []).filter(r => {
        const classDate = new Date(r.class_date);
        return classDate >= now && classDate <= weekFromNow;
      }).length;
      const totalBudget = (reqData || []).reduce((sum, r) => sum + (parseFloat(r.estimated_cost) || 0), 0);

      setStats({
        pendingRequisitions: pending,
        approvedThisWeek: approved,
        totalBudgetUsed: totalBudget,
        upcomingClasses: upcoming
      });

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calendar helpers
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    return { daysInMonth, startingDay };
  };

  const getEventsForDate = (day) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    const classesOnDate = requisitions.filter(r => {
      if (!r.class_date) return false;
      const reqDate = r.class_date.split('T')[0];
      return reqDate === dateStr;
    });

    const eventsOnDate = events.filter(e => {
      if (!e.event_date) return false;
      const eventDate = e.event_date.split('T')[0];
      return eventDate === dateStr;
    });

    return { classes: classesOnDate, events: eventsOnDate };
  };

  const navigateMonth = (direction) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + direction);
      return newDate;
    });
  };

  const { daysInMonth, startingDay } = getDaysInMonth(currentDate);
  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  const today = new Date();
  const isCurrentMonth = today.getMonth() === currentDate.getMonth() && today.getFullYear() === currentDate.getFullYear();

  const upcomingItems = [...requisitions, ...events]
    .filter(item => {
      const itemDate = new Date(item.class_date || item.event_date);
      return itemDate >= new Date();
    })
    .sort((a, b) => {
      const dateA = new Date(a.class_date || a.event_date);
      const dateB = new Date(b.class_date || b.event_date);
      return dateA - dateB;
    })
    .slice(0, 8);

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="bg-stone-800 text-white px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">ToqueWorks</h1>
            <p className="text-stone-400 text-sm">Lab Requisition Management</p>
          </div>
          <div className="text-right">
            <p className="text-stone-300 text-sm">{today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div 
            onClick={() => navigate('/consolidated')}
            className="bg-white rounded-lg p-4 border border-stone-200 hover:border-amber-400 hover:shadow-md transition-all cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-stone-800">{stats.pendingRequisitions}</p>
                <p className="text-xs text-stone-500 uppercase tracking-wide">Pending Review</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-stone-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-stone-800">{stats.approvedThisWeek}</p>
                <p className="text-xs text-stone-500 uppercase tracking-wide">Approved This Week</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-stone-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-stone-800">{stats.upcomingClasses}</p>
                <p className="text-xs text-stone-500 uppercase tracking-wide">Classes This Week</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-stone-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-stone-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-stone-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-stone-800">${stats.totalBudgetUsed.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
                <p className="text-xs text-stone-500 uppercase tracking-wide">Total Requisitions</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-2 bg-white rounded-lg border border-stone-200 overflow-hidden">
            <div className="bg-stone-800 text-white px-4 py-3 flex items-center justify-between">
              <button 
                onClick={() => navigateMonth(-1)}
                className="p-1 hover:bg-stone-700 rounded transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h2 className="text-lg font-semibold">{monthName}</h2>
              <button 
                onClick={() => navigateMonth(1)}
                className="p-1 hover:bg-stone-700 rounded transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 bg-stone-100 border-b border-stone-200">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="py-2 text-center text-xs font-semibold text-stone-600 uppercase tracking-wide">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7">
              {/* Empty cells for days before month starts */}
              {Array.from({ length: startingDay }).map((_, i) => (
                <div key={`empty-${i}`} className="min-h-[80px] bg-stone-50 border-b border-r border-stone-100" />
              ))}
              
              {/* Days of the month */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const { classes, events: dayEvents } = getEventsForDate(day);
                const isToday = isCurrentMonth && day === today.getDate();
                const hasItems = classes.length > 0 || dayEvents.length > 0;
                
                return (
                  <div 
                    key={day}
                    className={`min-h-[80px] p-1 border-b border-r border-stone-100 transition-colors
                      ${isToday ? 'bg-amber-50' : 'bg-white hover:bg-stone-50'}
                      ${hasItems ? 'cursor-pointer' : ''}`}
                  >
                    <div className={`text-sm font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full
                      ${isToday ? 'bg-amber-500 text-white' : 'text-stone-700'}`}>
                      {day}
                    </div>
                    
                    <div className="space-y-0.5 overflow-hidden">
                      {classes.slice(0, 2).map((cls, idx) => (
                        <div 
                          key={`class-${idx}`}
                          onClick={() => navigate(`/consolidated?course=${encodeURIComponent(cls.course)}&date=${cls.class_date}`)}
                          className="text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 truncate cursor-pointer hover:bg-blue-200 transition-colors"
                          title={`${cls.course} - ${cls.instructor}`}
                        >
                          {cls.course}
                        </div>
                      ))}
                      {dayEvents.slice(0, 2).map((evt, idx) => (
                        <div 
                          key={`event-${idx}`}
                          onClick={() => navigate(`/catering/events?id=${evt.id}`)}
                          className="text-xs px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 truncate cursor-pointer hover:bg-emerald-200 transition-colors"
                          title={evt.event_name}
                        >
                          {evt.event_name}
                        </div>
                      ))}
                      {(classes.length + dayEvents.length) > 2 && (
                        <div className="text-xs text-stone-400 px-1">
                          +{classes.length + dayEvents.length - 2} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="px-4 py-3 bg-stone-50 border-t border-stone-200 flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-blue-100 border border-blue-200"></div>
                <span className="text-stone-600">Classes</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-emerald-100 border border-emerald-200"></div>
                <span className="text-stone-600">Catering Events</span>
              </div>
            </div>
          </div>

          {/* Right sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-lg border border-stone-200 p-4">
              <h3 className="text-sm font-semibold text-stone-800 uppercase tracking-wide mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <button 
                  onClick={() => navigate('/consolidated')}
                  className="w-full text-left px-3 py-2 rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition-colors text-sm font-medium"
                >
                  Review Consolidated Orders
                </button>
                <button 
                  onClick={() => navigate('/requisitions')}
                  className="w-full text-left px-3 py-2 rounded-lg bg-stone-100 text-stone-700 hover:bg-stone-200 transition-colors text-sm"
                >
                  View All Requisitions
                </button>
                <button 
                  onClick={() => navigate('/ingredients')}
                  className="w-full text-left px-3 py-2 rounded-lg bg-stone-100 text-stone-700 hover:bg-stone-200 transition-colors text-sm"
                >
                  Manage Ingredients
                </button>
                <button 
                  onClick={() => navigate('/events')}
                  className="w-full text-left px-3 py-2 rounded-lg bg-stone-100 text-stone-700 hover:bg-stone-200 transition-colors text-sm"
                >
                  Catering Events
                </button>
              </div>
            </div>

            {/* Upcoming Items */}
            <div className="bg-white rounded-lg border border-stone-200">
              <div className="px-4 py-3 border-b border-stone-200">
                <h3 className="text-sm font-semibold text-stone-800 uppercase tracking-wide">Upcoming</h3>
              </div>
              <div className="divide-y divide-stone-100">
                {loading ? (
                  <div className="p-4 text-center text-stone-400 text-sm">Loading...</div>
                ) : upcomingItems.length === 0 ? (
                  <div className="p-4 text-center text-stone-400 text-sm">No upcoming items</div>
                ) : (
                  upcomingItems.map((item, idx) => {
                    const isEvent = !!item.event_date;
                    const date = new Date(item.class_date || item.event_date);
                    const dateStr = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                    
                    return (
                      <div 
                        key={idx} 
                        onClick={() => navigate(isEvent ? `/catering/events?id=${item.id}` : `/consolidated?course=${encodeURIComponent(item.course)}&date=${item.class_date}`)}
                        className="px-4 py-3 hover:bg-stone-50 transition-colors cursor-pointer"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-stone-800 truncate">
                              {isEvent ? item.event_name : `${item.course} - ${item.instructor}`}
                            </p>
                            <p className="text-xs text-stone-500">{dateStr}</p>
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap
                            ${isEvent ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                            {isEvent ? 'Event' : item.status || 'Class'}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
