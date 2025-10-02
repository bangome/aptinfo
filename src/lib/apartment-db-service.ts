// 데이터베이스 기반 아파트 검색 서비스
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface ApartmentSearchParams {
  apartmentName?: string;
  address?: string;
  sigungu?: string;
  eupmyeondong?: string;
  bjdCode?: string;
  kaptCode?: string;
  limit?: number;
  offset?: number;
}

export interface ApartmentInfo {
  id: string;
  kapt_code: string;
  name: string;
  sido: string;
  sigungu: string;
  eupmyeondong: string;
  ri?: string;
  bjd_code: string;
  zipcode?: string;
  jibun_address?: string;
  road_address?: string;
  
  // 건물 정보
  total_area?: number;
  building_area?: number;
  total_dong_count?: number;
  total_household_count?: number;
  
  // 주차 정보
  total_parking_count?: number;
  surface_parking_count?: number;
  underground_parking_count?: number;
  
  // 기타 정보
  use_approval_date?: string;
  construction_company?: string;
  architecture_company?: string;
  management_office_tel?: string;
  management_office_fax?: string;
  website_url?: string;
  management_type?: string;
  heating_type?: string;
  hall_type?: string;
  apartment_type?: string;
  
  // 시설 정보
  elevator_count?: number;
  cctv_count?: number;
  welfare_facilities?: string;
  convenient_facilities?: string;
  education_facilities?: string;
  
  // 교통 정보
  bus_station_distance?: string;
  subway_line?: string;
  subway_station?: string;
  subway_distance?: string;
  
  // 전기차 충전시설
  surface_ev_charger_count?: number;
  underground_ev_charger_count?: number;
  
  // 메타데이터
  is_active: boolean;
  data_source: string;
  last_updated_at: string;
  created_at: string;
  updated_at: string;
}

export interface SearchResult {
  apartments: ApartmentInfo[];
  total: number;
  hasMore: boolean;
}

export class ApartmentDbService {
  /**
   * 아파트 검색
   */
  static async searchApartments(params: ApartmentSearchParams): Promise<SearchResult> {
    const { 
      apartmentName, 
      address, 
      sigungu, 
      eupmyeondong, 
      bjdCode, 
      kaptCode,
      limit = 20, 
      offset = 0 
    } = params;

    let query = supabase
      .from('apartments')
      .select('*', { count: 'exact' })
      .eq('is_active', true);

    // 정확한 매칭이 우선
    if (kaptCode) {
      query = query.eq('kapt_code', kaptCode);
    } else {
      // 지역 필터
      if (sigungu) {
        query = query.eq('sigungu', sigungu);
      }
      
      if (eupmyeondong) {
        query = query.eq('eupmyeondong', eupmyeondong);
      }
      
      if (bjdCode) {
        query = query.eq('bjd_code', bjdCode);
      }

      // 이름 검색 (전체 텍스트 검색)
      if (apartmentName) {
        // 정확한 이름 매칭을 먼저 시도
        const exactQuery = await supabase
          .from('apartments')
          .select('*', { count: 'exact' })
          .eq('is_active', true)
          .eq('name', apartmentName)
          .limit(limit)
          .range(offset, offset + limit - 1);

        if (exactQuery.data && exactQuery.data.length > 0) {
          return {
            apartments: exactQuery.data,
            total: exactQuery.count || 0,
            hasMore: (exactQuery.count || 0) > offset + limit
          };
        }

        // 부분 매칭
        query = query.ilike('name', `%${apartmentName}%`);
      }

      // 주소 검색
      if (address) {
        query = query.or(`jibun_address.ilike.%${address}%,road_address.ilike.%${address}%`);
      }
    }

    // 정렬 및 페이징
    query = query
      .order('name')
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('아파트 검색 오류:', error);
      throw new Error('아파트 검색에 실패했습니다.');
    }

