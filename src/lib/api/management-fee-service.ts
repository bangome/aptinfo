/**
 * 공동주택 관리비 정보 수집 서비스
 * - 공용관리비 (AptCmnuseManageCostServiceV2)
 * - 개별사용료 (AptIndvdlzManageCostServiceV2)
 */

const API_KEY = process.env.NEXT_PUBLIC_DATA_GO_KR_SERVICE_KEY;

// 공용관리비 API 베이스 URL
const COMMON_COST_BASE_URL = 'https://apis.data.go.kr/1613000/AptCmnuseManageCostServiceV2';

// 개별사용료 API 베이스 URL
const INDIVIDUAL_COST_BASE_URL = 'https://apis.data.go.kr/1613000/AptIndvdlzManageCostServiceV2';

export interface CommonManagementFee {
  kaptCode: string;
  kaptName: string;
  searchDate: string;
  // 공용관리비 항목들
  cleanCost?: number;      // 청소비
  disinfectCost?: number;   // 소독비
  elevatorCost?: number;    // 승강기유지비
  facilityCost?: number;    // 시설유지비
  guardCost?: number;       // 경비비
  generalCost?: number;     // 일반관리비
  repairCost?: number;      // 수선유지비
  // 차량유지비 관련
  fuelCost?: number;        // 연료비
  refairCost?: number;      // 수리비
  carInsurance?: number;    // 보험료
  carEtc?: number;          // 기타차량유지비
}

export interface IndividualUsageFee {
  kaptCode: string;
  kaptName: string;
  searchDate: string;
  // 개별사용료 항목들
  heatCostPublic?: number;      // 난방비 공용
  heatCostIndividual?: number;   // 난방비 전용
  hotWaterCostPublic?: number;   // 급탕비 공용
  hotWaterCostIndividual?: number; // 급탕비 전용
  electricityCostPublic?: number;  // 전기료 공용
  electricityCostIndividual?: number; // 전기료 전용
  waterCostPublic?: number;      // 수도료 공용
  waterCostIndividual?: number;   // 수도료 전용
  gasCostPublic?: number;        // 가스사용료 공용
  gasCostIndividual?: number;     // 가스사용료 전용
}

export interface TotalManagementFee {
  kaptCode: string;
  kaptName: string;
  year: number;
  month: number;
  commonFee: number;      // 공용관리비 합계
  individualFee: number;  // 개별사용료 합계
  totalFee: number;       // 총 관리비
}

export interface YearlyAverageManagementFee {
  kaptCode: string;
  kaptName: string;
  year: number;
  avgCommonFee: number;      // 월 평균 공용관리비
  avgIndividualFee: number;  // 월 평균 개별사용료
  avgTotalFee: number;       // 월 평균 총 관리비
  monthlyData: TotalManagementFee[];
}

class ManagementFeeService {
  /**
   * 공용관리비 정보 조회
   */
  async fetchCommonManagementFee(kaptCode: string, searchDate: string): Promise<CommonManagementFee | null> {
    try {
      // 일반관리비 조회
      const generalUrl = `${COMMON_COST_BASE_URL}/getHsmpGeneralManageCostInfoV2?serviceKey=${API_KEY}&kaptCode=${kaptCode}&searchDate=${searchDate}&type=json`;
      const generalResponse = await fetch(generalUrl);
      const generalData = await generalResponse.json();

      // 차량유지비 조회
      const vehicleUrl = `${COMMON_COST_BASE_URL}/getHsmpVhcleMntncCostInfoV2?serviceKey=${API_KEY}&kaptCode=${kaptCode}&searchDate=${searchDate}&type=json`;
      const vehicleResponse = await fetch(vehicleUrl);
      const vehicleData = await vehicleResponse.json();

      if (generalData?.response?.header?.resultCode !== '00' && vehicleData?.response?.header?.resultCode !== '00') {
        return null;
      }

      const generalItem = generalData?.response?.body?.item;
      const vehicleItem = vehicleData?.response?.body?.item;

      return {
        kaptCode,
        kaptName: generalItem?.kaptName || vehicleItem?.kaptName || '',
        searchDate,
        cleanCost: this.parseNumber(generalItem?.cleanCost),
        disinfectCost: this.parseNumber(generalItem?.disinfectCost),
        elevatorCost: this.parseNumber(generalItem?.elevatorCost),
        facilityCost: this.parseNumber(generalItem?.facilityCost),
        guardCost: this.parseNumber(generalItem?.guardCost),
        generalCost: this.parseNumber(generalItem?.generalCost),
        repairCost: this.parseNumber(generalItem?.repairCost),
        fuelCost: this.parseNumber(vehicleItem?.fuelCost),
        refairCost: this.parseNumber(vehicleItem?.refairCost),
        carInsurance: this.parseNumber(vehicleItem?.carInsurance),
        carEtc: this.parseNumber(vehicleItem?.carEtc),
      };
    } catch (error) {
      console.error('공용관리비 조회 오류:', error);
      return null;
    }
  }

