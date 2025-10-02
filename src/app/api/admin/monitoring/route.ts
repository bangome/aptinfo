/**
 * 시스템 모니터링 API 엔드포인트
 * GET /api/admin/monitoring - 전체 시스템 헬스 체크 및 메트릭 반환
 * GET /api/admin/monitoring?type=health - 헬스 체크만 반환
 * GET /api/admin/monitoring?type=metrics - 메트릭만 반환
 */

import { NextRequest, NextResponse } from 'next/server';
import { systemMonitor } from '@/lib/monitoring/system-health';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    if (type === 'health') {
      // 헬스 체크만 수행
      const healthResults = await systemMonitor.performFullHealthCheck();
      const summary = systemMonitor.summarizeHealth(healthResults);
      const shouldAlert = systemMonitor.shouldAlert(healthResults);

      return NextResponse.json({
        timestamp: new Date().toISOString(),
        status: summary.overall,
        summary: summary.summary,
        shouldAlert,
        services: healthResults,
        metadata: {
          totalServices: healthResults.length,
          healthyServices: healthResults.filter(r => r.status === 'healthy').length,
          degradedServices: healthResults.filter(r => r.status === 'degraded').length,
          unhealthyServices: healthResults.filter(r => r.status === 'unhealthy').length
        }
      });
    }

    if (type === 'metrics') {
      // 메트릭만 수행
      const metrics = await systemMonitor.getSystemMetrics();
      
      return NextResponse.json({
        timestamp: new Date().toISOString(),
        metrics
      });
    }

    // 기본: 헬스 체크 + 메트릭 모두 수행
    const [healthResults, metrics] = await Promise.all([
      systemMonitor.performFullHealthCheck(),
      systemMonitor.getSystemMetrics()
    ]);

    const summary = systemMonitor.summarizeHealth(healthResults);
    const shouldAlert = systemMonitor.shouldAlert(healthResults);

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      status: summary.overall,
      summary: summary.summary,
      shouldAlert,
      services: healthResults,
      metrics,
      metadata: {
        totalServices: healthResults.length,
        healthyServices: healthResults.filter(r => r.status === 'healthy').length,
        degradedServices: healthResults.filter(r => r.status === 'degraded').length,
        unhealthyServices: healthResults.filter(r => r.status === 'unhealthy').length,
        totalComplexes: metrics.database.totalComplexes,
        totalApartments: metrics.database.totalApartments,
        totalTransactions: metrics.database.totalTransactions,
        lastDataUpdate: metrics.database.lastDataUpdate
      }
    });

  } catch (error) {
    console.error('Monitoring API error:', error);
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown monitoring error',
      summary: '모니터링 시스템 오류 발생'
    }, { status: 500 });
  }
}