    return {
      apartments: data || [],
      total: count || 0,
      hasMore: (count || 0) > offset + limit
    };
  }

  /**
   * 아파트 이름으로 유사 검색
   */
  static async findSimilarApartments(
    apartmentName: string, 
    limit: number = 10
  ): Promise<ApartmentInfo[]> {
    // 키워드 추출
    const keywords = apartmentName
      .replace(/[^가-힣\w]/g, ' ')
      .split(/\s+/)
      .filter(k => k.length >= 2);

    if (keywords.length === 0) {
      return [];
    }

    // 각 키워드에 대해 검색
    const searchPromises = keywords.map(keyword => 
      supabase
        .from('apartments')
        .select('*')
        .eq('is_active', true)
        .ilike('name', `%${keyword}%`)
        .limit(limit)
    );

    const results = await Promise.all(searchPromises);
    
    // 결과 병합 및 중복 제거
    const apartmentMap = new Map<string, ApartmentInfo>();
    
    results.forEach(result => {
      if (result.data) {
        result.data.forEach(apartment => {
          apartmentMap.set(apartment.kapt_code, apartment);
        });
      }
    });

    return Array.from(apartmentMap.values()).slice(0, limit);
  }

  /**
   * 단지 코드로 아파트 조회
   */
  static async getApartmentByKaptCode(kaptCode: string): Promise<ApartmentInfo | null> {
    const { data, error } = await supabase
      .from('apartments')
      .select('*')
      .eq('kapt_code', kaptCode)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows found
        return null;
      }
      console.error('아파트 조회 오류:', error);
      throw new Error('아파트 정보 조회에 실패했습니다.');
    }

    return data;
  }

  /**
   * 지역별 아파트 통계
   */
  static async getRegionStats(sigungu: string) {
    const { data, error } = await supabase
      .from('apartments')
      .select('eupmyeondong, total_household_count, total_dong_count')
      .eq('sigungu', sigungu)
      .eq('is_active', true);

    if (error) {
      console.error('지역 통계 조회 오류:', error);
      throw new Error('지역 통계 조회에 실패했습니다.');
    }

    // 읍면동별 집계
    const stats = data.reduce((acc, apt) => {
      const dong = apt.eupmyeondong;
      if (!acc[dong]) {
        acc[dong] = {
          apartmentCount: 0,
          totalHouseholds: 0,
          totalDongs: 0
        };
      }
      
      acc[dong].apartmentCount++;
      acc[dong].totalHouseholds += apt.total_household_count || 0;
      acc[dong].totalDongs += apt.total_dong_count || 0;
      
      return acc;
    }, {} as Record<string, any>);

    return stats;
  }

  /**
   * 아파트 이름 매칭 (실거래가 데이터용)
   */
  static async matchApartmentForTransaction(
    apartmentName: string,
    address: string,
    bjdCode?: string
  ): Promise<ApartmentInfo | null> {
    console.log(`🔍 DB에서 아파트 매칭: ${apartmentName} (${address})`);

    // 1. BJD 코드로 지역 필터링
    let query = supabase
      .from('apartments')
      .select('*')
      .eq('is_active', true);

    if (bjdCode) {
      query = query.eq('bjd_code', bjdCode);
    }

    const { data: candidateApartments, error } = await query;

    if (error) {
      console.error('후보 아파트 조회 오류:', error);
      return null;
    }

    if (!candidateApartments || candidateApartments.length === 0) {
      console.log('  ❌ 해당 지역에 아파트가 없습니다.');
      return null;
    }

    console.log(`  📋 후보 아파트 ${candidateApartments.length}개 검토 중...`);

    // 2. 이름 매칭
    const bestMatch = this.findBestNameMatch(apartmentName, candidateApartments);

    if (bestMatch) {
      console.log(`  ✅ 매칭 성공: ${apartmentName} → ${bestMatch.name} (${bestMatch.kapt_code})`);
      return bestMatch;
    }

    console.log(`  ❌ 매칭 실패: ${apartmentName}`);
    return null;
  }

  /**
   * 이름 기반 최적 매칭 찾기
   */
  private static findBestNameMatch(
    targetName: string, 
    candidates: ApartmentInfo[]
  ): ApartmentInfo | null {
    const normalizeText = (text: string) => 
      text.replace(/[^가-힣\w]/g, '').toLowerCase();

    const targetNormalized = normalizeText(targetName);

    // 1. 정확한 매칭
    for (const candidate of candidates) {
      if (normalizeText(candidate.name) === targetNormalized) {
        return candidate;
      }
    }

    // 2. 포함 관계 매칭
    for (const candidate of candidates) {
      const candidateNormalized = normalizeText(candidate.name);
      if (candidateNormalized.includes(targetNormalized) || 
          targetNormalized.includes(candidateNormalized)) {
        return candidate;
      }
    }

    // 3. 키워드 매칭
    const keywords = targetName
      .replace(/[^가-힣\w]/g, ' ')
      .split(/\s+/)
      .filter(k => k.length >= 2);

    for (const keyword of keywords) {
      for (const candidate of candidates) {
        if (candidate.name.includes(keyword)) {
          return candidate;
        }
      }
    }

    return null;
  }

  /**
   * 데이터베이스 상태 확인
   */
  static async getDbStatus() {
    const { count: totalCount, error: totalError } = await supabase
      .from('apartments')
      .select('*', { count: 'exact', head: true });

    const { count: activeCount, error: activeError } = await supabase
      .from('apartments')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    if (totalError || activeError) {
      throw new Error('데이터베이스 상태 확인 실패');
    }

    return {
      totalApartments: totalCount || 0,
      activeApartments: activeCount || 0,
      inactiveApartments: (totalCount || 0) - (activeCount || 0)
    };
  }
}