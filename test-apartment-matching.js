// 아파트 매칭 테스트 스크립트
const { XMLParser } = require('fast-xml-parser');

// 환경변수 로드
require('dotenv').config({ path: '.env.local' });

const SERVICE_KEY = process.env.NEXT_PUBLIC_DATA_GO_KR_SERVICE_KEY;
const API_BASE_URL = 'https://apis.data.go.kr/1613000';

// 테스트할 아파트들 (성북구 지역)
const TEST_APARTMENTS = [
  '정릉힐스테이트3차',
  '아이파크종암동2차', 
  '길음뉴타운5단지',
  '꿈의숲아이파크',
  '정릉힐스테이트'
];

// 성북구 LAWD_CD (11290)
const SEONGBUK_LAWD_CD = '11290';
const SEONGBUK_BJD_CODE = '1129000000';

async function fetchApartmentList(lawdCd) {
  try {
    const searchParams = new URLSearchParams({
      serviceKey: SERVICE_KEY,
      sigunguCode: lawdCd,
      pageNo: '1',
      numOfRows: '1000',
    });

    const url = `${API_BASE_URL}/AptListService3/getSigunguAptList3?${searchParams.toString()}`;
    console.log(`📡 단지목록 API 호출: ${url.substring(0, 100)}...`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`API 요청 실패: ${response.status}`);
    }

    const responseText = await response.text();
    console.log(`📄 API 응답 샘플: ${responseText.substring(0, 200)}...`);
    
    // V4 API는 JSON으로 응답
    const jsonData = JSON.parse(responseText);
    console.log('📋 파싱된 응답 구조:', JSON.stringify(jsonData, null, 2).substring(0, 500));
    
    if (jsonData.response?.body?.items) {
      return Array.isArray(jsonData.response.body.items) 
        ? jsonData.response.body.items 
        : [jsonData.response.body.items];
    }
    
    return [];
  } catch (error) {
    console.error('단지목록 조회 실패:', error);
    return [];
  }
}

function testMatching(targetName, apartmentList) {
  console.log(`\n🎯 매칭 테스트: "${targetName}"`);
  console.log('='.repeat(50));

  // 1. 정확한 매칭
  const exactMatch = apartmentList.find(item => item.kaptName === targetName);
  if (exactMatch) {
    console.log(`✅ 정확한 매칭 성공: ${targetName} → ${exactMatch.kaptCode}`);
    return { success: true, method: 'exact', match: exactMatch };
  }

  // 2. 부분 문자열 매칭
  const targetClean = targetName.replace(/[^\w가-힣]/g, '');
  const partialMatches = apartmentList.filter(item => {
    const itemClean = item.kaptName.replace(/[^\w가-힣]/g, '');
    return itemClean.includes(targetClean) || targetClean.includes(itemClean);
  });

  if (partialMatches.length > 0) {
    console.log(`🔍 부분 문자열 매칭 후보들:`);
    partialMatches.forEach((match, index) => {
      console.log(`  ${index + 1}. ${match.kaptName} (${match.kaptCode})`);
    });
    
    const bestMatch = partialMatches[0];
    console.log(`✅ 부분 매칭 선택: ${targetName} → ${bestMatch.kaptName} (${bestMatch.kaptCode})`);
    return { success: true, method: 'partial', match: bestMatch };
  }

  // 3. 키워드 매칭
  const keywords = targetName.split(/[^가-힣\w]+/).filter(k => k.length >= 2);
  console.log(`🔑 추출된 키워드: ${keywords.join(', ')}`);

  for (const keyword of keywords) {
    const keywordMatches = apartmentList.filter(item => 
      item.kaptName.includes(keyword)
    );
    
    if (keywordMatches.length > 0) {
      console.log(`🔍 키워드 "${keyword}" 매칭 후보들:`);
      keywordMatches.forEach((match, index) => {
        console.log(`  ${index + 1}. ${match.kaptName} (${match.kaptCode})`);
      });
      
      const bestMatch = keywordMatches[0];
      console.log(`✅ 키워드 매칭 성공: ${targetName} → ${bestMatch.kaptName} (${bestMatch.kaptCode})`);
      return { success: true, method: 'keyword', match: bestMatch, keyword };
    }
  }

  console.log(`❌ 매칭 실패: "${targetName}"`);
  
  // 유사한 이름들 찾기
  console.log(`📋 비슷한 아파트들 (참고):`);
  const similarNames = apartmentList
    .filter(item => {
      const itemName = item.kaptName.toLowerCase();
      return keywords.some(keyword => 
        itemName.includes(keyword.toLowerCase()) || 
        keyword.toLowerCase().includes(itemName)
      );
    })
    .slice(0, 5);
  
  if (similarNames.length > 0) {
    similarNames.forEach((item, index) => {
      console.log(`  ${index + 1}. ${item.kaptName} (${item.kaptCode})`);
    });
  } else {
    console.log(`  (유사한 아파트 없음)`);
  }

  return { success: false, method: 'none' };
}

