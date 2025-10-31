'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card-enhanced';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button-enhanced';
import { Progress } from '@/components/ui/progress';
import {
  Database,
  TrendingUp,
  Calendar,
  MapPin,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Building,
  Home,
  FileText,
  Clock,
  BarChart3,
  Download,
  Loader2
} from 'lucide-react';

interface DataStatus {
  summary: {
    totalComplexes: number;
    totalTrades: number;
    totalRents: number;
    totalManagementFees: number;
    lastTradeUpdate: string | null;
    lastRentUpdate: string | null;
  };
  regionStats: Array<{
    region_code: string;
    region_name?: string;
    trade_count: number;
    rent_count: number;
    complex_count: number;
    total_count: number;
  }>;
  monthlyStats: Array<{
    month: string;
    trade_count: number;
    rent_count: number;
    total_count: number;
  }>;
  recentUpdates: {
    trades: Array<{
      created_at: string;
      apartment_name: string;
      deal_amount: number;
      region_code: string;
    }>;
    rents: Array<{
      created_at: string;
      apartment_name: string;
      deposit_amount: number;
      monthly_rent: number;
      region_code: string;
    }>;
  };
  syncLogs: Array<{
    id: string;
    job_name: string;
    status: string;
    start_time: string;
    end_time: string | null;
    total_processed: number;
    total_inserted: number;
    total_updated: number;
    total_errors: number;
  }>;
}

