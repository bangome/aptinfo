'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface ManagementFeeData {
  kaptCode: string;
  kaptName: string;
  year: number;
  month: number;
  commonFee: number;
  individualFee: number;
  totalFee: number;
  householdCount: number | null;
  perHouseholdFee: {
    common: number | null;
    individual: number | null;
    total: number | null;
  };
  details: {
    individual: {
      heat: { supply: number; usage: number };
      hotWater: { supply: number; usage: number };
      electricity: { supply: number; usage: number };
      water: { supply: number; usage: number };
      gas: { supply: number; usage: number };
    };
  };
}

interface ManagementFeeCardProps {
  kaptCode: string;
  kaptName?: string;
}

export function ManagementFeeCard({ kaptCode, kaptName }: ManagementFeeCardProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ManagementFeeData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchManagementFeeData();
  }, [kaptCode]);

  const fetchManagementFeeData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 작년 데이터 가져오기
      const lastYear = new Date().getFullYear() - 1;

      // 테스트 API Route를 통해 서버 사이드에서 데이터 가져오기 (단일 월)
      const response = await fetch(`/api/management-fees/test?kaptCode=${kaptCode}&year=${lastYear}&month=1`);

      if (!response.ok) {
        throw new Error('Failed to fetch management fee data');
      }

      const fetchedData = await response.json();

      if (!fetchedData || fetchedData.totalFee === 0) {
        setError('관리비 데이터를 찾을 수 없습니다.');
      } else {
        setData(fetchedData);
      }
    } catch (err) {
      console.error('관리비 데이터 조회 오류:', err);
      setError('관리비 데이터 조회 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>관리비 정보</CardTitle>
          <CardDescription>로딩 중...</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>관리비 정보</CardTitle>
          <CardDescription className="text-red-500">{error}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          💰 관리비 정보
          <Badge variant="secondary">
            {data.year}년 {data.month}월
          </Badge>
        </CardTitle>
        <CardDescription>
          월 평균 관리비 정보 ({data.kaptName})
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.householdCount && (
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <h3 className="font-semibold text-lg">🏠 세대당 월 평균 관리비</h3>
              <Badge variant="secondary">
                총 {data.householdCount?.toLocaleString()}세대
              </Badge>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">세대당 공용관리비</p>
                <p className="text-2xl font-bold text-blue-600">
                  {data.perHouseholdFee.common ? formatCurrency(data.perHouseholdFee.common) : 'N/A'}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">세대당 개별사용료</p>
                <p className="text-2xl font-bold text-green-600">
                  {data.perHouseholdFee.individual ? formatCurrency(data.perHouseholdFee.individual) : 'N/A'}
                </p>
                {(() => {
                  const zeroItems = [];
                  if ((data.details.individual.electricity.supply + data.details.individual.electricity.usage) === 0) {
                    zeroItems.push('전기료');
                  }
                  if ((data.details.individual.water.supply + data.details.individual.water.usage) === 0) {
                    zeroItems.push('수도료');
                  }
                  if ((data.details.individual.heat.supply + data.details.individual.heat.usage) === 0) {
                    zeroItems.push('난방비');
                  }
                  if ((data.details.individual.hotWater.supply + data.details.individual.hotWater.usage) === 0) {
                    zeroItems.push('급탕비');
                  }
                  if ((data.details.individual.gas.supply + data.details.individual.gas.usage) === 0) {
                    zeroItems.push('가스비');
                  }

                  return zeroItems.length > 0 ? (
                    <p className="text-xs text-muted-foreground">
                      {zeroItems.join(', ')} 제외
                    </p>
                  ) : null;
                })()}
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">세대당 총 관리비</p>
                <p className="text-3xl font-bold text-purple-600">
                  {data.perHouseholdFee.total ? formatCurrency(data.perHouseholdFee.total) : 'N/A'}
                </p>
              </div>
            </div>

            <div className="mt-4 text-center">
              <p className="text-xs text-muted-foreground">
                💡 이는 평균값으로, 실제 세대별 관리비는 평형, 층수, 사용량에 따라 달라질 수 있습니다
              </p>
            </div>
          </div>
        )}

        {!data.householdCount && (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">공용관리비</p>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(data.commonFee)}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">개별사용료</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(data.individualFee)}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">총 관리비</p>
                <p className="text-3xl font-bold text-primary">{formatCurrency(data.totalFee)}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              세대수 정보가 없어 전체 관리비만 표시됩니다
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}