  /**
   * 개별사용료 정보 조회
   */
  async fetchIndividualUsageFee(kaptCode: string, searchDate: string): Promise<IndividualUsageFee | null> {
    try {
      // 난방비 조회
      const heatUrl = `${INDIVIDUAL_COST_BASE_URL}/getHsmpHeatCostInfoV2?serviceKey=${API_KEY}&kaptCode=${kaptCode}&searchDate=${searchDate}&type=json`;
      const heatResponse = await fetch(heatUrl);
      const heatData = await heatResponse.json();

      // 급탕비 조회
      const hotWaterUrl = `${INDIVIDUAL_COST_BASE_URL}/getHsmpHotWaterCostInfoV2?serviceKey=${API_KEY}&kaptCode=${kaptCode}&searchDate=${searchDate}&type=json`;
      const hotWaterResponse = await fetch(hotWaterUrl);
      const hotWaterData = await hotWaterResponse.json();

      // 전기료 조회
      const electricityUrl = `${INDIVIDUAL_COST_BASE_URL}/getHsmpElectricityCostInfoV2?serviceKey=${API_KEY}&kaptCode=${kaptCode}&searchDate=${searchDate}&type=json`;
      const electricityResponse = await fetch(electricityUrl);
      const electricityData = await electricityResponse.json();

      // 수도료 조회
      const waterUrl = `${INDIVIDUAL_COST_BASE_URL}/getHsmpWaterCostInfoV2?serviceKey=${API_KEY}&kaptCode=${kaptCode}&searchDate=${searchDate}&type=json`;
      const waterResponse = await fetch(waterUrl);
      const waterData = await waterResponse.json();

      // 가스사용료 조회
      const gasUrl = `${INDIVIDUAL_COST_BASE_URL}/getHsmpGasCostInfoV2?serviceKey=${API_KEY}&kaptCode=${kaptCode}&searchDate=${searchDate}&type=json`;
      const gasResponse = await fetch(gasUrl);
      const gasData = await gasResponse.json();

      const heatItem = heatData?.response?.body?.item;
      const hotWaterItem = hotWaterData?.response?.body?.item;
      const electricityItem = electricityData?.response?.body?.item;
      const waterItem = waterData?.response?.body?.item;
      const gasItem = gasData?.response?.body?.item;

      return {
        kaptCode,
        kaptName: heatItem?.kaptName || hotWaterItem?.kaptName || electricityItem?.kaptName || '',
        searchDate,
        heatCostPublic: this.parseNumber(heatItem?.heatCostPublic),
        heatCostIndividual: this.parseNumber(heatItem?.heatCostIndividual),
        hotWaterCostPublic: this.parseNumber(hotWaterItem?.hotWaterCostPublic),
        hotWaterCostIndividual: this.parseNumber(hotWaterItem?.hotWaterCostIndividual),
        electricityCostPublic: this.parseNumber(electricityItem?.electricityCostPublic),
        electricityCostIndividual: this.parseNumber(electricityItem?.electricityCostIndividual),
        waterCostPublic: this.parseNumber(waterItem?.waterCostPublic),
        waterCostIndividual: this.parseNumber(waterItem?.waterCostIndividual),
        gasCostPublic: this.parseNumber(gasItem?.gasCostPublic),
        gasCostIndividual: this.parseNumber(gasItem?.gasCostIndividual),
      };
    } catch (error) {
      console.error('개별사용료 조회 오류:', error);
      return null;
    }
  }

