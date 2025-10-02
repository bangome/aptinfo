/**
 * 최신 월 실거래가 데이터 수집 테스트
 */

const testCurrentMonth = async () => {
  console.log('🧪 최신 실거래가 데이터 수집 테스트 시작\n');

  // 2024년 9월 데이터로 테스트 (최신 데이터)
  console.log('📅 2024년 9월 데이터로 테스트');
  try {
    const testResponse = await fetch('http://localhost:3004/api/trade-transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        regions: ['11680'], // 강남구
        months: ['202409'], // 2024년 9월
        collectTrade: true,
        collectRent: true
      })
    });

    const testData = await testResponse.json();
    
    console.log(`📊 수집 결과: ${testResponse.status}`);
    console.log(JSON.stringify(testData, null, 2));
    
    if (testResponse.ok && testData.success) {
      console.log('\n✅ 실거래가 수집 성공!');
      console.log(`📈 매매: ${testData.trade_transactions}건`);
      console.log(`🏠 전월세: ${testData.rent_transactions}건`);
      console.log(`📊 총합: ${testData.total_transactions}건`);
      console.log(`❌ 에러: ${testData.errors}건`);
      
      if (testData.total_transactions > 0) {
        console.log('🎉 실거래가 데이터 수집이 성공적으로 작동합니다!');
        
        // 데이터베이스 확인
        console.log('\n📊 데이터베이스 상태 확인...');
        await checkDatabase();
      } else {
        console.log('⚠️ 데이터가 수집되지 않았습니다.');
      }
      
    } else {
      console.log('\n❌ 실거래가 수집 실패');
      console.log('에러:', testData.error || testData.message);
    }
    
  } catch (error) {
    console.log('\n❌ 실거래가 수집 중 네트워크 에러');
    console.log('에러:', error.message);
  }
};

// 간단한 데이터베이스 확인
const checkDatabase = async () => {
  const { createClient } = require('@supabase/supabase-js');
  
  const supabase = createClient(
    'https://saucdbvjjwqgvbhcylhv.supabase.co', 
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhdWNkYnZqandxZ3ZiaGN5bGh2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODAxMDQyNCwiZXhwIjoyMDczNTg2NDI0fQ.nHI5FAi6l29fyhkVRDmOeT3FJBV4_UsmM5_V28Bl-VA'
  );

  try {
    const { count: tradeCount } = await supabase
      .from('apartment_trade_transactions')
      .select('*', { count: 'exact', head: true });
    
    const { count: rentCount } = await supabase
      .from('apartment_rent_transactions')
      .select('*', { count: 'exact', head: true });
    
    console.log(`📈 매매 거래 DB: ${tradeCount || 0}건`);
    console.log(`🏠 전월세 거래 DB: ${rentCount || 0}건`);
    
    if ((tradeCount || 0) > 0) {
      // 최근 매매 거래 샘플
      const { data: tradeSample } = await supabase
        .from('apartment_trade_transactions')
        .select('apartment_name, deal_amount, deal_date')
        .order('deal_date', { ascending: false })
        .limit(3);
        
      console.log('\n📋 최근 매매 거래 샘플:');
      tradeSample?.forEach(trade => {
        console.log(`- ${trade.apartment_name}: ${trade.deal_amount?.toLocaleString()}만원 (${trade.deal_date})`);
      });
    }
    
    if ((rentCount || 0) > 0) {
      // 최근 전월세 거래 샘플
      const { data: rentSample } = await supabase
        .from('apartment_rent_transactions')
        .select('apartment_name, deposit_amount, monthly_rent, deal_date')
        .order('deal_date', { ascending: false })
        .limit(3);
        
      console.log('\n📋 최근 전월세 거래 샘플:');
      rentSample?.forEach(rent => {
        const deposit = rent.deposit_amount?.toLocaleString() || '0';
        const monthly = rent.monthly_rent?.toLocaleString() || '0';
        console.log(`- ${rent.apartment_name}: 보증금 ${deposit}만원/월세 ${monthly}만원 (${rent.deal_date})`);
      });
    }
    
  } catch (error) {
    console.error('❌ 데이터베이스 확인 에러:', error.message);
  }
};

testCurrentMonth().catch(console.error);