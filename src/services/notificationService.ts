/**
 * 알림 서비스
 * 스케줄러 실패, 데이터 품질 이슈 등에 대한 알림 발송
 */

import { normalizeError, logError } from '@/lib/error-handling';
import type { ValidationResult, ValidationIssue } from './dataValidationService';

export interface NotificationConfig {
  email?: {
    enabled: boolean;
    recipients: string[];
    smtpSettings?: {
      host: string;
      port: number;
      secure: boolean;
      auth: {
        user: string;
        pass: string;
      };
    };
  };
  slack?: {
    enabled: boolean;
    webhookUrl: string;
    channel: string;
  };
  discord?: {
    enabled: boolean;
    webhookUrl: string;
  };
  console: {
    enabled: boolean;
    logLevel: 'info' | 'warn' | 'error';
  };
}

export interface NotificationPayload {
  type: 'scheduler_failure' | 'data_quality_issue' | 'sync_success' | 'system_alert';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  details?: any;
  timestamp: Date;
  source: string;
}

export class NotificationService {
  private config: NotificationConfig;

  constructor(config?: Partial<NotificationConfig>) {
    this.config = {
      email: {
        enabled: false,
        recipients: [],
        ...config?.email
      },
      slack: {
        enabled: false,
        webhookUrl: '',
        channel: '#alerts',
        ...config?.slack
      },
      discord: {
        enabled: false,
        webhookUrl: '',
        ...config?.discord
      },
      console: {
        enabled: true,
        logLevel: 'info',
        ...config?.console
      }
    };

    // 환경변수에서 설정 로드
    this.loadConfigFromEnv();
  }

  /**
   * 환경변수에서 알림 설정 로드
   */
  private loadConfigFromEnv(): void {
    // Slack 설정
    if (process.env.SLACK_WEBHOOK_URL) {
      this.config.slack = {
        enabled: true,
        webhookUrl: process.env.SLACK_WEBHOOK_URL,
        channel: process.env.SLACK_CHANNEL || '#alerts'
      };
    }

    // Discord 설정
    if (process.env.DISCORD_WEBHOOK_URL) {
      this.config.discord = {
        enabled: true,
        webhookUrl: process.env.DISCORD_WEBHOOK_URL
      };
    }

    // 이메일 설정
    if (process.env.NOTIFICATION_EMAIL_RECIPIENTS) {
      this.config.email = {
        enabled: true,
        recipients: process.env.NOTIFICATION_EMAIL_RECIPIENTS.split(','),
        smtpSettings: {
          host: process.env.SMTP_HOST || 'smtp.gmail.com',
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: false,
          auth: {
            user: process.env.SMTP_USER || '',
            pass: process.env.SMTP_PASS || ''
          }
        }
      };
    }
  }

  /**
   * 알림 발송
   */
  async sendNotification(payload: NotificationPayload): Promise<void> {
    try {
      console.log(`📢 알림 발송: ${payload.title} (${payload.severity})`);

      // 병렬로 모든 알림 채널에 발송
      const promises = [];

      if (this.config.console.enabled) {
        promises.push(this.sendConsoleNotification(payload));
      }

      if (this.config.slack?.enabled && this.config.slack.webhookUrl) {
        promises.push(this.sendSlackNotification(payload));
      }

      if (this.config.discord?.enabled && this.config.discord.webhookUrl) {
        promises.push(this.sendDiscordNotification(payload));
      }

      if (this.config.email?.enabled && this.config.email.recipients.length > 0) {
        promises.push(this.sendEmailNotification(payload));
      }

      await Promise.allSettled(promises);

    } catch (error) {
      logError(normalizeError(error), { context: 'notification-service', payload });
      console.error('❌ 알림 발송 실패:', error);
    }
  }

