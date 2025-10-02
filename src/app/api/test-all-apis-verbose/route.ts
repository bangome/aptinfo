import { NextRequest, NextResponse } from 'next/server';
import { realEstateApi } from '@/lib/api/real-estate-api';

export async function GET(request: NextRequest) {
  try {
    console.log('=== 상세 API 테스트 시작 ===');

    // Test with current month data
    const bjdCode = '11680'; // 강남구
    const currentMonth = realEstateApi.getCurrentYearMonth();

    const apiParams = {
      LAWD_CD: bjdCode,
      DEAL_YMD: currentMonth,
      numOfRows: 10
    };

    console.log(`테스트 파라미터:`, apiParams);

    console.log('1. 매매 실거래가 API 상세 테스트...');
    try {
      const tradeData = await realEstateApi.getApartmentTradeData(apiParams);
      console.log(`매매 데이터: ${tradeData.length}개`);
      if (tradeData.length > 0) {
        console.log('첫 번째 매매 데이터:', JSON.stringify(tradeData[0], null, 2));
      }
    } catch (error) {
      console.error('매매 API 오류:', error);
    }

    console.log('2. 전월세 실거래가 API 상세 테스트...');
    try {
      const rentData = await realEstateApi.getApartmentRentData(apiParams);
      console.log(`전월세 데이터: ${rentData.length}개`);
      if (rentData.length > 0) {
        console.log('첫 번째 전월세 데이터:', JSON.stringify(rentData[0], null, 2));
      }
    } catch (error) {
      console.error('전월세 API 오류:', error);
    }

    console.log('3. 공동주택 단지목록 API 상세 테스트...');
    try {
      const apartmentList = await realEstateApi.getApartmentListByBjdCode(bjdCode, 1, 5);
      console.log(`단지목록 데이터: ${apartmentList.length}개`);
      if (apartmentList.length > 0) {
        console.log('첫 번째 단지 데이터:', JSON.stringify(apartmentList[0], null, 2));

        // Test basic info API with actual apartment code
        const firstApartment = apartmentList[0];
        console.log('4. 공동주택 기본정보 API 테스트...');
        try {
          const basisInfo = await realEstateApi.getApartmentBasisInfo(firstApartment.kaptCode);
          console.log(`기본정보 조회 결과: ${basisInfo ? '성공' : '실패'}`);
          if (basisInfo) {
            console.log('기본정보 데이터:', JSON.stringify(basisInfo, null, 2));
          }
        } catch (error) {
          console.error('기본정보 API 오류:', error);
        }

        console.log('5. 공동주택 상세정보 API 테스트...');
        try {
          const detailInfo = await realEstateApi.getApartmentDetailInfo(firstApartment.kaptCode);
          console.log(`상세정보 조회 결과: ${detailInfo ? '성공' : '실패'}`);
          if (detailInfo) {
            console.log('상세정보 데이터:', JSON.stringify(detailInfo, null, 2));
          }
        } catch (error) {
          console.error('상세정보 API 오류:', error);
        }
      }
    } catch (error) {
      console.error('단지목록 API 오류:', error);
    }

    console.log('6. 통합 데이터 조회 상세 테스트...');
    try {
      const integratedData = await realEstateApi.getIntegratedApartmentData(apiParams);
      console.log(`통합 데이터: ${integratedData.length}개`);
      if (integratedData.length > 0) {
        const firstIntegrated = integratedData[0];
        console.log('통합 데이터 예시:', JSON.stringify({
          name: firstIntegrated.name,
          kaptCode: firstIntegrated.kaptCode,
          facilities: firstIntegrated.facilities,
          management: firstIntegrated.management,
          transportation: firstIntegrated.transportation
        }, null, 2));
      }
    } catch (error) {
      console.error('통합 데이터 API 오류:', error);
    }

    return NextResponse.json({
      success: true,
      message: 'API 테스트 완료. 자세한 내용은 콘솔 로그를 확인하세요.'
    });

  } catch (error) {
    console.error('API 상세 테스트 중 오류:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류',
      details: error
    }, { status: 500 });
  }
}