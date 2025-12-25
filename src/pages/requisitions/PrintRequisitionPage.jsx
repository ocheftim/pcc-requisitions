import React, { useEffect, useState } from 'react';

export default function PrintRequisitionPage() {
  const [req, setReq] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem('requisitionToPrint');
    if (stored) {
      setReq(JSON.parse(stored));
      setTimeout(() => window.print(), 500);
    }
  }, []);

  if (!req) {
    return <div className="p-8 text-center text-gray-500">No requisition to print</div>;
  }

  const items = typeof req.items === 'string' ? JSON.parse(req.items) : (req.items || []);
  const totalCost = items.reduce((sum, item) => sum + (parseFloat(item.extended) || 0), 0);

  return (
    <div className="max-w-4xl mx-auto p-8 bg-white print:p-4">
      <div className="no-print mb-4 flex gap-2">
        <button onClick={() => window.print()} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Print</button>
        <button onClick={() => window.close()} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Close</button>
      </div>
      <div className="border-b-2 border-blue-600 pb-4 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-blue-800">Lab Requisition</h1>
            <p className="text-gray-600">Pima Community College - Culinary Arts</p>
          </div>
          <div className="text-right text-sm">
            <p><strong>Date:</strong> {req.class_date || 'TBD'}</p>
            <p><strong>Status:</strong> {req.status || 'pending'}</p>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
        <div>
          <p><strong>Instructor:</strong> {req.instructor}</p>
          <p><strong>Program:</strong> {req.program}</p>
          <p><strong>Course:</strong> {req.course}</p>
        </div>
        <div>
          <p><strong>Week/Module:</strong> {req.week}</p>
          <p><strong>Students:</strong> {req.students}</p>
          <p><strong>Budget:</strong> ${parseFloat(req.budget || 0).toFixed(2)}</p>
        </div>
      </div>
      {req.recipes && <div className="mb-6"><p className="text-sm"><strong>Recipes:</strong> {req.recipes}</p></div>}
      <table className="w-full border-collapse text-sm mb-6">
        <thead>
          <tr className="bg-blue-50">
            <th className="border border-gray-300 px-2 py-1 text-left">Item</th>
            <th className="border border-gray-300 px-2 py-1 text-center w-16">Qty</th>
            <th className="border border-gray-300 px-2 py-1 text-center w-16">Unit</th>
            <th className="border border-gray-300 px-2 py-1 text-right w-20">Unit $</th>
            <th className="border border-gray-300 px-2 py-1 text-right w-20">Ext $</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              <td className="border border-gray-300 px-2 py-1">{item.name}</td>
              <td className="border border-gray-300 px-2 py-1 text-center">{item.quantity}</td>
              <td className="border border-gray-300 px-2 py-1 text-center">{item.unit}</td>
              <td className="border border-gray-300 px-2 py-1 text-right">${parseFloat(item.unitCost || 0).toFixed(2)}</td>
              <td className="border border-gray-300 px-2 py-1 text-right">${parseFloat(item.extended || 0).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-blue-100 font-bold">
            <td colSpan="4" className="border border-gray-300 px-2 py-1 text-right">Total:</td>
            <td className="border border-gray-300 px-2 py-1 text-right">${totalCost.toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>
      <div className="grid grid-cols-2 gap-8 mt-8 pt-4 border-t text-sm">
        <div><p className="mb-8">Instructor Signature: _______________________</p><p>Date: _______________________</p></div>
        <div><p className="mb-8">Approved By: _______________________</p><p>Date: _______________________</p></div>
      </div>
    </div>
  );
}
