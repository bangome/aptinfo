-- 아파트 정보 통합 검색 서비스 데이터베이스 스키마
-- 정부 API 데이터 저장을 위한 테이블 설계

-- 1. 아파트 단지 기본 정보 테이블
CREATE TABLE IF NOT EXISTS public.apartment_complexes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kapt_code VARCHAR(20) UNIQUE, -- 정부 API 단지코드
    name VARCHAR(200) NOT NULL, -- 단지명
    address TEXT NOT NULL, -- 주소
    road_address TEXT, -- 도로명 주소
    region_code VARCHAR(10) NOT NULL, -- 지역코드 (예: 11680)
    legal_dong VARCHAR(100), -- 법정동
    jibun VARCHAR(50), -- 지번

    -- 건물 기본 정보
    build_year INTEGER, -- 건축년도
    use_approval_date DATE, -- 사용승인일
    dong_count INTEGER, -- 동수
    household_count INTEGER, -- 세대수
    floor_count INTEGER, -- 층수
    building_structure VARCHAR(50), -- 건물구조

    -- 면적 정보 (단위: ㎡)
    total_area DECIMAL(15,2), -- 연면적
    private_area_total DECIMAL(15,2), -- 단지 전용면적합
    management_area DECIMAL(15,2), -- 관리비부과면적

    -- 세대현황 (60㎡이하, 60-85㎡, 85-135㎡, 135㎡초과)
    households_60_under INTEGER,
    households_60_85 INTEGER,
    households_85_135 INTEGER,
    households_135_over INTEGER,

    -- 시공/시행사 정보
    construction_company VARCHAR(200), -- 시공사
    project_company VARCHAR(200), -- 시행사

    -- 분양 및 난방 정보
    sale_type VARCHAR(50), -- 분양형태
    heating_type VARCHAR(50), -- 난방방식
    apartment_type VARCHAR(50), -- 단지분류

    -- 관리 정보
    management_type VARCHAR(50), -- 관리방식
    management_office_phone VARCHAR(20), -- 관리사무소 연락처
    management_office_fax VARCHAR(20), -- 관리사무소 팩스
    website_url TEXT, -- 홈페이지 주소

    -- 위치 정보
    latitude DECIMAL(10,7), -- 위도
    longitude DECIMAL(10,7), -- 경도

    -- 메타데이터
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    data_source VARCHAR(50) DEFAULT 'government_api', -- 데이터 출처

    -- 인덱스를 위한 제약조건
    CONSTRAINT chk_build_year CHECK (build_year > 1900 AND build_year <= EXTRACT(YEAR FROM NOW()) + 10),
    CONSTRAINT chk_household_count CHECK (household_count >= 0),
    CONSTRAINT chk_dong_count CHECK (dong_count >= 0)
);

-- 2. 아파트 상세 시설 정보 테이블
CREATE TABLE IF NOT EXISTS public.apartment_facilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complex_id UUID NOT NULL REFERENCES public.apartment_complexes(id) ON DELETE CASCADE,

    -- 주차 정보
    parking_total INTEGER, -- 총 주차대수
    parking_surface INTEGER, -- 지상 주차대수
    parking_underground INTEGER, -- 지하 주차대수

    -- 승강기 정보
    elevator_count INTEGER, -- 승강기대수
    elevator_management_type VARCHAR(50), -- 승강기관리형태

    -- 보안 및 안전 시설
    cctv_count INTEGER, -- CCTV 대수
    fire_alarm_type VARCHAR(50), -- 화재수신반방식
    emergency_power_capacity VARCHAR(50), -- 수전용량
    electrical_contract_type VARCHAR(50), -- 세대전기계약방식
    electrical_safety_manager BOOLEAN, -- 전기안전관리자법정선임여부

    -- 급수 및 기타 시설
    water_supply_type VARCHAR(50), -- 급수방식
    corridor_type VARCHAR(50), -- 복도유형
    garbage_disposal_type VARCHAR(50), -- 음식물처리방법

    -- 관리 인력 정보
    general_management_staff INTEGER, -- 일반관리인원
    security_management_staff INTEGER, -- 경비관리인원
    cleaning_management_staff INTEGER, -- 청소관리인원
    disinfection_annual_count INTEGER, -- 소독관리 연간소독횟수

    -- 관리업체 정보
    general_management_company VARCHAR(200), -- 일반관리 계약업체
    security_management_company VARCHAR(200), -- 경비관리 계약업체
    disinfection_management_type VARCHAR(50), -- 소독관리방식
    disinfection_method VARCHAR(50), -- 소독방법

    -- 메타데이터
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 아파트 실거래가 정보 테이블 (매매)
CREATE TABLE IF NOT EXISTS public.apartment_trade_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complex_id UUID REFERENCES public.apartment_complexes(id) ON DELETE SET NULL,

    -- 거래 기본 정보
    apartment_name VARCHAR(200) NOT NULL, -- 아파트명 (단지와 매칭 실패할 수 있어서 별도 저장)
    region_code VARCHAR(10) NOT NULL, -- 지역코드
    legal_dong VARCHAR(100) NOT NULL, -- 법정동
    jibun VARCHAR(50), -- 지번

    -- 거래 상세 정보
    deal_amount BIGINT NOT NULL, -- 거래금액(만원)
    deal_date DATE NOT NULL, -- 거래일자
    exclusive_area DECIMAL(10,2), -- 전용면적(㎡)
    floor_number INTEGER, -- 층
    build_year INTEGER, -- 건축년도

    -- 거래 유형 및 상태
    deal_type VARCHAR(50), -- 거래유형
    deal_cancel_type VARCHAR(50), -- 해제여부
    deal_cancel_date DATE, -- 해제사유발생일
    registration_date DATE, -- 등기일자

    -- 동정보 및 거래주체
    apartment_dong VARCHAR(50), -- 아파트 동명
    seller_type VARCHAR(50), -- 매도자 거래주체정보
    buyer_type VARCHAR(50), -- 매수자 거래주체정보
    land_lease_type VARCHAR(50), -- 토지임대부 아파트 여부

    -- 중개사 정보
    estate_agent_location VARCHAR(100), -- 중개사소재지

    -- 메타데이터
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    data_source VARCHAR(50) DEFAULT 'government_api',

    -- 제약조건
    CONSTRAINT chk_deal_amount CHECK (deal_amount > 0),
    CONSTRAINT chk_exclusive_area CHECK (exclusive_area > 0),
    CONSTRAINT chk_floor_number CHECK (floor_number >= -10 AND floor_number <= 200)
);

