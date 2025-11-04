/**
 * 아파트 실거래가 최소/최대 금액 계산 유틸리티
 */

import { formatNumber } from './apartment-utils';

export interface PriceRange {
  min: number;
  max: number;
  count: number;
  average: number;
}

export interface RentMonthlyWithDepositRange {
  deposit: {
    min: number;
    max: number;
    average: number;
  };
  monthly: {
    min: number;
    max: number;
    average: number;
  };
  count: number;
}

export interface TransactionData {
  deal_amount: number;
  deal_date: string;
  exclusive_area: number;
  floor_number: number;
}

export interface RentTransactionData {
  deposit_amount: number;
  monthly_rent: number;
  deal_date: string;
  exclusive_area: number;
  floor_number: number;
}

/**
 * 매매 거래 데이터에서 가격 범위 계산
 */
export function calculateTradePrice(transactions: TransactionData[]): PriceRange | null {
  if (!transactions || transactions.length === 0) {
    return null;
  }

  const prices = transactions.map(t => t.deal_amount).filter(price => price > 0);
  
  if (prices.length === 0) {
    return null;
  }

  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const average = Math.round(prices.reduce((sum, price) => sum + price, 0) / prices.length);

  return {
    min,
    max,
    count: prices.length,
    average
  };
}

/**
 * 전월세 거래 데이터에서 보증금 범위 계산
 */
export function calculateRentDepositRange(transactions: RentTransactionData[]): PriceRange | null {
  if (!transactions || transactions.length === 0) {
    return null;
  }

  const deposits = transactions.map(t => t.deposit_amount).filter(deposit => deposit > 0);
  
  if (deposits.length === 0) {
    return null;
  }

  const min = Math.min(...deposits);
  const max = Math.max(...deposits);
  const average = Math.round(deposits.reduce((sum, deposit) => sum + deposit, 0) / deposits.length);

  return {
    min,
    max,
    count: deposits.length,
    average
  };
}

/**
 * 전월세 거래 데이터에서 월세 범위 계산
 */
export function calculateRentMonthlyRange(transactions: RentTransactionData[]): PriceRange | null {
  if (!transactions || transactions.length === 0) {
    return null;
  }

  const monthlyRents = transactions
    .map(t => t.monthly_rent)
    .filter(rent => rent > 0); // 월세가 0인 경우 제외 (전세)

  if (monthlyRents.length === 0) {
    return null;
  }

  const min = Math.min(...monthlyRents);
  const max = Math.max(...monthlyRents);
  const average = Math.round(monthlyRents.reduce((sum, rent) => sum + rent, 0) / monthlyRents.length);

  return {
    min,
    max,
    count: monthlyRents.length,
    average
  };
}

/**
 * 전월세 거래 데이터에서 월세 + 보증금 범위 계산
 */
export function calculateRentMonthlyWithDepositRange(transactions: RentTransactionData[]): RentMonthlyWithDepositRange | null {
  if (!transactions || transactions.length === 0) {
    return null;
  }

  // 월세가 있는 거래만 필터링 (월세가 0이면 전세)
  const monthlyRentTransactions = transactions.filter(t => t.monthly_rent > 0);

  if (monthlyRentTransactions.length === 0) {
    return null;
  }

  // 보증금 계산
  const deposits = monthlyRentTransactions.map(t => t.deposit_amount);
  const depositMin = Math.min(...deposits);
  const depositMax = Math.max(...deposits);
  const depositAverage = Math.round(deposits.reduce((sum, d) => sum + d, 0) / deposits.length);

  // 월세 계산
  const monthlyRents = monthlyRentTransactions.map(t => t.monthly_rent);
  const monthlyMin = Math.min(...monthlyRents);
  const monthlyMax = Math.max(...monthlyRents);
  const monthlyAverage = Math.round(monthlyRents.reduce((sum, r) => sum + r, 0) / monthlyRents.length);

  return {
    deposit: {
      min: depositMin,
      max: depositMax,
      average: depositAverage
    },
    monthly: {
      min: monthlyMin,
      max: monthlyMax,
      average: monthlyAverage
    },
    count: monthlyRentTransactions.length
  };
}

/**
 * 최근 N개월 거래 데이터 필터링
 */
export function filterRecentTransactions<T extends { deal_date: string }>(
  transactions: T[],
  months: number = 12
): T[] {
  const cutoffDate = new Date();
  cutoffDate.setMonth(cutoffDate.getMonth() - months);

  return transactions.filter(transaction => {
    const dealDate = new Date(transaction.deal_date);
    return dealDate >= cutoffDate;
  });
}

/**
 * 특정 면적 범위의 거래 데이터 필터링
 */
