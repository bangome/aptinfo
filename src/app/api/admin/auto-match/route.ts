/**
 * 자동 매칭 API
 * 읍면동이 같고 번지수가 유사한 거래를 자동으로 단지와 매칭
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { normalizeError, logError } from '@/lib/error-handling';

/**
 * 번지수 유사도 계산
 * "123-45" 형식의 번지를 비교
 */
function calculateJibunSimilarity(jibun1: string, jibun2: string): number {
  if (!jibun1 || !jibun2) return 0;

  // 숫자만 추출
  const nums1 = jibun1.match(/\d+/g);
  const nums2 = jibun2.match(/\d+/g);

  if (!nums1 || !nums2) return 0;

  // 본번이 같으면 높은 점수
  if (nums1[0] === nums2[0]) {
    // 부번도 같으면 100점
    if (nums1[1] && nums2[1] && nums1[1] === nums2[1]) {
      return 100;
    }
    // 본번만 같으면 80점
    return 80;
  }

  // 본번이 인접하면 50점 (예: 123과 124)
  if (nums1[0] && nums2[0]) {
    const diff = Math.abs(parseInt(nums1[0]) - parseInt(nums2[0]));
    if (diff <= 2) {
      return 50 - (diff * 10);
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
    const { threshold = 70, maxMatches = 100 } = body;

    const matchedResults: any[] = [];
    const errors: string[] = [];

    // 1. 미매칭 매매 거래 조회
    const { data: unmatchedTrades } = await supabase
      .from('apartment_trade_transactions')
      .select('*')
      .is('complex_id', null)
      .not('apartment_name', 'is', null)
      .not('legal_dong', 'is', null)
      .not('jibun', 'is', null)
      .limit(maxMatches);

    // 2. 미매칭 전월세 거래 조회
    const { data: unmatchedRents } = await supabase
      .from('apartment_rent_transactions')
      .select('*')
      .is('complex_id', null)
      .not('apartment_name', 'is', null)
      .not('legal_dong', 'is', null)
      .not('jibun', 'is', null)
      .limit(maxMatches);

    const unmatchedTransactions = [
      ...(unmatchedTrades || []).map(t => ({ ...t, type: 'trade' })),
      ...(unmatchedRents || []).map(r => ({ ...r, type: 'rent' }))
    ];

    console.log(`자동 매칭 시작: ${unmatchedTransactions.length}건의 미매칭 거래`);

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

        // 3-2. 각 단지에 대해 유사도 계산
        const scoredComplexes = candidateComplexes.map(complex => {
          let score = 0;

          // 읍면동 완전 일치 (30점)
          if (complex.legal_dong === transaction.legal_dong) {
            score += 30;
          } else if (complex.legal_dong?.includes(transaction.legal_dong)) {
            score += 20;
          }

          // 번지수 유사도 (40점)
          const jibunScore = calculateJibunSimilarity(
            transaction.jibun,
            complex.jibun || complex.address?.match(/\d+-?\d*/)?.[0] || ''
          );
          score += (jibunScore / 100) * 40;

          // 단지명 유사도 (30점)
          const nameScore = calculateNameSimilarity(
            transaction.apartment_name,
            complex.name
          );
          score += (nameScore / 100) * 30;

          return {
            complex,
            score
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

          const { error: updateError } = await supabase
            .from(updateTable)
            .update({ complex_id: bestMatch.complex.id })
            .eq('id', transaction.id);

          if (updateError) {
            errors.push(`거래 ${transaction.id} 업데이트 실패: ${updateError.message}`);
          } else {
            matchedResults.push({
              transactionId: transaction.id,
              transactionType: transaction.type,
              apartmentName: transaction.apartment_name,
              complexId: bestMatch.complex.id,
              complexName: bestMatch.complex.name,
              score: Math.round(bestMatch.score),
              legalDong: transaction.legal_dong,
              jibun: transaction.jibun
            });
          }
        }

      } catch (error) {
        console.error(`거래 ${transaction.id} 매칭 실패:`, error);
        errors.push(`거래 ${transaction.id} 처리 중 오류`);
      }
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

    return NextResponse.json({
      success: true,
      data: {
        totalProcessed: unmatchedTransactions.length,
        matched: matchedResults.length,
        failed: errors.length,
        matchedTransactions: matchedResults,
        complexStats: Array.from(complexStats.values()),
        errors: errors.slice(0, 10) // 최대 10개 에러만 반환
      },
      message: `${matchedResults.length}건의 거래가 자동으로 매칭되었습니다.`,
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
