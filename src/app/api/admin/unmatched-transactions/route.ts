/**
 * 미매칭 거래 데이터 조회 API
 * 단지 정보와 연결되지 않은 거래 데이터 목록 반환
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { normalizeError, logError } from '@/lib/error-handling';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const transactionType = searchParams.get('type') || 'all'; // 'trade', 'rent', 'all'
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const regionCode = searchParams.get('regionCode');

    let unmatchedTransactions: any[] = [];
    let totalCount = 0;

    // 매매 거래
    if (transactionType === 'trade' || transactionType === 'all') {
      let query = supabase
        .from('apartment_trade_transactions')
        .select('*', { count: 'exact' })
        .is('complex_id', null)
        .order('match_failed', { ascending: true }) // false(매칭 가능) 먼저, true(매칭 실패) 나중
        .order('deal_date', { ascending: false });

      if (regionCode) {
        query = query.eq('region_code', regionCode);
      }

      const { data: tradeData, count: tradeCount } = await query
        .range(offset, offset + limit - 1);

      if (tradeData) {
        unmatchedTransactions.push(...tradeData.map((t: any) => ({
          ...t,
          transaction_type: 'trade'
        })));
      }
      totalCount += tradeCount || 0;
    }

    // 전월세 거래
    if (transactionType === 'rent' || transactionType === 'all') {
      let query = supabase
        .from('apartment_rent_transactions')
        .select('*', { count: 'exact' })
        .is('complex_id', null)
        .order('match_failed', { ascending: true }) // false(매칭 가능) 먼저, true(매칭 실패) 나중
        .order('deal_date', { ascending: false });

      if (regionCode) {
        query = query.eq('region_code', regionCode);
      }

      const { data: rentData, count: rentCount } = await query
        .range(offset, offset + limit - 1);

      if (rentData) {
        unmatchedTransactions.push(...rentData.map((r: any) => ({
          ...r,
          transaction_type: 'rent'
        })));
      }
      totalCount += rentCount || 0;
    }

    // match_failed 우선, 그 다음 거래일자 기준으로 정렬
    unmatchedTransactions.sort((a, b) => {
      // match_failed가 false인 것을 먼저 (매칭 가능한 것 우선)
      if (a.match_failed !== b.match_failed) {
        return a.match_failed ? 1 : -1;
      }
      // match_failed가 같으면 거래일자로 정렬
      return new Date(b.deal_date).getTime() - new Date(a.deal_date).getTime();
    });

    // limit 적용
    if (transactionType === 'all') {
      unmatchedTransactions = unmatchedTransactions.slice(0, limit);
    }

    return NextResponse.json({
      success: true,
      data: {
        transactions: unmatchedTransactions,
        total: totalCount,
        limit,
        offset
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    const normalizedError = normalizeError(error);
    logError(normalizedError, { endpoint: '/api/admin/unmatched-transactions', method: 'GET' });

    return NextResponse.json({
      success: false,
      error: normalizedError.userMessage,
      code: normalizedError.code
    }, { status: 500 });
  }
}
