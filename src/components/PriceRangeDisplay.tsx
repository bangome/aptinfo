/**
 * 가격 범위 표시 컴포넌트
 * 아파트 검색 결과에서 실거래가 최소~최고 금액을 표시
 */

'use client';

import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';
import { GlossaryTooltip } from '@/components/GlossaryTooltip';
import { type PriceRangeResult } from '@/hooks/use-apartment-price-range';
import { formatNumber } from '@/lib/apartment-utils';

interface PriceRangeDisplayProps {
  priceData: PriceRangeResult | null;
  isLoading?: boolean;
  compact?: boolean;
  className?: string;
}

/**
 * 가격 변동 트렌드 아이콘 표시
 */
function TrendIcon({ trend }: { trend: 'up' | 'down' | 'stable' }) {
  const iconProps = { className: 'h-3 w-3', 'aria-hidden': true };
  
  switch (trend) {
    case 'up':
      return <TrendingUp {...iconProps} className="h-3 w-3 text-red-500" />;
    case 'down':
      return <TrendingDown {...iconProps} className="h-3 w-3 text-blue-500" />;
    default:
      return <Minus {...iconProps} className="h-3 w-3 text-gray-400" />;
  }
}

/**
 * 가격 범위 텍스트 포맷팅
 */
function formatPriceRangeText(min: number, max: number, count: number): string {
  if (min === max) {
    return `${formatNumber(min)}만원 (${count}건)`;
  }
  return `${formatNumber(min)}만원 ~ ${formatNumber(max)}만원 (${count}건)`;
}

/**
 * 로딩 스켈레톤 컴포넌트
 */
function PriceRangeSkeleton({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <div className="space-y-1">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-16" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="space-y-1">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-24" />
      </div>
      <div className="space-y-1">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  );
}

/**
 * 빈 데이터 상태 컴포넌트
 */
function EmptyPriceData({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <div className="text-body2 text-muted-foreground">
        거래 정보 없음
      </div>
    );
  }

  return (
    <div className="text-center py-2">
      <Info className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
      <p className="text-body2 text-muted-foreground">
        최근 거래 정보가 없습니다
      </p>
    </div>
  );
}

/**
 * 메인 가격 범위 표시 컴포넌트
 */
