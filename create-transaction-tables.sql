-- Create missing transaction tables for apartment data

-- Create apartment_trade_transactions table
CREATE TABLE IF NOT EXISTS public.apartment_trade_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complex_id UUID REFERENCES public.apartment_complexes(id) ON DELETE SET NULL,
    apartment_name VARCHAR(200) NOT NULL,
    region_code VARCHAR(10) NOT NULL,
    legal_dong VARCHAR(100) NOT NULL,
    jibun VARCHAR(50),
    deal_amount BIGINT NOT NULL,
    deal_date DATE NOT NULL,
    exclusive_area DECIMAL(10,2),
    floor_number INTEGER,
    build_year INTEGER,
    deal_type VARCHAR(50),
    deal_cancel_type VARCHAR(50),
    deal_cancel_date DATE,
    registration_date DATE,
    apartment_dong VARCHAR(50),
    seller_type VARCHAR(50),
    buyer_type VARCHAR(50),
    land_lease_type VARCHAR(50),
    estate_agent_location VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    data_source VARCHAR(50) DEFAULT 'government_api',
    CONSTRAINT chk_deal_amount CHECK (deal_amount > 0),
    CONSTRAINT chk_exclusive_area CHECK (exclusive_area > 0),
    CONSTRAINT chk_floor_number CHECK (floor_number >= -10 AND floor_number <= 200)
);

-- Create apartment_rent_transactions table
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_trade_transactions_complex_id ON public.apartment_trade_transactions(complex_id);
CREATE INDEX IF NOT EXISTS idx_trade_transactions_deal_date ON public.apartment_trade_transactions(deal_date);
CREATE INDEX IF NOT EXISTS idx_trade_transactions_apartment_name ON public.apartment_trade_transactions USING gin(apartment_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_trade_transactions_region_code ON public.apartment_trade_transactions(region_code);

CREATE INDEX IF NOT EXISTS idx_rent_transactions_complex_id ON public.apartment_rent_transactions(complex_id);
CREATE INDEX IF NOT EXISTS idx_rent_transactions_deal_date ON public.apartment_rent_transactions(deal_date);
CREATE INDEX IF NOT EXISTS idx_rent_transactions_apartment_name ON public.apartment_rent_transactions USING gin(apartment_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_rent_transactions_region_code ON public.apartment_rent_transactions(region_code);