-- 4. 아파트 전월세 실거래가 정보 테이블
CREATE TABLE IF NOT EXISTS public.apartment_rent_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complex_id UUID REFERENCES public.apartment_complexes(id) ON DELETE SET NULL,

    -- 거래 기본 정보
    apartment_name VARCHAR(200) NOT NULL, -- 아파트명
    region_code VARCHAR(10) NOT NULL, -- 지역코드
    legal_dong VARCHAR(100) NOT NULL, -- 법정동
    jibun VARCHAR(50), -- 지번

    -- 임대 상세 정보
    deposit_amount BIGINT NOT NULL, -- 보증금액(만원)
    monthly_rent BIGINT NOT NULL DEFAULT 0, -- 월세금액(만원)
    deal_date DATE NOT NULL, -- 계약일자
    exclusive_area DECIMAL(10,2), -- 전용면적(㎡)
    floor_number INTEGER, -- 층
    build_year INTEGER, -- 건축년도

    -- 계약 정보
    contract_term VARCHAR(50), -- 계약기간
    contract_type VARCHAR(50), -- 계약구분
    renewal_right_used VARCHAR(10), -- 갱신요구권사용

    -- 종전 계약 정보
    previous_deposit BIGINT, -- 종전계약보증금
    previous_monthly_rent BIGINT, -- 종전계약월세

    -- 메타데이터
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    data_source VARCHAR(50) DEFAULT 'government_api',

    -- 제약조건
    CONSTRAINT chk_deposit_amount CHECK (deposit_amount >= 0),
    CONSTRAINT chk_monthly_rent CHECK (monthly_rent >= 0),
    CONSTRAINT chk_rent_exclusive_area CHECK (exclusive_area > 0),
    CONSTRAINT chk_rent_floor_number CHECK (floor_number >= -10 AND floor_number <= 200)
);

