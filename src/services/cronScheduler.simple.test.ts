/**
 * CronScheduler 단위 테스트 (의존성 없는 버전)
 */

import { jest } from '@jest/globals';

// Mock node-cron
const mockScheduledTask = {
  start: jest.fn(),
  stop: jest.fn(),
  destroy: jest.fn()
};

jest.mock('node-cron', () => ({
  schedule: jest.fn(() => mockScheduledTask),
  validate: jest.fn(() => true)
}));

// Mock all external dependencies completely
jest.mock('@/lib/error-handling', () => ({
  normalizeError: jest.fn((error: any) => ({
    code: 'TEST_ERROR',
    message: error.message || 'Test error',
    userMessage: 'Test error message'
  })),
  logError: jest.fn()
}));

// Create a minimal DataSyncService mock
const mockDataSyncService = {
  runFullSync: jest.fn().mockResolvedValue({
    success: true,
    stats: [{ processed: 10 }],
    errors: []
  }),
  syncApartmentComplexes: jest.fn().mockResolvedValue({
    totalProcessed: 5
  }),
  syncApartmentTradeData: jest.fn().mockResolvedValue({
    totalProcessed: 20
  })
};

jest.mock('./dataSyncService', () => ({
  getDataSyncService: () => mockDataSyncService
}));

import { CronScheduler } from './cronScheduler';

