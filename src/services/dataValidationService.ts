/**
 * 데이터 검증 및 품질 관리 서비스
 * 데이터 동기화 후 데이터 정확성 검증
 */

import { createPureClient } from '@/lib/supabase/server';
import { normalizeError, logError } from '@/lib/error-handling';

export interface ValidationResult {
  isValid: boolean;
  issues: ValidationIssue[];
  summary: ValidationSummary;
}

export interface ValidationIssue {
  type: 'error' | 'warning' | 'info';
  category: string;
  table: string;
  column?: string;
  count: number;
  description: string;
  query?: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

export interface ValidationSummary {
  totalRecords: number;
  validRecords: number;
  errorRecords: number;
  warningRecords: number;
  dataQualityScore: number; // 0-100점
  lastValidated: Date;
}

export class DataValidationService {
  private supabase = createPureClient();

  /**
   * 전체 데이터 검증 실행
   */
  async validateAllData(): Promise<ValidationResult> {
    console.log('🔍 전체 데이터 검증 시작...');
    
    const issues: ValidationIssue[] = [];
    let totalRecords = 0;
    let validRecords = 0;

    try {
      // 1. 아파트 단지 데이터 검증
      const complexValidation = await this.validateApartmentComplexes();
      issues.push(...complexValidation.issues);
      totalRecords += complexValidation.summary.totalRecords;
      validRecords += complexValidation.summary.validRecords;

      // 2. 매매 거래 데이터 검증
      const tradeValidation = await this.validateTradeTransactions();
      issues.push(...tradeValidation.issues);
      totalRecords += tradeValidation.summary.totalRecords;
      validRecords += tradeValidation.summary.validRecords;

      // 3. 전월세 거래 데이터 검증
      const rentValidation = await this.validateRentTransactions();
      issues.push(...rentValidation.issues);
      totalRecords += rentValidation.summary.totalRecords;
      validRecords += rentValidation.summary.validRecords;

      // 4. 데이터 정합성 검증
      const integrityValidation = await this.validateDataIntegrity();
      issues.push(...integrityValidation.issues);

      // 데이터 품질 점수 계산
      const errorRecords = issues.filter(i => i.type === 'error').reduce((sum, i) => sum + i.count, 0);
      const warningRecords = issues.filter(i => i.type === 'warning').reduce((sum, i) => sum + i.count, 0);
      
      const dataQualityScore = totalRecords > 0 
        ? Math.round(((validRecords - errorRecords * 0.5 - warningRecords * 0.1) / totalRecords) * 100)
        : 0;

      const summary: ValidationSummary = {
        totalRecords,
        validRecords,
        errorRecords,
        warningRecords,
        dataQualityScore: Math.max(0, Math.min(100, dataQualityScore)),
        lastValidated: new Date()
      };

      const result: ValidationResult = {
        isValid: issues.filter(i => i.type === 'error' && i.severity === 'critical').length === 0,
        issues,
        summary
      };

      console.log(`✅ 데이터 검증 완료 - 품질 점수: ${summary.dataQualityScore}/100`);
      return result;

    } catch (error) {
      const errorDetails = normalizeError(error);
      logError(errorDetails, { context: 'data-validation' });
      
      return {
        isValid: false,
        issues: [{
          type: 'error',
          category: 'validation_system',
          table: 'all',
          count: 1,
          description: `데이터 검증 시스템 오류: ${errorDetails.userMessage}`,
          severity: 'critical'
        }],
        summary: {
          totalRecords: 0,
          validRecords: 0,
          errorRecords: 1,
          warningRecords: 0,
          dataQualityScore: 0,
          lastValidated: new Date()
        }
      };
    }
  }

