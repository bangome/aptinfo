# 데이터 동기화 스케줄러 설정 가이드

## 개요

ApartInfo 프로젝트의 데이터 동기화 스케줄러는 정부 API로부터 아파트 실거래가 데이터를 주기적으로 수집하고 데이터베이스에 저장하는 시스템입니다.

## 주요 컴포넌트

### 1. CronScheduler (`src/services/cronScheduler.ts`)
- Node.js cron 기반 스케줄링 서비스
- 작업 등록, 실행, 모니터링 기능
- 에러 처리 및 재시도 메커니즘
- 작업 상태 추적 및 리포팅

### 2. DataSyncService (`src/services/dataSyncService.ts`)
- 정부 API 데이터 동기화 서비스
- 배치 처리 및 UPSERT 로직
- 트랜잭션 기반 데이터 저장
- 통계 및 로깅

### 3. 데이터베이스 함수 (`supabase/migrations/20250917050000_create_sync_functions.sql`)
- 배치 UPSERT 저장 프로시저
- 동기화 로그 테이블 및 함수
- 성능 최적화된 중복 체크

## 기본 스케줄 작업

### 1. 일일 전체 동기화 (daily-full-sync)
- **실행 시간**: 매일 새벽 2시
- **Cron 표현식**: `0 2 * * *`
- **기능**: 모든 지역의 데이터 전체 동기화
- **재시도**: 최대 3회

### 2. 주간 단지 정보 동기화 (weekly-complex-sync)
- **실행 시간**: 매주 일요일 새벽 1시
- **Cron 표현식**: `0 1 * * 0`
- **기능**: 아파트 단지 기본 정보 업데이트
- **재시도**: 최대 2회

### 3. 시간별 최신 데이터 동기화 (hourly-recent-sync)
- **실행 시간**: 매시간
- **Cron 표현식**: `0 * * * *`
- **기능**: 최근 한 달 데이터 확인 및 업데이트
- **재시도**: 최대 5회

## 환경 설정

### 환경 변수
```bash
# 스케줄러 활성화 (프로덕션에서는 자동)
ENABLE_SCHEDULER=true

# 정부 API 키
GOVERNMENT_API_SERVICE_KEY=your_api_key_here

# 데이터베이스 연결
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## 설치 및 실행

### 1. 의존성 설치
```bash
npm install node-cron @types/node-cron
```

### 2. 데이터베이스 마이그레이션 실행
```bash
npx supabase migration up
```

### 3. 스케줄러 초기화
```typescript
import { initializeScheduler } from '@/services/cronScheduler';

// 애플리케이션 시작 시
initializeScheduler();
```

## API 엔드포인트

### 스케줄러 관리 (`/api/admin/scheduler`)

#### GET - 상태 조회
```bash
curl http://localhost:3000/api/admin/scheduler
```

#### POST - 스케줄러 제어
```bash
# 전체 스케줄러 시작
curl -X POST http://localhost:3000/api/admin/scheduler \
  -H "Content-Type: application/json" \
  -d '{"action": "start"}'

# 특정 작업 실행
curl -X POST http://localhost:3000/api/admin/scheduler \
  -H "Content-Type: application/json" \
  -d '{"action": "run", "jobId": "daily-full-sync"}'
```

### 스케줄러 초기화 (`/api/init-scheduler`)
```bash
# 스케줄러 수동 초기화
curl -X POST http://localhost:3000/api/init-scheduler
```

### 동기화 로그 조회 (`/api/admin/sync-logs`)
```bash
# 로그 조회 (페이지네이션)
curl "http://localhost:3000/api/admin/sync-logs?limit=20&offset=0"

# 특정 작업 로그 조회
curl "http://localhost:3000/api/admin/sync-logs?jobId=daily-full-sync"
```

## 관리자 인터페이스

### 웹 관리 페이지
- **URL**: `/admin/scheduler`
- **기능**: 
  - 스케줄러 상태 실시간 모니터링
  - 작업 시작/중지/재시작
  - 수동 작업 실행
  - 작업 제거
  - 상태 통계 대시보드

## 모니터링 및 로깅

### 1. 작업 상태 추적
- 각 작업의 실행 상태 (running, success, error)
- 마지막 실행 시간 및 다음 실행 시간
- 에러 카운트 및 재시도 히스토리

### 2. 데이터베이스 로깅
```sql
-- 동기화 로그 조회
SELECT * FROM sync_job_logs 
WHERE job_id = 'daily-full-sync' 
ORDER BY start_time DESC 
LIMIT 10;

-- 작업별 통계
SELECT * FROM sync_job_statistics;
```

### 3. 알림 시스템
- 작업 실패 시 콘솔 로그
- 최대 재시도 횟수 초과 시 작업 자동 비활성화
- TODO: 이메일/Slack 알림 연동

## 에러 처리

### 1. 재시도 메커니즘
- 각 작업별 최대 재시도 횟수 설정
- 지수 백오프 지연시간 적용
- 네트워크 및 일시적 오류 자동 복구

### 2. 오류 분류
- **네트워크 오류**: 자동 재시도
- **API 인증 오류**: 즉시 중단, 알림
- **데이터베이스 오류**: 트랜잭션 롤백 후 재시도
- **데이터 검증 오류**: 건너뛰고 계속 진행

## 성능 최적화

### 1. 배치 처리
- 1000건 단위 배치 저장
- PostgreSQL UPSERT 함수 활용
- 트랜잭션 기반 원자성 보장

### 2. API 호출 제한
- 호출 간 지연시간 설정 (500ms)
- 동시 호출 제한
- 실패 시 점진적 지연 증가

### 3. 데이터베이스 최적화
- 중복 체크용 복합 인덱스
- 파티셔닝 고려 (대용량 데이터)
- 정기적인 로그 데이터 정리

## 보안 고려사항

### 1. API 키 관리
- 환경 변수를 통한 키 관리
- 키 순환 정책 수립
- 접근 로그 모니터링

### 2. 데이터베이스 접근
- Service Role Key 사용
- RLS (Row Level Security) 정책 적용
- 최소 권한 원칙

## 트러블슈팅

### 1. 스케줄러가 시작되지 않는 경우
```bash
# 환경 변수 확인
echo $ENABLE_SCHEDULER

# 로그 확인
tail -f logs/scheduler.log

# 수동 초기화 시도
curl -X POST http://localhost:3000/api/init-scheduler
```

### 2. 작업이 실행되지 않는 경우
```bash
# 작업 상태 확인
curl http://localhost:3000/api/admin/scheduler

# 수동 실행으로 테스트
curl -X POST http://localhost:3000/api/admin/scheduler \
  -d '{"action": "run", "jobId": "test-job"}'
```

### 3. 데이터 동기화 실패
```sql
-- 최근 오류 로그 확인
SELECT * FROM sync_job_logs 
WHERE status = 'error' 
ORDER BY start_time DESC 
LIMIT 5;

-- API 응답 확인
SELECT metadata FROM sync_job_logs 
WHERE job_id = 'daily-full-sync' 
AND status = 'error';
```

## 향후 개선 사항

### 1. 고급 모니터링
- Prometheus/Grafana 연동
- 상세 메트릭 수집
- 알람 규칙 설정

### 2. 확장성 개선
- 멀티 인스턴스 지원
- 분산 잠금 메커니즘
- 로드 밸런싱

### 3. 사용자 경험 개선
- 실시간 진행률 표시
- 데이터 품질 리포트
- 자동 복구 기능