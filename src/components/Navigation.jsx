import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';

const Icons = {
  Dashboard: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
    </svg>
  ),
  Order: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  Inventory: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  ),
  Menu: () => (
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
  ChevronDown: () => (
    <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  ),
  Hamburger: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  ),
  Close: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  External: () => (
    <svg className="w-3 h-3 ml-1 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  ),
};

function NavDropdown({ label, icon: Icon, items, isActive }) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
          isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        }`}
      >
        <Icon />
        <span>{label}</span>
        <Icons.ChevronDown />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
          {items.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `block px-4 py-2 text-sm transition-colors ${
                  isActive ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700 hover:bg-gray-50'
                }`
              }
            >
              <div className="flex items-center justify-between">
                <span>{item.label}</span>
                {item.external && <Icons.External />}
              </div>
              {item.description && <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}

function MobileMenu({ isOpen, onClose, navGroups }) {
  const location = useLocation();
  useEffect(() => { onClose(); }, [location, onClose]);
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="fixed inset-0 bg-black/30" onClick={onClose} />
      <div className="fixed inset-y-0 left-0 w-72 bg-white shadow-xl">
        <div className="flex items-center justify-between p-4 border-b">
          <span className="font-semibold text-gray-800">Menu</span>
          <button onClick={onClose} className="p-1 text-gray-500 hover:text-gray-700"><Icons.Close /></button>
        </div>
        <nav className="p-4 space-y-6 overflow-y-auto max-h-[calc(100vh-64px)]">
          {navGroups.map((group) => (
            <div key={group.label}>
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                <group.icon />{group.label}
              </div>
              <div className="space-y-1">
                {group.items.map((item) => (
                  <NavLink key={item.path} to={item.path}
                    className={({ isActive }) =>
                      `block px-3 py-2 text-sm rounded-md transition-colors ${
                        isActive ? 'bg-blue-100 text-blue-700 font-medium' : 'text-gray-700 hover:bg-gray-100'
                      }`
                    }
                  >
                    <div className="flex items-center justify-between">
                      <span>{item.label}</span>
                      {item.external && <Icons.External />}
                    </div>
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </div>
    </div>
  );
}

function Breadcrumbs() {
  const location = useLocation();
  const breadcrumbMap = {
    '/inventory': 'Inventory', '/inventory/count': 'Count', '/inventory/locations': 'Locations',
    '/inventory/expiring': 'Expiring', '/inventory/history': 'History',
  };
  if (!location.pathname.startsWith('/inventory/')) return null;
  const pathParts = location.pathname.split('/').filter(Boolean);
  const crumbs = [];
  let currentPath = '';
  for (const part of pathParts) {
    currentPath += `/${part}`;
    const label = breadcrumbMap[currentPath];
    if (label) crumbs.push({ path: currentPath, label });
  }
  if (crumbs.length <= 1) return null;

  return (
    <div className="bg-gray-50 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-6 py-2">
        <nav className="flex items-center text-sm text-gray-500">
          {crumbs.map((crumb, idx) => (
            <React.Fragment key={crumb.path}>
              {idx > 0 && <span className="mx-2">/</span>}
              {idx === crumbs.length - 1 ? (
                <span className="text-gray-900 font-medium">{crumb.label}</span>
              ) : (
                <NavLink to={crumb.path} className="hover:text-blue-600">{crumb.label}</NavLink>
              )}
            </React.Fragment>
          ))}
        </nav>
      </div>
    </div>
  );
}

export default function Navigation() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  if (location.pathname === '/instructor') return null;

  const navGroups = [
    { label: 'Ordering', icon: Icons.Order, items: [
      { path: '/create', label: 'New Requisition', description: 'Create a new lab requisition' },
      { path: '/requisitions/instructor', label: 'Instructor View', description: 'Preview instructor interface' },
      { path: '/requisitions', label: 'Archive', description: 'View past requisitions' },
      { path: '/consolidated', label: 'Consolidated Order', description: 'Group orders by vendor' },
      { path: '/pull-list', label: 'Pull List', description: 'Generate pull lists' },
    ]},
    { label: 'Inventory', icon: Icons.Inventory, items: [
      { path: '/inventory', label: 'Dashboard', description: 'Inventory overview' },
      { path: '/inventory/count', label: 'Count', description: 'Physical inventory count' },
      { path: '/inventory/locations', label: 'Locations', description: 'Storage locations' },
      { path: '/inventory/expiring', label: 'Expiring', description: 'Items expiring soon' },
      { path: '/inventory/history', label: 'History', description: 'Inventory changes' },
    ]},
    { label: 'Menu', icon: Icons.Menu, items: [
      { path: '/menu', label: 'Menu Management', description: 'Recipes, packages, BEOs' },
      { path: '/public-menu', label: 'Public Menu', description: 'Customer-facing menu', external: true },
    ]},
    { label: 'Admin', icon: Icons.Settings, items: [
      { path: '/ingredients', label: 'Ingredients', description: 'Manage ingredient database' },
      { path: '/settings', label: 'Settings', description: 'Instructors, classes, vendors' },
    ]},
  ];

  const isGroupActive = (group) => group.items.some((item) => 
    item.path === '/inventory' ? location.pathname === '/inventory' : location.pathname.startsWith(item.path)
  );

  return (
    <>
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 sm:gap-6">
              <img src="/pcc-logo.png" alt="Pima Community College" className="h-10 sm:h-14" />
              <div className="border-l-4 border-blue-600 pl-4 sm:pl-6">
                <h1 className="text-lg sm:text-2xl font-bold text-gray-800">ToqueWorks</h1>
                <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">Culinary Arts & Baking and Pastry Arts</p>
              </div>
            </div>
            <button onClick={() => setMobileMenuOpen(true)} className="lg:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md">
              <Icons.Hamburger />
            </button>
          </div>
        </div>
      </header>
      <nav className="bg-white border-b border-gray-200 hidden lg:block">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center gap-1">
            <NavLink to="/" className={({ isActive }) =>
              `flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`
            }>
              <Icons.Dashboard /><span>Dashboard</span>
            </NavLink>
            {navGroups.map((group) => (
              <NavDropdown key={group.label} label={group.label} icon={group.icon} items={group.items} isActive={isGroupActive(group)} />
            ))}
          </div>
        </div>
      </nav>
      <Breadcrumbs />
      <MobileMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)}
        navGroups={[{ label: 'Main', icon: Icons.Dashboard, items: [{ path: '/', label: 'Dashboard' }] }, ...navGroups]} />
    </>
  );
}
