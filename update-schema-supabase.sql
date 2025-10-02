-- 🏠 아파트 데이터베이스 스키마 업데이트
-- 국토교통부 API 67개 필드 지원

-- 기본정보 API 필드들 (31개)
ALTER TABLE apartment_complexes ADD COLUMN IF NOT EXISTS kapt_addr TEXT; -- 지번주소
ALTER TABLE apartment_complexes ADD COLUMN IF NOT EXISTS bjd_code TEXT; -- 법정동코드
ALTER TABLE apartment_complexes ADD COLUMN IF NOT EXISTS zipcode TEXT; -- 우편번호

-- 단지 정보
ALTER TABLE apartment_complexes ADD COLUMN IF NOT EXISTS kapt_tarea NUMERIC; -- 대지면적
ALTER TABLE apartment_complexes ADD COLUMN IF NOT EXISTS kapt_marea NUMERIC; -- 연면적
ALTER TABLE apartment_complexes ADD COLUMN IF NOT EXISTS priv_area NUMERIC; -- 전용면적 합계
ALTER TABLE apartment_complexes ADD COLUMN IF NOT EXISTS kapt_dong_cnt INTEGER; -- 동수
ALTER TABLE apartment_complexes ADD COLUMN IF NOT EXISTS kapt_da_cnt INTEGER; -- 세대수
ALTER TABLE apartment_complexes ADD COLUMN IF NOT EXISTS ho_cnt INTEGER; -- 호수

-- 분류 코드들
ALTER TABLE apartment_complexes ADD COLUMN IF NOT EXISTS code_sale_nm TEXT; -- 분양형태
ALTER TABLE apartment_complexes ADD COLUMN IF NOT EXISTS code_heat_nm TEXT; -- 난방방식
ALTER TABLE apartment_complexes ADD COLUMN IF NOT EXISTS code_mgr_nm TEXT; -- 관리방식
ALTER TABLE apartment_complexes ADD COLUMN IF NOT EXISTS code_apt_nm TEXT; -- 아파트분류
ALTER TABLE apartment_complexes ADD COLUMN IF NOT EXISTS code_hall_nm TEXT; -- 복도유형

-- 회사 정보
ALTER TABLE apartment_complexes ADD COLUMN IF NOT EXISTS kapt_bcompany TEXT; -- 시공회사
ALTER TABLE apartment_complexes ADD COLUMN IF NOT EXISTS kapt_acompany TEXT; -- 시행회사

-- 연락처
ALTER TABLE apartment_complexes ADD COLUMN IF NOT EXISTS kapt_tel TEXT; -- 관리사무소 전화
ALTER TABLE apartment_complexes ADD COLUMN IF NOT EXISTS kapt_fax TEXT; -- 관리사무소 팩스
ALTER TABLE apartment_complexes ADD COLUMN IF NOT EXISTS kapt_url TEXT; -- 홈페이지

-- 건물 구조
ALTER TABLE apartment_complexes ADD COLUMN IF NOT EXISTS kapt_base_floor INTEGER; -- 지하층수
ALTER TABLE apartment_complexes ADD COLUMN IF NOT EXISTS kapt_top_floor INTEGER; -- 지상최고층수
ALTER TABLE apartment_complexes ADD COLUMN IF NOT EXISTS ktown_flr_no INTEGER; -- 지상층수
ALTER TABLE apartment_complexes ADD COLUMN IF NOT EXISTS kapt_usedate TEXT; -- 사용승인일

-- 승강기
ALTER TABLE apartment_complexes ADD COLUMN IF NOT EXISTS kaptd_ecntp INTEGER; -- 승강기 승강정원

