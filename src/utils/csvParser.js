// Parse Sysco CSV format
export function parseSyscoCSV(text) {
  const lines = text.split('\n').filter(line => line.trim());
  const items = [];
  
  for (const line of lines) {
    // Skip header lines (start with H)
    if (line.startsWith('H,')) continue;
    
    // Product lines start with P
    if (line.startsWith('P,')) {
      // Parse CSV properly handling quoted fields
      const fields = parseCSVLine(line);
      
      // Sysco format: P,itemCode,qty,?,packSize,brand,description,price...
      // Fields: [0]=P, [1]=code, [2]=qty, [3]=?, [4]=?, [5]=packSize, [6]=brand, [7]=description
      if (fields.length >= 8) {
        const code = fields[1];
        const packSize = fields[5]?.replace(/"/g, '') || '';
        const brand = fields[6]?.replace(/"/g, '') || '';
        const description = fields[7]?.replace(/"/g, '') || '';
        
        // Find price (usually last numeric field)
        let price = 0;
        for (let i = fields.length - 1; i >= 0; i--) {
          const val = parseFloat(fields[i]?.replace(/[,$]/g, ''));
          if (!isNaN(val) && val > 0 && val < 10000) {
            price = val;
            break;
          }
        }
        
        // Extract quantity from pack size (e.g., "3/10-14#" = 3 units of 10-14 lbs)
        let quantity = 1;
        let unit = 'ea';
        const packMatch = packSize.match(/^(\d+)\/(.+)/);
        if (packMatch) {
          quantity = parseInt(packMatch[1]);
          const sizeMatch = packMatch[2].match(/([\d.]+)\s*(lb|#|oz|gal|qt|ct|ea)/i);
          if (sizeMatch) {
            unit = sizeMatch[2].replace('#', 'lb').toLowerCase();
          }
        }
        
        if (description) {
          items.push({
            name: description,
            code,
            brand,
            packSize,
            quantity,
            unit,
            price
          });
        }
      }
    }
  }
  
  return items;
}

// Parse CSV line handling quoted fields
function parseCSVLine(line) {
  const fields = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      fields.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  fields.push(current.trim());
  
  return fields;
}

export default parseSyscoCSV;