export function PriceRangeDisplay({
  priceData,
  isLoading = false,
  compact = false,
  className = ''
}: PriceRangeDisplayProps) {
  // 로딩 상태
  if (isLoading) {
    return (
      <div className={`${className}`}>
        <PriceRangeSkeleton compact={compact} />
      </div>
    );
  }

  // 데이터 없음
  if (!priceData || !priceData.hasData) {
    return (
      <div className={`${className}`}>
        <EmptyPriceData compact={compact} />
      </div>
    );
  }

  const { summary, isRecent } = priceData;

  // 컴팩트 버전 (검색 결과 카드용)
  if (compact) {
    return (
      <div className={`space-y-1 ${className}`} role="region" aria-label="실거래가 정보">
        {summary.trade && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-1">
            <span 
              className="text-body2 font-medium text-primary break-words"
              aria-label={`매매 실거래가 범위: ${formatPriceRangeText(summary.trade.min, summary.trade.max, summary.trade.count)}`}
            >
              매매 {formatPriceRangeText(summary.trade.min, summary.trade.max, summary.trade.count)}
            </span>
            {!isRecent && (
              <Badge variant="secondary" className="text-xs w-fit">
                과거
              </Badge>
            )}
          </div>
        )}
        
        {summary.rentDeposit && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-1">
            <span 
              className="text-body2 text-secondary break-words"
              aria-label={`전세 실거래가 범위: ${formatPriceRangeText(summary.rentDeposit.min, summary.rentDeposit.max, summary.rentDeposit.count)}`}
            >
              전세 {formatPriceRangeText(summary.rentDeposit.min, summary.rentDeposit.max, summary.rentDeposit.count)}
            </span>
          </div>
        )}
        
        {summary.rentMonthly && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-1">
            <span 
              className="text-body2 text-muted-foreground break-words"
              aria-label={`월세 실거래가 범위: ${formatPriceRangeText(summary.rentMonthly.min, summary.rentMonthly.max, summary.rentMonthly.count)}`}
            >
              월세 {formatPriceRangeText(summary.rentMonthly.min, summary.rentMonthly.max, summary.rentMonthly.count)}
            </span>
          </div>
        )}
      </div>
    );
  }

  // 상세 버전 (상세 페이지용)
  return (
    <section 
      className={`space-y-3 ${className}`}
      aria-labelledby="price-range-heading"
      role="region"
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <h4 id="price-range-heading" className="text-h6 font-semibold">
          실거래가 정보
        </h4>
        <div className="flex items-center gap-2">
          <GlossaryTooltip term="시세">
            <Info 
              className="h-4 w-4 text-muted-foreground cursor-help" 
              aria-label="실거래가 정보 도움말"
            />
          </GlossaryTooltip>
          {!isRecent && (
            <Badge variant="outline" className="text-xs">
              12개월 이전 데이터 포함
            </Badge>
          )}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
        {summary.trade && (
          <div 
            className="flex flex-col p-3 bg-primary/5 rounded-lg focus-within:ring-2 focus-within:ring-primary/20"
            role="group"
            aria-labelledby="trade-price-label"
          >
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span 
                  id="trade-price-label"
                  className="text-body1 font-medium text-primary"
                >
                  매매
                </span>
                <TrendIcon trend="stable" />
              </div>
              <div 
                className="text-h6 font-semibold text-foreground break-words"
                aria-label={`매매 가격 범위: ${formatPriceRangeText(summary.trade.min, summary.trade.max, summary.trade.count)}`}
              >
                {formatPriceRangeText(summary.trade.min, summary.trade.max, summary.trade.count)}
              </div>
              <div className="text-body2 text-muted-foreground mt-1">
                평균 {formatNumber(summary.trade.average)}만원
              </div>
            </div>
          </div>
        )}

        {summary.rentDeposit && (
          <div 
            className="flex flex-col p-3 bg-secondary/5 rounded-lg focus-within:ring-2 focus-within:ring-secondary/20"
            role="group"
            aria-labelledby="rent-deposit-label"
          >
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span 
                  id="rent-deposit-label"
                  className="text-body1 font-medium text-secondary"
                >
                  전세
                </span>
                <TrendIcon trend="stable" />
              </div>
              <div 
                className="text-h6 font-semibold text-foreground break-words"
                aria-label={`전세 가격 범위: ${formatPriceRangeText(summary.rentDeposit.min, summary.rentDeposit.max, summary.rentDeposit.count)}`}
              >
                {formatPriceRangeText(summary.rentDeposit.min, summary.rentDeposit.max, summary.rentDeposit.count)}
              </div>
              <div className="text-body2 text-muted-foreground mt-1">
                평균 {formatNumber(summary.rentDeposit.average)}만원
              </div>
            </div>
          </div>
        )}

        {summary.rentMonthly && (
          <div 
            className="flex flex-col p-3 bg-muted/30 rounded-lg focus-within:ring-2 focus-within:ring-muted/40"
            role="group"
            aria-labelledby="rent-monthly-label"
          >
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span 
                  id="rent-monthly-label"
                  className="text-body1 font-medium text-muted-foreground"
                >
                  월세
                </span>
                <TrendIcon trend="stable" />
              </div>
              <div 
                className="text-h6 font-semibold text-foreground break-words"
                aria-label={`월세 가격 범위: ${formatPriceRangeText(summary.rentMonthly.min, summary.rentMonthly.max, summary.rentMonthly.count)}`}
              >
                {formatPriceRangeText(summary.rentMonthly.min, summary.rentMonthly.max, summary.rentMonthly.count)}
              </div>
              <div className="text-body2 text-muted-foreground mt-1">
                평균 {formatNumber(summary.rentMonthly.average)}만원
              </div>
            </div>
          </div>
        )}
      </div>

      {isRecent && (
        <div className="text-xs text-muted-foreground" role="note">
          * 최근 12개월 실거래 데이터 기준
        </div>
      )}
    </section>
  );
}

/**
 * 가격 범위 배지 컴포넌트 (카드 헤더용)
 */
export function PriceRangeBadge({
  priceData,
  isLoading = false,
  type = 'trade'
}: {
  priceData: PriceRangeResult | null;
  isLoading?: boolean;
  type?: 'trade' | 'rent';
}) {
  if (isLoading) {
    return <Skeleton className="h-6 w-20" />;
  }

  if (!priceData || !priceData.hasData) {
    return null;
  }

  const { summary } = priceData;
  const data = type === 'trade' ? summary.trade : summary.rentDeposit;

  if (!data) {
    return null;
  }

  return (
    <Badge 
      variant={type === 'trade' ? 'default' : 'secondary'}
      className="text-xs font-medium"
    >
      {formatNumber(data.min)}만원 ~ {formatNumber(data.max)}만원
    </Badge>
  );
}