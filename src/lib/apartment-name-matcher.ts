// 아파트명 정규화 및 매칭 유틸리티

interface NormalizedApartmentName {
  original: string;
  normalized: string;
  keywords: string[];
  address?: string;
}

interface MatchResult {
  score: number;
  confidence: 'high' | 'medium' | 'low';
  reason: string;
}

export class ApartmentNameMatcher {
  private static readonly COMMON_SUFFIXES = [
    '아파트', '타워', '빌라', '맨션', '하우스', '단지', '프라자', '센터',
    '펜트하우스', '오피스텔', '더샵', '래미안', '힐스테이트', '위브', '자이',
    '푸르지오', '센트럴', '스카이', '팰리스', '그랜드', '로얄', '프리미엄'
  ];

  private static readonly REGION_KEYWORDS = [
    '강남', '강북', '강서', '강동', '서초', '송파', '마포', '용산', '성동', '광진',
    '동대문', '중랑', '성북', '도봉', '노원', '은평', '서대문', '종로', '중구',
    '영등포', '동작', '관악', '금천', '구로', '양천', '강서'
  ];

  /**
   * 아파트명을 정규화합니다
   */
  static normalizeApartmentName(name: string): NormalizedApartmentName {
    if (!name) {
      return {
        original: '',
        normalized: '',
        keywords: []
      };
    }

    const original = name.trim();
    let normalized = original;

    // 1. 특수문자 제거 및 공백 정리
    normalized = normalized
      .replace(/[^\w가-힣\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // 2. 일반적인 접미사 제거
    const suffixPattern = new RegExp(`(${this.COMMON_SUFFIXES.join('|')})$`, 'i');
    const withoutSuffix = normalized.replace(suffixPattern, '').trim();

    // 3. 키워드 추출
    const keywords = this.extractKeywords(withoutSuffix || normalized);

    return {
      original,
      normalized: withoutSuffix || normalized,
      keywords
    };
  }

  /**
   * 키워드를 추출합니다
   */
  private static extractKeywords(text: string): string[] {
    const words = text.split(/\s+/).filter(word => word.length > 1);
    const keywords: string[] = [];

    // 전체 텍스트 추가
    keywords.push(text);

    // 개별 단어 추가
    words.forEach(word => {
      keywords.push(word);
      
      // 2글자 이상의 부분 문자열 추가
      if (word.length >= 3) {
        for (let i = 0; i <= word.length - 2; i++) {
          for (let j = i + 2; j <= word.length; j++) {
            keywords.push(word.substring(i, j));
          }
        }
      }
    });

    // 중복 제거 및 정렬
    return [...new Set(keywords)].sort((a, b) => b.length - a.length);
  }

  /**
   * 두 아파트명의 유사도를 계산합니다
   */
  static calculateSimilarity(name1: string, name2: string, address1?: string, address2?: string): MatchResult {
    const norm1 = this.normalizeApartmentName(name1);
    const norm2 = this.normalizeApartmentName(name2);

    let score = 0;
    let reasons: string[] = [];

    // 1. 정확히 일치하는 경우
    if (norm1.normalized === norm2.normalized) {
      return {
        score: 1.0,
        confidence: 'high',
        reason: '정규화된 아파트명이 정확히 일치'
      };
    }

    // 2. 키워드 매칭 점수
    const keywordScore = this.calculateKeywordScore(norm1.keywords, norm2.keywords);
    score += keywordScore * 0.7;
    
    if (keywordScore > 0.5) {
      reasons.push(`키워드 매칭 점수: ${(keywordScore * 100).toFixed(1)}%`);
    }

    // 3. 주소 기반 검증 (제공된 경우)
    if (address1 && address2) {
      const addressScore = this.calculateAddressScore(address1, address2);
      score += addressScore * 0.3;
      
      if (addressScore > 0.3) {
        reasons.push(`주소 매칭 점수: ${(addressScore * 100).toFixed(1)}%`);
      }
    }

    // 4. 길이 기반 보정
    const lengthPenalty = Math.abs(norm1.normalized.length - norm2.normalized.length) / 
                         Math.max(norm1.normalized.length, norm2.normalized.length);
    score = score * (1 - lengthPenalty * 0.1);

    // 5. 신뢰도 결정
    let confidence: 'high' | 'medium' | 'low';
    if (score >= 0.8) {
      confidence = 'high';
    } else if (score >= 0.5) {
      confidence = 'medium';
    } else {
      confidence = 'low';
    }

    return {
      score: Math.min(1.0, Math.max(0.0, score)),
      confidence,
      reason: reasons.join(', ') || '매칭 점수가 낮음'
    };
  }

  /**
   * 키워드 매칭 점수를 계산합니다
   */
  private static calculateKeywordScore(keywords1: string[], keywords2: string[]): number {
    if (keywords1.length === 0 || keywords2.length === 0) {
      return 0;
    }

    let matchedLength = 0;
    let totalLength = Math.max(
      keywords1[0].length, // 가장 긴 키워드 (원본)
      keywords2[0].length
    );

    // 각 키워드에 대해 최적 매칭 찾기
    for (const keyword1 of keywords1) {
      for (const keyword2 of keywords2) {
        if (keyword1.includes(keyword2) || keyword2.includes(keyword1)) {
          const matchLength = Math.min(keyword1.length, keyword2.length);
          matchedLength = Math.max(matchedLength, matchLength);
        }
      }
    }

    return totalLength > 0 ? matchedLength / totalLength : 0;
  }

  /**
   * 주소 매칭 점수를 계산합니다
   */
  private static calculateAddressScore(address1: string, address2: string): number {
    const norm1 = address1.replace(/[^\w가-힣]/g, ' ').replace(/\s+/g, ' ').trim();
    const norm2 = address2.replace(/[^\w가-힣]/g, ' ').replace(/\s+/g, ' ').trim();

    const words1 = norm1.split(' ').filter(w => w.length > 1);
    const words2 = norm2.split(' ').filter(w => w.length > 1);

    let matchCount = 0;
    const totalWords = Math.max(words1.length, words2.length);

    for (const word1 of words1) {
      for (const word2 of words2) {
        if (word1.includes(word2) || word2.includes(word1)) {
          matchCount++;
          break;
        }
      }
    }

    return totalWords > 0 ? matchCount / totalWords : 0;
  }

  /**
   * 최적의 매칭을 찾습니다
   */
  static findBestMatch(
    targetName: string, 
    candidates: Array<{ name: string; address?: string; [key: string]: any }>,
    targetAddress?: string,
    minScore: number = 0.5
  ): { match: any; result: MatchResult } | null {
    
    let bestMatch: any = null;
    let bestResult: MatchResult = { score: 0, confidence: 'low', reason: '' };

    for (const candidate of candidates) {
      const result = this.calculateSimilarity(
        targetName, 
        candidate.name, 
        targetAddress, 
        candidate.address
      );

      if (result.score > bestResult.score && result.score >= minScore) {
        bestMatch = candidate;
        bestResult = result;
      }
    }

    return bestMatch ? { match: bestMatch, result: bestResult } : null;
  }

  /**
   * 여러 검색 키워드를 생성합니다
   */
  static generateSearchKeywords(apartmentName: string): string[] {
    const normalized = this.normalizeApartmentName(apartmentName);
    const keywords = new Set<string>();

    // 1. 원본명
    keywords.add(apartmentName);

    // 2. 정규화된 이름
    keywords.add(normalized.normalized);

    // 3. 추출된 키워드들
    normalized.keywords.forEach(keyword => {
      if (keyword.length >= 2) {
        keywords.add(keyword);
      }
    });

    // 4. 공통 패턴 제거한 버전들
    this.COMMON_SUFFIXES.forEach(suffix => {
      const withoutSuffix = apartmentName.replace(new RegExp(suffix + '$', 'i'), '').trim();
      if (withoutSuffix && withoutSuffix !== apartmentName) {
        keywords.add(withoutSuffix);
      }
    });

    return Array.from(keywords).sort((a, b) => b.length - a.length);
  }
}