  /**
   * 아파트 단지 데이터 검증
   */
  private async validateApartmentComplexes(): Promise<ValidationResult> {
    const issues: ValidationIssue[] = [];
    const supabase = await this.supabase;

    // 총 레코드 수 조회
    const { count: totalCount } = await supabase
      .from('apartment_complexes')
      .select('*', { count: 'exact', head: true });

    const totalRecords = totalCount || 0;
    let validRecords = totalRecords;

    // 1. 필수 컬럼 NULL 체크
    const nullChecks = [
      { column: 'name', description: '단지명이 없는 레코드' },
      { column: 'address', description: '주소가 없는 레코드' },
      { column: 'region_code', description: '지역코드가 없는 레코드' }
    ];

    for (const check of nullChecks) {
      const { count } = await supabase
        .from('apartment_complexes')
        .select('*', { count: 'exact', head: true })
        .is(check.column, null);

      if (count && count > 0) {
        issues.push({
          type: 'error',
          category: 'missing_data',
          table: 'apartment_complexes',
          column: check.column,
          count,
          description: check.description,
          severity: 'high'
        });
        validRecords -= count;
      }
    }

    // 2. 데이터 형식 검증
    const { data: invalidRegionCodes } = await supabase
      .from('apartment_complexes')
      .select('region_code')
      .not('region_code', 'like', '_____'); // 5자리가 아닌 지역코드

    if (invalidRegionCodes && invalidRegionCodes.length > 0) {
      issues.push({
        type: 'warning',
        category: 'data_format',
        table: 'apartment_complexes',
        column: 'region_code',
        count: invalidRegionCodes.length,
        description: '올바르지 않은 지역코드 형식',
        severity: 'medium'
      });
    }

    // 3. 중복 데이터 검증
    const { data: duplicates } = await supabase.rpc('find_duplicate_complexes') as { data: any[] };
    if (duplicates && duplicates.length > 0) {
      issues.push({
        type: 'warning',
        category: 'duplicate_data',
        table: 'apartment_complexes',
        count: duplicates.length,
        description: '중복된 단지 정보',
        severity: 'medium'
      });
    }

    return {
      isValid: issues.filter(i => i.type === 'error').length === 0,
      issues,
      summary: {
        totalRecords,
        validRecords,
        errorRecords: issues.filter(i => i.type === 'error').reduce((sum, i) => sum + i.count, 0),
        warningRecords: issues.filter(i => i.type === 'warning').reduce((sum, i) => sum + i.count, 0),
        dataQualityScore: 0,
        lastValidated: new Date()
      }
    };
  }

  /**
   * 매매 거래 데이터 검증
   */
  private async validateTradeTransactions(): Promise<ValidationResult> {
    const issues: ValidationIssue[] = [];
    const supabase = await this.supabase;

    const { count: totalCount } = await supabase
      .from('apartment_trade_transactions')
      .select('*', { count: 'exact', head: true });

    const totalRecords = totalCount || 0;
    let validRecords = totalRecords;

    // 1. 필수 컬럼 검증
    const requiredFields = [
      { column: 'apartment_name', description: '아파트명이 없는 거래' },
      { column: 'deal_amount', description: '거래금액이 없는 거래' },
      { column: 'deal_date', description: '거래일자가 없는 거래' },
      { column: 'region_code', description: '지역코드가 없는 거래' }
    ];

    for (const field of requiredFields) {
      const { count } = await supabase
        .from('apartment_trade_transactions')
        .select('*', { count: 'exact', head: true })
        .is(field.column, null);

      if (count && count > 0) {
        issues.push({
          type: 'error',
          category: 'missing_data',
          table: 'apartment_trade_transactions',
          column: field.column,
          count,
          description: field.description,
          severity: 'critical'
        });
        validRecords -= count;
      }
    }

    // 2. 데이터 범위 검증
    const { count: invalidAmountCount } = await supabase
      .from('apartment_trade_transactions')
      .select('*', { count: 'exact', head: true })
      .or('deal_amount.lt.1000,deal_amount.gt.1000000000'); // 1000원 미만 또는 10억원 초과

    if (invalidAmountCount && invalidAmountCount > 0) {
      issues.push({
        type: 'warning',
        category: 'data_range',
        table: 'apartment_trade_transactions',
        column: 'deal_amount',
        count: invalidAmountCount,
        description: '비정상적인 거래금액 범위',
        severity: 'medium'
      });
    }

    // 3. 날짜 형식 검증
    const { count: futureDateCount } = await supabase
      .from('apartment_trade_transactions')
      .select('*', { count: 'exact', head: true })
      .gt('deal_date', new Date().toISOString().split('T')[0]);

    if (futureDateCount && futureDateCount > 0) {
      issues.push({
        type: 'error',
        category: 'data_validity',
        table: 'apartment_trade_transactions',
        column: 'deal_date',
        count: futureDateCount,
        description: '미래 날짜의 거래 데이터',
        severity: 'high'
      });
      validRecords -= futureDateCount;
    }

    return {
      isValid: issues.filter(i => i.type === 'error').length === 0,
      issues,
      summary: {
        totalRecords,
        validRecords,
        errorRecords: issues.filter(i => i.type === 'error').reduce((sum, i) => sum + i.count, 0),
        warningRecords: issues.filter(i => i.type === 'warning').reduce((sum, i) => sum + i.count, 0),
        dataQualityScore: 0,
        lastValidated: new Date()
      }
    };
  }

