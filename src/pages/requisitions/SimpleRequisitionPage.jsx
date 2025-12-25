import React, { useState, useEffect } from 'react';
import { ingredientsList, getBestPrice, getItemPrice } from '../../data/ingredients/ingredientsList';
import { orderManager, vendorConfig } from '../../utils/orders/orderManagement';

export default function SimpleRequisitionPage() {
  const [selectedVendor, setSelectedVendor] = useState('merit');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [cart, setCart] = useState([]);
  const [course, setCourse] = useState('CUL-130');
  const [week, setWeek] = useState('Week 1');
  const [notes, setNotes] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [orderName, setOrderName] = useState('');
  const [savedOrders, setSavedOrders] = useState([]);

  const categories = ['ALL', ...new Set(ingredientsList.map(item => item.category))];

  useEffect(() => {
    loadSavedOrders();
  }, []);

  const loadSavedOrders = () => {
    setSavedOrders(orderManager.getAllOrders());
  };

  const filteredItems = selectedCategory === 'ALL' 
    ? ingredientsList 
    : ingredientsList.filter(item => item.category === selectedCategory);

  const addToCart = (item) => {
    const existingIndex = cart.findIndex(c => c.id === item.id);
    
    if (existingIndex >= 0) {
      const newCart = [...cart];
      newCart[existingIndex].quantity += 1;
      setCart(newCart);
    } else {
      const price = item.vendors[selectedVendor]?.price || getItemPrice(item);
      const code = item.vendors[selectedVendor]?.code || item.id;
      
      setCart([...cart, {
        id: item.id,
        name: item.name,
        unit: item.unit,
        quantity: 1,
        price: price,
        code: code,
        category: item.category
      }]);
    }
  };

  const updateQuantity = (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      setCart(cart.filter(item => item.id !== itemId));
    } else {
      setCart(cart.map(item => 
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      ));
    }
  };

  const calculateSubtotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const calculateTax = () => {
    return calculateSubtotal() * 0.09;
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  const handleSaveOrder = () => {
    if (!orderName.trim()) {
      alert('Please enter an order name');
      return;
    }

    const orderData = {
      name: orderName,
      vendor: selectedVendor,
      course: course,
      week: week,
      items: cart,
      subtotal: calculateSubtotal(),
      tax: calculateTax(),
      total: calculateTotal(),
      notes: notes
    };

    orderManager.createOrder(orderData);
    setShowSaveModal(false);
    setOrderName('');
    loadSavedOrders();
    
    alert('Order saved successfully!');
  };

  const handleLoadOrder = (orderId) => {
    const order = orderManager.getOrder(orderId);
    if (order) {
      setSelectedVendor(order.vendor);
      setCourse(order.course);
      setWeek(order.week);
      setCart(order.items);
      setNotes(order.notes || '');
      
      alert('Order loaded successfully!');
    }
  };

  const handleDeleteOrder = (orderId) => {
    if (window.confirm('Are you sure you want to delete this order?')) {
      orderManager.deleteOrder(orderId);
      loadSavedOrders();
    }
  };

  const handleNewOrder = () => {
    setCart([]);
    setNotes('');
    setCourse('CUL-130');
    setWeek('Week 1');
  };

  const exportToCSV = () => {
    let csv = `${vendorConfig[selectedVendor].name} Requisition\n`;
    csv += `Course: ${course}, ${week}\n`;
    csv += `Date: ${new Date().toLocaleDateString()}\n\n`;
    csv += 'Code,Item,Unit,Qty,Price,Total\n';
    
    cart.forEach(item => {
      const total = (item.price * item.quantity).toFixed(2);
      csv += `${item.code},"${item.name}",${item.unit},${item.quantity},$${item.price.toFixed(2)},$${total}\n`;
    });
    
    csv += `\n,,,Subtotal,,$${calculateSubtotal().toFixed(2)}\n`;
    csv += `,,,Tax (9%),,$${calculateTax().toFixed(2)}\n`;
    csv += `,,,Total,,$${calculateTotal().toFixed(2)}\n`;
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `requisition_${selectedVendor}_${Date.now()}.csv`;
    a.click();
  };

  const getBestPriceComparison = (item) => {
    const prices = Object.entries(item.vendors).map(([vendor, data]) => ({
      vendor,
      price: data.price,
      name: vendorConfig[vendor].name
    })).sort((a, b) => a.price - b.price);

    return prices[0];
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Lab Requisition</h1>
        <p className="text-gray-600">Select items and generate vendor orders</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Vendor</label>
            <select 
              value={selectedVendor}
              onChange={(e) => setSelectedVendor(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
            >
              <option value="sysco">Sysco</option>
              <option value="shamrock">Shamrock Foods</option>
              <option value="merit">Merit ⭐ Best Prices</option>
              <option value="peddlers">Peddlers</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Course</label>
            <select 
              value={course}
              onChange={(e) => setCourse(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
            >
              <option value="CUL-130">CUL 130 - Savory Cuisine</option>
              <option value="CUL-140">CUL 140 - Baking & Pastry</option>
              <option value="CUL-160">CUL 160 - Advanced Techniques</option>
              <option value="CUL-180">CUL 180 - Restaurant Ops</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Week</label>
            <select 
              value={week}
              onChange={(e) => setWeek(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
            >
              {[1,2,3,4,5,6,7,8].map(w => (
                <option key={w} value={`Week ${w}`}>Week {w}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleNewOrder}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            New Order
          </button>
          <button
            onClick={() => setShowSaveModal(true)}
            disabled={cart.length === 0}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
          >
            Save Order
          </button>
          <button
            onClick={exportToCSV}
            disabled={cart.length === 0}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            Export CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Available Items</h2>
          
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {filteredItems.map(item => {
              const best = getBestPriceComparison(item);
              const currentPrice = item.vendors[selectedVendor].price;
              const savings = currentPrice > best.price ? currentPrice - best.price : 0;
              
              return (
                <div 
                  key={item.id}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="font-medium">{item.name}</div>
                    <div className="text-sm text-gray-500">
                      {item.unit} • ${currentPrice.toFixed(2)}
                      {savings > 0 && (
                        <span className="text-red-600 ml-2">
                          (+${savings.toFixed(2)} vs {best.name})
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => addToCart(item)}
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                  >
                    Add
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Requisition Cart</h2>
          
          {cart.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              Cart is empty. Add items to begin.
            </div>
          ) : (
            <>
              <div className="space-y-3 mb-6 max-h-[400px] overflow-y-auto">
                {cart.map(item => (
                  <div key={item.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-gray-500">{item.code} • ${item.price.toFixed(2)}/{item.unit}</div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-8 h-8 flex items-center justify-center bg-gray-200 rounded hover:bg-gray-300"
                      >
                        -
                      </button>
                      <span className="w-12 text-center font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-8 h-8 flex items-center justify-center bg-gray-200 rounded hover:bg-gray-300"
                      >
                        +
                      </button>
                    </div>
                    
                    <div className="w-24 text-right font-medium">
                      ${(item.price * item.quantity).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">${calculateSubtotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax (9%):</span>
                  <span className="font-medium">${calculateTax().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total:</span>
                  <span className="text-orange-600">${calculateTotal().toFixed(2)}</span>
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Order Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  placeholder="Special instructions, delivery preferences, etc."
                />
              </div>
            </>
          )}
        </div>
      </div>

      {savedOrders.length > 0 && (
        <div className="mt-6 bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Saved Orders</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {savedOrders.map(order => (
              <div key={order.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-semibold">{order.name}</div>
                    <div className="text-sm text-gray-600">
                      {vendorConfig[order.vendor].name}
                    </div>
                  </div>
                  <span className="px-2 py-1 text-xs bg-gray-100 rounded">
                    {order.status}
                  </span>
                </div>
                
                <div className="text-sm text-gray-600 mb-3">
                  <div>{order.course} • {order.week}</div>
                  <div>{order.items.length} items • ${order.total.toFixed(2)}</div>
                  <div className="text-xs text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => handleLoadOrder(order.id)}
                    className="flex-1 px-3 py-1 bg-orange-600 text-white text-sm rounded hover:bg-orange-700"
                  >
                    Load
                  </button>
                  <button
                    onClick={() => handleDeleteOrder(order.id)}
                    className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showSaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold mb-4">Save Order</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Order Name</label>
              <input
                type="text"
                value={orderName}
                onChange={(e) => setOrderName(e.target.value)}
                placeholder="e.g., Week 1 - Monday Prep"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              />
            </div>
            
            <div className="text-sm text-gray-600 mb-4">
              <div>Vendor: {vendorConfig[selectedVendor].name}</div>
              <div>Items: {cart.length}</div>
              <div>Total: ${calculateTotal().toFixed(2)}</div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowSaveModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveOrder}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
