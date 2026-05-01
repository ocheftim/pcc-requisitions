import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, useNavigate, useLocation } from 'react-router-dom';

// Pages - Core
import DashboardPage from './pages/DashboardPage';
import TemplatesPage from './pages/requisitions/TemplatesPage';
import IngredientsPage from './pages/requisitions/IngredientsPage';
import SettingsPage from './pages/requisitions/SettingsPage';
import StandardizedRecipePage from './pages/requisitions/StandardizedRecipePage';

// Pages - Requisitions
import InstructorRequisitionPage from './pages/requisitions/InstructorRequisitionPage';
import RequisitionsPage from './pages/requisitions/RequisitionsPage';
import BudgetReportPage from './pages/requisitions/BudgetReportPage';
import PrintRequisitionPage from './pages/requisitions/PrintRequisitionPage';

// Pages - Orders (includes Confirmations)
import OrdersPage from './pages/requisitions/OrdersPage';

// Pages - Pull Lists
import PullListPage from './pages/requisitions/PullListPage';
import ImportPage from './pages/requisitions/ImportPage';

// Pages - Catering
import CateringEventsPage from './pages/requisitions/CateringEventsPage';
import CateringEventDetail from './pages/requisitions/CateringEventDetail';
import CateringConsolidationsPage from './pages/requisitions/CateringConsolidationsPage';
import CateringConsolidationDetail from './pages/requisitions/CateringConsolidationDetail';

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
  Truck: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
    </svg>
  ),
  Clipboard: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
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
  Settings: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
};

// Navigation Component
function Navigation() {
  const location = useLocation();

  const navLinkClass = (isActive, color = 'blue') => {
    const colors = {
      blue: isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100',
      purple: isActive ? 'bg-purple-100 text-purple-700' : 'text-gray-600 hover:bg-gray-100',
    };
    return `flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md transition-colors ${colors[color]}`;
  };

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center gap-6">
          <img src="/pcc-logo.png" alt="Pima Community College" className="h-14" />
          <div className="border-l-4 border-blue-600 pl-6">
            <h1 className="text-2xl font-bold text-gray-800">Lab Requisitions</h1>
            <p className="text-sm text-gray-600">Lab Requisition System</p>
          </div>
        </div>
      </div>
      
      <div className="bg-gray-50 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center gap-1 py-2">
            {/* Dashboard */}
            <NavLink to="/" end className={({ isActive }) => navLinkClass(isActive)}>
              <Icons.Dashboard /><span>Dashboard</span>
            </NavLink>

            {/* Requisitions - single page with internal tabs */}
            <NavLink 
              to="/requisitions" 
              className={({ isActive }) => navLinkClass(isActive || location.pathname.startsWith('/requisitions'))}
            >
              <Icons.Requisition /><span>Requisitions</span>
            </NavLink>

            {/* Orders - single page with internal tabs (includes Confirmations) */}
            <NavLink 
              to="/orders" 
              className={({ isActive }) => navLinkClass(isActive)}
            >
              <Icons.Truck /><span>Orders</span>
            </NavLink>

            {/* Pull Lists - elevated to main nav */}
            <NavLink to="/pull-lists" className={({ isActive }) => navLinkClass(isActive)}>
              <Icons.Clipboard /><span>Pull Lists</span>
            </NavLink>

            {/* Catering */}
            <NavLink to="/catering" className={({ isActive }) => navLinkClass(isActive, 'purple')}>
              <Icons.Catering /><span>Catering</span></NavLink>

            <NavLink to="/import" className={({ isActive }) => navLinkClass(isActive)}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg><span>Import</span>
            </NavLink>

            <div className="flex-1" />

            {/* Right side - reference/settings */}
            <NavLink to="/ingredients" className={({ isActive }) => navLinkClass(isActive)}>
              <Icons.Ingredient /><span>Ingredients</span>
            </NavLink>

            <NavLink to="/recipes" className={({ isActive }) => navLinkClass(isActive)}>
              <Icons.Recipe /><span>Recipes</span>
            </NavLink>

            <NavLink to="/settings" className={({ isActive }) => navLinkClass(isActive)}>
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
          {/* Dashboard */}
          <Route path="/" element={<DashboardPage />} />
          
          {/* Requisitions - main page with tabs */}
          <Route path="/requisitions" element={<RequisitionsPage />} />
          <Route path="/reports/budget" element={<BudgetReportPage />} />
          <Route path="/requisitions/new" element={<InstructorRequisitionPage />} />
          <Route path="/requisitions/edit/:id" element={<InstructorRequisitionPage />} />
          <Route path="/requisitions/print/:id" element={<PrintRequisitionPage />} />
          
          {/* Orders - includes Build, Pending, Sent, Confirmations tabs */}
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/orders/:tab" element={<OrdersPage />} />
          
          {/* Pull Lists */}
          <Route path="/pull-lists" element={<PullListPage />} />
          
          {/* Catering */}
          <Route path="/catering" element={<CateringEventsPage />} />
          <Route path="/catering/consolidations" element={<CateringConsolidationsPage />} />
          <Route path="/catering/consolidations/:consolidationId" element={<CateringConsolidationDetail />} />
          <Route path="/catering/:eventId" element={<CateringEventDetail />} />
          <Route path="/import" element={<ImportPage />} />
          
          {/* Reference/Config */}
          <Route path="/ingredients" element={<IngredientsPage />} />
          <Route path="/templates" element={<TemplatesPage />} />
          <Route path="/recipes" element={<StandardizedRecipePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          
          {/* Legacy redirects */}
          <Route path="/create" element={<InstructorRequisitionPage />} />
          <Route path="/confirmations" element={<OrdersPage />} />
          <Route path="/pull-list" element={<PullListPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
// This won't work - need to edit the file directly
