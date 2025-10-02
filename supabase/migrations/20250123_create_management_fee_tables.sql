-- 공용관리비 테이블
CREATE TABLE IF NOT EXISTS public.common_management_fees (
    id BIGSERIAL PRIMARY KEY,
    kapt_code VARCHAR(20) NOT NULL,
    kapt_name VARCHAR(200),
    search_date VARCHAR(6) NOT NULL, -- YYYYMM 형식
    -- 일반관리비 항목들
    clean_cost DECIMAL(15, 2),       -- 청소비
    disinfect_cost DECIMAL(15, 2),   -- 소독비
    elevator_cost DECIMAL(15, 2),    -- 승강기유지비
    facility_cost DECIMAL(15, 2),    -- 시설유지비
    guard_cost DECIMAL(15, 2),       -- 경비비
    general_cost DECIMAL(15, 2),     -- 일반관리비
    repair_cost DECIMAL(15, 2),      -- 수선유지비
    -- 차량유지비 관련
    fuel_cost DECIMAL(15, 2),        -- 연료비
    refair_cost DECIMAL(15, 2),      -- 수리비
    car_insurance DECIMAL(15, 2),    -- 보험료
    car_etc DECIMAL(15, 2),          -- 기타차량유지비
    total_cost DECIMAL(15, 2) GENERATED ALWAYS AS (
        COALESCE(clean_cost, 0) +
        COALESCE(disinfect_cost, 0) +
        COALESCE(elevator_cost, 0) +
        COALESCE(facility_cost, 0) +
        COALESCE(guard_cost, 0) +
        COALESCE(general_cost, 0) +
        COALESCE(repair_cost, 0) +
        COALESCE(fuel_cost, 0) +
        COALESCE(refair_cost, 0) +
        COALESCE(car_insurance, 0) +
        COALESCE(car_etc, 0)
    ) STORED,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_common_fee UNIQUE (kapt_code, search_date)
);

-- 개별사용료 테이블
CREATE TABLE IF NOT EXISTS public.individual_usage_fees (
    id BIGSERIAL PRIMARY KEY,
    kapt_code VARCHAR(20) NOT NULL,
    kapt_name VARCHAR(200),
    search_date VARCHAR(6) NOT NULL, -- YYYYMM 형식
    -- 난방비
    heat_cost_public DECIMAL(15, 2),      -- 난방비 공용
    heat_cost_individual DECIMAL(15, 2),   -- 난방비 전용
    -- 급탕비
    hot_water_cost_public DECIMAL(15, 2),   -- 급탕비 공용
    hot_water_cost_individual DECIMAL(15, 2), -- 급탕비 전용
    -- 전기료
    electricity_cost_public DECIMAL(15, 2),  -- 전기료 공용
    electricity_cost_individual DECIMAL(15, 2), -- 전기료 전용
    -- 수도료
    water_cost_public DECIMAL(15, 2),      -- 수도료 공용
    water_cost_individual DECIMAL(15, 2),   -- 수도료 전용
    -- 가스사용료
    gas_cost_public DECIMAL(15, 2),        -- 가스사용료 공용
    gas_cost_individual DECIMAL(15, 2),     -- 가스사용료 전용
    total_public DECIMAL(15, 2) GENERATED ALWAYS AS (
        COALESCE(heat_cost_public, 0) +
        COALESCE(hot_water_cost_public, 0) +
        COALESCE(electricity_cost_public, 0) +
        COALESCE(water_cost_public, 0) +
        COALESCE(gas_cost_public, 0)
    ) STORED,
    total_individual DECIMAL(15, 2) GENERATED ALWAYS AS (
        COALESCE(heat_cost_individual, 0) +
        COALESCE(hot_water_cost_individual, 0) +
        COALESCE(electricity_cost_individual, 0) +
        COALESCE(water_cost_individual, 0) +
        COALESCE(gas_cost_individual, 0)
    ) STORED,
    total_cost DECIMAL(15, 2) GENERATED ALWAYS AS (
        COALESCE(heat_cost_public, 0) + COALESCE(heat_cost_individual, 0) +
        COALESCE(hot_water_cost_public, 0) + COALESCE(hot_water_cost_individual, 0) +
        COALESCE(electricity_cost_public, 0) + COALESCE(electricity_cost_individual, 0) +
        COALESCE(water_cost_public, 0) + COALESCE(water_cost_individual, 0) +
        COALESCE(gas_cost_public, 0) + COALESCE(gas_cost_individual, 0)
    ) STORED,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_individual_fee UNIQUE (kapt_code, search_date)
);

-- 월별 관리비 합계 뷰
CREATE OR REPLACE VIEW public.monthly_management_fees AS
SELECT
    COALESCE(c.kapt_code, i.kapt_code) AS kapt_code,
    COALESCE(c.kapt_name, i.kapt_name) AS kapt_name,
    COALESCE(c.search_date, i.search_date) AS search_date,
    EXTRACT(YEAR FROM TO_DATE(COALESCE(c.search_date, i.search_date), 'YYYYMM'))::INTEGER AS year,
    EXTRACT(MONTH FROM TO_DATE(COALESCE(c.search_date, i.search_date), 'YYYYMM'))::INTEGER AS month,
    COALESCE(c.total_cost, 0) AS common_fee,
    COALESCE(i.total_cost, 0) AS individual_fee,
    COALESCE(c.total_cost, 0) + COALESCE(i.total_cost, 0) AS total_fee
FROM public.common_management_fees c
FULL OUTER JOIN public.individual_usage_fees i
    ON c.kapt_code = i.kapt_code
    AND c.search_date = i.search_date;

-- 연도별 월 평균 관리비 뷰
CREATE OR REPLACE VIEW public.yearly_average_management_fees AS
SELECT
    kapt_code,
    kapt_name,
    year,
    COUNT(*) AS months_with_data,
    ROUND(AVG(common_fee), 0) AS avg_common_fee,
    ROUND(AVG(individual_fee), 0) AS avg_individual_fee,
    ROUND(AVG(total_fee), 0) AS avg_total_fee,
    MIN(total_fee) AS min_total_fee,
    MAX(total_fee) AS max_total_fee
FROM public.monthly_management_fees
GROUP BY kapt_code, kapt_name, year;

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_common_fees_kapt_code ON public.common_management_fees(kapt_code);
CREATE INDEX IF NOT EXISTS idx_common_fees_search_date ON public.common_management_fees(search_date);
CREATE INDEX IF NOT EXISTS idx_individual_fees_kapt_code ON public.individual_usage_fees(kapt_code);
CREATE INDEX IF NOT EXISTS idx_individual_fees_search_date ON public.individual_usage_fees(search_date);

-- RLS 활성화
ALTER TABLE public.common_management_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.individual_usage_fees ENABLE ROW LEVEL SECURITY;

-- RLS 정책 추가 (모든 사용자가 읽을 수 있도록)
CREATE POLICY "Enable read access for all users" ON public.common_management_fees
    FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON public.individual_usage_fees
    FOR SELECT USING (true);

-- 트리거 함수: updated_at 자동 업데이트
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 추가
CREATE TRIGGER set_updated_at_common_fees
    BEFORE UPDATE ON public.common_management_fees
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_individual_fees
    BEFORE UPDATE ON public.individual_usage_fees
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();