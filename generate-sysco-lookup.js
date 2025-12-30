const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Read env file directly
const envContent = fs.readFileSync('.env.local', 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length) envVars[key.trim()] = valueParts.join('=').trim();
});

const supabase = createClient(
  envVars.REACT_APP_SUPABASE_URL,
  envVars.REACT_APP_SUPABASE_ANON_KEY
);

async function generateLookup() {
  const { data, error } = await supabase
    .from('ingredients')
    .select('*')
    .or('unit_price.eq.0,unit_price.is.null,case_price.eq.0,case_price.is.null')
    .order('category')
    .order('name');

  if (error) { console.error(error); return; }

  // CSV for manual lookup
  let csv = 'Name,Category,Subcategory,Unit,Current_PackSize,Current_CasePrice,Current_UnitPrice,SUPC_ToFind,Sysco_Pack,Sysco_CasePrice,Sysco_Brand\n';
  
  data.forEach(ing => {
    csv += `"${ing.name || ''}","${ing.category || ''}","${ing.subcategory || ''}","${ing.unit || ''}","${ing.pack_size || ''}","${ing.case_price || ''}","${ing.unit_price || ''}","${ing.vendor_code || ''}","","",""\n`;
  });

  fs.writeFileSync('sysco-lookup-needed.csv', csv);
  console.log(`Generated sysco-lookup-needed.csv with ${data.length} items needing price updates`);
  
  // Also list them
  console.log('\nItems needing updates:');
  data.forEach(ing => {
    console.log(`  - ${ing.name} (${ing.category}/${ing.subcategory}) - Pack: ${ing.pack_size || 'MISSING'}, Price: $${ing.case_price || 'MISSING'}`);
  });
}

generateLookup();
