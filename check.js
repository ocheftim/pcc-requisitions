const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://zyjhgrfpjjxnjqkdqpms.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5amhncmZwamp4bmpxa2RxcG1zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI5MjYxNjcsImV4cCI6MjA0ODUwMjE2N30.W_6hJZGfK5R1JWo2p8wMG-DtwjGjgPYH_kYLLMfz9EM'
);

async function check() {
  const { data: all, error } = await supabase.from('ingredients').select('category, subcategory');
  if (error) { console.log('Error:', error); return; }
  if (!all) { console.log('No data'); return; }
  
  const combos = {};
  all.forEach(i => {
    if (!combos[i.category]) combos[i.category] = new Set();
    combos[i.category].add(i.subcategory);
  });
  console.log('Categories/Subcategories in use:');
  Object.keys(combos).sort().forEach(cat => {
    console.log(cat + ':');
    Array.from(combos[cat]).sort().forEach(sub => console.log('  - ' + sub));
  });
  
  const { data: items } = await supabase.from('ingredients').select('id, name, category, subcategory').ilike('name', '%glace%');
  console.log('\nGlace items:');
  if (items) items.forEach(g => console.log(g.id, g.name, '-', g.category, '>', g.subcategory));
}
check();
