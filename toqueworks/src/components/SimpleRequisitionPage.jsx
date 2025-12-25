import React, { useState, useMemo } from 'react';
import { getVendorCatalog } from '../data/vendorManagement';
import { getInstructors, addInstructor } from '../data/instructors';

function SimpleRequisitionPage() {
  const [instructor, setInstructor] = useState('');
  const [showAddInstructor, setShowAddInstructor] = useState(false);
  const [newInstructorName, setNewInstructorName] = useState('');
  const [requisitionName, setRequisitionName] = useState('');
  const [week, setWeek] = useState('');
  const [className, setClassName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedItems, setSelectedItems] = useState({});
  const [quantities, setQuantities] = useState({});
  const [customLines, setCustomLines] = useState([
    { id: 'custom-1', description: '', quantity: '', unit: '', price: '' },
    { id: 'custom-2', description: '', quantity: '', unit: '', price: '' },
    { id: 'custom-3', description: '', quantity: '', unit: '', price: '' }
  ]);
  
  const instructors = getInstructors();
  const catalog = getVendorCatalog();
  const categories = [...new Set(catalog.map(item => item.category))];
  
  const weeks = Array.from({ length: 16 }, (_, i) => `Week ${i + 1}`);
  const classes = ['CUL 105', 'CUL 110', 'CUL 111', 'CUL 140', 'CUL 150', 'CUL 160'];
  
  const filteredCatalog = selectedCategory === 'All' 
    ? catalog 
    : catalog.filter(item => item.category === selectedCategory);

  const orderItems = useMemo(() => {
    return Object.keys(selectedItems)
      .filter(id => selectedItems[id] && quantities[id] > 0)
      .map(id => {
        const item = catalog.find(i => i.id === id);
        const quantity = quantities[id];
        return {
          ...item,
          quantity,
          totalCost: quantity * item.unitPrice
        };
      });
  }, [selectedItems, quantities, catalog]);

  const customItemsTotal = customLines.reduce((sum, line) => {
    const qty = parseFloat(line.quantity) || 0;
    const price = parseFloat(line.price) || 0;
    return sum + (qty * price);
  }, 0);

  const totalCost = orderItems.reduce((sum, item) => sum + item.totalCost, 0) + customItemsTotal;

  const handleAddInstructor = () => {
    if (newInstructorName.trim()) {
      addInstructor(newInstructorName.trim());
      setInstructor(newInstructorName.trim());
      setNewInstructorName('');
      setShowAddInstructor(false);
    }
  };

  const handleToggleItem = (id) => {
    setSelectedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleQuantityChange = (id, qty) => {
    setQuantities(prev => ({ ...prev, [id]: qty }));
    if (qty > 0 && !selectedItems[id]) {
      setSelectedItems(prev => ({ ...prev, [id]: true }));
    }
  };

  const handleCustomLineChange = (index, field, value) => {
    const updated = [...customLines];
    updated[index][field] = value;
    setCustomLines(updated);
  };

  const canGenerate = instructor && week && className && (orderItems.length > 0 || customLines.some(l => l.description));

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white border-b-4 border-blue-600 shadow">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900">SHAMROCK FOODS REQUISITION</h1>
          <p className="text-sm text-gray-600">ToqueWorks Culinary Education Platform</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6">
        {/* Form Header */}
        <div className="bg-white rounded border-2 border-gray-300 shadow-sm mb-4">
          <div className="bg-gray-100 border-b-2 border-gray-300 px-6 py-3">
            <h2 className="font-bold text-lg text-gray-900">REQUISITION INFORMATION</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Instructor</label>
                <select
                  value={instructor}
                  onChange={(e) => setInstructor(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-gray-400 rounded text-sm"
                >
                  <option value="">Select...</option>
                  {instructors.map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
                {!showAddInstructor && (
                  <button
                    onClick={() => setShowAddInstructor(true)}
                    className="text-xs text-blue-600 hover:underline mt-1"
                  >
                    + Add Name
                  </button>
                )}
                {showAddInstructor && (
                  <div className="mt-2">
                    <input
                      type="text"
                      value={newInstructorName}
                      onChange={(e) => setNewInstructorName(e.target.value)}
                      placeholder="Your name"
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm mb-1"
                      onKeyPress={(e) => e.key === 'Enter' && handleAddInstructor()}
                    />
                    <button
                      onClick={handleAddInstructor}
                      className="text-xs px-2 py-1 bg-blue-600 text-white rounded"
                    >
                      Add
                    </button>
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Class</label>
                <select
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-gray-400 rounded text-sm"
                >
                  <option value="">Select...</option>
                  {classes.map(cls => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Week</label>
                <select
                  value={week}
                  onChange={(e) => setWeek(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-gray-400 rounded text-sm"
                >
                  <option value="">Select...</option>
                  {weeks.map(wk => (
                    <option key={wk} value={wk}>{wk}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Lab Name</label>
                <input
                  type="text"
                  value={requisitionName}
                  onChange={(e) => setRequisitionName(e.target.value)}
                  placeholder="e.g., Quick Breads"
                  className="w-full px-3 py-2 border-2 border-gray-400 rounded text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="bg-white border-2 border-gray-300 rounded mb-4">
          <div className="flex border-b-2 border-gray-300">
            <button
              onClick={() => setSelectedCategory('All')}
              className={`px-6 py-2 font-semibold text-sm border-r-2 border-gray-300 ${
                selectedCategory === 'All' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              ALL ITEMS
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-6 py-2 font-semibold text-sm border-r-2 border-gray-300 ${
                  selectedCategory === cat ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Items Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-200 border-b-2 border-gray-400">
                <tr>
                  <th className="w-12 px-3 py-2 text-xs font-bold text-left border-r border-gray-300">☑</th>
                  <th className="px-3 py-2 text-xs font-bold text-left border-r border-gray-300">ITEM DESCRIPTION</th>
                  <th className="px-3 py-2 text-xs font-bold text-left border-r border-gray-300 w-32">CODE</th>
                  <th className="px-3 py-2 text-xs font-bold text-right border-r border-gray-300 w-28">QTY</th>
                  <th className="px-3 py-2 text-xs font-bold text-left border-r border-gray-300 w-24">UNIT</th>
                  <th className="px-3 py-2 text-xs font-bold text-right border-r border-gray-300 w-24">PRICE</th>
                  <th className="px-3 py-2 text-xs font-bold text-right w-28">TOTAL</th>
                </tr>
              </thead>
              <tbody>
                {filteredCatalog.map((item, idx) => {
                  const isChecked = selectedItems[item.id];
                  const quantity = quantities[item.id] || '';
                  const itemTotal = quantity ? quantity * item.unitPrice : 0;

                  return (
                    <tr
                      key={item.id}
                      className={`border-b border-gray-200 ${isChecked ? 'bg-blue-50' : idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                    >
                      <td className="px-3 py-2 border-r border-gray-200 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked || false}
                          onChange={() => handleToggleItem(item.id)}
                          className="w-4 h-4"
                        />
                      </td>
                      <td className="px-3 py-2 border-r border-gray-200 text-sm">{item.name}</td>
                      <td className="px-3 py-2 border-r border-gray-200 text-xs text-gray-600">{item.shamrockCode}</td>
                      <td className="px-3 py-2 border-r border-gray-200">
                        <input
                          type="number"
                          value={quantity}
                          onChange={(e) => handleQuantityChange(item.id, parseFloat(e.target.value) || 0)}
                          placeholder="0"
                          step="0.25"
                          disabled={!isChecked}
                          className={`w-full px-2 py-1 text-right text-sm border rounded ${
                            isChecked ? 'border-gray-400 bg-white' : 'bg-gray-100 border-gray-200'
                          }`}
                        />
                      </td>
                      <td className="px-3 py-2 border-r border-gray-200 text-sm text-gray-700">{item.unit}</td>
                      <td className="px-3 py-2 border-r border-gray-200 text-sm text-right text-gray-700">${item.unitPrice.toFixed(2)}</td>
                      <td className="px-3 py-2 text-sm text-right font-semibold">
                        {itemTotal > 0 ? `$${itemTotal.toFixed(2)}` : '—'}
                      </td>
                    </tr>
                  );
                })}

                {/* Custom Entry Lines */}
                <tr className="bg-yellow-50 border-t-4 border-yellow-400">
                  <td colSpan="7" className="px-3 py-2 text-xs font-bold text-gray-700">
                    MANUAL ENTRIES (Items not in catalog)
                  </td>
                </tr>
                {customLines.map((line, idx) => (
                  <tr key={line.id} className="bg-yellow-50 border-b border-gray-300">
                    <td className="px-3 py-2 border-r border-gray-200 text-center text-xs text-gray-500">{idx + 1}</td>
                    <td className="px-3 py-2 border-r border-gray-200">
                      <input
                        type="text"
                        value={line.description}
                        onChange={(e) => handleCustomLineChange(idx, 'description', e.target.value)}
                        placeholder="Enter item description..."
                        className="w-full px-2 py-1 text-sm border border-gray-400 rounded"
                      />
                    </td>
                    <td className="px-3 py-2 border-r border-gray-200">
                      <input
                        type="text"
                        value={line.code || ''}
                        onChange={(e) => handleCustomLineChange(idx, 'code', e.target.value)}
                        placeholder="Code"
                        className="w-full px-2 py-1 text-xs border border-gray-400 rounded"
                      />
                    </td>
                    <td className="px-3 py-2 border-r border-gray-200">
                      <input
                        type="number"
                        value={line.quantity}
                        onChange={(e) => handleCustomLineChange(idx, 'quantity', e.target.value)}
                        placeholder="0"
                        step="0.25"
                        className="w-full px-2 py-1 text-right text-sm border border-gray-400 rounded"
                      />
                    </td>
                    <td className="px-3 py-2 border-r border-gray-200">
                      <input
                        type="text"
                        value={line.unit}
                        onChange={(e) => handleCustomLineChange(idx, 'unit', e.target.value)}
                        placeholder="unit"
                        className="w-full px-2 py-1 text-sm border border-gray-400 rounded"
                      />
                    </td>
                    <td className="px-3 py-2 border-r border-gray-200">
                      <input
                        type="number"
                        value={line.price}
                        onChange={(e) => handleCustomLineChange(idx, 'price', e.target.value)}
                        placeholder="0.00"
                        step="0.01"
                        className="w-full px-2 py-1 text-right text-sm border border-gray-400 rounded"
                      />
                    </td>
                    <td className="px-3 py-2 text-sm text-right font-semibold">
                      {line.quantity && line.price ? `$${(parseFloat(line.quantity) * parseFloat(line.price)).toFixed(2)}` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Total and Submit */}
        <div className="bg-white border-2 border-gray-300 rounded shadow-sm">
          <div className="flex items-center justify-between p-6 border-b-2 border-gray-300">
            <div className="text-sm text-gray-700">
              <div>Instructor: <span className="font-semibold">{instructor || '—'}</span></div>
              <div>Class: <span className="font-semibold">{className || '—'}</span> | Week: <span className="font-semibold">{week || '—'}</span></div>
              <div>Lab: <span className="font-semibold">{requisitionName || '—'}</span></div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600 mb-1">TOTAL COST</div>
              <div className="text-4xl font-bold text-gray-900">${totalCost.toFixed(2)}</div>
            </div>
          </div>
          <div className="p-6">
            <button
              disabled={!canGenerate}
              className={`w-full py-4 rounded font-bold text-xl ${
                canGenerate 
                  ? 'bg-green-600 text-white hover:bg-green-700 shadow-lg' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {canGenerate ? '✓ SUBMIT REQUISITION' : '⚠ COMPLETE ALL REQUIRED FIELDS'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default SimpleRequisitionPage;
