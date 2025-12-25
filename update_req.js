const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xoswclwjsmwpemcrvorp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhvc3djbHdqc213cGVtY3J2b3JwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0MTQ1NzQsImV4cCI6MjA3OTk5MDU3NH0.JexQn0yFDURVI-g5ILj9Dfj7LHAQyV34clLDA2Uw1eE';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function updateReq() {
  // Get one full record to see columns
  const { data: sample, error: sampleErr } = await supabase
    .from('requisitions')
    .select('*')
    .limit(1);
  
  console.log('Sample record columns:', sample ? Object.keys(sample[0]) : 'none');
  console.log('Sample record:', JSON.stringify(sample?.[0], null, 2));
  
  // Now update the O'Donnell req
  const reqId = '46af8a4e-d778-4ca0-bbb4-b76f3443d319';
  
  const { data, error } = await supabase
    .from('requisitions')
    .update({
      instructor: 'Kouchit',
      course: 'CUL163',
      class_date: '2025-12-13'
    })
    .eq('id', reqId)
    .select();
  
  if (error) {
    console.error('Error updating:', error);
  } else {
    console.log('Updated successfully:', data);
  }
}

updateReq();
