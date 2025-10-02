const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://saucdbvjjwqgvbhcylhv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhdWNkYnZqandxZ3ZiaGN5bGh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwMTA0MjQsImV4cCI6MjA3MzU4NjQyNH0.VmT8PFKn_JrsVhMNTIdLoWH6oyq6b_ZMCPIimzVt_PQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDisplaySchools() {
  const { data, error } = await supabase
    .from('apartments')
    .select('*')
    .eq('kapt_code', 'A13376906')
    .single();
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log('Apartment data keys:', Object.keys(data));
  
  // Check for any property with 'display' or 'school' in the name
  const displayKeys = Object.keys(data).filter(key => 
    key.toLowerCase().includes('display') || 
    key.toLowerCase().includes('school')
  );
  
  console.log('Display/School related keys:', displayKeys);
  
  if (displayKeys.length > 0) {
    displayKeys.forEach(key => {
      console.log(`${key}:`, data[key]);
    });
  }
  
  // Check education_facilities
  if (data.education_facilities) {
    console.log('education_facilities:', data.education_facilities);
  }
}

checkDisplaySchools();