export default function DataStatusPage() {
  const [dataStatus, setDataStatus] = useState<DataStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncStage, setSyncStage] = useState<string>('');

  const fetchDataStatus = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/data-status');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || '데이터 조회 실패');
      }

      setDataStatus(result.data);
      setLastRefresh(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : '데이터 로딩 실패');
      console.error('Data status fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDataStatus();
  }, []);

  const handleSync = async (type: 'recent' | 'full') => {
    try {
      setSyncing(true);
      setSyncMessage(null);
      setError(null);
      setSyncProgress(0);

      // 예상 총 작업 수 (전국 지역 수 * 2(매매+전월세))
      const estimatedTotal = type === 'recent' ? 214 * 2 : 214 * 3 * 2; // recent: 1개월, full: 3개월
      setSyncStage(type === 'recent'
        ? `전국 모든 지역 최근 1개월 데이터 동기화 중... (약 ${estimatedTotal}개 작업)`
        : `전국 모든 지역 최근 3개월 데이터 동기화 중... (약 ${estimatedTotal}개 작업)`);

      // 프로그레스 애니메이션 시작 (더 천천히)
      let currentProgress = 0;
      const progressInterval = setInterval(() => {
        setSyncProgress((prev) => {
          // 85%까지만 점진적으로 증가 (실제 완료는 API 응답 후)
          if (prev >= 85) return prev;
          currentProgress = prev + 1;
          return currentProgress;
        });
      }, type === 'recent' ? 200 : 400); // recent는 200ms, full은 400ms 간격

      const response = await fetch('/api/admin/sync-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type }),
      });

      clearInterval(progressInterval);

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || '동기화 실패');
      }

      // 실제 완료된 작업 수로 100% 설정
      setSyncProgress(100);
      const actualCompleted = result.data?.completed || estimatedTotal;
      const actualTotal = result.data?.total || estimatedTotal;
      setSyncStage(`동기화 완료! (${actualCompleted}/${actualTotal} 작업 완료)`);
      setSyncMessage(result.message || '동기화가 완료되었습니다.');

      // 동기화 완료 후 데이터 새로고침
      await fetchDataStatus();

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '동기화 중 오류가 발생했습니다.';
      setError(errorMessage);
      setSyncProgress(0);
      setSyncStage('');
      console.error('Sync error:', err);
    } finally {
      setSyncing(false);
      // 5초 후 메시지 및 프로그레스 초기화
      setTimeout(() => {
        setSyncMessage(null);
        setSyncProgress(0);
        setSyncStage('');
      }, 5000);
    }
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString('ko-KR');
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('ko-KR');
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 10000) {
      return `${(amount / 10000).toFixed(1)}억`;
    }
    return `${amount.toLocaleString('ko-KR')}만`;
  };

  const getRegionName = (name: string) => {
    // region_name이 이미 시도명이므로 그대로 반환
    return name;
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      success: 'default' as const,
      running: 'secondary' as const,
      error: 'destructive' as const,
      cancelled: 'outline' as const
    };

    const labels = {
      success: '성공',
      running: '실행중',
      error: '실패',
      cancelled: '취소됨'
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  if (loading && !dataStatus) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="flex items-center gap-2 text-muted-foreground">
          <RefreshCw className="h-4 w-4 animate-spin" />
          데이터 현황을 불러오는 중...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-red-600 mb-4">
            <AlertCircle className="h-5 w-5" />
            <h2 className="text-lg font-semibold">데이터 로딩 오류</h2>
          </div>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={fetchDataStatus} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            다시 시도
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!dataStatus) return null;

  return (
    <>
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h2 className="text-xl font-bold mb-2">데이터 현황</h2>
          <p className="text-sm text-muted-foreground">
            수집된 아파트 데이터의 상세 현황을 확인합니다
          </p>
        </div>
        <div className="flex items-center gap-4">
          {lastRefresh && (
            <div className="text-sm text-muted-foreground">
              마지막 업데이트: {lastRefresh.toLocaleTimeString('ko-KR')}
            </div>
          )}
          <Button
            onClick={fetchDataStatus}
            disabled={loading || syncing}
            size="sm"
            variant="outline"
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

      {/* Sync Actions */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            데이터 수동 동기화
          </CardTitle>
        </CardHeader>
        <CardContent>
          {syncMessage && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-800">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm">{syncMessage}</span>
            </div>
          )}

          {syncing && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 mb-3 text-blue-800">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm font-medium">{syncStage}</span>
              </div>
              <Progress value={syncProgress} className="h-2" />
              <div className="text-xs text-blue-600 mt-2 text-right">
                {syncProgress}%
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={() => handleSync('recent')}
              disabled={syncing || loading}
              className="flex-1"
              variant="default"
            >
              {syncing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              최근 1개월 동기화
            </Button>

            <Button
              onClick={() => handleSync('full')}
              disabled={syncing || loading}
              className="flex-1"
              variant="secondary"
            >
              {syncing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              전체 동기화 (최근 3개월)
            </Button>
          </div>

          <div className="mt-4 text-xs text-muted-foreground space-y-1">
            <p>• <strong>최근 1개월 동기화:</strong> 전국 모든 시도(17개)의 주요 시군구(214개) 최신 매매/전월세 거래 데이터를 동기화합니다.</p>
            <p className="ml-4">- 약 428개 API 요청 (214개 지역 × 2종류)</p>
            <p className="ml-4">- 예상 소요 시간: 약 3-5분</p>
            <p>• <strong>전체 동기화 (최근 3개월):</strong> 전국 모든 시도의 주요 시군구 최근 3개월 매매/전월세 데이터를 모두 동기화합니다.</p>
            <p className="ml-4">- 약 1,284개 API 요청 (214개 지역 × 3개월 × 2종류)</p>
            <p className="ml-4">- 예상 소요 시간: 약 10-15분</p>
            <p className="mt-2 text-amber-600">⚠️ 동기화 중에는 다른 작업을 수행하지 마세요. 브라우저 창을 닫지 마세요.</p>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <Building className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-muted-foreground">아파트 단지</span>
            </div>
            <div className="text-2xl font-bold">
              {formatNumber(dataStatus.summary.totalComplexes)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              등록된 단지
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-muted-foreground">매매 실거래</span>
            </div>
            <div className="text-2xl font-bold">
              {formatNumber(dataStatus.summary.totalTrades)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {formatDate(dataStatus.summary.lastTradeUpdate)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <Home className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium text-muted-foreground">전월세 실거래</span>
            </div>
            <div className="text-2xl font-bold">
              {formatNumber(dataStatus.summary.totalRents)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {formatDate(dataStatus.summary.lastRentUpdate)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium text-muted-foreground">관리비</span>
            </div>
            <div className="text-2xl font-bold">
              {formatNumber(dataStatus.summary.totalManagementFees)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              등록된 관리비
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Statistics */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            월별 데이터 현황 (최근 6개월)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dataStatus.monthlyStats.map((stat) => (
              <div key={stat.month} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-4">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{stat.month}</span>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground mb-1">매매</div>
                    <div className="font-semibold text-green-600">{formatNumber(stat.trade_count)}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground mb-1">전월세</div>
                    <div className="font-semibold text-purple-600">{formatNumber(stat.rent_count)}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground mb-1">합계</div>
                    <div className="font-semibold">{formatNumber(stat.total_count)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Region Statistics */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            시도별 데이터 현황
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dataStatus.regionStats.map((stat) => (
              <div key={stat.region_name || stat.region_code} className="p-4 bg-gray-50 rounded-lg">
                <div className="font-medium mb-3">
                  {stat.region_name || getRegionName(stat.region_code)}
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">단지:</span>
                    <span className="font-semibold text-blue-600">{formatNumber(stat.complex_count)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">매매:</span>
                    <span className="font-semibold text-green-600">{formatNumber(stat.trade_count)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">전월세:</span>
                    <span className="font-semibold text-purple-600">{formatNumber(stat.rent_count)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Updates */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              최근 매매 거래
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dataStatus.recentUpdates.trades.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  최근 매매 거래가 없습니다
                </div>
              ) : (
                dataStatus.recentUpdates.trades.slice(0, 5).map((trade, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg text-sm">
                    <div className="font-medium mb-1">{trade.apartment_name}</div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{formatCurrency(trade.deal_amount)}</span>
                      <span>{formatDate(trade.created_at)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="h-5 w-5 text-purple-600" />
              최근 전월세 거래
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dataStatus.recentUpdates.rents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  최근 전월세 거래가 없습니다
                </div>
              ) : (
                dataStatus.recentUpdates.rents.slice(0, 5).map((rent, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg text-sm">
                    <div className="font-medium mb-1">{rent.apartment_name}</div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>보증금 {formatCurrency(rent.deposit_amount)} / 월세 {rent.monthly_rent}만</span>
                      <span>{formatDate(rent.created_at)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sync Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            동기화 로그 (최근 10건)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {dataStatus.syncLogs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                동기화 로그가 없습니다
              </div>
            ) : (
              dataStatus.syncLogs.map((log) => (
                <div key={log.id} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{log.job_name}</span>
                    {getStatusBadge(log.status)}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-xs text-muted-foreground">처리</div>
                      <div className="font-semibold">{formatNumber(log.total_processed)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">신규</div>
                      <div className="font-semibold text-green-600">{formatNumber(log.total_inserted)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">업데이트</div>
                      <div className="font-semibold text-blue-600">{formatNumber(log.total_updated)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">에러</div>
                      <div className={`font-semibold ${log.total_errors > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                        {formatNumber(log.total_errors)}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    {formatDate(log.start_time)}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
