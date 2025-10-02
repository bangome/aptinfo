import { NextRequest, NextResponse } from 'next/server';

const API_KEY = process.env.NEXT_PUBLIC_DATA_GO_KR_SERVICE_KEY;
const COMMON_COST_BASE_URL = 'https://apis.data.go.kr/1613000/AptCmnuseManageCostServiceV2';
const INDIVIDUAL_COST_BASE_URL = 'https://apis.data.go.kr/1613000/AptIndvdlzManageCostServiceV2';

// 강화된 재시도 로직을 가진 안정적인 fetch 함수
async function fetchWithRetry(url: string, maxRetries: number = 5, delayMs: number = 1000): Promise<Response> {
  let lastError: Error = new Error('Unknown error');
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10초 타임아웃으로 안정성 향상
      
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (compatible; ManagementFeeBot/1.0)',
          'Connection': 'keep-alive',
          'Cache-Control': 'no-cache'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return response;
    } catch (error) {
      lastError = error as Error;
      console.warn(`🔄 Retry ${attempt}/${maxRetries} failed for ${url.split('?')[0].slice(-30)}...: ${lastError.message}`);
      
      if (attempt < maxRetries) {
        // 개선된 백오프 전략: 1초, 2초, 3초, 4초, 5초 대기
        const delay = Math.min(delayMs * attempt, 5000);
        console.log(`⏱️  Waiting ${delay}ms before retry ${attempt + 1}...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw new Error(`❌ Failed after ${maxRetries} attempts: ${lastError.message}`);
}

async function fetchMonthData(kaptCode: string, year: number, month: number): Promise<any | null> {
  const searchDate = `${year}${month.toString().padStart(2, '0')}`;
  const encodedApiKey = encodeURIComponent(API_KEY);
  
  try {
    // 17개 공용관리비 조회 - 재시도 로직 적용된 병렬 처리
    const commonPromises = [
      fetchWithRetry(`${COMMON_COST_BASE_URL}/getHsmpCleaningCostInfoV2?serviceKey=${encodedApiKey}&kaptCode=${kaptCode}&searchDate=${searchDate}&type=json`), // 청소비
      fetchWithRetry(`${COMMON_COST_BASE_URL}/getHsmpGuardCostInfoV2?serviceKey=${encodedApiKey}&kaptCode=${kaptCode}&searchDate=${searchDate}&type=json`), // 경비비
      fetchWithRetry(`${COMMON_COST_BASE_URL}/getHsmpDisinfectionCostInfoV2?serviceKey=${encodedApiKey}&kaptCode=${kaptCode}&searchDate=${searchDate}&type=json`), // 소독비
      fetchWithRetry(`${COMMON_COST_BASE_URL}/getHsmpElevatorMntncCostInfoV2?serviceKey=${encodedApiKey}&kaptCode=${kaptCode}&searchDate=${searchDate}&type=json`), // 승강기유지비
      fetchWithRetry(`${COMMON_COST_BASE_URL}/getHsmpRepairsCostInfoV2?serviceKey=${encodedApiKey}&kaptCode=${kaptCode}&searchDate=${searchDate}&type=json`), // 수선비
      fetchWithRetry(`${COMMON_COST_BASE_URL}/getHsmpFacilityMntncCostInfoV2?serviceKey=${encodedApiKey}&kaptCode=${kaptCode}&searchDate=${searchDate}&type=json`), // 시설유지비
      fetchWithRetry(`${COMMON_COST_BASE_URL}/getHsmpVhcleMntncCostInfoV2?serviceKey=${encodedApiKey}&kaptCode=${kaptCode}&searchDate=${searchDate}&type=json`), // 차량유지비
      fetchWithRetry(`${COMMON_COST_BASE_URL}/getHsmpDisasterPreventionCostInfoV2?serviceKey=${encodedApiKey}&kaptCode=${kaptCode}&searchDate=${searchDate}&type=json`), // 재해예방비
      fetchWithRetry(`${COMMON_COST_BASE_URL}/getHsmpEtcCostInfoV2?serviceKey=${encodedApiKey}&kaptCode=${kaptCode}&searchDate=${searchDate}&type=json`), // 기타 부대비용
      fetchWithRetry(`${COMMON_COST_BASE_URL}/getHsmpOfcrkCostInfoV2?serviceKey=${encodedApiKey}&kaptCode=${kaptCode}&searchDate=${searchDate}&type=json`), // 제사무비
      fetchWithRetry(`${COMMON_COST_BASE_URL}/getHsmpClothingCostInfoV2?serviceKey=${encodedApiKey}&kaptCode=${kaptCode}&searchDate=${searchDate}&type=json`), // 피복비
      fetchWithRetry(`${COMMON_COST_BASE_URL}/getHsmpEduTraingCostInfoV2?serviceKey=${encodedApiKey}&kaptCode=${kaptCode}&searchDate=${searchDate}&type=json`), // 교육훈련비
      fetchWithRetry(`${COMMON_COST_BASE_URL}/getHsmpHomeNetworkMntncCostInfoV2?serviceKey=${encodedApiKey}&kaptCode=${kaptCode}&searchDate=${searchDate}&type=json`), // 지능형 홈네트워크 설비 유지비
      fetchWithRetry(`${COMMON_COST_BASE_URL}/getHsmpSafetyCheckUpCostInfoV2?serviceKey=${encodedApiKey}&kaptCode=${kaptCode}&searchDate=${searchDate}&type=json`), // 안전점검비
      fetchWithRetry(`${COMMON_COST_BASE_URL}/getHsmpConsignManageFeeInfoV2?serviceKey=${encodedApiKey}&kaptCode=${kaptCode}&searchDate=${searchDate}&type=json`), // 위탁관리 수수료
      fetchWithRetry(`${COMMON_COST_BASE_URL}/getHsmpLaborCostInfoV2?serviceKey=${encodedApiKey}&kaptCode=${kaptCode}&searchDate=${searchDate}&type=json`), // 인건비
      fetchWithRetry(`${COMMON_COST_BASE_URL}/getHsmpTaxdueInfoV2?serviceKey=${encodedApiKey}&kaptCode=${kaptCode}&searchDate=${searchDate}&type=json`) // 제세공과금
    ];

    // 10개 개별사용료 조회 - 재시도 로직 적용된 병렬 처리
    const individualPromises = [
      fetchWithRetry(`${INDIVIDUAL_COST_BASE_URL}/getHsmpHeatCostInfoV2?serviceKey=${encodedApiKey}&kaptCode=${kaptCode}&searchDate=${searchDate}&type=json`), // 난방비
      fetchWithRetry(`${INDIVIDUAL_COST_BASE_URL}/getHsmpHotWaterCostInfoV2?serviceKey=${encodedApiKey}&kaptCode=${kaptCode}&searchDate=${searchDate}&type=json`), // 급탕비
      fetchWithRetry(`${INDIVIDUAL_COST_BASE_URL}/getHsmpElectricityCostInfoV2?serviceKey=${encodedApiKey}&kaptCode=${kaptCode}&searchDate=${searchDate}&type=json`), // 전기료
      fetchWithRetry(`${INDIVIDUAL_COST_BASE_URL}/getHsmpWaterCostInfoV2?serviceKey=${encodedApiKey}&kaptCode=${kaptCode}&searchDate=${searchDate}&type=json`), // 수도료
      fetchWithRetry(`${INDIVIDUAL_COST_BASE_URL}/getHsmpGasRentalFeeInfoV2?serviceKey=${encodedApiKey}&kaptCode=${kaptCode}&searchDate=${searchDate}&type=json`), // 가스사용료
      fetchWithRetry(`${INDIVIDUAL_COST_BASE_URL}/getHsmpDomesticWasteFeeInfoV2?serviceKey=${encodedApiKey}&kaptCode=${kaptCode}&searchDate=${searchDate}&type=json`), // 생활폐기물수수료
      fetchWithRetry(`${INDIVIDUAL_COST_BASE_URL}/getHsmpMovingInRepresentationMtgInfoV2?serviceKey=${encodedApiKey}&kaptCode=${kaptCode}&searchDate=${searchDate}&type=json`), // 입주자대표회의운영비
      fetchWithRetry(`${INDIVIDUAL_COST_BASE_URL}/getHsmpBuildingInsuranceFeeInfoV2?serviceKey=${encodedApiKey}&kaptCode=${kaptCode}&searchDate=${searchDate}&type=json`), // 건물보험료
      fetchWithRetry(`${INDIVIDUAL_COST_BASE_URL}/getHsmpElectionOrpnsInfoV2?serviceKey=${encodedApiKey}&kaptCode=${kaptCode}&searchDate=${searchDate}&type=json`), // 선거관리위원회운영비
      fetchWithRetry(`${INDIVIDUAL_COST_BASE_URL}/getHsmpWaterPurifierTankFeeInfoV2?serviceKey=${encodedApiKey}&kaptCode=${kaptCode}&searchDate=${searchDate}&type=json`) // 정화조오물수수료
    ];

    // 배치별로 엔드포인트 요청을 처리하여 안정성 향상
    console.log(`📡 Processing ${commonPromises.length} common + ${individualPromises.length} individual endpoints for ${searchDate}`);
    
    // 공용관리비를 5개씩 배치로 처리
    const commonBatchSize = 5;
    const commonResults = [];
    for (let i = 0; i < commonPromises.length; i += commonBatchSize) {
      const batch = commonPromises.slice(i, i + commonBatchSize);
      const batchResults = await Promise.allSettled(batch);
      commonResults.push(...batchResults);
      
      if (i + commonBatchSize < commonPromises.length) {
        console.log(`⏳ Common batch ${Math.floor(i/commonBatchSize) + 1}/${Math.ceil(commonPromises.length/commonBatchSize)} completed, waiting 500ms...`);
        await new Promise(resolve => setTimeout(resolve, 500)); // 배치 간 대기
      }
    }
    
    // 개별사용료를 5개씩 배치로 처리
    const individualBatchSize = 5;
    const individualResults = [];
    for (let i = 0; i < individualPromises.length; i += individualBatchSize) {
      const batch = individualPromises.slice(i, i + individualBatchSize);
      const batchResults = await Promise.allSettled(batch);
      individualResults.push(...batchResults);
      
      if (i + individualBatchSize < individualPromises.length) {
        console.log(`⏳ Individual batch ${Math.floor(i/individualBatchSize) + 1}/${Math.ceil(individualPromises.length/individualBatchSize)} completed, waiting 500ms...`);
        await new Promise(resolve => setTimeout(resolve, 500)); // 배치 간 대기
      }
    }

    // 안전한 JSON 파싱 함수
    const parseResponse = async (result: PromiseSettledResult<Response>) => {
      if (result.status === 'rejected') {
        console.warn(`API request failed: ${result.reason?.message || 'Unknown error'}`);
        return null;
      }
      
      try {
        const text = await result.value.text();
        const json = JSON.parse(text);
        
        // API 응답 상태 확인
        if (json.response?.header?.resultCode !== '00') {
          console.warn(`API returned error: ${json.response?.header?.resultMsg || 'Unknown API error'}`);
          return null;
        }
        
        return json;
      } catch (error) {
        console.warn(`JSON parsing failed: ${error instanceof Error ? error.message : 'Unknown parsing error'}`);
        return null;
      }
    };

    const [cleaningJson, guardJson, disinfectionJson, elevatorJson, repairsJson, facilityJson, vehicleJson, disasterJson, etcJson, officeJson, clothingJson, educationJson, homeNetworkJson, safetyJson, consignmentJson, laborJson, taxJson] = 
      await Promise.all(commonResults.map(parseResponse));
    
    const [heatJson, hotWaterJson, electricityJson, waterJson, gasJson, wasteJson, meetingJson, insuranceJson, electionJson, purifierJson] = 
      await Promise.all(individualResults.map(parseResponse));

    // 성공률 추적
    const commonSuccessCount = commonResults.filter(r => r.status === 'fulfilled').length;
    const individualSuccessCount = individualResults.filter(r => r.status === 'fulfilled').length;
    const totalEndpoints = commonResults.length + individualResults.length;
    const successfulEndpoints = commonSuccessCount + individualSuccessCount;
    const successRate = ((successfulEndpoints / totalEndpoints) * 100).toFixed(1);
    
    console.log(`${year}-${month.toString().padStart(2, '0')} API Success Rate: ${successRate}% (${successfulEndpoints}/${totalEndpoints} endpoints)`);
    console.log(`  Common: ${commonSuccessCount}/${commonResults.length}, Individual: ${individualSuccessCount}/${individualResults.length}`);

    // 데이터 추출
    const cleaningItem = cleaningJson?.response?.body?.item;
    const guardItem = guardJson?.response?.body?.item;
    const disinfectionItem = disinfectionJson?.response?.body?.item;
    const elevatorItem = elevatorJson?.response?.body?.item;
    const repairsItem = repairsJson?.response?.body?.item;
    const facilityItem = facilityJson?.response?.body?.item;
    const vehicleItem = vehicleJson?.response?.body?.item;
    const disasterItem = disasterJson?.response?.body?.item;
    const etcItem = etcJson?.response?.body?.item;
    const officeItem = officeJson?.response?.body?.item;
    const clothingItem = clothingJson?.response?.body?.item;
    const educationItem = educationJson?.response?.body?.item;
    const homeNetworkItem = homeNetworkJson?.response?.body?.item;
    const safetyItem = safetyJson?.response?.body?.item;
    const consignmentItem = consignmentJson?.response?.body?.item;
    const laborItem = laborJson?.response?.body?.item;
    const taxItem = taxJson?.response?.body?.item;
    const heatItem = heatJson?.response?.body?.item;
    const hotWaterItem = hotWaterJson?.response?.body?.item;
    const electricityItem = electricityJson?.response?.body?.item;
    const waterItem = waterJson?.response?.body?.item;
    const gasItem = gasJson?.response?.body?.item;
    const wasteItem = wasteJson?.response?.body?.item;
    const meetingItem = meetingJson?.response?.body?.item;
    const insuranceItem = insuranceJson?.response?.body?.item;
    const electionItem = electionJson?.response?.body?.item;
    const purifierItem = purifierJson?.response?.body?.item;

    // 공용관리비 계산 (모든 17개 엔드포인트 포함)
    const commonFee =
      parseInt(cleaningItem?.cleanCost || 0) +
      parseInt(guardItem?.guardCost || 0) +
      parseInt(disinfectionItem?.disinfCost || 0) +
      parseInt(elevatorItem?.elevCost || 0) +
      parseInt(repairsItem?.lrefCost1 || 0) +
      parseInt(facilityItem?.lrefCost2 || 0) +
      parseInt(vehicleItem?.fuelCost || 0) +
      parseInt(vehicleItem?.refairCost || 0) +
      parseInt(vehicleItem?.carInsurance || 0) +
      parseInt(vehicleItem?.carEtc || 0) +
      parseInt(disasterItem?.lrefCost4 || 0) + // 재해예방비
      parseInt(etcItem?.careItemCost || 0) + // 기타 부대비용 - 관리항목비
      parseInt(etcItem?.accountingCost || 0) + // 기타 부대비용 - 회계비
      parseInt(etcItem?.hiddenCost || 0) + // 기타 부대비용 - 잡비
      parseInt(officeItem?.officeSupply || 0) + // 제사무비 - 사무용품비
      parseInt(officeItem?.bookSupply || 0) + // 제사무비 - 도서인쇄비
      parseInt(officeItem?.transportCost || 0) + // 제사무비 - 여비교통비
      parseInt(clothingItem?.clothesCost || 0) + // 피복비
      parseInt(educationItem?.eduCost || 0) + // 교육훈련비
      parseInt(homeNetworkItem?.hnetwCost || 0) + // 지능형 홈네트워크 설비 유지비
      parseInt(safetyItem?.lrefCost3 || 0) + // 안전점검비
      parseInt(consignmentItem?.manageCost || 0) + // 위탁관리 수수료
      parseInt(laborItem?.pay || 0) + // 인건비 - 급여
      parseInt(laborItem?.sundryCost || 0) + // 인건비 - 제잡비
      parseInt(laborItem?.bonus || 0) + // 인건비 - 상여금
      parseInt(laborItem?.pension || 0) + // 인건비 - 퇴직금
      parseInt(laborItem?.accidentPremium || 0) + // 인건비 - 산재보험료
      parseInt(laborItem?.employPremium || 0) + // 인건비 - 고용보험료
      parseInt(laborItem?.nationalPension || 0) + // 인건비 - 국민연금
      parseInt(laborItem?.healthPremium || 0) + // 인건비 - 건강보험료
      parseInt(laborItem?.welfareBenefit || 0) + // 인건비 - 복리후생비
      parseInt(taxItem?.electCost || 0) + // 제세공과금 - 전기료
      parseInt(taxItem?.telCost || 0) + // 제세공과금 - 통신비
      parseInt(taxItem?.postageCost || 0) + // 제세공과금 - 우편료
      parseInt(taxItem?.taxrestCost || 0); // 제세공과금 - 제세공과금

    // 개별사용료 계산 (모든 10개 엔드포인트 포함)
    const individualFee =
      parseInt(heatItem?.heatC || 0) +
      parseInt(heatItem?.heatP || 0) +
      parseInt(hotWaterItem?.waterHotC || 0) +
      parseInt(hotWaterItem?.waterHotP || 0) +
      parseInt(electricityItem?.electC || 0) +
      parseInt(electricityItem?.electP || 0) +
      parseInt(waterItem?.waterCoolC || 0) +
      parseInt(waterItem?.waterCoolP || 0) +
      parseInt(gasItem?.gasC || 0) +
      parseInt(gasItem?.gasP || 0) +
      parseInt(wasteItem?.scrap || 0) + // 생활폐기물수수료
      parseInt(meetingItem?.preMeet || 0) + // 입주자대표회의운영비
      parseInt(insuranceItem?.buildInsu || 0) + // 건물보험료
      parseInt(electionItem?.electionMng || 0) + // 선거관리위원회운영비
      parseInt(purifierItem?.purifi || 0); // 정화조오물수수료

    // 데이터가 없으면 null 반환
    if (commonFee === 0 && individualFee === 0) {
      return null;
    }

    return {
      kaptCode,
      kaptName: cleaningItem?.kaptName || guardItem?.kaptName || laborItem?.kaptName || heatItem?.kaptName || '',
      year,
      month,
      commonFee,
      individualFee,
      totalFee: commonFee + individualFee
    };
  } catch (error) {
    console.error(`Error fetching data for ${year}-${month}:`, error);
    return null;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { kaptCode: string } }
) {
  const searchParams = request.nextUrl.searchParams;
  const year = searchParams.get('year');
  const kaptCode = params.kaptCode;

  if (!kaptCode) {
    return NextResponse.json(
      { error: 'kaptCode is required' },
      { status: 400 }
    );
  }

  if (!API_KEY) {
    return NextResponse.json(
      { error: 'API key is not configured' },
      { status: 500 }
    );
  }

  const targetYear = year ? parseInt(year) : 2024;

  try {
    console.log(`🚀 Starting optimized data collection for ${kaptCode} (${targetYear})`);
    console.time(`Data collection for ${kaptCode}`);
    
    // 12개월 데이터를 병렬로 조회 - 배치 크기 제한으로 안정성 확보
    const batchSize = 2; // 동시 처리할 월 수 제한 (네트워크 안정성을 위해 감소)
    const batches = [];
    
    for (let i = 0; i < 12; i += batchSize) {
      const batch = [];
      for (let j = i; j < Math.min(i + batchSize, 12); j++) {
        batch.push(fetchMonthData(kaptCode, targetYear, j + 1));
      }
      batches.push(batch);
    }
    
    // 배치별로 순차 실행하되, 각 배치 내에서는 병렬 실행
    const monthlyData = [];
    for (let i = 0; i < batches.length; i++) {
      console.log(`📊 Processing batch ${i + 1}/${batches.length} (months ${i * batchSize + 1}-${Math.min((i + 1) * batchSize, 12)})`);
      const batchResults = await Promise.all(batches[i]);
      monthlyData.push(...batchResults);
    }
    
    // null이 아닌 데이터만 필터링
    const validData = monthlyData.filter(data => data !== null);
    
    if (validData.length === 0) {
      return NextResponse.json({
        kaptCode,
        kaptName: '',
        year: targetYear,
        avgCommonFee: 0,
        avgIndividualFee: 0,
        avgTotalFee: 0,
        monthlyData: []
      });
    }

    // 평균 계산
    const totalCommon = validData.reduce((sum, data) => sum + data.commonFee, 0);
    const totalIndividual = validData.reduce((sum, data) => sum + data.individualFee, 0);
    const totalFee = validData.reduce((sum, data) => sum + data.totalFee, 0);
    const count = validData.length;

    console.timeEnd(`Data collection for ${kaptCode}`);
    console.log(`✅ Completed: ${validData.length}/12 months successful`);

    return NextResponse.json({
      kaptCode,
      kaptName: validData[0]?.kaptName || '',
      year: targetYear,
      avgCommonFee: Math.round(totalCommon / count),
      avgIndividualFee: Math.round(totalIndividual / count),
      avgTotalFee: Math.round(totalFee / count),
      minTotalFee: Math.min(...validData.map(d => d.totalFee)),
      maxTotalFee: Math.max(...validData.map(d => d.totalFee)),
      monthlyData: validData,
      dataCount: validData.length
    });

  } catch (error) {
    console.error('Error fetching management fee data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch management fee data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}