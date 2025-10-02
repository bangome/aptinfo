/**
 * 스케줄러 관리 페이지
 * 관리자용 스케줄러 모니터링 및 제어 인터페이스
 */

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button-enhanced';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card-enhanced';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Clock, PlayCircle, Square, RotateCcw, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SchedulerJob {
  id: string;
  name: string;
  isRunning: boolean;
  lastRun?: string;
  errorCount: number;
  status: 'healthy' | 'warning' | 'error';
}

interface SchedulerStatus {
  totalJobs: number;
  runningJobs: number;
  failedJobs: number;
  jobs: SchedulerJob[];
}

export default function SchedulerAdminPage() {
  const [status, setStatus] = useState<SchedulerStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/admin/scheduler');
      const result = await response.json();
      
      if (result.success) {
        setStatus(result.data);
      } else {
        toast({
          title: '상태 조회 실패',
          description: result.error,
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: '네트워크 오류',
        description: '상태를 조회할 수 없습니다',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGlobalAction = async (action: 'start' | 'stop' | 'restart') => {
    setActionLoading(action);
    
    try {
      const response = await fetch('/api/admin/scheduler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: '성공',
          description: result.message,
          variant: 'default'
        });
        await fetchStatus();
      } else {
        toast({
          title: '실행 실패',
          description: result.error,
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: '네트워크 오류',
        description: '요청을 처리할 수 없습니다',
        variant: 'destructive'
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleJobAction = async (jobId: string, action: 'start' | 'stop' | 'run' | 'remove') => {
    setActionLoading(`${jobId}-${action}`);
    
    try {
      const response = await fetch('/api/admin/scheduler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, jobId })
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: '성공',
          description: result.message,
          variant: 'default'
        });
        await fetchStatus();
      } else {
        toast({
          title: '실행 실패',
          description: result.error,
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: '네트워크 오류',
        description: '요청을 처리할 수 없습니다',
        variant: 'destructive'
      });
    } finally {
      setActionLoading(null);
    }
  };

  const initializeScheduler = async () => {
    setActionLoading('init');
    
    try {
      const response = await fetch('/api/init-scheduler', {
        method: 'POST'
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: '초기화 완료',
          description: result.message,
          variant: 'default'
        });
        await fetchStatus();
      } else {
        toast({
          title: '초기화 실패',
          description: result.error,
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: '네트워크 오류',
        description: '초기화 요청을 처리할 수 없습니다',
        variant: 'destructive'
      });
    } finally {
      setActionLoading(null);
    }
  };

  useEffect(() => {
    fetchStatus();
    
    // 30초마다 상태 갱신
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':
        return <Badge variant="default" className="bg-green-500">정상</Badge>;
      case 'warning':
        return <Badge variant="secondary" className="bg-yellow-500">주의</Badge>;
      case 'error':
        return <Badge variant="destructive">오류</Badge>;
      default:
        return <Badge variant="outline">알 수 없음</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <span className="ml-2">스케줄러 상태를 조회중...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">스케줄러 관리</h1>
        <Button 
          onClick={() => fetchStatus()}
          variant="outline"
          disabled={loading}
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          새로고침
        </Button>
      </div>

      {/* 전체 상태 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">전체 작업</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{status?.totalJobs || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">실행 중</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{status?.runningJobs || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">실패한 작업</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{status?.failedJobs || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">전체 제어</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleGlobalAction('start')}
                disabled={actionLoading === 'start'}
              >
                <PlayCircle className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleGlobalAction('stop')}
                disabled={actionLoading === 'stop'}
              >
                <Square className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleGlobalAction('restart')}
                disabled={actionLoading === 'restart'}
              >
                <RotateCcw className="h-3 w-3" />
              </Button>
            </div>
            <Button
              size="sm"
              variant="secondary"
              className="w-full"
              onClick={initializeScheduler}
              disabled={actionLoading === 'init'}
            >
              초기화
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* 작업 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>스케줄 작업 목록</CardTitle>
          <CardDescription>
            등록된 모든 스케줄 작업의 상태와 제어
          </CardDescription>
        </CardHeader>
        <CardContent>
          {status?.jobs && status.jobs.length > 0 ? (
            <div className="space-y-4">
              {status.jobs.map((job) => (
                <div key={job.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold">{job.name}</h3>
                      {getStatusBadge(job.status)}
                      {job.isRunning && (
                        <Badge variant="secondary" className="bg-blue-500">
                          <Clock className="h-3 w-3 mr-1" />
                          실행중
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      ID: {job.id} | 마지막 실행: {job.lastRun ? new Date(job.lastRun).toLocaleString() : '없음'}
                      {job.errorCount > 0 && (
                        <span className="text-red-600 ml-2">
                          <AlertCircle className="h-3 w-3 inline mr-1" />
                          오류 {job.errorCount}회
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleJobAction(job.id, 'start')}
                      disabled={actionLoading === `${job.id}-start`}
                    >
                      <PlayCircle className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleJobAction(job.id, 'stop')}
                      disabled={actionLoading === `${job.id}-stop`}
                    >
                      <Square className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleJobAction(job.id, 'run')}
                      disabled={actionLoading === `${job.id}-run`}
                    >
                      지금 실행
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleJobAction(job.id, 'remove')}
                      disabled={actionLoading === `${job.id}-remove`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              등록된 스케줄 작업이 없습니다
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}