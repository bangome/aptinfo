import { NextRequest, NextResponse } from 'next/server';
import { realEstateApi } from '@/lib/api/real-estate-api';

export async function GET(request: NextRequest) {
  try {
    console.log('=== 단지목록 API 테스트 시작 ===');

    // Try different area codes
    const testCodes = ['11680', '11590', '11440']; // 강남구, 동작구, 마포구

    for (const bjdCode of testCodes) {
      console.log(`\n${bjdCode} 지역 테스트 중...`);
      try {
        const apartmentList = await realEstateApi.getApartmentListByBjdCode(bjdCode, 1, 5);
        console.log(`${bjdCode}: ${apartmentList.length}개 단지 발견`);

        if (apartmentList.length > 0) {
          const first = apartmentList[0];
          console.log(`첫 번째 단지: ${first.kaptName} (코드: ${first.kaptCode})`);

          // Test basic info API
          const basisInfo = await realEstateApi.getApartmentBasisInfo(first.kaptCode);
          console.log(`기본정보 API: ${basisInfo ? '성공' : '실패'}`);

          if (basisInfo) {
            console.log(`기본정보: 사용승인일=${basisInfo.kaptUsedate}, 세대수=${basisInfo.kaptdaCnt}`);
          }

          // Test detail info API
          const detailInfo = await realEstateApi.getApartmentDetailInfo(first.kaptCode);
          console.log(`상세정보 API: ${detailInfo ? '성공' : '실패'}`);

          if (detailInfo) {
            console.log(`상세정보: 엘리베이터=${detailInfo.kaptdEcnt}, CCTV=${detailInfo.kaptdCccnt}`);
          }

          break; // Found working data, stop testing
        }
      } catch (error) {
        console.error(`${bjdCode} 테스트 오류:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      message: '단지목록 API 테스트 완료. 콘솔 로그를 확인하세요.'
    });

  } catch (error) {
    console.error('단지목록 API 테스트 실패:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 });
  }
}