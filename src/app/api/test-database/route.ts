import { NextRequest, NextResponse } from 'next/server';
import { databaseService } from '@/services/databaseService';
import { realEstateApi } from '@/lib/api/real-estate-api';

export async function POST(request: NextRequest) {
  try {
    console.log('=== 데이터베이스 테스트 시작 ===');

    // 1. 실제 API에서 데이터 가져오기
    console.log('1. 정부 API에서 실제 데이터 가져오는 중...');
    const apiParams = {
      LAWD_CD: '11680', // 강남구
      DEAL_YMD: realEstateApi.getCurrentYearMonth(),
      numOfRows: 3
    };

    const integratedData = await realEstateApi.getIntegratedApartmentData(apiParams);
    console.log(`API에서 ${integratedData.length}개 아파트 데이터 수집`);

    if (integratedData.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'API에서 데이터를 가져올 수 없습니다.'
      }, { status: 400 });
    }

    // 2. 첫 번째 아파트 데이터로 데이터베이스 테스트
    const firstApartment = integratedData[0];
    console.log('2. 데이터베이스에 샘플 데이터 삽입 중...');

    // 아파트 단지 정보 삽입
    const complexResult = await databaseService.findOrCreateApartmentComplex(
      firstApartment.name,
      firstApartment.address,
      firstApartment.region
    );

    if (!complexResult.success) {
      return NextResponse.json({
        success: false,
        error: '아파트 단지 정보 삽입 실패: ' + ('error' in complexResult ? complexResult.error : '알 수 없는 오류')
      }, { status: 500 });
    }

    console.log(`아파트 단지 ${'created' in complexResult && complexResult.created ? '생성' : '조회'}: ${firstApartment.name}`);

    // 매매 거래 정보 삽입 (있는 경우)
    const tradeResults: any[] = [];
    console.log('3. 매매 거래 정보 삽입 테스트 - 현재 비활성화 (IntegratedApartmentData 구조 변경으로 인해)');

    // 전월세 거래 정보 삽입 (있는 경우)
    const rentResults: any[] = [];
    console.log('4. 전월세 거래 정보 삽입 테스트 - 현재 비활성화 (IntegratedApartmentData 구조 변경으로 인해)');

    // 5. 데이터 조회 테스트
    console.log('5. 데이터베이스에서 데이터 조회 테스트...');
    const queryResult = await databaseService.getApartmentComplexes({
      region: firstApartment.region,
      limit: 5
    });

    if (!queryResult.success) {
      return NextResponse.json({
        success: false,
        error: '데이터 조회 실패: ' + ('error' in queryResult ? queryResult.error : '알 수 없는 오류')
      }, { status: 500 });
    }

    console.log(`데이터베이스에서 ${queryResult.data.length}개 아파트 단지 조회됨`);

    return NextResponse.json({
      success: true,
      message: '데이터베이스 테스트 완료',
      results: {
        complex: {
          created: 'created' in complexResult ? complexResult.created : false,
          data: complexResult.data
        },
        trades: {
          count: tradeResults.length,
          data: tradeResults
        },
        rents: {
          count: rentResults.length,
          data: rentResults
        },
        query: {
          count: queryResult.data.length,
          data: queryResult.data
        }
      }
    });

  } catch (error) {
    console.error('데이터베이스 테스트 실패:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 });
  }
}