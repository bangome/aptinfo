import { NextRequest, NextResponse } from 'next/server';
import { realEstateApi } from '@/lib/api/real-estate-api';

export async function GET(request: NextRequest) {
  try {
    console.log('=== 전체 4개 API 테스트 시작 ===');

    // Test parameters
    const testParams = {
      bjdCode: '11680', // 강남구
      dealYm: '202506',
      kaptCode: '', // Will be found from apartment list
      apartmentName: '현대6차'
    };

    console.log('1. 매매 실거래가 API 테스트...');
    const tradeData = await realEstateApi.getApartmentTradeData({ LAWD_CD: testParams.bjdCode, DEAL_YMD: testParams.dealYm });
    console.log(`매매 데이터: ${tradeData.length}개`);

    console.log('2. 전월세 실거래가 API 테스트...');
    const rentData = await realEstateApi.getApartmentRentData({ LAWD_CD: testParams.bjdCode, DEAL_YMD: testParams.dealYm });
    console.log(`전월세 데이터: ${rentData.length}개`);

    console.log('3. 공동주택 단지목록 API 테스트...');
    const apartmentList = await realEstateApi.getApartmentListByBjdCode(testParams.bjdCode, 1, 10);
    console.log(`단지목록 데이터: ${apartmentList.length}개`);

    if (apartmentList.length > 0) {
      const firstApartment = apartmentList[0];
      console.log(`첫 번째 단지: ${firstApartment.kaptName} (코드: ${firstApartment.kaptCode})`);

      console.log('4. 공동주택 기본정보 API 테스트...');
      const basisInfo = await realEstateApi.getApartmentBasisInfo(firstApartment.kaptCode);
      console.log(`기본정보 조회 결과: ${basisInfo ? '성공' : '실패'}`);
      if (basisInfo) {
        console.log(`기본정보: ${basisInfo.kaptName}, 사용승인일: ${basisInfo.kaptUsedate}, 세대수: ${basisInfo.kaptdaCnt}`);
      }

      console.log('5. 공동주택 상세정보 API 테스트...');
      const detailInfo = await realEstateApi.getApartmentDetailInfo(firstApartment.kaptCode);
      console.log(`상세정보 조회 결과: ${detailInfo ? '성공' : '실패'}`);
      if (detailInfo) {
        console.log(`상세정보: 주차대수(지상) ${detailInfo.kaptdPcnt}, 주차대수(지하) ${detailInfo.kaptdPcntu}, 엘리베이터 ${detailInfo.kaptdEcnt}대`);
      }
    }

    console.log('6. 통합 데이터 조회 테스트...');
    const integratedData = await realEstateApi.getIntegratedApartmentData({ LAWD_CD: testParams.bjdCode, DEAL_YMD: testParams.dealYm });
    console.log(`통합 데이터: ${integratedData.length}개`);

    if (integratedData.length > 0) {
      const firstIntegrated = integratedData[0];
      console.log(`통합 데이터 예시:`, {
        name: firstIntegrated.name,
        hasKaptCode: !!firstIntegrated.kaptCode,
        hasFacilities: firstIntegrated.facilities && Object.keys(firstIntegrated.facilities).length > 0,
        hasManagement: firstIntegrated.management && Object.keys(firstIntegrated.management).length > 0,
        hasTransportation: firstIntegrated.transportation && Object.keys(firstIntegrated.transportation).length > 0
      });
    }

    return NextResponse.json({
      success: true,
      summary: {
        '매매실거래가': `${tradeData.length}개`,
        '전월세실거래가': `${rentData.length}개`,
        '단지목록': `${apartmentList.length}개`,
        '기본정보API': apartmentList.length > 0 ? '테스트완료' : '테스트불가',
        '상세정보API': apartmentList.length > 0 ? '테스트완료' : '테스트불가',
        '통합데이터': `${integratedData.length}개`
      },
      details: {
        tradeCount: tradeData.length,
        rentCount: rentData.length,
        apartmentListCount: apartmentList.length,
        integratedCount: integratedData.length,
        sampleApartment: apartmentList[0] || null,
        sampleIntegrated: integratedData[0] || null
      }
    });

  } catch (error) {
    console.error('API 테스트 중 오류:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류',
      details: error
    }, { status: 500 });
  }
}