const XLSX = require('xlsx');
const fs = require('fs');

// Read the Excel files
const savory = XLSX.readFile('Savory_fillable_Order_form__1_.xlsx');
const baking = XLSX.readFile('Baking_Order_Form_Blank__1_.xlsx');

// Extract items from sheets
const savorySheet = savory.Sheets[savory.SheetNames[0]];
const bakingSheet = baking.Sheets[baking.SheetNames[0]];

const savoryItems = [];
const bakingItems = [];

// Extract from columns B, F, I, L starting at row 5
for (let row = 5; row <= 100; row++) {
  ['B', 'F', 'I', 'L'].forEach(col => {
    const cell = savorySheet[col + row];
    if (cell && cell.v && cell.v.trim() && cell.v !== 'Item') {
      savoryItems.push(cell.v.trim());
    }
  });
}

for (let row = 5; row <= 100; row++) {
  ['B', 'F', 'I', 'L'].forEach(col => {
    const cell = bakingSheet[col + row];
    if (cell && cell.v && cell.v.trim() && cell.v !== 'Item') {
      bakingItems.push(cell.v.trim());
    }
  });
}

const allItems = [...savoryItems, ...bakingItems];
console.log(`Found ${allItems.length} items total`);

// Generate ingredient objects
const ingredients = allItems.map((item, idx) => {
  // Clean the name - remove newlines and extra spaces
  let name = item.split(',')[0].trim().replace(/\n/g, ' ').replace(/\s+/g, ' ');
  
  const unit = item.toLowerCase().includes(', lb') ? 'lb' : 
               item.toLowerCase().includes(', ea') ? 'each' : 
               item.toLowerCase().includes('bnch') ? 'bunch' : 'lb';
  
  const basePrice = 10 + Math.random() * 50;
  const syscoPrice = (basePrice * (0.9 + Math.random() * 0.2)).toFixed(2);
  const shamrockPrice = (basePrice * (0.85 + Math.random() * 0.3)).toFixed(2);
  const meritPrice = (basePrice * (0.88 + Math.random() * 0.24)).toFixed(2);
  const peddlersPrice = (basePrice * (0.92 + Math.random() * 0.26)).toFixed(2);
  
  const prices = { sysco: +syscoPrice, shamrock: +shamrockPrice, merit: +meritPrice, peddlers: +peddlersPrice };
  const preferredVendor = Object.entries(prices).sort((a,b) => a[1] - b[1])[0][0];
  
  const category = name.toLowerCase().includes('flour') || name.toLowerCase().includes('sugar') ? 'DRY GOODS' :
                   name.toLowerCase().includes('milk') || name.toLowerCase().includes('egg') || name.toLowerCase().includes('butter') || name.toLowerCase().includes('cream') || name.toLowerCase().includes('cheese') ? 'DAIRY' :
                   name.toLowerCase().includes('chicken') || name.toLowerCase().includes('beef') || name.toLowerCase().includes('bacon') || name.toLowerCase().includes('fish') || name.toLowerCase().includes('stock') ? 'MEAT' : 'PRODUCE';
  
  return `  { id: '${category.substring(0,3)}-${String(idx+1).padStart(3,'0')}', pccStock: 'PCC-${1000+idx+1}', category: '${category}', name: '${name}', unit: '${unit}', vendors: { sysco: { code: 'SYS-${Math.floor(Math.random()*900000+100000)}', casePrice: ${syscoPrice}, packSize: '1/50LB', lastUpdated: '2025-11-16', available: true }, shamrock: { code: 'SHM-${Math.floor(Math.random()*900000+100000)}', casePrice: ${shamrockPrice}, packSize: '1/50LB', lastUpdated: '2025-11-16', available: true }, merit: { code: 'MER-${Math.floor(Math.random()*900000+100000)}', casePrice: ${meritPrice}, packSize: '1/50LB', lastUpdated: '2025-11-15', available: true }, peddlers: { code: 'PED-${Math.floor(Math.random()*900000+100000)}', casePrice: ${peddlersPrice}, packSize: '1/50LB', lastUpdated: '2025-11-08', available: true } }, preferredVendor: '${preferredVendor}' }`;
});

// Write the file
const output = `export const ingredientsList = [
${ingredients.join(',\n')}
];

export const categories = [...new Set(ingredientsList.map(item => item.category))];
export const vendors = ['sysco', 'shamrock', 'merit', 'peddlers'];
export const vendorNames = {
  sysco: 'Sysco',
  shamrock: 'Shamrock Foods',
  merit: 'Merit',
  peddlers: "Peddler's Son"
};

export function getBestPrice(item) {
  let best = { vendor: null, casePrice: Infinity, packSize: null };
  Object.entries(item.vendors).forEach(([vendor, data]) => {
    if (data.available && data.casePrice < best.casePrice) {
      best = { vendor, casePrice: data.casePrice, packSize: data.packSize };
    }
  });
  return best;
}

export function getItemByPccStock(pccStock) {
  return ingredientsList.find(item => item.pccStock === pccStock);
}

export function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
`;

fs.writeFileSync('src/data/ingredients/ingredientsList.js', output);
console.log('✅ Generated ingredientsList.js with', ingredients.length, 'items');
