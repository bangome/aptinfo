# 🛠️ 아파트 정보 서비스 문제 해결 종합 계획

## 📋 Phase 1: 긴급 이슈 해결 (1-2일)

### 🚨 1.1 스케줄러 시스템 복구 (최우선)
**문제:** Next.js chunk 로딩 실패로 모든 스케줄러 API 500 에러
- `node_modules_tr46_816df9._.js` chunk 로딩 실패
- 모든 스케줄러 관련 API 응답 500 에러

**해결 방안:**
```bash
# 1. 의존성 정리 및 재설치
npm clean-install

# 2. Next.js 캐시 클리어  
rm -rf .next
npm run build

# 3. 문제가 있는 chunk 확인 및 대체
```

**구체적 작업:**
- [ ] `node_modules_tr46_816df9._.js` 관련 의존성 분석
- [ ] 스케줄러 라우트 리팩토링 (dynamic import 제거)
- [ ] 핫픽스: 별도 스크립트로 스케줄러 기능 분리

### 🔧 1.2 API 파싱 에러 해결
**문제:** XML 응답을 JSON으로 파싱 시도하여 실패
- `"Unexpected token '<', "<OpenAPI_S"... is not valid JSON"`

**해결 방안:**
```javascript
// 개선된 API 응답 처리 로직
async function handleApiResponse(response) {
  const contentType = response.headers.get('content-type');
  
  if (contentType?.includes('application/xml') || 
      contentType?.includes('text/xml')) {
    // XML 파싱
    return await parseXmlResponse(response);
  } else {
    // JSON 파싱
    return await response.json();
  }
}
```

**작업 항목:**
- [ ] API 응답 헤더 체크 로직 추가
- [ ] XML/JSON 혼합 처리 함수 구현
- [ ] 에러 핸들링 강화

---

## 📊 Phase 2: 데이터 인프라 정비 (3-5일)

### 🗃️ 2.1 데이터베이스 스키마 정합성 확보
**현재 문제:**
- `apartment_complexes.build_year` 컬럼 누락
- 테이블 간 스키마 불일치

**해결 계획:**
```sql
-- 1. 누락된 컬럼 추가
ALTER TABLE apartment_complexes 
ADD COLUMN IF NOT EXISTS build_year INTEGER;

-- 2. 기존 데이터 마이그레이션
UPDATE apartment_complexes 
SET build_year = (
  SELECT build_year FROM apartments 
  WHERE apartments.kapt_code = apartment_complexes.kapt_code
  LIMIT 1
) WHERE build_year IS NULL;
```

**작업 항목:**
- [ ] 스키마 정합성 검사 스크립트 작성
- [ ] 누락된 컬럼 추가 마이그레이션 실행
- [ ] 데이터 정합성 검증

### 🏢 2.2 데이터 수집 시스템 개선
**목표:** 누락된 데이터 테이블 채우기

**현재 상태:**
- apartment_complexes: 1,003개 ✅
- apartments: 3,300개 ✅  
- management_fees: 300개 ✅
- apartment_facilities: 0개 ❌
- apartment_trade_transactions: 0개 ❌
- apartment_rent_transactions: 0개 ❌

**작업 순서:**
1. [ ] 시설 정보 수집 (apartment_facilities)
2. [ ] 실거래가 수집 (trade_transactions)  
3. [ ] 전월세 수집 (rent_transactions)

---

## 🔄 Phase 3: 시스템 안정화 (5-7일)

### 📈 3.1 실거래가 데이터 수집 시작
**수집 대상:**
- 아파트 매매 실거래가 (최근 1년)
- 전월세 실거래가 (최근 1년)

**배치 처리 전략:**
```javascript
// 지역별 순차 수집
const regions = ['11680', '11110', '11140']; // 강남구, 종로구, 중구
for (const region of regions) {
  await collectTradeData(region, '202401', '202412');
  await delay(1000); // API 호출 제한 준수
}
```

**작업 항목:**
- [ ] 실거래가 API 연동 스크립트 작성
- [ ] 배치 처리 로직 구현
- [ ] 데이터 검증 및 정제 로직 추가

### 🏗️ 3.2 시설 정보 매핑
**작업 내용:**
- [ ] 기존 아파트 데이터에서 시설 정보 추출
- [ ] facility_categories 테이블과 매핑
- [ ] 누락된 시설 정보는 별도 API로 수집

---

## 🔍 Phase 4: 모니터링 및 최적화 (7-10일)

### 📊 4.1 실시간 모니터링 시스템
**구성 요소:**
```typescript
// 헬스체크 API
interface HealthStatus {
  database: boolean;
  scheduler: boolean;
  apiConnections: boolean;
  lastDataUpdate: Date;
  errorRate: number;
}
```

**알림 시스템:**
- [ ] API 실패율 10% 초과 시 알림
- [ ] 데이터 수집 중단 12시간 초과 시 알림
- [ ] 데이터베이스 연결 실패 시 즉시 알림

### ⚡ 4.2 성능 최적화
**개선 사항:**
1. **배치 처리 최적화**
   - [ ] 동시 처리 수 조정 (현재 5개 → 10개)
   - [ ] 실패한 요청 재시도 로직 개선

2. **데이터베이스 최적화**
   - [ ] 인덱스 추가 및 쿼리 최적화
   - [ ] 파티셔닝 검토

---

## 📅 구체적 실행 일정

### 1주차 (긴급)
- **Day 1-2:** 스케줄러 복구 + API 파싱 에러 해결
- **Day 3:** 데이터베이스 스키마 정합성 확보  
- **Day 4:** 기본 데이터 수집 재개 확인

### 2주차 (확장)
- **Day 5-6:** 실거래가 데이터 수집 시작
- **Day 7:** 시설 정보 매핑 작업

### 3주차 (안정화)
- **Day 8-9:** 모니터링 시스템 구축
- **Day 10:** 성능 최적화 및 테스트

---

## 🎯 예상 결과

### 단기 목표 (1주)
- ✅ 스케줄러 정상 작동
- ✅ API 에러율 5% 이하  
- ✅ 기본 데이터 수집 재개

### 중기 목표 (2-3주)
- 📈 실거래가 데이터 10,000건 수집
- 🏢 시설 정보 매핑 80% 완료
- 📊 실시간 모니터링 대시보드 구축

### 성공 지표
- 시스템 가동률 99% 이상
- 데이터 품질 점수 90점 이상
- API 응답 시간 평균 500ms 이하

---

## 📝 현재 주요 문제점

1. **스케줄러 시스템 장애 (심각)**
   - 오류: `Failed to load chunk server/chunks/node_modules_tr46_816df9._.js`
   - 모든 스케줄러 API 500 에러
   - 자동 데이터 수집 중단

2. **API 파싱 에러**  
   - `"Unexpected token '<', "<OpenAPI_S"... is not valid JSON"`
   - 정부 API 응답 형식 변경 의심
   - XML 형태로 응답하는 경우 발생

3. **데이터베이스 스키마 불일치**
   - `"column apartment_complexes.build_year does not exist"`
   - 마이그레이션 미완료 또는 스키마 불일치

---

**작성일:** 2025-09-25
**상태:** 계획 수립 완료
**다음 단계:** Phase 1 긴급 이슈 해결 시작