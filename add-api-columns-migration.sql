-- 외부 API에서 가져올 수 있는 추가 컬럼들을 apartments 테이블에 추가
-- 국토교통부 공동주택 기본정보/상세정보 API V4 기반

-- 관리 정보
ALTER TABLE apartments ADD COLUMN IF NOT EXISTS code_mgr VARCHAR(100); -- 일반관리방식
ALTER TABLE apartments ADD COLUMN IF NOT EXISTS kapt_mgr_cnt INTEGER; -- 일반관리인원
ALTER TABLE apartments ADD COLUMN IF NOT EXISTS kapt_c_company VARCHAR(200); -- 일반관리 계약업체

-- 경비 관리
ALTER TABLE apartments ADD COLUMN IF NOT EXISTS code_sec VARCHAR(100); -- 경비관리방식
ALTER TABLE apartments ADD COLUMN IF NOT EXISTS kaptd_scnt INTEGER; -- 경비관리인원
ALTER TABLE apartments ADD COLUMN IF NOT EXISTS kaptd_sec_com VARCHAR(200); -- 경비관리 계약업체

-- 청소 관리
ALTER TABLE apartments ADD COLUMN IF NOT EXISTS code_clean VARCHAR(100); -- 청소관리방식
ALTER TABLE apartments ADD COLUMN IF NOT EXISTS kaptd_clcnt INTEGER; -- 청소관리인원

-- 소독 관리
ALTER TABLE apartments ADD COLUMN IF NOT EXISTS code_disinf VARCHAR(100); -- 소독관리방식
ALTER TABLE apartments ADD COLUMN IF NOT EXISTS kaptd_dcnt INTEGER; -- 소독관리 연간소독횟수
ALTER TABLE apartments ADD COLUMN IF NOT EXISTS disposal_type VARCHAR(100); -- 소독방법

-- 시설 정보
ALTER TABLE apartments ADD COLUMN IF NOT EXISTS code_garbage VARCHAR(100); -- 음식물처리방법
ALTER TABLE apartments ADD COLUMN IF NOT EXISTS code_str VARCHAR(100); -- 건물구조
ALTER TABLE apartments ADD COLUMN IF NOT EXISTS kaptd_ecapa INTEGER; -- 수전용량
ALTER TABLE apartments ADD COLUMN IF NOT EXISTS code_econ VARCHAR(100); -- 세대전기계약방식
ALTER TABLE apartments ADD COLUMN IF NOT EXISTS code_emgr VARCHAR(100); -- 전기안전관리자법정선임여부
ALTER TABLE apartments ADD COLUMN IF NOT EXISTS code_falarm VARCHAR(100); -- 화재수신반방식
ALTER TABLE apartments ADD COLUMN IF NOT EXISTS code_wsupply VARCHAR(100); -- 급수방식

-- 승강기 관리
ALTER TABLE apartments ADD COLUMN IF NOT EXISTS code_elev VARCHAR(100); -- 승강기관리형태
ALTER TABLE apartments ADD COLUMN IF NOT EXISTS kaptd_ecnt INTEGER; -- 승강기대수

-- 주차 및 보안
ALTER TABLE apartments ADD COLUMN IF NOT EXISTS code_net VARCHAR(100); -- 주차관제.홈네트워크
ALTER TABLE apartments ADD COLUMN IF NOT EXISTS kaptd_cccnt INTEGER; -- CCTV대수

-- 전기충전기
ALTER TABLE apartments ADD COLUMN IF NOT EXISTS underground_el_charger_cnt INTEGER; -- 지하 전기충전기 대수
ALTER TABLE apartments ADD COLUMN IF NOT EXISTS ground_el_charger_cnt INTEGER; -- 지상 전기충전기 대수

-- 층수 정보
ALTER TABLE apartments ADD COLUMN IF NOT EXISTS kapt_top_floor INTEGER; -- 최고층수
ALTER TABLE apartments ADD COLUMN IF NOT EXISTS ktown_flr_no INTEGER; -- 지상층수
ALTER TABLE apartments ADD COLUMN IF NOT EXISTS kapt_base_floor INTEGER; -- 지하층수

-- 전기 정보
ALTER TABLE apartments ADD COLUMN IF NOT EXISTS kaptd_ecntp INTEGER; -- 전기용량

-- 면적별 세대현황
ALTER TABLE apartments ADD COLUMN IF NOT EXISTS kapt_mparea60 INTEGER; -- 60㎡ 이하 세대수
ALTER TABLE apartments ADD COLUMN IF NOT EXISTS kapt_mparea85 INTEGER; -- 60㎡ ~ 85㎡ 이하 세대수
ALTER TABLE apartments ADD COLUMN IF NOT EXISTS kapt_mparea135 INTEGER; -- 85㎡ ~ 135㎡ 이하 세대수
ALTER TABLE apartments ADD COLUMN IF NOT EXISTS kapt_mparea136 INTEGER; -- 135㎡ 초과 세대수

