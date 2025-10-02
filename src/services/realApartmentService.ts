/**
 * Supabase DB를 사용하는 아파트 검색 서비스
 */

import { supabaseApartmentService, SearchResponse as SupabaseSearchResponse } from './supabaseApartmentService';
import { SearchFilters, Apartment } from '@/types/apartment';
import { IntegratedApartmentData } from '@/lib/api/real-estate-api';

// DB 기반 서비스로 변경됨 - 캐시 및 더미 데이터 변환 함수 제거

// 검색 결과 인터페이스 (Supabase 서비스와 동일하게 맞춤)
export interface SearchResponse {
  apartments: IntegratedApartmentData[];
  totalCount: number;
  hasMore: boolean;
  currentPage: number;
}

class RealApartmentService {
  // DB 기반 서비스로 변경됨 - Supabase 서비스를 통해 직접 DB 접근

  // 메인 검색 함수 - Supabase DB 사용
  async search(query: string = '', filters: SearchFilters = {}): Promise<SearchResponse> {
    try {
      console.log('realApartmentService.search 호출됨 (Supabase DB 사용):', { query, filters });
      
      // Supabase 서비스 직접 호출
      const result = await supabaseApartmentService.search(query, filters);
      
      console.log('Supabase DB 검색 결과:', {
        총개수: result.totalCount,
        현재페이지개수: result.apartments.length,
        더있음: result.hasMore,
        페이지: result.currentPage
      });
      
      return result;
    } catch (error) {
      console.error('Supabase DB 아파트 검색 중 오류:', error);
      throw new Error('아파트 검색 중 오류가 발생했습니다.');
    }
  }

  // 기존 API 기반 코드 제거됨 - 모든 로직이 Supabase 서비스로 이동됨

  // 특정 아파트 상세 정보 조회 - Supabase DB 사용 (kapt_code 기반)
  async getApartmentById(kaptCode: string): Promise<IntegratedApartmentData | null> {
    try {
      return await supabaseApartmentService.getApartmentById(kaptCode);
    } catch (error) {
      console.error('Supabase DB 아파트 상세 정보 조회 실패:', error);
      return null;
    }
  }

  // 인기 지역 아파트 조회 - Supabase DB 사용
  async getPopularApartments(limit: number = 10): Promise<IntegratedApartmentData[]> {
    try {
      return await supabaseApartmentService.getPopularApartments(limit);
    } catch (error) {
      console.error('Supabase DB 인기 아파트 조회 실패:', error);
      return [];
    }
  }

  // 최근 거래 아파트 조회 - Supabase DB 사용
  async getRecentDeals(limit: number = 10): Promise<IntegratedApartmentData[]> {
    try {
      const result = await supabaseApartmentService.getRecentApartments(limit);
      if (!result || result.length === 0) {
        throw new Error('No recent apartments found in database');
      }
      return result;
    } catch (error) {
      console.error('Supabase DB 최근 아파트 조회 실패:', error);
      throw error; // Re-throw error so main page can use fallback data
    }
  }

  // 캐시 관련 메서드 제거됨 - DB 직접 접근으로 변경
}

// 싱글톤 인스턴스
export const realApartmentService = new RealApartmentService();

// 편의 함수들
export async function searchRealApartments(
  query: string = '',
  filters: SearchFilters = {}
): Promise<SearchResponse> {
  return realApartmentService.search(query, filters);
}

export async function getRealApartmentById(kaptCode: string): Promise<IntegratedApartmentData | null> {
  return realApartmentService.getApartmentById(kaptCode);
}

export async function getPopularRealApartments(limit?: number): Promise<IntegratedApartmentData[]> {
  return realApartmentService.getPopularApartments(limit);
}

export async function getRecentRealDeals(limit?: number): Promise<IntegratedApartmentData[]> {
  return realApartmentService.getRecentDeals(limit);
}