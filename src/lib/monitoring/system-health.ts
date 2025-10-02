/**
 * 시스템 헬스 체크 및 모니터링 유틸리티
 */

import { createClient } from '@supabase/supabase-js';

interface HealthCheckResult {
  service: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  responseTime?: number;
  error?: string;
  lastCheck: string;
  details?: Record<string, any>;
}

interface SystemMetrics {
  database: {
    totalComplexes: number;
    totalApartments: number;
    totalTransactions: number;
    totalManagementFees: number;
    lastDataUpdate: string;
  };
  api: {
    schedulerStatus: string;
    lastSchedulerRun: string;
    totalApiCalls: number;
    errorRate: number;
  };
  performance: {
    averageResponseTime: number;
    uptime: string;
    memoryUsage?: number;
  };
}

export class SystemHealthMonitor {
  private supabaseUrl: string;
  private supabaseKey: string;
  
  constructor() {
    this.supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://saucdbvjjwqgvbhcylhv.supabase.co';
    this.supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhdWNkYnZqandxZ3ZiaGN5bGh2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODAxMDQyNCwiZXhwIjoyMDczNTg2NDI0fQ.nHI5FAi6l29fyhkVRDmOeT3FJBV4_UsmM5_V28Bl-VA';
  }

  /**
   * 데이터베이스 헬스 체크
   */
  async checkDatabaseHealth(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      const supabase = createClient(this.supabaseUrl, this.supabaseKey);
      
      // 기본 연결 테스트
      const { data, error } = await supabase
        .from('apartment_complexes')
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        return {
          service: 'database',
          status: 'unhealthy',
          error: error.message,
          lastCheck: new Date().toISOString(),
          responseTime: Date.now() - startTime
        };
      }

      return {
        service: 'database',
        status: 'healthy',
        lastCheck: new Date().toISOString(),
        responseTime: Date.now() - startTime,
        details: {
          connectionValid: true,
          queryExecuted: true
        }
      };
    } catch (error) {
      return {
        service: 'database',
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        lastCheck: new Date().toISOString(),
        responseTime: Date.now() - startTime
      };
    }
  }

  /**
   * 스케줄러 API 헬스 체크
   */
  async checkSchedulerHealth(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      // 일단 스케줄러는 건너뛰고 degraded 상태로 표시
      return {
        service: 'scheduler',
        status: 'degraded',
        lastCheck: new Date().toISOString(),
        responseTime: Date.now() - startTime,
        details: { message: 'Scheduler status check skipped for now' }
      };
    } catch (error) {
      return {
        service: 'scheduler',
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        lastCheck: new Date().toISOString(),
        responseTime: Date.now() - startTime
      };
    }
  }

  /**
   * 실거래 API 헬스 체크
   */
  async checkRealEstateApiHealth(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      // 일단 실거래 API도 건너뛰고 degraded 상태로 표시
      return {
        service: 'real-estate-api',
        status: 'degraded',
        lastCheck: new Date().toISOString(),
        responseTime: Date.now() - startTime,
        details: { message: 'Real estate API check skipped for now' }
      };
    } catch (error) {
      return {
        service: 'real-estate-api',
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        lastCheck: new Date().toISOString(),
        responseTime: Date.now() - startTime
      };
    }
  }

  /**
   * 시스템 메트릭 수집
   */
  async getSystemMetrics(): Promise<SystemMetrics> {
    try {
      const supabase = createClient(this.supabaseUrl, this.supabaseKey);
      
      // 데이터베이스 메트릭
      const [complexes, apartments, transactions, managementFees] = await Promise.all([
        supabase.from('apartment_complexes').select('*', { count: 'exact', head: true }),
        supabase.from('apartments').select('*', { count: 'exact', head: true }),
        supabase.from('trade_transactions').select('*', { count: 'exact', head: true }),
        supabase.from('management_fees').select('*', { count: 'exact', head: true })
      ]);

      // 최근 데이터 업데이트 시간
      const { data: lastUpdate } = await supabase
        .from('apartments')
        .select('created_at')
        .order('created_at', { ascending: false })
        .limit(1);

      // 스케줄러 상태 (일단 mock 데이터)
      const schedulerData = {
        isRunning: false,
        lastRun: null,
        totalJobs: 0,
        errors: []
      };

      return {
        database: {
          totalComplexes: complexes.count || 0,
          totalApartments: apartments.count || 0,
          totalTransactions: transactions.count || 0,
          totalManagementFees: managementFees.count || 0,
          lastDataUpdate: lastUpdate?.[0]?.created_at || 'N/A'
        },
        api: {
          schedulerStatus: schedulerData.isRunning ? 'Running' : 'Stopped',
          lastSchedulerRun: schedulerData.lastRun || 'N/A',
          totalApiCalls: schedulerData.totalJobs || 0,
          errorRate: schedulerData.errors?.length || 0
        },
        performance: {
          averageResponseTime: 0, // TODO: 실제 측정 데이터로 업데이트
          uptime: this.getUptime()
        }
      };
    } catch (error) {
      console.error('Failed to get system metrics:', error);
      throw error;
    }
  }

  /**
   * 전체 시스템 헬스 체크
   */
  async performFullHealthCheck(): Promise<HealthCheckResult[]> {
    const checks = await Promise.all([
      this.checkDatabaseHealth(),
      this.checkSchedulerHealth(),
      this.checkRealEstateApiHealth()
    ]);

    return checks;
  }

  /**
   * 시스템 업타임 계산 (단순화된 버전)
   */
  private getUptime(): string {
    const uptime = process.uptime ? process.uptime() : 0;
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }

  /**
   * 알림이 필요한 상태인지 확인
   */
  shouldAlert(results: HealthCheckResult[]): boolean {
    return results.some(result => result.status === 'unhealthy');
  }

  /**
   * 헬스 체크 결과를 요약
   */
  summarizeHealth(results: HealthCheckResult[]): {
    overall: 'healthy' | 'unhealthy' | 'degraded';
    summary: string;
  } {
    const unhealthy = results.filter(r => r.status === 'unhealthy').length;
    const degraded = results.filter(r => r.status === 'degraded').length;
    const healthy = results.filter(r => r.status === 'healthy').length;

    if (unhealthy > 0) {
      return {
        overall: 'unhealthy',
        summary: `${unhealthy}개 서비스 장애, ${degraded}개 성능 저하, ${healthy}개 정상`
      };
    }

    if (degraded > 0) {
      return {
        overall: 'degraded',
        summary: `${degraded}개 서비스 성능 저하, ${healthy}개 정상`
      };
    }

    return {
      overall: 'healthy',
      summary: `모든 ${healthy}개 서비스 정상 운영`
    };
  }
}

export const systemMonitor = new SystemHealthMonitor();