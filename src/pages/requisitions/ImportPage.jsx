import React, { useState, useCallback, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

const TABS = [
  { id: 'ingredients', label: 'Ingredients & Prices', description: 'Upload invoices, order guides, price lists' },
  { id: 'requisitions', label: 'Requisitions', description: 'Import instructor emails or order forms' },
  { id: 'catering', label: 'Catering', description: 'Import event details, quotes, contracts' },
];

const FILE_TYPES = {
  ingredients: ['.pdf', '.csv', '.xlsx', '.jpg', '.jpeg', '.png', '.txt'],
  requisitions: ['.pdf', '.eml', '.msg', '.txt', '.jpg', '.jpeg', '.png'],
  catering: ['.pdf', '.docx', '.txt', '.jpg', '.jpeg', '.png'],
};

function detectVendor(filename, content) {
  const text = (filename + ' ' + content).toLowerCase();
  if (text.includes('sysco')) return 'Sysco';
  if (text.includes('shamrock')) return 'Shamrock Foods';
  if (text.includes('us foods')) return 'US Foods';
  return 'Unknown';
}

function levenshtein(a, b) {
  const matrix = Array.from({ length: b.length + 1 }, (_, i) => [i]);
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      matrix[i][j] = b[i - 1] === a[j - 1]
        ? matrix[i - 1][j - 1]
        : Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
    }
  }
  return matrix[b.length][a.length];
}

function normalize(str) {
  return str.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
}

function fuzzyMatch(searchTerm, targetName) {
  const a = normalize(searchTerm);
  const b = normalize(targetName);
  if (b.includes(a) || a.includes(b)) return true;
  const distance = levenshtein(a, b);
  const maxLen = Math.max(a.length, b.length);
  return (1 - distance / maxLen) > 0.6;
}

const ABBREVIATIONS = {
  'bf': 'beef', 'chkn': 'chicken', 'chk': 'chicken', 'trky': 'turkey',
  'bnls': 'boneless', 'skls': 'skinless', 'brst': 'breast',
  'grnd': 'ground', 'frz': 'frozen', 'frzn': 'frozen', 'frsh': 'fresh',
  'hvy': 'heavy', 'crm': 'cream', 'whl': 'whole', 'mlk': 'milk',
  'choc': 'chocolate', 'van': 'vanilla',
  'flr': 'flour', 'ap': 'all purpose', 'pwd': 'powdered', 'gran': 'granulated',
  'sgr': 'sugar', 'unsltd': 'unsalted',
  'lg': 'large', 'sm': 'small', 'med': 'medium',
};

function expandAbbreviations(str) {
  let result = str.toLowerCase();
  for (const [abbr, full] of Object.entries(ABBREVIATIONS)) {
    result = result.replace(new RegExp(`\\b${abbr}\\b`, 'gi'), full);
  }
  return result;
}

function calculateMatch(invoiceName, dbIngredient) {
  const normalizedInvoice = normalize(expandAbbreviations(invoiceName));
  const normalizedDb = normalize(dbIngredient.name);
  if (normalizedInvoice === normalizedDb) return 100;
  
  const invoiceWords = normalizedInvoice.split(' ').filter(w => w.length > 1);
  const dbWords = normalizedDb.split(' ').filter(w => w.length > 1);
  const matchedWords = invoiceWords.filter(w => dbWords.some(dw => dw.includes(w) || w.includes(dw)));
  if (matchedWords.length > 0) {
    const score = (matchedWords.length / Math.max(invoiceWords.length, dbWords.length)) * 100;
    if (score >= 50) return Math.round(score);
  }
  
  const distance = levenshtein(normalizedInvoice, normalizedDb);
  return Math.max(0, Math.round((1 - distance / Math.max(normalizedInvoice.length, normalizedDb.length)) * 100));
}

function findMatches(invoiceName, ingredients) {
  const matches = [];
  for (const ingredient of ingredients) {
    const confidence = calculateMatch(invoiceName, ingredient);
    if (confidence >= 40) matches.push({ name: ingredient.name, confidence, unitPrice: ingredient.unit_price, category: ingredient.category });
  }
  matches.sort((a, b) => b.confidence - a.confidence);
  return { bestMatch: matches[0]?.confidence >= 50 ? matches[0] : null, nearMatches: matches.slice(0, 5) };
}

