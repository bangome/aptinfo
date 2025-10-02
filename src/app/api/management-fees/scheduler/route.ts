/**
 * 간소화된 관리비 스케줄러 API (임시 핫픽스)
 * 복잡한 의존성 없이 기본 기능만 제공
 * 개선된 API 응답 처리 포함
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { fetchWithRetryAndParsing, extractGovernmentApiData } from '@/lib/api/response-handler';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const API_KEY = process.env.NEXT_PUBLIC_DATA_GO_KR_SERVICE_KEY;


// 아파트 목록 조회
async function getActiveApartments(limit: number = 10, offset: number = 0) {
  const { data, error } = await supabase
    .from('apartments')
    .select('kapt_code, name')
    .limit(limit)
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('아파트 목록 조회 에러:', error);
    return [];
  }

  return data || [];
}

// 관리비 데이터 수집 (개선된 파싱 버전)
async function collectSimpleManagementFee(kaptCode: string, kaptName: string, year: number, month: number) {
  const searchDate = `${year}${month.toString().padStart(2, '0')}`;
  const encodedApiKey = encodeURIComponent(API_KEY!);
  
  // 기본 관리비만 수집 (인건비)
  const url = `https://apis.data.go.kr/1613000/AptCmnuseManageCostServiceV2/getHsmpLaborCostInfoV2?serviceKey=${encodedApiKey}&kaptCode=${kaptCode}&searchDate=${searchDate}&type=json`;
  
  try {
    // 개선된 API 호출 (XML/JSON 자동 처리)
    const apiResponse = await fetchWithRetryAndParsing(url, {}, 3, 1000);
    
    if (!apiResponse.success) {
      throw new Error(apiResponse.error || 'API call failed');
    }
    
    // 정부 API 데이터 추출
    const dataResult = extractGovernmentApiData(apiResponse);
    
    if (!dataResult.success) {
      throw new Error(dataResult.error || 'Data extraction failed');
    }
    
    let laborCost = 0;
    if (dataResult.item) {
      laborCost = parseInt(dataResult.item.pay || 0);
    }
    
    return {
      kapt_code: kaptCode,
      kapt_name: kaptName,
      year,
      month,
      labor_cost: laborCost,
      total_fee: laborCost,
      collection_date: new Date().toISOString(),
      success_rate: laborCost > 0 ? 100 : 0,
      response_type: apiResponse.responseType
    };
  } catch (error) {
    console.error(`관리비 수집 실패 ${kaptCode}:`, error);
    return null;
  }
}

// DB 저장 (간소화)
async function saveToDatabase(data: any) {
  try {
    const { error } = await supabase
      .from('management_fees')
      .upsert({
        kapt_code: data.kapt_code,
        kapt_name: data.kapt_name,
        year: data.year,
        month: data.month,
        labor_cost: data.labor_cost,
        total_fee: data.total_fee,
        collection_date: data.collection_date
      }, {
        onConflict: 'kapt_code,year,month'
      });

    return !error;
  } catch (error) {
    console.error('DB 저장 에러:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { year, months, limit, offset } = body;

    const targetYear = year || 2024;
    const targetMonths = months || [new Date().getMonth() + 1];
    const batchLimit = limit || 5;
    const batchOffset = offset || 0;

    console.log(`🚀 간소화된 관리비 수집 시작: ${targetYear}년 ${targetMonths.join(', ')}월`);
    console.log(`처리 대상: ${batchLimit}개 아파트 (offset: ${batchOffset})`);

    const apartments = await getActiveApartments(batchLimit, batchOffset);
    
    let totalProcessed = 0;
    let totalSaved = 0;
    let totalErrors = 0;

    for (const apartment of apartments) {
      console.log(`📍 처리 중: ${apartment.name} (${apartment.kapt_code})`);
      
      for (const month of targetMonths) {
        try {
          const data = await collectSimpleManagementFee(
            apartment.kapt_code, 
            apartment.name, 
            targetYear, 
            month
          );
          
          if (data) {
            const saved = await saveToDatabase(data);
            if (saved) {
              totalSaved++;
              console.log(`✅ ${apartment.name} ${targetYear}-${month}: ${data.total_fee?.toLocaleString()}원`);
            } else {
              totalErrors++;
              console.log(`❌ DB 저장 실패: ${apartment.name} ${targetYear}-${month}`);
            }
          } else {
            totalErrors++;
            console.log(`❌ 데이터 수집 실패: ${apartment.name} ${targetYear}-${month}`);
          }
          
        } catch (error) {
          console.error(`❌ 에러 ${apartment.kapt_code} ${targetYear}-${month}:`, error);
          totalErrors++;
        }
        
        totalProcessed++;
        
        // 요청 간 대기
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    console.log(`✅ 간소화된 관리비 수집 완료 - 처리: ${totalProcessed}, 성공: ${totalSaved}, 에러: ${totalErrors}`);

    return NextResponse.json({
      success: true,
      message: 'Simple management fee collection completed',
      processed: totalProcessed,
      saved: totalSaved,
      errors: totalErrors,
      apartments: apartments.length
    });

  } catch (error) {
    console.error('간소화된 관리비 스케줄러 에러:', error);
    return NextResponse.json(
      { 
        error: 'Simple scheduler failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

// GET 요청으로 상태 확인
export async function GET() {
  return NextResponse.json({
    message: 'Simple management fee scheduler is running',
    status: 'active',
    lastRun: new Date().toISOString(),
    features: ['basic_labor_cost_collection', 'simplified_api']
  });
}