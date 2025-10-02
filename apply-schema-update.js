/**
 * Supabase 스키마 업데이트 적용
 * 67개 새로운 컬럼 추가
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// 추가할 컬럼 정의
const newColumns = [
  // 기본정보 API 필드들
  { name: 'kapt_addr', type: 'TEXT', comment: '지번주소' },
  { name: 'bjd_code', type: 'TEXT', comment: '법정동코드' },
  { name: 'zipcode', type: 'TEXT', comment: '우편번호' },
  { name: 'kapt_tarea', type: 'NUMERIC', comment: '대지면적' },
  { name: 'kapt_marea', type: 'NUMERIC', comment: '연면적' },
  { name: 'priv_area', type: 'NUMERIC', comment: '전용면적 합계' },
  { name: 'kapt_dong_cnt', type: 'INTEGER', comment: '동수' },
  { name: 'kapt_da_cnt', type: 'INTEGER', comment: '세대수' },
  { name: 'ho_cnt', type: 'INTEGER', comment: '호수' },
  { name: 'code_sale_nm', type: 'TEXT', comment: '분양형태' },
  { name: 'code_heat_nm', type: 'TEXT', comment: '난방방식' },
  { name: 'code_mgr_nm', type: 'TEXT', comment: '관리방식' },
  { name: 'code_apt_nm', type: 'TEXT', comment: '아파트분류' },
  { name: 'code_hall_nm', type: 'TEXT', comment: '복도유형' },
  { name: 'kapt_bcompany', type: 'TEXT', comment: '시공회사' },
  { name: 'kapt_acompany', type: 'TEXT', comment: '시행회사' },
  { name: 'kapt_tel', type: 'TEXT', comment: '관리사무소 전화' },
  { name: 'kapt_fax', type: 'TEXT', comment: '관리사무소 팩스' },
  { name: 'kapt_url', type: 'TEXT', comment: '홈페이지' },
  { name: 'kapt_base_floor', type: 'INTEGER', comment: '지하층수' },
  { name: 'kapt_top_floor', type: 'INTEGER', comment: '지상최고층수' },
  { name: 'ktown_flr_no', type: 'INTEGER', comment: '지상층수' },
  { name: 'kapt_usedate', type: 'TEXT', comment: '사용승인일' },
  { name: 'kaptd_ecntp', type: 'INTEGER', comment: '승강기 승강정원' },
  { name: 'kapt_mparea60', type: 'INTEGER', comment: '60㎡이하' },
  { name: 'kapt_mparea85', type: 'INTEGER', comment: '60㎡초과~85㎡이하' },
  { name: 'kapt_mparea135', type: 'INTEGER', comment: '85㎡초과~135㎡이하' },
  { name: 'kapt_mparea136', type: 'INTEGER', comment: '135㎡초과' },
  
  // 상세정보 API 필드들
  { name: 'code_mgr', type: 'TEXT', comment: '일반관리방식' },
  { name: 'kapt_mgr_cnt', type: 'INTEGER', comment: '일반관리인원' },
  { name: 'kapt_ccompany', type: 'TEXT', comment: '일반관리업체' },
  { name: 'code_sec', type: 'TEXT', comment: '경비관리방식' },
  { name: 'kaptd_scnt', type: 'INTEGER', comment: '경비관리인원' },
  { name: 'kaptd_sec_com', type: 'TEXT', comment: '경비관리업체' },
  { name: 'code_clean', type: 'TEXT', comment: '청소관리방식' },
  { name: 'kaptd_clcnt', type: 'INTEGER', comment: '청소관리인원' },
  { name: 'code_disinf', type: 'TEXT', comment: '소독관리방식' },
  { name: 'kaptd_dcnt', type: 'INTEGER', comment: '소독관리인원' },
  { name: 'disposal_type', type: 'TEXT', comment: '소독방법' },
  { name: 'code_garbage', type: 'TEXT', comment: '생활폐기물 수거방법' },
  { name: 'code_str', type: 'TEXT', comment: '건물구조' },
  { name: 'kaptd_ecapa', type: 'INTEGER', comment: '수전용량' },
  { name: 'code_econ', type: 'TEXT', comment: '전기계약방법' },
  { name: 'code_emgr', type: 'TEXT', comment: '전기관리방법' },
  { name: 'code_falarm', type: 'TEXT', comment: '화재경보설비' },
  { name: 'code_wsupply', type: 'TEXT', comment: '급수방식' },
  { name: 'code_net', type: 'TEXT', comment: '인터넷설비' },
  { name: 'code_elev', type: 'TEXT', comment: '승강기관리방법' },
  { name: 'kaptd_ecnt', type: 'INTEGER', comment: '승강기대수' },
  { name: 'kaptd_pcnt', type: 'INTEGER', comment: '지상주차대수' },
  { name: 'kaptd_pcntu', type: 'INTEGER', comment: '지하주차대수' },
  { name: 'kaptd_cccnt', type: 'INTEGER', comment: 'CCTV설치대수' },
  { name: 'welfare_facility', type: 'TEXT', comment: '복리시설' },
  { name: 'convenient_facility', type: 'TEXT', comment: '편의시설' },
  { name: 'education_facility', type: 'TEXT', comment: '교육시설' },
  { name: 'kaptd_wtimebus', type: 'TEXT', comment: '버스정류장거리' },
  { name: 'subway_line', type: 'TEXT', comment: '지하철노선' },
  { name: 'subway_station', type: 'TEXT', comment: '지하철역명' },
  { name: 'kaptd_wtimesub', type: 'TEXT', comment: '지하철역거리' },
  { name: 'ground_el_charger_cnt', type: 'INTEGER', comment: '지상 전기차충전기' },
  { name: 'underground_el_charger_cnt', type: 'INTEGER', comment: '지하 전기차충전기' },
  { name: 'use_yn', type: 'TEXT', comment: '사용여부' }
];

async function applySchemaUpdate() {
  console.log('🚀 데이터베이스 스키마 업데이트 시작');
  console.log(`📊 총 ${newColumns.length}개 컬럼 추가 예정\n`);
  
  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;
  
  // 1. 컬럼 추가
  console.log('🔧 1단계: 새 컬럼 추가');
  
  for (const column of newColumns) {
    try {
      console.log(`⚡ ${column.name} (${column.type}) 추가 중...`);
      
      // RPC 함수로 컬럼 추가 시도 (존재하지 않는 경우에만)
      const { data, error } = await supabase.rpc('add_column_if_not_exists', {
        table_name: 'apartment_complexes',
        column_name: column.name,
        column_type: column.type
      });
      
      if (error) {
        if (error.message.includes('already exists') || error.message.includes('does not exist')) {
          console.log(`  ⏭️ ${column.name}: 이미 존재하거나 RPC 함수 없음`);
          skipCount++;
        } else {
          console.log(`  ❌ ${column.name}: ${error.message}`);
          errorCount++;
        }
      } else {
        console.log(`  ✅ ${column.name}: 추가 완료`);
        successCount++;
      }
      
    } catch (err) {
      console.log(`  ❌ ${column.name}: ${err.message}`);
      errorCount++;
    }
    
    // API 호출 제한 준수
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('\n📊 1단계 결과:');
  console.log(`✅ 성공: ${successCount}개`);
  console.log(`⏭️ 스킵: ${skipCount}개`);
  console.log(`❌ 오류: ${errorCount}개`);
  
  // 2. 테이블 구조 확인
  console.log('\n🔍 2단계: 업데이트된 테이블 구조 확인');
  
  try {
    const { data, error } = await supabase
      .from('apartment_complexes')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ 테이블 조회 오류:', error.message);
    } else if (data && data.length > 0) {
      const record = data[0];
      const columns = Object.keys(record);
      
      console.log(`✅ 현재 테이블 컬럼 수: ${columns.length}개`);
      
      // 새로 추가된 컬럼 확인
      const addedColumns = newColumns.filter(col => columns.includes(col.name));
      console.log(`🆕 새 컬럼 ${addedColumns.length}개 중 존재하는 컬럼:`);
      addedColumns.forEach(col => {
        console.log(`  - ${col.name}: ${col.comment}`);
      });
      
      const missingColumns = newColumns.filter(col => !columns.includes(col.name));
      if (missingColumns.length > 0) {
        console.log(`⚠️ 아직 없는 컬럼 ${missingColumns.length}개:`);
        missingColumns.slice(0, 5).forEach(col => {
          console.log(`  - ${col.name}: ${col.comment}`);
        });
        if (missingColumns.length > 5) {
          console.log(`  ... 및 ${missingColumns.length - 5}개 더`);
        }
      }
    }
    
  } catch (error) {
    console.log('❌ 테이블 구조 확인 오류:', error.message);
  }
  
  console.log('\n🎉 스키마 업데이트 완료!');
  
  if (errorCount === 0 && successCount > 0) {
    console.log('✅ 스키마 업데이트가 성공적으로 완료되었습니다.');
    console.log('📝 이제 향상된 데이터 수집 스크립트를 실행할 수 있습니다.');
  } else if (skipCount > 0) {
    console.log('⚠️ 일부 컬럼이 이미 존재하거나 RPC 함수를 사용할 수 없습니다.');
    console.log('💡 Supabase SQL Editor에서 수동으로 스키마를 업데이트해주세요.');
    console.log('📁 update-schema-supabase.sql 파일을 확인하세요.');
  } else {
    console.log('❌ 스키마 업데이트에 오류가 발생했습니다.');
    console.log('💡 Supabase 대시보드에서 수동으로 컬럼을 추가해주세요.');
  }
}

// 실행
applySchemaUpdate().then(() => {
  console.log('✅ 스크립트 완료');
  process.exit(0);
}).catch(error => {
  console.error('❌ 스크립트 오류:', error);
  process.exit(1);
});