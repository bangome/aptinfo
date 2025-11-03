-- 신규 거래 데이터 자동 매칭 트리거
-- 동일한 위치(아파트명+지역코드+법정동+번지)의 이미 매칭된 거래가 있으면 자동으로 같은 단지에 매칭

-- 1. 자동 매칭 함수 생성 (매매 거래용)
CREATE OR REPLACE FUNCTION auto_match_new_trade_transaction()
RETURNS TRIGGER AS $$
DECLARE
  matched_complex_id UUID;
BEGIN
  -- 새로 삽입된 거래가 이미 complex_id가 있으면 스킵
  IF NEW.complex_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- 필수 필드가 없으면 스킵
  IF NEW.apartment_name IS NULL OR NEW.region_code IS NULL OR
     NEW.legal_dong IS NULL OR NEW.jibun IS NULL THEN
    RETURN NEW;
  END IF;

  -- 동일한 위치의 이미 매칭된 거래 찾기
  SELECT complex_id INTO matched_complex_id
  FROM apartment_trade_transactions
  WHERE complex_id IS NOT NULL
    AND apartment_name = NEW.apartment_name
    AND region_code = NEW.region_code
    AND legal_dong = NEW.legal_dong
    AND jibun = NEW.jibun
  LIMIT 1;

  -- 매칭된 거래가 있으면 같은 complex_id 할당
  IF matched_complex_id IS NOT NULL THEN
    NEW.complex_id := matched_complex_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. 자동 매칭 함수 생성 (전월세 거래용)
CREATE OR REPLACE FUNCTION auto_match_new_rent_transaction()
RETURNS TRIGGER AS $$
DECLARE
  matched_complex_id UUID;
BEGIN
  -- 새로 삽입된 거래가 이미 complex_id가 있으면 스킵
  IF NEW.complex_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- 필수 필드가 없으면 스킵
  IF NEW.apartment_name IS NULL OR NEW.region_code IS NULL OR
     NEW.legal_dong IS NULL OR NEW.jibun IS NULL THEN
    RETURN NEW;
  END IF;

  -- 동일한 위치의 이미 매칭된 거래 찾기
  SELECT complex_id INTO matched_complex_id
  FROM apartment_rent_transactions
  WHERE complex_id IS NOT NULL
    AND apartment_name = NEW.apartment_name
    AND region_code = NEW.region_code
    AND legal_dong = NEW.legal_dong
    AND jibun = NEW.jibun
  LIMIT 1;

  -- 매칭된 거래가 있으면 같은 complex_id 할당
  IF matched_complex_id IS NOT NULL THEN
    NEW.complex_id := matched_complex_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. 트리거 생성 (매매 거래)
DROP TRIGGER IF EXISTS trigger_auto_match_trade ON apartment_trade_transactions;
CREATE TRIGGER trigger_auto_match_trade
  BEFORE INSERT ON apartment_trade_transactions
  FOR EACH ROW
  EXECUTE FUNCTION auto_match_new_trade_transaction();

-- 4. 트리거 생성 (전월세 거래)
DROP TRIGGER IF EXISTS trigger_auto_match_rent ON apartment_rent_transactions;
CREATE TRIGGER trigger_auto_match_rent
  BEFORE INSERT ON apartment_rent_transactions
  FOR EACH ROW
  EXECUTE FUNCTION auto_match_new_rent_transaction();

-- 5. 인덱스 생성 (매칭 성능 향상)
CREATE INDEX IF NOT EXISTS idx_trade_transactions_match_key
  ON apartment_trade_transactions(apartment_name, region_code, legal_dong, jibun)
  WHERE complex_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_rent_transactions_match_key
  ON apartment_rent_transactions(apartment_name, region_code, legal_dong, jibun)
  WHERE complex_id IS NOT NULL;

COMMENT ON FUNCTION auto_match_new_trade_transaction IS '신규 매매 거래 삽입 시 동일 위치의 이미 매칭된 거래를 찾아 자동으로 매칭';
COMMENT ON FUNCTION auto_match_new_rent_transaction IS '신규 전월세 거래 삽입 시 동일 위치의 이미 매칭된 거래를 찾아 자동으로 매칭';