describe('CronScheduler', () => {
  let scheduler: CronScheduler;
  let mockTask: jest.MockedFunction<() => Promise<void>>;

  beforeEach(() => {
    scheduler = new CronScheduler();
    mockTask = jest.fn().mockResolvedValue(undefined);
    jest.clearAllMocks();
  });

  describe('addJob', () => {
    it('작업을 올바르게 추가해야 합니다', () => {
      const jobConfig = {
        id: 'test-job',
        name: '테스트 작업',
        cronExpression: '0 * * * *',
        task: mockTask,
        maxRetries: 3
      };

      scheduler.addJob(jobConfig);

      const jobs = scheduler.getJobs();
      expect(jobs).toHaveLength(1);
      expect(jobs[0].id).toBe('test-job');
      expect(jobs[0].name).toBe('테스트 작업');
      expect(jobs[0].isRunning).toBe(false);
      expect(jobs[0].errorCount).toBe(0);
    });
  });

  describe('job control', () => {
    beforeEach(() => {
      scheduler.addJob({
        id: 'test-job',
        name: '테스트 작업',
        cronExpression: '0 * * * *',
        task: mockTask,
        maxRetries: 3
      });
    });

    it('작업을 시작할 수 있어야 합니다', () => {
      const result = scheduler.startJob('test-job');
      expect(result).toBe(true);
      expect(mockScheduledTask.start).toHaveBeenCalled();
    });

    it('작업을 중지할 수 있어야 합니다', () => {
      const result = scheduler.stopJob('test-job');
      expect(result).toBe(true);
      expect(mockScheduledTask.stop).toHaveBeenCalled();
    });

    it('존재하지 않는 작업을 제어하면 false를 반환해야 합니다', () => {
      expect(scheduler.startJob('non-existent')).toBe(false);
      expect(scheduler.stopJob('non-existent')).toBe(false);
    });
  });

  describe('runJobNow', () => {
    beforeEach(() => {
      scheduler.addJob({
        id: 'test-job',
        name: '테스트 작업',
        cronExpression: '0 * * * *',
        task: mockTask,
        maxRetries: 3
      });
    });

    it('작업을 수동으로 실행할 수 있어야 합니다', async () => {
      await scheduler.runJobNow('test-job');
      expect(mockTask).toHaveBeenCalledTimes(1);
    });

    it('존재하지 않는 작업을 실행하려고 하면 에러를 던져야 합니다', async () => {
      await expect(scheduler.runJobNow('non-existent')).rejects.toThrow();
    });

    it('작업 실행 후 lastRun이 업데이트되어야 합니다', async () => {
      const beforeRun = new Date();
      await scheduler.runJobNow('test-job');
      
      const job = scheduler.getJob('test-job');
      expect(job?.lastRun).toBeDefined();
      expect(job?.lastRun!.getTime()).toBeGreaterThanOrEqual(beforeRun.getTime());
    });
  });

  describe('error handling', () => {
    it('작업 실행 중 에러가 발생하면 에러 카운트가 증가해야 합니다', async () => {
      const failingTask = jest.fn().mockRejectedValue(new Error('Test error'));
      
      scheduler.addJob({
        id: 'failing-job',
        name: '실패하는 작업',
        cronExpression: '0 * * * *',
        task: failingTask,
        maxRetries: 3
      });

      await scheduler.runJobNow('failing-job');

      const job = scheduler.getJob('failing-job');
      expect(job?.errorCount).toBe(1);
    });

    it('성공하면 에러 카운트가 리셋되어야 합니다', async () => {
      let shouldFail = true;
      const conditionalTask = jest.fn().mockImplementation(() => {
        if (shouldFail) {
          throw new Error('Test error');
        }
        return Promise.resolve();
      });
      
      scheduler.addJob({
        id: 'conditional-job',
        name: '조건부 작업',
        cronExpression: '0 * * * *',
        task: conditionalTask,
        maxRetries: 3
      });

      // 먼저 실패
      await scheduler.runJobNow('conditional-job');
      expect(scheduler.getJob('conditional-job')?.errorCount).toBe(1);

      // 이후 성공
      shouldFail = false;
      await scheduler.runJobNow('conditional-job');
      expect(scheduler.getJob('conditional-job')?.errorCount).toBe(0);
    });
  });

  describe('removeJob', () => {
    beforeEach(() => {
      scheduler.addJob({
        id: 'test-job',
        name: '테스트 작업',
        cronExpression: '0 * * * *',
        task: mockTask,
        maxRetries: 3
      });
    });

    it('작업을 제거할 수 있어야 합니다', () => {
      expect(scheduler.getJobs()).toHaveLength(1);
      
      const result = scheduler.removeJob('test-job');
      expect(result).toBe(true);
      expect(scheduler.getJobs()).toHaveLength(0);
      expect(mockScheduledTask.destroy).toHaveBeenCalled();
    });

    it('존재하지 않는 작업을 제거하려고 하면 false를 반환해야 합니다', () => {
      const result = scheduler.removeJob('non-existent');
      expect(result).toBe(false);
    });
  });

  describe('getStatusReport', () => {
    beforeEach(() => {
      scheduler.addJob({
        id: 'healthy-job',
        name: '정상 작업',
        cronExpression: '0 * * * *',
        task: mockTask,
        maxRetries: 3
      });

      const failingTask = jest.fn().mockRejectedValue(new Error('Test error'));
      scheduler.addJob({
        id: 'failed-job',
        name: '실패한 작업',
        cronExpression: '0 * * * *',
        task: failingTask,
        maxRetries: 1
      });
    });

    it('상태 리포트를 올바르게 생성해야 합니다', async () => {
      // 실패한 작업을 최대 재시도 횟수만큼 실행
      await scheduler.runJobNow('failed-job');
      
      const report = scheduler.getStatusReport();
      
      expect(report.totalJobs).toBe(2);
      expect(report.runningJobs).toBe(0);
      expect(report.failedJobs).toBe(1);
      expect(report.jobs).toHaveLength(2);
      
      const healthyJob = report.jobs.find(job => job.id === 'healthy-job');
      const failedJob = report.jobs.find(job => job.id === 'failed-job');
      
      expect(healthyJob?.status).toBe('healthy');
      expect(failedJob?.status).toBe('error');
    });
  });

  describe('setupDefaultJobs', () => {
    it('기본 작업들을 설정해야 합니다', () => {
      scheduler.setupDefaultJobs();
      
      const jobs = scheduler.getJobs();
      expect(jobs.length).toBeGreaterThan(0);
      
      const jobIds = jobs.map(job => job.id);
      expect(jobIds).toContain('daily-full-sync');
      expect(jobIds).toContain('weekly-complex-sync');
      expect(jobIds).toContain('hourly-recent-sync');
    });

    it('기본 작업들이 올바른 cron 표현식을 가져야 합니다', () => {
      scheduler.setupDefaultJobs();
      
      const jobs = scheduler.getJobs();
      const dailyJob = jobs.find(job => job.id === 'daily-full-sync');
      const weeklyJob = jobs.find(job => job.id === 'weekly-complex-sync');
      const hourlyJob = jobs.find(job => job.id === 'hourly-recent-sync');
      
      expect(dailyJob?.cronExpression).toBe('0 2 * * *');
      expect(weeklyJob?.cronExpression).toBe('0 1 * * 0');
      expect(hourlyJob?.cronExpression).toBe('0 * * * *');
    });
  });

  describe('bulk operations', () => {
    beforeEach(() => {
      scheduler.addJob({
        id: 'job1',
        name: '작업1',
        cronExpression: '0 * * * *',
        task: mockTask,
        maxRetries: 3
      });

      scheduler.addJob({
        id: 'job2',
        name: '작업2',
        cronExpression: '0 * * * *',
        task: mockTask,
        maxRetries: 3
      });
    });

    it('모든 작업을 시작할 수 있어야 합니다', () => {
      scheduler.startAllJobs();
      expect(mockScheduledTask.start).toHaveBeenCalledTimes(2);
    });

    it('모든 작업을 중지할 수 있어야 합니다', () => {
      scheduler.stopAllJobs();
      expect(mockScheduledTask.stop).toHaveBeenCalledTimes(2);
    });
  });
});