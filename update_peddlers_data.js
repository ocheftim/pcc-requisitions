import { ingredientsList } from './src/data/ingredients/ingredientsList.js';
import fs from 'fs';

// Real Peddler's Son data from actual orders 7ZA2RS and VR572W
const peddlersData = {
  // Produce
  'Ylw Squash': { code: 'V210201', price: 10.20, packSize: '5 LBS', unit: 'CASE' },
  'Zucchini': { code: 'V210601', price: 7.10, packSize: '5 LBS', unit: 'CASE' },
  'Broccoli Crown': { code: 'V200600', price: 13.90, packSize: '20 LBS', unit: 'FIVE_POUND_SPLIT' },
  'Raspberry': { code: 'F320400', price: 4.80, packSize: '12 CT CASE', unit: 'EACH' },
  'Red Potato': { code: 'V142102', price: 7.10, packSize: '1/5LB', unit: 'BAG' },
  'Shallots': { code: 'V131000', price: 16.30, packSize: '5 LBS', unit: 'CASE' },
  'Romaine': { code: 'V120300', price: 2.50, packSize: '24 CT', unit: 'EACH' },
  'Corn': { code: 'V200902', price: 2.70, packSize: '48 CT', unit: '_3_EACH_PACK' },
  
  // Baking/Pantry
  'Masa harina': { code: 'G400006', price: 16.20, packSize: '25 LB', unit: 'BAG', brand: 'CARDENAS' },
  'Polenta': { code: 'G810206', price: 46.40, packSize: '1/10LB', unit: 'BAG', brand: 'HAYDEN FLOUR MILLS' },
  'White Sugar': { code: 'G100002', price: 22.20, packSize: '25 LB', unit: 'BAG' },
  'Active dry yeast': { code: 'G800304', price: 6.30, packSize: '20/1LB', unit: 'BOX', brand: 'FLEISHMANNS' },
  'Balsamic vin': { code: 'G100053', price: 24.70, packSize: 'GALLON', unit: 'GALLON', brand: 'SPARROW' },
  
  // Dairy & Eggs
  'Milk': { code: 'D431106', price: 12.50, packSize: '2/1GLN', unit: 'CASE', brand: 'SARAH FARMS' },
  'Butter': { code: 'D460212', price: 188.20, packSize: '36/1LB', unit: 'CASE', brand: 'GRASSLAND' },
  'Cheddar': { code: 'D475105', price: 58.90, packSize: '2/5LB', unit: 'CASE', brand: 'TILLAMOOK' },
  'Eggs': { code: 'E402000', price: 50.00, packSize: '15 DZ', unit: 'CASE', brand: 'HICKMAN EGGS' },
  'Heavy Cream': { code: 'D432202', price: 106.50, packSize: '9/64 OZ', unit: 'CASE', brand: 'SARAH FARMS' }
};

// Read current ingredients list
let fileContent = fs.readFileSync('./src/data/ingredients/ingredientsList.js', 'utf-8');

// Update each ingredient with Peddler's data
Object.entries(peddlersData).forEach(([name, data]) => {
  // Find the ingredient in the file (case-insensitive search)
  const searchPattern = new RegExp(`(name:\\s*['"]${name}['"])`, 'i');
  
  if (fileContent.match(searchPattern)) {
    console.log(`✓ Updating ${name} with Peddler's data...`);
    
    // For each ingredient, we need to find its object and add peddlers vendor info
    // This is complex regex surgery, so let's do it line by line
    const lines = fileContent.split('\n');
    let inTargetItem = false;
    let updatedLines = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check if we're entering the target ingredient
      if (line.match(searchPattern)) {
        inTargetItem = true;
      }
      
      updatedLines.push(line);
      
      // If we're in the target item and find unitPrice, add peddlers data after it
      if (inTargetItem && line.includes('unitPrice:')) {
        // Check if peddlersCode already exists in next few lines
        let hasPeddlers = false;
        for (let j = i + 1; j < Math.min(i + 10, lines.length); j++) {
          if (lines[j].includes('peddlersCode')) {
            hasPeddlers = true;
            break;
          }
        }
        
        if (!hasPeddlers) {
          const indent = line.match(/^\s*/)[0];
          updatedLines.push(`${indent}peddlersCode: '${data.code}',`);
          updatedLines.push(`${indent}peddlersPrice: ${data.price},`);
          updatedLines.push(`${indent}peddlersPackSize: '${data.packSize}'${data.brand ? `,` : ''}`);
          if (data.brand) {
            updatedLines.push(`${indent}peddlersBrand: '${data.brand}'`);
          }
        }
      }
      
      // Check if we're leaving the target ingredient (next ingredient starts or array ends)
      if (inTargetItem && (line.includes('{ id:') || line.includes('];'))) {
        if (!line.match(searchPattern)) { // Make sure it's not the same item
          inTargetItem = false;
        }
      }
    }
    
    fileContent = updatedLines.join('\n');
  } else {
    console.log(`  ⚠ ${name} not found in database`);
  }
});

// Write updated file
fs.writeFileSync('./src/data/ingredients/ingredientsList.js', fileContent);

console.log('\n✅ Updated ingredientsList.js with Peddler\'s vendor data!');
console.log(`\nUpdated ${Object.keys(peddlersData).length} items with real Peddler's Son codes and prices`);
console.log('\nNow run: node create_test_requisition_v3.js');
