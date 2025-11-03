-- 매칭 실패 플래그 추가
-- 매칭할 단지가 없는 거래를 표시하여 목록 뒤로 정렬

-- 1. 매매 거래 테이블에 match_failed 컬럼 추가
ALTER TABLE apartment_trade_transactions
ADD COLUMN IF NOT EXISTS match_failed BOOLEAN DEFAULT FALSE;

-- 2. 전월세 거래 테이블에 match_failed 컬럼 추가
ALTER TABLE apartment_rent_transactions
ADD COLUMN IF NOT EXISTS match_failed BOOLEAN DEFAULT FALSE;

-- 3. 인덱스 추가 (미매칭 거래 조회 성능 향상)
CREATE INDEX IF NOT EXISTS idx_trade_transactions_unmatched
  ON apartment_trade_transactions(match_failed, created_at)
  WHERE complex_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_rent_transactions_unmatched
  ON apartment_rent_transactions(match_failed, created_at)
  WHERE complex_id IS NULL;

-- 4. 코멘트 추가
COMMENT ON COLUMN apartment_trade_transactions.match_failed IS '매칭할 단지를 찾을 수 없는 거래 표시 (TRUE: 매칭 실패, 목록 뒤로 정렬)';
COMMENT ON COLUMN apartment_rent_transactions.match_failed IS '매칭할 단지를 찾을 수 없는 거래 표시 (TRUE: 매칭 실패, 목록 뒤로 정렬)';
