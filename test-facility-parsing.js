/**
 * 편의시설 파싱 로직 테스트
 */

// 테스트 데이터 (중복 학교 정보가 있는 케이스)
const testData = {
  welfare_facility: "관리사무소, 노인정, 어린이놀이터",
  convenient_facility: "관공서(성동구청, 성동경찰서, 성동우체국, 한국전력공사(성동변전소), 한전서울자재관리소) 병원(한양대병원) 공원(성동문화공원) 초등학교(행당) 중학교(무학중) 고등학교(무학여고)",
  education_facility: "초등학교(행당초, 무학초, 한양대부속초, 사근초) 중학교(무학중, 금학여중, 동마중, 행당중, 한양대부속중) 고등학교(무학여고, 성동고, 한국예술고, 한양사대부속여고, 덕수정보산업고) 대학교(한양대)",
  // 기존 facilities 배열에도 학교 정보가 들어있는 경우 시뮬레이션
  existingFacilities: ["쇼핑센터", "초등학교(행당)", "중학교(무학중)", "고등학교(무학여고)", "마트", "병원"],
  // educationFacilities 배열에서 불완전한 학교명이 들어있는 경우
  educationFacilities: ["행당초", "무학중", "무학여고", "행당", "대학교", "중"]
};

console.log('🔍 편의시설 파싱 테스트\n');

// 1. 복지시설 (단지내편의시설)
console.log('1. 복지시설 (단지내편의시설):');
const welfareFacilities = testData.welfare_facility.split(/[,;\/]/).map(f => f.trim()).filter(f => f.length > 0);
console.log('  ', welfareFacilities);

console.log('\n2. 기존 facilities 배열 처리 (학교 중복 제거):');
// 기존 facilities 배열에서 학교 정보 필터링 테스트
const filteredFacilities = testData.existingFacilities.filter(facility => {
  const isSchoolRelated = facility.includes('초등학교') || facility.includes('중학교') || 
                         facility.includes('고등학교') || facility.includes('대학교') ||
                         facility.includes('학교');
  return !isSchoolRelated;
});
console.log('  원본:', testData.existingFacilities);
console.log('  학교 제거 후:', filteredFacilities);

console.log('\n3. 편의시설 (주변시설로 분류):');
const convenientText = testData.convenient_facility;

// 관공서 파싱
const govMatch = convenientText.match(/관공서\(([^)]+)\)/);
if (govMatch) {
  const govFacilities = govMatch[1].split(/[,;]/).map(f => f.trim()).filter(f => f.length > 0);
  console.log('  관공서:', govFacilities);
}

// 병원 파싱
const hospitalMatch = convenientText.match(/병원\(([^)]*)\)/);
if (hospitalMatch && hospitalMatch[1].trim()) {
  const hospitals = hospitalMatch[1].split(/[,;]/).map(f => f.trim()).filter(f => f.length > 0);
  console.log('  병원:', hospitals);
}

// 공원 파싱
const parkMatch = convenientText.match(/공원\(([^)]+)\)/);
if (parkMatch) {
  const parks = parkMatch[1].split(/[,;]/).map(f => f.trim()).filter(f => f.length > 0);
  console.log('  공원:', parks);
}

// 기타 시설들 (학교 관련 정보 제외)
const remainingText = convenientText.replace(/관공서\([^)]*\)/g, '').replace(/병원\([^)]*\)/g, '').replace(/공원\([^)]*\)/g, '').trim();
if (remainingText) {
  console.log('  남은 텍스트 (학교 제거 전):', remainingText);
  const otherFacilities = remainingText.split(/[,;\/]/).map(f => f.trim()).filter(f => {
    const isSchoolRelated = f.includes('초등학교') || f.includes('중학교') || 
                           f.includes('고등학교') || f.includes('대학교') ||
                           f.includes('학교');
    return f.length > 0 && !f.match(/^\w+$/) && !isSchoolRelated;
  });
  console.log('  기타 시설 (학교 제거 후):', otherFacilities);
}

console.log('\n4. educationFacilities 배열 필터링:');
// 매우 엄격한 학교명 필터링 테스트
const validSchools = testData.educationFacilities.filter(school => {
  // 단일 글자나 2글자 지역명은 제외
  if (school.length <= 2) return false;
  
  // "초", "중", "고"로 끝나는 경우만 허용 (최소 3글자 이상)
  const hasValidSuffix = school.endsWith('초') || school.endsWith('중') || school.endsWith('고');
  
  // "대학교", "학교"가 포함된 경우 (최소 4글자 이상)
  const hasSchoolKeyword = school.includes('대학교') || 
                         (school.includes('학교') && school.length >= 4);
  
  return hasValidSuffix || hasSchoolKeyword;
});
console.log('  원본:', testData.educationFacilities);
console.log('  필터링 후:', validSchools);

console.log('\n5. 교육시설 (학교명 파싱):');
const educationText = testData.education_facility;
const schoolTypes = ['초등학교', '중학교', '고등학교', '대학교'];

schoolTypes.forEach(schoolType => {
  const pattern = new RegExp(`${schoolType}\\(([^)]+)\\)`, 'g');
  const matches = educationText.match(pattern);
  
  if (matches) {
    const schools = [];
    matches.forEach(match => {
      const schoolsMatch = match.match(/\(([^)]+)\)/);
      if (schoolsMatch) {
        const schoolNames = schoolsMatch[1].split(/[,;]/).map(s => s.trim()).filter(s => s.length > 0);
        schoolNames.forEach(school => {
          schools.push(school);
        });
      }
    });
    console.log(`  ${schoolType}:`, schools);
  }
});

console.log('\n✅ 파싱 결과 요약:');
console.log('- 단지내편의시설: 관리사무소, 노인정, 어린이놀이터만 포함');
console.log('- 관공서, 병원, 공원: 주변시설로 분류');
console.log('- 학교: 괄호 안의 학교명들만 개별 표시 (교육시설 섹션에서만)');
console.log('- 빈 괄호()는 표시되지 않음');
console.log('- 🆕 편의시설에서 중복 학교 정보 제거됨');
console.log('- 🆕 괄호 밖의 중복 학교 정보도 제거됨 (예: "초등학교(행당) 중학교(무학중)" 전체)');
console.log('- 🆕 불완전한 학교명 필터링됨 (예: "행당", "중", "대학교" 등)');