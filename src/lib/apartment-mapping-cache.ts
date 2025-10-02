// 아파트 매핑 캐시 시스템

interface CachedMapping {
  apartmentName: string;
  address?: string;
  bjdCode?: string;
  kaptCode: string;
  confidence: 'high' | 'medium' | 'low';
  matchReason: string;
  createdAt: Date;
  lastUsedAt: Date;
  useCount: number;
}

interface CacheStats {
  totalEntries: number;
  hitRate: number;
  averageConfidence: string;
  oldestEntry?: Date;
  newestEntry?: Date;
}

export class ApartmentMappingCache {
  private cache = new Map<string, CachedMapping>();
  private readonly maxCacheSize: number;
  private readonly maxCacheAge: number; // milliseconds
  private hits = 0;
  private misses = 0;

  constructor(maxCacheSize = 10000, maxCacheAgeHours = 24) {
    this.maxCacheSize = maxCacheSize;
    this.maxCacheAge = maxCacheAgeHours * 60 * 60 * 1000;
    
    // 브라우저 환경에서 로컬스토리지에서 캐시 복원
    if (typeof window !== 'undefined') {
      this.loadFromLocalStorage();
    }
  }

  /**
   * 캐시 키를 생성합니다
   */
  private generateCacheKey(apartmentName: string, address?: string, bjdCode?: string): string {
    const normalizedName = apartmentName.replace(/\s+/g, '').toLowerCase();
    const normalizedAddress = address?.replace(/\s+/g, '').toLowerCase() || '';
    const code = bjdCode || '';
    
    return `${normalizedName}|${normalizedAddress}|${code}`;
  }

  /**
   * 캐시에서 매핑을 조회합니다
   */
  get(apartmentName: string, address?: string, bjdCode?: string): CachedMapping | null {
    const key = this.generateCacheKey(apartmentName, address, bjdCode);
    const cached = this.cache.get(key);

    if (!cached) {
      this.misses++;
      return null;
    }

    // 만료된 항목 확인
    if (Date.now() - cached.createdAt.getTime() > this.maxCacheAge) {
      this.cache.delete(key);
      this.misses++;
      return null;
    }

    // 사용 통계 업데이트
    cached.lastUsedAt = new Date();
    cached.useCount++;
    this.hits++;

    return cached;
  }

  /**
   * 캐시에 매핑을 저장합니다
   */
  set(
    apartmentName: string,
    kaptCode: string,
    confidence: 'high' | 'medium' | 'low',
    matchReason: string,
    address?: string,
    bjdCode?: string
  ): void {
    const key = this.generateCacheKey(apartmentName, address, bjdCode);
    
    const mapping: CachedMapping = {
      apartmentName,
      address,
      bjdCode,
      kaptCode,
      confidence,
      matchReason,
      createdAt: new Date(),
      lastUsedAt: new Date(),
      useCount: 1
    };

    this.cache.set(key, mapping);

    // 캐시 크기 제한
    if (this.cache.size > this.maxCacheSize) {
      this.evictOldEntries();
    }

    // 로컬스토리지에 저장 (브라우저 환경)
    if (typeof window !== 'undefined') {
      this.saveToLocalStorage();
    }
  }

  /**
   * 오래된 항목들을 제거합니다 (LRU 방식)
   */
  private evictOldEntries(): void {
    const entries = Array.from(this.cache.entries());
    
    // 마지막 사용 시간 기준으로 정렬
    entries.sort((a, b) => a[1].lastUsedAt.getTime() - b[1].lastUsedAt.getTime());
    
    // 오래된 항목 25% 제거
    const entriesToRemove = Math.floor(entries.length * 0.25);
    for (let i = 0; i < entriesToRemove; i++) {
      this.cache.delete(entries[i][0]);
    }
  }

  /**
   * 특정 조건에 맞는 항목들을 찾습니다
   */
  findSimilar(apartmentName: string, threshold = 0.7): CachedMapping[] {
    const results: CachedMapping[] = [];
    const normalizedTarget = apartmentName.replace(/\s+/g, '').toLowerCase();

    for (const mapping of this.cache.values()) {
      const normalizedCached = mapping.apartmentName.replace(/\s+/g, '').toLowerCase();
      
      // 간단한 문자열 유사도 계산
      const similarity = this.calculateStringSimilarity(normalizedTarget, normalizedCached);
      
      if (similarity >= threshold) {
        results.push(mapping);
      }
    }

    return results.sort((a, b) => b.useCount - a.useCount);
  }

