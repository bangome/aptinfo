'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button-enhanced';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { GlossaryTooltip } from '@/components/GlossaryTooltip';
import { PriceRangeDisplay } from '@/components/PriceRangeDisplay';
import { convertUnitTypeData } from '@/utils/area-utils';
import { removeRedundantSchoolSuffix } from '@/utils/school-utils';
import {
  Heart,
  Share,
  MapPin,
  Calendar,
  Users,
  Car,
  Building2,
  Wrench,
  Phone,
  Mail,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  BarChart3,
  AlertCircle,
  Train,
  Bus,
  Zap,
  Shield,
  Home,
  Settings,
  Flame,
  Wind,
  Droplets,
  Wifi,
  User,
  FileText,
  Eye,
  Trash,
  UserCog,
  Building,
  MoveVertical,
  Camera,
  Info
} from 'lucide-react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { formatPrice, formatArea, formatNumber } from '@/lib/apartment-utils';
import { realApartmentService } from '@/services/realApartmentService';
import { useApartmentPriceRange } from '@/hooks/use-apartment-price-range';
import { Apartment } from '@/types/apartment';
import { convertToApartment } from '@/lib/apartment-conversion';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { ManagementFeeCard } from '@/components/ManagementFeeCard';

export default function ApartmentDetailPage() {
  const params = useParams();
  const kaptCode = params?.id as string; // URL의 id는 실제로는 kapt_code

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [managementFee, setManagementFee] = useState<number | null>(null);
  const [isLoadingFee, setIsLoadingFee] = useState(false);
  const [yearlyManagementData, setYearlyManagementData] = useState<any>(null);
  const [isLoadingYearlyFee, setIsLoadingYearlyFee] = useState(false);

  // Load apartment data using React Query
  const {
    data: apartmentData,
    isLoading,
    error,
    isError
  } = useQuery({
    queryKey: ['apartment', kaptCode],
    queryFn: async () => {
      if (!kaptCode) throw new Error('아파트 코드가 필요합니다.');
      
      const data = await realApartmentService.getApartmentById(kaptCode);
      
      if (!data) {
        throw new Error('아파트를 찾을 수 없습니다.');
      }
      
      return data;
    },
    enabled: !!kaptCode,
    staleTime: 1000 * 60 * 15, // 15분간 캐시 (기본 정보는 자주 바뀌지 않음)
    gcTime: 1000 * 60 * 60 * 2, // 2시간 가비지 컬렉션
    retry: (failureCount, error) => {
      // 404 에러는 재시도하지 않음
      if (error instanceof Error && error.message.includes('찾을 수 없습니다')) {
        return false;
      }
      return failureCount < 2;
    },
    // 아파트 상세 정보는 중요하므로 에러 상태도 알림
    notifyOnChangeProps: ['data', 'error', 'isLoading'],
    // 백그라운드 자동 업데이트 비활성화
    refetchInterval: false
  });

  // Convert to Apartment type
  const apartment = apartmentData ? convertToApartment(apartmentData) : null;

  // Fetch management fee data
  useQuery({
    queryKey: ['managementFee', kaptCode],
    queryFn: async () => {
      if (!kaptCode) return null;
      
      try {
        setIsLoadingFee(true);
        const lastYear = new Date().getFullYear() - 1;
        const response = await fetch(`/api/management-fees/test?kaptCode=${kaptCode}&year=${lastYear}&month=1`);
        
        if (!response.ok) {
          console.error('Failed to fetch management fee');
          return null;
        }
        
        const data = await response.json();
        if (data?.perHouseholdFee?.total) {
          setManagementFee(data.perHouseholdFee.total);
          return data.perHouseholdFee.total;
        }
        return null;
      } catch (error) {
        console.error('Error fetching management fee:', error);
        return null;
      } finally {
        setIsLoadingFee(false);
      }
    },
    enabled: !!kaptCode && !!apartment,
    staleTime: 1000 * 60 * 30, // 30분간 캐시
    gcTime: 1000 * 60 * 60 * 2, // 2시간 가비지 컬렉션
    retry: 1
  });

  // Fetch yearly management fee data
  useQuery({
    queryKey: ['yearlyManagementFee', kaptCode],
    queryFn: async () => {
      if (!kaptCode) return null;
      
      try {
        setIsLoadingYearlyFee(true);
        const lastYear = new Date().getFullYear() - 1;
        const response = await fetch(`/api/management-fees/yearly?kaptCode=${kaptCode}&year=${lastYear}`);
        
        if (!response.ok) {
          console.error('Failed to fetch yearly management fee');
          return null;
        }
        
        const data = await response.json();
        console.log('Yearly management data received:', data);
        setYearlyManagementData(data);
        // Update the main management fee with yearly average
        if (data?.yearlyAverage?.perHouseholdFee?.total) {
          setManagementFee(data.yearlyAverage.perHouseholdFee.total);
        }
        return data;
      } catch (error) {
        console.error('Error fetching yearly management fee:', error);
        return null;
      } finally {
        setIsLoadingYearlyFee(false);
      }
    },
    enabled: !!kaptCode && !!apartment,
    staleTime: 1000 * 60 * 30, // 30분간 캐시
    gcTime: 1000 * 60 * 60 * 2, // 2시간 가비지 컬렉션
    retry: 1
  });

  // Load price range data using the dedicated hook
  const {
    data: priceRangeData,
    isLoading: isPriceLoading,
    error: priceError
  } = useApartmentPriceRange(apartment?.name || '', {
    enabled: !!apartment?.name,
    recentMonths: 12
  });

  if (isLoading) {
    return (
      <div className="container px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">아파트 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (isError || !apartment) {
    if (error?.message === '아파트를 찾을 수 없습니다.') {
      notFound();
    }
    
    return (
      <div className="container px-4 py-8">
        <div className="text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
          <div>
            <h2 className="text-h5 font-semibold mb-2">오류가 발생했습니다</h2>
            <p className="text-muted-foreground mb-4">
              {error?.message || '아파트 정보를 불러오는 중 문제가 발생했습니다.'}
            </p>
          </div>
          <div className="flex gap-2 justify-center">
            <Link href="/search">
              <Button variant="outline">검색으로 돌아가기</Button>
            </Link>
            <Button onClick={() => window.location.reload()}>
              다시 시도
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const nextImage = () => {
    setCurrentImageIndex((prev) =>
      prev === apartment.images.length - 1 ? 0 : prev + 1
    );
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? apartment.images.length - 1 : prev - 1
    );
  };

  // 67개 API 필드 데이터 접근을 위한 헬퍼 함수
  const getApiData = () => {
    return (apartmentData as any)?.rawData || {};
  };

  return (
    <div className="container px-4 py-6 sm:py-8">
      {/* Breadcrumb */}
      <nav aria-label="경로" className="mb-6">
        <ol className="flex items-center gap-2 text-sm sm:text-body2 text-muted-foreground">
          <li><Link href="/" className="hover:text-foreground focus-outline">홈</Link></li>
          <li aria-hidden="true">/</li>
          <li><Link href="/search" className="hover:text-foreground focus-outline">검색</Link></li>
          <li aria-hidden="true">/</li>
          <li className="text-foreground" aria-current="page">{apartment.name}</li>
        </ol>
      </nav>

      {/* Back Button */}
      <div className="mb-6">
        <Link href="/search">
          <Button variant="ghost" className="gap-2 p-0 h-auto">
            <ArrowLeft className="h-4 w-4" />
            검색 결과로 돌아가기
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Image Gallery and Basic Info */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Image Gallery - 이미지가 있고 placeholder가 아닌 경우만 표시 */}
          {apartment.images && apartment.images.length > 0 && apartment.images[0] !== '/placeholder.svg' && (
            <Card>
              <CardContent className="p-0">
                <div className="relative h-64 sm:h-80 lg:h-96 overflow-hidden rounded-lg">
                  <Image
                    src={apartment.images[currentImageIndex] || '/placeholder.svg'}
                    alt={`${apartment.name} - 이미지 ${currentImageIndex + 1}`}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover"
                  />
                  {apartment.images.length > 1 && (
                    <>
                      <Button
                        variant="secondary"
                        size="icon-sm"
                        className="absolute left-2 sm:left-4 top-1/2 transform -translate-y-1/2 rounded-full focus-outline"
                        onClick={prevImage}
                        aria-label="이전 이미지"
                      >
                        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                      </Button>
                      <Button
                        variant="secondary"
                        size="icon-sm"
                        className="absolute right-2 sm:right-4 top-1/2 transform -translate-y-1/2 rounded-full focus-outline"
                        onClick={nextImage}
                        aria-label="다음 이미지"
                      >
                        <ChevronRight className="h-4 w-4" aria-hidden="true" />
                      </Button>
                      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 rounded-full px-3 py-1">
                        <span className="text-white text-body2">
                          {currentImageIndex + 1} / {apartment.images.length}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{apartment.name}</span>
                <div className="flex gap-2">
                  <Button
                    variant={isBookmarked ? "bookmarked" : "bookmark"}
                    size="icon"
                    onClick={() => setIsBookmarked(!isBookmarked)}
                  >
                    <Heart className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon">
                    <Share className="h-4 w-4" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center text-muted-foreground">
                <MapPin className="h-4 w-4 mr-2" />
                {getApiData().kapt_addr || apartment.address}
              </div>
              
              {/* 우편번호 추가 */}
              {getApiData().zipcode && (
                <div className="text-sm text-muted-foreground">
                  우편번호: {getApiData().zipcode}
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 text-center">
                <div className="space-y-1">
                  <Calendar className="h-5 w-5 mx-auto text-primary" aria-hidden="true" />
                  <div className="text-xs sm:text-body2 text-muted-foreground">
                    <GlossaryTooltip term="건축년도">건축년도</GlossaryTooltip>
                  </div>
                  <div className="font-semibold text-sm sm:text-base">
                    {getApiData().kapt_usedate ? 
                      getApiData().kapt_usedate.slice(0, 4) + '년' : 
                      apartment.buildYear + '년'
                    }
                  </div>
                </div>
                <div className="space-y-1">
                  <Users className="h-5 w-5 mx-auto text-primary" />
                  <div className="text-body2 text-muted-foreground">
                    <GlossaryTooltip term="세대수">세대수</GlossaryTooltip>
                  </div>
                  <div className="font-semibold">
                    {formatNumber(getApiData().kapt_da_cnt || apartment.units)}세대
                  </div>
                </div>
                <div className="space-y-1">
                  <Car className="h-5 w-5 mx-auto text-primary" />
                  <div className="text-body2 text-muted-foreground">
                    <GlossaryTooltip term="주차대수">주차대수</GlossaryTooltip>
                  </div>
                  <div className="font-semibold">
                    {(() => {
                      const surfaceParking = getApiData().kaptd_pcnt || 0;
                      const undergroundParking = getApiData().kaptd_pcntu || 0;
                      const totalParking = surfaceParking + undergroundParking;
                      const totalUnits = getApiData().kapt_da_cnt || apartment.units;
                      const perHousehold = totalUnits > 0 ? (totalParking / totalUnits).toFixed(2) : 0;
                      
                      return `${formatNumber(totalParking)}대 (세대당 ${perHousehold}대)`;
                    })()}
                  </div>
                </div>
                <div className="space-y-1">
                  <Building2 className="h-5 w-5 mx-auto text-primary" />
                  <div className="text-body2 text-muted-foreground">층수</div>
                  <div className="font-semibold">
                    {getApiData().kapt_top_floor ? `${getApiData().kapt_top_floor}층` : 
                     typeof apartment.floors === 'number' ? `${apartment.floors}층` :
                     `${apartment.floors?.total || apartment.floors?.ground || 0}층`
                    }
                  </div>
                </div>
              </div>

              <Separator />

              {/* 향상된 단지 정보 섹션 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-h6 flex items-center gap-2">
                    <Home className="h-4 w-4" />
                    단지 정보
                  </h3>
                  <div className="space-y-3">
                    {getApiData().kapt_dong_cnt && (
                      <div className="flex justify-between text-body2">
                        <span className="text-muted-foreground">동수</span>
                        <span className="font-semibold">{formatNumber(getApiData().kapt_dong_cnt)}동</span>
                      </div>
                    )}
                    {getApiData().ho_cnt && (
                      <div className="flex justify-between text-body2">
                        <span className="text-muted-foreground">호수</span>
                        <span className="font-semibold">{formatNumber(getApiData().ho_cnt)}호</span>
                      </div>
                    )}
                    {getApiData().kapt_tarea && (
                      <div className="flex justify-between text-body2">
                        <span className="text-muted-foreground">대지면적</span>
                        <span className="font-semibold">{formatNumber(getApiData().kapt_tarea)}㎡</span>
                      </div>
                    )}
                    {getApiData().kapt_marea && (
                      <div className="flex justify-between text-body2">
                        <span className="text-muted-foreground">연면적</span>
                        <span className="font-semibold">{formatNumber(getApiData().kapt_marea)}㎡</span>
                      </div>
                    )}
                    {getApiData().priv_area && (
                      <div className="flex justify-between text-body2">
                        <span className="text-muted-foreground">전용면적 합계</span>
                        <span className="font-semibold">{formatNumber(getApiData().priv_area)}㎡</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-h6 flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    층수 정보
                  </h3>
                  <div className="space-y-3">
                    {getApiData().kapt_base_floor && (
                      <div className="flex justify-between text-body2">
                        <span className="text-muted-foreground">지하층수</span>
                        <span className="font-semibold">{getApiData().kapt_base_floor}층</span>
                      </div>
                    )}
                    {getApiData().kapt_top_floor && (
                      <div className="flex justify-between text-body2">
                        <span className="text-muted-foreground">지상최고층수</span>
                        <span className="font-semibold">{getApiData().kapt_top_floor}층</span>
                      </div>
                    )}
                    {getApiData().ktown_flr_no && (
                      <div className="flex justify-between text-body2">
                        <span className="text-muted-foreground">지상층수</span>
                        <span className="font-semibold">{getApiData().ktown_flr_no}층</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              {/* 면적별 세대수 정보 */}
              {(getApiData().kapt_mparea60 || getApiData().kapt_mparea85 || getApiData().kapt_mparea135 || getApiData().kapt_mparea136) && (
                <>
                  <div className="space-y-4">
                    <h3 className="font-semibold text-h6 flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      면적별 세대수
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      {getApiData().kapt_mparea60 && (
                        <div className="bg-muted/50 rounded-lg p-3 text-center">
                          <div className="text-body2 text-muted-foreground mb-1">60㎡ 이하</div>
                          <div className="font-semibold text-h6">{formatNumber(getApiData().kapt_mparea60)}세대</div>
                        </div>
                      )}
                      {getApiData().kapt_mparea85 && (
                        <div className="bg-muted/50 rounded-lg p-3 text-center">
                          <div className="text-body2 text-muted-foreground mb-1">60~85㎡</div>
                          <div className="font-semibold text-h6">{formatNumber(getApiData().kapt_mparea85)}세대</div>
                        </div>
                      )}
                      {getApiData().kapt_mparea135 && (
                        <div className="bg-muted/50 rounded-lg p-3 text-center">
                          <div className="text-body2 text-muted-foreground mb-1">85~135㎡</div>
                          <div className="font-semibold text-h6">{formatNumber(getApiData().kapt_mparea135)}세대</div>
                        </div>
                      )}
                      {getApiData().kapt_mparea136 && (
                        <div className="bg-muted/50 rounded-lg p-3 text-center">
                          <div className="text-body2 text-muted-foreground mb-1">135㎡ 초과</div>
                          <div className="font-semibold text-h6">{formatNumber(getApiData().kapt_mparea136)}세대</div>
                        </div>
                      )}
                    </div>
                  </div>
                  <Separator />
                </>
              )}

              {/* 관리비 정보 */}
              <div className="space-y-2">
                <h3 className="font-semibold text-h6">예상 관리비</h3>
                <div className="flex justify-between text-body2">
                  <span className="text-muted-foreground">
                    <GlossaryTooltip term="관리비">세대당 월평균 관리비</GlossaryTooltip>
                  </span>
                  <span className="font-semibold">
                    {isLoadingYearlyFee ? (
                      <span className="text-muted-foreground">조회중...</span>
                    ) : managementFee ? (
                      <>{formatNumber(managementFee)}원/월</>
                    ) : (
                      <span className="text-muted-foreground">정보 없음</span>
                    )}
                  </span>
                </div>
                {managementFee && yearlyManagementData && (
                  <div className="text-xs text-muted-foreground mt-1">
                    * {yearlyManagementData.year}년 평균 ({yearlyManagementData.dataCount}개월 데이터)
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 평형별 세대수 카드 */}
          {(() => {
            const unitTypes = convertUnitTypeData({
              kapt_mparea60: getApiData().kapt_mparea60,
              kapt_mparea85: getApiData().kapt_mparea85,
              kapt_mparea135: getApiData().kapt_mparea135,
              kapt_mparea136: getApiData().kapt_mparea136,
              kapt_da_cnt: getApiData().kapt_da_cnt
            });
            
            if (unitTypes.length === 0) return null;
            
            return (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Home className="h-5 w-5" />
                    평형별 세대 구성
                  </CardTitle>
                  <p className="text-body2 text-muted-foreground">
                    총 {formatNumber(getApiData().kapt_da_cnt || 0)}세대로 구성
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {unitTypes.map((unitType, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium text-body1">{unitType.label}</div>
                          <div className="text-body2 text-muted-foreground">
                            전체의 {unitType.percentage}%
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-h6">{formatNumber(unitType.count)}세대</div>
                        </div>
                      </div>
                    ))}
                    
                    {/* 평형별 비율 차트 */}
                    <div className="mt-6">
                      <div className="text-body2 text-muted-foreground mb-3">평형 구성 비율</div>
                      <div className="flex h-6 rounded-full overflow-hidden bg-muted">
                        {unitTypes.map((unitType, index) => {
                          const colors = ['bg-blue-500', 'bg-green-500', 'bg-orange-500', 'bg-purple-500'];
                          return (
                            <div
                              key={index}
                              className={colors[index % colors.length]}
                              style={{ width: `${unitType.percentage}%` }}
                              title={`${unitType.floorRange}: ${unitType.percentage}%`}
                            />
                          );
                        })}
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {unitTypes.map((unitType, index) => {
                          const colors = ['bg-blue-500', 'bg-green-500', 'bg-orange-500', 'bg-purple-500'];
                          return (
                            <div key={index} className="flex items-center gap-1 text-caption">
                              <div className={`w-3 h-3 rounded-full ${colors[index % colors.length]}`} />
                              <span>{unitType.floorRange}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })()}

          {/* 분류 정보 카드 */}
          {(getApiData().code_sale_nm || getApiData().code_heat_nm || getApiData().code_apt_nm || getApiData().code_hall_nm) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  분류 정보
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {getApiData().code_sale_nm && (
                    <div className="text-center space-y-2">
                      <div className="text-body2 text-muted-foreground">분양형태</div>
                      <Badge variant="outline" className="w-full justify-center">{getApiData().code_sale_nm}</Badge>
                    </div>
                  )}
                  {getApiData().code_heat_nm && (
                    <div className="text-center space-y-2">
                      <div className="text-body2 text-muted-foreground">난방방식</div>
                      <Badge variant="outline" className="w-full justify-center">{getApiData().code_heat_nm}</Badge>
                    </div>
                  )}
                  {getApiData().code_apt_nm && (
                    <div className="text-center space-y-2">
                      <div className="text-body2 text-muted-foreground">아파트분류</div>
                      <Badge variant="outline" className="w-full justify-center">{getApiData().code_apt_nm}</Badge>
                    </div>
                  )}
                  {getApiData().code_hall_nm && (
                    <div className="text-center space-y-2">
                      <div className="text-body2 text-muted-foreground">복도유형</div>
                      <Badge variant="outline" className="w-full justify-center">{getApiData().code_hall_nm}</Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 시설 정보 카드 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                시설 정보
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* 주차 정보 */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-body1 flex items-center gap-2">
                    <Car className="h-4 w-4 text-primary" />
                    주차시설
                  </h4>
                  <div className="space-y-2">
                    {getApiData().kaptd_pcnt && (
                      <div className="flex justify-between text-body2">
                        <span className="text-muted-foreground">지상주차</span>
                        <span className="font-semibold">{formatNumber(getApiData().kaptd_pcnt)}대</span>
                      </div>
                    )}
                    {getApiData().kaptd_pcntu && (
                      <div className="flex justify-between text-body2">
                        <span className="text-muted-foreground">지하주차</span>
                        <span className="font-semibold">{formatNumber(getApiData().kaptd_pcntu)}대</span>
                      </div>
                    )}
                    <div className="flex justify-between text-body2">
                      <span className="text-muted-foreground">총 주차대수</span>
                      <span className="font-semibold text-primary">
                        {formatNumber((getApiData().kaptd_pcnt || 0) + (getApiData().kaptd_pcntu || 0))}대
                      </span>
                    </div>
                  </div>
                </div>

                {/* 승강기 정보 */}
                {(getApiData().kaptd_ecnt || getApiData().kaptd_ecntp) && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-body1 flex items-center gap-2">
                      <MoveVertical className="h-4 w-4 text-primary" />
                      승강기
                    </h4>
                    <div className="space-y-2">
                      {getApiData().kaptd_ecnt && (
                        <div className="flex justify-between text-body2">
                          <span className="text-muted-foreground">승강기 대수</span>
                          <span className="font-semibold">{formatNumber(getApiData().kaptd_ecnt)}대</span>
                        </div>
                      )}
                      {getApiData().kaptd_ecntp && (
                        <div className="flex justify-between text-body2">
                          <span className="text-muted-foreground">승강정원</span>
                          <span className="font-semibold">{formatNumber(getApiData().kaptd_ecntp)}명</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 보안 정보 */}
                {getApiData().kaptd_cccnt && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-body1 flex items-center gap-2">
                      <Camera className="h-4 w-4 text-primary" />
                      보안시설
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-body2">
                        <span className="text-muted-foreground">CCTV 설치</span>
                        <span className="font-semibold">{formatNumber(getApiData().kaptd_cccnt)}대</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 전기차 충전시설 */}
                {(getApiData().ground_el_charger_cnt || getApiData().underground_el_charger_cnt) && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-body1 flex items-center gap-2">
                      <Zap className="h-4 w-4 text-primary" />
                      전기차 충전시설
                    </h4>
                    <div className="space-y-2">
                      {getApiData().ground_el_charger_cnt && (
                        <div className="flex justify-between text-body2">
                          <span className="text-muted-foreground">지상 충전기</span>
                          <span className="font-semibold">{formatNumber(getApiData().ground_el_charger_cnt)}대</span>
                        </div>
                      )}
                      {getApiData().underground_el_charger_cnt && (
                        <div className="flex justify-between text-body2">
                          <span className="text-muted-foreground">지하 충전기</span>
                          <span className="font-semibold">{formatNumber(getApiData().underground_el_charger_cnt)}대</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 인프라 정보 */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-body1 flex items-center gap-2">
                    <Wifi className="h-4 w-4 text-primary" />
                    인프라
                  </h4>
                  <div className="space-y-2">
                    {getApiData().code_net && (
                      <div className="flex justify-between text-body2">
                        <span className="text-muted-foreground">인터넷설비</span>
                        <span className="font-semibold">{getApiData().code_net}</span>
                      </div>
                    )}
                    {getApiData().kaptd_ecapa && (
                      <div className="flex justify-between text-body2">
                        <span className="text-muted-foreground">수전용량</span>
                        <span className="font-semibold">{formatNumber(getApiData().kaptd_ecapa)}kW</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 안전 시설 */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-body1 flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" />
                    안전시설
                  </h4>
                  <div className="space-y-2">
                    {getApiData().code_falarm && (
                      <div className="flex justify-between text-body2">
                        <span className="text-muted-foreground">화재경보설비</span>
                        <span className="font-semibold">{getApiData().code_falarm}</span>
                      </div>
                    )}
                    {getApiData().code_wsupply && (
                      <div className="flex justify-between text-body2">
                        <span className="text-muted-foreground">급수방식</span>
                        <span className="font-semibold">{getApiData().code_wsupply}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 관리 정보 카드 */}
          {(getApiData().code_mgr || getApiData().kapt_mgr_cnt || getApiData().kapt_ccompany) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCog className="h-5 w-5" />
                  관리 정보
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* 일반 관리 */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-body1 flex items-center gap-2">
                      <User className="h-4 w-4 text-primary" />
                      일반 관리
                    </h4>
                    <div className="space-y-2">
                      {getApiData().code_mgr && (
                        <div className="flex justify-between text-body2">
                          <span className="text-muted-foreground">관리방식</span>
                          <span className="font-semibold">{getApiData().code_mgr}</span>
                        </div>
                      )}
                      {getApiData().kapt_mgr_cnt && (
                        <div className="flex justify-between text-body2">
                          <span className="text-muted-foreground">관리인원</span>
                          <span className="font-semibold">{formatNumber(getApiData().kapt_mgr_cnt)}명</span>
                        </div>
                      )}
                      {getApiData().kapt_ccompany && (
                        <div className="flex justify-between text-body2">
                          <span className="text-muted-foreground">관리업체</span>
                          <span className="font-semibold">{getApiData().kapt_ccompany}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 특수 관리 */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-body1 flex items-center gap-2">
                      <Shield className="h-4 w-4 text-primary" />
                      특수 관리
                    </h4>
                    <div className="space-y-2">
                      {getApiData().code_sec && (
                        <div className="flex justify-between text-body2">
                          <span className="text-muted-foreground">경비관리</span>
                          <span className="font-semibold">{getApiData().code_sec}</span>
                        </div>
                      )}
                      {getApiData().code_clean && (
                        <div className="flex justify-between text-body2">
                          <span className="text-muted-foreground">청소관리</span>
                          <span className="font-semibold">{getApiData().code_clean}</span>
                        </div>
                      )}
                      {getApiData().code_disinf && (
                        <div className="flex justify-between text-body2">
                          <span className="text-muted-foreground">소독관리</span>
                          <span className="font-semibold">{getApiData().code_disinf}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Facilities - 기존 편의시설 그룹핑 로직 유지 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                편의시설
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                // 시설을 카테고리별로 분류 (기존 로직 유지)
                const categories = {
                  단지내편의시설: [] as string[],
                  관공서: [] as string[],
                  병원: [] as string[],
                  공원: [] as string[],
                  학교: [] as string[],
                  기타: [] as string[]
                };

                apartment.facilities.forEach(facility => {
                  // 학교 관련 정보는 제외 (별도 교육시설 섹션에서 처리되므로 중복 방지)
                  const isSchoolRelated = facility.includes('초등학교') || facility.includes('중학교') || 
                                         facility.includes('고등학교') || facility.includes('대학교') ||
                                         facility.includes('학교') || facility.match(/초등학교\([^)]*\)/) ||
                                         facility.match(/중학교\([^)]*\)/) || facility.match(/고등학교\([^)]*\)/) ||
                                         facility.match(/대학교\([^)]*\)/);
                  
                  if (isSchoolRelated) {
                    // 학교 정보는 편의시설에서 제외 (별도 섹션에서 표시)
                    return;
                  } else if (facility.includes('청') || facility.includes('구청') || facility.includes('시청') || facility.includes('주민센터') || facility.includes('행정') || facility.includes('관공서')) {
                    categories.관공서.push(facility);
                  } else if (facility.includes('병원') || facility.includes('의료') || facility.includes('클리닉') || facility.includes('의원')) {
                    categories.병원.push(facility);
                  } else if (facility.includes('공원') || facility.includes('놀이터') || facility.includes('산책로') || facility.includes('정원')) {
                    categories.공원.push(facility);
                  } else if (facility.includes('마트') || facility.includes('상가') || facility.includes('백화점') || facility.includes('쇼핑') || facility.includes('몰') || facility.includes('편의점')) {
                    categories.기타.push(facility);
                  }
                });

                // 67개 API 필드에서 편의시설 정보 추가
                if (getApiData().welfare_facility) {
                  const welfareFacilities = getApiData().welfare_facility.split(/[,;\/]/).map((f: string) => f.trim()).filter((f: string) => f.length > 0);
                  categories.단지내편의시설.push(...welfareFacilities);
                }

                // convenient_facility은 주변시설이므로 카테고리별로 분류
                if (getApiData().convenient_facility) {
                  const convenientText = getApiData().convenient_facility;
                  console.log('🔍 Convenient facility text:', convenientText);
                  
                  // 관공서 파싱 - 정확한 괄호 매칭
                  const govMatches = convenientText.match(/관공서\(([^)]+)\)/g);
                  if (govMatches) {
                    govMatches.forEach(match => {
                      const govContent = match.match(/관공서\(([^)]+)\)/);
                      if (govContent) {
                        const govFacilities = govContent[1].split(/[,;]/).map((f: string) => f.trim()).filter((f: string) => {
                          return f.length > 0 && (f.includes('센터') || f.includes('청') || f.includes('소') || f.includes('구청') || f.includes('시청'));
                        });
                        console.log('🏛️ Found valid government facilities:', govFacilities);
                        categories.관공서.push(...govFacilities);
                      }
                    });
                  }
                  
                  // 병원 파싱 - 정확한 괄호 매칭
                  const hospitalMatches = convenientText.match(/병원\(([^)]*)\)/g);
                  if (hospitalMatches) {
                    hospitalMatches.forEach(match => {
                      const hospitalContent = match.match(/병원\(([^)]*)\)/);
                      if (hospitalContent && hospitalContent[1].trim()) {
                        const hospitals = hospitalContent[1].split(/[,;]/).map((f: string) => f.trim()).filter((f: string) => f.length > 0);
                        console.log('🏥 Found hospitals:', hospitals);
                        categories.병원.push(...hospitals);
                      }
                    });
                  }
                  
                  // 공원 파싱 - 정확한 괄호 매칭
                  const parkMatches = convenientText.match(/공원\(([^)]+)\)/g);
                  if (parkMatches) {
                    parkMatches.forEach(match => {
                      const parkContent = match.match(/공원\(([^)]+)\)/);
                      if (parkContent) {
                        const parks = parkContent[1].split(/[,;]/).map((f: string) => f.trim()).filter((f: string) => {
                          return f.length > 0 && (f.includes('공원') || f.includes('산') || f.includes('명소') || f.includes('광장') || f.length >= 4);
                        });
                        console.log('🌳 Found valid parks:', parks);
                        categories.공원.push(...parks);
                      }
                    });
                  }
                  
                  // 기타 시설들 처리 (대형상가, 백화점 등)
                  const otherMatches = convenientText.match(/(?:대형상가|백화점|쇼핑몰|상가)\(([^)]+)\)/g);
                  if (otherMatches) {
                    otherMatches.forEach(match => {
                      const otherContent = match.match(/(?:대형상가|백화점|쇼핑몰|상가)\(([^)]+)\)/);
                      if (otherContent) {
                        const facilities = otherContent[1].split(/[,;]/).map((f: string) => f.trim()).filter((f: string) => f.length > 0);
                        console.log('🏪 Found other facilities:', facilities);
                        categories.기타.push(...facilities);
                      }
                    });
                  }
                }

                // 학교 정보는 educationFacilities에서만 가져오기 (불완전한 정보 필터링)
                if (apartment.educationFacilities && apartment.educationFacilities.length > 0) {
                  console.log('🔍 Original educationFacilities:', apartment.educationFacilities);
                  
                  const validSchools = apartment.educationFacilities.filter((school: string) => {
                    // 매우 엄격한 필터링: 명확한 학교명만 포함
                    // "행당", "무학", "중", "고" 같은 불완전한 이름은 완전히 제외
                    
                    // 단일 글자나 2글자 지역명은 제외
                    if (school.length <= 2) {
                      console.log('❌ Filtered out (too short):', school);
                      return false;
                    }
                    
                    // "초", "중", "고"로 끝나는 경우만 허용 (최소 3글자 이상)
                    const hasValidSuffix = school.endsWith('초') || school.endsWith('중') || school.endsWith('고');
                    
                    // "대학교", "학교"가 포함된 경우 (최소 4글자 이상)
                    const hasSchoolKeyword = school.includes('대학교') || 
                                           (school.includes('학교') && school.length >= 4);
                    
                    const isValid = hasValidSuffix || hasSchoolKeyword;
                    
                    if (!isValid) {
                      console.log('❌ Filtered out (invalid format):', school);
                    } else {
                      console.log('✅ Kept:', school);
                    }
                    
                    return isValid;
                  });
                  
                  console.log('✅ Final filtered schools:', validSchools);
                  categories.학교.push(...validSchools);
                }

                // 67개 API 필드에서 교육시설 정보 추가 (괄호 안의 학교명 파싱)
                if (getApiData().education_facility) {
                  const educationText = getApiData().education_facility;
                  console.log('🔍 Education facility text:', educationText);
                  
                  // 초등학교, 중학교, 고등학교, 대학교 패턴 매칭
                  const schoolTypes = ['초등학교', '중학교', '고등학교', '대학교'];
                  
                  schoolTypes.forEach(schoolType => {
                    const pattern = new RegExp(`${schoolType}\\(([^)]+)\\)`, 'g');
                    const matches = educationText.match(pattern);
                    
                    if (matches) {
                      console.log(`📚 Found ${schoolType} matches:`, matches);
                      matches.forEach(match => {
                        const schoolsMatch = match.match(/\(([^)]+)\)/);
                        if (schoolsMatch) {
                          const schools = schoolsMatch[1].split(/[,;]/).map((s: string) => s.trim()).filter((s: string) => s.length > 0);
                          console.log(`  ${schoolType} schools:`, schools);
                          schools.forEach(school => {
                            // education_facility에서도 동일한 필터링 적용
                            if (school.length <= 2) {
                              console.log(`  ❌ Filtered out from education_facility (too short):`, school);
                              return;
                            }
                            
                            const hasValidSuffix = school.endsWith('초') || school.endsWith('중') || school.endsWith('고');
                            const hasSchoolKeyword = school.includes('대학교') || 
                                                   (school.includes('학교') && school.length >= 4);
                            
                            if (hasValidSuffix || hasSchoolKeyword) {
                              console.log(`  ✅ Adding valid school from education_facility:`, school);
                              categories.학교.push(school);
                            } else {
                              console.log(`  ❌ Filtered out from education_facility (invalid format):`, school);
                            }
                          });
                        }
                      });
                    }
                  });
                  
                  // 나머지 텍스트는 처리하지 않음 (괄호 밖의 내용은 중복이므로 제외)
                }

                return (
                  <div className="space-y-4">
                    {Object.entries(categories).map(([categoryName, facilities]) => {
                      if (facilities.length === 0) return null;
                      
                      return (
                        <div key={categoryName} className="space-y-2">
                          <h4 className="font-semibold text-body1 text-muted-foreground">{categoryName}</h4>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {(() => {
                              // 유사한 중복 제거 및 괄호 정리
                              const deduplicatedFacilities: string[] = [];
                              
                              for (let facility of facilities) {
                                // 먼저 모든 괄호 정리
                                facility = facility
                                  .replace(/[)\]}>]+$/, '')  // 끝의 모든 닫는 괄호들 제거
                                  .replace(/^[(\[{<]+/, '')  // 시작의 모든 여는 괄호들 제거
                                  .trim();
                                
                                if (!facility) continue;
                                
                                let isDuplicate = false;
                                
                                for (let i = 0; i < deduplicatedFacilities.length; i++) {
                                  const existing = deduplicatedFacilities[i];
                                  const cleanFacility = facility.replace(/[()[\]{}]/g, '').trim();
                                  const cleanExisting = existing.replace(/[()[\]{}]/g, '').trim();
                                  
                                  if (cleanFacility === cleanExisting || 
                                      cleanFacility.includes(cleanExisting) || 
                                      cleanExisting.includes(cleanFacility)) {
                                    isDuplicate = true;
                                    
                                    // 더 완전한 이름으로 교체
                                    if (cleanFacility.length > cleanExisting.length) {
                                      deduplicatedFacilities[i] = facility;
                                    }
                                    break;
                                  }
                                }
                                
                                if (!isDuplicate && facility.length > 0) {
                                  deduplicatedFacilities.push(facility);
                                }
                              }
                              
                              return deduplicatedFacilities.map((facility, index) => (
                                <Badge key={index} variant="outline" className="justify-center py-2">
                                  {categoryName === '학교' ? removeRedundantSchoolSuffix(facility) : facility}
                                </Badge>
                              ));
                            })()}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </CardContent>
          </Card>

          {/* Transportation - 67개 API 필드 활용 */}
          {(apartment.transportation || getApiData().kaptd_wtimebus || getApiData().subway_line) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Train className="h-5 w-5" />
                  교통정보
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* 지하철 정보 - 67개 API 필드 우선 사용 */}
                  {(getApiData().subway_line || apartment.transportation?.subway) && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Train className="h-4 w-4 text-primary" />
                        <span className="font-semibold text-body1">지하철</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 ml-6">
                        {(getApiData().subway_line || apartment.transportation?.subway?.line) && (
                          <div className="space-y-1">
                            <div className="text-body2 text-muted-foreground">노선</div>
                            <Badge variant="secondary">
                              {getApiData().subway_line || apartment.transportation?.subway?.line}
                            </Badge>
                          </div>
                        )}
                        {(getApiData().subway_station || apartment.transportation?.subway?.station) && (
                          <div className="space-y-1">
                            <div className="text-body2 text-muted-foreground">역명</div>
                            <div className="font-semibold">
                              {getApiData().subway_station || apartment.transportation?.subway?.station}
                            </div>
                          </div>
                        )}
                        {(getApiData().kaptd_wtimesub || apartment.transportation?.subway?.distance) && (
                          <div className="space-y-1">
                            <div className="text-body2 text-muted-foreground">도보시간</div>
                            <div className="font-semibold">
                              {getApiData().kaptd_wtimesub || apartment.transportation?.subway?.distance}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* 버스 정보 - 67개 API 필드 우선 사용 */}
                  {(getApiData().kaptd_wtimebus || apartment.transportation?.bus?.distance) && (
                    <>
                      {(getApiData().subway_line || apartment.transportation?.subway) && <Separator />}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Bus className="h-4 w-4 text-primary" />
                          <span className="font-semibold text-body1">버스</span>
                        </div>
                        <div className="ml-6">
                          <div className="space-y-1">
                            <div className="text-body2 text-muted-foreground">정류장까지</div>
                            <div className="font-semibold">
                              {getApiData().kaptd_wtimebus || apartment.transportation?.bus?.distance}
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Enhanced Management Fee Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                💰 연간 관리비 정보
                <Badge variant="secondary" className="ml-auto">
                  {yearlyManagementData?.year || new Date().getFullYear() - 1}년
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingYearlyFee ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-body2 text-muted-foreground">연간 관리비 정보를 불러오는 중...</p>
                </div>
              ) : yearlyManagementData && yearlyManagementData.monthlyData ? (
                <div className="space-y-6">
                  {/* 연간 평균 요약 */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
                    <h4 className="font-semibold text-body1 mb-3 flex items-center gap-2">
                      📊 {yearlyManagementData.year}년 평균 관리비
                      <span className="text-body2 text-muted-foreground">({yearlyManagementData.dataCount}개월 데이터)</span>
                    </h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground mb-1">공용관리비</div>
                        <div className="text-xl font-bold text-blue-600">
                          {formatNumber(yearlyManagementData?.yearlyAverage?.perHouseholdFee?.common || 0)}원
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground mb-1">개별사용료</div>
                        <div className="text-xl font-bold text-green-600">
                          {formatNumber(yearlyManagementData?.yearlyAverage?.perHouseholdFee?.individual || 0)}원
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground mb-1">총 관리비</div>
                        <div className="text-2xl font-bold text-purple-600">
                          {formatNumber(yearlyManagementData?.yearlyAverage?.perHouseholdFee?.total || 0)}원
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 월별 데이터 표 */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-body1 flex items-center gap-2">
                      📅 월별 관리비 현황
                      <span className="text-body2 text-muted-foreground">(세대당 월평균)</span>
                    </h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2">월</th>
                            <th className="text-right p-2 text-blue-600">공용관리비</th>
                            <th className="text-right p-2 text-green-600">개별사용료</th>
                            <th className="text-right p-2 text-purple-600 font-bold">합계</th>
                          </tr>
                        </thead>
                        <tbody>
                          {yearlyManagementData?.monthlyData?.map((monthData: any, index: number) => (
                            <tr key={index} className="border-b hover:bg-muted/30">
                              <td className="p-2 font-semibold">{monthData?.month}월</td>
                              <td className="p-2 text-right text-blue-600">
                                {formatNumber(monthData?.perHouseholdFee?.common || 0)}원
                              </td>
                              <td className="p-2 text-right text-green-600">
                                {formatNumber(monthData?.perHouseholdFee?.individual || 0)}원
                              </td>
                              <td className="p-2 text-right font-bold text-purple-600">
                                {formatNumber(monthData?.perHouseholdFee?.total || 0)}원
                              </td>
                            </tr>
                          )) || []}
                          {/* 평균 행 */}
                          <tr className="border-t-2 bg-muted/20 font-bold">
                            <td className="p-2">평균</td>
                            <td className="p-2 text-right text-blue-600">
                              {formatNumber(yearlyManagementData?.yearlyAverage?.perHouseholdFee?.common || 0)}원
                            </td>
                            <td className="p-2 text-right text-green-600">
                              {formatNumber(yearlyManagementData?.yearlyAverage?.perHouseholdFee?.individual || 0)}원
                            </td>
                            <td className="p-2 text-right text-purple-600">
                              {formatNumber(yearlyManagementData?.yearlyAverage?.perHouseholdFee?.total || 0)}원
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* 간단한 차트 표시 */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-body1">📈 월별 추이</h4>
                    <div className="space-y-2">
                      {yearlyManagementData?.monthlyData?.map((monthData: any, index: number) => {
                        const maxTotal = Math.max(...(yearlyManagementData?.monthlyData?.map((d: any) => d?.perHouseholdFee?.total || 0) || [0]));
                        const totalAmount = monthData?.perHouseholdFee?.total || 0;
                        const commonAmount = monthData?.perHouseholdFee?.common || 0;
                        const totalWidth = maxTotal > 0 ? (totalAmount / maxTotal) * 100 : 0;
                        const commonWidth = totalAmount > 0 ? (commonAmount / totalAmount) * totalWidth : 0;
                        const individualWidth = totalWidth - commonWidth;
                        
                        return (
                          <div key={index} className="flex items-center gap-2">
                            <div className="w-8 text-xs text-right font-medium">{monthData?.month}월</div>
                            <div className="flex-1 h-8 bg-muted rounded-lg overflow-hidden flex">
                              <div 
                                className="bg-blue-500 h-full flex items-center justify-center text-white text-xs font-medium"
                                style={{ width: `${commonWidth}%` }}
                                title={`공용: ${formatNumber(commonAmount)}원`}
                              >
                                {commonWidth > 15 ? `${formatNumber(commonAmount)}` : ''}
                              </div>
                              <div 
                                className="bg-green-500 h-full flex items-center justify-center text-white text-xs font-medium"
                                style={{ width: `${individualWidth}%` }}
                                title={`개별: ${formatNumber((monthData?.perHouseholdFee?.individual || 0))}원`}
                              >
                                {individualWidth > 15 ? `${formatNumber((monthData?.perHouseholdFee?.individual || 0))}` : ''}
                              </div>
                            </div>
                            <div className="w-20 text-xs text-right font-semibold">
                              {formatNumber(totalAmount)}원
                            </div>
                          </div>
                        );
                      }) || []}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground justify-center">
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-blue-500 rounded"></div>
                        <span>공용관리비</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-green-500 rounded"></div>
                        <span>개별사용료</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-center text-xs text-muted-foreground bg-muted/30 rounded-lg p-3">
                    💡 실제 세대별 관리비는 평형, 층수, 사용량에 따라 달라질 수 있습니다<br/>
                    📅 데이터 기준: {yearlyManagementData.year}년 ({yearlyManagementData.dataCount}개월)
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 space-y-2">
                  <div className="text-muted-foreground">
                    연간 관리비 정보를 불러올 수 없습니다.
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Real Transaction Price Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                실거래가 정보
                <Badge variant="secondary" className="ml-auto">
                  최근 12개월
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isPriceLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-body2 text-muted-foreground">실거래가 정보를 불러오는 중...</p>
                </div>
              ) : priceError ? (
                <div className="text-center py-8 space-y-2">
                  <BarChart3 className="h-8 w-8 text-muted-foreground mx-auto" />
                  <p className="text-body2 text-muted-foreground">
                    실거래가 정보를 불러올 수 없습니다.
                  </p>
                </div>
              ) : priceRangeData && priceRangeData.hasData ? (
                <div className="space-y-6">
                  <PriceRangeDisplay 
                    priceData={priceRangeData}
                  />
                  
                  <Separator />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {priceRangeData.tradeRange && (
                      <div className="space-y-2">
                        <h4 className="font-semibold text-body1 flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-primary" />
                          매매 시세
                        </h4>
                        <div className="bg-muted/50 rounded-lg p-3 space-y-1">
                          <div className="flex justify-between text-body2">
                            <span className="text-muted-foreground">최저가</span>
                            <span className="font-semibold">
                              {formatPrice(priceRangeData.tradeRange.min)}
                            </span>
                          </div>
                          <div className="flex justify-between text-body2">
                            <span className="text-muted-foreground">최고가</span>
                            <span className="font-semibold">
                              {formatPrice(priceRangeData.tradeRange.max)}
                            </span>
                          </div>
                          <div className="flex justify-between text-body2">
                            <span className="text-muted-foreground">평균가</span>
                            <span className="font-semibold text-primary">
                              {formatPrice(priceRangeData.tradeRange.average)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {priceRangeData.rentDepositRange && (
                      <div className="space-y-2">
                        <h4 className="font-semibold text-body1 flex items-center gap-2">
                          <BarChart3 className="h-4 w-4 text-secondary" />
                          전세 보증금
                        </h4>
                        <div className="bg-muted/50 rounded-lg p-3 space-y-1">
                          <div className="flex justify-between text-body2">
                            <span className="text-muted-foreground">최저가</span>
                            <span className="font-semibold">
                              {formatPrice(priceRangeData.rentDepositRange.min)}
                            </span>
                          </div>
                          <div className="flex justify-between text-body2">
                            <span className="text-muted-foreground">최고가</span>
                            <span className="font-semibold">
                              {formatPrice(priceRangeData.rentDepositRange.max)}
                            </span>
                          </div>
                          <div className="flex justify-between text-body2">
                            <span className="text-muted-foreground">평균가</span>
                            <span className="font-semibold text-secondary">
                              {formatPrice(priceRangeData.rentDepositRange.average)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {priceRangeData.isRecent && (
                    <div className="text-center">
                      <p className="text-body2 text-muted-foreground">
                        데이터 기준일: {format(new Date(), 'yyyy년 MM월 dd일', { locale: ko })}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 space-y-2">
                  <BarChart3 className="h-8 w-8 text-muted-foreground mx-auto" />
                  <p className="text-body2 text-muted-foreground">
                    최근 12개월간 실거래 데이터가 없습니다.
                  </p>
                  <p className="text-body2 text-muted-foreground">
                    다른 기간이나 지역의 데이터를 확인해보세요.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Management Fee Highlight Card */}
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                💰 예상 월 관리비
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-2">
                {isLoadingYearlyFee ? (
                  <div className="animate-pulse">
                    <div className="h-10 bg-muted rounded w-3/4 mx-auto mb-2"></div>
                    <div className="h-4 bg-muted rounded w-1/2 mx-auto"></div>
                  </div>
                ) : yearlyManagementData?.yearlyAverage ? (
                  <>
                    <div className="text-3xl font-bold text-primary">
                      {formatNumber(yearlyManagementData?.yearlyAverage?.perHouseholdFee?.total || 0)}원
                    </div>
                    <div className="text-sm text-muted-foreground">
                      세대당 월평균 ({yearlyManagementData?.year}년 평균)
                    </div>
                    <Separator className="my-3" />
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="text-center">
                        <div className="text-blue-600 font-semibold">
                          {formatNumber(yearlyManagementData?.yearlyAverage?.perHouseholdFee?.common || 0)}원
                        </div>
                        <div className="text-muted-foreground">공용관리비</div>
                      </div>
                      <div className="text-center">
                        <div className="text-green-600 font-semibold">
                          {formatNumber(yearlyManagementData?.yearlyAverage?.perHouseholdFee?.individual || 0)}원
                        </div>
                        <div className="text-muted-foreground">개별사용료</div>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>📅 {yearlyManagementData.dataCount}개월 데이터 평균</p>
                      <p>💡 실제 관리비는 평형, 사용량에 따라 달라질 수 있습니다</p>
                    </div>
                  </>
                ) : (
                  <div className="text-muted-foreground">
                    관리비 정보를 불러올 수 없습니다
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Contact Card - 67개 API 필드 활용 */}
          <Card>
            <CardHeader>
              <CardTitle>연락처 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {getApiData().kapt_tel && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-primary" />
                    <span className="text-body2">관리사무소</span>
                  </div>
                  <p className="font-semibold text-h6">{getApiData().kapt_tel}</p>
                </div>
              )}
              
              {getApiData().kapt_fax && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-primary" />
                      <span className="text-body2">팩스</span>
                    </div>
                    <p className="text-body2">{getApiData().kapt_fax}</p>
                  </div>
                </>
              )}

              {getApiData().kapt_url && getApiData().kapt_url.trim() && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-primary" />
                      <span className="text-body2">홈페이지</span>
                    </div>
                    <a 
                      href={getApiData().kapt_url.startsWith('http') ? getApiData().kapt_url : `http://${getApiData().kapt_url}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-body2 text-primary hover:underline"
                    >
                      {getApiData().kapt_url}
                    </a>
                  </div>
                </>
              )}

              <Button variant="cta" className="w-full">
                상담 신청하기
              </Button>
            </CardContent>
          </Card>

          {/* Construction Company Info - 67개 API 필드 활용 */}
          <Card>
            <CardHeader>
              <CardTitle>건설회사 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {getApiData().kapt_bcompany && (
                <div>
                  <div className="text-body2 text-muted-foreground mb-1">시공사</div>
                  <div className="font-semibold text-h6">{getApiData().kapt_bcompany}</div>
                </div>
              )}
              {getApiData().kapt_acompany && (
                <div>
                  <div className="text-body2 text-muted-foreground mb-1">시행사</div>
                  <div className="font-semibold">{getApiData().kapt_acompany}</div>
                </div>
              )}
              <div>
                <div className="text-body2 text-muted-foreground mb-1">지역</div>
                <div>{apartment.region} {apartment.subRegion}</div>
              </div>
              {getApiData().use_yn && (
                <div>
                  <div className="text-body2 text-muted-foreground mb-1">사용여부</div>
                  <Badge variant={getApiData().use_yn === 'Y' ? 'default' : 'secondary'}>
                    {getApiData().use_yn === 'Y' ? '사용중' : '미사용'}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <Button variant="compare" className="w-full">
                비교함에 추가
              </Button>
              <Button variant="bookmark" className="w-full">
                관심목록에 추가
              </Button>
              <Button variant="outline" className="w-full">
                공유하기
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}