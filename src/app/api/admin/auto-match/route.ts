/**
 * 자동 매칭 API
 * 읍면동과 번지 일치를 기준으로 거래를 자동으로 단지와 매칭
 *
 * 매칭 점수 체계 (100점 만점):
 * - 읍면동 완전 일치: 40점
 * - 번지수 본번+부번 일치: 50점 (본번만 일치: 40점, 인접: 20~30점)
 * - 단지명 유사도: 10점 (보조 검증)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { normalizeError, logError } from '@/lib/error-handling';

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

      // 1. 미매칭 매매 거래 조회
      const { data: unmatchedTrades } = await supabase
        .from('apartment_trade_transactions')
        .select('*')
        .is('complex_id', null)
        .not('apartment_name', 'is', null)
        .not('legal_dong', 'is', null)
        .not('jibun', 'is', null)
        .limit(batchSize / 2);

      // 2. 미매칭 전월세 거래 조회
      const { data: unmatchedRents } = await supabase
        .from('apartment_rent_transactions')
        .select('*')
        .is('complex_id', null)
        .not('apartment_name', 'is', null)
        .not('legal_dong', 'is', null)
        .not('jibun', 'is', null)
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

      // 3. 각 거래에 대해 매칭 시도
      for (const transaction of unmatchedTransactions) {
        try {
          // 3-1. 같은 읍면동의 단지 조회
          const { data: candidateComplexes } = await supabase
            .from('apartment_complexes')
            .select('*')
            .ilike('legal_dong', `%${transaction.legal_dong}%`)
            .limit(50);

          if (!candidateComplexes || candidateComplexes.length === 0) {
            continue;
          }

          // 3-2. 각 단지에 대해 읍면동+번지 기준으로 유사도 계산
          const scoredComplexes = candidateComplexes.map(complex => {
            let score = 0;

            // 읍면동 일치도 (40점) - 가장 기본적인 위치 정보
            if (complex.legal_dong === transaction.legal_dong) {
              score += 40; // 완전 일치
            } else if (complex.legal_dong?.includes(transaction.legal_dong)) {
              score += 20; // 부분 일치
            } else if (transaction.legal_dong?.includes(complex.legal_dong || '')) {
              score += 15; // 역방향 부분 일치
            }

            // 번지수 일치도 (50점) - 핵심 매칭 기준
            const jibunScore = calculateJibunSimilarity(
              transaction.jibun,
              complex.jibun || complex.address?.match(/\d+-?\d*/)?.[0] || ''
            );
            score += (jibunScore / 100) * 50;

            // 단지명 유사도 (10점) - 보조 검증용
            const nameScore = calculateNameSimilarity(
              transaction.apartment_name,
              complex.name
            );
            score += (nameScore / 100) * 10;

            return {
              complex,
              score,
              jibunScore, // 디버깅용
              nameScore   // 디버깅용
            };
          });

          // 3-3. 가장 높은 유사도 찾기
          scoredComplexes.sort((a, b) => b.score - a.score);
          const bestMatch = scoredComplexes[0];

          // 3-4. 임계값 이상이면 매칭
          if (bestMatch && bestMatch.score >= threshold) {
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
          }

        } catch (error) {
          console.error(`거래 ${transaction.id} 매칭 실패:`, error);
          errors.push(`거래 ${transaction.id} 처리 중 오류`);
        }
      }

      console.log(`배치 ${batchCount} 완료: ${matchedResults.filter(r => r.batch === batchCount).length}건 매칭됨`);

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