function guessCategory(name) {
  const n = name.toLowerCase();
  if (/beef|pork|chicken|turkey|lamb|duck|bacon|sausage/.test(n)) return 'Proteins';
  if (/shrimp|fish|salmon|crab|lobster|clam|oyster/.test(n)) return 'Proteins';
  if (/milk|cream|cheese|butter|yogurt|egg/.test(n)) return 'Dairy & Eggs';
  if (/flour|sugar|salt|spice|oil|vinegar|sauce|pasta|rice|chocolate|vanilla/.test(n)) return 'Pantry';
  return 'Pantry';
}

function cleanItemName(name) {
  return name.replace(/\b(iqf|cvp|usda|usa|grade)\b/gi, '').replace(/\s+/g, ' ').trim()
    .split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}

function parseCSVLine(line) {
  const fields = []; let current = ''; let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') inQuotes = !inQuotes;
    else if (char === ',' && !inQuotes) { fields.push(current.trim()); current = ''; }
    else current += char;
  }
  fields.push(current.trim());
  return fields;
}

function parseSyscoCSV(text) {
  const lines = text.split('\n').filter(line => line.trim());
  const items = [];
  for (const line of lines) {
    if (line.startsWith('H,')) continue;
    if (line.startsWith('P,')) {
      const fields = parseCSVLine(line);
      let description = '', price = 0, packSize = '', code = fields[1] || '';
      for (let i = 0; i < fields.length; i++) {
        const field = fields[i].replace(/"/g, '').trim();
        if (field.length > 10 && /[a-zA-Z]{3,}/.test(field) && !/^\d/.test(field)) {
          if (!description || field.length > description.length) description = field;
        }
        if (/^\d+\/[\d\w\-\.#]+/i.test(field) && field.length < 20) packSize = field;
        const numVal = parseFloat(field.replace(/[,$]/g, ''));
        if (!isNaN(numVal) && numVal > 0.5 && numVal < 5000 && field.includes('.')) price = numVal;
      }
      let quantity = 1, unit = 'cs';
      if (packSize) {
        const packMatch = packSize.match(/^(\d+)\//);
        if (packMatch) quantity = parseInt(packMatch[1]);
        if (packSize.includes('LB') || packSize.includes('#')) unit = 'lb';
        else if (packSize.includes('OZ')) unit = 'oz';
      }
      if (description && price > 0) items.push({ name: description, code, packSize, quantity, unit, price });
    }
  }
  return items;
}

function parseOrderFeedback(text) {
  const feedback = { type: 'feedback', instructor: '', course: '', duplicates: [], notOrdered: [], ordered: [], rawText: text };
  
  const nameMatch = text.match(/^([A-Z][a-z]+ [A-Z]\.? ?[A-Z][a-z]+)/m);
  if (nameMatch) feedback.instructor = nameMatch[1].trim();
  
  const courseMatch = text.match(/(?:for\s+)?(\d{3})/i);
  if (courseMatch) feedback.course = `CUL${courseMatch[1]}`;
  
  // Parse duplicates - look for "listed twice" pattern
  const produceMatch = text.match(/produce[^.]*?(\w+(?:\s+\w+)?)\s+(?:were|was)\s+listed twice/i);
  if (produceMatch) feedback.duplicates.push(produceMatch[1].trim());
  
  const pantryMatch = text.match(/pantry[,\s]+(?:the\s+)?([^.]+?)(?:were|was)\s+listed twice/i);
  if (pantryMatch) {
    const items = pantryMatch[1].replace(/as was/g, ',').replace(/and/g, ',').split(',').map(s => s.replace(/^the\s+/i, '').trim()).filter(s => s.length > 2);
    feedback.duplicates.push(...items);
  }
  
  // Fallback duplicate parsing
  if (feedback.duplicates.length === 0) {
    const dupMatch = text.match(/listed twice[^.]*\.([^.]+)/gi);
    if (dupMatch) {
      dupMatch.forEach(m => {
        const items = m.split(/,|and/).map(s => s.replace(/listed twice|the|were|was/gi, '').trim()).filter(s => s.length > 2);
        feedback.duplicates.push(...items);
      });
    }
  }
  
  // Parse NOT ordered items
  const notMatch = text.match(/did not order\s+([^.]+)/gi);
  if (notMatch) {
    notMatch.forEach(m => {
      const items = m.replace(/did not order\s*/i, '').replace(/,\s*,/g, ',').replace(/nor/g, ',').split(/,/).map(s => s.trim()).filter(s => s.length > 2 && !/^\d/.test(s));
      feedback.notOrdered.push(...items);
    });
  }
  
  // Parse items that WERE ordered
  const ordMatch = text.match(/I did order\s+([^.]+?)(?:\s+but|\.|$)/gi);
  if (ordMatch) {
    ordMatch.forEach(m => {
      const items = m.replace(/I did order\s*/i, '').replace(/\s+but.*/, '').split(/,|and/).map(s => s.trim()).filter(s => s.length > 2);
      feedback.ordered.push(...items);
    });
  }
  
  // Clean up duplicates list
  feedback.duplicates = feedback.duplicates.map(d => d.replace(/^the\s+/i, '').replace(/\s+/g, ' ').trim()).filter(d => d.length > 2 && !d.match(/^(on|as|was|were|the)$/i));
  
  return feedback;
}

export default function ImportPage() {
  const [activeTab, setActiveTab] = useState('ingredients');
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState([]);
  const [pastedText, setPastedText] = useState('');
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [ingredients, setIngredients] = useState([]);
  const [selectedItems, setSelectedItems] = useState({});
  const [showNearMatches, setShowNearMatches] = useState({});
  const [inputMode, setInputMode] = useState('paste');
  const [requisitions, setRequisitions] = useState([]);
  const [selectedRequisition, setSelectedRequisition] = useState(null);

  useEffect(() => {
    async function loadData() {
      const { data: ing } = await supabase.from('ingredients').select('name, unit_price, category').order('name');
      if (ing) setIngredients(ing);
      
      const { data: reqs } = await supabase.from('requisitions').select('*').order('class_date', { ascending: false }).limit(50);
      if (reqs) setRequisitions(reqs);
    }
    loadData();
  }, []);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFiles(Array.from(e.dataTransfer.files));
  }, []);

  const handleFileInput = (e) => handleFiles(Array.from(e.target.files));
  const handleFiles = (newFiles) => { setFiles(prev => [...prev, ...newFiles]); setResults(null); setPreviewData(null); };
  const removeFile = (index) => setFiles(prev => prev.filter((_, i) => i !== index));
  const clearAll = () => { setFiles([]); setPastedText(''); setResults(null); setPreviewData(null); setSelectedItems({}); setSelectedRequisition(null); };
  const toggleSelectItem = (idx, action) => setSelectedItems(prev => ({ ...prev, [idx]: action }));
  const selectNearMatch = (idx, matchName) => {
    setSelectedItems(prev => ({ ...prev, [idx]: { action: 'update', match: matchName } }));
    setShowNearMatches(prev => ({ ...prev, [idx]: false }));
  };

  const processContent = async (text, sourceName = 'Pasted Text') => {
    const vendor = detectVendor(sourceName, text);
    
    if (activeTab === 'ingredients') {
      let parsedItems = [];
      if (text.includes(',') && (text.startsWith('H,') || text.includes('\nP,'))) {
        parsedItems = parseSyscoCSV(text);
      } else {
        const lines = text.split('\n').filter(l => l.trim());
        for (const line of lines) {
          const priceMatch = line.match(/\$?([\d,]+\.\d{2})/);
          if (priceMatch) {
            const name = line.replace(/\$?[\d,]+\.\d{2}/, '').replace(/,/g, ' ').trim();
            if (name.length > 3) parsedItems.push({ name, quantity: 1, unit: 'ea', price: parseFloat(priceMatch[1].replace(',', '')) });
          }
        }
      }
      
      const matchedItems = parsedItems.map(item => {
        const { bestMatch, nearMatches } = findMatches(item.name, ingredients);
        return {
          name: item.name, cleanedName: cleanItemName(item.name),
          match: bestMatch?.name || null, confidence: bestMatch?.confidence || 0, nearMatches,
          quantity: item.quantity, unit: item.unit, price: item.price,
          oldPrice: bestMatch?.unitPrice ? bestMatch.unitPrice * item.quantity : null,
          category: bestMatch?.category || guessCategory(item.name), code: item.code,
        };
      });
      matchedItems.sort((a, b) => b.confidence - a.confidence);
      
      const initialSelections = {};
      matchedItems.forEach((item, idx) => { if (item.confidence >= 70) initialSelections[idx] = { action: 'update', match: item.match }; });
      setSelectedItems(initialSelections);
      setPreviewData({ type: 'ingredients', source: sourceName, vendor, items: matchedItems.length > 0 ? matchedItems : [{ name: 'No items found' }] });
      
    } else if (activeTab === 'requisitions') {
      const lowerText = text.toLowerCase();
      const isFeedback = lowerText.includes('did not order') || lowerText.includes('listed twice') || lowerText.includes('duplicate');
      
      if (isFeedback) {
        const feedback = parseOrderFeedback(text);
        
        // Try to auto-select the requisition based on course
        if (feedback.course) {
          const matchingReq = requisitions.find(r => r.course === feedback.course);
          if (matchingReq) setSelectedRequisition(matchingReq);
        }
        
        setPreviewData({ type: 'feedback', source: sourceName, ...feedback });
      } else {
        setPreviewData({ type: 'requisition', source: sourceName, instructor: '', course: '', date: '', module: '', items: [], rawText: text });
      }
    }
  };

  const processFiles = async () => {
    if (inputMode === 'paste' && pastedText.trim()) {
      setProcessing(true);
      try { await processContent(pastedText, 'Pasted Text'); }
      catch (error) { setResults({ success: false, message: 'Error: ' + error.message }); }
      finally { setProcessing(false); }
      return;
    }
    if (files.length === 0) return;
    setProcessing(true);
    try {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        setResults({ success: false, message: 'Cannot read images. Use "Paste Text" instead.' });
        setProcessing(false);
        return;
      }
      await processContent(await file.text(), file.name);
    } catch (error) { setResults({ success: false, message: 'Error: ' + error.message }); }
    finally { setProcessing(false); }
  };

  const applyFeedback = async () => {
    if (!previewData || previewData.type !== 'feedback' || !selectedRequisition) {
      setResults({ success: false, message: 'Please select a requisition to update' });
      return;
    }
    
    setProcessing(true);
    try {
      let items = Array.isArray(selectedRequisition.items) ? selectedRequisition.items : JSON.parse(selectedRequisition.items || '[]');
      const originalCount = items.length;
      
      // Items to remove (NOT ordered + duplicates)
      const toRemove = [...previewData.notOrdered, ...previewData.duplicates];
      
      // Items to keep (explicitly ordered)
      const toKeep = previewData.ordered.map(o => normalize(o));
      
      // Filter items
      const removedItems = [];
      items = items.filter(item => {
        const itemName = normalize(item.name || '');
        
        // Check if this should be kept
        if (toKeep.some(k => fuzzyMatch(k, itemName))) return true;
        
        // Check if this should be removed
        for (const removeItem of toRemove) {
          if (fuzzyMatch(removeItem, itemName)) {
            removedItems.push(item.name);
            return false;
          }
        }
        return true;
      });
      
      // Handle duplicates - remove second occurrence
      const seen = new Set();
      const deduped = [];
      for (const item of items) {
        const key = normalize(item.name || '');
        if (!seen.has(key)) {
          seen.add(key);
          deduped.push(item);
        } else {
          removedItems.push(`${item.name} (duplicate)`);
        }
      }
      items = deduped;
      
      // Update requisition
      const { error } = await supabase
        .from('requisitions')
        .update({ 
          items: items,
          updated_at: new Date().toISOString(),
          notes: `Updated ${new Date().toLocaleDateString()}: Removed ${removedItems.length} items per instructor feedback`
        })
        .eq('id', selectedRequisition.id);
      
      if (error) throw error;
      
      setResults({ 
        success: true, 
        message: `Updated ${selectedRequisition.course}! Removed ${originalCount - items.length} items: ${removedItems.slice(0, 5).join(', ')}${removedItems.length > 5 ? '...' : ''}`
      });
      
      // Refresh requisitions list
      const { data: reqs } = await supabase.from('requisitions').select('*').order('class_date', { ascending: false }).limit(50);
      if (reqs) setRequisitions(reqs);
      
      clearAll();
    } catch (error) {
      setResults({ success: false, message: 'Error: ' + error.message });
    } finally {
      setProcessing(false);
    }
  };

  const applyUpdates = async () => {
    if (!previewData) return;
    setProcessing(true);
    try {
      if (previewData.type === 'ingredients') {
        let updateCount = 0, addCount = 0;
        const errors = [];
        
        for (const [idxStr, selection] of Object.entries(selectedItems)) {
          const item = previewData.items[parseInt(idxStr)];
          if (!item) continue;
          
          if (selection.action === 'update' && selection.match) {
            const unitCost = item.quantity > 0 ? item.price / item.quantity : item.price;
            const { error } = await supabase.from('ingredients').update({ unit_price: unitCost, updated_at: new Date().toISOString() }).eq('name', selection.match);
            if (error) errors.push(`Update ${selection.match}: ${error.message}`);
            else updateCount++;
          } else if (selection.action === 'add') {
            const unitCost = item.quantity > 0 ? item.price / item.quantity : item.price;
            const { error } = await supabase.from('ingredients').insert({ name: item.cleanedName, category: item.category, unit: item.unit, unit_price: unitCost });
            if (error) errors.push(error.code === '23505' ? `"${item.cleanedName}" exists` : error.message);
            else { addCount++; setIngredients(prev => [...prev, { name: item.cleanedName, unit_price: unitCost, category: item.category }]); }
          }
        }
        
        let message = updateCount > 0 ? `Updated ${updateCount}. ` : '';
        message += addCount > 0 ? `Added ${addCount}. ` : '';
        message += errors.length > 0 ? `Errors: ${errors.slice(0, 3).join('; ')}` : '';
        setResults({ success: errors.length === 0, message: message || 'No changes' });
        if (errors.length === 0) clearAll();
      }
    } catch (error) { setResults({ success: false, message: 'Error: ' + error.message }); }
    finally { setProcessing(false); }
  };

  const getConfidenceColor = (c) => c >= 90 ? 'text-green-600 bg-green-50' : c >= 70 ? 'text-yellow-600 bg-yellow-50' : c >= 50 ? 'text-orange-600 bg-orange-50' : 'text-red-600 bg-red-50';
  const formatCurrency = (a) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(a || 0);
  const selectedCount = Object.keys(selectedItems).length;

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Import</h1>
        <p className="text-gray-600">Upload documents or paste text to update ingredients, requisitions, or catering events</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200">
          <div className="flex">
            {TABS.map((tab) => (
              <button key={tab.id} onClick={() => { setActiveTab(tab.id); clearAll(); }}
                className={`flex-1 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id ? 'border-blue-600 text-blue-600 bg-blue-50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>
                <div className="text-center">
                  <div className="font-medium">{tab.label}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{tab.description}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {!previewData && (
            <>
              <div className="flex gap-2 mb-4">
                <button onClick={() => setInputMode('upload')}
                  className={`px-4 py-2 rounded-lg font-medium ${inputMode === 'upload' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                  Upload File
                </button>
                <button onClick={() => setInputMode('paste')}
                  className={`px-4 py-2 rounded-lg font-medium ${inputMode === 'paste' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                  Paste Text
                </button>
              </div>
              
              {inputMode === 'upload' ? (
                <div onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${dragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}>
                  <input type="file" multiple accept={FILE_TYPES[activeTab].join(',')} onChange={handleFileInput} className="hidden" id="file-upload" />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <span className="text-blue-600 hover:text-blue-700 font-medium">Upload files</span>
                    <span className="text-gray-600"> or drag and drop</span>
                  </label>
                </div>
              ) : (
                <textarea value={pastedText} onChange={(e) => setPastedText(e.target.value)}
                  placeholder="Paste email text, invoice data, or order feedback here..."
                  className="w-full h-64 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm" />
              )}
              
              {files.length > 0 && inputMode === 'upload' && (
                <div className="mt-4">
                  {files.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm">{file.name}</span>
                      <button onClick={() => removeFile(idx)} className="text-gray-400 hover:text-gray-600">×</button>
                    </div>
                  ))}
                </div>
              )}

              {(files.length > 0 || (inputMode === 'paste' && pastedText.trim())) && (
                <button onClick={processFiles} disabled={processing}
                  className="mt-4 w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 font-medium">
                  {processing ? 'Processing...' : 'Process'}
                </button>
              )}
            </>
          )}

          {/* INGREDIENTS PREVIEW */}
          {previewData?.type === 'ingredients' && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Extracted Items</h3>
                  <p className="text-sm text-gray-500">Source: {previewData.source} • Vendor: {previewData.vendor}</p>
                </div>
                <button onClick={clearAll} className="text-sm text-gray-500 hover:text-gray-700">Cancel</button>
              </div>
              <div className="border border-gray-200 rounded-lg overflow-hidden max-h-[400px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="text-left px-3 py-2 w-24">Action</th>
                      <th className="text-left px-3 py-2">Item</th>
                      <th className="text-left px-3 py-2">Match</th>
                      <th className="text-center px-3 py-2 w-16">Score</th>
                      <th className="text-right px-3 py-2 w-24">Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {previewData.items.map((item, idx) => {
                      const selection = selectedItems[idx];
                      const isUpdate = selection?.action === 'update';
                      const isAdd = selection?.action === 'add';
                      return (
                        <tr key={idx} className={isUpdate ? 'bg-green-50' : isAdd ? 'bg-blue-50' : ''}>
                          <td className="px-3 py-2">
                            <div className="flex flex-col gap-1">
                              {item.confidence >= 50 && (
                                <button onClick={() => toggleSelectItem(idx, { action: 'update', match: item.match })}
                                  className={`text-xs px-2 py-1 rounded ${isUpdate ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>Update</button>
                              )}
                              <button onClick={() => toggleSelectItem(idx, { action: 'add' })}
                                className={`text-xs px-2 py-1 rounded ${isAdd ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>Add</button>
                            </div>
                          </td>
                          <td className="px-3 py-2 text-xs">{item.name?.slice(0, 40)}</td>
                          <td className="px-3 py-2">{item.match || <span className="text-red-600 italic">No match</span>}</td>
                          <td className="px-3 py-2 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-xs ${getConfidenceColor(item.confidence)}`}>{item.confidence}%</span>
                          </td>
                          <td className="px-3 py-2 text-right">{formatCurrency(item.price)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex justify-between">
                <span className="text-sm text-gray-600">Selected: {selectedCount}</span>
                <div className="flex gap-3">
                  <button onClick={clearAll} className="px-6 py-2 border rounded-lg">Cancel</button>
                  <button onClick={applyUpdates} disabled={processing || selectedCount === 0} className="px-6 py-2 bg-green-600 text-white rounded-lg disabled:bg-gray-400">
                    Apply {selectedCount} Changes
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* FEEDBACK PREVIEW */}
          {previewData?.type === 'feedback' && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Order Feedback Detected</h3>
                <button onClick={clearAll} className="text-sm text-gray-500 hover:text-gray-700">Cancel</button>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <p className="text-yellow-800 font-medium">This feedback will update an existing requisition.</p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                  <div><span className="text-gray-500">From:</span> <span className="ml-2 font-medium">{previewData.instructor || 'Unknown'}</span></div>
                  <div><span className="text-gray-500">Course:</span> <span className="ml-2 font-medium">{previewData.course || 'Unknown'}</span></div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Requisition to Update:</label>
                  <select 
                    value={selectedRequisition?.id || ''} 
                    onChange={(e) => setSelectedRequisition(requisitions.find(r => r.id === parseInt(e.target.value)))}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">-- Select Requisition --</option>
                    {requisitions.map(req => (
                      <option key={req.id} value={req.id}>
                        {req.course} - {req.week || 'Module'} ({req.class_date}) - {req.instructor}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              {previewData.duplicates?.length > 0 && (
                <div className="mb-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <h4 className="font-medium text-orange-800 mb-2">⚠️ Duplicates to Remove</h4>
                  <ul className="list-disc list-inside text-sm text-orange-700">
                    {previewData.duplicates.map((item, i) => <li key={i}>{item}</li>)}
                  </ul>
                </div>
              )}
              
              {previewData.notOrdered?.length > 0 && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <h4 className="font-medium text-red-800 mb-2">❌ Items to Remove (NOT Ordered)</h4>
                  <ul className="list-disc list-inside text-sm text-red-700">
                    {previewData.notOrdered.map((item, i) => <li key={i}>{item}</li>)}
                  </ul>
                </div>
              )}
              
              {previewData.ordered?.length > 0 && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="font-medium text-green-800 mb-2">✓ Items to Keep (Ordered)</h4>
                  <ul className="list-disc list-inside text-sm text-green-700">
                    {previewData.ordered.map((item, i) => <li key={i}>{item}</li>)}
                  </ul>
                </div>
              )}
              
              <details className="mb-4">
                <summary className="cursor-pointer text-sm text-gray-500">View Original Message</summary>
                <div className="mt-2 p-4 bg-gray-100 rounded-lg text-sm whitespace-pre-wrap">{previewData.rawText}</div>
              </details>
              
              <div className="flex justify-end gap-3">
                <button onClick={clearAll} className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                <button 
                  onClick={applyFeedback} 
                  disabled={processing || !selectedRequisition} 
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 font-medium"
                >
                  {processing ? 'Applying...' : 'Apply Feedback to Requisition'}
                </button>
              </div>
            </div>
          )}

          {results && (
            <div className={`mt-4 p-4 rounded-lg ${results.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <span className={`font-medium ${results.success ? 'text-green-800' : 'text-red-800'}`}>{results.message}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
