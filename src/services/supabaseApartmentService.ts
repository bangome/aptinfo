/**
 * Supabase DB를 사용하는 아파트 검색 서비스
 */

import { createClient } from '@/lib/supabase/client';
import { SearchFilters, Apartment } from '@/types/apartment';
import { IntegratedApartmentData } from '@/lib/api/real-estate-api';

// Supabase apartment_complexes 테이블 타입 (67개 API 필드 포함)
export interface SupabaseApartmentComplex {
  id: string;
  kapt_code: string | null;
  name: string;
  address: string | null;
  road_address: string | null;
  region_code: string | null;
  legal_dong: string | null;
  jibun: string | null;
  created_at: string;
  updated_at: string;
  data_source: string | null;
  
  // 67개 API 필드들
  kapt_addr: string | null;
  bjd_code: string | null;
  zipcode: string | null;
  kapt_tarea: number | null;
  kapt_marea: number | null;
  priv_area: number | null;
  kapt_dong_cnt: number | null;
  kapt_da_cnt: number | null;
  ho_cnt: number | null;
  code_sale_nm: string | null;
  code_heat_nm: string | null;
  code_mgr_nm: string | null;
  code_apt_nm: string | null;
  code_hall_nm: string | null;
  kapt_bcompany: string | null;
  kapt_acompany: string | null;
  kapt_tel: string | null;
  kapt_fax: string | null;
  kapt_url: string | null;
  kapt_base_floor: number | null;
  kapt_top_floor: number | null;
  ktown_flr_no: number | null;
  kapt_usedate: string | null;
  kaptd_ecntp: number | null;
  kapt_mparea60: number | null;
  kapt_mparea85: number | null;
  kapt_mparea135: number | null;
  kapt_mparea136: number | null;
  code_mgr: string | null;
  kapt_mgr_cnt: number | null;
  kapt_ccompany: string | null;
  code_sec: string | null;
  kaptd_scnt: number | null;
  kaptd_sec_com: string | null;
  code_clean: string | null;
  kaptd_clcnt: number | null;
  code_disinf: string | null;
  kaptd_dcnt: number | null;
  disposal_type: string | null;
  code_garbage: string | null;
  code_str: string | null;
  kaptd_ecapa: number | null;
  code_econ: string | null;
  code_emgr: string | null;
  code_falarm: string | null;
  code_wsupply: string | null;
  code_net: string | null;
  code_elev: string | null;
  kaptd_ecnt: number | null;
  kaptd_pcnt: number | null;
  kaptd_pcntu: number | null;
  kaptd_cccnt: number | null;
  welfare_facility: string | null;
  convenient_facility: string | null;
  education_facility: string | null;
  kaptd_wtimebus: string | null;
  subway_line: string | null;
  subway_station: string | null;
  kaptd_wtimesub: string | null;
  ground_el_charger_cnt: number | null;
  underground_el_charger_cnt: number | null;
  use_yn: string | null;
}

// 검색 결과 인터페이스
export interface SearchResponse {
  apartments: IntegratedApartmentData[];
  totalCount: number;
  hasMore: boolean;
  currentPage: number;
}

class SupabaseApartmentService {
  private supabase = createClient();