-- 분양 및 관리 정보 (기본정보 API에서)
ALTER TABLE apartments ADD COLUMN IF NOT EXISTS code_sale_nm VARCHAR(100); -- 분양형태
ALTER TABLE apartments ADD COLUMN IF NOT EXISTS code_heat_nm VARCHAR(100); -- 난방방식
ALTER TABLE apartments ADD COLUMN IF NOT EXISTS code_apt_nm VARCHAR(100); -- 단지분류
ALTER TABLE apartments ADD COLUMN IF NOT EXISTS code_mgr_nm VARCHAR(100); -- 관리방식
ALTER TABLE apartments ADD COLUMN IF NOT EXISTS code_hall_nm VARCHAR(100); -- 복도유형

-- 면적 정보
ALTER TABLE apartments ADD COLUMN IF NOT EXISTS kapt_marea DECIMAL(10,2); -- 관리비부과면적(㎡)
ALTER TABLE apartments ADD COLUMN IF NOT EXISTS priv_area DECIMAL(10,2); -- 단지 전용면적합(㎡)
ALTER TABLE apartments ADD COLUMN IF NOT EXISTS ho_cnt INTEGER; -- 호수

-- 업체 정보 (중복 방지를 위해 기존과 다른 이름 사용)
ALTER TABLE apartments ADD COLUMN IF NOT EXISTS kapt_bcompany VARCHAR(200); -- 시공사 (construction_company와 중복 방지)
ALTER TABLE apartments ADD COLUMN IF NOT EXISTS kapt_acompany VARCHAR(200); -- 시행사

-- 연락처 정보 (중복 방지)
ALTER TABLE apartments ADD COLUMN IF NOT EXISTS kapt_tel VARCHAR(50); -- 관리사무소연락처 (management_office_tel과 중복 방지)
ALTER TABLE apartments ADD COLUMN IF NOT EXISTS kapt_fax VARCHAR(50); -- 관리사무소팩스 (management_office_fax와 중복 방지)
ALTER TABLE apartments ADD COLUMN IF NOT EXISTS kapt_url TEXT; -- 홈페이지주소 (website_url과 중복 방지)

-- 사용여부
ALTER TABLE apartments ADD COLUMN IF NOT EXISTS use_yn VARCHAR(1); -- 사용여부

-- 코멘트 추가
COMMENT ON COLUMN apartments.code_mgr IS '일반관리방식';
COMMENT ON COLUMN apartments.kapt_mgr_cnt IS '일반관리인원';
COMMENT ON COLUMN apartments.kapt_c_company IS '일반관리 계약업체';
COMMENT ON COLUMN apartments.code_sec IS '경비관리방식';
COMMENT ON COLUMN apartments.kaptd_scnt IS '경비관리인원';
COMMENT ON COLUMN apartments.kaptd_sec_com IS '경비관리 계약업체';
COMMENT ON COLUMN apartments.code_clean IS '청소관리방식';
COMMENT ON COLUMN apartments.kaptd_clcnt IS '청소관리인원';
COMMENT ON COLUMN apartments.code_disinf IS '소독관리방식';
COMMENT ON COLUMN apartments.kaptd_dcnt IS '소독관리 연간소독횟수';
COMMENT ON COLUMN apartments.disposal_type IS '소독방법';
COMMENT ON COLUMN apartments.code_garbage IS '음식물처리방법';
COMMENT ON COLUMN apartments.code_str IS '건물구조';
COMMENT ON COLUMN apartments.kaptd_ecapa IS '수전용량';
COMMENT ON COLUMN apartments.code_econ IS '세대전기계약방식';
COMMENT ON COLUMN apartments.code_emgr IS '전기안전관리자법정선임여부';
COMMENT ON COLUMN apartments.code_falarm IS '화재수신반방식';
COMMENT ON COLUMN apartments.code_wsupply IS '급수방식';
COMMENT ON COLUMN apartments.code_elev IS '승강기관리형태';
COMMENT ON COLUMN apartments.kaptd_ecnt IS '승강기대수';
COMMENT ON COLUMN apartments.code_net IS '주차관제.홈네트워크';
COMMENT ON COLUMN apartments.kaptd_cccnt IS 'CCTV대수';
COMMENT ON COLUMN apartments.underground_el_charger_cnt IS '지하 전기충전기 대수';
COMMENT ON COLUMN apartments.ground_el_charger_cnt IS '지상 전기충전기 대수';
COMMENT ON COLUMN apartments.kapt_top_floor IS '최고층수';
COMMENT ON COLUMN apartments.ktown_flr_no IS '지상층수';
COMMENT ON COLUMN apartments.kapt_base_floor IS '지하층수';
COMMENT ON COLUMN apartments.kaptd_ecntp IS '전기용량';
COMMENT ON COLUMN apartments.kapt_mparea60 IS '60㎡ 이하 세대수';
COMMENT ON COLUMN apartments.kapt_mparea85 IS '60㎡ ~ 85㎡ 이하 세대수';
COMMENT ON COLUMN apartments.kapt_mparea135 IS '85㎡ ~ 135㎡ 이하 세대수';
COMMENT ON COLUMN apartments.kapt_mparea136 IS '135㎡ 초과 세대수';
COMMENT ON COLUMN apartments.use_yn IS '사용여부';