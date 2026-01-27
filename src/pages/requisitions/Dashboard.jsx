import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Package,
  Calendar,
  ChevronLeft,
  ChevronRight,
  DollarSign
} from 'lucide-react';

const Dashboard = () => {
  const [currentDate, setCurrentDate] = useState(new Date()); // January 23, 2026
  
  // Sample data - replace with your actual data source
  const requisitions = [
    { id: 1, class_code: 'CUL244', instructor: 'Mikesell', status: 'pending', needed_date: '2026-01-26', items: 12, total: 145.50 },
    { id: 2, class_code: 'CUL130', instructor: 'Wong', status: 'submitted', needed_date: '2026-01-27', items: 8, total: 89.25 },
    { id: 3, class_code: 'CUL260', instructor: 'Mikesell', status: 'pending', needed_date: '2026-01-28', items: 15, total: 210.00 },
    { id: 4, class_code: 'CUL160', instructor: 'Moreno', status: 'pending', needed_date: '2026-01-29', items: 10, total: 125.75 },
    { id: 5, class_code: 'CUL244', instructor: 'Mikesell', status: 'pending', needed_date: '2026-02-02', items: 14, total: 175.00 },
    { id: 6, class_code: 'CUL130', instructor: 'Wong', status: 'pending', needed_date: '2026-02-03', items: 9, total: 98.50 },
    // Add more as needed
  ];

  const classSchedule = [
    { code: 'CUL244', day: 'Tuesday', color: 'bg-amber-100 text-amber-800' },
    { code: 'CUL130', day: 'Wednesday', color: 'bg-blue-100 text-blue-800' },
    { code: 'CUL260', day: 'Thursday', color: 'bg-amber-100 text-amber-800' },
    { code: 'CUL160', day: 'Friday', color: 'bg-blue-100 text-blue-800' },
  ];

  // Calculate stats
  const stats = useMemo(() => {
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    const pending = requisitions.filter(r => r.status === 'pending' || r.status === 'submitted');
    const totalItems = pending.reduce((sum, r) => sum + r.items, 0);
    
    // Due this week (needed_date falls within current week)
    const dueThisWeek = pending.filter(r => {
      const needed = new Date(r.needed_date);
      return needed >= weekStart && needed <= weekEnd;
    });

    // Overdue (needed_date is before today and not processed)
    const overdue = pending.filter(r => {
      const needed = new Date(r.needed_date);
      return needed < today;
    });

    // Processed this week (would come from your actual processed data)
    const processedThisWeek = 0; // Replace with actual count

    const totalValue = pending.reduce((sum, r) => sum + r.total, 0);

    return {
      pendingReview: pending.length,
      dueThisWeek: dueThisWeek.length,
      overdue: overdue.length,
      processedThisWeek,
      totalItems,
      totalValue,
      classesThisWeek: 4
    };
  }, [requisitions]);

  // Calendar logic
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    const days = [];
    // Empty cells for days before month starts
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }
    // Days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };

  const getClassesForDay = (day) => {
    if (!day) return [];
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const dayOfWeek = date.getDay();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return classSchedule.filter(c => c.day === dayNames[dayOfWeek]);
  };

  const navigateMonth = (direction) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  const isToday = (day) => {
    if (!day) return false;
    const today = new Date();
    return day === today.getDate() && 
           currentDate.getMonth() === today.getMonth() && 
           currentDate.getFullYear() === today.getFullYear();
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const upcomingRequisitions = requisitions
    .filter(r => r.status === 'pending' || r.status === 'submitted')
    .sort((a, b) => new Date(a.needed_date) - new Date(b.needed_date))
    .slice(0, 6);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gray-800 text-white px-6 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">ToqueWorks</h1>
            <p className="text-gray-300 text-sm">Lab Requisition Management</p>
          </div>
          <div className="text-right text-gray-300">
            {formatDate(new Date())}
          </div>
        </div>
      </header>

      <main className="p-6">
        {/* Stat Cards - Primary Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          {/* Pending Review */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
            <div className="flex items-start justify-between">
              <div className="p-2 bg-amber-50 rounded-lg">
                <FileText className="w-5 h-5 text-amber-600" />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-3xl font-bold text-gray-900">{stats.pendingReview}</p>
              <p className="text-sm text-gray-500 uppercase tracking-wide">Pending Review</p>
            </div>
          </div>

          {/* Due This Week */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
            <div className="flex items-start justify-between">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-3xl font-bold text-gray-900">{stats.dueThisWeek}</p>
              <p className="text-sm text-gray-500 uppercase tracking-wide">Due This Week</p>
            </div>
          </div>

          {/* Overdue */}
          <div className={`rounded-xl p-5 shadow-sm border ${stats.overdue > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'}`}>
            <div className="flex items-start justify-between">
              <div className={`p-2 rounded-lg ${stats.overdue > 0 ? 'bg-red-100' : 'bg-gray-50'}`}>
                <AlertTriangle className={`w-5 h-5 ${stats.overdue > 0 ? 'text-red-600' : 'text-gray-400'}`} />
              </div>
            </div>
            <div className="mt-3">
              <p className={`text-3xl font-bold ${stats.overdue > 0 ? 'text-red-600' : 'text-gray-900'}`}>{stats.overdue}</p>
              <p className={`text-sm uppercase tracking-wide ${stats.overdue > 0 ? 'text-red-600' : 'text-gray-500'}`}>Overdue</p>
            </div>
          </div>

          {/* Processed This Week */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
            <div className="flex items-start justify-between">
              <div className="p-2 bg-green-50 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-3xl font-bold text-gray-900">{stats.processedThisWeek}</p>
              <p className="text-sm text-gray-500 uppercase tracking-wide">Processed This Week</p>
            </div>
          </div>

          {/* Total Items */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
            <div className="flex items-start justify-between">
              <div className="p-2 bg-purple-50 rounded-lg">
                <Package className="w-5 h-5 text-purple-600" />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-3xl font-bold text-gray-900">{stats.totalItems}</p>
              <p className="text-sm text-gray-500 uppercase tracking-wide">Total Items</p>
            </div>
          </div>
        </div>

        {/* Secondary Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Classes This Week */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 flex items-center gap-4">
            <div className="p-3 bg-indigo-50 rounded-lg">
              <Calendar className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.classesThisWeek}</p>
              <p className="text-sm text-gray-500">Classes This Week</p>
            </div>
          </div>

          {/* Total Requisitions Value */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 flex items-center gap-4">
            <div className="p-3 bg-emerald-50 rounded-lg">
              <DollarSign className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">${stats.totalValue.toFixed(2)}</p>
              <p className="text-sm text-gray-500">Total Pending Value</p>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between px-6 py-4 bg-gray-800 rounded-t-xl">
              <button 
                onClick={() => navigateMonth(-1)}
                className="p-1 hover:bg-gray-700 rounded text-white"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h2 className="text-lg font-semibold text-white">
                {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h2>
              <button 
                onClick={() => navigateMonth(1)}
                className="p-1 hover:bg-gray-700 rounded text-white"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4">
              {/* Day Headers */}
              <div className="grid grid-cols-7 mb-2">
                {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
                  <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
                    {day}
                  </div>
                ))}
              </div>
              
              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1">
                {getDaysInMonth(currentDate).map((day, index) => (
                  <div 
                    key={index} 
                    className={`min-h-[80px] p-1 border border-gray-100 rounded ${
                      day ? 'bg-white' : 'bg-gray-50'
                    }`}
                  >
                    {day && (
                      <>
                        <span className={`text-sm font-medium ${
                          isToday(day) 
                            ? 'bg-amber-500 text-white w-6 h-6 rounded-full flex items-center justify-center' 
                            : 'text-gray-700'
                        }`}>
                          {day}
                        </span>
                        <div className="mt-1 space-y-1">
                          {getClassesForDay(day).map((cls, i) => (
                            <div 
                              key={i}
                              className={`text-xs px-1 py-0.5 rounded truncate ${cls.color}`}
                            >
                              {cls.code}
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>

              {/* Legend */}
              <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-amber-100 rounded"></div>
                  <span className="text-xs text-gray-600">Classes</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-100 rounded"></div>
                  <span className="text-xs text-gray-600">Catering Events</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-800 mb-4">QUICK ACTIONS</h3>
              <div className="space-y-2">
                <button className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium transition-colors">
                  Review Consolidated Orders
                </button>
                <button className="w-full py-2.5 px-4 bg-white hover:bg-gray-50 text-gray-700 rounded-lg font-medium border border-gray-200 transition-colors">
                  View All Requisitions
                </button>
                <button className="w-full py-2.5 px-4 bg-white hover:bg-gray-50 text-gray-700 rounded-lg font-medium border border-gray-200 transition-colors">
                  Manage Ingredients
                </button>
                <button className="w-full py-2.5 px-4 bg-white hover:bg-gray-50 text-gray-700 rounded-lg font-medium border border-gray-200 transition-colors">
                  Catering Events
                </button>
              </div>
            </div>

            {/* Upcoming */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-800">UPCOMING</h3>
              </div>
              <div className="divide-y divide-gray-100">
                {upcomingRequisitions.map(req => (
                  <div key={req.id} className="px-5 py-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-800">{req.class_code} - {req.instructor}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(req.needed_date).toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </p>
                    </div>
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                      req.status === 'pending' 
                        ? 'bg-amber-100 text-amber-700' 
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {req.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