export function filterByArea<T extends { exclusive_area: number }>(
  transactions: T[],
  minArea?: number,
  maxArea?: number
): T[] {
  return transactions.filter(transaction => {
    const area = transaction.exclusive_area;
    if (minArea && area < minArea) return false;
    if (maxArea && area > maxArea) return false;
    return true;
  });
}

/**
 * 가격 범위를 사용자 친화적인 문자열로 포맷
 */
export function formatPriceRange(range: PriceRange | null, unit: '만원' | '원' = '만원'): string {
  if (!range) {
    return '거래 정보 없음';
  }

  const { min, max, count } = range;
  
  if (min === max) {
    return `${formatNumber(min)}${unit} (${count}건)`;
  }

  return `${formatNumber(min)}${unit} ~ ${formatNumber(max)}${unit} (${count}건)`;
}

/**
 * 월세 범위를 "보증금/월세" 형태로 포맷
 */
export function formatRentMonthlyRange(range: RentMonthlyWithDepositRange | null): string {
  if (!range) {
    return '거래 정보 없음';
  }

  const { deposit, monthly, count } = range;

  // 최소값과 최대값이 같은 경우
  if (deposit.min === deposit.max && monthly.min === monthly.max) {
    return `${formatNumber(deposit.min)}/${formatNumber(monthly.min)}만원 (${count}건)`;
  }

  // 범위가 있는 경우
  return `${formatNumber(deposit.min)}~${formatNumber(deposit.max)}/${formatNumber(monthly.min)}~${formatNumber(monthly.max)}만원 (${count}건)`;
}

/**
 * 가격 범위 요약 정보 생성
 */
export function createPriceSummary(
  tradeRange: PriceRange | null,
  rentDepositRange: PriceRange | null,
  rentMonthlyRange: PriceRange | null,
  rentMonthlyWithDeposit?: RentMonthlyWithDepositRange | null
) {
  return {
    trade: tradeRange ? {
      text: formatPriceRange(tradeRange, '만원'),
      min: tradeRange.min,
      max: tradeRange.max,
      count: tradeRange.count,
      average: tradeRange.average
    } : null,

    rentDeposit: rentDepositRange ? {
      text: formatPriceRange(rentDepositRange, '만원'),
      min: rentDepositRange.min,
      max: rentDepositRange.max,
      count: rentDepositRange.count,
      average: rentDepositRange.average
    } : null,

    rentMonthly: rentMonthlyRange ? {
      text: formatPriceRange(rentMonthlyRange, '만원'),
      min: rentMonthlyRange.min,
      max: rentMonthlyRange.max,
      count: rentMonthlyRange.count,
      average: rentMonthlyRange.average
    } : null,

    rentMonthlyWithDeposit: rentMonthlyWithDeposit ? {
      text: formatRentMonthlyRange(rentMonthlyWithDeposit),
      depositMin: rentMonthlyWithDeposit.deposit.min,
      depositMax: rentMonthlyWithDeposit.deposit.max,
      depositAverage: rentMonthlyWithDeposit.deposit.average,
      monthlyMin: rentMonthlyWithDeposit.monthly.min,
      monthlyMax: rentMonthlyWithDeposit.monthly.max,
      monthlyAverage: rentMonthlyWithDeposit.monthly.average,
      count: rentMonthlyWithDeposit.count
    } : null
  };
}

/**
 * 가격 범위 비교를 위한 상태 계산
 */
export function calculatePriceStatus(currentPrice: number, range: PriceRange): 'low' | 'average' | 'high' {
  const { min, max, average } = range;
  const midPoint = (min + max) / 2;
  
  if (currentPrice <= min + (midPoint - min) * 0.3) {
    return 'low';
  } else if (currentPrice >= max - (max - midPoint) * 0.3) {
    return 'high';
  } else {
    return 'average';
  }
}

/**
 * 면적당 단가 계산 (평당 가격)
 */
export function calculatePricePerPyeong(price: number, exclusiveArea: number): number {
  // 1평 = 3.3058㎡
  const areaInPyeong = exclusiveArea / 3.3058;
  return Math.round(price / areaInPyeong);
}

/**
 * 거래 데이터에서 면적당 단가 범위 계산
 */
export function calculatePricePerAreaRange(transactions: TransactionData[]): PriceRange | null {
  if (!transactions || transactions.length === 0) {
    return null;
  }

  const pricesPerPyeong = transactions
    .filter(t => t.deal_amount > 0 && t.exclusive_area > 0)
    .map(t => calculatePricePerPyeong(t.deal_amount, t.exclusive_area));
  
  if (pricesPerPyeong.length === 0) {
    return null;
  }

  const min = Math.min(...pricesPerPyeong);
  const max = Math.max(...pricesPerPyeong);
  const average = Math.round(pricesPerPyeong.reduce((sum, price) => sum + price, 0) / pricesPerPyeong.length);

  return {
    min,
    max,
    count: pricesPerPyeong.length,
    average
  };
}