  // Supabase 아파트 복합 데이터를 IntegratedApartmentData로 변환
  // apartments 테이블과 apartment_complexes 테이블 모두 지원
  private convertToIntegratedData(supabaseApt: any): IntegratedApartmentData {
    // 주소 정보 구성 (apartments 테이블 필드명 지원)
    const address = supabaseApt.road_address || supabaseApt.jibun_address || supabaseApt.address || '';
    const region = supabaseApt.sigungu || supabaseApt.legal_dong || '';
    const subRegion = supabaseApt.eupmyeondong || supabaseApt.legal_dong || '';

    // 건축년도 추출 (kapt_usedate 또는 use_approval_date에서)
    let buildYear: number | undefined;
    let formattedApprovalDate: string | undefined;
    const useDateStr = supabaseApt.kapt_usedate || supabaseApt.use_approval_date;
    
    if (useDateStr) {
      const yearMatch = useDateStr.toString().match(/(\d{4})/);
      const monthMatch = useDateStr.toString().match(/(\d{4})-(\d{2})/);
      
      if (yearMatch) {
        buildYear = parseInt(yearMatch[1]);
      }
      
      if (monthMatch) {
        const year = monthMatch[1];
        const month = parseInt(monthMatch[2]);
        formattedApprovalDate = `${year}년 ${month}월 준공`;
      } else if (yearMatch) {
        formattedApprovalDate = `${yearMatch[1]}년 준공`;
      }
    }

    // 면적 계산 (kapt_tarea/total_area를 세대수로 나눈 평균 면적 추정)
    let exclusiveArea: number | undefined;
    const totalArea = supabaseApt.total_area || supabaseApt.kapt_tarea;
    const householdCount = supabaseApt.total_household_count || supabaseApt.kapt_da_cnt || supabaseApt.ho_cnt;
    
    if (totalArea && householdCount && householdCount > 0) {
      exclusiveArea = Math.round(totalArea / householdCount);
    }

    // 가격 정보 (임시로 지역 기반 추정)
    const estimatedPrice = this.estimatePrice(region, exclusiveArea);

    // 편의시설 정보 파싱 (apartments와 apartment_complexes 테이블 모두 지원)
    const facilities = this.parseFacilities(
      supabaseApt.welfare_facility || supabaseApt.welfare_facilities,
      supabaseApt.convenient_facility || supabaseApt.convenient_facilities,
      supabaseApt.education_facility || supabaseApt.education_facilities
    );

    return {
      id: supabaseApt.id,
      name: supabaseApt.name,
      address: address,
      region: region,
      subRegion: subRegion,
      area: {
        exclusive: exclusiveArea || 84, // 기본값 84㎡
        supply: exclusiveArea ? exclusiveArea * 1.3 : 110 // 공급면적은 전용면적의 1.3배 추정
      },
      price: estimatedPrice,
      buildYear: buildYear,
      dealType: 'sale', // 기본값
      dealDate: {
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
        day: new Date().getDate()
      },
      floor: supabaseApt.kapt_dong_cnt || 1,
      totalFloors: this.estimateFloors(supabaseApt.kapt_da_cnt, supabaseApt.kapt_dong_cnt),
      estateAgent: '직접관리',
      createdAt: new Date(supabaseApt.created_at),
      updatedAt: new Date(supabaseApt.updated_at),
      
      // 추가 정보 (IntegratedApartmentData 기본 필드에 포함)
      kaptCode: supabaseApt.kapt_code,
      units: supabaseApt.total_household_count || supabaseApt.kapt_da_cnt || supabaseApt.ho_cnt,
      constructionCompany: supabaseApt.kapt_bcompany || supabaseApt.construction_company,
      
      // 주차 및 시설 정보 추가 (67개 API 필드 활용)
      facilities: {
        parking: {
          total: this.calculateTotalParking(supabaseApt),
          surface: supabaseApt.kaptd_pcnt || undefined,
          underground: supabaseApt.kaptd_pcntu || undefined,
        },
        elevator: supabaseApt.kaptd_ecnt || undefined,
        cctv: supabaseApt.kaptd_cccnt || undefined,
        welfare: supabaseApt.welfare_facility ? this.parseFacilities(supabaseApt.welfare_facility) : undefined,
        convenient: supabaseApt.convenient_facility ? this.parseFacilities(supabaseApt.convenient_facility) : undefined,
        education: supabaseApt.education_facility ? this.parseEducationFacilities(supabaseApt.education_facility) : undefined,
      },
      
      // 교통 정보 추가
      transportation: {
        subway: {
          line: supabaseApt.subway_line || undefined,
          station: supabaseApt.subway_station || undefined,
          distance: supabaseApt.subway_distance || undefined,
        },
        bus: {
          distance: supabaseApt.bus_station_distance || undefined,
        }
      },
      
      // 포맷된 준공일 추가
      formattedApprovalDate: formattedApprovalDate
    };
  }

  // 지역 기반 가격 추정
  private estimatePrice(region: string, exclusiveArea?: number): IntegratedApartmentData['price'] {
    const area = exclusiveArea || 84;
    
    // 지역별 평당 가격 (만원/㎡) - 실제 시세 기반 추정
    const regionPrices: { [key: string]: number } = {
      '강남구': 4500,
      '서초구': 4000,
      '송파구': 3500,
      '강동구': 2800,
      '마포구': 3200,
      '용산구': 3800,
      '성동구': 2500,
      '광진구': 2400,
      '동대문구': 2200,
      '성북구': 2000,
      '노원구': 1800,
      '도봉구': 1600,
      '강북구': 1500,
      '은평구': 1800,
      '서대문구': 2200,
      '중구': 2800,
      '종로구': 3000,
      '중랑구': 1700,
      '양천구': 2400,
      '강서구': 2200,
      '구로구': 1900,
      '금천구': 1800,
      '영등포구': 2100,
      '동작구': 2300,
      '관악구': 1900
    };

    const pricePerSqm = regionPrices[region] || 2000; // 기본값 2000만원/㎡
    const estimatedSalePrice = Math.round(area * pricePerSqm * 10000); // 원 단위로 변환

    return {
      sale: estimatedSalePrice,
      lease: Math.round(estimatedSalePrice * 0.6), // 매매가의 60% 추정
      rent: {
        deposit: Math.round(estimatedSalePrice * 0.2), // 매매가의 20% 추정
        monthly: Math.round(estimatedSalePrice * 0.003) // 매매가의 0.3% 추정
      }
    };
  }

