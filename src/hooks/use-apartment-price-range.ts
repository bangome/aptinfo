/**
 * 아파트 가격 범위 조회 React Query 훅
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import {
  calculateTradePrice,
  calculateRentDepositRange,
  calculateRentMonthlyRange,
  calculateRentMonthlyWithDepositRange,
  filterRecentTransactions,
  createPriceSummary,
  type PriceRange,
  type TransactionData,
  type RentTransactionData,
  type RentMonthlyWithDepositRange
} from '@/lib/price-range-utils';

export interface ApartmentPriceData {
  apartmentName: string;
  complexId?: string;
  tradeTransactions: TransactionData[];
  rentTransactions: RentTransactionData[];
}

export interface PriceRangeResult {
  tradeRange: PriceRange | null;
  rentDepositRange: PriceRange | null;
  rentMonthlyRange: PriceRange | null;
  rentMonthlyWithDeposit: RentMonthlyWithDepositRange | null;
  summary: ReturnType<typeof createPriceSummary>;
  hasData: boolean;
  isRecent: boolean; // 최근 12개월 데이터 여부
}

/**
 * 특정 아파트의 가격 범위 조회
 */
export function useApartmentPriceRange(
  apartmentName: string,
  options: {
    recentMonths?: number;
    enabled?: boolean;
  } = {}
) {
  const { recentMonths = 12, enabled = true } = options;
  
  return useQuery({
    queryKey: ['apartment-price-range', apartmentName, recentMonths],
    queryFn: async (): Promise<PriceRangeResult> => {
      const supabase = createClient();
      
      // 매매 거래 데이터 조회
      const { data: tradeData, error: tradeError } = await supabase
        .from('apartment_trade_transactions')
        .select('deal_amount, deal_date, exclusive_area, floor_number')
        .ilike('apartment_name', `%${apartmentName}%`)
        .order('deal_date', { ascending: false })
        .limit(1000); // 최근 1000건 제한

      if (tradeError) {
        console.error('매매 거래 데이터 조회 오류:', tradeError);
        throw new Error(`매매 거래 조회 실패: ${tradeError.message || JSON.stringify(tradeError)}`);
      }

      // 전월세 거래 데이터 조회
      const { data: rentData, error: rentError } = await supabase
        .from('apartment_rent_transactions')
        .select('deposit_amount, monthly_rent, deal_date, exclusive_area, floor_number')
        .ilike('apartment_name', `%${apartmentName}%`)
        .order('deal_date', { ascending: false })
        .limit(1000); // 최근 1000건 제한

      if (rentError) {
        console.error('전월세 거래 데이터 조회 오류:', rentError);
        throw new Error(`전월세 거래 조회 실패: ${rentError.message || JSON.stringify(rentError)}`);
      }

      // 데이터 타입 변환 및 필터링
      const tradeTransactions: TransactionData[] = (tradeData || []).map(item => ({
        deal_amount: item.deal_amount,
        deal_date: item.deal_date,
        exclusive_area: item.exclusive_area,
        floor_number: item.floor_number
      }));

      const rentTransactions: RentTransactionData[] = (rentData || []).map(item => ({
        deposit_amount: item.deposit_amount,
        monthly_rent: item.monthly_rent,
        deal_date: item.deal_date,
        exclusive_area: item.exclusive_area,
        floor_number: item.floor_number
      }));

      // 최근 N개월 데이터 필터링
      const recentTradeTransactions = filterRecentTransactions(tradeTransactions, recentMonths);
      const recentRentTransactions = filterRecentTransactions(rentTransactions, recentMonths);

      // 가격 범위 계산
      const tradeRange = calculateTradePrice(recentTradeTransactions);
      const rentDepositRange = calculateRentDepositRange(recentRentTransactions);
      const rentMonthlyRange = calculateRentMonthlyRange(recentRentTransactions);
      const rentMonthlyWithDeposit = calculateRentMonthlyWithDepositRange(recentRentTransactions);

      // 요약 정보 생성
      const summary = createPriceSummary(tradeRange, rentDepositRange, rentMonthlyRange, rentMonthlyWithDeposit);

      return {
        tradeRange,
        rentDepositRange,
        rentMonthlyRange,
        rentMonthlyWithDeposit,
        summary,
        hasData: !!(tradeRange || rentDepositRange || rentMonthlyRange),
        isRecent: recentMonths <= 12
      };
    },
    enabled: enabled && !!apartmentName,
    staleTime: 1000 * 60 * 60, // 1시간 (실거래가는 자주 변경되지 않음)
    gcTime: 1000 * 60 * 60 * 4, // 4시간 (메모리에 더 오래 보관)
    retry: 1, // 실거래가 조회 실패 시 1번만 재시도
    // 병렬 요청 최적화: 동일한 아파트명에 대한 중복 요청 방지
    notifyOnChangeProps: ['data', 'error', 'isLoading'],
    // 백그라운드에서 자동 업데이트 비활성화 (배터리 절약)
    refetchInterval: false,
    refetchIntervalInBackground: false
  });
}