-- 면적별 세대수
ALTER TABLE apartment_complexes ADD COLUMN IF NOT EXISTS kapt_mparea60 INTEGER; -- 60㎡이하
ALTER TABLE apartment_complexes ADD COLUMN IF NOT EXISTS kapt_mparea85 INTEGER; -- 60㎡초과~85㎡이하  
ALTER TABLE apartment_complexes ADD COLUMN IF NOT EXISTS kapt_mparea135 INTEGER; -- 85㎡초과~135㎡이하
ALTER TABLE apartment_complexes ADD COLUMN IF NOT EXISTS kapt_mparea136 INTEGER; -- 135㎡초과

-- 상세정보 API 필드들 (36개)
-- 관리 정보
ALTER TABLE apartment_complexes ADD COLUMN IF NOT EXISTS code_mgr TEXT; -- 일반관리방식
ALTER TABLE apartment_complexes ADD COLUMN IF NOT EXISTS kapt_mgr_cnt INTEGER; -- 일반관리인원
ALTER TABLE apartment_complexes ADD COLUMN IF NOT EXISTS kapt_ccompany TEXT; -- 일반관리업체

-- 경비관리
ALTER TABLE apartment_complexes ADD COLUMN IF NOT EXISTS code_sec TEXT; -- 경비관리방식
ALTER TABLE apartment_complexes ADD COLUMN IF NOT EXISTS kaptd_scnt INTEGER; -- 경비관리인원
ALTER TABLE apartment_complexes ADD COLUMN IF NOT EXISTS kaptd_sec_com TEXT; -- 경비관리업체

-- 청소관리
ALTER TABLE apartment_complexes ADD COLUMN IF NOT EXISTS code_clean TEXT; -- 청소관리방식
ALTER TABLE apartment_complexes ADD COLUMN IF NOT EXISTS kaptd_clcnt INTEGER; -- 청소관리인원

-- 소독관리
ALTER TABLE apartment_complexes ADD COLUMN IF NOT EXISTS code_disinf TEXT; -- 소독관리방식
ALTER TABLE apartment_complexes ADD COLUMN IF NOT EXISTS kaptd_dcnt INTEGER; -- 소독관리인원
ALTER TABLE apartment_complexes ADD COLUMN IF NOT EXISTS disposal_type TEXT; -- 소독방법

-- 기타 관리
ALTER TABLE apartment_complexes ADD COLUMN IF NOT EXISTS code_garbage TEXT; -- 생활폐기물 수거방법

-- 건물 구조 및 시설
ALTER TABLE apartment_complexes ADD COLUMN IF NOT EXISTS code_str TEXT; -- 건물구조
ALTER TABLE apartment_complexes ADD COLUMN IF NOT EXISTS kaptd_ecapa INTEGER; -- 수전용량
ALTER TABLE apartment_complexes ADD COLUMN IF NOT EXISTS code_econ TEXT; -- 전기계약방법
ALTER TABLE apartment_complexes ADD COLUMN IF NOT EXISTS code_emgr TEXT; -- 전기관리방법
ALTER TABLE apartment_complexes ADD COLUMN IF NOT EXISTS code_falarm TEXT; -- 화재경보설비
ALTER TABLE apartment_complexes ADD COLUMN IF NOT EXISTS code_wsupply TEXT; -- 급수방식
ALTER TABLE apartment_complexes ADD COLUMN IF NOT EXISTS code_net TEXT; -- 인터넷설비

-- 승강기 관리
ALTER TABLE apartment_complexes ADD COLUMN IF NOT EXISTS code_elev TEXT; -- 승강기관리방법
ALTER TABLE apartment_complexes ADD COLUMN IF NOT EXISTS kaptd_ecnt INTEGER; -- 승강기대수

-- 주차시설
ALTER TABLE apartment_complexes ADD COLUMN IF NOT EXISTS kaptd_pcnt INTEGER; -- 지상주차대수
ALTER TABLE apartment_complexes ADD COLUMN IF NOT EXISTS kaptd_pcntu INTEGER; -- 지하주차대수

-- 보안시설
ALTER TABLE apartment_complexes ADD COLUMN IF NOT EXISTS kaptd_cccnt INTEGER; -- CCTV설치대수

