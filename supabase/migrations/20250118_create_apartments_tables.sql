-- 아파트 단지 정보 테이블
CREATE TABLE IF NOT EXISTS apartments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- 기본 정보
  kapt_code VARCHAR(20) UNIQUE NOT NULL, -- 단지코드 (A10027297)
  name TEXT NOT NULL, -- 단지명
  
  -- 주소 정보
  sido VARCHAR(20) NOT NULL, -- 시도 (서울특별시)
  sigungu VARCHAR(50) NOT NULL, -- 시군구 (강남구)
  eupmyeondong VARCHAR(50) NOT NULL, -- 읍면동 (삼성동)
  ri VARCHAR(50), -- 리
  bjd_code VARCHAR(10) NOT NULL, -- 법정동코드
  zipcode VARCHAR(6), -- 우편번호
  jibun_address TEXT, -- 지번주소
  road_address TEXT, -- 도로명주소
  
  -- 건물 정보
  total_area DECIMAL(12,2), -- 대지면적 (㎡)
  building_area DECIMAL(12,2), -- 건축면적 (㎡)
  total_dong_count INTEGER, -- 총 동수
  total_household_count INTEGER, -- 총 세대수
  
  -- 주차 정보
  total_parking_count INTEGER, -- 총 주차대수
  surface_parking_count INTEGER, -- 지상 주차대수
  underground_parking_count INTEGER, -- 지하 주차대수
  
  -- 사용 승인일
  use_approval_date DATE, -- 사용승인일
  
  -- 건설사 정보
  construction_company TEXT, -- 시공사
  architecture_company TEXT, -- 건설사
  
  -- 연락처 정보
  management_office_tel VARCHAR(20), -- 관리사무소 전화번호
  management_office_fax VARCHAR(20), -- 관리사무소 팩스
  website_url TEXT, -- 홈페이지 URL
  
  -- 관리 정보
  management_type VARCHAR(100), -- 관리방식명
  heating_type VARCHAR(100), -- 난방방식명
  hall_type VARCHAR(100), -- 복도유형명
  apartment_type VARCHAR(100), -- 아파트형태명
  
  -- 시설 정보
  elevator_count INTEGER, -- 승강기 대수
  cctv_count INTEGER, -- CCTV 대수
  welfare_facilities TEXT, -- 부대복리시설
  convenient_facilities TEXT, -- 편의시설
  education_facilities TEXT, -- 교육시설
  
  -- 교통 정보
  bus_station_distance VARCHAR(50), -- 버스정류장 거리
  subway_line VARCHAR(50), -- 지하철호선
  subway_station VARCHAR(100), -- 지하철역명
  subway_distance VARCHAR(50), -- 지하철역 거리
  
  -- 전기차 충전시설
  surface_ev_charger_count INTEGER DEFAULT 0, -- 지상 전기차 충전기
  underground_ev_charger_count INTEGER DEFAULT 0, -- 지하 전기차 충전기
  
  -- 메타데이터
  is_active BOOLEAN DEFAULT true, -- 활성 상태
  data_source VARCHAR(50) DEFAULT 'data.go.kr', -- 데이터 출처
  last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- 마지막 업데이트
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_apartments_kapt_code ON apartments(kapt_code);
CREATE INDEX IF NOT EXISTS idx_apartments_sido_sigungu ON apartments(sido, sigungu);
CREATE INDEX IF NOT EXISTS idx_apartments_eupmyeondong ON apartments(eupmyeondong);
CREATE INDEX IF NOT EXISTS idx_apartments_name ON apartments USING gin(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_apartments_bjd_code ON apartments(bjd_code);
CREATE INDEX IF NOT EXISTS idx_apartments_active ON apartments(is_active);

-- 아파트 동/호 정보 테이블 (상세 정보)
CREATE TABLE IF NOT EXISTS apartment_units (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  apartment_id UUID REFERENCES apartments(id) ON DELETE CASCADE,
  
  -- 동/호 정보
  dong VARCHAR(10), -- 동
  ho VARCHAR(10), -- 호
  floor_number INTEGER, -- 층수
  
  -- 면적 정보
  exclusive_area DECIMAL(8,2), -- 전용면적 (㎡)
  supply_area DECIMAL(8,2), -- 공급면적 (㎡)
  private_area DECIMAL(8,2), -- 전용면적(개인)
  
  -- 기타 정보
  household_type VARCHAR(50), -- 세대형태
  room_count INTEGER, -- 방 개수
  bathroom_count INTEGER, -- 화장실 개수
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_apartment_units_apartment_id ON apartment_units(apartment_id);
CREATE INDEX IF NOT EXISTS idx_apartment_units_exclusive_area ON apartment_units(exclusive_area);

-- 아파트 데이터 동기화 로그 테이블
CREATE TABLE IF NOT EXISTS apartment_sync_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  sync_type VARCHAR(50) NOT NULL, -- 'full', 'incremental', 'region'
  region_code VARCHAR(10), -- 동기화 대상 지역코드 (전체인 경우 NULL)
  region_name VARCHAR(100), -- 지역명
  
  -- 동기화 결과
  total_processed INTEGER DEFAULT 0, -- 처리된 총 레코드
  total_inserted INTEGER DEFAULT 0, -- 새로 추가된 레코드
  total_updated INTEGER DEFAULT 0, -- 업데이트된 레코드
  total_errors INTEGER DEFAULT 0, -- 오류 발생 레코드
  
  -- 시간 정보
  started_at TIMESTAMP WITH TIME ZONE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER,
  
  -- 결과 정보
  status VARCHAR(20) DEFAULT 'running', -- 'running', 'completed', 'failed'
  error_message TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_apartment_sync_logs_status ON apartment_sync_logs(status);
CREATE INDEX IF NOT EXISTS idx_apartment_sync_logs_started_at ON apartment_sync_logs(started_at);

-- 트리거 함수: updated_at 자동 업데이트
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 트리거 적용
CREATE TRIGGER update_apartments_updated_at BEFORE UPDATE ON apartments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_apartment_units_updated_at BEFORE UPDATE ON apartment_units
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) 설정
ALTER TABLE apartments ENABLE ROW LEVEL SECURITY;
ALTER TABLE apartment_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE apartment_sync_logs ENABLE ROW LEVEL SECURITY;

-- 읽기 권한 정책 (모든 사용자가 읽기 가능)
CREATE POLICY "Apartments are viewable by everyone" ON apartments
    FOR SELECT USING (true);

CREATE POLICY "Apartment units are viewable by everyone" ON apartment_units
    FOR SELECT USING (true);

-- 관리자만 수정 가능한 정책
CREATE POLICY "Only admins can modify apartments" ON apartments
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Only admins can modify apartment units" ON apartment_units
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Only admins can view sync logs" ON apartment_sync_logs
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- 코멘트 추가
COMMENT ON TABLE apartments IS '국토교통부 공동주택 기본정보 및 상세정보';
COMMENT ON TABLE apartment_units IS '아파트 동/호별 상세 정보';
COMMENT ON TABLE apartment_sync_logs IS '아파트 데이터 동기화 로그';

COMMENT ON COLUMN apartments.kapt_code IS '국토교통부에서 부여하는 고유 단지코드';
COMMENT ON COLUMN apartments.bjd_code IS '행정표준관리시스템 법정동코드';
COMMENT ON COLUMN apartments.use_approval_date IS '건물 사용승인일자';
COMMENT ON COLUMN apartments.data_source IS '데이터 출처 (data.go.kr, manual 등)';