  /**
   * 특정 월의 총 관리비 계산
   */
  async fetchMonthlyManagementFee(kaptCode: string, year: number, month: number): Promise<TotalManagementFee | null> {
    const searchDate = `${year}${month.toString().padStart(2, '0')}`;

    const [commonFee, individualFee] = await Promise.all([
      this.fetchCommonManagementFee(kaptCode, searchDate),
      this.fetchIndividualUsageFee(kaptCode, searchDate)
    ]);

    if (!commonFee && !individualFee) {
      return null;
    }

    const commonTotal = this.calculateCommonTotal(commonFee);
    const individualTotal = this.calculateIndividualTotal(individualFee);

    return {
      kaptCode,
      kaptName: commonFee?.kaptName || individualFee?.kaptName || '',
      year,
      month,
      commonFee: commonTotal,
      individualFee: individualTotal,
      totalFee: commonTotal + individualTotal
    };
  }

  /**
   * 연도별 월 평균 관리비 계산
   */
  async fetchYearlyAverageManagementFee(kaptCode: string, year: number): Promise<YearlyAverageManagementFee | null> {
    const monthlyData: TotalManagementFee[] = [];

    // 12개월 데이터 수집
    for (let month = 1; month <= 12; month++) {
      const monthData = await this.fetchMonthlyManagementFee(kaptCode, year, month);
      if (monthData) {
        monthlyData.push(monthData);
      }
    }

    if (monthlyData.length === 0) {
      return null;
    }

    // 평균 계산
    const totalCommon = monthlyData.reduce((sum, data) => sum + data.commonFee, 0);
    const totalIndividual = monthlyData.reduce((sum, data) => sum + data.individualFee, 0);
    const totalFee = monthlyData.reduce((sum, data) => sum + data.totalFee, 0);
    const count = monthlyData.length;

    return {
      kaptCode,
      kaptName: monthlyData[0]?.kaptName || '',
      year,
      avgCommonFee: Math.round(totalCommon / count),
      avgIndividualFee: Math.round(totalIndividual / count),
      avgTotalFee: Math.round(totalFee / count),
      monthlyData
    };
  }

  /**
   * 공용관리비 합계 계산
   */
  private calculateCommonTotal(fee: CommonManagementFee | null): number {
    if (!fee) return 0;

    return (
      (fee.cleanCost || 0) +
      (fee.disinfectCost || 0) +
      (fee.elevatorCost || 0) +
      (fee.facilityCost || 0) +
      (fee.guardCost || 0) +
      (fee.generalCost || 0) +
      (fee.repairCost || 0) +
      (fee.fuelCost || 0) +
      (fee.refairCost || 0) +
      (fee.carInsurance || 0) +
      (fee.carEtc || 0)
    );
  }

  /**
   * 개별사용료 합계 계산
   */
  private calculateIndividualTotal(fee: IndividualUsageFee | null): number {
    if (!fee) return 0;

    return (
      (fee.heatCostPublic || 0) +
      (fee.heatCostIndividual || 0) +
      (fee.hotWaterCostPublic || 0) +
      (fee.hotWaterCostIndividual || 0) +
      (fee.electricityCostPublic || 0) +
      (fee.electricityCostIndividual || 0) +
      (fee.waterCostPublic || 0) +
      (fee.waterCostIndividual || 0) +
      (fee.gasCostPublic || 0) +
      (fee.gasCostIndividual || 0)
    );
  }

  /**
   * 숫자 파싱 유틸리티
   */
  private parseNumber(value: any): number {
    if (!value) return 0;
    const parsed = parseInt(value.toString().replace(/,/g, ''));
    return isNaN(parsed) ? 0 : parsed;
  }
}

export const managementFeeService = new ManagementFeeService();