import React, { useState, useEffect } from 'react';
import { loginInstructor, changeInstructorPassword, getInstructorRequisitions, getInstructorUsers } from '../../lib/supabase';

export default function InstructorLoginPage() {
  const [step, setStep] = useState('login');
  const [name, setName] = useState('')
  const [instructors, setInstructors] = useState([]);
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [instructor, setInstructor] = useState(null);
  const [requisitions, setRequisitions] = useState([]);
  const [pointsEarned, setPointsEarned] = useState(0);
  const [showPointsAnimation, setShowPointsAnimation] = useState(false);

  // Days before class date that changes are locked
  const CHANGE_DEADLINE_DAYS = 7;

  useEffect(() => {
    const loadInstructors = async () => {
      const users = await getInstructorUsers();
      setInstructors(users);
    };
    loadInstructors();

    const saved = localStorage.getItem('instructor_session');
    if (saved) {
      const data = JSON.parse(saved);
      setInstructor(data);
      setStep('dashboard');
      loadRequisitions(data.name);
    }
  }, []);

  const loadRequisitions = async (instructorName) => {
    const reqs = await getInstructorRequisitions(instructorName);
    setRequisitions(reqs);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    const result = await loginInstructor(name, password);
    if (result.error) { setError(result.error); return; }
    setInstructor(result.instructor);
    setPointsEarned(result.pointsEarned);
    if (result.pointsEarned > 0) {
      setShowPointsAnimation(true);
      setTimeout(() => setShowPointsAnimation(false), 3000);
    }
    if (result.mustChangePassword) {
      setStep('changePassword');
    } else {
      localStorage.setItem('instructor_session', JSON.stringify(result.instructor));
      setStep('dashboard');
      loadRequisitions(result.instructor.name);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError('');
    if (newPassword.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (newPassword !== confirmPassword) { setError('Passwords do not match'); return; }
    const { error } = await changeInstructorPassword(instructor.id, newPassword);
    if (error) { setError('Failed to change password'); return; }
    const updatedInstructor = { ...instructor, must_change_password: false };
    localStorage.setItem('instructor_session', JSON.stringify(updatedInstructor));
    setInstructor(updatedInstructor);
    setStep('dashboard');
    loadRequisitions(updatedInstructor.name);
  };

  const handleLogout = () => {
    localStorage.removeItem('instructor_session');
    setInstructor(null);
    setStep('login');
    setName('');
    setPassword('');
  };

  // Calculate total cost from items
  const calculateTotal = (items) => {
    if (!items) return 0;
    const itemsArray = Array.isArray(items) ? items : Object.values(items);
    return itemsArray.reduce((sum, item) => sum + (parseFloat(item.extended) || parseFloat(item.totalCost) || parseFloat(item.total) || 0), 0);
  };

  // Calculate days until deadline
  const getDaysUntilDeadline = (classDate) => {
    const deadline = new Date(classDate);
    deadline.setDate(deadline.getDate() - CHANGE_DEADLINE_DAYS);
    const today = new Date();
    const diffTime = deadline - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Format instructor name with "Chef" prefix
  const formatChefName = (name) => {
    if (!name) return '';
    if (name.toLowerCase().startsWith('chef ')) return name;
    return `Chef ${name}`;
  };

  const pendingReqs = requisitions.filter(r => r.status === 'pending');
  const submittedReqs = requisitions.filter(r => r.status === 'submitted');
  const approvedReqs = requisitions.filter(r => r.status === 'approved');

  if (step === 'login') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <img src="/pcc-logo.png" alt="PCC" className="h-16 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-800">Instructor Portal</h1>
            <p className="text-gray-500">Lab Requisition System</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <select value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" required>
                <option value="">Select Instructor</option>
                {instructors.map(inst => (<option key={inst.id} value={inst.name}>{inst.name}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" required />
            </div>
            {error && <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm">{error}</div>}
            <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors">Sign In</button>
          </form>
          <p className="text-center text-xs text-gray-400 mt-6">First time? Use lastname2026 as password</p>
        </div>
      </div>
    );
  }

  if (step === 'changePassword') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4"><span className="text-3xl">🔐</span></div>
            <h1 className="text-2xl font-bold text-gray-800">Change Password</h1>
            <p className="text-gray-500">Please set a new password to continue</p>
          </div>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="At least 6 characters" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm your password" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" required />
            </div>
            {error && <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm">{error}</div>}
            <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors">Set New Password</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {showPointsAnimation && (
        <div className="fixed top-20 right-8 bg-yellow-400 text-yellow-900 px-6 py-3 rounded-full shadow-lg animate-bounce z-50">
          <span className="text-2xl mr-2">⭐</span><span className="font-bold">+{pointsEarned} points!</span>
        </div>
      )}
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <img src="/pcc-logo.png" alt="PCC" className="h-12" />
              <div className="border-l-4 border-blue-600 pl-4">
                <h1 className="text-xl font-bold text-gray-800">Lab Requisition Portal</h1>
                <p className="text-sm text-gray-500">{instructor?.program || 'Culinary Arts'}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="font-medium text-gray-800">{formatChefName(instructor?.name)}</p>
                <p className="text-sm text-yellow-600">⭐ {instructor?.login_points || 0} points • 🔥 {instructor?.login_streak || 0} day streak</p>
              </div>
              <button onClick={handleLogout} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Sign Out</button>
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white mb-8 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold mb-1">Welcome back, {formatChefName(instructor?.name)}!</h2>
            <p className="text-blue-100">
              {pendingReqs.length > 0 && <span className="mr-3">{pendingReqs.length} needs review</span>}
              {submittedReqs.length > 0 && <span className="mr-3">{submittedReqs.length} awaiting manager</span>}
              {approvedReqs.length > 0 && <span>{approvedReqs.length} approved</span>}
              {requisitions.length === 0 && 'No requisitions yet'}
            </p>
          </div>
          <a href="/instructor" className="bg-white text-blue-600 px-6 py-3 rounded-xl font-medium hover:bg-blue-50 transition-colors flex items-center gap-2">
            <span className="text-xl">+</span>New Requisition
          </a>
        </div>
        
        {instructor?.notes_from_admin && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
            <h3 className="font-bold text-yellow-800 mb-1">📝 Message from Program Manager</h3>
            <p className="text-yellow-700">{instructor.notes_from_admin}</p>
          </div>
        )}

        {/* Status Legend */}
        <div className="flex gap-4 mb-4 text-sm">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-yellow-400"></span> Needs Your Review</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-blue-400"></span> Awaiting Manager Approval</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-400"></span> Approved</span>
        </div>

        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="px-6 py-4 border-b bg-gray-50">
            <h3 className="font-bold text-gray-800">Your Requisitions ({requisitions.length})</h3>
          </div>
          {requisitions.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-gray-500 mb-4">No requisitions yet</p>
              <a href="/instructor" className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700">Create Your First Requisition</a>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Class Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Course</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Week / Topic</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Budget</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Deadline</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {requisitions.map(req => {
                    const total = calculateTotal(req.items);
                    const budget = parseFloat(req.budget) || 0;
                    const isOverBudget = budget > 0 && total > budget;
                    const daysLeft = getDaysUntilDeadline(req.class_date);
                    const canEdit = req.status === 'pending' && daysLeft > 0;
                    
                    return (
                      <tr key={req.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 text-sm text-gray-800">
                          {new Date(req.class_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </td>
                        <td className="px-4 py-4"><span className="font-medium text-gray-800">{req.course}</span></td>
                        <td className="px-4 py-4 text-sm text-gray-600">{req.week || '-'}</td>
                        <td className="px-4 py-4">
                          <div className={`text-sm font-medium ${isOverBudget ? 'text-red-600' : 'text-green-600'}`}>
                            ${total.toFixed(2)}
                            {budget > 0 && (
                              <span className="text-gray-400 font-normal"> / ${budget.toFixed(2)}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            req.status === 'approved' ? 'bg-green-100 text-green-700' : 
                            req.status === 'submitted' ? 'bg-blue-100 text-blue-700' : 
                            req.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {req.status === 'pending' ? 'Needs Review' : 
                             req.status === 'submitted' ? 'Awaiting Manager' : 
                             req.status}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm">
                          {daysLeft > 0 ? (
                            <span className={`${daysLeft <= 3 ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                              {daysLeft} days left
                            </span>
                          ) : (
                            <span className="text-gray-400">Locked</span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-right">
                          <a 
                            href={`/instructor?${canEdit ? 'edit' : 'view'}=${req.id}`} 
                            className={`font-medium text-sm ${canEdit ? 'text-blue-600 hover:text-blue-800' : 'text-gray-500 hover:text-gray-700'}`}
                          >
                            {canEdit ? 'Review' : 'View'}
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        {/* Workflow Info */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="font-bold text-blue-800 mb-3">Requisition Workflow</h3>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-yellow-400 text-white flex items-center justify-center font-bold">1</span>
              <span className="text-gray-700">Review & Submit</span>
            </div>
            <span className="text-gray-400">→</span>
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-blue-400 text-white flex items-center justify-center font-bold">2</span>
              <span className="text-gray-700">Manager Approval</span>
            </div>
            <span className="text-gray-400">→</span>
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-green-400 text-white flex items-center justify-center font-bold">3</span>
              <span className="text-gray-700">Approved & Ordered</span>
            </div>
          </div>
          <p className="text-xs text-blue-600 mt-3">Changes must be made at least {CHANGE_DEADLINE_DAYS} days before class date.</p>
        </div>
      </main>
    </div>
  );
}