  /**
   * 전월세 거래 데이터 검증
   */
  private async validateRentTransactions(): Promise<ValidationResult> {
    const issues: ValidationIssue[] = [];
    const supabase = await this.supabase;

    const { count: totalCount } = await supabase
      .from('apartment_rent_transactions')
      .select('*', { count: 'exact', head: true });

    const totalRecords = totalCount || 0;
    let validRecords = totalRecords;

    // 1. 필수 데이터 검증
    const { count: nullDepositCount } = await supabase
      .from('apartment_rent_transactions')
      .select('*', { count: 'exact', head: true })
      .is('deposit_amount', null);

    if (nullDepositCount && nullDepositCount > 0) {
      issues.push({
        type: 'error',
        category: 'missing_data',
        table: 'apartment_rent_transactions',
        column: 'deposit_amount',
        count: nullDepositCount,
        description: '보증금이 없는 전월세 거래',
        severity: 'critical'
      });
      validRecords -= nullDepositCount;
    }

    // 2. 전세/월세 로직 검증
    const { count: invalidRentLogicCount } = await supabase
      .from('apartment_rent_transactions')
      .select('*', { count: 'exact', head: true })
      .eq('monthly_rent', 0)
      .lt('deposit_amount', 1000); // 월세가 0이면서 보증금이 너무 적은 경우

    if (invalidRentLogicCount && invalidRentLogicCount > 0) {
      issues.push({
        type: 'warning',
        category: 'business_logic',
        table: 'apartment_rent_transactions',
        count: invalidRentLogicCount,
        description: '전세/월세 구분이 모호한 거래',
        severity: 'medium'
      });
    }

    return {
      isValid: issues.filter(i => i.type === 'error').length === 0,
      issues,
      summary: {
        totalRecords,
        validRecords,
        errorRecords: issues.filter(i => i.type === 'error').reduce((sum, i) => sum + i.count, 0),
        warningRecords: issues.filter(i => i.type === 'warning').reduce((sum, i) => sum + i.count, 0),
        dataQualityScore: 0,
        lastValidated: new Date()
      }
    };
  }

