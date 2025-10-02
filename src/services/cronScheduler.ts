/**
 * Cron 스케줄러 서비스
 * 데이터 동기화 작업을 주기적으로 실행
 */

import cron, { type ScheduledTask } from 'node-cron';
import { getDataSyncService, type SyncJobConfig } from './dataSyncService';
import { getDataValidationService } from './dataValidationService';
import { getNotificationService } from './notificationService';
import { normalizeError, logError } from '@/lib/error-handling';

export interface ScheduledJob {
  id: string;
  name: string;
  cronExpression: string;
  task: () => Promise<void>;
  isRunning: boolean;
  lastRun?: Date;
  nextRun?: Date;
  errorCount: number;
  maxRetries: number;
}

export class CronScheduler {
  private jobs: Map<string, { job: ScheduledTask; config: ScheduledJob }> = new Map();
  private dataSyncService = getDataSyncService();
  private dataValidationService = getDataValidationService();
  private notificationService = getNotificationService();

  constructor() {
    console.log('🕐 CronScheduler 초기화됨');
  }

  /**
   * 스케줄된 작업 추가
   */
  addJob(config: Omit<ScheduledJob, 'isRunning' | 'errorCount'>): void {
    const scheduledJob: ScheduledJob = {
      ...config,
      isRunning: false,
      errorCount: 0
    };

    const task = cron.schedule(config.cronExpression, async () => {
      await this.executeJob(scheduledJob);
    }, {
      // scheduled: false, // 수동으로 시작 - 해당 옵션이 없으므로 주석 처리
      timezone: 'Asia/Seoul'
    });

    this.jobs.set(config.id, { job: task, config: scheduledJob });
    
    console.log(`📅 스케줄 작업 추가됨: ${config.name} (${config.cronExpression})`);
  }

  /**
   * 작업 실행
   */
  private async executeJob(jobConfig: ScheduledJob): Promise<void> {
    if (jobConfig.isRunning) {
      console.warn(`⚠️ 작업 ${jobConfig.name}이 이미 실행 중입니다. 건너뜁니다.`);
      return;
    }

    jobConfig.isRunning = true;
    jobConfig.lastRun = new Date();

    try {
      console.log(`🚀 스케줄 작업 시작: ${jobConfig.name}`);
      
      await jobConfig.task();
      
      // 성공 시 에러 카운트 리셋
      jobConfig.errorCount = 0;
      
      console.log(`✅ 스케줄 작업 완료: ${jobConfig.name}`);
      
    } catch (error) {
      jobConfig.errorCount++;
      
      const errorDetails = normalizeError(error);
      logError(errorDetails, { 
        jobId: jobConfig.id, 
        jobName: jobConfig.name,
        errorCount: jobConfig.errorCount,
        maxRetries: jobConfig.maxRetries 
      });
      
      console.error(`❌ 스케줄 작업 실패: ${jobConfig.name} (${jobConfig.errorCount}/${jobConfig.maxRetries})`);
      
      // 최대 재시도 횟수 초과 시 작업 비활성화
      if (jobConfig.errorCount >= jobConfig.maxRetries) {
        console.error(`🚫 작업 ${jobConfig.name} 최대 재시도 횟수 초과로 비활성화됨`);
        this.stopJob(jobConfig.id);
        
        // 실패 알림 발송
        await this.notificationService.notifySchedulerFailure(
          jobConfig.name, 
          errorDetails.userMessage, 
          jobConfig.errorCount, 
          jobConfig.maxRetries
        );
      }
      
    } finally {
      jobConfig.isRunning = false;
    }
  }

  /**
   * 작업 시작
   */
  startJob(jobId: string): boolean {
    const jobEntry = this.jobs.get(jobId);
    if (!jobEntry) {
      console.error(`❌ 작업을 찾을 수 없습니다: ${jobId}`);
      return false;
    }

    jobEntry.job.start();
    console.log(`▶️ 스케줄 작업 시작됨: ${jobEntry.config.name}`);
    return true;
  }

  /**
   * 작업 중지
   */
  stopJob(jobId: string): boolean {
    const jobEntry = this.jobs.get(jobId);
    if (!jobEntry) {
      console.error(`❌ 작업을 찾을 수 없습니다: ${jobId}`);
      return false;
    }

    jobEntry.job.stop();
    console.log(`⏹️ 스케줄 작업 중지됨: ${jobEntry.config.name}`);
    return true;
  }

