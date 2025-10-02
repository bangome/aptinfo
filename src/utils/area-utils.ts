/**
 * 면적 관련 유틸리티 함수들
 */

/**
 * 제곱미터를 평수로 변환
 * 1평 = 3.3058㎡
 */
export function convertToFloor(areaInSquareMeters: number): number {
  return Math.round(areaInSquareMeters / 3.3058 * 10) / 10;
}

/**
 * 평수를 제곱미터로 변환
 * 1평 = 3.3058㎡
 */
export function convertToSquareMeters(floorArea: number): number {
  return Math.round(floorArea * 3.3058 * 100) / 100;
}

/**
 * 면적을 보기 좋게 포맷팅 (㎡와 평 병기)
 */
export function formatAreaWithFloor(areaInSquareMeters: number): string {
  const floor = convertToFloor(areaInSquareMeters);
  return `${areaInSquareMeters}㎡ (${floor}평)`;
}

/**
 * 면적 범위를 평수 표기로 변환
 */
export function formatAreaRange(minArea: number, maxArea?: number): string {
  const minFloor = Math.floor(convertToFloor(minArea));
  
  if (maxArea) {
    const maxFloor = Math.floor(convertToFloor(maxArea));
    if (minFloor === maxFloor) {
      return `${minFloor}평대`;
    }
    return `${minFloor}~${maxFloor}평`;
  }
  
  return `${minFloor}평대`;
}

/**
 * 평형별 세대수 데이터 인터페이스
 */
export interface UnitTypeData {
  label: string;          // "60㎡ 이하 (18평대)"
  range: string;          // "60㎡ 이하"
  floorRange: string;     // "18평대"
  count: number;          // 326
  percentage: number;     // 31.5
  minArea?: number;       // 최소 면적
  maxArea?: number;       // 최대 면적
}

/**
 * apartment_complexes의 면적별 세대수를 UnitTypeData로 변환
 */
export function convertUnitTypeData(apartmentData: {
  kapt_mparea60?: number | null;   // 60㎡ 이하
  kapt_mparea85?: number | null;   // 60~85㎡
  kapt_mparea135?: number | null;  // 85~135㎡
  kapt_mparea136?: number | null;  // 135㎡ 초과
  kapt_da_cnt?: number | null;     // 총 세대수
}): UnitTypeData[] {
  const unitTypes: UnitTypeData[] = [];
  const totalUnits = apartmentData.kapt_da_cnt || 0;
  
  if (totalUnits === 0) return unitTypes;
  
  // 60㎡ 이하 (18평대)
  if (apartmentData.kapt_mparea60) {
    const count = apartmentData.kapt_mparea60;
    const percentage = Math.round((count / totalUnits) * 1000) / 10;
    unitTypes.push({
      label: "60㎡ 이하 (18평대)",
      range: "60㎡ 이하",
      floorRange: "18평대",
      count,
      percentage,
      maxArea: 60
    });
  }
  
  // 60~85㎡ (18~25평)
  if (apartmentData.kapt_mparea85) {
    const count = apartmentData.kapt_mparea85;
    const percentage = Math.round((count / totalUnits) * 1000) / 10;
    unitTypes.push({
      label: "60~85㎡ (18~25평)",
      range: "60~85㎡",
      floorRange: "18~25평",
      count,
      percentage,
      minArea: 60,
      maxArea: 85
    });
  }
  
  // 85~135㎡ (25~40평)
  if (apartmentData.kapt_mparea135) {
    const count = apartmentData.kapt_mparea135;
    const percentage = Math.round((count / totalUnits) * 1000) / 10;
    unitTypes.push({
      label: "85~135㎡ (25~40평)",
      range: "85~135㎡",
      floorRange: "25~40평",
      count,
      percentage,
      minArea: 85,
      maxArea: 135
    });
  }
  
  // 135㎡ 초과 (40평 초과)
  if (apartmentData.kapt_mparea136) {
    const count = apartmentData.kapt_mparea136;
    const percentage = Math.round((count / totalUnits) * 1000) / 10;
    unitTypes.push({
      label: "135㎡ 초과 (40평 초과)",
      range: "135㎡ 초과",
      floorRange: "40평 초과",
      count,
      percentage,
      minArea: 135
    });
  }
  
  return unitTypes;
}