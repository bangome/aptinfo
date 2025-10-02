/**
 * PriceRangeDisplay 컴포넌트 테스트
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PriceRangeDisplay, PriceRangeBadge } from './PriceRangeDisplay';
import { type PriceRangeResult } from '@/hooks/use-apartment-price-range';

// Mock UI components
jest.mock('@/components/ui/skeleton', () => ({
  Skeleton: ({ className }: { className?: string }) => (
    <div data-testid="skeleton" className={className}>Loading...</div>
  )
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant, className }: { children: React.ReactNode; variant?: string; className?: string }) => (
    <span className={className} data-variant={variant}>{children}</span>
  )
}));

jest.mock('@/components/GlossaryTooltip', () => ({
  GlossaryTooltip: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="glossary-tooltip">{children}</div>
  )
}));

jest.mock('@/lib/apartment-utils', () => ({
  formatNumber: (num: number) => num.toLocaleString()
}));

describe('PriceRangeDisplay', () => {
  const mockPriceData: PriceRangeResult = {
    tradeRange: {
      min: 45000,
      max: 55000,
      count: 5,
      average: 50000
    },
    rentDepositRange: {
      min: 20000,
      max: 25000,
      count: 3,
      average: 22500
    },
    rentMonthlyRange: {
      min: 50,
      max: 80,
      count: 2,
      average: 65
    },
    summary: {
      trade: {
        text: '45,000만원 ~ 55,000만원 (5건)',
        min: 45000,
        max: 55000,
        count: 5,
        average: 50000
      },
      rentDeposit: {
        text: '20,000만원 ~ 25,000만원 (3건)',
        min: 20000,
        max: 25000,
        count: 3,
        average: 22500
      },
      rentMonthly: {
        text: '50만원 ~ 80만원 (2건)',
        min: 50,
        max: 80,
        count: 2,
        average: 65
      }
    },
    hasData: true,
    isRecent: true
  };

  describe('로딩 상태', () => {
    it('로딩 중일 때 스켈레톤을 표시해야 합니다', () => {
      render(
        <PriceRangeDisplay 
          priceData={null} 
          isLoading={true} 
          compact={true} 
        />
      );
      
      // 스켈레톤 요소들이 렌더링되는지 확인
      const skeletons = screen.getAllByTestId('skeleton');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('빈 데이터 상태', () => {
    it('데이터가 없을 때 적절한 메시지를 표시해야 합니다', () => {
      render(
        <PriceRangeDisplay 
          priceData={null} 
          isLoading={false} 
          compact={true} 
        />
      );
      
      expect(screen.getByText('거래 정보 없음')).toBeInTheDocument();
    });

    it('hasData가 false일 때 빈 상태를 표시해야 합니다', () => {
      const emptyPriceData: PriceRangeResult = {
        ...mockPriceData,
        hasData: false,
        summary: {
          trade: null,
          rentDeposit: null,
          rentMonthly: null
        }
      };

      render(
        <PriceRangeDisplay 
          priceData={emptyPriceData} 
          isLoading={false} 
          compact={false} 
        />
      );
      
      expect(screen.getByText('최근 거래 정보가 없습니다')).toBeInTheDocument();
    });
  });

  describe('컴팩트 모드', () => {
    it('모든 가격 타입을 올바르게 표시해야 합니다', () => {
      render(
        <PriceRangeDisplay 
          priceData={mockPriceData} 
          isLoading={false} 
          compact={true} 
        />
      );
      
      expect(screen.getByText(/매매 45,000만원 ~ 55,000만원 \(5건\)/)).toBeInTheDocument();
      expect(screen.getByText(/전세 20,000만원 ~ 25,000만원 \(3건\)/)).toBeInTheDocument();
      expect(screen.getByText(/월세 50만원 ~ 80만원 \(2건\)/)).toBeInTheDocument();
    });

    it('ARIA 레이블을 올바르게 설정해야 합니다', () => {
      render(
        <PriceRangeDisplay 
          priceData={mockPriceData} 
          isLoading={false} 
          compact={true} 
        />
      );
      
      expect(screen.getByRole('region', { name: '실거래가 정보' })).toBeInTheDocument();
      expect(screen.getByLabelText(/매매 실거래가 범위/)).toBeInTheDocument();
      expect(screen.getByLabelText(/전세 실거래가 범위/)).toBeInTheDocument();
      expect(screen.getByLabelText(/월세 실거래가 범위/)).toBeInTheDocument();
    });

    it('과거 데이터 배지를 올바르게 표시해야 합니다', () => {
      const pastDataPrice: PriceRangeResult = {
        ...mockPriceData,
        isRecent: false
      };

      render(
        <PriceRangeDisplay 
          priceData={pastDataPrice} 
          isLoading={false} 
          compact={true} 
        />
      );
      
      expect(screen.getByText('과거')).toBeInTheDocument();
    });
  });

  describe('상세 모드', () => {
    it('제목과 설명을 올바르게 표시해야 합니다', () => {
      render(
        <PriceRangeDisplay 
          priceData={mockPriceData} 
          isLoading={false} 
          compact={false} 
        />
      );
      
      expect(screen.getByText('실거래가 정보')).toBeInTheDocument();
      expect(screen.getByTestId('glossary-tooltip')).toBeInTheDocument();
    });

    it('각 가격 타입별 상세 정보를 표시해야 합니다', () => {
      render(
        <PriceRangeDisplay 
          priceData={mockPriceData} 
          isLoading={false} 
          compact={false} 
        />
      );
      
      // 매매 정보
      expect(screen.getByText('매매')).toBeInTheDocument();
      expect(screen.getByText('평균 50,000만원')).toBeInTheDocument();
      
      // 전세 정보
      expect(screen.getByText('전세')).toBeInTheDocument();
      expect(screen.getByText('평균 22,500만원')).toBeInTheDocument();
      
      // 월세 정보
      expect(screen.getByText('월세')).toBeInTheDocument();
      expect(screen.getByText('평균 65만원')).toBeInTheDocument();
    });

    it('최근 데이터 표시를 올바르게 처리해야 합니다', () => {
      render(
        <PriceRangeDisplay 
          priceData={mockPriceData} 
          isLoading={false} 
          compact={false} 
        />
      );
      
      expect(screen.getByText('* 최근 12개월 실거래 데이터 기준')).toBeInTheDocument();
    });

    it('과거 데이터에 대한 배지를 표시해야 합니다', () => {
      const pastDataPrice: PriceRangeResult = {
        ...mockPriceData,
        isRecent: false
      };

      render(
        <PriceRangeDisplay 
          priceData={pastDataPrice} 
          isLoading={false} 
          compact={false} 
        />
      );
      
      expect(screen.getByText('12개월 이전 데이터 포함')).toBeInTheDocument();
    });
  });

  describe('부분 데이터', () => {
    it('매매 데이터만 있는 경우를 올바르게 처리해야 합니다', () => {
      const partialPriceData: PriceRangeResult = {
        ...mockPriceData,
        summary: {
          trade: mockPriceData.summary.trade,
          rentDeposit: null,
          rentMonthly: null
        }
      };

      render(
        <PriceRangeDisplay 
          priceData={partialPriceData} 
          isLoading={false} 
          compact={true} 
        />
      );
      
      expect(screen.getByText(/매매 45,000만원 ~ 55,000만원/)).toBeInTheDocument();
      expect(screen.queryByText(/전세/)).not.toBeInTheDocument();
      expect(screen.queryByText(/월세/)).not.toBeInTheDocument();
    });
  });

  describe('접근성', () => {
    it('적절한 ARIA 속성을 가져야 합니다', () => {
      render(
        <PriceRangeDisplay 
          priceData={mockPriceData} 
          isLoading={false} 
          compact={false} 
        />
      );
      
      expect(screen.getByRole('region')).toBeInTheDocument();
      expect(screen.getAllByRole('group')).toHaveLength(3); // 매매, 전세, 월세
      expect(screen.getByRole('note')).toBeInTheDocument(); // 최근 데이터 표시
    });

    it('스크린 리더를 위한 라벨을 제공해야 합니다', () => {
      render(
        <PriceRangeDisplay 
          priceData={mockPriceData} 
          isLoading={false} 
          compact={false} 
        />
      );
      
      expect(screen.getByLabelText(/매매 가격 범위/)).toBeInTheDocument();
      expect(screen.getByLabelText(/전세 가격 범위/)).toBeInTheDocument();
      expect(screen.getByLabelText(/월세 가격 범위/)).toBeInTheDocument();
    });
  });
});

describe('PriceRangeBadge', () => {
  // Define mockPriceData locally for badge tests
  const badgeMockPriceData: PriceRangeResult = {
    tradeRange: {
      min: 45000,
      max: 55000,
      count: 5,
      average: 50000
    },
    rentDepositRange: {
      min: 20000,
      max: 25000,
      count: 3,
      average: 22500
    },
    rentMonthlyRange: null,
    summary: {
      trade: {
        text: '45,000만원 ~ 55,000만원 (5건)',
        min: 45000,
        max: 55000,
        count: 5,
        average: 50000
      },
      rentDeposit: {
        text: '20,000만원 ~ 25,000만원 (3건)',
        min: 20000,
        max: 25000,
        count: 3,
        average: 22500
      },
      rentMonthly: null
    },
    hasData: true,
    isRecent: true
  };

  it('매매 가격 배지를 올바르게 표시해야 합니다', () => {
    render(
      <PriceRangeBadge 
        priceData={badgeMockPriceData} 
        isLoading={false} 
        type="trade" 
      />
    );
    
    expect(screen.getByText('45,000만원 ~ 55,000만원')).toBeInTheDocument();
  });

  it('전세 가격 배지를 올바르게 표시해야 합니다', () => {
    render(
      <PriceRangeBadge 
        priceData={badgeMockPriceData} 
        isLoading={false} 
        type="rent" 
      />
    );
    
    expect(screen.getByText('20,000만원 ~ 25,000만원')).toBeInTheDocument();
  });

  it('로딩 중일 때 스켈레톤을 표시해야 합니다', () => {
    render(
      <PriceRangeBadge 
        priceData={null} 
        isLoading={true} 
        type="trade" 
      />
    );
    
    expect(screen.getByTestId('skeleton')).toBeInTheDocument();
  });

  it('데이터가 없을 때 아무것도 렌더링하지 않아야 합니다', () => {
    const { container } = render(
      <PriceRangeBadge 
        priceData={null} 
        isLoading={false} 
        type="trade" 
      />
    );
    
    expect(container.firstChild).toBeNull();
  });

  it('해당 타입의 데이터가 없을 때 아무것도 렌더링하지 않아야 합니다', () => {
    const noPriceData: PriceRangeResult = {
      ...badgeMockPriceData,
      summary: {
        trade: null,
        rentDeposit: null,
        rentMonthly: null
      }
    };

    const { container } = render(
      <PriceRangeBadge 
        priceData={noPriceData} 
        isLoading={false} 
        type="trade" 
      />
    );
    
    expect(container.firstChild).toBeNull();
  });
});