/**
 * 여러 아파트의 가격 범위를 일괄 조회
 */
export function useMultipleApartmentPriceRanges(
  apartmentNames: string[],
  options: {
    recentMonths?: number;
    enabled?: boolean;
  } = {}
) {
  const { recentMonths = 12, enabled = true } = options;
  
  return useQuery({
    queryKey: ['multiple-apartment-price-ranges', apartmentNames, recentMonths],
    queryFn: async (): Promise<Record<string, PriceRangeResult>> => {
      if (apartmentNames.length === 0) {
        return {};
      }

      const supabase = createClient();
      const results: Record<string, PriceRangeResult> = {};

      // 병렬로 각 아파트의 가격 데이터 조회
      const promises = apartmentNames.map(async (apartmentName) => {
        try {
          // 매매 거래 데이터 조회
          const { data: tradeData } = await supabase
            .from('apartment_trade_transactions')
            .select('deal_amount, deal_date, exclusive_area, floor_number')
            .ilike('apartment_name', `%${apartmentName}%`)
            .order('deal_date', { ascending: false })
            .limit(500);

          // 전월세 거래 데이터 조회
          const { data: rentData } = await supabase
            .from('apartment_rent_transactions')
            .select('deposit_amount, monthly_rent, deal_date, exclusive_area, floor_number')
            .ilike('apartment_name', `%${apartmentName}%`)
            .order('deal_date', { ascending: false })
            .limit(500);

          // 데이터 변환 및 계산
          const tradeTransactions: TransactionData[] = (tradeData || []).map(item => ({
            deal_amount: item.deal_amount,
            deal_date: item.deal_date,
            exclusive_area: item.exclusive_area,
            floor_number: item.floor_number
          }));

          const rentTransactions: RentTransactionData[] = (rentData || []).map(item => ({
            deposit_amount: item.deposit_amount,
            monthly_rent: item.monthly_rent,
            deal_date: item.deal_date,
            exclusive_area: item.exclusive_area,
            floor_number: item.floor_number
          }));

          const recentTradeTransactions = filterRecentTransactions(tradeTransactions, recentMonths);
          const recentRentTransactions = filterRecentTransactions(rentTransactions, recentMonths);

          const tradeRange = calculateTradePrice(recentTradeTransactions);
          const rentDepositRange = calculateRentDepositRange(recentRentTransactions);
          const rentMonthlyRange = calculateRentMonthlyRange(recentRentTransactions);
          const rentMonthlyWithDeposit = calculateRentMonthlyWithDepositRange(recentRentTransactions);
          const summary = createPriceSummary(tradeRange, rentDepositRange, rentMonthlyRange, rentMonthlyWithDeposit);

          results[apartmentName] = {
            tradeRange,
            rentDepositRange,
            rentMonthlyRange,
            rentMonthlyWithDeposit,
            summary,
            hasData: !!(tradeRange || rentDepositRange || rentMonthlyRange),
            isRecent: recentMonths <= 12
          };
        } catch (error) {
          console.error(`아파트 ${apartmentName} 가격 데이터 조회 오류:`, error);
          results[apartmentName] = {
            tradeRange: null,
            rentDepositRange: null,
            rentMonthlyRange: null,
            rentMonthlyWithDeposit: null,
            summary: createPriceSummary(null, null, null, null),
            hasData: false,
            isRecent: false
          };
        }
      });

      await Promise.all(promises);
      return results;
    },
    enabled: enabled && apartmentNames.length > 0,
    staleTime: 1000 * 60 * 45, // 45분 (다중 조회는 더 오래 캐시)
    gcTime: 1000 * 60 * 60 * 3, // 3시간
    retry: 1,
    // 다중 요청이므로 변경 알림 최소화
    notifyOnChangeProps: ['data', 'error'],
    refetchInterval: false
  });
}