-- 편의시설
ALTER TABLE apartment_complexes ADD COLUMN IF NOT EXISTS welfare_facility TEXT; -- 복리시설
ALTER TABLE apartment_complexes ADD COLUMN IF NOT EXISTS convenient_facility TEXT; -- 편의시설
ALTER TABLE apartment_complexes ADD COLUMN IF NOT EXISTS education_facility TEXT; -- 교육시설

-- 교통정보
ALTER TABLE apartment_complexes ADD COLUMN IF NOT EXISTS kaptd_wtimebus TEXT; -- 버스정류장거리
ALTER TABLE apartment_complexes ADD COLUMN IF NOT EXISTS subway_line TEXT; -- 지하철노선
ALTER TABLE apartment_complexes ADD COLUMN IF NOT EXISTS subway_station TEXT; -- 지하철역명
ALTER TABLE apartment_complexes ADD COLUMN IF NOT EXISTS kaptd_wtimesub TEXT; -- 지하철역거리

-- 전기차 충전시설
ALTER TABLE apartment_complexes ADD COLUMN IF NOT EXISTS ground_el_charger_cnt INTEGER; -- 지상 전기차충전기
ALTER TABLE apartment_complexes ADD COLUMN IF NOT EXISTS underground_el_charger_cnt INTEGER; -- 지하 전기차충전기

-- 사용여부
ALTER TABLE apartment_complexes ADD COLUMN IF NOT EXISTS use_yn TEXT; -- 사용여부

-- 인덱스 추가 (검색 성능 향상)
CREATE INDEX IF NOT EXISTS idx_apartment_complexes_kapt_da_cnt ON apartment_complexes(kapt_da_cnt); -- 세대수 인덱스
CREATE INDEX IF NOT EXISTS idx_apartment_complexes_kapt_usedate ON apartment_complexes(kapt_usedate); -- 건축년도 인덱스
CREATE INDEX IF NOT EXISTS idx_apartment_complexes_kaptd_pcnt ON apartment_complexes(kaptd_pcnt); -- 주차대수 인덱스
CREATE INDEX IF NOT EXISTS idx_apartment_complexes_kaptd_pcntu ON apartment_complexes(kaptd_pcntu); -- 지하주차 인덱스
CREATE INDEX IF NOT EXISTS idx_apartment_complexes_subway_line ON apartment_complexes(subway_line); -- 지하철노선 인덱스

-- 코멘트 추가
COMMENT ON COLUMN apartment_complexes.kapt_da_cnt IS '세대수';
COMMENT ON COLUMN apartment_complexes.kapt_dong_cnt IS '동수';
COMMENT ON COLUMN apartment_complexes.kapt_usedate IS '사용승인일 (YYYYMMDD)';
COMMENT ON COLUMN apartment_complexes.kapt_bcompany IS '시공회사';
COMMENT ON COLUMN apartment_complexes.kaptd_pcnt IS '지상주차대수';
COMMENT ON COLUMN apartment_complexes.kaptd_pcntu IS '지하주차대수';
COMMENT ON COLUMN apartment_complexes.kaptd_ecnt IS '승강기대수';
COMMENT ON COLUMN apartment_complexes.kaptd_cccnt IS 'CCTV설치대수';
COMMENT ON COLUMN apartment_complexes.welfare_facility IS '복리시설';
COMMENT ON COLUMN apartment_complexes.convenient_facility IS '편의시설';
COMMENT ON COLUMN apartment_complexes.education_facility IS '교육시설';
COMMENT ON COLUMN apartment_complexes.subway_line IS '지하철노선';
COMMENT ON COLUMN apartment_complexes.subway_station IS '지하철역명';
COMMENT ON COLUMN apartment_complexes.ground_el_charger_cnt IS '지상 전기차충전기 대수';
COMMENT ON COLUMN apartment_complexes.underground_el_charger_cnt IS '지하 전기차충전기 대수';