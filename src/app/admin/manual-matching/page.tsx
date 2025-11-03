'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Search, Link2, MapPin, Calendar, Home, DollarSign, Loader2, Check, X } from 'lucide-react';

interface Transaction {
  id: string;
  transaction_type: 'trade' | 'rent';
  apartment_name: string;
  deal_date: string;
  deal_amount?: number;
  deposit_amount?: number;
  monthly_rent?: number;
  exclusive_area?: number;
  legal_dong?: string;
  jibun?: string;
  region_code: string;
}

interface Complex {
  id: string;
  name: string;
  address: string;
  road_address?: string;
  kapt_code: string;
  ho_cnt?: number;
  legal_dong?: string;
  sigungu?: string;
  similarity_score?: number; // 유사도 점수
}

export default function ManualMatchingPage() {
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [offset, setOffset] = useState(0);
  const [transactionType, setTransactionType] = useState<string>('all');

  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [searchComplexes, setSearchComplexes] = useState<Complex[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [matchingLoading, setMatchingLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [autoMatching, setAutoMatching] = useState(false);
  const [autoMatchResults, setAutoMatchResults] = useState<any>(null);

  const limit = 50;
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 미매칭 거래 데이터 조회
  const fetchUnmatchedTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        type: transactionType,
        limit: limit.toString(),
        offset: offset.toString(),
      });

      const response = await fetch(`/api/admin/unmatched-transactions?${params}`);
      const result = await response.json();

      if (result.success) {
        setTransactions(result.data.transactions);
        setTotalCount(result.data.total);
      } else {
        toast({
          variant: 'destructive',
          title: '데이터 조회 실패',
          description: result.error || '미매칭 거래 데이터를 불러올 수 없습니다.'
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: '오류 발생',
        description: '데이터를 불러오는 중 오류가 발생했습니다.'
      });
    } finally {
      setLoading(false);
    }
  }, [transactionType, offset, toast]);

  useEffect(() => {
    fetchUnmatchedTransactions();
  }, [fetchUnmatchedTransactions]);

  // 단지 검색 (실시간)
  const performSearch = useCallback(async (query: string) => {
    if (!query || query.trim().length < 2) {
      setSearchComplexes([]);
      return;
    }

    setSearchLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('q', query.trim());

      // 지역 코드만 참고용으로 전달 (필터링은 느슨하게)
      if (selectedTransaction?.region_code) {
        params.append('regionCode', selectedTransaction.region_code);
      }

      // legal_dong 필터는 제거 - 검색어 중심으로 결과 표시

      const response = await fetch(`/api/admin/search-complexes?${params}`);
      const result = await response.json();

      if (result.success) {
        setSearchComplexes(result.data.complexes);
      }
    } catch (error) {
      console.error('단지 검색 오류:', error);
    } finally {
      setSearchLoading(false);
    }
  }, [selectedTransaction]);

  // 검색어 변경 시 자동 검색 (debounced)
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      if (searchQuery) {
        performSearch(searchQuery);
      } else {
        setSearchComplexes([]);
      }
    }, 500); // 500ms debounce

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, performSearch]);

  // 매칭 실행
  const handleMatch = async (complexId: string) => {
    if (!selectedTransaction) return;

    setMatchingLoading(true);
    try {
      const response = await fetch('/api/admin/match-transaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactionId: selectedTransaction.id,
          transactionType: selectedTransaction.transaction_type,
          complexId: complexId,
        }),
      });

      const result = await response.json();

      if (result.success) {
        const { matchedCount, apartmentName, complex } = result.data;
        toast({
          title: '매칭 완료 ✅',
          description: (
            <div className="space-y-1">
              <p className="font-semibold">{apartmentName}</p>
              <p className="text-sm">
                총 <span className="font-bold text-green-600">{matchedCount}건</span>이 "{complex.name}" 단지와 연결되었습니다.
              </p>
            </div>
          ),
        });

        // 목록 새로고침
        fetchUnmatchedTransactions();

        // 다이얼로그 닫기
        closeMatchDialog();
      } else {
        toast({
          variant: 'destructive',
          title: '매칭 실패',
          description: result.error || '매칭에 실패했습니다.'
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: '오류 발생',
        description: '매칭 중 오류가 발생했습니다.'
      });
    } finally {
      setMatchingLoading(false);
    }
  };

  // 거래 선택
  const openMatchDialog = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setSearchQuery(transaction.apartment_name || '');
    setSearchComplexes([]);
    setDialogOpen(true);
  };

  // 다이얼로그 닫기
  const closeMatchDialog = () => {
    setDialogOpen(false);
    setSelectedTransaction(null);
    setSearchQuery('');
    setSearchComplexes([]);
  };

  // 금액 포맷
  const formatAmount = (amount?: number) => {
    if (!amount) return '-';
    if (amount >= 10000) {
      return `${(amount / 10000).toFixed(1)}억`;
    }
    return `${amount.toLocaleString()}만원`;
  };

  // 자동 매칭 실행
  const handleAutoMatch = async () => {
    setAutoMatching(true);
    setAutoMatchResults(null);

    try {
      const response = await fetch('/api/admin/auto-match', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          threshold: 70, // 70점 이상만 자동 매칭
          batchSize: 200, // 한 배치당 200건
          maxBatches: 50 // 최대 50개 배치 (총 10,000건까지)
        }),
      });

      const result = await response.json();

      if (result.success) {
        setAutoMatchResults(result.data);
        toast({
          title: '자동 매칭 완료 ✅',
          description: (
            <div className="space-y-1">
              <p>총 {result.data.totalProcessed}건 중 <span className="font-bold text-green-600">{result.data.matched}건</span>이 자동 매칭되었습니다.</p>
              {result.data.failed > 0 && (
                <p className="text-sm text-amber-600">실패: {result.data.failed}건</p>
              )}
            </div>
          ),
        });

        // 목록 새로고침
        fetchUnmatchedTransactions();
      } else {
        toast({
          variant: 'destructive',
          title: '자동 매칭 실패',
          description: result.error || '자동 매칭에 실패했습니다.'
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: '오류 발생',
        description: '자동 매칭 중 오류가 발생했습니다.'
      });
    } finally {
      setAutoMatching(false);
    }
  };

  // 매칭 실패 표시
  const handleMarkFailed = async (transaction: Transaction) => {
    try {
      const response = await fetch('/api/admin/mark-match-failed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactionId: transaction.id,
          transactionType: transaction.transaction_type,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: '매칭 실패 처리 완료',
          description: '해당 거래가 목록 뒤로 이동되었습니다.',
        });

        // 목록 새로고침
        fetchUnmatchedTransactions();
      } else {
        toast({
          variant: 'destructive',
          title: '처리 실패',
          description: result.error || '매칭 실패 표시에 실패했습니다.'
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: '오류 발생',
        description: '매칭 실패 처리 중 오류가 발생했습니다.'
      });
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">수동 매칭 관리</h1>
        <p className="text-muted-foreground">
          단지 정보와 연결되지 않은 거래 데이터를 수동으로 연결합니다.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>필터 및 자동 매칭</CardTitle>
          <CardDescription>거래 유형을 선택하거나 자동 매칭을 실행하세요</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 items-center">
            <Select value={transactionType} onValueChange={(value) => {
              setTransactionType(value);
              setOffset(0);
            }}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="거래 유형" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="trade">매매</SelectItem>
                <SelectItem value="rent">전월세</SelectItem>
              </SelectContent>
            </Select>

            <Button
              onClick={handleAutoMatch}
              disabled={autoMatching || loading}
              variant="default"
              className="gap-2"
            >
              {autoMatching ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  자동 매칭 중...
                </>
              ) : (
                <>
                  <Link2 className="h-4 w-4" />
                  자동 매칭 실행
                </>
              )}
            </Button>

            <div className="flex-1" />

            <div className="text-sm text-muted-foreground">
              총 <span className="font-bold text-foreground">{totalCount.toLocaleString()}</span>건
            </div>
          </div>

          <div className="text-xs text-muted-foreground bg-blue-50 p-3 rounded-lg">
            <p className="font-semibold mb-1">💡 자동 매칭 정보</p>
            <p>• <strong>읍면동과 번지 일치를 기준</strong>으로 거래를 자동으로 단지와 연결합니다.</p>
            <p>• 매칭 점수: 읍면동 일치 40점 + 번지 일치 50점 + 단지명 유사도 10점</p>
            <p>• 유사도 70점 이상만 자동 매칭 (읍면동 같고 본번 일치하면 85점 이상)</p>
            <p>• 한 번에 최대 10,000건까지 배치 처리 (200건 × 50배치)</p>
          </div>

          {autoMatchResults && (
            <div className="bg-green-50 p-4 rounded-lg space-y-2">
              <p className="font-semibold text-green-800">자동 매칭 결과</p>
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">처리:</span>
                  <span className="ml-2 font-semibold">{autoMatchResults.totalProcessed}건</span>
                </div>
                <div>
                  <span className="text-muted-foreground">성공:</span>
                  <span className="ml-2 font-semibold text-green-600">{autoMatchResults.matched}건</span>
                </div>
                <div>
                  <span className="text-muted-foreground">실패:</span>
                  <span className="ml-2 font-semibold text-red-600">{autoMatchResults.failed}건</span>
                </div>
                <div>
                  <span className="text-muted-foreground">배치:</span>
                  <span className="ml-2 font-semibold text-blue-600">{autoMatchResults.batchesProcessed}개</span>
                </div>
              </div>
              {autoMatchResults.complexStats && autoMatchResults.complexStats.length > 0 && (
                <div className="mt-3 pt-3 border-t border-green-200">
                  <p className="text-xs font-semibold mb-2">매칭된 단지 (상위 5개)</p>
                  <div className="space-y-1 text-xs">
                    {autoMatchResults.complexStats.slice(0, 5).map((stat: any, idx: number) => (
                      <div key={idx} className="flex justify-between">
                        <span>{stat.complexName}</span>
                        <span className="font-semibold">{stat.count}건</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>미매칭 거래 목록</CardTitle>
          <CardDescription>
            {offset + 1} - {Math.min(offset + limit, totalCount)} / {totalCount}건
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              미매칭 거래 데이터가 없습니다.
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((transaction) => (
                <Card key={transaction.id} className="hover:bg-accent/50 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <Home className="h-4 w-4 text-muted-foreground" />
                          <span className="font-semibold text-lg">
                            {transaction.apartment_name}
                          </span>
                          <Badge variant={transaction.transaction_type === 'trade' ? 'default' : 'secondary'}>
                            {transaction.transaction_type === 'trade' ? '매매' : '전월세'}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            <span>
                              {transaction.legal_dong} {transaction.jibun}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>{transaction.deal_date}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <DollarSign className="h-3 w-3" />
                            <span>
                              {transaction.transaction_type === 'trade'
                                ? formatAmount(transaction.deal_amount)
                                : `보증금 ${formatAmount(transaction.deposit_amount)}${
                                    transaction.monthly_rent ? ` / 월세 ${transaction.monthly_rent}만원` : ''
                                  }`}
                            </span>
                          </div>
                          <div className="text-muted-foreground">
                            전용면적: {transaction.exclusive_area}㎡
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={() => openMatchDialog(transaction)}
                          variant="outline"
                          size="sm"
                        >
                          <Link2 className="h-4 w-4 mr-2" />
                          매칭
                        </Button>
                        <Button
                          onClick={() => handleMarkFailed(transaction)}
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <X className="h-4 w-4 mr-2" />
                          매칭 실패
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {!loading && totalCount > limit && (
            <div className="flex justify-center gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setOffset(Math.max(0, offset - limit))}
                disabled={offset === 0}
              >
                이전
              </Button>
              <Button
                variant="outline"
                onClick={() => setOffset(offset + limit)}
                disabled={offset + limit >= totalCount}
              >
                다음
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 매칭 다이얼로그 */}
      <Dialog open={dialogOpen} onOpenChange={(open) => !open && closeMatchDialog()}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>단지 정보 연결</DialogTitle>
            <DialogDescription>
              거래 데이터와 연결할 단지를 검색하여 선택하세요
            </DialogDescription>
          </DialogHeader>

          {selectedTransaction && (
            <div className="space-y-4">
              {/* 선택된 거래 정보 */}
              <Card className="bg-accent/50">
                <CardContent className="p-4">
                  <div className="font-semibold mb-2">{selectedTransaction.apartment_name}</div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div>위치: {selectedTransaction.legal_dong} {selectedTransaction.jibun}</div>
                    <div>거래일: {selectedTransaction.deal_date}</div>
                    <div>지역코드: {selectedTransaction.region_code}</div>
                  </div>
                </CardContent>
              </Card>

              {/* 검색 */}
              <div className="space-y-2">
                <div className="relative">
                  <Input
                    placeholder="단지 이름 또는 주소로 검색 (2글자 이상)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pr-10"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {searchLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    ) : (
                      <Search className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  검색어를 입력하면 자동으로 단지를 검색합니다
                </p>
              </div>

              {/* 검색 결과 */}
              <div className="space-y-2">
                {/* 안내 메시지 */}
                {searchQuery.trim().length === 0 && (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    단지 이름 또는 주소를 입력하여 검색하세요
                  </div>
                )}

                {searchQuery.trim().length > 0 && searchQuery.trim().length < 2 && (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    검색어를 2글자 이상 입력해주세요
                  </div>
                )}

                {/* 검색 결과 헤더 */}
                {searchQuery.trim().length >= 2 && searchComplexes.length > 0 && (
                  <div className="text-sm font-semibold">
                    검색 결과 ({searchComplexes.length}개)
                  </div>
                )}

                {/* 결과 없음 */}
                {searchQuery.trim().length >= 2 && !searchLoading && searchComplexes.length === 0 && (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    <p>검색 결과가 없습니다</p>
                    <p className="text-xs mt-2">
                      다른 검색어를 시도하거나 지역/법정동 정보를 확인해주세요
                    </p>
                  </div>
                )}

                {/* 검색 결과 목록 */}
                {searchComplexes.map((complex, index) => (
                  <Card
                    key={complex.id}
                    className={`hover:bg-accent/50 cursor-pointer transition-colors ${
                      complex.similarity_score && complex.similarity_score >= 70
                        ? 'border-green-500 border-2'
                        : complex.similarity_score && complex.similarity_score >= 50
                        ? 'border-blue-500'
                        : ''
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{complex.name}</span>
                            {complex.similarity_score !== undefined && (
                              <Badge
                                variant={
                                  complex.similarity_score >= 70
                                    ? 'default'
                                    : complex.similarity_score >= 50
                                    ? 'secondary'
                                    : 'outline'
                                }
                              >
                                {complex.similarity_score >= 70 ? '높은 유사도' :
                                 complex.similarity_score >= 50 ? '중간 유사도' :
                                 '낮은 유사도'} ({Math.round(complex.similarity_score)}점)
                              </Badge>
                            )}
                            {index === 0 && complex.similarity_score && complex.similarity_score >= 70 && (
                              <Badge variant="default" className="bg-green-600">
                                추천
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground space-y-0.5">
                            <div>지번: {complex.address}</div>
                            {complex.road_address && (
                              <div>도로명: {complex.road_address}</div>
                            )}
                            <div className="flex gap-4">
                              <span>단지코드: {complex.kapt_code}</span>
                              {complex.ho_cnt && (
                                <span>세대수: {complex.ho_cnt.toLocaleString()}세대</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <Button
                          onClick={() => handleMatch(complex.id)}
                          disabled={matchingLoading}
                          size="sm"
                          variant={index === 0 && complex.similarity_score && complex.similarity_score >= 70 ? 'default' : 'outline'}
                        >
                          {matchingLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Check className="h-4 w-4 mr-2" />
                              선택
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={closeMatchDialog}>
              취소
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