-- 5. 편의시설 마스터 테이블
CREATE TABLE IF NOT EXISTS public.facility_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE, -- 시설명
    category VARCHAR(50) NOT NULL, -- 카테고리 (welfare, convenient, education, sports, etc.)
    description TEXT, -- 설명
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. 아파트-편의시설 연결 테이블
CREATE TABLE IF NOT EXISTS public.apartment_facility_mapping (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complex_id UUID NOT NULL REFERENCES public.apartment_complexes(id) ON DELETE CASCADE,
    facility_id UUID NOT NULL REFERENCES public.facility_categories(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- 중복 방지
    UNIQUE(complex_id, facility_id)
);

-- 인덱스 생성
-- 아파트 단지 검색용 인덱스
CREATE INDEX IF NOT EXISTS idx_apartment_complexes_name ON public.apartment_complexes USING gin(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_apartment_complexes_address ON public.apartment_complexes USING gin(address gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_apartment_complexes_region_code ON public.apartment_complexes(region_code);
CREATE INDEX IF NOT EXISTS idx_apartment_complexes_kapt_code ON public.apartment_complexes(kapt_code);
CREATE INDEX IF NOT EXISTS idx_apartment_complexes_build_year ON public.apartment_complexes(build_year);
CREATE INDEX IF NOT EXISTS idx_apartment_complexes_household_count ON public.apartment_complexes(household_count);

-- 거래 정보 검색용 인덱스
CREATE INDEX IF NOT EXISTS idx_trade_transactions_complex_id ON public.apartment_trade_transactions(complex_id);
CREATE INDEX IF NOT EXISTS idx_trade_transactions_deal_date ON public.apartment_trade_transactions(deal_date);
CREATE INDEX IF NOT EXISTS idx_trade_transactions_deal_amount ON public.apartment_trade_transactions(deal_amount);
CREATE INDEX IF NOT EXISTS idx_trade_transactions_region_code ON public.apartment_trade_transactions(region_code);
CREATE INDEX IF NOT EXISTS idx_trade_transactions_apartment_name ON public.apartment_trade_transactions USING gin(apartment_name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_rent_transactions_complex_id ON public.apartment_rent_transactions(complex_id);
CREATE INDEX IF NOT EXISTS idx_rent_transactions_deal_date ON public.apartment_rent_transactions(deal_date);
CREATE INDEX IF NOT EXISTS idx_rent_transactions_deposit_amount ON public.apartment_rent_transactions(deposit_amount);
CREATE INDEX IF NOT EXISTS idx_rent_transactions_region_code ON public.apartment_rent_transactions(region_code);
CREATE INDEX IF NOT EXISTS idx_rent_transactions_apartment_name ON public.apartment_rent_transactions USING gin(apartment_name gin_trgm_ops);

-- 시설 정보 검색용 인덱스
CREATE INDEX IF NOT EXISTS idx_apartment_facilities_complex_id ON public.apartment_facilities(complex_id);
CREATE INDEX IF NOT EXISTS idx_apartment_facility_mapping_complex_id ON public.apartment_facility_mapping(complex_id);
CREATE INDEX IF NOT EXISTS idx_apartment_facility_mapping_facility_id ON public.apartment_facility_mapping(facility_id);

-- Full text search를 위한 gin 확장 활성화 (필요시)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- updated_at 자동 업데이트를 위한 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- updated_at 트리거 생성
CREATE TRIGGER update_apartment_complexes_updated_at
    BEFORE UPDATE ON public.apartment_complexes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_apartment_facilities_updated_at
    BEFORE UPDATE ON public.apartment_facilities
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trade_transactions_updated_at
    BEFORE UPDATE ON public.apartment_trade_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rent_transactions_updated_at
    BEFORE UPDATE ON public.apartment_rent_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) 설정 (추후 필요시 활성화)
-- ALTER TABLE public.apartment_complexes ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.apartment_facilities ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.apartment_trade_transactions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.apartment_rent_transactions ENABLE ROW LEVEL SECURITY;

-- 기본 편의시설 데이터 삽입
INSERT INTO public.facility_categories (name, category, description) VALUES
('수영장', 'sports', '실내/실외 수영장'),
('헬스장', 'sports', '피트니스센터'),
('어린이놀이터', 'children', '어린이 놀이시설'),
('경로당', 'welfare', '노인 복지시설'),
('어린이집', 'education', '보육시설'),
('독서실', 'education', '공부방/독서실'),
('게스트하우스', 'convenient', '방문객 숙박시설'),
('커뮤니티센터', 'welfare', '주민 커뮤니티 공간'),
('관리사무소', 'management', '관리사무소'),
('경비실', 'security', '경비/보안시설'),
('주차장', 'parking', '주차시설'),
('상가', 'convenient', '단지 내 상업시설'),
('공원', 'outdoor', '조경/공원시설'),
('산책로', 'outdoor', '산책로/조깅트랙'),
('근린생활시설', 'convenient', '편의점, 카페 등'),
('테니스장', 'sports', '테니스 코트'),
('골프연습장', 'sports', '골프 연습시설'),
('사우나', 'wellness', '찜질방/사우나'),
('도서관', 'education', '작은도서관'),
('카페', 'convenient', '단지 내 카페')
ON CONFLICT (name) DO NOTHING;

COMMENT ON TABLE public.apartment_complexes IS '아파트 단지 기본 정보';
COMMENT ON TABLE public.apartment_facilities IS '아파트 단지별 상세 시설 정보';
COMMENT ON TABLE public.apartment_trade_transactions IS '아파트 매매 실거래가 정보';
COMMENT ON TABLE public.apartment_rent_transactions IS '아파트 전월세 실거래가 정보';
COMMENT ON TABLE public.facility_categories IS '편의시설 마스터 데이터';
COMMENT ON TABLE public.apartment_facility_mapping IS '아파트-편의시설 매핑 테이블';