  /**
   * 모든 작업 시작
   */
  startAllJobs(): void {
    console.log('🚀 모든 스케줄 작업 시작');
    for (const [jobId] of this.jobs) {
      this.startJob(jobId);
    }
  }

  /**
   * 모든 작업 중지
   */
  stopAllJobs(): void {
    console.log('⏹️ 모든 스케줄 작업 중지');
    for (const [jobId] of this.jobs) {
      this.stopJob(jobId);
    }
  }

  /**
   * 작업 제거
   */
  removeJob(jobId: string): boolean {
    const jobEntry = this.jobs.get(jobId);
    if (!jobEntry) {
      return false;
    }

    jobEntry.job.destroy();
    this.jobs.delete(jobId);
    console.log(`🗑️ 스케줄 작업 제거됨: ${jobEntry.config.name}`);
    return true;
  }

  /**
   * 작업 목록 조회
   */
  getJobs(): ScheduledJob[] {
    return Array.from(this.jobs.values()).map(entry => entry.config);
  }

  /**
   * 특정 작업 조회
   */
  getJob(jobId: string): ScheduledJob | undefined {
    const jobEntry = this.jobs.get(jobId);
    return jobEntry?.config;
  }

  /**
   * 작업 수동 실행
   */
  async runJobNow(jobId: string): Promise<void> {
    const jobEntry = this.jobs.get(jobId);
    if (!jobEntry) {
      throw new Error(`작업을 찾을 수 없습니다: ${jobId}`);
    }

    console.log(`🔄 작업 수동 실행: ${jobEntry.config.name}`);
    await this.executeJob(jobEntry.config);
  }

  /**
   * 데이터 검증 및 품질 확인
   */
  private async validateDataQuality(): Promise<void> {
    console.log('🔍 데이터 품질 검증 시작...');
    
    const validationResult = await this.dataValidationService.validateAllData();
    
    // 검증 결과 저장
    await this.dataValidationService.saveValidationResult(validationResult);
    
    // 품질 이슈가 있는 경우 알림 발송
    await this.notificationService.notifyDataQualityIssue(validationResult);
    
    console.log(`✅ 데이터 품질 검증 완료 - 점수: ${validationResult.summary.dataQualityScore}/100`);
  }

