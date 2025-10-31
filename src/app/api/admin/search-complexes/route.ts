/**
 * 단지 정보 검색 API
 * 이름, 주소, 지역 코드 기반으로 단지 검색
 * 스마트 매칭: 위치 유사도 + 단지명 유사도
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { normalizeError, logError } from '@/lib/error-handling';

/**
 * 문자열 유사도 계산 (Levenshtein Distance)
 * 0~1 사이의 값, 1에 가까울수록 유사
 */
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().replace(/\s/g, '');
  const s2 = str2.toLowerCase().replace(/\s/g, '');

  if (s1 === s2) return 1.0;
  if (s1.length === 0 || s2.length === 0) return 0.0;

  // Levenshtein Distance
  const matrix: number[][] = [];
  for (let i = 0; i <= s2.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= s1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= s2.length; i++) {
    for (let j = 1; j <= s1.length; j++) {
      if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  const maxLen = Math.max(s1.length, s2.length);
  return 1 - matrix[s2.length][s1.length] / maxLen;
}

/**
 * 단지명 정규화 (비교를 위해)
 */
function normalizeApartmentName(name: string): string {
  return name
    .toLowerCase()
    .replace(/아파트|APT|apt/gi, '')
    .replace(/\s+/g, '')
    .replace(/[0-9]+단지/g, '')
    .replace(/[0-9]+차/g, '')
    .trim();
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const query = searchParams.get('q') || '';
    const regionCode = searchParams.get('regionCode');
    const legalDong = searchParams.get('legalDong');
    const limit = parseInt(searchParams.get('limit') || '100'); // 기본 100개로 증가

    if (!query && !regionCode && !legalDong) {
      return NextResponse.json({
        success: false,
        error: '검색어 또는 지역 정보가 필요합니다.'
      }, { status: 400 });
    }

    // 검색어가 있는 경우와 없는 경우를 분리
    if (query) {
      // 1단계: 위치 기반 필터링 (우선순위: 같은 지역)
      let candidateComplexes: any[] = [];

      if (regionCode) {
        const regionPrefix = regionCode.substring(0, 5);

        // 1-1. 같은 시군구 단지 먼저 조회
        const { data: sameRegionComplexes } = await supabase
          .from('apartment_complexes')
          .select('*')
          .like('region_code', `${regionPrefix}%`)
          .limit(500);

        candidateComplexes = sameRegionComplexes || [];

        // 1-2. 같은 시군구에서 충분한 결과가 없으면 전체 검색
        if (candidateComplexes.length < 50) {
          const { data: allComplexes } = await supabase
            .from('apartment_complexes')
            .select('*')
            .limit(500);

          candidateComplexes = allComplexes || [];
        }
      } else {
        // 지역 코드 없으면 전체 검색
        const { data: allComplexes } = await supabase
          .from('apartment_complexes')
          .select('*')
          .limit(500);

        candidateComplexes = allComplexes || [];
      }

      // 2단계: 단지명 유사도 계산
      const normalizedQuery = normalizeApartmentName(query);
      const scoredComplexes = candidateComplexes.map((complex: any) => {
        const normalizedName = normalizeApartmentName(complex.name || '');

        // 유사도 점수 계산
        let score = 0;

        // 2-1. 단지명 유사도 (가중치: 60%)
        const nameSimilarity = calculateSimilarity(normalizedQuery, normalizedName);
        score += nameSimilarity * 60;

        // 2-2. 포함 여부 보너스 (가중치: 20%)
        if (normalizedName.includes(normalizedQuery) || normalizedQuery.includes(normalizedName)) {
          score += 20;
        }

        // 2-3. 지역 일치 보너스 (가중치: 15%)
        if (regionCode && complex.region_code?.startsWith(regionCode.substring(0, 5))) {
          score += 15;
        }

        // 2-4. 법정동 일치 보너스 (가중치: 5%)
        if (legalDong && complex.legal_dong?.includes(legalDong)) {
          score += 5;
        }

        return {
          ...complex,
          similarity_score: score
        };
      });

      // 3단계: 유사도 순으로 정렬 (유사도 > 세대수)
      scoredComplexes.sort((a, b) => {
        // 유사도가 같으면 세대수로 정렬
        if (Math.abs(a.similarity_score - b.similarity_score) < 0.1) {
          return (b.ho_cnt || 0) - (a.ho_cnt || 0);
        }
        return b.similarity_score - a.similarity_score;
      });

      // 4단계: 유사도가 일정 수준 이상인 결과만 반환 (임계값: 30점)
      const filteredComplexes = scoredComplexes.filter(c => c.similarity_score >= 30);

      return NextResponse.json({
        success: true,
        data: {
          complexes: filteredComplexes.slice(0, limit),
          total: filteredComplexes.length
        },
        timestamp: new Date().toISOString()
      });

    } else {
      // 검색어 없이 지역/법정동만 있는 경우
      let dbQuery = supabase
        .from('apartment_complexes')
        .select('*');

      if (regionCode) {
        const regionPrefix = regionCode.substring(0, 5);
        dbQuery = dbQuery.like('region_code', `${regionPrefix}%`);
      }

      if (legalDong) {
        dbQuery = dbQuery.ilike('legal_dong', `%${legalDong}%`);
      }

      dbQuery = dbQuery.order('ho_cnt', { ascending: false, nullsFirst: false });

      const { data: complexes, error } = await dbQuery.limit(limit);

      if (error) {
        throw error;
      }

      return NextResponse.json({
        success: true,
        data: {
          complexes: complexes || [],
          total: complexes?.length || 0
        },
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    const normalizedError = normalizeError(error);
    logError(normalizedError, { endpoint: '/api/admin/search-complexes', method: 'GET' });

    return NextResponse.json({
      success: false,
      error: normalizedError.userMessage,
      code: normalizedError.code
    }, { status: 500 });
  }
}
