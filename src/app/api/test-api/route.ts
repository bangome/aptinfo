import { NextRequest, NextResponse } from 'next/server';
import { realEstateApi } from '@/lib/api/real-estate-api';

export async function GET(request: NextRequest) {
  try {
    console.log('=== API 테스트 시작 ===');

    // 서울 강남구 코드 테스트
    const gangnamCode = '11680';
    const currentMonth = realEstateApi.getCurrentYearMonth();

    console.log('테스트 파라미터:', {
      지역코드: gangnamCode,
      년월: currentMonth
    });

    // API 호출
    const result = await realEstateApi.getIntegratedApartmentData({
      LAWD_CD: gangnamCode,
      DEAL_YMD: currentMonth,
      numOfRows: 10
    });

    console.log('API 호출 성공! 결과:', {
      아파트수: result.length,
      첫번째아파트: result[0]?.name || '없음'
    });

    return NextResponse.json({
      success: true,
      message: 'API 호출 성공',
      data: {
        테스트파라미터: {
          지역코드: gangnamCode,
          년월: currentMonth,
          조회건수: 10
        },
        결과: {
          아파트수: result.length,
          아파트목록: result.slice(0, 3).map(apt => ({
            이름: apt.name,
            주소: apt.address,
            가격: apt.price?.sale ? `${apt.price.sale.toLocaleString()}원` : '미정',
            면적: apt.area.exclusive ? `${apt.area.exclusive}㎡` : '미정'
          }))
        }
      }
    });

  } catch (error) {
    console.error('API 테스트 실패:', error);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'API 호출 실패 - 더미 데이터로 폴백됩니다'
    }, { status: 500 });
  }
}