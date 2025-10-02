# 🏠 아파트 데이터 수집 시스템

국토교통부 공동주택 정보 API를 통해 대량의 아파트 데이터를 수집하여 Supabase DB에 저장하는 시스템입니다.

## 📋 목차

1. [시스템 개요](#시스템-개요)
2. [API 정보](#api-정보)
3. [데이터베이스 스키마](#데이터베이스-스키마)
4. [설치 및 설정](#설치-및-설정)
5. [사용 방법](#사용-방법)
6. [파일 구조](#파일-구조)

## 🎯 시스템 개요

### 수집 가능한 데이터

**기본 정보:**
- 단지명, 주소, 지역 정보
- 세대수, 동수, 층수
- 건축년도, 승인일자

**시설 정보:**
- 주차대수 (지상/지하)
- 승강기 대수
- CCTV 대수
- 전기충전기 대수

**편의시설:**
- 복리시설
- 편의시설  
- 교육시설

**교통 정보:**
- 버스정류장 거리
- 지하철 노선/역명/거리

**관리 정보:**
- 관리방식, 관리인원
- 경비, 청소, 소독 관리
- 시공사, 시행사

## 🔗 API 정보

### 사용 API

1. **단지 목록 API**: `AptListService3/getTotalAptList3`
2. **기본 정보 API**: `AptBasisInfoServiceV4/getAphusBassInfoV4`  
3. **상세 정보 API**: `AptBasisInfoServiceV4/getAphusDtlInfoV4`

### 필요한 서비스 키

- [data.go.kr](https://www.data.go.kr/)에서 발급받은 인증키 필요
- 환경변수 `DATA_GO_KR_SERVICE_KEY`에 설정

## 🗄️ 데이터베이스 스키마

### 새로 추가된 컬럼들

```sql
-- 관리 정보
ALTER TABLE apartments ADD COLUMN code_mgr VARCHAR(100); -- 일반관리방식
ALTER TABLE apartments ADD COLUMN kapt_mgr_cnt INTEGER; -- 일반관리인원
ALTER TABLE apartments ADD COLUMN kapt_c_company VARCHAR(200); -- 일반관리 계약업체

-- 경비/청소/소독 관리
ALTER TABLE apartments ADD COLUMN code_sec VARCHAR(100); -- 경비관리방식
ALTER TABLE apartments ADD COLUMN kaptd_scnt INTEGER; -- 경비관리인원
ALTER TABLE apartments ADD COLUMN code_clean VARCHAR(100); -- 청소관리방식
ALTER TABLE apartments ADD COLUMN kaptd_clcnt INTEGER; -- 청소관리인원

-- 시설 정보
ALTER TABLE apartments ADD COLUMN code_str VARCHAR(100); -- 건물구조
ALTER TABLE apartments ADD COLUMN kaptd_ecapa INTEGER; -- 수전용량
ALTER TABLE apartments ADD COLUMN code_elev VARCHAR(100); -- 승강기관리형태

-- 층수 정보
ALTER TABLE apartments ADD COLUMN kapt_top_floor INTEGER; -- 최고층수
ALTER TABLE apartments ADD COLUMN ktown_flr_no INTEGER; -- 지상층수
ALTER TABLE apartments ADD COLUMN kapt_base_floor INTEGER; -- 지하층수

-- 면적별 세대현황
ALTER TABLE apartments ADD COLUMN kapt_mparea60 INTEGER; -- 60㎡ 이하 세대수
ALTER TABLE apartments ADD COLUMN kapt_mparea85 INTEGER; -- 60㎡ ~ 85㎡ 이하 세대수
ALTER TABLE apartments ADD COLUMN kapt_mparea135 INTEGER; -- 85㎡ ~ 135㎡ 이하 세대수
ALTER TABLE apartments ADD COLUMN kapt_mparea136 INTEGER; -- 135㎡ 초과 세대수
```

## ⚙️ 설치 및 설정

### 1. 필요 패키지 설치

```bash
npm install axios fast-xml-parser @supabase/supabase-js
```

### 2. 환경변수 설정

```bash
# .env 파일 생성
DATA_GO_KR_SERVICE_KEY=your_service_key_here
```

### 3. 데이터베이스 마이그레이션

```bash
# Supabase에 새 컬럼 추가
node apply-migration.js
```

## 🚀 사용 방법

### 1. API 테스트

```bash
# API 연결 및 데이터 형식 확인
node test-api.js
```

### 2. 단일 지역 수집

```bash
# 서울 지역만 수집
node batch-collect-data.js seoul

# 부산 지역만 수집  
node batch-collect-data.js busan
```

### 3. 다중 지역 수집

```bash
# 서울, 부산, 대구 동시 수집
node batch-collect-data.js seoul busan daegu

# 모든 주요 도시 수집
node batch-collect-data.js seoul busan daegu incheon gwangju daejeon ulsan
```

### 4. 경기도 포함 대규모 수집

```bash
# 서울 + 경기도 (가장 많은 데이터)
node batch-collect-data.js seoul gyeonggi
```

## 📁 파일 구조

```
aptinfo/
├── 📄 add-api-columns-migration.sql    # DB 스키마 마이그레이션
├── 🔧 apply-migration.js               # 마이그레이션 실행 스크립트
├── 🧪 test-api.js                      # API 연결 테스트
├── 📊 collect-api-data.js              # 기본 수집 스크립트
├── ⚡ batch-collect-data.js             # 대량 배치 수집 스크립트
├── 📋 collection-progress.json         # 수집 진행상황 (자동 생성)
├── 📜 collection-log.txt               # 수집 로그 (자동 생성)
└── 📖 DATA_COLLECTION_README.md        # 이 문서
```

## 🔧 주요 기능

### 배치 처리
- **청크 단위 처리**: 10개씩 묶어서 처리
- **동시 처리**: 최대 5개 동시 API 호출
- **재시도 로직**: 실패 시 3회까지 재시도
- **진행상황 저장**: 중단 시 이어서 실행 가능

### 오류 처리
- API 호출 제한 준수 (딜레이 설정)
- 네트워크 오류 자동 재시도
- 상세한 로그 기록
- 부분 실패 허용

### 데이터 검증
- 숫자 데이터 파싱 및 검증
- NULL 값 적절한 처리
- 중복 데이터 방지 (upsert 사용)

## 📊 수집 가능 지역

### 현재 지원 지역
- **서울특별시**: 25개 자치구
- **부산광역시**: 16개 구/군
- **대구광역시**: 8개 구/군  
- **인천광역시**: 10개 구/군
- **광주광역시**: 5개 구
- **대전광역시**: 5개 구
- **울산광역시**: 5개 구/군
- **경기도**: 31개 시/군

### 예상 수집량
- **서울**: ~2,000개 단지
- **경기도**: ~5,000개 단지  
- **부산**: ~800개 단지
- **전체**: ~10,000개 단지

## ⚠️ 주의사항

1. **API 호출 제한**: 과도한 호출 시 일시적 차단 가능
2. **서비스 키**: 반드시 유효한 인증키 필요
3. **네트워크**: 안정적인 인터넷 연결 필요
4. **용량**: 대량 수집 시 충분한 저장공간 확보
5. **시간**: 전체 수집 시 수 시간 소요 가능

## 🔍 모니터링

### 로그 확인
```bash
# 실시간 로그 확인
tail -f collection-log.txt

# 진행상황 확인
cat collection-progress.json
```

### 수집 현황 확인
```sql
-- Supabase에서 수집된 데이터 확인
SELECT 
  data_source,
  COUNT(*) as count,
  MAX(last_updated_at) as last_update
FROM apartments 
WHERE data_source = 'government_api_batch'
GROUP BY data_source;
```

## 🎉 완료!

이제 국토교통부 API에서 최대한 많은 아파트 데이터를 수집하여 DB에 저장할 수 있습니다. 

올바른 서비스 키를 발급받아 설정한 후 실행하시면 됩니다!