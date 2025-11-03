/**
 * 자동 매칭 API
 * 단지명과 관계없이 거래 위치(읍면동+번지)가 단지 주소에 포함되는지 확인하여 자동 매칭
 *
 * 매칭 전략:
 * 1. 같은 시군구(region_code) 내 모든 단지를 후보로 조회 (legal_dong 불일치 허용)
 * 2. 단지의 여러 주소 필드(address, road_address, kapt_addr, jibun)에서 위치 패턴 검색
 *
 * 매칭 우선순위:
 * 1. 단지 주소에 "읍면동 번지" 패턴 포함 = 100점 (확정 매칭, 단지명 무관)
 *    - 예: 거래 "만수동 844-1" → 단지 주소 "인천광역시 남동구 만수동 844-1"
 *    - legal_dong이 다르더라도 (예: "만수동" vs "만수1동") 주소에 포함되면 매칭
 * 2. 위치 패턴 미포함 시 유사도 점수 계산:
 *    - 읍면동 일치: 40점
 *    - 번지 유사도: 50점 (본번+부번 일치)
 *    - 단지명 유사도: 10점
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { normalizeError, logError } from '@/lib/error-handling';

/**
 * 거래 위치(읍면동+번지)가 단지의 여러 주소 필드에 포함되는지 확인
 * 예: "숭의동 462"가 "서울시 용산구 숭의동 462-1~462-50"에 포함되는지
 */
function isLocationInComplex(legalDong: string, jibun: string, complex: any): boolean {
  if (!legalDong || !jibun) return false;

  // 읍면동과 번지를 조합한 위치 패턴
  const locationPattern = `${legalDong} ${jibun}`;

  // 단지의 여러 주소 필드를 모두 확인
  const addressFields = [
    complex.address,
    complex.road_address,
    complex.kapt_addr,
    complex.jibun
  ].filter(Boolean); // null/undefined 제외

  // 어느 하나라도 위치 패턴을 포함하면 true
  return addressFields.some(addr => addr.includes(locationPattern));
}

/**
 * 번지수 일치도 계산
 * "123-45" 형식의 번지를 비교하여 정확한 일치를 우선시
 */
function calculateJibunSimilarity(jibun1: string, jibun2: string): number {
  if (!jibun1 || !jibun2) return 0;

  // 숫자만 추출
  const nums1 = jibun1.match(/\d+/g);
  const nums2 = jibun2.match(/\d+/g);

  if (!nums1 || !nums2) return 0;

  const bonbun1 = nums1[0];
  const bubun1 = nums1[1];
  const bonbun2 = nums2[0];
  const bubun2 = nums2[1];

  // 본번이 같은 경우
  if (bonbun1 === bonbun2) {
    // 본번+부번 완전 일치 = 100점 (확정)
    if (bubun1 && bubun2 && bubun1 === bubun2) {
      return 100;
    }
    // 부번이 하나만 있거나 둘 다 없는 경우 = 90점 (높은 확률)
    if (!bubun1 || !bubun2) {
      return 90;
    }
    // 본번은 같지만 부번이 다른 경우 = 70점 (같은 블록)
    return 70;
  }

  // 본번이 인접한 경우 (±1) = 40~50점
  if (bonbun1 && bonbun2) {
    const diff = Math.abs(parseInt(bonbun1) - parseInt(bonbun2));
    if (diff === 1) {
      return 50; // 바로 옆 번지
    }
    if (diff === 2) {
      return 35; // 2칸 차이
    }
  }

  return 0;
}