async function runMatchingTests() {
  console.log('🏢 아파트 매칭 테스트 시작');
  console.log(`📍 테스트 지역: 성북구 (BJD코드: ${SEONGBUK_BJD_CODE})`);
  
  // 1. 성북구 아파트 목록 조회
  const apartmentList = await fetchApartmentList(SEONGBUK_LAWD_CD);
  console.log(`📊 조회된 아파트 수: ${apartmentList.length}개`);
  
  if (apartmentList.length === 0) {
    console.log('❌ 아파트 목록 조회 실패');
    return;
  }

  // 전체 아파트 목록 샘플 출력
  console.log(`\n📋 성북구 아파트 목록 샘플 (상위 10개):`);
  apartmentList.slice(0, 10).forEach((item, index) => {
    console.log(`  ${index + 1}. ${item.kaptName} (${item.kaptCode}) - ${item.as3}`);
  });

  // 실패할 것 같은 아파트들을 포함하는 키워드 검색
  console.log(`\n🔍 키워드별 아파트 검색:`);
  
  const searchKeywords = ['아이파크', '종암', '길음', '뉴타운'];
  searchKeywords.forEach(keyword => {
    const matches = apartmentList.filter(item => 
      item.kaptName.includes(keyword) || item.as3.includes(keyword)
    );
    console.log(`  "${keyword}" 키워드: ${matches.length}개`);
    matches.slice(0, 3).forEach(match => {
      console.log(`    - ${match.kaptName} (${match.as3})`);
    });
  });

  // 2. 각 테스트 아파트에 대해 매칭 테스트
  const results = [];
  
  for (const apartmentName of TEST_APARTMENTS) {
    const result = testMatching(apartmentName, apartmentList);
    results.push({ name: apartmentName, ...result });
  }

  // 3. 결과 요약
  console.log('\n📊 매칭 테스트 결과 요약');
  console.log('='.repeat(60));
  
  const successCount = results.filter(r => r.success).length;
  console.log(`✅ 매칭 성공: ${successCount}/${TEST_APARTMENTS.length}개`);
  console.log(`❌ 매칭 실패: ${TEST_APARTMENTS.length - successCount}/${TEST_APARTMENTS.length}개`);
  
  console.log('\n상세 결과:');
  results.forEach((result, index) => {
    const status = result.success ? '✅' : '❌';
    const method = result.method === 'exact' ? '정확' : 
                   result.method === 'partial' ? '부분' : 
                   result.method === 'keyword' ? '키워드' : '실패';
    const matchInfo = result.success ? `→ ${result.match.kaptName}` : '';
    
    console.log(`  ${index + 1}. ${status} ${result.name} (${method}) ${matchInfo}`);
  });

  // 실패한 케이스 분석
  const failures = results.filter(r => !r.success);
  if (failures.length > 0) {
    console.log('\n🔍 실패 케이스 분석:');
    failures.forEach(failure => {
      console.log(`  - ${failure.name}: 해당 이름과 유사한 아파트를 찾지 못함`);
    });
  }
}

// 테스트 실행
runMatchingTests().catch(console.error);