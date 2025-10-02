'use client';

import { useState, useEffect, Suspense, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { SearchBar } from '@/components/SearchBar';
import { ResultsList } from '@/components/ResultsList';
import { Button } from '@/components/ui/button-enhanced';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Filter, Grid, List, SlidersHorizontal } from 'lucide-react';
import { facilities } from '@/data/dummy-apartments';
import { Apartment, SearchFilters } from '@/types/apartment';
import { realApartmentService, SearchResponse } from '@/services/realApartmentService';
import { convertToApartments } from '@/lib/apartment-conversion';

function SearchPageContent() {
  const searchParams = useSearchParams();

  // State management following the data flow pattern:
  // User input -> state updates -> service calls -> results rendering
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const [filters, setFilters] = useState<SearchFilters>({
    query: searchParams?.get('q') || '',
    region: searchParams?.get('region') || '',
    buildYearRange: [2000, 2025],
    priceRange: [10000000, 10000000000],
    areaRange: [40, 200],
    facilities: [],
    dealType: 'all',
    page: 1,
    limit: 20,
    sortBy: 'newest'
  });
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'newest' | 'price-low' | 'price-high' | 'area'>('newest');

  /**
   * Data Flow Step 1: User enters query -> onChange handler updates state
   * Data Flow Step 2: onSubmit calls this function -> calls apartmentService.search()
   * Data Flow Step 3: Service returns Promise of data -> updates React state
   * Data Flow Step 4: State change triggers re-render with new results
   */
  const handleSearch = async (query: string) => {
    const updatedFilters = { ...filters, query };
    setFilters(updatedFilters);
    await performSearch(updatedFilters);
  };

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    const updatedFilters = { ...filters, [key]: value, page: 1 }; // Reset to page 1 when filters change
    setFilters(updatedFilters);
    setCurrentPage(1);
    performSearch(updatedFilters);
  };

  /**
   * Core search function that calls the real estate API service
   * Handles loading states and error handling
   */
  const performSearch = async (searchFilters: SearchFilters, isLoadMore = false) => {
    try {
      console.log('performSearch 호출됨:', searchFilters);
      if (isLoadMore) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      // Call real estate API service
      const response: SearchResponse = await realApartmentService.search(searchFilters.query, searchFilters);

      // Convert IntegratedApartmentData to Apartment type using utility
      const convertedApartments = convertToApartments(response.apartments);

      // Update state with results
      if (isLoadMore) {
        setApartments(prev => [...prev, ...convertedApartments]);
      } else {
        setApartments(convertedApartments);
      }
      setTotalCount(response.totalCount);
      setHasMore(response.hasMore);
      setCurrentPage(response.currentPage);
    } catch (err) {
      setError('아파트 검색 중 오류가 발생했습니다. 다시 시도해주세요.');
      console.error('Real estate API search error:', err);
    } finally {
      if (isLoadMore) {
        setIsLoadingMore(false);
      } else {
        setIsLoading(false);
      }
    }
  };

  // Load initial results on component mount
  useEffect(() => {
    performSearch(filters);
  }, []); // Only run on mount - performSearch uses current filters state

  // Handle sort changes - update filters and re-search
  const handleSortChange = (newSortBy: string) => {
    setSortBy(newSortBy as 'newest' | 'price-low' | 'price-high' | 'area');
    const updatedFilters = { ...filters, sortBy: newSortBy, page: 1 };
    setFilters(updatedFilters);
    setCurrentPage(1);
    performSearch(updatedFilters);
  };

  // Load more results for infinite scroll
  const loadMoreResults = useCallback(() => {
    if (!hasMore || isLoadingMore || isLoading) return;
    
    const nextPage = currentPage + 1;
    const updatedFilters = { ...filters, page: nextPage };
    setFilters(updatedFilters);
    setCurrentPage(nextPage);
    performSearch(updatedFilters, true);
  }, [hasMore, isLoadingMore, isLoading, currentPage, filters]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore && !isLoading) {
          loadMoreResults();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loadMoreResults, hasMore, isLoadingMore, isLoading]);

  // Use apartments directly since sorting is handled by the service
  const sortedApartments = apartments;

  const FilterPanel = () => (
    <div className="space-y-6">
      {/* Price Range */}
      <div className="space-y-3">
        <h3 className="font-semibold text-body1">매매가격 (억원)</h3>
        <Slider
          value={[filters.priceRange![0] / 100000000, filters.priceRange![1] / 100000000]}
          onValueChange={([min, max]) =>
            handleFilterChange('priceRange', [min * 100000000, max * 100000000])
          }
          max={30}
          min={0.5}
          step={0.5}
          className="w-full"
        />
        <div className="flex justify-between text-body2 text-muted-foreground">
          <span>{(filters.priceRange![0] / 100000000).toFixed(1)}억</span>
          <span>{(filters.priceRange![1] / 100000000).toFixed(1)}억</span>
        </div>
      </div>

      {/* Deal Type */}
      <div className="space-y-3">
        <h3 className="font-semibold text-body1">매매방식</h3>
        <Select value={filters.dealType} onValueChange={(value) => handleFilterChange('dealType', value)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="매매방식 선택" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체</SelectItem>
            <SelectItem value="sale">매매</SelectItem>
            <SelectItem value="lease">전세</SelectItem>
            <SelectItem value="rent">월세</SelectItem>
            <SelectItem value="short-term">단기임대</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Build Year Range */}
      <div className="space-y-3">
        <h3 className="font-semibold text-body1">건축년도</h3>
        <Slider
          value={filters.buildYearRange!}
          onValueChange={(value) => handleFilterChange('buildYearRange', value)}
          max={2025}
          min={1990}
          step={1}
          className="w-full"
        />
        <div className="flex justify-between text-body2 text-muted-foreground">
          <span>{filters.buildYearRange![0]}년</span>
          <span>{filters.buildYearRange![1]}년</span>
        </div>
      </div>

      {/* Area Range */}
      <div className="space-y-3">
        <h3 className="font-semibold text-body1">전용면적 (㎡)</h3>
        <Slider
          value={filters.areaRange!}
          onValueChange={(value) => handleFilterChange('areaRange', value)}
          max={300}
          min={20}
          step={10}
          className="w-full"
        />
        <div className="flex justify-between text-body2 text-muted-foreground">
          <span>{filters.areaRange![0]}㎡</span>
          <span>{filters.areaRange![1]}㎡</span>
        </div>
      </div>

      {/* Facilities */}
      <div className="space-y-3">
        <h3 className="font-semibold text-body1">편의시설</h3>
        <div className="grid grid-cols-1 gap-2">
          {facilities.slice(0, 8).map((facility) => (
            <div key={facility.id} className="flex items-center space-x-2">
              <Checkbox
                id={facility.id}
                checked={filters.facilities?.includes(facility.name) || false}
                onCheckedChange={(checked) => {
                  const currentFacilities = filters.facilities || [];
                  if (checked) {
                    handleFilterChange('facilities', [...currentFacilities, facility.name]);
                  } else {
                    handleFilterChange('facilities',
                      currentFacilities.filter(f => f !== facility.name)
                    );
                  }
                }}
              />
              <label htmlFor={facility.id} className="text-body2 text-foreground cursor-pointer">
                {facility.name}
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="container px-4 py-6 sm:py-8">
      <div className="space-y-4 sm:space-y-6">
        {/* Search Header */}
        <div className="space-y-4">
          <div className="flex flex-col lg:flex-row gap-3 lg:gap-4">
            <div className="flex-1">
              <SearchBar
                onSearch={handleSearch}
                placeholder="아파트명 또는 지역을 검색하세요"
                showFilter={false}
              />
            </div>
            <div className="flex items-center gap-2 justify-between sm:justify-end">
              <Select value={sortBy} onValueChange={handleSortChange}>
                <SelectTrigger className="w-28 sm:w-32" aria-label="정렬 방식 선택">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">최신순</SelectItem>
                  <SelectItem value="price-low">가격 낮은순</SelectItem>
                  <SelectItem value="price-high">가격 높은순</SelectItem>
                  <SelectItem value="area">면적순</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex border rounded-md" role="group" aria-label="보기 방식 선택">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="icon-sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-r-none focus-outline"
                  aria-label="격자 보기"
                  aria-pressed={viewMode === 'grid'}
                >
                  <Grid className="h-4 w-4" aria-hidden="true" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="icon-sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-l-none focus-outline"
                  aria-label="목록 보기"
                  aria-pressed={viewMode === 'list'}
                >
                  <List className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm sm:text-body1 font-semibold" role="status" aria-live="polite">
                {isLoading ? '검색 중...' : `검색결과 ${totalCount}개 (${sortedApartments.length}개 표시)`}
              </span>
              {filters.query && (
                <Badge variant="secondary">&ldquo;{filters.query}&rdquo;</Badge>
              )}
              {filters.region && (
                <Badge variant="secondary">{filters.region}</Badge>
              )}
            </div>

            {/* Mobile Filter Button */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="filter" size="sm" icon={<SlidersHorizontal className="h-4 w-4" />} className="lg:hidden">
                  필터
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80">
                <SheetHeader>
                  <SheetTitle>검색 필터</SheetTitle>
                </SheetHeader>
                <div className="mt-6">
                  <FilterPanel />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
          {/* Desktop Filter Panel */}
          <aside className="hidden lg:block w-80 flex-shrink-0">
            <Card>
              <CardContent className="p-4 lg:p-6">
                <div className="flex items-center gap-2 mb-4 lg:mb-6">
                  <Filter className="h-5 w-5" aria-hidden="true" />
                  <h2 className="font-semibold text-h6">검색 필터</h2>
                </div>
                <FilterPanel />
              </CardContent>
            </Card>
          </aside>

          {/* Results - Using ResultsList component for proper state management */}
          <section className="flex-1 min-w-0" aria-label="검색 결과">
            <ResultsList
              apartments={sortedApartments}
              isLoading={isLoading}
              error={error}
              onBookmark={(id) => console.log('Bookmark:', id)}
              onCompare={(id) => console.log('Compare:', id)}
              bookmarkedIds={[]}
              comparedIds={[]}
            />
            
            {/* Infinite Scroll Loading Trigger */}
            {hasMore && !error && (
              <div ref={loadMoreRef} className="mt-8 flex justify-center">
                {isLoadingMore && (
                  <div className="text-center py-4">
                    <div className="inline-flex items-center gap-2 text-muted-foreground">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent"></div>
                      더 많은 결과를 불러오는 중...
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* End of Results Message */}
            {!hasMore && apartments.length > 0 && !isLoading && (
              <div className="mt-8 text-center py-4 text-muted-foreground">
                모든 검색 결과를 확인했습니다.
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="container px-4 py-8"><div className="text-center">Loading...</div></div>}>
      <SearchPageContent />
    </Suspense>
  );
}