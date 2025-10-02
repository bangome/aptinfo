-- 편의시설 카테고리 테이블
CREATE TABLE IF NOT EXISTS public.facility_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    category VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 아파트 시설 정보 테이블
CREATE TABLE IF NOT EXISTS public.apartment_facilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complex_id UUID NOT NULL REFERENCES public.apartment_complexes(id) ON DELETE CASCADE,
    parking_total INTEGER,
    parking_surface INTEGER,
    parking_underground INTEGER,
    elevator_count INTEGER,
    elevator_management_type VARCHAR(50),
    cctv_count INTEGER,
    fire_alarm_type VARCHAR(50),
    emergency_power_capacity VARCHAR(50),
    electrical_contract_type VARCHAR(50),
    electrical_safety_manager BOOLEAN,
    water_supply_type VARCHAR(50),
    corridor_type VARCHAR(50),
    garbage_disposal_type VARCHAR(50),
    general_management_staff INTEGER,
    security_management_staff INTEGER,
    cleaning_management_staff INTEGER,
    disinfection_annual_count INTEGER,
    general_management_company VARCHAR(200),
    security_management_company VARCHAR(200),
    disinfection_management_type VARCHAR(50),
    disinfection_method VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 아파트 전월세 실거래가 정보 테이블
CREATE TABLE IF NOT EXISTS public.apartment_rent_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complex_id UUID REFERENCES public.apartment_complexes(id) ON DELETE SET NULL,
    apartment_name VARCHAR(200) NOT NULL,
    region_code VARCHAR(10) NOT NULL,
    legal_dong VARCHAR(100) NOT NULL,
    jibun VARCHAR(50),
    deposit_amount BIGINT NOT NULL,
    monthly_rent BIGINT NOT NULL DEFAULT 0,
    deal_date DATE NOT NULL,
    exclusive_area DECIMAL(10,2),
    floor_number INTEGER,
    build_year INTEGER,
    contract_term VARCHAR(50),
    contract_type VARCHAR(50),
    renewal_right_used VARCHAR(10),
    previous_deposit BIGINT,
    previous_monthly_rent BIGINT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    data_source VARCHAR(50) DEFAULT 'government_api',
    CONSTRAINT chk_deposit_amount CHECK (deposit_amount >= 0),
    CONSTRAINT chk_monthly_rent CHECK (monthly_rent >= 0),
    CONSTRAINT chk_rent_exclusive_area CHECK (exclusive_area > 0),
    CONSTRAINT chk_rent_floor_number CHECK (floor_number >= -10 AND floor_number <= 200)
);

-- 아파트-편의시설 연결 테이블
CREATE TABLE IF NOT EXISTS public.apartment_facility_mapping (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complex_id UUID NOT NULL REFERENCES public.apartment_complexes(id) ON DELETE CASCADE,
    facility_id UUID NOT NULL REFERENCES public.facility_categories(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(complex_id, facility_id)
);

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