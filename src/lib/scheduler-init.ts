/**
 * 스케줄러 초기화 유틸리티
 * 애플리케이션 시작 시 스케줄러를 설정하고 활성화
 */

import { getCronScheduler, initializeScheduler } from '@/services/cronScheduler';
import { logError, normalizeError } from './error-handling';

/**
 * 서버 시작 시 스케줄러 초기화
 */
export async function initializeAppScheduler(): Promise<void> {
  try {
    console.log('🚀 애플리케이션 스케줄러 초기화 중...');
    
    // 스케줄러 초기화 (환경변수 체크 포함)
    initializeScheduler();
    
    console.log('✅ 스케줄러 초기화 완료');
  } catch (error) {
    logError(normalizeError(error), { context: 'scheduler-initialization' });
    console.error('❌ 스케줄러 초기화 실패:', error);
    throw error;
  }
}

/**
 * 스케줄러 상태 확인
 */
export function getSchedulerStatus() {
  try {
    const scheduler = getCronScheduler();
    return scheduler.getStatusReport();
  } catch (error) {
    logError(normalizeError(error), { context: 'scheduler-status-check' });
    return {
      totalJobs: 0,
      runningJobs: 0,
      failedJobs: 0,
      jobs: [],
      error: 'Failed to get scheduler status'
    };
  }
}

/**
 * 스케줄러 수동 제어
 */
export async function manualSchedulerControl(action: 'start' | 'stop' | 'restart'): Promise<boolean> {
  try {
    const scheduler = getCronScheduler();
    
    switch (action) {
      case 'start':
        scheduler.startAllJobs();
        console.log('🟢 모든 스케줄 작업이 시작되었습니다');
        return true;
        
      case 'stop':
        scheduler.stopAllJobs();
        console.log('🔴 모든 스케줄 작업이 중지되었습니다');
        return true;
        
      case 'restart':
        scheduler.stopAllJobs();
        // 잠시 대기 후 재시작
        await new Promise(resolve => setTimeout(resolve, 1000));
        scheduler.startAllJobs();
        console.log('🔄 모든 스케줄 작업이 재시작되었습니다');
        return true;
        
      default:
        console.error('❌ 알 수 없는 액션:', action);
        return false;
    }
  } catch (error) {
    logError(normalizeError(error), { context: 'manual-scheduler-control', action });
    console.error('❌ 스케줄러 제어 실패:', error);
    return false;
  }
}