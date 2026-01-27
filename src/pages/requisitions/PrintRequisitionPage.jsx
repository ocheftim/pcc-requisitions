import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

const FOOD_CATEGORIES = ['Produce', 'Dairy & Eggs', 'Meat', 'Seafood', 'Pantry', 'Frozen', 'Bakery'];

export default function PrintRequisitionPage() {
  const { id } = useParams();
  const [req, setReq] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadReq = async () => {
      if (id) {
        const { data } = await supabase.from('requisitions').select('*').eq('id', id).single();
        if (data) setReq(data);
      } else {
        const stored = localStorage.getItem('requisitionToPrint');
        if (stored) setReq(JSON.parse(stored));
      }
      setLoading(false);
    };
    loadReq();
  }, [id]);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;
  if (!req) return <div className="p-8 text-center text-gray-500">No requisition found</div>;

  const items = typeof req.items === 'string' ? JSON.parse(req.items) : (req.items || []);
  const equipment = typeof req.equipment === 'string' ? JSON.parse(req.equipment) : (req.equipment || []);
  
  const foodItems = items.filter(i => FOOD_CATEGORIES.includes(i.category));
  const nonFoodItems = items.filter(i => !FOOD_CATEGORIES.includes(i.category));
  
  const categoryOrder = ['Produce', 'Dairy & Eggs', 'Meat', 'Seafood', 'Pantry', 'Frozen', 'Bakery'];
  const sortedFoodItems = [...foodItems].sort((a, b) => {
    const aIdx = categoryOrder.indexOf(a.category);
    const bIdx = categoryOrder.indexOf(b.category);
    if (aIdx !== bIdx) return aIdx - bIdx;
    return (a.name || '').localeCompare(b.name || '');
  });

  const foodTotal = foodItems.reduce((sum, item) => sum + (parseFloat(item.extended) || 0), 0);
  const nonFoodTotal = nonFoodItems.reduce((sum, item) => sum + (parseFloat(item.extended) || 0), 0);
  const totalCost = foodTotal + nonFoodTotal;
  
  const budget = parseFloat(req.budget) || 0;
  const budgetDiff = budget - totalCost;
  const budgetPct = budget > 0 ? ((budgetDiff / budget) * 100) : 0;
  const isUnderBudget = budgetDiff >= 0;
  
  const students = parseInt(req.students) || 0;
  const teams = Math.ceil(students / 2);

  const formatDate = (d) => {
    if (!d) return 'TBD';
    const str = d.split('T')[0];
    const [y, m, day] = str.split('-').map(Number);
    const date = new Date(y, m - 1, day);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatModule = (week) => {
    if (!week) return '';
    return week.replace(/^Term \d+\s+Week \d+[:\s-]*/i, '').trim();
  };

  const ItemTable = ({ items, title, showCategory }) => {
    if (items.length === 0) return null;
    let currentCategory = '';
    return (
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-800 mb-2">{title}</h2>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-blue-50">
              <th className="border border-gray-300 px-3 py-1.5 text-left">Item</th>
              <th className="border border-gray-300 px-3 py-1.5 text-center w-20">Qty</th>
              <th className="border border-gray-300 px-3 py-1.5 text-center w-24">Unit</th>
              <th className="border border-gray-300 px-3 py-1.5 text-right w-24">Unit $</th>
              <th className="border border-gray-300 px-3 py-1.5 text-right w-24">Ext $</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => {
              const showCategoryHeader = showCategory && item.category !== currentCategory;
              if (showCategory) currentCategory = item.category;
              return (
                <React.Fragment key={idx}>
                  {showCategoryHeader && (
                    <tr className="bg-gray-200">
                      <td colSpan={5} className="border border-gray-300 px-3 py-1 font-semibold text-gray-700">{item.category || 'Other'}</td>
                    </tr>
                  )}
                  <tr className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="border border-gray-300 px-3 py-1">{item.name}</td>
                    <td className="border border-gray-300 px-3 py-1 text-center">{item.quantity}</td>
                    <td className="border border-gray-300 px-3 py-1 text-center">{item.unit}</td>
                    <td className="border border-gray-300 px-3 py-1 text-right">${parseFloat(item.unitCost || 0).toFixed(2)}</td>
                    <td className="border border-gray-300 px-3 py-1 text-right">${parseFloat(item.extended || 0).toFixed(2)}</td>
                  </tr>
                </React.Fragment>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-blue-100 font-bold">
              <td colSpan={4} className="border border-gray-300 px-3 py-1.5 text-right">Subtotal:</td>
              <td className="border border-gray-300 px-3 py-1.5 text-right">${items.reduce((sum, i) => sum + (parseFloat(i.extended) || 0), 0).toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    );
  };



  const handleCopyForEmail = () => {
    const categories = {};
    const catOrder = ["Produce", "Dairy \& Eggs", "Meat", "Seafood", "Pantry", "Frozen", "Bakery", "Supplies", "Other"];
    sortedFoodItems.forEach(item => {
      const cat = item.category || "Other";
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(item);
    });
    const sorted = {};
    catOrder.forEach(cat => {
      if (categories[cat]) sorted[cat] = categories[cat].sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    });
    let html = `<div style="font-family:Arial,sans-serif;font-size:14px;">`;
    html += `<h2 style="margin:0 0 12px 0;">Lab Requisition - ${req.course}</h2>`;
    html += `<p style="margin:4px 0;"><strong>Module:</strong> ${req.week || "-"}</p>`;
    html += `<p style="margin:4px 0;"><strong>Class Date:</strong> ${formatDate(req.class_date)}</p>`;
    html += `<p style="margin:4px 0;"><strong>Students:</strong> ${req.students || "-"}</p>`;
    html += `<p style="margin:4px 0 16px 0;"><strong>Budget:</strong> $${req.budget?.toFixed(2) || "-"}</p>`;
    html += `<table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;width:100%;max-width:600px;">`;
    html += `<thead><tr style="background-color:#f0f0f0;"><th align="left">Item</th><th align="center" width="50">Qty</th><th align="left" width="60">Unit</th><th align="right" width="60">Unit $</th><th align="right" width="60">Ext $</th></tr></thead>`;
    html += `<tbody>`;
    Object.entries(sorted).forEach(([category, items]) => {
      html += `<tr><td colspan="5" style="background-color:#e0e0e0;font-weight:bold;">${category}</td></tr>`;
      items.forEach(item => {
        html += `<tr><td>${item.name}</td><td align="center">${item.quantity}</td><td>${item.unit}</td><td align="right">$${item.unitCost?.toFixed(2) || "-"}</td><td align="right">$${item.extended?.toFixed(2) || "-"}</td></tr>`;
      });
    });
    html += `<tr style="font-weight:bold;"><td colspan="4" align="right">Total:</td><td align="right">$${totalCost.toFixed(2)}</td></tr>`;
    html += `</tbody></table>`;
    html += `<p style="margin:16px 0 0 0;"><em>Please review and confirm or request changes.</em></p>`;
    html += `</div>`;
    const blob = new Blob([html], { type: "text/html" });
    const clipboardItem = new ClipboardItem({ "text/html": blob });
    navigator.clipboard.write([clipboardItem]).then(() => {
      alert("Copied to clipboard! Paste into your email.");
    }).catch(err => {
      console.error("Copy failed:", err);
      alert("Copy failed. Try selecting and copying manually.");
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-8 bg-white print:p-4">
      <div className="no-print mb-4 flex gap-2">
        <button onClick={() => window.print()} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Print</button>
        <button onClick={() => window.history.back()} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Close</button>
        <button onClick={handleCopyForEmail} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Copy for Email</button>
      </div>

      <div className="border-b-2 border-blue-600 pb-4 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-blue-800">Lab Requisition</h1>
            <p className="text-gray-600">Pima Community College - Culinary Arts</p>
          </div>
          <div className="text-right text-sm">
            <p><strong>Date:</strong> {formatDate(req.class_date)}</p>
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
          <p><strong>Module:</strong> {formatModule(req.week)}</p>
          <p><strong>Students:</strong> {req.students} ({teams} teams)</p>
          <p>
            <strong>Budget:</strong> ${budget.toFixed(2)}
            {budget > 0 && (
              <span className={`ml-2 font-semibold ${isUnderBudget ? 'text-green-600' : 'text-red-600'}`}>
                ({isUnderBudget ? '-' : '+'}{Math.abs(budgetPct).toFixed(0)}%)
              </span>
            )}
          </p>
        </div>
      </div>
      
      {req.recipes && (
        <div className="mb-6 p-3 bg-blue-50 rounded">
          <p className="text-sm"><strong>Recipes:</strong> {req.recipes}</p>
        </div>
      )}

      <ItemTable items={sortedFoodItems} title="Ingredients" showCategory={true} />
      <ItemTable items={nonFoodItems} title="Supplies & Tools" showCategory={false} />

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
    </div>
  );
}
