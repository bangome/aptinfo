-- 데이터 동기화를 위한 배치 UPSERT 함수들 생성

-- 아파트 매매 실거래가 배치 UPSERT 함수
CREATE OR REPLACE FUNCTION upsert_apartment_trade_batch(trade_data JSONB)
RETURNS TABLE(inserted_count INTEGER, updated_count INTEGER) AS $$
DECLARE
    rec RECORD;
    insert_count INTEGER := 0;
    update_count INTEGER := 0;
    existing_record RECORD;
BEGIN
    -- trade_data는 배열 형태의 JSONB
    FOR rec IN SELECT * FROM jsonb_array_elements(trade_data)
    LOOP
        -- 중복 체크: 같은 단지, 같은 거래일, 같은 층, 같은 면적의 거래
        SELECT * INTO existing_record 
        FROM apartment_trade_transactions 
        WHERE apt_nm = (rec.value->>'apt_nm')
          AND sgg_cd = (rec.value->>'sgg_cd')
          AND deal_date = (rec.value->>'deal_date')::DATE
          AND COALESCE(floor, 0) = COALESCE((rec.value->>'floor')::INTEGER, 0)
          AND COALESCE(exclu_use_ar, 0) = COALESCE((rec.value->>'exclu_use_ar')::NUMERIC, 0);

        IF existing_record IS NULL THEN
            -- 새로운 레코드 삽입
            INSERT INTO apartment_trade_transactions (
                apt_nm, sgg_cd, umd_nm, deal_amount, deal_year, deal_month, deal_day,
                jibun, exclu_use_ar, floor, build_year, dealing_gbn, region_code, deal_date,
                created_at, updated_at
            ) VALUES (
                rec.value->>'apt_nm',
                rec.value->>'sgg_cd',
                rec.value->>'umd_nm',
                (rec.value->>'deal_amount')::INTEGER,
                (rec.value->>'deal_year')::INTEGER,
                (rec.value->>'deal_month')::INTEGER,
                (rec.value->>'deal_day')::INTEGER,
                rec.value->>'jibun',
                (rec.value->>'exclu_use_ar')::NUMERIC,
                (rec.value->>'floor')::INTEGER,
                (rec.value->>'build_year')::INTEGER,
                rec.value->>'dealing_gbn',
                rec.value->>'region_code',
                (rec.value->>'deal_date')::DATE,
                NOW(),
                NOW()
            );
            insert_count := insert_count + 1;
        ELSE
            -- 기존 레코드 업데이트 (거래금액이나 기타 정보가 변경된 경우)
            UPDATE apartment_trade_transactions 
            SET 
                deal_amount = (rec.value->>'deal_amount')::INTEGER,
                jibun = COALESCE(rec.value->>'jibun', jibun),
                dealing_gbn = COALESCE(rec.value->>'dealing_gbn', dealing_gbn),
                updated_at = NOW()
            WHERE id = existing_record.id;
            update_count := update_count + 1;
        END IF;
    END LOOP;

    RETURN QUERY SELECT insert_count, update_count;
END;
$$ LANGUAGE plpgsql;

-- 아파트 전월세 실거래가 배치 UPSERT 함수
CREATE OR REPLACE FUNCTION upsert_apartment_rent_batch(rent_data JSONB)
RETURNS TABLE(inserted_count INTEGER, updated_count INTEGER) AS $$
DECLARE
    rec RECORD;
    insert_count INTEGER := 0;
    update_count INTEGER := 0;
    existing_record RECORD;
BEGIN
    FOR rec IN SELECT * FROM jsonb_array_elements(rent_data)
    LOOP
        -- 중복 체크: 같은 단지, 같은 계약일, 같은 층, 같은 면적의 임대차 계약
        SELECT * INTO existing_record 
        FROM apartment_rent_transactions 
        WHERE apt_nm = (rec.value->>'apt_nm')
          AND sgg_cd = (rec.value->>'sgg_cd')
          AND deal_date = (rec.value->>'deal_date')::DATE
          AND COALESCE(floor, 0) = COALESCE((rec.value->>'floor')::INTEGER, 0)
          AND COALESCE(exclu_use_ar, 0) = COALESCE((rec.value->>'exclu_use_ar')::NUMERIC, 0);

        IF existing_record IS NULL THEN
            -- 새로운 레코드 삽입
            INSERT INTO apartment_rent_transactions (
                apt_nm, sgg_cd, umd_nm, deposit, monthly_rent, deal_year, deal_month, deal_day,
                jibun, exclu_use_ar, floor, build_year, region_code, deal_date,
                created_at, updated_at
            ) VALUES (
                rec.value->>'apt_nm',
                rec.value->>'sgg_cd',
                rec.value->>'umd_nm',
                (rec.value->>'deposit')::INTEGER,
                (rec.value->>'monthly_rent')::INTEGER,
                (rec.value->>'deal_year')::INTEGER,
                (rec.value->>'deal_month')::INTEGER,
                (rec.value->>'deal_day')::INTEGER,
                rec.value->>'jibun',
                (rec.value->>'exclu_use_ar')::NUMERIC,
                (rec.value->>'floor')::INTEGER,
                (rec.value->>'build_year')::INTEGER,
                rec.value->>'region_code',
                (rec.value->>'deal_date')::DATE,
                NOW(),
                NOW()
            );
            insert_count := insert_count + 1;
        ELSE
            -- 기존 레코드 업데이트
            UPDATE apartment_rent_transactions 
            SET 
                deposit = (rec.value->>'deposit')::INTEGER,
                monthly_rent = (rec.value->>'monthly_rent')::INTEGER,
                jibun = COALESCE(rec.value->>'jibun', jibun),
                updated_at = NOW()
            WHERE id = existing_record.id;
            update_count := update_count + 1;
        END IF;
    END LOOP;

    RETURN QUERY SELECT insert_count, update_count;
