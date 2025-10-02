'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button-enhanced';
import { Input } from '@/components/ui/input-enhanced';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

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
    common: {
      cleaning: number;
      guard: number;
      disinfection: number;
      elevator: number;
      repairs: number;
      facility: number;
      vehicle: {
        fuel: number;
        repair: number;
        insurance: number;
        etc: number;
      };
    };
    individual: {
      heat: { supply: number; usage: number };
      hotWater: { supply: number; usage: number };
      electricity: { supply: number; usage: number };
      water: { supply: number; usage: number };
      gas: { supply: number; usage: number };
    };
  };
}

export default function ManagementFeeDemoPage() {
  const [kaptCode, setKaptCode] = useState('A13376906');
  const [year, setYear] = useState(2023);
  const [month, setMonth] = useState(1);
  const [data, setData] = useState<ManagementFeeData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/management-fees/test?kaptCode=${kaptCode}&year=${year}&month=${month}`);

      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error('Error:', err);
      setError('데이터를 가져오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">관리비 정보 조회 시스템</h1>
        <p className="text-muted-foreground">
          공동주택 관리비 정보를 실시간으로 조회할 수 있습니다
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>조회 조건</CardTitle>
          <CardDescription>아파트 코드와 조회 년월을 입력하세요</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">아파트 코드</label>
              <Input
                value={kaptCode}
                onChange={(e) => setKaptCode(e.target.value)}
                placeholder="예: A13376906"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">년도</label>
              <Input
                type="number"
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value))}
                min="2020"
                max="2024"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">월</label>
              <Input
                type="number"
                value={month}
                onChange={(e) => setMonth(parseInt(e.target.value))}
                min="1"
                max="12"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={fetchData} disabled={loading} className="w-full">
                {loading ? '조회 중...' : '조회하기'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-red-200">
          <CardContent className="pt-6">
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {data && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                관리비 정보
                <Badge variant="secondary">
                  {data.year}년 {data.month}월
                </Badge>
              </CardTitle>
              <CardDescription>
                {data.kaptName} ({data.kaptCode})
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-3">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">공용관리비</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatCurrency(data.commonFee)}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">개별사용료</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(data.individualFee)}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">총 관리비</p>
                  <p className="text-3xl font-bold text-primary">
                    {formatCurrency(data.totalFee)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {data.householdCount && (
            <Card className="bg-gradient-to-r from-purple-50 to-blue-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  🏠 세대당 월 평균 관리비
                  <Badge variant="secondary">
                    총 {data.householdCount?.toLocaleString()}세대
                  </Badge>
                </CardTitle>
                <CardDescription>
                  전체 관리비를 세대수로 나눈 평균값
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-3">
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
              </CardContent>
            </Card>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-blue-600">공용관리비 세부내역</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>청소비</span>
                    <span className="font-medium">{formatCurrency(data.details.common.cleaning)}</span>
                  </div>
                  {data.householdCount && (
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span className="ml-4">└ 세대당</span>
                      <span>{formatCurrency(Math.round(data.details.common.cleaning / data.householdCount))}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>경비비</span>
                    <span className="font-medium">{formatCurrency(data.details.common.guard)}</span>
                  </div>
                  {data.householdCount && (
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span className="ml-4">└ 세대당</span>
                      <span>{formatCurrency(Math.round(data.details.common.guard / data.householdCount))}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>소독비</span>
                    <span className="font-medium">{formatCurrency(data.details.common.disinfection)}</span>
                  </div>
                  {data.householdCount && (
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span className="ml-4">└ 세대당</span>
                      <span>{formatCurrency(Math.round(data.details.common.disinfection / data.householdCount))}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>승강기유지비</span>
                    <span className="font-medium">{formatCurrency(data.details.common.elevator)}</span>
                  </div>
                  {data.householdCount && (
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span className="ml-4">└ 세대당</span>
                      <span>{formatCurrency(Math.round(data.details.common.elevator / data.householdCount))}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>수선비</span>
                    <span className="font-medium">{formatCurrency(data.details.common.repairs)}</span>
                  </div>
                  {data.householdCount && (
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span className="ml-4">└ 세대당</span>
                      <span>{formatCurrency(Math.round(data.details.common.repairs / data.householdCount))}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>시설유지비</span>
                    <span className="font-medium">{formatCurrency(data.details.common.facility)}</span>
                  </div>
                  {data.householdCount && (
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span className="ml-4">└ 세대당</span>
                      <span>{formatCurrency(Math.round(data.details.common.facility / data.householdCount))}</span>
                    </div>
                  )}
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-blue-600">
                  <span>공용관리비 합계</span>
                  <span>{formatCurrency(data.commonFee)}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-green-600">개별사용료 세부내역</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {(() => {
                  const zeroItems = [];

                  // 0원인 항목들을 수집
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

                  return (
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>전기료 (공급)</span>
                            <span>{formatCurrency(data.details.individual.electricity.supply)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>전기료 (사용)</span>
                            <span>{formatCurrency(data.details.individual.electricity.usage)}</span>
                          </div>
                        </div>
                        {data.householdCount && (
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span className="ml-4">└ 전기료 세대당 합계</span>
                            <span>{formatCurrency(Math.round((data.details.individual.electricity.supply + data.details.individual.electricity.usage) / data.householdCount))}</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>수도료 (공급)</span>
                            <span>{formatCurrency(data.details.individual.water.supply)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>수도료 (사용)</span>
                            <span>{formatCurrency(data.details.individual.water.usage)}</span>
                          </div>
                        </div>
                        {data.householdCount && (
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span className="ml-4">└ 수도료 세대당 합계</span>
                            <span>{formatCurrency(Math.round((data.details.individual.water.supply + data.details.individual.water.usage) / data.householdCount))}</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>난방비 (공급)</span>
                            <span>{formatCurrency(data.details.individual.heat.supply)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>난방비 (사용)</span>
                            <span>{formatCurrency(data.details.individual.heat.usage)}</span>
                          </div>
                        </div>
                        {data.householdCount && (
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span className="ml-4">└ 난방비 세대당 합계</span>
                            <span>{formatCurrency(Math.round((data.details.individual.heat.supply + data.details.individual.heat.usage) / data.householdCount))}</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>급탕비 (공급)</span>
                            <span>{formatCurrency(data.details.individual.hotWater.supply)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>급탕비 (사용)</span>
                            <span>{formatCurrency(data.details.individual.hotWater.usage)}</span>
                          </div>
                        </div>
                        {data.householdCount && (
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span className="ml-4">└ 급탕비 세대당 합계</span>
                            <span>{formatCurrency(Math.round((data.details.individual.hotWater.supply + data.details.individual.hotWater.usage) / data.householdCount))}</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>가스비 (공급)</span>
                            <span>{formatCurrency(data.details.individual.gas.supply)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>가스비 (사용)</span>
                            <span>{formatCurrency(data.details.individual.gas.usage)}</span>
                          </div>
                        </div>
                        {data.householdCount && (
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span className="ml-4">└ 가스비 세대당 합계</span>
                            <span>{formatCurrency(Math.round((data.details.individual.gas.supply + data.details.individual.gas.usage) / data.householdCount))}</span>
                          </div>
                        )}
                      </div>

                      {zeroItems.length > 0 && (
                        <div className="mt-3 p-2 bg-gray-50 rounded text-xs text-gray-600">
                          ⚠️ {zeroItems.join(', ')} 제외 (0원 항목)
                        </div>
                      )}

                      <Separator />
                      <div className="flex justify-between font-bold text-green-600">
                        <span>개별사용료 합계</span>
                        <span>{formatCurrency(data.individualFee)}</span>
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </div>

          <Card className="bg-gradient-to-r from-blue-50 to-green-50">
            <CardHeader>
              <CardTitle>📊 요약 정보</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {data.kaptName}의 {data.year}년 {data.month}월 총 관리비
                  </p>
                  <p className="text-4xl font-bold text-primary">
                    {formatCurrency(data.totalFee)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    공용관리비: {Math.round((data.commonFee / data.totalFee) * 100)}% |
                    개별사용료: {Math.round((data.individualFee / data.totalFee) * 100)}%
                  </p>
                </div>

                {data.householdCount && data.perHouseholdFee.total && (
                  <div className="border-t pt-4">
                    <p className="text-sm text-muted-foreground">
                      세대당 월 평균 관리비 ({data.householdCount.toLocaleString()}세대 기준)
                    </p>
                    <p className="text-3xl font-bold text-purple-600">
                      {formatCurrency(data.perHouseholdFee.total)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      공용: {data.perHouseholdFee.common ? formatCurrency(data.perHouseholdFee.common) : 'N/A'} |
                      개별: {data.perHouseholdFee.individual ? formatCurrency(data.perHouseholdFee.individual) : 'N/A'}
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

                        return zeroItems.length > 0 ? ` (${zeroItems.join(', ')} 제외)` : '';
                      })()}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="bg-yellow-50">
        <CardContent className="pt-6">
          <div className="text-sm text-yellow-800">
            <p className="font-medium mb-2">💡 테스트 가능한 아파트 코드:</p>
            <ul className="space-y-1">
              <li>• A13376906 - 응봉대림강변 (관리비 데이터 풍부)</li>
              <li>• 다른 아파트 코드도 입력해보세요!</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}