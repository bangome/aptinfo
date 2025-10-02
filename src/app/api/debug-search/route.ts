import { NextRequest, NextResponse } from 'next/server';
import { realApartmentService } from '@/services/realApartmentService';

export async function GET(request: NextRequest) {
  try {
    console.log('=== 검색 서비스 디버깅 시작 ===');

    // 강남구 검색 테스트
    console.log('1. 강남구 검색 테스트...');
    const gangnamResult = await realApartmentService.search('', { region: '강남구', limit: 5 });
    console.log(`강남구 검색 결과: ${gangnamResult.apartments.length}개`);

    if (gangnamResult.apartments.length > 0) {
      console.log('첫 번째 아파트:', {
        id: gangnamResult.apartments[0].id,
        name: gangnamResult.apartments[0].name,
        address: gangnamResult.apartments[0].address,
        price: gangnamResult.apartments[0].price
      });
    }

    // 전체 검색 테스트
    console.log('2. 전체 검색 테스트...');
    const allResult = await realApartmentService.search('', { limit: 10 });
    console.log(`전체 검색 결과: ${allResult.apartments.length}개`);

    // 최근 거래 테스트
    console.log('3. 최근 거래 테스트...');
    const recentResult = await realApartmentService.getRecentDeals(3);
    console.log(`최근 거래 결과: ${recentResult.length}개`);

    return NextResponse.json({
      success: true,
      results: {
        gangnam: {
          count: gangnamResult.apartments.length,
          sample: gangnamResult.apartments[0] || null
        },
        all: {
          count: allResult.apartments.length,
          sample: allResult.apartments[0] || null
        },
        recent: {
          count: recentResult.length,
          sample: recentResult[0] || null
        }
      }
    });

  } catch (error) {
    console.error('검색 서비스 디버깅 실패:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 });
  }
}