import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, useNavigate, useLocation } from 'react-router-dom';

// Pages - Core
import DashboardPage from './pages/DashboardPage';
import IngredientsPage from './pages/requisitions/IngredientsPage';
import SettingsPage from './pages/requisitions/SettingsPage';
import StandardizedRecipePage from './pages/requisitions/StandardizedRecipePage';

// Pages - Requisitions
import InstructorRequisitionPage from './pages/requisitions/InstructorRequisitionPage';
import MyRequisitionsPage from './pages/requisitions/MyRequisitionsPage';
import PullListPage from './pages/requisitions/PullListPage';
import PrintRequisitionPage from './pages/requisitions/PrintRequisitionPage';
import ConfirmationTracker from './pages/requisitions/ConfirmationTracker';
import SmartOrderPage from './pages/requisitions/SmartOrderPage';
import IngredientRulesPage from './pages/requisitions/IngredientRulesPage';

// Pages - Catering
import CateringEventsPage from './pages/requisitions/CateringEventsPage';
import CateringEventDetail from './pages/requisitions/CateringEventDetail';

// Icons
const Icons = {
  Dashboard: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
    </svg>
  ),
  Requisition: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  Clipboard: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  ),
  Truck: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
    </svg>
  ),
  Catering: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.701 2.701 0 00-1.5-.454M9 6v2m3-2v2m3-2v2M9 3h.01M12 3h.01M15 3h.01M21 21v-7a2 2 0 00-2-2H5a2 2 0 00-2 2v7h18zm-3-9v-2a2 2 0 00-2-2H8a2 2 0 00-2 2v2h12z" />
    </svg>
  ),
  Ingredient: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
    </svg>
  ),
  Recipe: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  ),
  Rules: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
    </svg>
  ),
  Settings: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  ChevronDown: () => (
    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  ),
};

// Dropdown Component
function NavDropdown({ label, icon: Icon, items, isActive }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleNav = (path) => {
    navigate(path);
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
          isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
        }`}
      >
        <Icon />
        <span>{label}</span>
        <Icons.ChevronDown />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
          {items.map((item) => (
            <button
              key={item.path}
              onClick={() => handleNav(item.path)}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700"
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Navigation Component
function Navigation() {
  const location = useLocation();
  
  const isReqActive = ['/create', '/requisitions', '/pull-list'].some(p => location.pathname.startsWith(p));

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center gap-6">
          <img src="/pcc-logo.png" alt="Pima Community College" className="h-14" />
          <div className="border-l-4 border-blue-600 pl-6">
            <h1 className="text-2xl font-bold text-gray-800">ToqueWorks</h1>
            <p className="text-sm text-gray-600">Lab Requisition System</p>
          </div>
        </div>
      </div>
      
      <div className="bg-gray-50 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center gap-1 py-2">
            <NavLink to="/" end className={({ isActive }) => `flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md transition-colors ${isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}>
              <Icons.Dashboard /><span>Dashboard</span>
            </NavLink>

            <NavDropdown label="Requisitions" icon={Icons.Requisition} isActive={isReqActive} items={[
              { path: '/create', label: '+ New Requisition' },
              { path: '/requisitions', label: 'All Requisitions' },
              { path: '/pull-list', label: 'Pull Lists' },
            ]} />

            <NavLink to="/confirmations" className={({ isActive }) => `flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md transition-colors ${isActive ? 'bg-green-100 text-green-700' : 'text-gray-600 hover:bg-gray-100'}`}>
              <Icons.Clipboard /><span>Confirmations</span>
            </NavLink>

            <NavLink to="/orders" className={({ isActive }) => `flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md transition-colors ${isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}>
              <Icons.Truck /><span>Orders</span>
            </NavLink>

            <NavLink to="/catering" className={({ isActive }) => `flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md transition-colors ${isActive ? 'bg-purple-100 text-purple-700' : 'text-gray-600 hover:bg-gray-100'}`}>
              <Icons.Catering /><span>Catering</span>
            </NavLink>

            <div className="flex-1" />

            <NavLink to="/ingredients" className={({ isActive }) => `flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md transition-colors ${isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}>
              <Icons.Ingredient /><span>Ingredients</span>
            </NavLink>

            <NavLink to="/ingredient-rules" className={({ isActive }) => `flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md transition-colors ${isActive ? 'bg-orange-100 text-orange-700' : 'text-gray-600 hover:bg-gray-100'}`}>
              <Icons.Rules /><span>Rules</span>
            </NavLink>

            <NavLink to="/recipes" className={({ isActive }) => `flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md transition-colors ${isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}>
              <Icons.Recipe /><span>Recipes</span>
            </NavLink>

            <NavLink to="/settings" className={({ isActive }) => `flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md transition-colors ${isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}>
              <Icons.Settings /><span>Settings</span>
            </NavLink>
          </div>
        </div>
      </div>
    </header>
  );
}

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <Navigation />
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/create" element={<InstructorRequisitionPage />} />
          <Route path="/requisitions" element={<MyRequisitionsPage />} />
          <Route path="/requisitions/edit/:id" element={<InstructorRequisitionPage />} />
          <Route path="/pull-list" element={<PullListPage />} />
          <Route path="/print" element={<PrintRequisitionPage />} />
          <Route path="/confirmations" element={<ConfirmationTracker />} />
          <Route path="/orders" element={<SmartOrderPage />} />
          <Route path="/catering" element={<CateringEventsPage />} />
          <Route path="/catering/:eventId" element={<CateringEventDetail />} />
          <Route path="/ingredients" element={<IngredientsPage />} />
          <Route path="/ingredient-rules" element={<IngredientRulesPage />} />
          <Route path="/recipes" element={<StandardizedRecipePage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