  /**
   * 콘솔 알림
   */
  private async sendConsoleNotification(payload: NotificationPayload): Promise<void> {
    const emoji = this.getSeverityEmoji(payload.severity);
    const timestamp = payload.timestamp.toISOString();
    
    console.log(`\n${emoji} [${payload.type.toUpperCase()}] ${payload.title}`);
    console.log(`📅 시간: ${timestamp}`);
    console.log(`📍 소스: ${payload.source}`);
    console.log(`💬 메시지: ${payload.message}`);
    
    if (payload.details) {
      console.log(`📋 상세정보:`, payload.details);
    }
    console.log('─'.repeat(60));
  }

  /**
   * Slack 알림
   */
  private async sendSlackNotification(payload: NotificationPayload): Promise<void> {
    const color = this.getSeverityColor(payload.severity);
    const emoji = this.getSeverityEmoji(payload.severity);

    const slackMessage = {
      channel: this.config.slack!.channel,
      username: 'ApartInfo Monitor',
      icon_emoji: ':apartment:',
      attachments: [
        {
          color,
          title: `${emoji} ${payload.title}`,
          text: payload.message,
          fields: [
            {
              title: '타입',
              value: payload.type,
              short: true
            },
            {
              title: '심각도',
              value: payload.severity.toUpperCase(),
              short: true
            },
            {
              title: '소스',
              value: payload.source,
              short: true
            },
            {
              title: '시간',
              value: payload.timestamp.toISOString(),
              short: true
            }
          ],
          footer: 'ApartInfo 모니터링 시스템',
          ts: Math.floor(payload.timestamp.getTime() / 1000)
        }
      ]
    };

    const response = await fetch(this.config.slack!.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(slackMessage)
    });

