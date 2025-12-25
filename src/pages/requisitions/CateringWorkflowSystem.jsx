import React, { useState, useEffect } from 'react';
import { Calendar, Users, MapPin, DollarSign, FileText, Download, Check, Send, Clock } from 'lucide-react';

const CateringWorkflowSystem = () => {
  const [view, setView] = useState('list');
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [packages, setPackages] = useState([]);
  const [ingredients, setIngredients] = useState([]);

  const [quoteForm, setQuoteForm] = useState({
    clientName: '', clientEmail: '', clientPhone: '', eventName: '',
    eventDate: '', eventTime: '', endTime: '', location: '', guestCount: 30,
    selectedPackage: null, selectedItems: [], specialRequests: '',
    dietaryNotes: '', setupNotes: '', status: 'draft', isInternal: false,
    serviceFee: 0, deliveryFee: 0
  });

  useEffect(() => { loadData(); }, []);

  const loadData = () => {
    const savedEvents = JSON.parse(localStorage.getItem('catering_events') || '[]');
    const savedMenuItems = JSON.parse(localStorage.getItem('menuItems') || '[]');
    const savedPackages = JSON.parse(localStorage.getItem('menuPackages') || '[]');
    const savedIngredients = JSON.parse(localStorage.getItem('ingredients') || '[]');
    setEvents(savedEvents);
    setMenuItems(savedMenuItems);
    setPackages(savedPackages);
    setIngredients(savedIngredients);
  };

  const saveEvents = (updatedEvents) => {
    localStorage.setItem('catering_events', JSON.stringify(updatedEvents));
    setEvents(updatedEvents);
  };

  const formatPhoneNumber = (phone) => {
    if (!phone) return '';
    const cleaned = ('' + phone).replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      return '(' + match[1] + ') ' + match[2] + '-' + match[3];
    }
    return phone;
  };

  const calculateEventTotal = (event) => {
    let subtotal = 0;
    if (event.selectedPackage) {
      const pkg = packages.find(p => p.id === event.selectedPackage);
      if (pkg) subtotal += pkg.pricePerPerson * event.guestCount;
    }
    event.selectedItems?.forEach(item => {
      const menuItem = menuItems.find(m => m.id === item.id);
      if (menuItem) {
        const quantity = item.quantity || event.guestCount;
        subtotal += menuItem.menu_price * quantity;
      }
    });
    const serviceFee = event.serviceFee || 0;
    const deliveryFee = event.deliveryFee || 0;
    const total = subtotal + serviceFee + deliveryFee;
    return { subtotal, serviceFee, deliveryFee, total };
  };

  const generateShoppingList = (event) => {
    const shoppingList = {};
    const collectIngredients = (itemIngredients, multiplier = 1) => {
      itemIngredients?.forEach(ing => {
        const ingredient = ingredients.find(i => i.id === ing.ingredientId);
        if (ingredient) {
          const key = ingredient.id;
          if (!shoppingList[key]) {
            shoppingList[key] = { ...ingredient, totalQuantity: 0, sources: [] };
          }
          shoppingList[key].totalQuantity += ing.quantity * multiplier;
          shoppingList[key].sources.push({ item: itemIngredients.name || 'Component', quantity: ing.quantity * multiplier });
        }
      });
    };
    if (event.selectedPackage) {
      const pkg = packages.find(p => p.id === event.selectedPackage);
      if (pkg) {
        pkg.items?.forEach(pkgItem => {
          const item = menuItems.find(m => m.id === pkgItem.id);
          if (item) collectIngredients(item.ingredients, pkgItem.quantity || event.guestCount);
        });
      }
    }
    event.selectedItems?.forEach(selectedItem => {
      const item = menuItems.find(m => m.id === selectedItem.id);
      if (item) collectIngredients(item.ingredients, selectedItem.quantity || event.guestCount);
    });
    const byVendor = {};
    Object.values(shoppingList).forEach(item => {
      const vendor = item.vendor || 'Other';
      if (!byVendor[vendor]) byVendor[vendor] = [];
      byVendor[vendor].push(item);
    });
    return { items: Object.values(shoppingList), byVendor };
  };

  const StatusBadge = ({ status }) => {
    const colors = {
      draft: 'bg-gray-200 text-gray-700', sent: 'bg-blue-200 text-blue-700',
      approved: 'bg-green-200 text-green-700', contract_sent: 'bg-yellow-200 text-yellow-700',
      signed: 'bg-green-500 text-white', paid: 'bg-green-600 text-white'
    };
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${colors[status] || colors.draft}`}>
        {status.replace(/_/g, ' ').toUpperCase()}
      </span>
    );
  };

  const createQuote = () => {
    const newEvent = {
      id: `EVENT-${Date.now()}`, ...quoteForm, createdDate: new Date().toISOString(),
      status: 'draft', quoteValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    };
    const updatedEvents = [...events, newEvent];
    saveEvents(updatedEvents);
    setSelectedEvent(newEvent);
    setView('list');
    alert('Quote saved successfully!');
  };

  const sendToAdobeSign = (event) => {
    const updatedEvents = events.map(e => 
      e.id === event.id ? { ...e, status: 'contract_sent', contractSentDate: new Date().toISOString() } : e
    );
    saveEvents(updatedEvents);
    alert('Contract sent via Adobe Sign!\n(API integration pending)');
  };

  const updateEventStatus = (eventId, newStatus) => {
    const updatedEvents = events.map(e => 
      e.id === eventId ? { ...e, status: newStatus, lastUpdated: new Date().toISOString() } : e
    );
    saveEvents(updatedEvents);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-blue-800">Catering Workflow</h1>
              <p className="text-gray-600 mt-1">Quote → Contract → BEO → Invoice</p>
            </div>
            <button
              onClick={() => {
                setQuoteForm({
                  clientName: '', clientEmail: '', clientPhone: '', eventName: '',
                  eventDate: '', eventTime: '', endTime: '', location: '', guestCount: 30,
                  selectedPackage: null, selectedItems: [], specialRequests: '',
                  dietaryNotes: '', setupNotes: '', status: 'draft', isInternal: false,
                  serviceFee: 0, deliveryFee: 0
                });
                setSelectedEvent(null);
                setView('quote');
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <FileText size={20} />
              New Quote
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="flex border-b">
            {['list', 'quote', 'contract', 'beo', 'invoice'].map(tab => (
              <button
                key={tab}
                onClick={() => setView(tab)}
                disabled={tab !== 'list' && tab !== 'quote' && !selectedEvent}
                className={`px-6 py-3 font-medium ${
                  view === tab ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'
                } ${tab !== 'list' && tab !== 'quote' && !selectedEvent ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {tab === 'beo' ? 'BEO' : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {view === 'list' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">All Events</h2>
            {events.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <FileText size={48} className="mx-auto mb-4 opacity-30" />
                <p>No events yet. Create your first quote to get started.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {events.map(event => {
                  const pricing = calculateEventTotal(event);
                  return (
                    <div key={event.id} className="border rounded-lg p-4 hover:border-blue-500 cursor-pointer"
                      onClick={() => { setSelectedEvent(event); setQuoteForm(event); }}>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-bold text-lg">{event.eventName}</h3>
                            <StatusBadge status={event.status} />
                            {event.isInternal && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">INTERNAL</span>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                            <div className="flex items-center gap-2"><Users size={16} />{event.guestCount} guests</div>
                            <div className="flex items-center gap-2"><Calendar size={16} />{event.eventDate}</div>
                            <div className="flex items-center gap-2"><MapPin size={16} />{event.location}</div>
                            <div className="flex items-center gap-2"><DollarSign size={16} />${pricing.total.toFixed(2)}</div>
                          </div>
                          <p className="text-sm text-gray-500 mt-2">{event.clientName}</p>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={(e) => { e.stopPropagation(); setSelectedEvent(event); setView('contract'); }}
                            className="px-3 py-1 text-sm bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200">Contract</button>
                          <button onClick={(e) => { e.stopPropagation(); setSelectedEvent(event); setView('beo'); }}
                            className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200">BEO</button>
                          <button onClick={(e) => { e.stopPropagation(); setSelectedEvent(event); setView('invoice'); }}
                            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200">Invoice</button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {view === 'quote' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">{selectedEvent ? 'Edit Quote' : 'Create New Quote'}</h2>
            <div className="mb-6">
              <h3 className="font-semibold text-gray-700 mb-3">Client Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Client Name *</label>
                  <input type="text" value={quoteForm.clientName} onChange={(e) => setQuoteForm({ ...quoteForm, clientName: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input type="email" value={quoteForm.clientEmail} onChange={(e) => setQuoteForm({ ...quoteForm, clientEmail: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input type="tel" value={quoteForm.clientPhone} onChange={(e) => setQuoteForm({ ...quoteForm, clientPhone: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" 
                    placeholder="(520) 555-1234" /></div>
                <div className="flex items-center">
                  <label className="flex items-center text-sm font-medium text-gray-700">
                    <input type="checkbox" checked={quoteForm.isInternal} onChange={(e) => setQuoteForm({ ...quoteForm, isInternal: e.target.checked })} className="mr-2" />
                    Internal Client (Pay 10 days advance)</label></div>
              </div>
            </div>
            <div className="mb-6">
              <h3 className="font-semibold text-gray-700 mb-3">Event Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Event Name *</label>
                  <input type="text" value={quoteForm.eventName} onChange={(e) => setQuoteForm({ ...quoteForm, eventName: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Guest Count *</label>
                  <input type="number" value={quoteForm.guestCount} onChange={(e) => setQuoteForm({ ...quoteForm, guestCount: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Event Date *</label>
                  <input type="date" value={quoteForm.eventDate} onChange={(e) => setQuoteForm({ ...quoteForm, eventDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Event Time</label>
                  <input type="time" value={quoteForm.eventTime} onChange={(e) => setQuoteForm({ ...quoteForm, eventTime: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" /></div>
                <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input type="text" value={quoteForm.location} onChange={(e) => setQuoteForm({ ...quoteForm, location: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" /></div>
              </div>
            </div>
            <div className="mb-6">
              <h3 className="font-semibold text-gray-700 mb-3">Menu Selection</h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Package (Optional)</label>
                <select value={quoteForm.selectedPackage || ''} onChange={(e) => setQuoteForm({ ...quoteForm, selectedPackage: e.target.value || null })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                  <option value="">No Package - À la carte</option>
                  {packages.map(pkg => (<option key={pkg.id} value={pkg.id}>{pkg.name} - ${pkg.pricePerPerson}/person</option>))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Add Individual Items</label>
                <div className="border rounded-lg p-4 max-h-96 overflow-y-auto">
                  {menuItems.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No menu items available.</p>
                  ) : (
                    <div className="space-y-2">
                      {menuItems.map(item => {
                        const isSelected = quoteForm.selectedItems.find(i => i.id === item.id);
                        return (
                          <div key={item.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                            <div className="flex-1">
                              <span className="font-medium">{item.name}</span>
                              <span className="text-sm text-gray-500 ml-2">{item.category}</span>
                              <span className="text-sm text-green-600 ml-2">${item.menu_price?.toFixed(2) || '0.00'}</span>
                            </div>
                            <button onClick={() => {
                                if (isSelected) {
                                  setQuoteForm({ ...quoteForm, selectedItems: quoteForm.selectedItems.filter(i => i.id !== item.id) });
                                } else {
                                  setQuoteForm({ ...quoteForm, selectedItems: [...quoteForm.selectedItems, { id: item.id, quantity: quoteForm.guestCount }] });
                                }
                              }}
                              className={`px-3 py-1 rounded text-sm ${isSelected ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                              {isSelected ? '✓ Added' : 'Add'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-gray-700 mb-3">Pricing Summary</h3>
              {(() => {
                const pricing = calculateEventTotal(quoteForm);
                return (
                  <div className="space-y-2">
                    <div className="flex justify-between"><span>Subtotal:</span><span>${pricing.subtotal.toFixed(2)}</span></div>
                    <div className="flex justify-between text-gray-600"><span>Service Fee:</span><span>N/C</span></div>
                    <div className="flex justify-between font-bold text-lg pt-2 border-t"><span>Total:</span><span>${pricing.total.toFixed(2)}</span></div>
                    {quoteForm.isInternal && <p className="text-sm text-blue-700 pt-2">Payment due 10 days before event date</p>}
                  </div>
                );
              })()}
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setView('list')} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={createQuote} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                <Check size={20} />Save Quote</button>
            </div>
          </div>
        )}

        {view === 'contract' && selectedEvent && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="mb-6 pb-4 border-b">
              <div className="flex justify-between items-start">
                <div>
                  <img src="/pcc-logo.png" alt="Pima Community College" className="h-16 mb-2" />
                  <h3 className="text-2xl font-bold text-blue-800">CATERING CONTRACT</h3>
                  <p className="text-sm text-gray-600">Culinary Arts & Baking Programs</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Contract #: {selectedEvent.id}</p>
                  <p className="text-sm text-gray-600">Date: {new Date().toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            <div className="mb-6 grid grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2">Client Information:</h4>
                <p>{selectedEvent.clientName}</p>
                <p className="text-sm text-gray-600">{selectedEvent.clientEmail}</p>
                <p className="text-sm text-gray-600">{formatPhoneNumber(selectedEvent.clientPhone)}</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Event Details:</h4>
                <p>{selectedEvent.eventName}</p>
                <p className="text-sm text-gray-600">{selectedEvent.eventDate} at {selectedEvent.eventTime}</p>
                <p className="text-sm text-gray-600">{selectedEvent.location}</p>
                <p className="text-sm text-gray-600">{selectedEvent.guestCount} guests</p>
              </div>
            </div>

            <div className="mb-6">
              <h4 className="font-semibold mb-3">Menu</h4>
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="text-left px-4 py-2">Description</th>
                    <th className="text-right px-4 py-2">Quantity</th>
                    <th className="text-right px-4 py-2">Price</th>
                    <th className="text-right px-4 py-2">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedEvent.selectedPackage && (() => {
                    const pkg = packages.find(p => p.id === selectedEvent.selectedPackage);
                    return pkg ? (
                      <tr className="border-t">
                        <td className="px-4 py-2">{pkg.name}</td>
                        <td className="px-4 py-2 text-right">{selectedEvent.guestCount}</td>
                        <td className="px-4 py-2 text-right">${pkg.pricePerPerson.toFixed(2)}</td>
                        <td className="px-4 py-2 text-right">${(pkg.pricePerPerson * selectedEvent.guestCount).toFixed(2)}</td>
                      </tr>
                    ) : null;
                  })()}
                  {selectedEvent.selectedItems?.map(item => {
                    const menuItem = menuItems.find(m => m.id === item.id);
                    if (!menuItem) return null;
                    const qty = item.quantity || selectedEvent.guestCount;
                    return (
                      <tr key={item.id} className="border-t">
                        <td className="px-4 py-2">{menuItem.name}</td>
                        <td className="px-4 py-2 text-right">{qty}</td>
                        <td className="px-4 py-2 text-right">${menuItem.menu_price.toFixed(2)}</td>
                        <td className="px-4 py-2 text-right">${(menuItem.menu_price * qty).toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {(selectedEvent.specialRequests || selectedEvent.dietaryNotes) && (
              <div className="mb-6">
                <h4 className="font-semibold mb-2">Special Requirements</h4>
                <div className="border rounded-lg p-4 bg-yellow-50">
                  {selectedEvent.specialRequests && <p className="text-sm"><strong>Special Requests:</strong> {selectedEvent.specialRequests}</p>}
                  {selectedEvent.dietaryNotes && <p className="text-sm"><strong>Dietary Notes:</strong> {selectedEvent.dietaryNotes}</p>}
                </div>
              </div>
            )}

            <div className="ml-auto max-w-sm space-y-2 mb-6">
              {(() => {
                const pricing = calculateEventTotal(selectedEvent);
                return (
                  <>
                    <div className="flex justify-between"><span>Subtotal:</span><span>${pricing.subtotal.toFixed(2)}</span></div>
                    <div className="flex justify-between text-gray-600"><span>Service Fee:</span><span>N/C</span></div>
                    <div className="flex justify-between text-gray-600"><span>Delivery Fee:</span><span>N/C</span></div>
                    <div className="flex justify-between text-gray-600"><span>Sales Tax:</span><span>N/C</span></div>
                    <div className="flex justify-between font-bold text-xl pt-2 border-t">
                      <span>Total Due:</span><span>${pricing.total.toFixed(2)}</span>
                    </div>
                  </>
                );
              })()}
            </div>

            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold mb-2">Payment Terms</h4>
              {selectedEvent.isInternal ? (
                <p className="text-sm">Full payment due <strong>{new Date(new Date(selectedEvent.eventDate).getTime() - 10 * 24 * 60 * 60 * 1000).toLocaleDateString()}</strong> (10 days before event)</p>
              ) : (
                <p className="text-sm">Payment due by event date: <strong>{new Date(selectedEvent.eventDate).toLocaleDateString()}</strong></p>
              )}
            </div>

            <div className="mb-6">
              <h4 className="font-semibold mb-2">Terms & Conditions</h4>
              <div className="text-sm space-y-2 text-gray-700">
                <p>• Cancellations must be made at least 72 hours before the event</p>
                <p>• Final guest count must be confirmed 48 hours before the event</p>
                <p>• Client provides adequate space and access for setup</p>
                <p>• All equipment, tables, and linens provided by client unless otherwise arranged</p>
              </div>
            </div>

            <div className="border-t pt-6 mt-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="font-semibold mb-2">Client Signature:</p>
                  <div className="border-b-2 border-gray-400 pt-8"></div>
                  <p className="text-sm text-gray-600 mt-1">Date: _______________</p>
                </div>
                <div>
                  <p className="font-semibold mb-2">PCC Representative:</p>
                  <div className="border-b-2 border-gray-400 pt-8"></div>
                  <p className="text-sm text-gray-600 mt-1">Date: _______________</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-6">
              <button onClick={() => setView('list')} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Back</button>
              <button onClick={() => alert('Contract PDF would download here')}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2">
                <Download size={20} />Download PDF</button>
              <button onClick={() => sendToAdobeSign(selectedEvent)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                <Send size={20} />Send via Adobe Sign</button>
            </div>
          </div>
        )}

        {view === 'beo' && selectedEvent && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="mb-6 pb-4 border-b">
              <div className="flex justify-between items-start">
                <div>
                  <img src="/pcc-logo.png" alt="Pima Community College" className="h-16 mb-2" />
                  <h3 className="text-2xl font-bold text-blue-800">BANQUET EVENT ORDER</h3>
                  <p className="text-sm text-gray-600">Culinary Arts & Baking Programs</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">BEO #: {selectedEvent.id}</p>
                  <p className="text-sm text-gray-600">Date: {new Date().toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            {(() => {
              const shoppingList = generateShoppingList(selectedEvent);
              const pricing = calculateEventTotal(selectedEvent);
              return (
                <div>
                  <div className="mb-6 grid grid-cols-3 gap-4">
                    <div>
                      <h4 className="font-semibold mb-2">Event Information:</h4>
                      <p className="text-sm">{selectedEvent.eventName}</p>
                      <p className="text-sm text-gray-600">Client: {selectedEvent.clientName}</p>
                      <p className="text-sm text-gray-600">{formatPhoneNumber(selectedEvent.clientPhone)}</p>
                      <p className="text-sm text-gray-600">{selectedEvent.clientEmail}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Date & Time:</h4>
                      <p className="text-sm">Date: {selectedEvent.eventDate}</p>
                      <p className="text-sm">Service: {selectedEvent.eventTime}</p>
                      <p className="text-sm">Setup: 2 hours before</p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Details:</h4>
                      <p className="text-sm">Location: {selectedEvent.location}</p>
                      <p className="text-sm">Guests: {selectedEvent.guestCount}</p>
                      <p className="text-sm">Budget: ${pricing.total.toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="mb-6">
                    <h4 className="font-semibold mb-3">Menu Items</h4>
                    <table className="w-full">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="text-left px-4 py-2">Item</th>
                          <th className="text-right px-4 py-2">Quantity</th>
                          <th className="text-left px-4 py-2">Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedEvent.selectedPackage && (() => {
                          const pkg = packages.find(p => p.id === selectedEvent.selectedPackage);
                          return pkg?.items?.map((pkgItem, idx) => {
                            const menuItem = menuItems.find(m => m.id === pkgItem.id);
                            return menuItem ? (
                              <tr key={idx} className="border-t">
                                <td className="px-4 py-2">{menuItem.name}</td>
                                <td className="px-4 py-2 text-right">{selectedEvent.guestCount} servings</td>
                                <td className="px-4 py-2 text-sm text-gray-600">{menuItem.description || '-'}</td>
                              </tr>
                            ) : null;
                          });
                        })()}
                        {selectedEvent.selectedItems?.map(item => {
                          const menuItem = menuItems.find(m => m.id === item.id);
                          const qty = item.quantity || selectedEvent.guestCount;
                          return menuItem ? (
                            <tr key={item.id} className="border-t">
                              <td className="px-4 py-2">{menuItem.name}</td>
                              <td className="px-4 py-2 text-right">{qty} servings</td>
                              <td className="px-4 py-2 text-sm text-gray-600">{menuItem.description || '-'}</td>
                            </tr>
                          ) : null;
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="mb-6">
                    <h4 className="font-semibold mb-3">Shopping List by Vendor</h4>
                    {Object.keys(shoppingList.byVendor).length === 0 ? (
                      <p className="text-gray-500 text-center py-4">No ingredients found</p>
                    ) : (
                      Object.entries(shoppingList.byVendor).map(([vendor, items]) => (
                        <div key={vendor} className="mb-4">
                          <h5 className="font-medium text-blue-700 bg-blue-50 px-4 py-2 rounded mb-2">{vendor}</h5>
                          <table className="w-full text-sm">
                            <thead className="bg-gray-100">
                              <tr>
                                <th className="text-left px-3 py-2">Item</th>
                                <th className="text-left px-3 py-2">Code</th>
                                <th className="text-right px-3 py-2">Qty</th>
                                <th className="text-left px-3 py-2">Unit</th>
                                <th className="text-right px-3 py-2">Cost</th>
                              </tr>
                            </thead>
                            <tbody>
                              {items.map(item => (
                                <tr key={item.id} className="border-t">
                                  <td className="px-3 py-2">{item.name}</td>
                                  <td className="px-3 py-2 text-gray-600">{item.itemCode || '-'}</td>
                                  <td className="px-3 py-2 text-right">{item.totalQuantity.toFixed(2)}</td>
                                  <td className="px-3 py-2">{item.unit}</td>
                                  <td className="px-3 py-2 text-right">${((item.unitPrice || 0) * item.totalQuantity).toFixed(2)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="mb-6">
                    <h4 className="font-semibold mb-3">Timeline</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex gap-3">
                        <Clock size={16} className="mt-1 text-blue-600 flex-shrink-0" />
                        <div>
                          <p className="font-semibold">Day Before:</p>
                          <p className="text-gray-600">Purchase ingredients, prep cold items</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <Clock size={16} className="mt-1 text-blue-600 flex-shrink-0" />
                        <div>
                          <p className="font-semibold">Event Day - Setup (2 hours before):</p>
                          <p className="text-gray-600">Arrive, setup equipment, begin hot food prep</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <Clock size={16} className="mt-1 text-blue-600 flex-shrink-0" />
                        <div>
                          <p className="font-semibold">Service Time ({selectedEvent.eventTime}):</p>
                          <p className="text-gray-600">Final plating, service, monitoring</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <Clock size={16} className="mt-1 text-blue-600 flex-shrink-0" />
                        <div>
                          <p className="font-semibold">After Service:</p>
                          <p className="text-gray-600">Cleanup, breakdown, departure</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {(selectedEvent.specialRequests || selectedEvent.dietaryNotes) && (
                    <div className="mb-6">
                      <h4 className="font-semibold mb-2">Special Instructions</h4>
                      <div className="border rounded-lg p-4 bg-yellow-50 space-y-2 text-sm">
                        {selectedEvent.specialRequests && <p><strong>Special Requests:</strong> {selectedEvent.specialRequests}</p>}
                        {selectedEvent.dietaryNotes && <p><strong>Dietary Notes:</strong> {selectedEvent.dietaryNotes}</p>}
                      </div>
                    </div>
                  )}

                  <div className="mb-6">
                    <h4 className="font-semibold mb-2">Staff Assignments</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <p>Executive Chef: _________________</p>
                      <p>Sous Chef: _________________</p>
                      <p>Prep Cooks: _________________</p>
                      <p>Service Staff: _________________</p>
                    </div>
                  </div>

                  <div className="flex gap-3 justify-end">
                    <button onClick={() => setView('list')} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Back</button>
                    <button onClick={() => alert('BEO PDF would download here')}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2">
                      <Download size={20} />Download BEO PDF</button>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {view === 'invoice' && selectedEvent && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="mb-6 pb-4 border-b">
              <div className="flex justify-between items-start">
                <div>
                  <img src="/pcc-logo.png" alt="Pima Community College" className="h-16 mb-2" />
                  <h3 className="text-2xl font-bold text-blue-800">INVOICE</h3>
                  <p className="text-sm text-gray-600">Culinary Arts & Baking Programs</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Invoice #: {selectedEvent.id}</p>
                  <p className="text-sm text-gray-600">Date: {new Date().toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            {(() => {
              const pricing = calculateEventTotal(selectedEvent);
              const paymentDueDate = selectedEvent.isInternal 
                ? new Date(new Date(selectedEvent.eventDate).getTime() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                : selectedEvent.eventDate;
              return (
                <div>
                  <div className="mb-6 grid grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-2">Bill To:</h4>
                      <p>{selectedEvent.clientName}</p>
                      <p className="text-sm text-gray-600">{selectedEvent.clientEmail}</p>
                      <p className="text-sm text-gray-600">{formatPhoneNumber(selectedEvent.clientPhone)}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Event Details:</h4>
                      <p>{selectedEvent.eventName}</p>
                      <p className="text-sm text-gray-600">{selectedEvent.eventDate} at {selectedEvent.eventTime}</p>
                      <p className="text-sm text-gray-600">{selectedEvent.location}</p>
                      <p className="text-sm text-gray-600">{selectedEvent.guestCount} guests</p>
                    </div>
                  </div>

                  <div className="mb-6">
                    <table className="w-full">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="text-left px-4 py-2">Description</th>
                          <th className="text-right px-4 py-2">Quantity</th>
                          <th className="text-right px-4 py-2">Price</th>
                          <th className="text-right px-4 py-2">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedEvent.selectedPackage && (() => {
                          const pkg = packages.find(p => p.id === selectedEvent.selectedPackage);
                          return pkg ? (
                            <tr className="border-t">
                              <td className="px-4 py-2">{pkg.name}</td>
                              <td className="px-4 py-2 text-right">{selectedEvent.guestCount}</td>
                              <td className="px-4 py-2 text-right">${pkg.pricePerPerson.toFixed(2)}</td>
                              <td className="px-4 py-2 text-right">${(pkg.pricePerPerson * selectedEvent.guestCount).toFixed(2)}</td>
                            </tr>
                          ) : null;
                        })()}
                        {selectedEvent.selectedItems?.map(item => {
                          const menuItem = menuItems.find(m => m.id === item.id);
                          if (!menuItem) return null;
                          const qty = item.quantity || selectedEvent.guestCount;
                          return (
                            <tr key={item.id} className="border-t">
                              <td className="px-4 py-2">{menuItem.name}</td>
                              <td className="px-4 py-2 text-right">{qty}</td>
                              <td className="px-4 py-2 text-right">${menuItem.menu_price.toFixed(2)}</td>
                              <td className="px-4 py-2 text-right">${(menuItem.menu_price * qty).toFixed(2)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="ml-auto max-w-sm space-y-2 mb-6">
                    <div className="flex justify-between"><span>Subtotal:</span><span>${pricing.subtotal.toFixed(2)}</span></div>
                    <div className="flex justify-between text-gray-600"><span>Service Fee:</span><span>N/C</span></div>
                    <div className="flex justify-between font-bold text-xl pt-2 border-t">
                      <span>Total Due:</span><span>${pricing.total.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50 rounded-lg mb-6">
                    <h4 className="font-semibold mb-2">Payment Terms</h4>
                    {selectedEvent.isInternal ? (
                      <p className="text-sm">Full payment due <strong>{paymentDueDate}</strong> (10 days before event)</p>
                    ) : (
                      <p className="text-sm">Payment due by event date: <strong>{paymentDueDate}</strong></p>
                    )}
                  </div>

                  <div className="flex gap-3 justify-end">
                    <button onClick={() => setView('list')} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Back</button>
                    <button onClick={() => alert('Invoice PDF would download here')}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                      <Download size={20} />Download Invoice PDF</button>
                    <button onClick={() => { updateEventStatus(selectedEvent.id, 'paid'); alert('Event marked as PAID'); }}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2">
                      <Check size={20} />Mark as Paid</button>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
};

export default CateringWorkflowSystem;
