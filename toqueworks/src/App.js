import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import InstructorRequisitionPage from './pages/requisitions/InstructorRequisitionPage';
import ManagementConsolidatedPage from './pages/requisitions/ManagementConsolidatedPage';
import VendorComparisonPage from './pages/requisitions/VendorComparisonPage';
import ProductDetailPage from './pages/requisitions/ProductDetailPage';
import RequisitionImportContainer from './components/RequisitionImportContainer';
import { bakingIngredientsList, savoryIngredientsList } from './data/ingredients/ingredientsList';

const vendors = [
  { id: 'sysco', name: 'Sysco' },
  { id: 'shamrock', name: 'Shamrock Foods' },
  { id: 'merit', name: 'Merit' },
  { id: 'peddlers', name: "Peddler's Son" }
];

function Navigation({ role, onRoleChange }) {
  const location = useLocation();
  
  const instructorNav = [
    { path: '/instructor/requisition', label: 'Create Requisition' },
    { path: '/import', label: 'Import JSON' }
  ];

  const managerNav = [
    { path: '/management/consolidated', label: 'Consolidated Orders' },
    { path: '/management/compare', label: 'Compare Vendors' }
  ];

  const navItems = role === 'manager' ? managerNav : instructorNav;

  return (
    <nav style={{backgroundColor: 'white', borderBottom: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.1)'}}>
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img 
              src="/pcc-logo.png" 
              alt="Pima Community College" 
              style={{height: '56px'}}
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
            <div style={{borderLeft: '3px solid #2563eb', paddingLeft: '16px'}}>
              <h1 className="text-lg font-bold text-gray-900">Lab Requisition System</h1>
              <p className="text-xs text-gray-600">Culinary Arts and Baking & Pastry Arts</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex gap-2">
              {navItems.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    textDecoration: 'none',
                    backgroundColor: location.pathname === item.path ? '#2563eb' : 'transparent',
                    color: location.pathname === item.path ? 'white' : '#374151',
                  }}
                  onMouseOver={(e) => {
                    if (location.pathname !== item.path) {
                      e.target.style.backgroundColor = '#f3f4f6';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (location.pathname !== item.path) {
                      e.target.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            <div className="flex gap-2 text-sm" style={{borderLeft: '1px solid #e5e7eb', paddingLeft: '24px'}}>
              <button
                onClick={() => onRoleChange('instructor')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: '500',
                  backgroundColor: role === 'instructor' ? '#2563eb' : '#e5e7eb',
                  color: role === 'instructor' ? 'white' : '#374151',
                  cursor: 'pointer'
                }}
              >
                Instructor View
              </button>
              <button
                onClick={() => onRoleChange('manager')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: '500',
                  backgroundColor: role === 'manager' ? '#2563eb' : '#e5e7eb',
                  color: role === 'manager' ? 'white' : '#374151',
                  cursor: 'pointer'
                }}
              >
                Management View
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

function App() {
  const [role, setRole] = useState('instructor');
  
  const initialIngredients = [...bakingIngredientsList, ...savoryIngredientsList].map(ing => ({
    ...ing,
    primaryVendorId: 'sysco',
    apCost: ing.unitPrice,
    yieldPercent: 100,
    purchaseUnit: ing.unit
  }));
  
  const [ingredients, setIngredients] = useState(initialIngredients);
  const [importKey, setImportKey] = useState(0);

  const handleUpdateIngredients = (updates) => {
    console.log('Updating ingredients with:', updates);
    
    const newIngredients = Object.entries(updates).map(([ingredientName, data]) => {
      const newId = `IMPORT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      return {
        id: newId,
        name: ingredientName,
        category: 'IMPORTED',
        primaryVendorId: data.vendorId,
        apCost: parseFloat(data.apCost) || 0,
        yieldPercent: parseFloat(data.yieldPercent) || 100,
        purchaseUnit: data.purchaseUnit || 'lb',
        unit: data.purchaseUnit || 'lb',
        unitPrice: parseFloat(data.apCost) || 0,
        syscoCode: '',
        vendorItemCode: data.vendorItemCode || ''
      };
    });

    setIngredients(prev => [...prev, ...newIngredients]);
    setImportKey(prev => prev + 1);
    
    console.log('New ingredients added:', newIngredients);
    console.log('Total ingredients now:', ingredients.length + newIngredients.length);
    
    alert(`✅ Successfully added ${newIngredients.length} new ingredient(s) to database!`);
  };

  const handleCreateRequisitions = (requisitions) => {
    console.log('Creating requisitions:', requisitions);
    alert(`✅ Successfully imported ${requisitions.length} requisition(s)!`);
  };

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navigation role={role} onRoleChange={setRole} />
        <Routes>
          <Route path="/" element={<Navigate to="/instructor/requisition" replace />} />
          <Route path="/instructor/requisition" element={<InstructorRequisitionPage />} />
          <Route 
            path="/import" 
            element={
              <RequisitionImportContainer 
                key={importKey}
                ingredients={ingredients} 
                vendors={vendors}
                onUpdateIngredients={handleUpdateIngredients}
                onCreateRequisitions={handleCreateRequisitions}
              />
            } 
          />
          <Route path="/management/consolidated" element={<ManagementConsolidatedPage />} />
          <Route path="/management/compare" element={<VendorComparisonPage />} />
          <Route path="/product/:pccStock" element={<ProductDetailPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