    if (!response.ok) {
      throw new Error(`Slack 알림 실패: ${response.statusText}`);
    }
  }

  /**
   * Discord 알림
   */
  private async sendDiscordNotification(payload: NotificationPayload): Promise<void> {
    const color = this.getSeverityColorCode(payload.severity);
    const emoji = this.getSeverityEmoji(payload.severity);

    const discordMessage = {
      username: 'ApartInfo Monitor',
      avatar_url: 'https://cdn.jsdelivr.net/npm/emoji-datasource-apple@14.0.0/img/apple/64/1f3e2.png',
      embeds: [
        {
          title: `${emoji} ${payload.title}`,
          description: payload.message,
          color,
          fields: [
            {
              name: '타입',
              value: payload.type,
              inline: true
            },
            {
              name: '심각도',
              value: payload.severity.toUpperCase(),
              inline: true
            },
            {
              name: '소스',
              value: payload.source,
              inline: true
            }
          ],
          timestamp: payload.timestamp.toISOString(),
          footer: {
            text: 'ApartInfo 모니터링 시스템'
          }
        }
      ]
    };

    const response = await fetch(this.config.discord!.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(discordMessage)
    });

    if (!response.ok) {
      throw new Error(`Discord 알림 실패: ${response.statusText}`);
    }
  }

  /**
   * 이메일 알림 (간단한 fetch 기반)
   */
  private async sendEmailNotification(payload: NotificationPayload): Promise<void> {
    // 실제 구현에서는 nodemailer나 이메일 서비스 API를 사용
    console.log('📧 이메일 알림 발송 예약:', {
      recipients: this.config.email!.recipients,
      subject: `[ApartInfo Alert] ${payload.title}`,
      payload
    });

    // TODO: 실제 이메일 발송 로직 구현
    // const nodemailer = require('nodemailer');
    // const transporter = nodemailer.createTransporter(this.config.email!.smtpSettings);
    // await transporter.sendMail({...});
  }

  /**
   * 스케줄러 실패 알림
   */
  async notifySchedulerFailure(jobName: string, error: string, errorCount: number, maxRetries: number): Promise<void> {
    await this.sendNotification({
      type: 'scheduler_failure',
      severity: errorCount >= maxRetries ? 'critical' : 'high',
      title: `스케줄러 작업 실패: ${jobName}`,
      message: `스케줄 작업 "${jobName}"이 ${errorCount}번째 실패했습니다.\n\n오류: ${error}`,
      details: {
        jobName,
        error,
        errorCount,
        maxRetries,
        isDisabled: errorCount >= maxRetries
      },
      timestamp: new Date(),
      source: 'scheduler'
    });
  }

  /**
   * 데이터 품질 이슈 알림
   */
  async notifyDataQualityIssue(validationResult: ValidationResult): Promise<void> {
    const criticalIssues = validationResult.issues.filter(i => i.severity === 'critical');
    const highIssues = validationResult.issues.filter(i => i.severity === 'high');
    
    if (criticalIssues.length === 0 && highIssues.length === 0 && validationResult.summary.dataQualityScore >= 80) {
      return; // 심각한 이슈가 없고 품질 점수가 양호하면 알림 건너뛰기
    }

    const severity = criticalIssues.length > 0 ? 'critical' : 
                    highIssues.length > 0 ? 'high' : 'medium';

    const issuesSummary = validationResult.issues
      .slice(0, 5) // 최대 5개만 표시
      .map(issue => `• ${issue.description} (${issue.count}건)`)
      .join('\n');

    await this.sendNotification({
      type: 'data_quality_issue',
      severity,
      title: `데이터 품질 이슈 감지`,
      message: `데이터 품질 점수: ${validationResult.summary.dataQualityScore}/100\n` +
               `총 ${validationResult.issues.length}개 이슈 발견:\n\n${issuesSummary}`,
      details: {
        qualityScore: validationResult.summary.dataQualityScore,
        totalIssues: validationResult.issues.length,
        criticalIssues: criticalIssues.length,
        highIssues: highIssues.length,
        summary: validationResult.summary
      },
      timestamp: new Date(),
      source: 'data_validation'
    });
  }

  /**
   * 동기화 성공 알림 (일일 요약)
   */
  async notifyDailySyncSummary(stats: {
    totalSynced: number;
    newRecords: number;
    updatedRecords: number;
    errors: number;
    duration: number;
  }): Promise<void> {
    const severity = stats.errors > 0 ? 'medium' : 'low';

    await this.sendNotification({
      type: 'sync_success',
      severity,
      title: '일일 데이터 동기화 완료',
      message: `총 ${stats.totalSynced}건 처리 완료\n` +
               `신규: ${stats.newRecords}건, 업데이트: ${stats.updatedRecords}건\n` +
               `오류: ${stats.errors}건, 소요시간: ${Math.round(stats.duration / 1000)}초`,
      details: stats,
      timestamp: new Date(),
      source: 'daily_sync'
    });
  }

  /**
   * 심각도별 이모지 반환
   */
  private getSeverityEmoji(severity: string): string {
    switch (severity) {
      case 'critical': return '🚨';
      case 'high': return '⚠️';
      case 'medium': return '🟡';
      case 'low': return 'ℹ️';
      default: return '📢';
    }
  }

  /**
   * Slack 색상 반환
   */
  private getSeverityColor(severity: string): string {
    switch (severity) {
      case 'critical': return 'danger';
      case 'high': return 'warning';
      case 'medium': return '#ffcc00';
      case 'low': return 'good';
      default: return '#cccccc';
    }
  }

  /**
   * Discord 색상 코드 반환
   */
  private getSeverityColorCode(severity: string): number {
    switch (severity) {
      case 'critical': return 0xff0000; // 빨강
      case 'high': return 0xff6600;     // 주황
      case 'medium': return 0xffcc00;   // 노랑
      case 'low': return 0x00ff00;      // 초록
      default: return 0xcccccc;         // 회색
    }
  }
}

// 싱글톤 인스턴스
let notificationService: NotificationService | null = null;

export function getNotificationService(config?: Partial<NotificationConfig>): NotificationService {
  if (!notificationService) {
    notificationService = new NotificationService(config);
  }
  return notificationService;
}