  /**
   * 기본 스케줄 작업들 등록
   */
  setupDefaultJobs(): void {
    // 매일 새벽 2시에 전체 데이터 동기화
    this.addJob({
      id: 'daily-full-sync',
      name: '일일 전체 데이터 동기화',
      cronExpression: '0 2 * * *', // 매일 새벽 2시
      maxRetries: 3,
      task: async () => {
        const syncStartTime = Date.now();
        
        const result = await this.dataSyncService.runFullSync();
        
        if (!result.success) {
          throw new Error(`동기화 실패: ${result.errors.join(', ')}`);
        }
        
        console.log(`📊 동기화 완료: ${result.stats.length}개 작업 실행`);
        
        // 동기화 후 데이터 품질 검증 실행
        await this.validateDataQuality();
        
        // 일일 동기화 요약 알림 발송
        const syncDuration = Date.now() - syncStartTime;
        const stats = result.stats.reduce((acc, stat) => ({
          totalSynced: acc.totalSynced + stat.totalProcessed,
          newRecords: acc.newRecords + stat.newRecords,
          updatedRecords: acc.updatedRecords + stat.updatedRecords,
          errors: acc.errors + stat.errors
        }), { totalSynced: 0, newRecords: 0, updatedRecords: 0, errors: 0 });
        
        await this.notificationService.notifyDailySyncSummary({
          ...stats,
          duration: syncDuration
        });
      }
    });

    // 매주 일요일 새벽 1시에 아파트 단지 정보 업데이트
    this.addJob({
      id: 'weekly-complex-sync',
      name: '주간 아파트 단지 정보 동기화',
      cronExpression: '0 1 * * 0', // 매주 일요일 새벽 1시
      maxRetries: 2,
      task: async () => {
        // 샘플 단지 코드들 (실제로는 DB에서 가져와야 함)
        const sampleComplexCodes = ['A10027875', 'A15876402', 'A11125784'];
        
        const stats = await this.dataSyncService.syncApartmentComplexes(sampleComplexCodes);
        console.log(`🏢 단지 정보 동기화 완료: ${stats.totalProcessed}건 처리`);
      }
    });

    // 매시간 최신 데이터 확인 (최근 한 달 데이터만)
    this.addJob({
      id: 'hourly-recent-sync',
      name: '시간별 최신 데이터 동기화',
      cronExpression: '0 * * * *', // 매시간
      maxRetries: 5,
      task: async () => {
        const currentDate = new Date();
        const currentMonth = currentDate.getFullYear().toString() + 
                           (currentDate.getMonth() + 1).toString().padStart(2, '0');
        
        // 주요 지역 하나만 최신 데이터 확인
        const stats = await this.dataSyncService.syncApartmentTradeData('11110', currentMonth);
        console.log(`🔄 최신 데이터 확인 완료: ${stats.totalProcessed}건 처리`);
      }
    });

    // 매일 오후 6시에 데이터 품질 검증 (독립 실행)
    this.addJob({
      id: 'daily-data-validation',
      name: '일일 데이터 품질 검증',
      cronExpression: '0 18 * * *', // 매일 오후 6시
      maxRetries: 2,
      task: async () => {
        await this.validateDataQuality();
      }
    });

    // 매주 토요일 새벽 3시에 데이터 정리 작업
    this.addJob({
      id: 'weekly-data-cleanup',
      name: '주간 데이터 정리',
      cronExpression: '0 3 * * 6', // 매주 토요일 새벽 3시
      maxRetries: 1,
      task: async () => {
        console.log('🧹 데이터 정리 작업 시작...');
        
        const cleanupResult = await this.dataValidationService.cleanupData();
        
        console.log(`✅ 데이터 정리 완료: 중복 ${cleanupResult.duplicatesRemoved}건, 로그 ${cleanupResult.oldLogsRemoved}건, 고아 ${cleanupResult.orphanRecordsRemoved}건 제거`);
        
        // 정리 결과 알림
        await this.notificationService.sendNotification({
          type: 'system_alert',
          severity: 'low',
          title: '주간 데이터 정리 완료',
          message: `데이터 정리 작업이 완료되었습니다.\n` +
                   `중복 데이터: ${cleanupResult.duplicatesRemoved}건 제거\n` +
                   `오래된 로그: ${cleanupResult.oldLogsRemoved}건 제거\n` +
                   `고아 레코드: ${cleanupResult.orphanRecordsRemoved}건 제거`,
          details: cleanupResult,
          timestamp: new Date(),
          source: 'data_cleanup'
        });
      }
    });

    console.log('📋 기본 스케줄 작업들이 등록되었습니다.');
  }

  /**
   * 스케줄러 상태 리포트
   */
  getStatusReport(): {
    totalJobs: number;
    runningJobs: number;
    failedJobs: number;
    jobs: Array<{
      id: string;
      name: string;
      isRunning: boolean;
      lastRun?: Date;
      errorCount: number;
      status: 'healthy' | 'warning' | 'error';
    }>;
  } {
    const jobs = this.getJobs();
    
    return {
      totalJobs: jobs.length,
      runningJobs: jobs.filter(job => job.isRunning).length,
      failedJobs: jobs.filter(job => job.errorCount >= job.maxRetries).length,
      jobs: jobs.map(job => ({
        id: job.id,
        name: job.name,
        isRunning: job.isRunning,
        lastRun: job.lastRun,
        errorCount: job.errorCount,
        status: job.errorCount >= job.maxRetries 
          ? 'error' 
          : job.errorCount > 0 
            ? 'warning' 
            : 'healthy'
      }))
    };
  }
}

// 싱글톤 인스턴스
let cronScheduler: CronScheduler | null = null;

export function getCronScheduler(): CronScheduler {
  if (!cronScheduler) {
    cronScheduler = new CronScheduler();
  }
  return cronScheduler;
}

// 스케줄러 시작 함수 (애플리케이션 시작 시 호출)
export function initializeScheduler(): void {
  if (process.env.NODE_ENV === 'production' || process.env.ENABLE_SCHEDULER === 'true') {
    const scheduler = getCronScheduler();
    scheduler.setupDefaultJobs();
    scheduler.startAllJobs();
    
    console.log('🎯 데이터 동기화 스케줄러가 활성화되었습니다.');
  } else {
    console.log('⏸️ 스케줄러는 프로덕션 환경에서만 실행됩니다.');
  }
}