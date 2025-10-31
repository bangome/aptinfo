'use client';

import { useState, useEffect, Suspense, useCallback, useRef, useMemo } from 'react';
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
import { getSidos, getSiguguns } from '@/data/korea-regions';

const BATCH_SIZE = 18; // 한 번에 추가로 로드할 아이템 수

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
    sido: '',
    sigungu: '',
    buildYearRange: [2000, 2025],
    priceRange: [10000000, 10000000000],
    areaRange: [40, 200],
    facilities: [],
    dealType: 'all',
    page: 1,
    limit: 18,
    sortBy: 'newest'
  });

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'newest' | 'price-low' | 'price-high' | 'area'>('newest');

  // 새로운 필터 state
  const [selectedSido, setSelectedSido] = useState<string>('');
  const [selectedSigugun, setSelectedSigugun] = useState<string>('');
  const [unitsRange, setUnitsRange] = useState<[number, number]>([0, 3000]);
  const [parkingRange, setParkingRange] = useState<[number, number]>([0, 5000]);
  const [exclusiveAreaRange, setExclusiveAreaRange] = useState<[number, number]>([40, 200]);

  // 디바운싱을 위한 임시 state
  const [tempUnitsRange, setTempUnitsRange] = useState<[number, number]>([0, 3000]);
  const [tempParkingRange, setTempParkingRange] = useState<[number, number]>([0, 5000]);
  const [tempExclusiveAreaRange, setTempExclusiveAreaRange] = useState<[number, number]>([40, 200]);

  // 프로그레시브 렌더링을 위한 state (한 번에 표시할 결과 수)
  const [displayedCount, setDisplayedCount] = useState<number>(BATCH_SIZE);

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

  // 클라이언트 필터가 활성화되어 있는지 확인 (세대수, 주차, 면적만)
  const hasActiveClientFilters = useMemo(() => {
    return !!(unitsRange[0] !== 0 || unitsRange[1] !== 3000 ||
              parkingRange[0] !== 0 || parkingRange[1] !== 5000 ||
              exclusiveAreaRange[0] !== 40 || exclusiveAreaRange[1] !== 200);
  }, [unitsRange, parkingRange, exclusiveAreaRange]);

  // Load more results for infinite scroll (서버 페이지네이션)
  const loadMoreResults = useCallback(() => {
    // 클라이언트 필터가 활성화되어 있으면 서버 페이지네이션 중단
    if (hasActiveClientFilters) return;
    if (!hasMore || isLoadingMore || isLoading) return;

    const nextPage = currentPage + 1;
    const updatedFilters = { ...filters, page: nextPage };
    setFilters(updatedFilters);
    setCurrentPage(nextPage);
    performSearch(updatedFilters, true);
  }, [hasMore, isLoadingMore, isLoading, currentPage, filters, hasActiveClientFilters]);

  // Intersection Observer for infinite scroll (서버 페이지네이션)
  useEffect(() => {
    // 클라이언트 필터가 활성화되어 있으면 서버 인피니티 스크롤 비활성화
    if (hasActiveClientFilters) {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      return;
    }

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
  }, [loadMoreResults, hasMore, isLoadingMore, isLoading, hasActiveClientFilters]);

  // 클라이언트 사이드 필터링 (세대수, 주차, 면적만 - 시도/시군구는 서버에서 처리)
  const filteredApartments = useMemo(() => {
    console.log('🔍 클라이언트 필터링 시작:', {
      총아파트수: apartments.length,
      unitsRange,
      parkingRange,
      exclusiveAreaRange
    });

    const filtered = apartments.filter(apartment => {
      // 시도/시군구는 서버에서 이미 필터링됨 - 제거!

      // 세대수 필터
      if (apartment.units) {
        if (apartment.units < unitsRange[0] || apartment.units > unitsRange[1]) {
          return false;
        }
      }

      // 주차대수 필터
      const parkingCount = typeof apartment.parking === 'number'
        ? apartment.parking
        : apartment.parking?.total || 0;
      if (parkingCount < parkingRange[0] || parkingCount > parkingRange[1]) {
        return false;
      }

      // 전용면적 필터
      if (apartment.area?.exclusive) {
        if (apartment.area.exclusive < exclusiveAreaRange[0] ||
            apartment.area.exclusive > exclusiveAreaRange[1]) {
          return false;
        }
      }

      return true;
    });

    console.log('✅ 클라이언트 필터링 완료:', {
      필터전: apartments.length,
      필터후: filtered.length
    });

    return filtered;
  }, [apartments, unitsRange, parkingRange, exclusiveAreaRange]);

  // 프로그레시브 렌더링: 클라이언트 필터가 있을 때만 적용, 서버 페이지네이션일 때는 모든 결과 표시
  const displayedApartments = useMemo(() => {
    if (hasActiveClientFilters) {
      // 클라이언트 필터 활성화: 프로그레시브 렌더링
      return filteredApartments.slice(0, displayedCount);
    } else {
      // 서버 페이지네이션: 모든 로드된 아파트 표시
      return filteredApartments;
    }
  }, [filteredApartments, displayedCount, hasActiveClientFilters]);

  // 더 표시할 결과가 있는지 확인
  const hasMoreFiltered = hasActiveClientFilters && displayedCount < filteredApartments.length;

  // 시도 변경 시 시군구 초기화 및 서버 필터 업데이트
  const handleSidoChange = useCallback((sido: string) => {
    setSelectedSido(sido);
    setSelectedSigugun(''); // 시도 변경 시 시군구 초기화

    // 서버 사이드 필터 업데이트
    const updatedFilters = { ...filters, sido, sigungu: '', page: 1 };
    setFilters(updatedFilters);
    setCurrentPage(1);
    performSearch(updatedFilters);
  }, [filters]);

  // 클라이언트 필터 변경 시에만 표시 카운트 리셋 (서버 페이지네이션 시에는 리셋 안함)
  useEffect(() => {
    // 클라이언트 필터가 활성화되었을 때만 리셋
    if (hasActiveClientFilters) {
      setDisplayedCount(BATCH_SIZE);
    }
  }, [unitsRange, parkingRange, exclusiveAreaRange]);

  // 더 많은 필터링된 결과 로드
  const loadMoreFilteredResults = useCallback(() => {
    if (!hasMoreFiltered) return;
    setDisplayedCount(prev => prev + BATCH_SIZE);
  }, [hasMoreFiltered]);

  // Intersection Observer for filtered results infinite scroll
  const filteredLoadMoreRef = useRef<HTMLDivElement | null>(null);
  const filteredObserverRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (filteredObserverRef.current) {
      filteredObserverRef.current.disconnect();
    }

    filteredObserverRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMoreFiltered && !isLoading && !isLoadingMore) {
          loadMoreFilteredResults();
        }
      },
      { threshold: 0.1 }
    );

    if (filteredLoadMoreRef.current) {
      filteredObserverRef.current.observe(filteredLoadMoreRef.current);
    }

    return () => {
      if (filteredObserverRef.current) {
        filteredObserverRef.current.disconnect();
      }
    };
  }, [loadMoreFilteredResults, hasMoreFiltered, isLoading, isLoadingMore]);

  // 디바운싱: 슬라이더 값이 변경된 후 500ms 후에 실제 필터 적용
  useEffect(() => {
    const timer = setTimeout(() => {
      setUnitsRange(tempUnitsRange);
    }, 500);
    return () => clearTimeout(timer);
  }, [tempUnitsRange]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setParkingRange(tempParkingRange);
    }, 500);
    return () => clearTimeout(timer);
  }, [tempParkingRange]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setExclusiveAreaRange(tempExclusiveAreaRange);
    }, 500);
    return () => clearTimeout(timer);
  }, [tempExclusiveAreaRange]);

  // 핸들러 메모이제이션 (임시 값 업데이트)
  const handleUnitsChange = useCallback((value: number[]) => {
    setTempUnitsRange(value as [number, number]);
  }, []);

  const handleParkingChange = useCallback((value: number[]) => {
    setTempParkingRange(value as [number, number]);
  }, []);

  const handleAreaChange = useCallback((value: number[]) => {
    setTempExclusiveAreaRange(value as [number, number]);
  }, []);

  const FilterPanel = useMemo(() => {
    const sidos = getSidos();
    const siguguns = selectedSido ? getSiguguns(selectedSido) : [];

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* 시도 */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">시도</label>
          <Select value={selectedSido || 'all'} onValueChange={(value) => handleSidoChange(value === 'all' ? '' : value)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="시도 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              {sidos.map((sido) => (
                <SelectItem key={sido} value={sido}>{sido}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 시군구 */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">시군구</label>
          <Select
            value={selectedSigugun || 'all'}
            onValueChange={(value) => {
              const newSigugun = value === 'all' ? '' : value;
              setSelectedSigugun(newSigugun);
              // 서버 사이드 필터 업데이트
              const updatedFilters = { ...filters, sigungu: newSigugun, page: 1 };
              setFilters(updatedFilters);
              setCurrentPage(1);
              performSearch(updatedFilters);
            }}
            disabled={!selectedSido}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="시군구 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              {siguguns.map((sigugun) => (
                <SelectItem key={sigugun} value={sigugun}>{sigugun}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 세대수 */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">
            세대수: {tempUnitsRange[0]} ~ {tempUnitsRange[1] >= 3000 ? '3000+' : tempUnitsRange[1]}
          </label>
          <Slider
            value={tempUnitsRange}
            onValueChange={handleUnitsChange}
            max={3000}
            min={0}
            step={50}
            className="w-full"
          />
        </div>

        {/* 주차대수 */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">
            주차: {tempParkingRange[0]} ~ {tempParkingRange[1] >= 5000 ? '5000+' : tempParkingRange[1]}대
          </label>
          <Slider
            value={tempParkingRange}
            onValueChange={handleParkingChange}
            max={5000}
            min={0}
            step={50}
            className="w-full"
          />
        </div>

        {/* 전용면적 */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">
            면적: {tempExclusiveAreaRange[0]} ~ {tempExclusiveAreaRange[1]}㎡
          </label>
          <Slider
            value={tempExclusiveAreaRange}
            onValueChange={handleAreaChange}
            max={300}
            min={20}
            step={10}
            className="w-full"
          />
        </div>
      </div>
    );
  }, [selectedSido, selectedSigugun, tempUnitsRange, tempParkingRange, tempExclusiveAreaRange, handleSidoChange, handleUnitsChange, handleParkingChange, handleAreaChange]);

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
        </div>

        {/* Filter Panel - 상단에 배치 */}
        <Card>
          <CardContent className="p-4 lg:p-6">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="h-5 w-5" aria-hidden="true" />
              <h2 className="font-semibold text-h6">검색 필터</h2>
            </div>
            {FilterPanel}
          </CardContent>
        </Card>

        {/* Search Results Info */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm sm:text-body1 font-semibold" role="status" aria-live="polite">
            {isLoading ? '검색 중...' : `검색결과 ${filteredApartments.length}개+${apartments.length !== filteredApartments.length ? ` (전체 ${apartments.length}개+ 중)` : ''}`}
          </span>
          {filters.query && (
            <Badge variant="secondary">&ldquo;{filters.query}&rdquo;</Badge>
          )}
          {selectedSido && (
            <Badge variant="secondary">{selectedSido}</Badge>
          )}
          {selectedSigugun && (
            <Badge variant="secondary">{selectedSigugun}</Badge>
          )}
        </div>

        {/* Results - Using ResultsList component for proper state management */}
        <section className="w-full" aria-label="검색 결과">
          <ResultsList
            apartments={displayedApartments}
            isLoading={isLoading}
            error={error}
            onBookmark={(id) => console.log('Bookmark:', id)}
            onCompare={(id) => console.log('Compare:', id)}
            bookmarkedIds={[]}
            comparedIds={[]}
            viewMode={viewMode}
          />

          {/* Infinite Scroll Loading Trigger - Server Data (클라이언트 필터가 없을 때만) */}
          {hasMore && !error && !hasActiveClientFilters && (
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

          {/* Infinite Scroll Loading Trigger - Filtered Results (클라이언트 필터가 있을 때) */}
          {hasMoreFiltered && !error && hasActiveClientFilters && (
            <div ref={filteredLoadMoreRef} className="mt-8 flex justify-center">
              <div className="text-center py-4">
                <div className="inline-flex items-center gap-2 text-muted-foreground">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent"></div>
                  더 많은 결과를 표시하는 중...
                </div>
              </div>
            </div>
          )}

          {/* End of Results Message */}
          {!hasMore && !hasMoreFiltered && apartments.length > 0 && !isLoading && (
            <div className="mt-8 text-center py-4 text-muted-foreground">
              모든 검색 결과를 확인했습니다.
            </div>
          )}
        </section>
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