/**
 * 단지명 유사도 계산
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

function calculateNameSimilarity(name1: string, name2: string): number {
  const n1 = normalizeApartmentName(name1);
  const n2 = normalizeApartmentName(name2);

  if (n1 === n2) return 100;
  if (n1.includes(n2) || n2.includes(n1)) return 80;

  // Levenshtein Distance 간단 버전
  const maxLen = Math.max(n1.length, n2.length);
  if (maxLen === 0) return 0;

  let matches = 0;
  for (let i = 0; i < Math.min(n1.length, n2.length); i++) {
    if (n1[i] === n2[i]) matches++;
  }

  return (matches / maxLen) * 100;
}

/**
 * 자동 매칭 실행
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { threshold = 70, batchSize = 200, maxBatches = 50 } = body;

    const matchedResults: any[] = [];
    const errors: string[] = [];
    let totalProcessed = 0;
    let batchCount = 0;

    console.log(`자동 매칭 시작 (배치 크기: ${batchSize}, 최대 배치: ${maxBatches})`);

    // 배치 반복 처리
    while (batchCount < maxBatches) {
      batchCount++;

      // 1. 미매칭 매매 거래 조회 (일관된 순서로 처리하기 위해 created_at 정렬)
      const { data: unmatchedTrades } = await supabase
        .from('apartment_trade_transactions')
        .select('*')
        .is('complex_id', null)
        .not('apartment_name', 'is', null)
        .not('legal_dong', 'is', null)
        .not('jibun', 'is', null)
        .order('created_at', { ascending: true })
        .limit(batchSize / 2);

      // 2. 미매칭 전월세 거래 조회 (일관된 순서로 처리하기 위해 created_at 정렬)
      const { data: unmatchedRents } = await supabase
        .from('apartment_rent_transactions')
        .select('*')
        .is('complex_id', null)
        .not('apartment_name', 'is', null)
        .not('legal_dong', 'is', null)
        .not('jibun', 'is', null)
        .order('created_at', { ascending: true })
        .limit(batchSize / 2);

      const unmatchedTransactions = [
        ...(unmatchedTrades || []).map(t => ({ ...t, type: 'trade' })),
        ...(unmatchedRents || []).map(r => ({ ...r, type: 'rent' }))
      ];

      // 미매칭 거래가 없으면 종료
      if (unmatchedTransactions.length === 0) {
        console.log(`배치 ${batchCount}: 더 이상 미매칭 거래가 없습니다.`);
        break;
      }

      console.log(`배치 ${batchCount}: ${unmatchedTransactions.length}건 처리 중...`);
      totalProcessed += unmatchedTransactions.length;

      let batchMatchAttempts = 0;
      let batchSuccessfulMatches = 0;
      let batchNoCandidates = 0;
      let batchLowScore = 0;

      // 3. 각 거래에 대해 매칭 시도
      for (const transaction of unmatchedTransactions) {
        try {
          batchMatchAttempts++;

          // 3-1. 같은 지역코드(시군구)의 모든 단지 조회
          // 위치 패턴(읍면동+번지)이 주소에 포함되는지 확인하기 위해 넓게 검색
          const { data: candidateComplexes } = await supabase
            .from('apartment_complexes')
            .select('*')
            .eq('region_code', transaction.region_code)
            .limit(500); // 같은 시군구 내 모든 단지 검토

          if (!candidateComplexes || candidateComplexes.length === 0) {
            batchNoCandidates++;
            continue;
          }

          // 3-2. 각 단지에 대해 위치 패턴 일치 여부 확인
          const scoredComplexes = candidateComplexes.map(complex => {
            let score = 0;

            // ✨ 우선 순위 1: "읍면동 번지" 패턴이 단지의 여러 주소 필드에 포함되는지 확인
            // 단지명과 관계없이 위치가 주소에 포함되면 100% 확정 매칭
            if (isLocationInComplex(transaction.legal_dong, transaction.jibun, complex)) {
              return {
                complex,
                score: 100,
                matchType: 'location_pattern_match',
                locationPattern: `${transaction.legal_dong} ${transaction.jibun}`,
                matchedAddress: complex.address || complex.kapt_addr || complex.jibun
              };
            }

            // 위치 패턴이 없으면 기존 점수 계산 로직 사용
            // 읍면동 일치도 (40점)
            if (complex.legal_dong === transaction.legal_dong) {
              score += 40; // 완전 일치
            } else if (complex.legal_dong?.includes(transaction.legal_dong)) {
              score += 20; // 부분 일치
            } else if (transaction.legal_dong?.includes(complex.legal_dong || '')) {
              score += 15; // 역방향 부분 일치
            }

            // 번지수 일치도 (50점)
            const jibunScore = calculateJibunSimilarity(
              transaction.jibun,
              complex.jibun || complex.address?.match(/\d+-?\d*/)?.[0] || ''
            );
            score += (jibunScore / 100) * 50;

            // 단지명 유사도 (10점)
            const nameScore = calculateNameSimilarity(
              transaction.apartment_name,
              complex.name
            );
            score += (nameScore / 100) * 10;

            return {
              complex,
              score,
              matchType: 'similarity',
              jibunScore,
              nameScore
            };
          });

          // 3-3. 가장 높은 유사도 찾기
          scoredComplexes.sort((a, b) => b.score - a.score);
          const bestMatch = scoredComplexes[0];

          // 3-4. 임계값 이상이면 매칭
          if (bestMatch && bestMatch.score >= threshold) {
            batchSuccessfulMatches++;
            const updateTable = transaction.type === 'trade'
              ? 'apartment_trade_transactions'
              : 'apartment_rent_transactions';

            // 동일한 위치(아파트명+지역코드+법정동+번지)의 모든 미매칭 거래를 한 번에 매칭
            const { error: updateError, count } = await supabase
              .from(updateTable)
              .update({ complex_id: bestMatch.complex.id })
              .is('complex_id', null) // 미매칭 거래만
              .eq('apartment_name', transaction.apartment_name)
              .eq('region_code', transaction.region_code)
              .eq('legal_dong', transaction.legal_dong)
              .eq('jibun', transaction.jibun)
              .select('id', { count: 'exact', head: false });

            if (updateError) {
              errors.push(`거래 ${transaction.id} 업데이트 실패: ${updateError.message}`);
            } else {
              const matchedCount = count || 1;
              matchedResults.push({
                transactionId: transaction.id,
                transactionType: transaction.type,
                apartmentName: transaction.apartment_name,
                complexId: bestMatch.complex.id,
                complexName: bestMatch.complex.name,
                score: Math.round(bestMatch.score),
                legalDong: transaction.legal_dong,
                jibun: transaction.jibun,
                batch: batchCount,
                batchMatchedCount: matchedCount // 같은 조건으로 매칭된 거래 수
              });
            }
          } else {
            // 임계값 미만
            batchLowScore++;
          }

        } catch (error) {
          console.error(`거래 ${transaction.id} 매칭 실패:`, error);
          errors.push(`거래 ${transaction.id} 처리 중 오류`);
        }
      }

      const batchMatched = matchedResults.filter(r => r.batch === batchCount).length;
      console.log(`배치 ${batchCount} 완료:`, {
        처리시도: batchMatchAttempts,
        매칭성공: batchSuccessfulMatches,
        후보없음: batchNoCandidates,
        점수미달: batchLowScore,
        실제매칭건수: batchMatched,
        매칭률: `${batchMatchAttempts > 0 ? ((batchSuccessfulMatches / batchMatchAttempts) * 100).toFixed(1) : 0}%`
      });

      // 작은 휴식 (API 부하 방지)
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // 4. 매칭된 거래들의 단지별 통계
    const complexStats = new Map<string, any>();
    for (const result of matchedResults) {
      if (!complexStats.has(result.complexId)) {
        complexStats.set(result.complexId, {
          complexName: result.complexName,
          count: 0,
          transactions: []
        });
      }
      const stat = complexStats.get(result.complexId)!;
      stat.count++;
      stat.transactions.push(result);
    }

    console.log(`자동 매칭 완료: 총 ${totalProcessed}건 처리, ${matchedResults.length}건 매칭됨 (${batchCount}개 배치)`);

    return NextResponse.json({
      success: true,
      data: {
        totalProcessed,
        matched: matchedResults.length,
        failed: errors.length,
        batchesProcessed: batchCount,
        matchedTransactions: matchedResults.slice(0, 100), // 최대 100개만 반환 (메모리 절약)
        complexStats: Array.from(complexStats.values()),
        errors: errors.slice(0, 10) // 최대 10개 에러만 반환
      },
      message: `${batchCount}개 배치에서 총 ${totalProcessed}건 처리, ${matchedResults.length}건이 자동으로 매칭되었습니다.`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    const normalizedError = normalizeError(error);
    logError(normalizedError, { endpoint: '/api/admin/auto-match', method: 'POST' });

    return NextResponse.json({
      success: false,
      error: normalizedError.userMessage,
      code: normalizedError.code
    }, { status: 500 });
  }
}
