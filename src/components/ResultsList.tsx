/**
 * ResultsList Component
 *
 * Displays apartment search results in a responsive grid layout.
 * Handles loading states, empty states, and maps apartment data to cards.
 */

'use client';

import { useMemo } from 'react';
import { ApartmentCard } from './ApartmentCard';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Building2 } from 'lucide-react';
import { Apartment } from '@/types/apartment';

interface ResultsListProps {
  apartments: Apartment[];
  isLoading: boolean;
  error?: string | null;
  onBookmark?: (apartmentId: string) => void;
  onCompare?: (apartmentId: string) => void;
  bookmarkedIds?: string[];
  comparedIds?: string[];
  className?: string;
}

/**
 * Loading skeleton for apartment cards
 */
const ApartmentCardSkeleton = () => (
  <Card className="overflow-hidden">
    <div className="space-y-4">
      <Skeleton className="h-48 w-full" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <div className="grid grid-cols-2 gap-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-6 w-2/3" />
        </div>
      </div>
    </div>
  </Card>
);

/**
 * Empty state component when no results found
 */
const EmptyState = () => (
  <Card>
    <CardContent className="p-12 text-center">
      <div className="space-y-4">
        <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
          <Building2 className="h-8 w-8 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <h3 className="text-h5 font-semibold text-foreground">
            검색 결과가 없습니다
          </h3>
          <p className="text-body2 text-muted-foreground">
            검색 조건을 변경하거나 다른 키워드로 다시 검색해보세요.
          </p>
        </div>
      </div>
    </CardContent>
  </Card>
);

/**
 * Error state component
 */
const ErrorState = ({ error }: { error: string }) => (
  <Card className="border-destructive/50">
    <CardContent className="p-12 text-center">
      <div className="space-y-4">
        <div className="w-16 h-16 mx-auto bg-destructive/10 rounded-full flex items-center justify-center">
          <Building2 className="h-8 w-8 text-destructive" />
        </div>
        <div className="space-y-2">
          <h3 className="text-h5 font-semibold text-foreground">
            오류가 발생했습니다
          </h3>
          <p className="text-body2 text-muted-foreground">
            {error}
          </p>
        </div>
      </div>
    </CardContent>
  </Card>
);

export function ResultsList({
  apartments,
  isLoading,
  error,
  onBookmark,
  onCompare,
  bookmarkedIds = [],
  comparedIds = [],
  className = ''
}: ResultsListProps) {
  // Show error state
  if (error) {
    return (
      <div className={className}>
        <ErrorState error={error} />
      </div>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
        {Array.from({ length: 6 }).map((_, index) => (
          <ApartmentCardSkeleton key={`skeleton-${index}`} />
        ))}
      </div>
    );
  }

  // Show empty state
  if (!apartments || apartments.length === 0) {
    return (
      <div className={className}>
        <EmptyState />
      </div>
    );
  }

  // 중복 제거 (useMemo로 성능 최적화)
  const uniqueApartments = useMemo(() => 
    apartments.filter((apt, index, arr) => 
      arr.findIndex(a => a.id === apt.id) === index
    ), [apartments]
  );

  // Show results
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
      {uniqueApartments.map((apartment, index) => (
        <ApartmentCard
          key={`${apartment.id}-${index}`}
          apartment={apartment}
          onBookmark={onBookmark}
          onCompare={onCompare}
          isBookmarked={bookmarkedIds.includes(apartment.id)}
          isCompared={comparedIds.includes(apartment.id)}
        />
      ))}
    </div>
  );
}