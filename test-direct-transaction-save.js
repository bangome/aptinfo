/**
 * 실거래가 데이터 직접 저장 테스트
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://saucdbvjjwqgvbhcylhv.supabase.co', 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhdWNkYnZqandxZ3ZiaGN5bGh2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODAxMDQyNCwiZXhwIjoyMDczNTg2NDI0fQ.nHI5FAi6l29fyhkVRDmOeT3FJBV4_UsmM5_V28Bl-VA'
);

async function testDirectSave() {
  console.log('🧪 실거래가 데이터 직접 저장 테스트\n');
  
  // 테스트 매매 데이터
  const testTradeTransaction = {
    apartment_name: '테스트 아파트',
    region_code: '11680',
    legal_dong: '테스트동',
    jibun: '123-45',
    deal_amount: 50000,
    deal_date: '2024-09-01',
    exclusive_area: 85.5,
    floor_number: 5,
    build_year: 2020,
    apartment_dong: '101동',
    deal_type: '매매',
    data_source: 'test'
  };
  
  // 테스트 전월세 데이터
  const testRentTransaction = {
    apartment_name: '테스트 아파트',
    region_code: '11680', 
    legal_dong: '테스트동',
    jibun: '123-45',
    deposit_amount: 30000,
    monthly_rent: 50,
    deal_date: '2024-09-01',
    exclusive_area: 85.5,
    floor_number: 5,
    build_year: 2020,
    contract_term: '전세',
    data_source: 'test'
  };
  
  // 매매 거래 테이블 저장 테스트
  console.log('📈 매매 거래 저장 테스트...');
  try {
    const { data: tradeData, error: tradeError } = await supabase
      .from('apartment_trade_transactions')
      .insert([testTradeTransaction]);
      
    if (tradeError) {
      console.error('❌ 매매 거래 저장 실패:', tradeError);
    } else {
      console.log('✅ 매매 거래 저장 성공');
    }
  } catch (error) {
    console.error('❌ 매매 거래 저장 중 에러:', error);
  }
  
  // 전월세 거래 테이블 저장 테스트
  console.log('\n🏠 전월세 거래 저장 테스트...');
  try {
    const { data: rentData, error: rentError } = await supabase
      .from('apartment_rent_transactions')
      .insert([testRentTransaction]);
      
    if (rentError) {
      console.error('❌ 전월세 거래 저장 실패:', rentError);
    } else {
      console.log('✅ 전월세 거래 저장 성공');
    }
  } catch (error) {
    console.error('❌ 전월세 거래 저장 중 에러:', error);
  }
  
  // 저장된 데이터 확인
  console.log('\n📊 저장된 데이터 확인...');
  
  const { count: tradeCount } = await supabase
    .from('apartment_trade_transactions')
    .select('*', { count: 'exact', head: true });
    
  const { count: rentCount } = await supabase
    .from('apartment_rent_transactions')
    .select('*', { count: 'exact', head: true });
    
  console.log(`매매 거래: ${tradeCount || 0}건`);
  console.log(`전월세 거래: ${rentCount || 0}건`);
}

testDirectSave().catch(console.error);