/**
 * 실거래가 데이터 수집 API
 * 아파트 매매 및 전월세 실거래가 정보 수집
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { fetchWithRetryAndParsing, extractGovernmentApiData } from '@/lib/api/response-handler';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const API_KEY = process.env.NEXT_PUBLIC_DATA_GO_KR_SERVICE_KEY;

// 실거래가 API 엔드포인트
const TRADE_API_BASE = 'https://apis.data.go.kr/1613000/RTMSDataSvcAptTrade';
const RENT_API_BASE = 'https://apis.data.go.kr/1613000/RTMSDataSvcAptRent';

// 주요 지역코드 (서울 주요 구)
const MAJOR_REGIONS = [
  { code: '11680', name: '강남구' },
  { code: '11110', name: '종로구' },
  { code: '11140', name: '중구' },
  { code: '11170', name: '용산구' },
  { code: '11200', name: '성동구' }
];

/**
 * 매매 실거래가 데이터 수집
 */
async function collectTradeData(regionCode: string, dealYmd: string) {
  const url = `${TRADE_API_BASE}/getRTMSDataSvcAptTrade?serviceKey=${encodeURIComponent(API_KEY!)}&LAWD_CD=${regionCode}&DEAL_YMD=${dealYmd}&type=json`;
  
  try {
    console.log(`📡 매매 실거래가 수집: ${regionCode} - ${dealYmd}`);
    
    const apiResponse = await fetchWithRetryAndParsing(url, {}, 3, 1000);
    
    if (!apiResponse.success) {
      throw new Error(apiResponse.error || 'API call failed');
    }
    
    const dataResult = extractGovernmentApiData(apiResponse);
    
    if (!dataResult.success) {
      throw new Error(dataResult.error || 'Data extraction failed');
    }
    
    const items = dataResult.items || [];
    console.log(`✅ 매매 데이터 ${items.length}건 수집`);
    
    return items.map(item => ({
      apartment_name: (item.아파트 || item.aptNm)?.trim() || '',
      region_code: regionCode,
      legal_dong: (item.법정동 || item.umdNm)?.trim() || '',
      jibun: (item.지번 || item.jibun)?.trim() || '',
      deal_amount: parseInt((item.거래금액 || item.dealAmount || '0').toString().replace(/,/g, '')),
      deal_date: `${item.년 || item.dealYear || '2024'}-${String(item.월 || item.dealMonth || '1').padStart(2, '0')}-${String(item.일 || item.dealDay || '1').padStart(2, '0')}`,
      exclusive_area: parseFloat((item.전용면적 || item.excluUseAr || '0').toString()),
      floor_number: parseInt((item.층 || item.floor || '0').toString()),
      build_year: parseInt((item.건축년도 || item.buildYear || '0').toString()),
      apartment_dong: (item.아파트동명 || item.aptDong)?.trim() || '',
      deal_type: '매매',
      data_source: 'government_api'
    }));
    
  } catch (error) {
    console.error(`❌ 매매 데이터 수집 실패 ${regionCode}-${dealYmd}:`, error);
    return [];
  }
}

/**
 * 전월세 실거래가 데이터 수집
 */
async function collectRentData(regionCode: string, dealYmd: string) {
  const url = `${RENT_API_BASE}/getRTMSDataSvcAptRent?serviceKey=${encodeURIComponent(API_KEY!)}&LAWD_CD=${regionCode}&DEAL_YMD=${dealYmd}&type=json`;
  
  try {
    console.log(`📡 전월세 실거래가 수집: ${regionCode} - ${dealYmd}`);
    
    const apiResponse = await fetchWithRetryAndParsing(url, {}, 3, 1000);
    
    if (!apiResponse.success) {
      throw new Error(apiResponse.error || 'API call failed');
    }
    
    const dataResult = extractGovernmentApiData(apiResponse);
    
    if (!dataResult.success) {
      throw new Error(dataResult.error || 'Data extraction failed');
    }
    
    const items = dataResult.items || [];
    console.log(`✅ 전월세 데이터 ${items.length}건 수집`);
    
    return items.map(item => ({
      apartment_name: (item.아파트 || item.aptNm)?.trim() || '',
      region_code: regionCode,
      legal_dong: (item.법정동 || item.umdNm)?.trim() || '',
      jibun: (item.지번 || item.jibun)?.trim() || '',
      deposit_amount: parseInt((item.보증금액 || item.deposit || '0').toString().replace(/,/g, '')),
      monthly_rent: parseInt((item.월세금액 || item.monthlyRent || '0').toString().replace(/,/g, '')),
      deal_date: `${item.년 || item.dealYear || '2024'}-${String(item.월 || item.dealMonth || '1').padStart(2, '0')}-${String(item.일 || item.dealDay || '1').padStart(2, '0')}`,
      exclusive_area: parseFloat((item.전용면적 || item.excluUseAr || '0').toString()),
      floor_number: parseInt((item.층 || item.floor || '0').toString()),
      build_year: parseInt((item.건축년도 || item.buildYear || '0').toString()),
      contract_term: (item.계약구분 || item.contractTerm)?.trim() || '',
      data_source: 'government_api'
    }));
    
  } catch (error) {
    console.error(`❌ 전월세 데이터 수집 실패 ${regionCode}-${dealYmd}:`, error);
    return [];
  }
}