END;
$$ LANGUAGE plpgsql;

-- 동기화 작업 로그 테이블 생성
CREATE TABLE IF NOT EXISTS sync_job_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    job_id VARCHAR(100) NOT NULL,
    job_name VARCHAR(200) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('running', 'success', 'error', 'cancelled')),
    start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    end_time TIMESTAMPTZ,
    duration_ms INTEGER,
    total_processed INTEGER DEFAULT 0,
    total_inserted INTEGER DEFAULT 0,
    total_updated INTEGER DEFAULT 0,
    total_skipped INTEGER DEFAULT 0,
    total_errors INTEGER DEFAULT 0,
    error_message TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 동기화 작업 로그 인덱스
CREATE INDEX IF NOT EXISTS idx_sync_job_logs_job_id ON sync_job_logs(job_id);
CREATE INDEX IF NOT EXISTS idx_sync_job_logs_status ON sync_job_logs(status);
CREATE INDEX IF NOT EXISTS idx_sync_job_logs_start_time ON sync_job_logs(start_time);

-- 동기화 작업 로그 기록 함수
CREATE OR REPLACE FUNCTION log_sync_job(
    p_job_id VARCHAR(100),
    p_job_name VARCHAR(200),
    p_status VARCHAR(20),
    p_start_time TIMESTAMPTZ DEFAULT NULL,
    p_end_time TIMESTAMPTZ DEFAULT NULL,
    p_duration_ms INTEGER DEFAULT NULL,
    p_total_processed INTEGER DEFAULT 0,
    p_total_inserted INTEGER DEFAULT 0,
    p_total_updated INTEGER DEFAULT 0,
    p_total_skipped INTEGER DEFAULT 0,
    p_total_errors INTEGER DEFAULT 0,
    p_error_message TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO sync_job_logs (
        job_id, job_name, status, start_time, end_time, duration_ms,
        total_processed, total_inserted, total_updated, total_skipped, total_errors,
        error_message, metadata
    ) VALUES (
        p_job_id, p_job_name, p_status,
        COALESCE(p_start_time, NOW()), p_end_time, p_duration_ms,
        p_total_processed, p_total_inserted, p_total_updated, p_total_skipped, p_total_errors,
        p_error_message, p_metadata
    ) RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql;

-- 동기화 작업 상태 업데이트 함수
CREATE OR REPLACE FUNCTION update_sync_job_log(
    p_log_id UUID,
    p_status VARCHAR(20),
    p_end_time TIMESTAMPTZ DEFAULT NOW(),
    p_duration_ms INTEGER DEFAULT NULL,
    p_total_processed INTEGER DEFAULT NULL,
    p_total_inserted INTEGER DEFAULT NULL,
    p_total_updated INTEGER DEFAULT NULL,
    p_total_skipped INTEGER DEFAULT NULL,
    p_total_errors INTEGER DEFAULT NULL,
    p_error_message TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE sync_job_logs 
    SET 
        status = p_status,
        end_time = p_end_time,
        duration_ms = COALESCE(p_duration_ms, EXTRACT(EPOCH FROM (p_end_time - start_time)) * 1000),
        total_processed = COALESCE(p_total_processed, total_processed),
        total_inserted = COALESCE(p_total_inserted, total_inserted),
        total_updated = COALESCE(p_total_updated, total_updated),
        total_skipped = COALESCE(p_total_skipped, total_skipped),
        total_errors = COALESCE(p_total_errors, total_errors),
        error_message = COALESCE(p_error_message, error_message),
        metadata = COALESCE(p_metadata, metadata)
    WHERE id = p_log_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- 동기화 통계 조회 뷰
CREATE OR REPLACE VIEW sync_job_statistics AS
SELECT 
    job_id,
    job_name,
    COUNT(*) as total_runs,
    COUNT(*) FILTER (WHERE status = 'success') as successful_runs,
    COUNT(*) FILTER (WHERE status = 'error') as failed_runs,
    AVG(duration_ms) FILTER (WHERE status = 'success') as avg_duration_ms,
    MAX(start_time) as last_run_time,
    SUM(total_processed) as total_records_processed,
    SUM(total_inserted) as total_records_inserted,
    SUM(total_updated) as total_records_updated
FROM sync_job_logs 
GROUP BY job_id, job_name
ORDER BY last_run_time DESC;