  /**
   * 문자열 유사도를 계산합니다 (Levenshtein distance 기반)
   */
  private calculateStringSimilarity(str1: string, str2: string): number {
    const len1 = str1.length;
    const len2 = str2.length;
    
    if (len1 === 0) return len2 === 0 ? 1 : 0;
    if (len2 === 0) return 0;

    const matrix: number[][] = [];

    for (let i = 0; i <= len2; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= len1; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= len2; i++) {
      for (let j = 1; j <= len1; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    const maxLen = Math.max(len1, len2);
    return (maxLen - matrix[len2][len1]) / maxLen;
  }

  /**
   * 캐시 통계를 반환합니다
   */
  getStats(): CacheStats {
    const entries = Array.from(this.cache.values());
    const totalRequests = this.hits + this.misses;
    
    const confidenceCounts = entries.reduce(
      (acc, entry) => {
        acc[entry.confidence]++;
        return acc;
      },
      { high: 0, medium: 0, low: 0 }
    );

    const avgConfidence = 
      confidenceCounts.high > confidenceCounts.medium + confidenceCounts.low ? 'high' :
      confidenceCounts.medium > confidenceCounts.low ? 'medium' : 'low';

    return {
      totalEntries: this.cache.size,
      hitRate: totalRequests > 0 ? this.hits / totalRequests : 0,
      averageConfidence: avgConfidence,
      oldestEntry: entries.length > 0 ? 
        new Date(Math.min(...entries.map(e => e.createdAt.getTime()))) : undefined,
      newestEntry: entries.length > 0 ? 
        new Date(Math.max(...entries.map(e => e.createdAt.getTime()))) : undefined
    };
  }

  /**
   * 캐시를 초기화합니다
   */
  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem('apartmentMappingCache');
    }
  }

  /**
   * 특정 신뢰도 이하의 항목들을 제거합니다
   */
  pruneByConfidence(minConfidence: 'high' | 'medium' | 'low'): void {
    const confidenceOrder = { low: 0, medium: 1, high: 2 };
    const minLevel = confidenceOrder[minConfidence];

    for (const [key, mapping] of this.cache.entries()) {
      if (confidenceOrder[mapping.confidence] < minLevel) {
        this.cache.delete(key);
      }
    }

    if (typeof window !== 'undefined') {
      this.saveToLocalStorage();
    }
  }

  /**
   * 로컬스토리지에서 캐시를 복원합니다
   */
  private loadFromLocalStorage(): void {
    try {
      const stored = localStorage.getItem('apartmentMappingCache');
      if (stored) {
        const data = JSON.parse(stored);
        
        for (const [key, value] of Object.entries(data.cache || {})) {
          const mapping = value as any;
          mapping.createdAt = new Date(mapping.createdAt);
          mapping.lastUsedAt = new Date(mapping.lastUsedAt);
          this.cache.set(key, mapping);
        }
        
        this.hits = data.hits || 0;
        this.misses = data.misses || 0;
      }
    } catch (error) {
      console.warn('캐시 복원 실패:', error);
    }
  }

  /**
   * 로컬스토리지에 캐시를 저장합니다
   */
  private saveToLocalStorage(): void {
    try {
      const data = {
        cache: Object.fromEntries(this.cache),
        hits: this.hits,
        misses: this.misses,
        lastSaved: new Date().toISOString()
      };
      
      localStorage.setItem('apartmentMappingCache', JSON.stringify(data));
    } catch (error) {
      console.warn('캐시 저장 실패:', error);
    }
  }

  /**
   * 캐시를 JSON으로 내보냅니다
   */
  export(): string {
    const data = {
      cache: Object.fromEntries(this.cache),
      stats: this.getStats(),
      exportedAt: new Date().toISOString()
    };
    
    return JSON.stringify(data, null, 2);
  }

  /**
   * JSON에서 캐시를 가져옵니다
   */
  import(jsonData: string): void {
    try {
      const data = JSON.parse(jsonData);
      
      this.clear();
      
      for (const [key, value] of Object.entries(data.cache || {})) {
        const mapping = value as any;
        mapping.createdAt = new Date(mapping.createdAt);
        mapping.lastUsedAt = new Date(mapping.lastUsedAt);
        this.cache.set(key, mapping);
      }
    } catch (error) {
      console.error('캐시 가져오기 실패:', error);
      throw error;
    }
  }
}

// 싱글톤 인스턴스
export const apartmentMappingCache = new ApartmentMappingCache();