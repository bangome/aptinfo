/**
 * 동기화 로그 조회 API 엔드포인트
 * 관리자용 동기화 작업 모니터링
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { normalizeError, logError } from '@/lib/error-handling';

/**
 * 동기화 로그 조회
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    const supabase = await createClient();
    
    let query = supabase
      .from('sync_job_logs')
      .select('*')
      .order('start_time', { ascending: false });
    
    // 필터 적용
    if (jobId) {
      query = query.eq('job_id', jobId);
    }
    
    if (status) {
      query = query.eq('status', status);
    }
    
    // 페이지네이션
    query = query.range(offset, offset + limit - 1);
    
    const { data: logs, error, count } = await query;
    
    if (error) {
      throw error;
    }
    
    // 통계 데이터도 함께 조회
    const { data: statistics } = await supabase
      .from('sync_job_statistics')
      .select('*')
      .order('last_run_time', { ascending: false });
    
    return NextResponse.json({
      success: true,
      data: {
        logs: logs || [],
        statistics: statistics || [],
        pagination: {
          offset,
          limit,
          total: count || 0
        }
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    const normalizedError = normalizeError(error);
    logError(normalizedError, { endpoint: '/api/admin/sync-logs', method: 'GET' });
    
    return NextResponse.json({
      success: false,
      error: normalizedError.userMessage,
      code: normalizedError.code
    }, { status: 500 });
  }
}

/**
 * 동기화 로그 삭제 (정리)
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const daysToKeep = parseInt(searchParams.get('daysToKeep') || '30');
    
    const supabase = await createClient();
    
    // 지정된 일수보다 오래된 로그 삭제
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    const { data, error } = await supabase
      .from('sync_job_logs')
      .delete()
      .lt('start_time', cutoffDate.toISOString());
    
    if (error) {
      throw error;
    }
    
    return NextResponse.json({
      success: true,
      message: `${daysToKeep}일보다 오래된 로그가 삭제되었습니다`,
      deletedAt: new Date().toISOString()
    });
    
  } catch (error) {
    const normalizedError = normalizeError(error);
    logError(normalizedError, { endpoint: '/api/admin/sync-logs', method: 'DELETE' });
    
    return NextResponse.json({
      success: false,
      error: normalizedError.userMessage,
      code: normalizedError.code
    }, { status: 500 });
  }
}