/**
 * 데이터베이스 저장
 */
async function saveTradeTransactions(transactions: any[]) {
  if (transactions.length === 0) return 0;
  
  try {
    const { error } = await supabase
      .from('apartment_trade_transactions')
      .insert(transactions);

    if (error) {
      console.error('❌ 매매 거래 DB 저장 에러:', error);
      return 0;
    }
    
    return transactions.length;
  } catch (error) {
    console.error('❌ 매매 거래 저장 중 에러:', error);
    return 0;
  }
}

async function saveRentTransactions(transactions: any[]) {
  if (transactions.length === 0) return 0;
  
  try {
    const { error } = await supabase
      .from('apartment_rent_transactions')
      .insert(transactions);

    if (error) {
      console.error('❌ 전월세 거래 DB 저장 에러:', error);
      return 0;
    }
    
    return transactions.length;
  } catch (error) {
    console.error('❌ 전월세 거래 저장 중 에러:', error);
    return 0;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      regions = ['11680'], // 기본값: 강남구
      months = ['202401'], // 기본값: 2024년 1월
      collectTrade = true, // 매매 수집 여부
      collectRent = true   // 전월세 수집 여부
    } = body;

    console.log(`🚀 실거래가 수집 시작`);
    console.log(`지역: ${regions.join(', ')}, 기간: ${months.join(', ')}`);
    console.log(`수집 유형: ${collectTrade ? '매매' : ''}${collectTrade && collectRent ? ', ' : ''}${collectRent ? '전월세' : ''}`);

    let totalTradeTransactions = 0;
    let totalRentTransactions = 0;
    let totalErrors = 0;

    for (const regionCode of regions) {
      const regionName = MAJOR_REGIONS.find(r => r.code === regionCode)?.name || regionCode;
      console.log(`\n📍 처리 중: ${regionName} (${regionCode})`);
      
      for (const dealYmd of months) {
        try {
          // 매매 데이터 수집
          if (collectTrade) {
            const tradeData = await collectTradeData(regionCode, dealYmd);
            const savedTrade = await saveTradeTransactions(tradeData);
            totalTradeTransactions += savedTrade;
            console.log(`  📈 매매: ${savedTrade}건 저장`);
          }
          
          // 전월세 데이터 수집
          if (collectRent) {
            const rentData = await collectRentData(regionCode, dealYmd);
            const savedRent = await saveRentTransactions(rentData);
            totalRentTransactions += savedRent;
            console.log(`  🏠 전월세: ${savedRent}건 저장`);
          }
          
          // API 호출 간 대기
          await new Promise(resolve => setTimeout(resolve, 500));
          
        } catch (error) {
          console.error(`❌ 에러 ${regionCode}-${dealYmd}:`, error);
          totalErrors++;
        }
      }
    }

    console.log(`\n✅ 실거래가 수집 완료`);
    console.log(`매매: ${totalTradeTransactions}건, 전월세: ${totalRentTransactions}건`);
    console.log(`에러: ${totalErrors}건`);

    return NextResponse.json({
      success: true,
      message: 'Real estate transaction data collection completed',
      trade_transactions: totalTradeTransactions,
      rent_transactions: totalRentTransactions,
      total_transactions: totalTradeTransactions + totalRentTransactions,
      errors: totalErrors,
      regions: regions.length,
      months: months.length
    });

  } catch (error) {
    console.error('실거래가 수집 API 에러:', error);
    return NextResponse.json(
      { 
        error: 'Transaction data collection failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

// GET 요청으로 상태 확인
export async function GET() {
  return NextResponse.json({
    message: 'Real estate transaction data collector is ready',
    endpoints: {
      trade: TRADE_API_BASE,
      rent: RENT_API_BASE
    },
    supported_regions: MAJOR_REGIONS,
    status: 'active'
  });
}