'use client';

import { Button } from '@/components/ui/button-enhanced';
import { Heart, GitCompare, MapPin } from 'lucide-react';
import { Apartment } from '@/types/apartment';
import Link from 'next/link';
import { formatPrice, formatArea, formatNumber } from '@/lib/apartment-utils';
import { useApartmentPriceRange } from '@/hooks/use-apartment-price-range';

interface ApartmentListItemProps {
  apartment: Apartment;
  onBookmark?: (apartmentId: string) => void;
  onCompare?: (apartmentId: string) => void;
  isBookmarked?: boolean;
  isCompared?: boolean;
}

export function ApartmentListItem({
  apartment,
  onBookmark,
  onCompare,
  isBookmarked = false,
  isCompared = false
}: ApartmentListItemProps) {

  // 실거래가 데이터 조회
  const { data: priceData, isLoading: priceLoading } = useApartmentPriceRange(
    apartment.name,
    { recentMonths: 12, enabled: true }
  );

  return (
    <div className="border rounded-lg hover:border-primary/50 transition-colors bg-card">
      <Link href={`/apartments/${apartment.kaptCode}`}>
        <div className="grid grid-cols-12 gap-3 p-4 items-center">
          {/* 아파트명 및 주소 - 4 columns */}
          <div className="col-span-4">
            <h3 className="font-semibold text-body1 text-foreground hover:text-primary transition-colors line-clamp-1">
              {apartment.name}
            </h3>
            <p className="text-xs text-muted-foreground flex items-center mt-1 line-clamp-1">
              <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
              {apartment.address}
            </p>
          </div>

          {/* 건축년도 - 1 column */}
          <div className="col-span-1 text-center">
            <div className="text-body2 text-muted-foreground">
              {apartment.buildYear}년
            </div>
          </div>

          {/* 세대수 - 1 column */}
          <div className="col-span-1 text-center">
            <div className="text-body2 text-foreground">
              {formatNumber(apartment.units)}세대
            </div>
          </div>

          {/* 주차 - 1 column */}
          <div className="col-span-1 text-center">
            <div className="text-body2 text-foreground">
              {formatNumber(
                typeof apartment.parking === 'number'
                  ? apartment.parking
                  : (apartment.parking?.total || 0)
              )}대
            </div>
          </div>

          {/* 면적 - 1 column */}
          <div className="col-span-1 text-center">
            <div className="text-body2 text-foreground">
              {formatArea(apartment.area.exclusive)}
            </div>
          </div>

          {/* 가격 정보 - 2 columns */}
          <div className="col-span-2">
            {priceLoading ? (
              <div className="text-xs text-muted-foreground text-center">조회중...</div>
            ) : priceData?.hasData ? (
              <div className="text-xs space-y-0.5">
                {priceData.summary.trade && (
                  <div className="text-body2">
                    <span className="text-muted-foreground">매매</span>{' '}
                    <span className="font-medium text-primary">
                      {formatNumber(priceData.summary.trade.average)}만
                    </span>
                  </div>
                )}
                {priceData.summary.rentDeposit && (
                  <div className="text-body2">
                    <span className="text-muted-foreground">전세</span>{' '}
                    <span className="font-medium text-secondary">
                      {formatNumber(priceData.summary.rentDeposit.average)}만
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-xs text-muted-foreground text-center">정보없음</div>
            )}
          </div>

          {/* 액션 버튼 - 1 column */}
          <div className="col-span-1 flex gap-1 justify-end" onClick={(e) => e.preventDefault()}>
            {onBookmark && (
              <Button
                size="icon-sm"
                variant={isBookmarked ? "bookmarked" : "bookmark"}
                className="rounded-full"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onBookmark(apartment.id);
                }}
                aria-label={isBookmarked ? '북마크 해제' : '북마크 추가'}
              >
                <Heart className="h-3 w-3" />
              </Button>
            )}
            {onCompare && (
              <Button
                size="icon-sm"
                variant={isCompared ? "compared" : "compare"}
                className="rounded-full"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onCompare(apartment.id);
                }}
                aria-label={isCompared ? '비교 제거' : '비교 추가'}
              >
                <GitCompare className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}