  /**
   * 데이터 정합성 검증
   */
  private async validateDataIntegrity(): Promise<ValidationResult> {
    const issues: ValidationIssue[] = [];
    const supabase = await this.supabase;

    // 1. 외래키 참조 무결성 검증
    const { count: orphanTradeCount } = await supabase
      .from('apartment_trade_transactions')
      .select('complex_id', { count: 'exact', head: true })
      .not('complex_id', 'is', null)
      .not('complex_id', 'in', '(SELECT id FROM apartment_complexes)');

    if (orphanTradeCount && orphanTradeCount > 0) {
      issues.push({
        type: 'error',
        category: 'referential_integrity',
        table: 'apartment_trade_transactions',
        column: 'complex_id',
        count: orphanTradeCount,
        description: '존재하지 않는 단지를 참조하는 거래',
        severity: 'high'
      });
    }

    // 2. 최신성 검증 (최근 30일 데이터 존재 여부)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { count: recentDataCount } = await supabase
      .from('apartment_trade_transactions')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', thirtyDaysAgo.toISOString());

    if (!recentDataCount || recentDataCount < 10) {
      issues.push({
        type: 'warning',
        category: 'data_freshness',
        table: 'apartment_trade_transactions',
        count: 0,
        description: '최근 30일간 동기화된 데이터가 부족함',
        severity: 'medium'
      });
    }

    return {
      isValid: issues.filter(i => i.type === 'error').length === 0,
      issues,
      summary: {
        totalRecords: 0,
        validRecords: 0,
        errorRecords: issues.filter(i => i.type === 'error').reduce((sum, i) => sum + i.count, 0),
        warningRecords: issues.filter(i => i.type === 'warning').reduce((sum, i) => sum + i.count, 0),
        dataQualityScore: 0,
        lastValidated: new Date()
      }
    };
  }

  /**
   * 데이터 정리 및 최적화
   */
  async cleanupData(): Promise<{
    duplicatesRemoved: number;
    oldLogsRemoved: number;
    orphanRecordsRemoved: number;
  }> {
    const supabase = await this.supabase;
    
    // 1. 중복 데이터 제거 (가장 최근 데이터 유지)
    const { data: duplicateRemovalResult } = await supabase.rpc('remove_duplicate_transactions');
    
    // 2. 90일 이상 된 동기화 로그 제거
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    
    const { count: oldLogsRemoved } = await supabase
      .from('sync_job_logs')
      .delete({ count: 'exact' })
      .lt('start_time', ninetyDaysAgo.toISOString());

    // 3. 고아 레코드 제거
    const { count: orphanRecordsRemoved } = await supabase
      .from('apartment_trade_transactions')
      .delete({ count: 'exact' })
      .not('complex_id', 'is', null)
      .not('complex_id', 'in', '(SELECT id FROM apartment_complexes)');

    console.log(`🧹 데이터 정리 완료: 중복 ${duplicateRemovalResult || 0}건, 로그 ${oldLogsRemoved || 0}건, 고아 ${orphanRecordsRemoved || 0}건 제거`);

    return {
      duplicatesRemoved: duplicateRemovalResult || 0,
      oldLogsRemoved: oldLogsRemoved || 0,
      orphanRecordsRemoved: orphanRecordsRemoved || 0
    };
  }

  /**
   * 검증 결과 저장
   */
  async saveValidationResult(result: ValidationResult): Promise<void> {
    const supabase = await this.supabase;
    
    try {
      await supabase
        .from('data_validation_logs')
        .insert({
          validation_date: result.summary.lastValidated.toISOString(),
          total_records: result.summary.totalRecords,
          valid_records: result.summary.validRecords,
          error_records: result.summary.errorRecords,
          warning_records: result.summary.warningRecords,
          data_quality_score: result.summary.dataQualityScore,
          issues: result.issues,
          is_valid: result.isValid
        });
        
      console.log('📊 검증 결과가 데이터베이스에 저장되었습니다.');
    } catch (error) {
      logError(normalizeError(error), { context: 'save-validation-result' });
    }
  }
}

// 싱글톤 인스턴스
let dataValidationService: DataValidationService | null = null;

export function getDataValidationService(): DataValidationService {
  if (!dataValidationService) {
    dataValidationService = new DataValidationService();
  }
  return dataValidationService;
}