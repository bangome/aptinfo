-- apartments 테이블 최적화 마이그레이션
-- 검색 페이지에 필요한 최소 필드만 유지

-- 1. 백업 테이블 생성 (안전을 위해)
CREATE TABLE IF NOT EXISTS apartments_backup AS SELECT * FROM apartments;

-- 2. 불필요한 컬럼 삭제 (검색에 필요없는 상세 정보들)
ALTER TABLE apartments 
  DROP COLUMN IF EXISTS building_area,
  DROP COLUMN IF EXISTS total_parking_count,
  DROP COLUMN IF EXISTS surface_parking_count,
  DROP COLUMN IF EXISTS underground_parking_count,
  DROP COLUMN IF EXISTS construction_company,
  DROP COLUMN IF EXISTS architecture_company,
  DROP COLUMN IF EXISTS management_office_tel,
  DROP COLUMN IF EXISTS management_office_fax,
  DROP COLUMN IF EXISTS website_url,
  DROP COLUMN IF EXISTS management_type,
  DROP COLUMN IF EXISTS heating_type,
  DROP COLUMN IF EXISTS hall_type,
  DROP COLUMN IF EXISTS apartment_type,
  DROP COLUMN IF EXISTS elevator_count,
  DROP COLUMN IF EXISTS cctv_count,
  DROP COLUMN IF EXISTS welfare_facilities,
  DROP COLUMN IF EXISTS convenient_facilities,
  DROP COLUMN IF EXISTS education_facilities,
  DROP COLUMN IF EXISTS bus_station_distance,
  DROP COLUMN IF EXISTS subway_line,
  DROP COLUMN IF EXISTS subway_station,
  DROP COLUMN IF EXISTS subway_distance,
  DROP COLUMN IF EXISTS surface_ev_charger_count,
  DROP COLUMN IF EXISTS underground_ev_charger_count;

-- 3. 인덱스 최적화 (검색 성능 향상)
DROP INDEX IF EXISTS idx_apartments_name;
DROP INDEX IF EXISTS idx_apartments_sigungu;
DROP INDEX IF EXISTS idx_apartments_eupmyeondong;

CREATE INDEX idx_apartments_search ON apartments(name, sigungu, eupmyeondong);
CREATE INDEX idx_apartments_kapt_code ON apartments(kapt_code);
CREATE INDEX idx_apartments_is_active ON apartments(is_active);
CREATE INDEX idx_apartments_use_approval ON apartments(use_approval_date);

-- 4. 테이블 통계 업데이트
ANALYZE apartments;

-- apartments 테이블 최종 구조:
-- id, kapt_code, name (기본 정보)
-- sido, sigungu, eupmyeondong, ri, bjd_code (지역 정보)
-- zipcode, jibun_address, road_address (주소 정보)  
-- total_area, total_dong_count, total_household_count (규모 정보)
-- use_approval_date (건축년도 정보)
-- is_active, data_source (시스템 정보)
-- created_at, updated_at, last_updated_at (시간 정보)