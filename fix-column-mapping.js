/**
 * 컬럼 매핑을 통한 스키마 호환성 해결
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://saucdbvjjwqgvbhcylhv.supabase.co', 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhdWNkYnZqandxZ3ZiaGN5bGh2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODAxMDQyNCwiZXhwIjoyMDczNTg2NDI0fQ.nHI5FAi6l29fyhkVRDmOeT3FJBV4_UsmM5_V28Bl-VA'
);

async function mapExistingColumns() {
  console.log('🔍 기존 컬럼 매핑을 통한 호환성 해결...\n');

  // 컬럼 매핑 테이블
  const columnMapping = {
    'build_year': 'kapt_usedate',      // 사용승인일자를 건축년도로 매핑
    'household_count': 'ho_cnt',       // 세대수
    'dong_count': 'kapt_dong_cnt',     // 동수
    'floor_count': 'kapt_top_floor',   // 최고층수
    'total_area': 'kapt_tarea',        // 연면적
    'heating_type': 'code_heat_nm',    // 난방방식
    'management_type': 'code_mgr_nm'   // 관리방식
  };

  console.log('📋 컬럼 매핑 정보:');
  Object.entries(columnMapping).forEach(([expected, actual]) => {
    console.log(`   ${expected} → ${actual}`);
  });

  console.log('\n🧪 매핑된 컬럼으로 데이터 조회 테스트...');

  try {
    // 매핑된 컬럼명으로 조회하고 별칭(alias) 사용
    const { data, error } = await supabase
      .from('apartment_complexes')
      .select(`
        name, 
        kapt_code,
        kapt_usedate,
        ho_cnt,
        kapt_dong_cnt,
        kapt_top_floor,
        kapt_tarea,
        code_heat_nm,
        code_mgr_nm
      `)
      .limit(5);

    if (error) {
      console.error('❌ 매핑 테스트 실패:', error.message);
      return false;
    }

    console.log('✅ 매핑된 컬럼으로 조회 성공!');
    console.log('\n📊 샘플 데이터:');
    data.forEach(item => {
      // 사용승인일자에서 년도 추출
      const buildYear = item.kapt_usedate ? 
        new Date(item.kapt_usedate).getFullYear() : null;
        
      console.log(`   🏢 ${item.name} (${item.kapt_code})`);
      console.log(`      사용승인: ${item.kapt_usedate} → 건축년도: ${buildYear}`);
      console.log(`      세대수: ${item.ho_cnt}, 동수: ${item.kapt_dong_cnt}`);
      console.log(`      층수: ${item.kapt_top_floor}, 연면적: ${item.kapt_tarea}`);
      console.log(`      난방: ${item.code_heat_nm}, 관리: ${item.code_mgr_nm}`);
      console.log('');
    });

    return true;

  } catch (error) {
    console.error('❌ 매핑 테스트 중 에러:', error.message);
    return false;
  }
}

async function createCompatibilityLayer() {
  console.log('🔧 호환성 레이어 생성...\n');
  
  // 호환성을 위한 함수 생성 시도 (제한될 수 있음)
  console.log('💡 해결 방안:');
  console.log('1. 코드에서 올바른 컬럼명 사용');
  console.log('2. 호환성 유틸 함수 생성');
  console.log('3. 데이터 조회 시 자동 매핑');
  
  // TypeScript 타입 정의 파일 생성
  const typeDefinitions = `
// 호환성을 위한 컬럼 매핑 타입
export interface ApartmentComplexMapping {
  build_year: 'kapt_usedate';
  household_count: 'ho_cnt';
  dong_count: 'kapt_dong_cnt'; 
  floor_count: 'kapt_top_floor';
  total_area: 'kapt_tarea';
  heating_type: 'code_heat_nm';
  management_type: 'code_mgr_nm';
}

// 매핑된 컬럼으로 조회 시 사용할 실제 컬럼명
export const COLUMN_MAPPING = {
  'build_year': 'kapt_usedate',
  'household_count': 'ho_cnt', 
  'dong_count': 'kapt_dong_cnt',
  'floor_count': 'kapt_top_floor',
  'total_area': 'kapt_tarea',
  'heating_type': 'code_heat_nm',
  'management_type': 'code_mgr_nm'
} as const;
`;

  console.log('\n📝 생성할 타입 정의:');
  console.log(typeDefinitions);
}

async function testCompatibility() {
  console.log('🎯 최종 호환성 테스트...\n');
  
  try {
    // 문제가 있었던 쿼리를 매핑된 컬럼으로 다시 실행
    const { data, error } = await supabase
      .from('apartment_complexes')
      .select(`
        name, 
        kapt_code, 
        address,
        kapt_usedate,
        ho_cnt,
        kapt_dong_cnt
      `)
      .limit(3);

    if (error) {
      console.error('❌ 호환성 테스트 실패:', error.message);
      return false;
    }

    console.log('✅ 호환성 테스트 성공!');
    console.log('📊 아파트 복합단지 데이터:');
    data.forEach(complex => {
      const buildYear = complex.kapt_usedate ? 
        new Date(complex.kapt_usedate).getFullYear() : 'N/A';
        
      console.log(`- ${complex.name} (${complex.kapt_code})`);
      console.log(`  주소: ${complex.address}`);
      console.log(`  건축년도: ${buildYear}, 세대수: ${complex.ho_cnt || 'N/A'}`);
      console.log('');
    });

    return true;

  } catch (error) {
    console.error('❌ 호환성 테스트 중 에러:', error.message);
    return false;
  }
}

async function main() {
  const mappingSuccess = await mapExistingColumns();
  
  if (mappingSuccess) {
    await createCompatibilityLayer();
    const compatibilitySuccess = await testCompatibility();
    
    if (compatibilitySuccess) {
      console.log('🎉 스키마 호환성 문제 해결 완료!');
      console.log('✅ 이제 올바른 컬럼명을 사용하여 데이터를 조회할 수 있습니다.');
    }
  }
}

main().catch(console.error);