/**
 * 지역별 아파트 가격 범위 조회
 */
export function useRegionalPriceRange(
  regionCode: string,
  options: {
    recentMonths?: number;
    enabled?: boolean;
    limit?: number;
  } = {}
) {
  const { recentMonths = 12, enabled = true, limit = 100 } = options;
  
  return useQuery({
    queryKey: ['regional-price-range', regionCode, recentMonths, limit],
    queryFn: async (): Promise<PriceRangeResult> => {
      const supabase = createClient();
      
      // 해당 지역의 모든 매매 거래 데이터 조회
      const { data: tradeData, error: tradeError } = await supabase
        .from('apartment_trade_transactions')
        .select('deal_amount, deal_date, exclusive_area, floor_number')
        .eq('region_code', regionCode)
        .order('deal_date', { ascending: false })
        .limit(limit);

      if (tradeError) {
        console.error('지역 매매 거래 데이터 조회 오류:', tradeError);
        throw new Error(`지역 매매 거래 조회 실패: ${tradeError.message || JSON.stringify(tradeError)}`);
      }

      // 해당 지역의 모든 전월세 거래 데이터 조회
      const { data: rentData, error: rentError } = await supabase
        .from('apartment_rent_transactions')
        .select('deposit_amount, monthly_rent, deal_date, exclusive_area, floor_number')
        .eq('region_code', regionCode)
        .order('deal_date', { ascending: false })
        .limit(limit);

      if (rentError) {
        console.error('지역 전월세 거래 데이터 조회 오류:', rentError);
        throw new Error(`지역 전월세 거래 조회 실패: ${rentError.message || JSON.stringify(rentError)}`);
      }

      // 데이터 변환 및 계산
      const tradeTransactions: TransactionData[] = (tradeData || []).map(item => ({
        deal_amount: item.deal_amount,
        deal_date: item.deal_date,
        exclusive_area: item.exclusive_area,
        floor_number: item.floor_number
      }));

      const rentTransactions: RentTransactionData[] = (rentData || []).map(item => ({
        deposit_amount: item.deposit_amount,
        monthly_rent: item.monthly_rent,
        deal_date: item.deal_date,
        exclusive_area: item.exclusive_area,
        floor_number: item.floor_number
      }));

      const recentTradeTransactions = filterRecentTransactions(tradeTransactions, recentMonths);
      const recentRentTransactions = filterRecentTransactions(rentTransactions, recentMonths);

      const tradeRange = calculateTradePrice(recentTradeTransactions);
      const rentDepositRange = calculateRentDepositRange(recentRentTransactions);
      const rentMonthlyRange = calculateRentMonthlyRange(recentRentTransactions);
      const rentMonthlyWithDeposit = calculateRentMonthlyWithDepositRange(recentRentTransactions);
      const summary = createPriceSummary(tradeRange, rentDepositRange, rentMonthlyRange, rentMonthlyWithDeposit);

      return {
        tradeRange,
        rentDepositRange,
        rentMonthlyRange,
        rentMonthlyWithDeposit,
        summary,
        hasData: !!(tradeRange || rentDepositRange || rentMonthlyRange),
        isRecent: recentMonths <= 12
      };
    },
    enabled: enabled && !!regionCode,
    staleTime: 1000 * 60 * 90, // 1.5시간 (지역 데이터는 더 오래 캐시)
    gcTime: 1000 * 60 * 60 * 6, // 6시간 (지역 통계는 오래 보관)
    retry: 1,
    // 지역 통계는 자주 바뀌지 않으므로 백그라운드 업데이트 비활성화
    refetchInterval: false,
    refetchIntervalInBackground: false,
    notifyOnChangeProps: ['data', 'error']
  });
}