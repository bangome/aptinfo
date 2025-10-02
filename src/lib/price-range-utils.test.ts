/**
 * 가격 범위 계산 유틸리티 테스트
 */

import {
  calculateTradePrice,
  calculateRentDepositRange,
  calculateRentMonthlyRange,
  filterRecentTransactions,
  filterByArea,
  formatPriceRange,
  createPriceSummary,
  calculatePriceStatus,
  calculatePricePerPyeong,
  calculatePricePerAreaRange,
  type TransactionData,
  type RentTransactionData
} from './price-range-utils';

describe('Price Range Utils', () => {
  describe('calculateTradePrice', () => {
    it('빈 배열에서 null을 반환해야 합니다', () => {
      expect(calculateTradePrice([])).toBeNull();
    });

    it('단일 거래 데이터에서 올바른 범위를 계산해야 합니다', () => {
      const transactions: TransactionData[] = [
        {
          deal_amount: 50000,
          deal_date: '2024-01-15',
          exclusive_area: 85.5,
          floor_number: 10
        }
      ];

      const result = calculateTradePrice(transactions);
      expect(result).toEqual({
        min: 50000,
        max: 50000,
        count: 1,
        average: 50000
      });
    });

    it('여러 거래 데이터에서 올바른 범위를 계산해야 합니다', () => {
      const transactions: TransactionData[] = [
        {
          deal_amount: 45000,
          deal_date: '2024-01-15',
          exclusive_area: 85.5,
          floor_number: 5
        },
        {
          deal_amount: 55000,
          deal_date: '2024-02-10',
          exclusive_area: 85.5,
          floor_number: 15
        },
        {
          deal_amount: 50000,
          deal_date: '2024-03-05',
          exclusive_area: 85.5,
          floor_number: 10
        }
      ];

      const result = calculateTradePrice(transactions);
      expect(result).toEqual({
        min: 45000,
        max: 55000,
        count: 3,
        average: 50000
      });
    });

    it('0원 거래는 제외해야 합니다', () => {
      const transactions: TransactionData[] = [
        {
          deal_amount: 0,
          deal_date: '2024-01-15',
          exclusive_area: 85.5,
          floor_number: 5
        },
        {
          deal_amount: 50000,
          deal_date: '2024-02-10',
          exclusive_area: 85.5,
          floor_number: 15
        }
      ];

      const result = calculateTradePrice(transactions);
      expect(result).toEqual({
        min: 50000,
        max: 50000,
        count: 1,
        average: 50000
      });
    });
  });

  describe('calculateRentDepositRange', () => {
    it('전월세 보증금 범위를 올바르게 계산해야 합니다', () => {
      const transactions: RentTransactionData[] = [
        {
          deposit_amount: 20000,
          monthly_rent: 50,
          deal_date: '2024-01-15',
          exclusive_area: 85.5,
          floor_number: 10
        },
        {
          deposit_amount: 25000,
          monthly_rent: 0, // 전세
          deal_date: '2024-02-10',
          exclusive_area: 85.5,
          floor_number: 15
        }
      ];

      const result = calculateRentDepositRange(transactions);
      expect(result).toEqual({
        min: 20000,
        max: 25000,
        count: 2,
        average: 22500
      });
    });
  });

  describe('calculateRentMonthlyRange', () => {
    it('월세 범위를 올바르게 계산해야 합니다', () => {
      const transactions: RentTransactionData[] = [
        {
          deposit_amount: 10000,
          monthly_rent: 50,
          deal_date: '2024-01-15',
          exclusive_area: 85.5,
          floor_number: 10
        },
        {
          deposit_amount: 15000,
          monthly_rent: 80,
          deal_date: '2024-02-10',
          exclusive_area: 85.5,
          floor_number: 15
        },
        {
          deposit_amount: 25000,
          monthly_rent: 0, // 전세 - 제외되어야 함
          deal_date: '2024-03-05',
          exclusive_area: 85.5,
          floor_number: 12
        }
      ];

      const result = calculateRentMonthlyRange(transactions);
      expect(result).toEqual({
        min: 50,
        max: 80,
        count: 2,
        average: 65
      });
    });

    it('월세가 모두 0원인 경우 null을 반환해야 합니다', () => {
      const transactions: RentTransactionData[] = [
        {
          deposit_amount: 25000,
          monthly_rent: 0,
          deal_date: '2024-01-15',
          exclusive_area: 85.5,
          floor_number: 10
        }
      ];

      const result = calculateRentMonthlyRange(transactions);
      expect(result).toBeNull();
    });
  });

  describe('filterRecentTransactions', () => {
    it('최근 N개월 거래 데이터만 필터링해야 합니다', () => {
      const now = new Date();
      const twoMonthsAgo = new Date();
      twoMonthsAgo.setMonth(now.getMonth() - 2);
      const fourMonthsAgo = new Date();
      fourMonthsAgo.setMonth(now.getMonth() - 4);

      const transactions: TransactionData[] = [
        {
          deal_amount: 50000,
          deal_date: now.toISOString().split('T')[0],
          exclusive_area: 85.5,
          floor_number: 10
        },
        {
          deal_amount: 48000,
          deal_date: twoMonthsAgo.toISOString().split('T')[0],
          exclusive_area: 85.5,
          floor_number: 5
        },
        {
          deal_amount: 45000,
          deal_date: fourMonthsAgo.toISOString().split('T')[0],
          exclusive_area: 85.5,
          floor_number: 3
        }
      ];

      const recentTransactions = filterRecentTransactions(transactions, 3);
      expect(recentTransactions).toHaveLength(2);
      expect(recentTransactions.map(t => t.deal_amount)).toEqual([50000, 48000]);
    });
  });

  describe('filterByArea', () => {
    it('면적 범위로 거래 데이터를 필터링해야 합니다', () => {
      const transactions: TransactionData[] = [
        {
          deal_amount: 50000,
          deal_date: '2024-01-15',
          exclusive_area: 75.5,
          floor_number: 10
        },
        {
          deal_amount: 55000,
          deal_date: '2024-02-10',
          exclusive_area: 85.5,
          floor_number: 15
        },
        {
          deal_amount: 60000,
          deal_date: '2024-03-05',
          exclusive_area: 95.5,
          floor_number: 20
        }
      ];

      const filtered = filterByArea(transactions, 80, 90);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].exclusive_area).toBe(85.5);
    });
  });

  describe('formatPriceRange', () => {
    it('가격 범위를 올바르게 포맷해야 합니다', () => {
      const range = {
        min: 45000,
        max: 55000,
        count: 5,
        average: 50000
      };

      expect(formatPriceRange(range)).toBe('45,000만원 ~ 55,000만원 (5건)');
    });

    it('최소값과 최대값이 같은 경우 단일 값으로 표시해야 합니다', () => {
      const range = {
        min: 50000,
        max: 50000,
        count: 1,
        average: 50000
      };

      expect(formatPriceRange(range)).toBe('50,000만원 (1건)');
    });

    it('null 범위에 대해 적절한 메시지를 반환해야 합니다', () => {
      expect(formatPriceRange(null)).toBe('거래 정보 없음');
    });
  });

  describe('createPriceSummary', () => {
    it('모든 타입의 가격 요약을 생성해야 합니다', () => {
      const tradeRange = { min: 45000, max: 55000, count: 3, average: 50000 };
      const rentDepositRange = { min: 20000, max: 25000, count: 2, average: 22500 };
      const rentMonthlyRange = { min: 50, max: 80, count: 2, average: 65 };

      const summary = createPriceSummary(tradeRange, rentDepositRange, rentMonthlyRange);
      
      expect(summary.trade).toBeDefined();
      expect(summary.trade?.text).toBe('45,000만원 ~ 55,000만원 (3건)');
      expect(summary.rentDeposit).toBeDefined();
      expect(summary.rentDeposit?.text).toBe('20,000만원 ~ 25,000만원 (2건)');
      expect(summary.rentMonthly).toBeDefined();
      expect(summary.rentMonthly?.text).toBe('50만원 ~ 80만원 (2건)');
    });

    it('null 값들에 대해 적절히 처리해야 합니다', () => {
      const summary = createPriceSummary(null, null, null);
      
      expect(summary.trade).toBeNull();
      expect(summary.rentDeposit).toBeNull();
      expect(summary.rentMonthly).toBeNull();
    });
  });

  describe('calculatePriceStatus', () => {
    const range = { min: 40000, max: 60000, count: 10, average: 50000 };

    it('낮은 가격을 올바르게 식별해야 합니다', () => {
      expect(calculatePriceStatus(42000, range)).toBe('low');
    });

    it('평균 가격을 올바르게 식별해야 합니다', () => {
      expect(calculatePriceStatus(50000, range)).toBe('average');
    });

    it('높은 가격을 올바르게 식별해야 합니다', () => {
      expect(calculatePriceStatus(58000, range)).toBe('high');
    });
  });

  describe('calculatePricePerPyeong', () => {
    it('평당 가격을 올바르게 계산해야 합니다', () => {
      // 50,000만원 / (85.5㎡ / 3.3058) ≈ 1,933만원/평
      const pricePerPyeong = calculatePricePerPyeong(50000, 85.5);
      expect(pricePerPyeong).toBeCloseTo(1933, 0);
    });
  });

  describe('calculatePricePerAreaRange', () => {
    it('평당 가격 범위를 올바르게 계산해야 합니다', () => {
      const transactions: TransactionData[] = [
        {
          deal_amount: 40000,
          deal_date: '2024-01-15',
          exclusive_area: 80.0,
          floor_number: 10
        },
        {
          deal_amount: 50000,
          deal_date: '2024-02-10',
          exclusive_area: 85.5,
          floor_number: 15
        }
      ];

      const result = calculatePricePerAreaRange(transactions);
      expect(result).toBeDefined();
      expect(result?.count).toBe(2);
      expect(result?.min).toBeLessThan(result?.max);
    });

    it('잘못된 데이터는 제외해야 합니다', () => {
      const transactions: TransactionData[] = [
        {
          deal_amount: 0, // 잘못된 금액
          deal_date: '2024-01-15',
          exclusive_area: 85.5,
          floor_number: 10
        },
        {
          deal_amount: 50000,
          deal_date: '2024-02-10',
          exclusive_area: 0, // 잘못된 면적
          floor_number: 15
        }
      ];

      const result = calculatePricePerAreaRange(transactions);
      expect(result).toBeNull();
    });
  });
});