  // 층수 추정
  private estimateFloors(totalHouseholds?: number | null, totalDong?: number | null): number {
    if (!totalHouseholds || !totalDong || totalDong === 0) return 15; // 기본값
    
    const householdsPerDong = totalHouseholds / totalDong;
    // 한 층에 4세대 정도로 가정
    return Math.ceil(householdsPerDong / 4);
  }

  // 총 주차대수 계산
  private calculateTotalParking(supabaseApt: SupabaseApartmentComplex): number | undefined {
    // kaptd_pcnt + kaptd_pcntu로 계산
    const surfaceParking = supabaseApt.kaptd_pcnt || 0;
    const undergroundParking = supabaseApt.kaptd_pcntu || 0;
    
    if (surfaceParking > 0 || undergroundParking > 0) {
      return surfaceParking + undergroundParking;
    }
    
    // 기존 total_parking_count 사용
    return supabaseApt.total_parking_count || undefined;
  }

  // 편의시설 파싱 (단일 문자열용)
  private parseFacilities(facilityStr?: string | null): string[] {
    if (!facilityStr) return [];

    // 먼저 전화번호 패턴 제거
    facilityStr = this.removePhoneNumbers(facilityStr);

    // convenient_facility처럼 카테고리가 있는 형태인지 확인
    const hasCategories = facilityStr.includes('관공서(') || facilityStr.includes('병원(') ||
                         facilityStr.includes('공원(') || facilityStr.includes('대형상가(');

    const allFacilities: string[] = [];

    if (hasCategories) {
      // 카테고리가 있는 경우 전체를 파싱 (이미 removePhoneNumbers 적용됨)
      const parsedFacilities = this.parseConvenientFacility(facilityStr);
      allFacilities.push(...parsedFacilities);
    } else {
      // welfare_facility처럼 단순 나열인 경우 쉼표로 분리
      const parsed = facilityStr.split(/[,;\/]/).map(f => f.trim()).filter(f => f.length > 0);
      allFacilities.push(...parsed);
    }
    
    // 빈 괄호가 있는 항목들 제거 (예: "대형상가()", "공원()")
    const cleanedFacilities = allFacilities.filter(facility => {
      return !facility.match(/\(\s*\)$/);
    });

    // 스마트 중복 제거: 유사한 이름도 제거
    const deduplicatedFacilities = this.removeSimilarDuplicates(cleanedFacilities);

    // 전화번호 패턴만 있는 항목 제거 (예: "043-201-7912")
    const finalFacilities = deduplicatedFacilities.filter(facility => !this.isPhoneNumber(facility));

    return finalFacilities;
  }

  // 전화번호 패턴 제거 헬퍼 함수
  private removePhoneNumbers(text: string): string {
    // 전화번호 패턴: 02-123-4567, 031-1234-5678, 043-201-7912 등
    // \d{2,4}-\d{3,4}-\d{4} 형태
    return text.replace(/\(\d{2,4}-\d{3,4}-\d{4}\)/g, '').trim();
  }

  // 전화번호 패턴인지 확인 (숫자-숫자-숫자 형태)
  private isPhoneNumber(text: string): boolean {
    // 숫자-숫자-숫자 형태만 있는지 확인
    return /^\d{2,4}-\d{3,4}-\d{4}$/.test(text.trim());
  }

