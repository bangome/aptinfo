/**
 * 수동 데이터 동기화 API 엔드포인트
 * 관리자가 즉시 데이터를 동기화할 수 있도록 지원
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDataSyncService } from '@/services/dataSyncService';
import { normalizeError, logError } from '@/lib/error-handling';

/**
 * 수동 데이터 동기화 실행
 * POST /api/admin/sync-data
 * Body: { type: 'trade' | 'rent' | 'full', regionCode?: string, dealYmd?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, regionCode, dealYmd } = body;

    const dataSyncService = getDataSyncService();

    // 이미 동기화 작업이 실행 중인지 확인
    if (dataSyncService.isSyncRunning()) {
      return NextResponse.json({
        success: false,
        error: '동기화 작업이 이미 실행 중입니다. 완료될 때까지 기다려주세요.',
        code: 'SYNC_ALREADY_RUNNING'
      }, { status: 409 });
    }

    let result;

    switch (type) {
      case 'trade':
        // 매매 실거래 동기화
        if (!regionCode || !dealYmd) {
          return NextResponse.json({
            success: false,
            error: '지역코드(regionCode)와 거래년월(dealYmd)이 필요합니다.',
            code: 'MISSING_PARAMETERS'
          }, { status: 400 });
        }
        result = await dataSyncService.syncApartmentTradeData(regionCode, dealYmd);
        break;

      case 'rent':
        // 전월세 실거래 동기화
        if (!regionCode || !dealYmd) {
          return NextResponse.json({
            success: false,
            error: '지역코드(regionCode)와 거래년월(dealYmd)이 필요합니다.',
            code: 'MISSING_PARAMETERS'
          }, { status: 400 });
        }
        result = await dataSyncService.syncApartmentRentData(regionCode, dealYmd);
        break;

      case 'full':
        // 전체 동기화 (최근 3개월, 전국 모든 지역)
        const fullDate = new Date();
        const months = [];

        // 최근 3개월 생성
        for (let i = 0; i < 3; i++) {
          const d = new Date(fullDate);
          d.setMonth(d.getMonth() - i);
          months.push(d.getFullYear().toString() + (d.getMonth() + 1).toString().padStart(2, '0'));
        }

        // 전국 주요 시도의 대표 시군구 코드
        const fullRegions = [
          // 서울특별시
          '11110', '11140', '11170', '11200', '11215', '11230', '11260', '11290',
          '11305', '11320', '11350', '11380', '11410', '11440', '11470', '11500',
          '11530', '11545', '11560', '11590', '11620', '11650', '11680', '11710', '11740',
          // 부산광역시
          '26110', '26140', '26170', '26200', '26230', '26260', '26290', '26320',
          '26350', '26380', '26410', '26440', '26470', '26500', '26530', '26710',
          // 대구광역시
          '27110', '27140', '27170', '27200', '27230', '27260', '27290', '27710',
          // 인천광역시
          '28110', '28140', '28177', '28185', '28200', '28237', '28245', '28260', '28710', '28720',
          // 광주광역시
          '29110', '29140', '29155', '29170', '29200',
          // 대전광역시
          '30110', '30140', '30170', '30200', '30230',
          // 울산광역시
          '31110', '31140', '31170', '31200', '31710',
          // 세종특별자치시
          '36110',
          // 경기도 주요 도시
          '41111', '41113', '41115', '41117', '41131', '41133', '41135', '41150',
          '41171', '41173', '41190', '41210', '41220', '41250', '41271', '41273',
          '41281', '41285', '41287', '41290', '41310', '41360', '41370', '41390',
          '41410', '41430', '41450', '41461', '41463', '41465', '41480', '41500',
          '41550', '41570', '41590', '41610', '41630', '41650', '41670', '41800', '41820', '41830',
          // 강원도 주요 도시
          '42110', '42130', '42150', '42170', '42190', '42210', '42230', '42720',
          '42750', '42760', '42770', '42780', '42790', '42800', '42810', '42820', '42830', '42850',
          // 충청북도
          '43111', '43112', '43113', '43114', '43130', '43150', '43720', '43730',
          '43740', '43745', '43750', '43760', '43770', '43800',
          // 충청남도
          '44131', '44133', '44150', '44180', '44200', '44210', '44230', '44250',
          '44270', '44710', '44760', '44770', '44790', '44800', '44810', '44825',
          // 전라북도
          '45111', '45113', '45130', '45140', '45180', '45190', '45210', '45710',
          '45720', '45730', '45750', '45770', '45790', '45800', '45810',
          // 전라남도
          '46110', '46130', '46150', '46170', '46230', '46710', '46720', '46730',
          '46770', '46780', '46790', '46800', '46810', '46820', '46830', '46840',
          '46860', '46870', '46880', '46890', '46900', '46910',
          // 경상북도
          '47111', '47113', '47130', '47150', '47170', '47190', '47210', '47230',
          '47250', '47280', '47290', '47720', '47730', '47750', '47760', '47770',
          '47820', '47830', '47840', '47850', '47900', '47920', '47930', '47940',
          // 경상남도
          '48121', '48123', '48125', '48127', '48129', '48170', '48220', '48240',
          '48250', '48270', '48310', '48330', '48720', '48730', '48740', '48820',
          '48840', '48850', '48860', '48870', '48880', '48890',
          // 제주특별자치도
          '50110', '50130'
        ];

        const fullStats = [];
        let fullCompleted = 0;
        const fullTotal = fullRegions.length * months.length * 2; // 지역 * 개월 * (매매 + 전월세)

        for (const month of months) {
          for (const region of fullRegions) {
            try {
              const tradeStats = await dataSyncService.syncApartmentTradeData(region, month);
              fullStats.push({ type: 'trade', region, month, ...tradeStats });
              fullCompleted++;
            } catch (error) {
              console.error(`지역 ${region} ${month} 매매 동기화 실패:`, error);
              fullCompleted++;
            }

            try {
              const rentStats = await dataSyncService.syncApartmentRentData(region, month);
              fullStats.push({ type: 'rent', region, month, ...rentStats });
              fullCompleted++;
            } catch (error) {
              console.error(`지역 ${region} ${month} 전월세 동기화 실패:`, error);
              fullCompleted++;
            }
          }
        }

        result = {
          success: true,
          stats: fullStats,
          errors: [],
          completed: fullCompleted,
          total: fullTotal
        };
        break;

      case 'complexes':
        // 시군구별 단지 정보 수집
        if (!regionCode) {
          return NextResponse.json({
            success: false,
            error: '시군구 코드(regionCode)가 필요합니다. (예: 41113, 41131)',
            code: 'MISSING_PARAMETERS'
          }, { status: 400 });
        }
        result = await dataSyncService.syncApartmentComplexesByRegion(regionCode);
        break;

      case 'recent':
        // 최근 1개월 전국 모든 지역 동기화
        const currentDate = new Date();
        const currentYearMonth = currentDate.getFullYear().toString() +
                                (currentDate.getMonth() + 1).toString().padStart(2, '0');

        // 전국 주요 시도의 대표 시군구 코드 (모든 광역시/도)
        const allRegions = [
          // 서울특별시
          '11110', '11140', '11170', '11200', '11215', '11230', '11260', '11290',
          '11305', '11320', '11350', '11380', '11410', '11440', '11470', '11500',
          '11530', '11545', '11560', '11590', '11620', '11650', '11680', '11710', '11740',
          // 부산광역시
          '26110', '26140', '26170', '26200', '26230', '26260', '26290', '26320',
          '26350', '26380', '26410', '26440', '26470', '26500', '26530', '26710',
          // 대구광역시
          '27110', '27140', '27170', '27200', '27230', '27260', '27290', '27710',
          // 인천광역시
          '28110', '28140', '28177', '28185', '28200', '28237', '28245', '28260', '28710', '28720',
          // 광주광역시
          '29110', '29140', '29155', '29170', '29200',
          // 대전광역시
          '30110', '30140', '30170', '30200', '30230',
          // 울산광역시
          '31110', '31140', '31170', '31200', '31710',
          // 세종특별자치시
          '36110',
          // 경기도 주요 도시
          '41111', '41113', '41115', '41117', '41131', '41133', '41135', '41150',
          '41171', '41173', '41190', '41210', '41220', '41250', '41271', '41273',
          '41281', '41285', '41287', '41290', '41310', '41360', '41370', '41390',
          '41410', '41430', '41450', '41461', '41463', '41465', '41480', '41500',
          '41550', '41570', '41590', '41610', '41630', '41650', '41670', '41800', '41820', '41830',
          // 강원도 주요 도시
          '42110', '42130', '42150', '42170', '42190', '42210', '42230', '42720',
          '42750', '42760', '42770', '42780', '42790', '42800', '42810', '42820', '42830', '42850',
          // 충청북도
          '43111', '43112', '43113', '43114', '43130', '43150', '43720', '43730',
          '43740', '43745', '43750', '43760', '43770', '43800',
          // 충청남도
          '44131', '44133', '44150', '44180', '44200', '44210', '44230', '44250',
          '44270', '44710', '44760', '44770', '44790', '44800', '44810', '44825',
          // 전라북도
          '45111', '45113', '45130', '45140', '45180', '45190', '45210', '45710',
          '45720', '45730', '45750', '45770', '45790', '45800', '45810',
          // 전라남도
          '46110', '46130', '46150', '46170', '46230', '46710', '46720', '46730',
          '46770', '46780', '46790', '46800', '46810', '46820', '46830', '46840',
          '46860', '46870', '46880', '46890', '46900', '46910',
          // 경상북도
          '47111', '47113', '47130', '47150', '47170', '47190', '47210', '47230',
          '47250', '47280', '47290', '47720', '47730', '47750', '47760', '47770',
          '47820', '47830', '47840', '47850', '47900', '47920', '47930', '47940',
          // 경상남도
          '48121', '48123', '48125', '48127', '48129', '48170', '48220', '48240',
          '48250', '48270', '48310', '48330', '48720', '48730', '48740', '48820',
          '48840', '48850', '48860', '48870', '48880', '48890',
          // 제주특별자치도
          '50110', '50130'
        ];

        const stats = [];
        let completed = 0;
        const total = allRegions.length * 2; // 매매 + 전월세

        for (const region of allRegions) {
          try {
            const tradeStats = await dataSyncService.syncApartmentTradeData(region, currentYearMonth);
            stats.push({ type: 'trade', region, ...tradeStats });
            completed++;
          } catch (error) {
            console.error(`지역 ${region} 매매 동기화 실패:`, error);
            completed++;
          }

          try {
            const rentStats = await dataSyncService.syncApartmentRentData(region, currentYearMonth);
            stats.push({ type: 'rent', region, ...rentStats });
            completed++;
          } catch (error) {
            console.error(`지역 ${region} 전월세 동기화 실패:`, error);
            completed++;
          }
        }

        result = {
          success: true,
          stats,
          errors: [],
          completed,
          total
        };
        break;

      default:
        return NextResponse.json({
          success: false,
          error: '잘못된 동기화 타입입니다. trade, rent, complexes, recent, full 중 하나를 선택하세요.',
          code: 'INVALID_TYPE'
        }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: '데이터 동기화가 완료되었습니다.',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    const normalizedError = normalizeError(error);
    logError(normalizedError, { endpoint: '/api/admin/sync-data', method: 'POST' });

    return NextResponse.json({
      success: false,
      error: normalizedError.userMessage,
      code: normalizedError.code
    }, { status: 500 });
  }
}

/**
 * 현재 동기화 상태 조회
 * GET /api/admin/sync-data
 */
export async function GET(request: NextRequest) {
  try {
    const dataSyncService = getDataSyncService();
    const isRunning = dataSyncService.isSyncRunning();

    return NextResponse.json({
      success: true,
      data: {
        isRunning,
        message: isRunning ? '동기화 작업이 실행 중입니다.' : '동기화 작업이 대기 중입니다.'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    const normalizedError = normalizeError(error);
    logError(normalizedError, { endpoint: '/api/admin/sync-data', method: 'GET' });

    return NextResponse.json({
      success: false,
      error: normalizedError.userMessage,
      code: normalizedError.code
    }, { status: 500 });
  }
}
