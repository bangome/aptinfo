/**
 * 데이터 현황 조회 API 엔드포인트
 * 관리자용 데이터 통계 및 상태 확인
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { normalizeError, logError } from '@/lib/error-handling';

/**
 * 데이터 현황 조회
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 1. 지역별 데이터 현황 (단지 수 포함)
    // 매매와 전월세 데이터를 각각 조회하여 complex_id로 조인
    const { data: tradeData } = await supabase
      .from('apartment_trade_transactions')
      .select('complex_id')
      .not('complex_id', 'is', null)
      .range(0, 100000);

    const { data: rentData } = await supabase
      .from('apartment_rent_transactions')
      .select('complex_id')
      .not('complex_id', 'is', null)
      .range(0, 100000);

    const { data: complexes } = await supabase
      .from('apartment_complexes')
      .select('id, sido, region_code')
      .not('sido', 'is', null)
      .range(0, 100000);

    let regionData: any[] = [];
    if (complexes && (tradeData || rentData)) {
      const regionMap = new Map<string, { trades: number; rents: number; complexes: number; region_code: string }>();
      const complexMap = new Map<string, { sido: string; region_code: string }>();

      // 단지 ID를 sido로 매핑 및 단지 수 카운트
      complexes.forEach((c: any) => {
        complexMap.set(c.id, { sido: c.sido, region_code: c.region_code });

        if (!regionMap.has(c.sido)) {
          regionMap.set(c.sido, { trades: 0, rents: 0, complexes: 0, region_code: c.region_code });
        }
        regionMap.get(c.sido)!.complexes++;
      });

      // 매매 데이터 집계
      tradeData?.forEach((t: any) => {
        const complex = complexMap.get(t.complex_id);
        if (complex) {
          const key = complex.sido;
          if (!regionMap.has(key)) {
            regionMap.set(key, { trades: 0, rents: 0, complexes: 0, region_code: complex.region_code });
          }
          regionMap.get(key)!.trades++;
        }
      });

      // 전월세 데이터 집계
      rentData?.forEach((r: any) => {
        const complex = complexMap.get(r.complex_id);
        if (complex) {
          const key = complex.sido;
          if (!regionMap.has(key)) {
            regionMap.set(key, { trades: 0, rents: 0, complexes: 0, region_code: complex.region_code });
          }
          regionMap.get(key)!.rents++;
        }
      });

      regionData = Array.from(regionMap.entries())
        .map(([name, stats]) => ({
          region_code: stats.region_code,
          region_name: name,
          trade_count: stats.trades,
          rent_count: stats.rents,
          complex_count: stats.complexes,
          total_count: stats.trades + stats.rents
        }))
        .sort((a, b) => b.total_count - a.total_count);
    }

    // 2. 월별 데이터 현황 (최근 12개월) - SQL aggregation으로 직접 집계
    const { data: monthlyAggregation, error: monthlyAggError } = await supabase
      .rpc('get_monthly_statistics' as any, { months: 12 });

    let monthlyData: any[] = [];
    if (monthlyAggError) {
      console.warn('월별 통계 RPC 함수 없음, 대체 방법 사용:', monthlyAggError);

      // 대체: raw SQL 사용 (Supabase admin API 필요)
      // 임시로 간단한 방법 사용
      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
      const dateStr = twelveMonthsAgo.toISOString().split('T')[0];

      // 매매 데이터 월별 집계 (limit 우회)
      const { data: tradeMonthly } = await supabase
        .from('apartment_trade_transactions')
        .select('deal_date')
        .gte('deal_date', dateStr)
        .range(0, 100000);  // 충분히 큰 범위 지정

      // 전월세 데이터 월별 집계 (limit 우회)
      const { data: rentMonthly } = await supabase
        .from('apartment_rent_transactions')
        .select('deal_date')
        .gte('deal_date', dateStr)
        .range(0, 100000);  // 충분히 큰 범위 지정

      // JavaScript로 집계 (모든 데이터를 가져오므로 limit 없음)
      const monthlyMap = new Map<string, { trades: number; rents: number }>();

      tradeMonthly?.forEach((item: any) => {
        const month = item.deal_date.substring(0, 7);
        if (!monthlyMap.has(month)) {
          monthlyMap.set(month, { trades: 0, rents: 0 });
        }
        monthlyMap.get(month)!.trades++;
      });

      rentMonthly?.forEach((item: any) => {
        const month = item.deal_date.substring(0, 7);
        if (!monthlyMap.has(month)) {
          monthlyMap.set(month, { trades: 0, rents: 0 });
        }
        monthlyMap.get(month)!.rents++;
      });

      monthlyData = Array.from(monthlyMap.entries())
        .map(([month, stats]) => ({
          month,
          trade_count: stats.trades,
          rent_count: stats.rents,
          total_count: stats.trades + stats.rents
        }))
        .sort((a, b) => b.month.localeCompare(a.month))
        .slice(0, 12);
    } else {
      monthlyData = monthlyAggregation || [];
    }

    // 3. 최근 데이터 업데이트 이력
    const { data: recentTrades } = await supabase
      .from('apartment_trade_transactions')
      .select('created_at, apartment_name, deal_amount, region_code')
      .order('created_at', { ascending: false })
      .limit(10);

    const { data: recentRents } = await supabase
      .from('apartment_rent_transactions')
      .select('created_at, apartment_name, deposit_amount, monthly_rent, region_code')
      .order('created_at', { ascending: false })
      .limit(10);

    // 4. 동기화 로그 요약
    const { data: syncLogs } = await supabase
      .from('sync_job_logs')
      .select('*')
      .order('start_time', { ascending: false })
      .limit(10);

    // 5. 전체 통계
    const { count: complexCount } = await supabase
      .from('apartment_complexes')
      .select('*', { count: 'exact', head: true });

    const { count: tradeCount } = await supabase
      .from('apartment_trade_transactions')
      .select('*', { count: 'exact', head: true });

    const { count: rentCount } = await supabase
      .from('apartment_rent_transactions')
      .select('*', { count: 'exact', head: true });

    const { count: managementFeeCount } = await supabase
      .from('apartment_management_fees')
      .select('*', { count: 'exact', head: true });

    // 6. 최근 업데이트 시간
    const { data: lastTradeUpdate } = await supabase
      .from('apartment_trade_transactions')
      .select('created_at')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const { data: lastRentUpdate } = await supabase
      .from('apartment_rent_transactions')
      .select('created_at')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalComplexes: complexCount || 0,
          totalTrades: tradeCount || 0,
          totalRents: rentCount || 0,
          totalManagementFees: managementFeeCount || 0,
          lastTradeUpdate: (lastTradeUpdate as any)?.created_at || null,
          lastRentUpdate: (lastRentUpdate as any)?.created_at || null
        },
        regionStats: regionData || [],
        monthlyStats: monthlyData,
        recentUpdates: {
          trades: recentTrades || [],
          rents: recentRents || []
        },
        syncLogs: syncLogs || []
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    const normalizedError = normalizeError(error);
    logError(normalizedError, { endpoint: '/api/admin/data-status', method: 'GET' });

    return NextResponse.json({
      success: false,
      error: normalizedError.userMessage,
      code: normalizedError.code
    }, { status: 500 });
  }
}
