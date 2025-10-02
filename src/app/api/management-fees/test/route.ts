import { NextRequest, NextResponse } from 'next/server';

const API_KEY = process.env.NEXT_PUBLIC_DATA_GO_KR_SERVICE_KEY || '';
const COMMON_COST_BASE_URL = 'https://apis.data.go.kr/1613000/AptCmnuseManageCostServiceV2';
const INDIVIDUAL_COST_BASE_URL = 'https://apis.data.go.kr/1613000/AptIndvdlzManageCostServiceV2';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const kaptCode = searchParams.get('kaptCode') || 'A13376906';
  const year = parseInt(searchParams.get('year') || '2023');
  const month = parseInt(searchParams.get('month') || '1');

  const searchDate = `${year}${month.toString().padStart(2, '0')}`;

  try {
    if (!API_KEY) {
      console.error('API_KEY is not defined');
      return NextResponse.json(
        { error: 'API key is not configured' },
        { status: 500 }
      );
    }
    
    const encodedApiKey = encodeURIComponent(API_KEY);
    console.log('Using API Key (first 10 chars):', API_KEY.substring(0, 10) + '...');

    // 아파트 세대수 정보 조회 (데이터베이스에서)
    let householdCount = null;
    try {
      // Supabase 클라이언트 생성은 여기서는 간단히 fetch로 처리
      // 실제로는 Supabase 클라이언트를 사용해야 하지만, 임시로 하드코딩
      if (kaptCode === 'A13376906') {
        householdCount = 1150; // 응봉대림강변 세대수
      }
    } catch (dbError) {
      console.log('세대수 정보 조회 실패:', dbError);
    }

    // 공용관리비 조회
    const [cleaningRes, guardRes, disinfectionRes, elevatorRes, repairsRes, facilityRes, vehicleRes] = await Promise.all([
      // 청소비
      fetch(`${COMMON_COST_BASE_URL}/getHsmpCleaningCostInfoV2?serviceKey=${encodedApiKey}&kaptCode=${kaptCode}&searchDate=${searchDate}&type=json`),
      // 경비비
      fetch(`${COMMON_COST_BASE_URL}/getHsmpGuardCostInfoV2?serviceKey=${encodedApiKey}&kaptCode=${kaptCode}&searchDate=${searchDate}&type=json`),
      // 소독비
      fetch(`${COMMON_COST_BASE_URL}/getHsmpDisinfectionCostInfoV2?serviceKey=${encodedApiKey}&kaptCode=${kaptCode}&searchDate=${searchDate}&type=json`),
      // 승강기유지비
      fetch(`${COMMON_COST_BASE_URL}/getHsmpElevatorMntncCostInfoV2?serviceKey=${encodedApiKey}&kaptCode=${kaptCode}&searchDate=${searchDate}&type=json`),
      // 수선비
      fetch(`${COMMON_COST_BASE_URL}/getHsmpRepairsCostInfoV2?serviceKey=${encodedApiKey}&kaptCode=${kaptCode}&searchDate=${searchDate}&type=json`),
      // 시설유지비
      fetch(`${COMMON_COST_BASE_URL}/getHsmpFacilityMntncCostInfoV2?serviceKey=${encodedApiKey}&kaptCode=${kaptCode}&searchDate=${searchDate}&type=json`),
      // 차량유지비
      fetch(`${COMMON_COST_BASE_URL}/getHsmpVhcleMntncCostInfoV2?serviceKey=${encodedApiKey}&kaptCode=${kaptCode}&searchDate=${searchDate}&type=json`)
    ]);

    // 개별사용료 조회
    const [heatRes, hotWaterRes, electricityRes, waterRes, gasRes] = await Promise.all([
      // 난방비
      fetch(`${INDIVIDUAL_COST_BASE_URL}/getHsmpHeatCostInfoV2?serviceKey=${encodedApiKey}&kaptCode=${kaptCode}&searchDate=${searchDate}&type=json`),
      // 급탕비
      fetch(`${INDIVIDUAL_COST_BASE_URL}/getHsmpHotWaterCostInfoV2?serviceKey=${encodedApiKey}&kaptCode=${kaptCode}&searchDate=${searchDate}&type=json`),
      // 전기료
      fetch(`${INDIVIDUAL_COST_BASE_URL}/getHsmpElectricityCostInfoV2?serviceKey=${encodedApiKey}&kaptCode=${kaptCode}&searchDate=${searchDate}&type=json`),
      // 수도료
      fetch(`${INDIVIDUAL_COST_BASE_URL}/getHsmpWaterCostInfoV2?serviceKey=${encodedApiKey}&kaptCode=${kaptCode}&searchDate=${searchDate}&type=json`),
      // 가스사용료
      fetch(`${INDIVIDUAL_COST_BASE_URL}/getHsmpGasRentalFeeInfoV2?serviceKey=${encodedApiKey}&kaptCode=${kaptCode}&searchDate=${searchDate}&type=json`)
    ]);

    // Helper function to safely parse response
    const parseResponse = async (response: Response, name: string) => {
      const text = await response.text();
      try {
        const json = JSON.parse(text);
        if (json.response?.header?.resultCode !== '00') {
          console.error(`${name} API error:`, json.response?.header);
        }
        return json;
      } catch (e) {
        console.error(`${name} failed to parse JSON. Response:`, text.substring(0, 200));
        // Check if it's an XML error response
        if (text.includes('SERVICE_KEY_IS_NOT_REGISTERED_ERROR')) {
          throw new Error('API key is not registered or invalid');
        }
        return null;
      }
    };

    // Parse all responses
    const [cleaningJson, guardJson, disinfectionJson, elevatorJson, repairsJson, facilityJson, vehicleJson, heatJson, hotWaterJson, electricityJson, waterJson, gasJson] = await Promise.all([
      parseResponse(cleaningRes, 'Cleaning'),
      parseResponse(guardRes, 'Guard'),
      parseResponse(disinfectionRes, 'Disinfection'),
      parseResponse(elevatorRes, 'Elevator'),
      parseResponse(repairsRes, 'Repairs'),
      parseResponse(facilityRes, 'Facility'),
      parseResponse(vehicleRes, 'Vehicle'),
      parseResponse(heatRes, 'Heat'),
      parseResponse(hotWaterRes, 'HotWater'),
      parseResponse(electricityRes, 'Electricity'),
      parseResponse(waterRes, 'Water'),
      parseResponse(gasRes, 'Gas')
    ]);

    // 데이터 추출
    const cleaningItem = cleaningJson?.response?.body?.item;
    const guardItem = guardJson?.response?.body?.item;
    const disinfectionItem = disinfectionJson?.response?.body?.item;
    const elevatorItem = elevatorJson?.response?.body?.item;
    const repairsItem = repairsJson?.response?.body?.item;
    const facilityItem = facilityJson?.response?.body?.item;
    const vehicleItem = vehicleJson?.response?.body?.item;
    const heatItem = heatJson?.response?.body?.item;
    const hotWaterItem = hotWaterJson?.response?.body?.item;
    const electricityItem = electricityJson?.response?.body?.item;
    const waterItem = waterJson?.response?.body?.item;
    const gasItem = gasJson?.response?.body?.item;

    // 공용관리비 계산
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
      parseInt(vehicleItem?.carEtc || 0);

    // 개별사용료 계산
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
      parseInt(gasItem?.gasP || 0);

    return NextResponse.json({
      kaptCode,
      kaptName: cleaningItem?.kaptName || '',
      year,
      month,
      searchDate,
      commonFee,
      individualFee,
      totalFee: commonFee + individualFee,
      householdCount,
      perHouseholdFee: {
        common: householdCount ? Math.round(commonFee / householdCount) : null,
        individual: householdCount ? Math.round(individualFee / householdCount) : null,
        total: householdCount ? Math.round((commonFee + individualFee) / householdCount) : null
      },
      details: {
        common: {
          cleaning: parseInt(cleaningItem?.cleanCost || 0),
          guard: parseInt(guardItem?.guardCost || 0),
          disinfection: parseInt(disinfectionItem?.disinfCost || 0),
          elevator: parseInt(elevatorItem?.elevCost || 0),
          repairs: parseInt(repairsItem?.lrefCost1 || 0),
          facility: parseInt(facilityItem?.lrefCost2 || 0),
          vehicle: {
            fuel: parseInt(vehicleItem?.fuelCost || 0),
            repair: parseInt(vehicleItem?.refairCost || 0),
            insurance: parseInt(vehicleItem?.carInsurance || 0),
            etc: parseInt(vehicleItem?.carEtc || 0)
          }
        },
        individual: {
          heat: {
            supply: parseInt(heatItem?.heatC || 0),
            usage: parseInt(heatItem?.heatP || 0)
          },
          hotWater: {
            supply: parseInt(hotWaterItem?.waterHotC || 0),
            usage: parseInt(hotWaterItem?.waterHotP || 0)
          },
          electricity: {
            supply: parseInt(electricityItem?.electC || 0),
            usage: parseInt(electricityItem?.electP || 0)
          },
          water: {
            supply: parseInt(waterItem?.waterCoolC || 0),
            usage: parseInt(waterItem?.waterCoolP || 0)
          },
          gas: {
            supply: parseInt(gasItem?.gasC || 0),
            usage: parseInt(gasItem?.gasP || 0)
          }
        }
      }
    });

  } catch (error) {
    console.error('Error fetching management fee:', error);
    return NextResponse.json(
      { error: 'Failed to fetch management fee data', details: error.message },
      { status: 500 }
    );
  }
}