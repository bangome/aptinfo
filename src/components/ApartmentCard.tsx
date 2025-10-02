'use client';

import { ApartmentCardWrapper, CardContent, CardFooter } from '@/components/ui/card-enhanced';
import { Button } from '@/components/ui/button-enhanced';
import { Badge } from '@/components/ui/badge';
import { Heart, GitCompare, Calendar, Users, Car, MapPin } from 'lucide-react';
import { Apartment } from '@/types/apartment';
import Link from 'next/link';
import { formatPrice, formatArea, formatNumber } from '@/lib/apartment-utils';
import { PriceRangeDisplay } from '@/components/PriceRangeDisplay';
import { useApartmentPriceRange } from '@/hooks/use-apartment-price-range';

interface ApartmentCardProps {
  apartment: Apartment;
  onBookmark?: (apartmentId: string) => void;
  onCompare?: (apartmentId: string) => void;
  isBookmarked?: boolean;
  isCompared?: boolean;
}

export function ApartmentCard({
  apartment,
  onBookmark,
  onCompare,
  isBookmarked = false,
  isCompared = false
}: ApartmentCardProps) {
  
  // 실거래가 데이터 조회
  const { data: priceData, isLoading: priceLoading } = useApartmentPriceRange(
    apartment.name,
    { recentMonths: 12, enabled: true }
  );


  return (
    <ApartmentCardWrapper
      className="overflow-hidden group"
      role="article"
      aria-labelledby={`apartment-title-${apartment.id}`}
    >
      {/* Header with action buttons */}
      <div className="relative p-4 pb-0">
        {/* Bookmark and Compare buttons */}
        <div className="absolute top-2 right-2 flex gap-1" role="toolbar" aria-label="아파트 액션">
          {onBookmark && (
            <Button
              size="icon-sm"
              variant={isBookmarked ? "bookmarked" : "bookmark"}
              className="rounded-full bg-white/90 hover:bg-white shadow-sm focus-outline"
              onClick={(e) => {
                e.preventDefault();
                onBookmark(apartment.id);
              }}
              aria-label={isBookmarked ? `${apartment.name} 북마크 해제` : `${apartment.name} 북마크 추가`}
              aria-pressed={isBookmarked}
            >
              <Heart className="h-4 w-4" aria-hidden="true" />
              <span className="sr-only">
                {isBookmarked ? '북마크됨' : '북마크 추가'}
              </span>
            </Button>
          )}
          {onCompare && (
            <Button
              size="icon-sm"
              variant={isCompared ? "compared" : "compare"}
              className="rounded-full bg-white/90 hover:bg-white shadow-sm focus-outline"
              onClick={(e) => {
                e.preventDefault();
                onCompare(apartment.id);
              }}
              aria-label={isCompared ? `${apartment.name} 비교에서 제거` : `${apartment.name} 비교에 추가`}
              aria-pressed={isCompared}
            >
              <GitCompare className="h-4 w-4" aria-hidden="true" />
              <span className="sr-only">
                {isCompared ? '비교 목록에 있음' : '비교에 추가'}
              </span>
            </Button>
          )}
        </div>

        {/* Approval Date Badge */}
        {apartment.formattedApprovalDate && (
          <div className="mb-2">
            <Badge variant="outline" className="text-foreground bg-background border-border">
              <Calendar className="h-3 w-3 mr-1" aria-hidden="true" />
              {apartment.formattedApprovalDate}
            </Badge>
          </div>
        )}
      </div>

      <CardContent className="p-4">
        <Link href={`/apartments/${apartment.kaptCode}`}>
          <div className="space-y-3">
            <div>
              <h3
                id={`apartment-title-${apartment.id}`}
                className="font-semibold text-h5 text-foreground hover:text-primary transition-colors"
              >
                {apartment.name}
              </h3>
              <p className="text-body2 text-muted-foreground flex items-center mt-1">
                <MapPin className="h-3 w-3 mr-1" aria-hidden="true" />
                <span className="sr-only">주소: </span>
                {apartment.address}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-body2">
              <div className="flex items-center text-muted-foreground">
                <Users className="h-3 w-3 mr-1" aria-hidden="true" />
                <span className="sr-only">세대수: </span>
                {formatNumber(apartment.units)}세대
              </div>
              <div className="flex items-center text-muted-foreground">
                <Car className="h-3 w-3 mr-1" aria-hidden="true" />
                <span className="sr-only">주차 가능 대수: </span>
                {formatNumber(
                  typeof apartment.parking === 'number'
                    ? apartment.parking
                    : (apartment.parking?.total || 0)
                )}대
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-body2 text-muted-foreground">
                전용면적 {formatArea(apartment.area.exclusive)}
              </div>
              
              {/* 실거래가 범위 표시 */}
              <PriceRangeDisplay 
                priceData={priceData} 
                isLoading={priceLoading}
                compact={true}
                className="border-t pt-2"
              />
              
              {/* 평균 가격 표시 (매매/전세) */}
              {priceData?.hasData && (
                <div className="text-xs text-muted-foreground border-t pt-2">
                  <div className="text-body2 text-muted-foreground mb-1">평균 가격:</div>
                  {priceData.summary.trade && (
                    <div className="text-body2">
                      매매 {formatNumber(priceData.summary.trade.average)}만원
                    </div>
                  )}
                  {priceData.summary.rentDeposit && (
                    <div className="text-body2">
                      전세 {formatNumber(priceData.summary.rentDeposit.average)}만원
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </Link>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <div className="flex flex-wrap gap-1">
          {(() => {
            // 표시할 시설 필터링 및 정리
            const filteredFacilities = apartment.facilities
              .filter(facility => {
                if (!facility || typeof facility !== 'string') return false;
                
                // 괄호 정리
                const cleanFacility = facility
                  .replace(/[)\]}>]+$/, '')  // 끝의 괄호 제거
                  .replace(/^[(\[{<]+/, '')  // 시작의 괄호 제거
                  .trim();
                
                // 불필요한 키워드 필터링
                const unwanted = [
                  '한국전력공사', '전력공사', '행정구역', '법정동', '지번', '우편번호',
                  '관공서(', '병원(', '공원(', '대형상가(', '기타(', '카테고리',
                  '정보없음', '미상', '없음'
                ];
                
                const isUnwanted = unwanted.some(keyword => 
                  cleanFacility.includes(keyword) || facility.includes(keyword)
                );
                
                return !isUnwanted && cleanFacility.length > 2;
              })
              .map(facility => {
                // 최종 정리
                return facility
                  .replace(/[)\]}>]+$/, '')
                  .replace(/^[(\[{<]+/, '')
                  .trim();
              })
              .filter(facility => facility.length > 0)
              .slice(0, 3); // 처음 3개만
            
            return (
              <>
                {filteredFacilities.map((facility, index) => (
                  <Badge key={`${facility}-${index}`} variant="outline" className="text-xs">
                    {facility}
                  </Badge>
                ))}
                {apartment.facilities.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{Math.max(0, apartment.facilities.length - 3)}
                  </Badge>
                )}
              </>
            );
          })()}
        </div>
      </CardFooter>
    </ApartmentCardWrapper>
  );
}