  // 유사한 중복 시설명 제거 및 괄호 정리
  private removeSimilarDuplicates(facilities: string[]): string[] {
    const result: string[] = [];

    for (let facility of facilities) {
      // 먼저 전화번호 패턴 제거
      facility = this.removePhoneNumbers(facility);

      // 그 다음 모든 괄호 정리
      facility = facility
        .replace(/[)\]}>]+$/, '')  // 끝의 모든 닫는 괄호들 제거
        .replace(/^[(\[{<]+/, '')  // 시작의 모든 여는 괄호들 제거
        .trim();
      
      let isDuplicate = false;
      
      // 기존 결과와 비교하여 유사한 것이 있는지 확인
      for (let i = 0; i < result.length; i++) {
        const existing = result[i];
        // 괄호 제거하고 비교
        const cleanFacility = facility.replace(/[()[\]{}]/g, '').trim();
        const cleanExisting = existing.replace(/[()[\]{}]/g, '').trim();
        
        // 완전히 같거나, 한쪽이 다른 쪽을 포함하는 경우
        if (cleanFacility === cleanExisting || 
            cleanFacility.includes(cleanExisting) || 
            cleanExisting.includes(cleanFacility)) {
          isDuplicate = true;
          
          // 더 완전한 이름으로 교체 (더 긴 이름을 선택)
          if (cleanFacility.length > cleanExisting.length) {
            result[i] = facility;
          }
          break;
        }
      }
      
      if (!isDuplicate && facility.length > 0) {
        result.push(facility);
      }
    }
    
    return result;
  }

  // 편의시설 개별 파싱 (관공서, 병원, 공원, 대형상가 처리)
  private parseConvenientFacility(facilityStr: string): string[] {
    const facilities: string[] = [];

    // 먼저 전체 문자열에서 전화번호 패턴 제거
    facilityStr = this.removePhoneNumbers(facilityStr);

    // 1. 관공서 파싱
    const govMatch = facilityStr.match(/관공서\(([^)]+)\)/);
    if (govMatch) {
      const govFacilities = govMatch[1].split(/[,，]/).map(g => {
        // 모든 종류의 괄호 제거
        return g.trim()
          .replace(/[)\]}>]+$/, '')  // 끝의 모든 닫는 괄호들 제거
          .replace(/^[(\[{<]+/, '')  // 시작의 모든 여는 괄호들 제거
          .trim();
      }).filter(g => g.length > 0);
      facilities.push(...govFacilities);
    }
    
    // 2. 병원 파싱
    const hospitalMatch = facilityStr.match(/병원\(([^)]+)\)/);
    if (hospitalMatch) {
      const hospitals = hospitalMatch[1].split(/[,，]/).map(h => h.trim()).filter(h => h.length > 0);
      hospitals.forEach(hospital => {
        if (hospital) {
          // 의원, 과, 병원이 이미 포함되어 있는지 확인
          const hasMedicalSuffix = hospital.includes('의원') || hospital.includes('과') || hospital.includes('병원');
          const finalName = hasMedicalSuffix ? hospital : `${hospital}병원`;
          facilities.push(finalName);
        }
      });
    }
    
    // 3. 공원 파싱
    const parkMatch = facilityStr.match(/공원\(([^)]+)\)/);
    if (parkMatch) {
      const parks = parkMatch[1].split(/[,，]/).map(p => {
        // 모든 종류의 괄호 제거 (남은 괄호, 특수문자 등)
        return p.trim()
          .replace(/[)\]}>]+$/, '')  // 끝의 모든 닫는 괄호들 제거
          .replace(/^[(\[{<]+/, '')  // 시작의 모든 여는 괄호들 제거
          .trim();
      }).filter(p => p.length > 0);
      facilities.push(...parks);
    }
    
    // 4. 대형상가 파싱
    const mallMatch = facilityStr.match(/대형상가\(([^)]+)\)/);
    if (mallMatch) {
      const malls = mallMatch[1].split(/[,，]/).map(m => m.trim()).filter(m => m.length > 0);
      facilities.push(...malls);
    }
    
    // 5. "경희대 동서신의학병원, 이마트" 형태 파싱 (쉼표로 구분된 형태)
    if (facilities.length === 0) {
      const parts = facilityStr.split(/[,，]/).map(p => p.trim()).filter(p => p.length > 0);
      parts.forEach(part => {
        // 병원인지 확인 (이름에 병원이 포함되어 있거나 의학/의료 관련 키워드가 있는 경우)
        if (part.includes('병원') || part.includes('의학') || part.includes('의료') || part.includes('클리닉') || part.includes('의원') || part.includes('과')) {
          // 의원, 과, 병원이 이미 포함되어 있는지 확인
          const hasMedicalSuffix = part.includes('의원') || part.includes('과') || part.includes('병원');
          const finalName = hasMedicalSuffix ? part : `${part}병원`;
          facilities.push(finalName);
        } else {
          // 병원이 아닌 경우 그대로 추가
          facilities.push(part);
        }
      });
    }
    
    // 6. 패턴에 맞지 않는 경우
    if (facilities.length === 0) {
      // 카테고리 패턴이 있는데 파싱에 실패한 경우 빈 배열 반환
      if (facilityStr.includes('관공서(') || facilityStr.includes('병원(') ||
          facilityStr.includes('공원(') || facilityStr.includes('대형상가(')) {
        return [];
      }
      // 일반 텍스트인 경우만 원본 반환 (전화번호 제외)
      if (this.isPhoneNumber(facilityStr)) {
        return [];
      }
      return [facilityStr];
    }

    // 전화번호 패턴만 있는 항목 제거
    return facilities.filter(facility => !this.isPhoneNumber(facility));
  }

  // 교육시설 파싱 (특별 처리)
  private parseEducationFacilities(educationStr?: string | null): string[] {
    if (!educationStr) return [];

    // 먼저 전체 문자열에서 전화번호 패턴 제거
    educationStr = this.removePhoneNumbers(educationStr);

    const facilities: string[] = [];

    // "초등학교(a, b) 중학교(c, d) 고등학교(e, f)" 형태 파싱
    const patterns = [
      { type: '초등학교', suffix: '초', regex: /초등학교\(([^)]+)\)/g },
      { type: '중학교', suffix: '중', regex: /중학교\(([^)]+)\)/g },
      { type: '고등학교', suffix: '고', regex: /고등학교\(([^)]+)\)/g },
      { type: '대학교', suffix: '대', regex: /대학교\(([^)]+)\)/g }
    ];
    
    patterns.forEach(({ type, suffix, regex }) => {
      let match;
      while ((match = regex.exec(educationStr)) !== null) {
        const schools = match[1].split(/[,，]/).map(s => s.trim()).filter(s => s.length > 0);
        schools.forEach(school => {
          if (school) {
            // 이미 초/중/고/대가 포함되어 있는지 확인
            const hasSchoolType = /[초중고대]$/.test(school);
            const finalName = hasSchoolType ? school : `${school}${suffix}`;
            facilities.push(finalName);
          }
        });
      }
    });
    
    // 패턴에 맞지 않는 경우 기본 파싱
    if (facilities.length === 0) {
      return this.parseFacilities(educationStr);
    }
    
    // 빈 괄호가 있는 항목들 제거
    const cleanedFacilities = facilities.filter(facility => {
      return !facility.match(/\(\s*\)$/);
    });

    // 전화번호 패턴만 있는 항목 제거
    return cleanedFacilities.filter(facility => !this.isPhoneNumber(facility));
  }

  // 메인 검색 함수
  async search(query: string = '', filters: SearchFilters = {}): Promise<SearchResponse> {
    try {
      console.log('SupabaseApartmentService.search 호출됨:', { query, filters });

      // 기본 쿼리 빌더 - apartment_complexes 테이블 사용
      let queryBuilder = this.supabase
        .from('apartment_complexes')
        .select('*', { count: 'exact' });

      // 검색어 필터링
      if (query.trim()) {
        queryBuilder = queryBuilder.or(`name.ilike.%${query}%,sigungu.ilike.%${query}%,eupmyeondong.ilike.%${query}%`);
      }

      // 지역 필터링 (레거시 region 필드)
      if (filters.region) {
        queryBuilder = queryBuilder.eq('sigungu', filters.region);
      }

      // 시도 필터링 (새로운 방식)
      if (filters.sido) {
        queryBuilder = queryBuilder.eq('sido', filters.sido);
      }

      // 시군구 필터링 (새로운 방식)
      if (filters.sigungu) {
        queryBuilder = queryBuilder.eq('sigungu', filters.sigungu);
      }

      // 건축년도 필터링
      if (filters.buildYearRange) {
        const [minYear, maxYear] = filters.buildYearRange;
        queryBuilder = queryBuilder
          .gte('kapt_usedate', `${minYear}-01-01`)
          .lte('kapt_usedate', `${maxYear}-12-31`);
      }

      // 정렬 적용
      const sortBy = filters.sortBy || 'newest';
      switch (sortBy) {
        case 'newest':
          queryBuilder = queryBuilder.order('kapt_usedate', { ascending: false });
          break;
        case 'name':
          queryBuilder = queryBuilder.order('name', { ascending: true });
          break;
        default:
          queryBuilder = queryBuilder.order('kapt_usedate', { ascending: false });
      }

      // 페이지네이션
      const page = filters.page || 1;
      const limit = filters.limit || 20;
      const offset = (page - 1) * limit;

      queryBuilder = queryBuilder.range(offset, offset + limit - 1);

      // 쿼리 실행
      const { data, error, count } = await queryBuilder;

      if (error) {
        console.error('Supabase 검색 오류 발생');
        console.error('에러 객체 타입:', typeof error);
        console.error('에러 객체:', error);
        console.error('에러 메시지:', error?.message);
        console.error('에러 코드:', error?.code);
        console.error('에러 상세:', error?.details);
        console.error('에러 힌트:', error?.hint);
        console.error('전체 에러 JSON:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));

        const errorMsg = error?.message || error?.code || error?.details || '알 수 없는 오류';
        throw new Error(`데이터베이스 검색 중 오류가 발생했습니다: ${errorMsg}`);
      }

      // 데이터 변환
      const convertedApartments = (data || []).map(apt => this.convertToIntegratedData(apt));

      // 추가 필터링 (가격, 면적 등은 변환 후 적용)
      const filteredApartments = this.applyAdditionalFilters(convertedApartments, filters);

      const totalCount = count || 0;
      const hasMore = offset + limit < totalCount;

      const result = {
        apartments: filteredApartments,
        totalCount: totalCount,
        hasMore: hasMore,
        currentPage: page,
      };

      console.log('Supabase 검색 결과:', {
        총개수: result.totalCount,
        현재페이지개수: result.apartments.length,
        더있음: result.hasMore,
        페이지: result.currentPage
      });

      return result;
    } catch (error) {
      console.error('Supabase 아파트 검색 중 오류 발생 (catch 블록)');
      console.error('에러 타입:', typeof error);
      console.error('에러 객체:', error);
      console.error('에러 instanceof Error:', error instanceof Error);

      if (error instanceof Error) {
        console.error('Error.message:', error.message);
        console.error('Error.stack:', error.stack);
      }

      console.error('전체 에러 JSON:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));

      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`아파트 검색 중 오류가 발생했습니다: ${errorMessage}`);
    }
  }

  // 추가 필터링 (변환된 데이터에 적용)
  private applyAdditionalFilters(apartments: IntegratedApartmentData[], filters: SearchFilters): IntegratedApartmentData[] {
    // 중복 제거 (ID 기준)
    const uniqueApartments = apartments.filter((apt, index, arr) => 
      arr.findIndex(a => a.id === apt.id) === index
    );
    
    let filtered = [...uniqueApartments];

    // 가격 필터링
    if (filters.priceRange) {
      const [minPrice, maxPrice] = filters.priceRange;
      filtered = filtered.filter(apt => {
        const price = apt.price?.sale;
        if (!price) return true;
        return price >= minPrice && price <= maxPrice;
      });
    }

    // 면적 필터링
    if (filters.areaRange) {
      const [minArea, maxArea] = filters.areaRange;
      filtered = filtered.filter(apt => {
        const area = apt.area.exclusive;
        if (!area) return true;
        return area >= minArea && area <= maxArea;
      });
    }

    // 세대수 필터링
    if (filters.unitsRange) {
      const [minUnits, maxUnits] = filters.unitsRange;
      filtered = filtered.filter(apt => {
        const units = apt.units;
        if (!units) return false; // 세대수 정보 없으면 제외
        return units >= minUnits && units <= maxUnits;
      });
    }

    // 주차대수 필터링
    if (filters.parkingRange) {
      const [minParking, maxParking] = filters.parkingRange;
      filtered = filtered.filter(apt => {
        const parking = typeof apt.parking === 'number' ? apt.parking : apt.parking?.total || 0;
        return parking >= minParking && parking <= maxParking;
      });
    }

    // 전용면적 필터링 (exclusiveAreaRange)
    if (filters.exclusiveAreaRange) {
      const [minArea, maxArea] = filters.exclusiveAreaRange;
      filtered = filtered.filter(apt => {
        const area = apt.area.exclusive;
        if (!area) return false; // 면적 정보 없으면 제외
        return area >= minArea && area <= maxArea;
      });
    }

    // 거래 유형 필터링
    if (filters.dealType && filters.dealType !== 'all') {
      filtered = filtered.filter(apt => {
        const dealType = filters.dealType;
        
        switch (dealType) {
          case 'sale':
            return apt.price?.sale && apt.price.sale > 0;
          case 'lease':
            return apt.price?.lease && apt.price.lease > 0;
          case 'rent':
            return apt.price?.rent?.monthly && apt.price.rent.monthly > 0;
          default:
            return true;
        }
      });
    }

    // 편의시설 필터링 (현재는 편의시설 데이터가 직접 포함되지 않음)
    if (filters.facilities && filters.facilities.length > 0) {
      // TODO: 편의시설 필터링 구현 필요
      // 현재는 모든 아파트를 포함
    }

    return filtered;
  }

  // 특정 아파트 상세 정보 조회 (kapt_code 기반)
  async getApartmentById(kaptCode: string): Promise<IntegratedApartmentData | null> {
    try {
      // 1차: apartment_complexes 테이블에서 조회 (상세 정보)
      const { data, error } = await this.supabase
        .from('apartment_complexes')
        .select('*')
        .eq('kapt_code', kaptCode)
        .maybeSingle(); // single() 대신 maybeSingle() 사용 (결과 없을 때 에러 안 냄)

      // apartment_complexes 테이블에 모든 데이터가 있으므로 2차 조회 불필요

      if (error) {
        console.error('아파트 상세 조회 오류:', error);
        return null;
      }

      if (!data) {
        console.log(`아파트를 찾을 수 없습니다: ${kaptCode}`);
        return null;
      }

      const convertedData = this.convertToIntegratedData(data);
      // 원시 데이터를 convertedData에 추가 (API 필드 접근용)
      (convertedData as any).rawData = data;

      return convertedData;
    } catch (error) {
      console.error('아파트 상세 정보 조회 실패:', error);
      return null;
    }
  }

  // 인기 아파트 조회 (최근 등록된 아파트 기준)
  async getPopularApartments(limit: number = 10): Promise<IntegratedApartmentData[]> {
    try {
      const { data, error } = await this.supabase
        .from('apartment_complexes')
        .select('*')
        .eq('is_active', true)
        .not('sigungu', 'is', null)
        .in('sigungu', ['강남구', '서초구', '송파구', '마포구', '용산구']) // 인기 지역
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('인기 아파트 조회 오류:', error);
        throw error;
      }

      const apartments = (data || []).map(apt => this.convertToIntegratedData(apt));
      // 중복 제거
      return apartments.filter((apt, index, arr) => 
        arr.findIndex(a => a.id === apt.id) === index
      );
    } catch (error) {
      console.error('인기 아파트 조회 실패:', error);
      return [];
    }
  }

  // 최근 아파트 조회
  async getRecentApartments(limit: number = 10): Promise<IntegratedApartmentData[]> {
    try {
      const { data, error } = await this.supabase
        .from('apartment_complexes')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('최근 아파트 조회 오류:', error);
        throw error;
      }

      const apartments = (data || []).map(apt => this.convertToIntegratedData(apt));
      // 중복 제거
      return apartments.filter((apt, index, arr) =>
        arr.findIndex(a => a.id === apt.id) === index
      );
    } catch (error) {
      console.error('최근 아파트 조회 실패:', error);
      return [];
    }
  }

  // 인기 지역 조회 (시도별 아파트 개수 및 평균 거래가)
  async getPopularAreas(limit: number = 6): Promise<Array<{
    id: string;
    name: string;
    count: number;
    averagePrice: number;
    image: string;
  }>> {
    try {
      console.log('🔍 인기 지역 조회 시작...');

      // Supabase의 기본 페이지네이션 제한을 피하기 위해
      // 시도별로 이미 알고 있는 지역 목록 사용
      const knownRegions = [
        '서울특별시', '경기도', '인천광역시',
        '부산광역시', '대구광역시', '대전광역시', '광주광역시', '울산광역시',
        '세종특별자치시', '강원특별자치도',
        '충청북도', '충청남도',
        '전라북도', '전북특별자치도', '전라남도',
        '경상북도', '경상남도',
        '제주특별자치도'
      ];

      // 각 지역별로 개수 조회
      const regionCounts = await Promise.all(
        knownRegions.map(async (sido) => {
          const { count, error } = await this.supabase
            .from('apartment_complexes')
            .select('*', { count: 'exact', head: true })
            .eq('sido', sido);

          if (error) {
            console.error(`${sido} 개수 조회 오류:`, error);
            return { sido, count: 0 };
          }

          return { sido, count: count || 0 };
        })
      );

      console.log('📍 시도별 개수:', regionCounts);

      // 개수가 0이 아닌 지역만 필터링하고 정렬
      const popularRegions = regionCounts
        .filter(item => item.count > 0)
        .sort((a, b) => b.count - a.count)
        .slice(0, limit)
        .map((item, index) => ({
          id: `region-${index}`,
          name: item.sido,
          count: item.count,
          averagePrice: 0,
          image: this.getRegionImage(item.sido)
        }));

      console.log('✅ 인기 지역 조회 완료:', popularRegions.length, '개');
      return popularRegions;
    } catch (error) {
      console.error('인기 지역 조회 실패:', error);
      return [];
    }
  }

  // 지역 이미지 매핑 헬퍼 함수
  private getRegionImage(sido: string): string {
    const regionImages: Record<string, string> = {
      '서울특별시': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/Seal_of_Seoul%2C_South_Korea.svg/200px-Seal_of_Seoul%2C_South_Korea.svg.png',
      '부산광역시': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/39/Busan_Metropolitan_City_Logo.svg/200px-Busan_Metropolitan_City_Logo.svg.png',
      '대구광역시': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Daegu_Metropolitan_City_Logo.svg/200px-Daegu_Metropolitan_City_Logo.svg.png',
      '인천광역시': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f8/Incheon_Metropolitan_City_Logo.svg/200px-Incheon_Metropolitan_City_Logo.svg.png',
      '광주광역시': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c0/Gwangju_Metropolitan_City_Logo.svg/200px-Gwangju_Metropolitan_City_Logo.svg.png',
      '대전광역시': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/29/Daejeon_Metropolitan_City_Logo.svg/200px-Daejeon_Metropolitan_City_Logo.svg.png',
      '울산광역시': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Ulsan_Metropolitan_City_Logo.svg/200px-Ulsan_Metropolitan_City_Logo.svg.png',
      '세종특별자치시': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/Sejong_Special_Self-Governing_City_logo.svg/200px-Sejong_Special_Self-Governing_City_logo.svg.png',
      '경기도': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/Gyeonggi-do_Provincial_Office_Logo.svg/200px-Gyeonggi-do_Provincial_Office_Logo.svg.png',
      '강원특별자치도': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Emblem_of_Gangwon_Province.svg/200px-Emblem_of_Gangwon_Province.svg.png',
      '충청북도': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/79/Emblem_of_North_Chungcheong_Province.svg/200px-Emblem_of_North_Chungcheong_Province.svg.png',
      '충청남도': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Emblem_of_South_Chungcheong_Province.svg/200px-Emblem_of_South_Chungcheong_Province.svg.png',
      '전북특별자치도': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/Emblem_of_North_Jeolla_Province.svg/200px-Emblem_of_North_Jeolla_Province.svg.png',
      '전라북도': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/Emblem_of_North_Jeolla_Province.svg/200px-Emblem_of_North_Jeolla_Province.svg.png',
      '전라남도': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/Emblem_of_South_Jeolla_Province.svg/200px-Emblem_of_South_Jeolla_Province.svg.png',
      '경상북도': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/Emblem_of_North_Gyeongsang_Province.svg/200px-Emblem_of_North_Gyeongsang_Province.svg.png',
      '경상남도': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/Emblem_of_South_Gyeongsang_Province.svg/200px-Emblem_of_South_Gyeongsang_Province.svg.png',
      '제주특별자치도': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Emblem_of_Jeju_Province.svg/200px-Emblem_of_Jeju_Province.svg.png',
    };
    return regionImages[sido] || '/placeholder.svg';
  }

  // 지역별 아파트 수 조회
  async getApartmentCountByRegion(): Promise<{ [region: string]: number }> {
    try {
      const { data, error } = await this.supabase
        .from('apartment_complexes')
        .select('sigungu')
        .eq('is_active', true)
        .not('sigungu', 'is', null);

      if (error) {
        console.error('지역별 아파트 수 조회 오류:', error);
        return {};
      }

      const counts: { [region: string]: number } = {};
      (data || []).forEach(item => {
        if (item.sigungu) {
          counts[item.sigungu] = (counts[item.sigungu] || 0) + 1;
        }
      });

      return counts;
    } catch (error) {
      console.error('지역별 아파트 수 조회 실패:', error);
      return {};
    }
  }
}

// 싱글톤 인스턴스
export const supabaseApartmentService = new SupabaseApartmentService();

// 편의 함수들
export async function searchSupabaseApartments(
  query: string = '',
  filters: SearchFilters = {}
): Promise<SearchResponse> {
  return supabaseApartmentService.search(query, filters);
}

export async function getSupabaseApartmentById(id: string): Promise<IntegratedApartmentData | null> {
  return supabaseApartmentService.getApartmentById(id);
}

export async function getPopularSupabaseApartments(limit?: number): Promise<IntegratedApartmentData[]> {
  return supabaseApartmentService.getPopularApartments(limit);
}

export async function getRecentSupabaseApartments(limit?: number): Promise<IntegratedApartmentData[]> {
  return supabaseApartmentService.getRecentApartments(limit);
}

export async function getPopularAreas(limit?: number) {
  return supabaseApartmentService.getPopularAreas(limit);
}