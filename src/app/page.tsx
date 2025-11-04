'use client';

import { Button } from '@/components/ui/button-enhanced';
import { Card, CardContent, FeatureCard } from '@/components/ui/card-enhanced';
import { Badge } from '@/components/ui/badge';
import { SearchBar } from '@/components/SearchBar';
import { ApartmentCard } from '@/components/ApartmentCard';
import { Building2, MapPin, TrendingUp, Shield, Star, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { realApartmentService } from '@/services/realApartmentService';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { Apartment } from '@/types/apartment';
import { formatPrice } from '@/lib/apartment-utils';
import { convertToApartments } from '@/lib/apartment-conversion';

interface PopularArea {
  id: string;
  name: string;
  count: number;
  averagePrice: number;
  image: string;
}

export default function Home() {
  const router = useRouter();
  const [recentApartments, setRecentApartments] = useState<Apartment[]>([]);
  const [popularAreas, setPopularAreas] = useState<PopularArea[]>([]);
  const [isLoadingAreas, setIsLoadingAreas] = useState(true);
  const [isLoadingRecent, setIsLoadingRecent] = useState(true);

  // Load popular areas
  useEffect(() => {
    const loadPopularAreas = async () => {
      try {
        setIsLoadingAreas(true);
        const areas = await realApartmentService.getPopularAreas(6);
        setPopularAreas(areas);
      } catch (error) {
        console.error('Failed to load popular areas:', error);
        // Fallback to empty array
        setPopularAreas([]);
      } finally {
        setIsLoadingAreas(false);
      }
    };

    loadPopularAreas();
  }, []);

  // Load recent apartments
  useEffect(() => {
    const loadRecentApartments = async () => {
      try {
        setIsLoadingRecent(true);
        const recentData = await realApartmentService.getRecentDeals(3);
        const convertedApartments = convertToApartments(recentData);
        setRecentApartments(convertedApartments);
      } catch (error) {
        console.error('Failed to load recent apartments:', error);
        // Fallback to empty array
        setRecentApartments([]);
      } finally {
        setIsLoadingRecent(false);
      }
    };

    loadRecentApartments();
  }, []);

  const handleSearch = (query: string) => {
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  const handleAreaClick = (areaName: string) => {
    // sido 필터를 사용하여 검색
    router.push(`/search?sido=${encodeURIComponent(areaName)}`);
  };

  // 지역명 약칭 매핑
  const getRegionShortName = (fullName: string): string => {
    const shortNames: Record<string, string> = {
      '경상남도': '경남',
      '경상북도': '경북',
      '전라남도': '전남',
      '전라북도': '전북',
      '전북특별자치도': '전북',
      '충청남도': '충남',
      '충청북도': '충북',
      '강원특별자치도': '강원',
      '제주특별자치도': '제주',
      '세종특별자치시': '세종',
    };
    return shortNames[fullName] || fullName.substring(0, 2);
  };


  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/5 via-background to-accent/5 py-12 sm:py-16 lg:py-20">
        <div className="container px-4">
          <div className="max-w-4xl mx-auto text-center space-y-6 sm:space-y-8">
            <div className="space-y-4">
              <h1 className="text-2xl sm:text-h1 lg:text-4xl xl:text-5xl font-bold tracking-tight text-foreground">
                전국 아파트 정보를
                <br className="hidden sm:block" />
                <span className="text-primary">한눈에</span> 비교하세요
              </h1>
              <p className="text-sm sm:text-h6 lg:text-xl text-muted-foreground max-w-2xl mx-auto px-4 sm:px-0">
                복잡한 부동산 정보를 쉽게 검색하고, 전문 용어는 친절한 설명으로
                <br className="hidden lg:block" />
                누구나 쉽게 이해할 수 있습니다
              </p>
            </div>

            <div className="max-w-2xl mx-auto">
              <SearchBar
                onSearch={handleSearch}
                placeholder="찾고 계신 아파트나 지역을 검색해보세요"
                showFilter={false}
                className="shadow-lg"
              />
            </div>

            <div className="flex flex-wrap justify-center gap-2 px-4 sm:px-0">
              <Badge variant="secondary" className="text-xs sm:text-body2">
                검색 3초 내 결과
              </Badge>
              <Badge variant="secondary" className="text-xs sm:text-body2">
                전국 아파트 정보
              </Badge>
              <Badge variant="secondary" className="text-xs sm:text-body2">
                용어 친절 설명
              </Badge>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Areas */}
      <section className="container px-4">
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-h2 font-bold text-foreground">인기 지역</h2>
            <p className="text-body1 text-muted-foreground">
              많이 찾는 지역의 아파트를 먼저 확인해보세요
            </p>
          </div>

          {isLoadingAreas ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-4">
              {Array.from({ length: 6 }).map((_, index) => (
                <Card key={index} className="animate-pulse">
                  <CardContent className="p-4 text-center space-y-3">
                    <div className="h-16 w-16 mx-auto bg-muted rounded-lg" />
                    <div className="space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4 mx-auto" />
                      <div className="h-3 bg-muted rounded w-1/2 mx-auto" />
                      <div className="h-3 bg-muted rounded w-2/3 mx-auto" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : popularAreas.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-4">
              {popularAreas.map((area) => (
                <Card
                  key={area.id}
                  className="cursor-pointer hover:shadow-md transition-all duration-200 group"
                  onClick={() => handleAreaClick(area.name)}
                >
                  <CardContent className="p-4 text-center space-y-3">
                    <div className="h-16 w-16 mx-auto rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center group-hover:from-primary/30 group-hover:to-primary/20 transition-all duration-200">
                      <span className="text-2xl font-bold text-primary">
                        {getRegionShortName(area.name)}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-body1 text-foreground">
                        {area.name}
                      </h3>
                      <p className="text-body2 text-muted-foreground">
                        {area.count.toLocaleString()}개 단지
                      </p>
                      {area.averagePrice > 0 && (
                        <p className="text-caption font-medium text-primary">
                          평균 {formatPrice(area.averagePrice)}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">인기 지역 정보를 불러올 수 없습니다.</p>
            </div>
          )}
        </div>
      </section>

      {/* Recent Listings */}
      <section className="container px-4">
        <div className="space-y-8">
          <div className="flex justify-between items-center">
            <div className="space-y-2">
              <h2 className="text-h2 font-bold text-foreground">최신 등록 아파트</h2>
              <p className="text-body1 text-muted-foreground">
                방금 업데이트된 아파트 정보를 확인하세요
              </p>
            </div>
            <Link href="/search">
              <Button variant="outline" icon={<TrendingUp className="h-4 w-4" />} iconPosition="right">
                전체보기
              </Button>
            </Link>
          </div>

          {isLoadingRecent ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {Array.from({ length: 3 }).map((_, index) => (
                <Card key={index} className="animate-pulse">
                  <CardContent className="p-6 space-y-4">
                    <div className="h-6 bg-muted rounded w-3/4" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                    <div className="space-y-2">
                      <div className="h-3 bg-muted rounded" />
                      <div className="h-3 bg-muted rounded w-5/6" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : recentApartments.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {recentApartments
                .filter((apt, index, arr) => arr.findIndex(a => a.id === apt.id) === index)
                .map((apartment, index) => (
                <ApartmentCard
                  key={`${apartment.id}-${index}`}
                  apartment={apartment}
                  onBookmark={(id) => console.log('Bookmark:', id)}
                  onCompare={(id) => console.log('Compare:', id)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">최신 아파트 정보를 불러올 수 없습니다.</p>
            </div>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="bg-secondary/5">
        <div className="container px-4 py-16">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-h2 font-bold text-foreground">왜 아파트인포를 선택해야 할까요?</h2>
            <p className="text-body1 text-muted-foreground max-w-2xl mx-auto">
              복잡한 부동산 정보를 누구나 쉽게 이해할 수 있도록 도와드립니다
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            <FeatureCard>
              <CardContent className="p-8 space-y-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-h5 font-semibold text-foreground">3초 내 검색</h3>
                <p className="text-body2 text-muted-foreground">
                  전국 아파트 정보를 빠르게 검색하고 결과를 바로 확인할 수 있습니다
                </p>
              </CardContent>
            </FeatureCard>

            <FeatureCard>
              <CardContent className="p-8 space-y-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-h5 font-semibold text-foreground">신뢰할 수 있는 정보</h3>
                <p className="text-body2 text-muted-foreground">
                  공공데이터를 기반으로 한 정확하고 최신의 아파트 정보를 제공합니다
                </p>
              </CardContent>
            </FeatureCard>

            <FeatureCard>
              <CardContent className="p-8 space-y-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
                  <Star className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-h5 font-semibold text-foreground">친절한 용어 설명</h3>
                <p className="text-body2 text-muted-foreground">
                  어려운 부동산 용어를 쉽게 설명해서 누구나 이해할 수 있습니다
                </p>
              </CardContent>
            </FeatureCard>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container px-4">
        <Card className="bg-primary text-primary-foreground">
          <CardContent className="p-12 text-center space-y-6">
            <div className="space-y-4">
              <h2 className="text-h2 font-bold">
                지금 바로 시작해보세요
              </h2>
              <p className="text-body1 opacity-90 max-w-2xl mx-auto">
                전국의 모든 아파트 정보를 한곳에서 확인하고,
                <br />
                현명한 부동산 결정을 내려보세요
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
              <Link href="/search" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  variant="search"
                  icon={<Building2 className="h-5 w-5" />}
                  className="w-full sm:w-auto bg-white text-primary hover:bg-white/90 focus-outline"
                >
                  아파트 검색하기
                </Button>
              </Link>
              <Link href="/about" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto border-white text-white hover:bg-white/10 focus-outline"
                >
                  서비스 자세히 보기
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
