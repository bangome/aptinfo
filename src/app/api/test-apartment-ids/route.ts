import { NextRequest, NextResponse } from 'next/server';
import { realEstateApi } from '@/lib/api/real-estate-api';

export async function GET(request: NextRequest) {
  try {
    console.log('=== 아파트 ID 목록 테스트 ===');

    const apiParams = {
      LAWD_CD: '11680',
      DEAL_YMD: realEstateApi.getCurrentYearMonth(),
      numOfRows: 5
    };

    const integratedData = await realEstateApi.getIntegratedApartmentData(apiParams);
    console.log(`총 ${integratedData.length}개 아파트 데이터`);

    const apartmentIds = integratedData.map(apt => ({
      id: apt.id,
      kaptCode: apt.kaptCode,
      name: apt.name,
      address: apt.address
    }));

    console.log('아파트 ID 목록:', apartmentIds);

    return NextResponse.json({
      success: true,
      count: integratedData.length,
      apartments: apartmentIds,
      sample_urls: apartmentIds.slice(0, 3).map(apt => ({
        name: apt.name,
        url: `/apartments/${encodeURIComponent(apt.kaptCode || apt.id)}`
      }))
    });

  } catch (error) {
    console.error('아파트 ID 테스트 실패:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 });
  }
}