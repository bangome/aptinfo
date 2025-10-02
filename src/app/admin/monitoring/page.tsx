'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card-enhanced';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button-enhanced';
import { 
  Server, 
  Database, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  RefreshCw,
  TrendingUp,
  Users,
  Building,
  FileText,
  Calendar
} from 'lucide-react';

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
  };
}

interface MonitoringData {
  timestamp: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  summary: string;
  shouldAlert: boolean;
  services: HealthCheckResult[];
  metrics: SystemMetrics;
  metadata: {
    totalServices: number;
    healthyServices: number;
    degradedServices: number;
    unhealthyServices: number;
    totalComplexes: number;
    totalApartments: number;
    totalTransactions: number;
    lastDataUpdate: string;
  };
}

export default function MonitoringPage() {
  const [monitoringData, setMonitoringData] = useState<MonitoringData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchMonitoringData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/admin/monitoring');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setMonitoringData(data);
      setLastRefresh(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : '모니터링 데이터 로딩 실패');
      console.error('Monitoring data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonitoringData();
    
    // 30초마다 자동 새로고침
    const interval = setInterval(fetchMonitoringData, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'degraded':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'unhealthy':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default:
        return <Activity className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      healthy: 'default' as const,
      degraded: 'secondary' as const,
      unhealthy: 'destructive' as const
    };

    const labels = {
      healthy: '정상',
      degraded: '성능저하',
      unhealthy: '장애'
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  const getServiceIcon = (serviceName: string) => {
    switch (serviceName) {
      case 'database':
        return <Database className="h-4 w-4" />;
      case 'scheduler':
        return <Clock className="h-4 w-4" />;
      case 'real-estate-api':
        return <Server className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const formatServiceName = (serviceName: string) => {
    const names = {
      database: '데이터베이스',
      scheduler: '스케줄러',
      'real-estate-api': '실거래 API'
    };
    return names[serviceName as keyof typeof names] || serviceName;
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('ko-KR');
    } catch {
      return dateString;
    }
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString('ko-KR');
  };

  if (loading && !monitoringData) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-center min-h-64">
          <div className="flex items-center gap-2 text-muted-foreground">
            <RefreshCw className="h-4 w-4 animate-spin" />
            시스템 상태를 확인하고 있습니다...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card className="border-red-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-red-600 mb-4">
              <AlertTriangle className="h-5 w-5" />
              <h2 className="text-lg font-semibold">모니터링 시스템 오류</h2>
            </div>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={fetchMonitoringData} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              다시 시도
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!monitoringData) return null;

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">시스템 모니터링</h1>
          <p className="text-muted-foreground">
            아파트인포 서비스의 실시간 상태를 모니터링합니다
          </p>
        </div>
        <div className="flex items-center gap-4">
          {lastRefresh && (
            <div className="text-sm text-muted-foreground">
              마지막 업데이트: {lastRefresh.toLocaleTimeString('ko-KR')}
            </div>
          )}
          <Button 
            onClick={fetchMonitoringData} 
            disabled={loading}
            size="sm"
          >
            {loading ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            새로고침
          </Button>
        </div>
      </div>

      {/* System Status Overview */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getStatusIcon(monitoringData.status)}
            전체 시스템 상태
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {getStatusBadge(monitoringData.status)}
              <span className="text-lg font-medium">{monitoringData.summary}</span>
            </div>
            <div className="text-sm text-muted-foreground">
              {formatDate(monitoringData.timestamp)}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Service Health Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {monitoringData.services.map((service) => (
          <Card key={service.service}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-base">
                <div className="flex items-center gap-2">
                  {getServiceIcon(service.service)}
                  {formatServiceName(service.service)}
                </div>
                {getStatusBadge(service.status)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">응답시간:</span>
                  <span>{service.responseTime}ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">마지막 체크:</span>
                  <span>{formatDate(service.lastCheck)}</span>
                </div>
                {service.error && (
                  <div className="text-red-600 text-xs mt-2 p-2 bg-red-50 rounded">
                    {service.error}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* System Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <Building className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-muted-foreground">아파트 단지</span>
            </div>
            <div className="text-2xl font-bold">
              {formatNumber(monitoringData.metrics.database.totalComplexes)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-muted-foreground">아파트</span>
            </div>
            <div className="text-2xl font-bold">
              {formatNumber(monitoringData.metrics.database.totalApartments)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-muted-foreground">실거래</span>
            </div>
            <div className="text-2xl font-bold">
              {formatNumber(monitoringData.metrics.database.totalTransactions)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-muted-foreground">관리비</span>
            </div>
            <div className="text-2xl font-bold">
              {formatNumber(monitoringData.metrics.database.totalManagementFees)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* API Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            API 상태
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground mb-1">스케줄러 상태</div>
              <div className="font-medium">{monitoringData.metrics.api.schedulerStatus}</div>
            </div>
            <div>
              <div className="text-muted-foreground mb-1">마지막 실행</div>
              <div className="font-medium">
                {monitoringData.metrics.api.lastSchedulerRun === 'N/A' 
                  ? 'N/A' 
                  : formatDate(monitoringData.metrics.api.lastSchedulerRun)}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground mb-1">총 API 호출</div>
              <div className="font-medium">{formatNumber(monitoringData.metrics.api.totalApiCalls)}</div>
            </div>
            <div>
              <div className="text-muted-foreground mb-1">업타임</div>
              <div className="font-medium">{monitoringData.metrics.performance.uptime}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}