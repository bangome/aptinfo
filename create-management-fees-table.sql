-- 관리비 데이터 저장용 테이블 생성
CREATE TABLE IF NOT EXISTS management_fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kapt_code VARCHAR NOT NULL,
  kapt_name VARCHAR,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  
  -- 요약 데이터
  common_fee INTEGER DEFAULT 0,           -- 공용관리비 총합
  individual_fee INTEGER DEFAULT 0,      -- 개별사용료 총합  
  total_fee INTEGER DEFAULT 0,           -- 총 관리비
  
  -- 공용관리비 세부 항목 (17개)
  cleaning_cost INTEGER DEFAULT 0,       -- 청소비
  guard_cost INTEGER DEFAULT 0,          -- 경비비
  disinfection_cost INTEGER DEFAULT 0,   -- 소독비
  elevator_cost INTEGER DEFAULT 0,       -- 승강기유지비
  repairs_cost INTEGER DEFAULT 0,        -- 수선비
  facility_cost INTEGER DEFAULT 0,       -- 시설유지비
  vehicle_cost INTEGER DEFAULT 0,        -- 차량유지비
  disaster_cost INTEGER DEFAULT 0,       -- 재해예방비
  etc_cost INTEGER DEFAULT 0,            -- 기타부대비용
  office_cost INTEGER DEFAULT 0,         -- 제사무비
  clothing_cost INTEGER DEFAULT 0,       -- 피복비
  education_cost INTEGER DEFAULT 0,      -- 교육훈련비
  home_network_cost INTEGER DEFAULT 0,   -- 지능형홈네트워크설비유지비
  safety_cost INTEGER DEFAULT 0,         -- 안전점검비
  management_cost INTEGER DEFAULT 0,     -- 위탁관리수수료
  labor_cost INTEGER DEFAULT 0,          -- 인건비
  tax_cost INTEGER DEFAULT 0,            -- 제세공과금
  
  -- 개별사용료 세부 항목 (10개)
  heating_cost INTEGER DEFAULT 0,        -- 난방비
  hot_water_cost INTEGER DEFAULT 0,      -- 급탕비
  electricity_cost INTEGER DEFAULT 0,    -- 전기료
  water_cost INTEGER DEFAULT 0,          -- 수도료
  gas_cost INTEGER DEFAULT 0,            -- 가스사용료
  waste_cost INTEGER DEFAULT 0,          -- 생활폐기물수수료
  meeting_cost INTEGER DEFAULT 0,        -- 입주자대표회의운영비
  insurance_cost INTEGER DEFAULT 0,      -- 건물보험료
  election_cost INTEGER DEFAULT 0,       -- 선거관리위원회운영비
  purifier_cost INTEGER DEFAULT 0,       -- 정화조오물수수료
  
  -- 메타데이터
  success_rate DECIMAL(5,2) DEFAULT 0,   -- API 성공률 (0-100)
  successful_endpoints INTEGER DEFAULT 0, -- 성공한 엔드포인트 수
  total_endpoints INTEGER DEFAULT 27,    -- 전체 엔드포인트 수 (17+10)
  collection_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- 수집일시
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 유니크 제약조건 (단지별 연월)
  UNIQUE(kapt_code, year, month)
);

-- 인덱스 생성 (조회 성능 향상)
CREATE INDEX IF NOT EXISTS idx_management_fees_kapt_code ON management_fees(kapt_code);
CREATE INDEX IF NOT EXISTS idx_management_fees_year_month ON management_fees(year, month);
CREATE INDEX IF NOT EXISTS idx_management_fees_collection_date ON management_fees(collection_date);
CREATE INDEX IF NOT EXISTS idx_management_fees_kapt_year ON management_fees(kapt_code, year);

-- RLS (Row Level Security) 비활성화 (공개 데이터)
ALTER TABLE management_fees DISABLE ROW LEVEL SECURITY;

-- 테이블 코멘트
COMMENT ON TABLE management_fees IS '아파트 관리비 데이터 (정부 Open API에서 배치 수집)';
COMMENT ON COLUMN management_fees.kapt_code IS '아파트 코드 (data.go.kr)';
COMMENT ON COLUMN management_fees.success_rate IS 'API 호출 성공률 (%)';
COMMENT ON COLUMN management_fees.collection_date IS '데이터 수집 일시';

-- 업데이트 트리거 (updated_at 자동 갱신)
CREATE OR REPLACE FUNCTION update_management_fees_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_management_fees_updated_at
    BEFORE UPDATE ON management_fees
    FOR EACH ROW
    EXECUTE FUNCTION update_management_fees_updated_at();