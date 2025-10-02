/**
 * kaptCode A10027297 단지 정보 테스트 스크립트
 */

// dotenv 로드
require('dotenv').config({ path: '.env.local' });

const { XMLParser } = require('fast-xml-parser');

// API 설정
const API_BASE_URL = 'https://apis.data.go.kr/1613000';
const SERVICE_KEY = process.env.NEXT_PUBLIC_DATA_GO_KR_SERVICE_KEY;

if (!SERVICE_KEY) {
  console.error('❌ SERVICE_KEY가 설정되지 않았습니다. .env.local 파일을 확인해주세요.');
  process.exit(1);
}

// XML 파서 설정
const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  removeNSPrefix: false,
  parseAttributeValue: false,
  parseTagValue: true,
  trimValues: true,
  alwaysCreateTextNode: false,
});

// V4 API용 파서
function parseXmlV4(xmlText) {
  try {
    const jsonObj = parser.parse(xmlText);
    const response = jsonObj.response || jsonObj;
    const header = response.header || {};
    const body = response.body || {};
    
    const resultCode = header.resultCode || '000';
    const resultMsg = header.resultMsg || 'OK';
    
    if (resultCode !== '000') {
      throw new Error(`API 에러: ${resultCode} - ${resultMsg}`);
    }
    
    return {
      resultCode,
      resultMsg,
      item: body.item
    };
  } catch (error) {
    console.error('XML 파싱 오류:', error);
    throw error;
  }
}

// 1. 단지 기본정보 조회
async function getApartmentBasisInfo(kaptCode) {
  try {
    console.log(`\n🏢 단지 기본정보 조회 (kaptCode: ${kaptCode})`);
    
    const searchParams = new URLSearchParams({
      serviceKey: SERVICE_KEY,
      kaptCode: kaptCode,
    });
    
    const url = `${API_BASE_URL}/AptBasisInfoServiceV4/getAphusBassInfoV4?${searchParams.toString()}`;
    console.log('요청 URL (V4):', url);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const xmlText = await response.text();
    console.log('원본 XML 응답:', xmlText.substring(0, 500) + '...');
    
    // 먼저 JSON 응답인지 확인
    if (xmlText.startsWith('{')) {
      const jsonData = JSON.parse(xmlText);
      console.log('JSON 응답 감지됨');
      
      if (jsonData.response && jsonData.response.body && jsonData.response.body.item) {
        const item = jsonData.response.body.item;
        console.log('\n✅ 단지 기본정보:');
        console.log('- 단지명:', item.kaptName);
        console.log('- 주소:', item.kaptAddr);
        console.log('- 도로명주소:', item.doroJuso);
        console.log('- 세대수:', item.kaptdaCnt);
        console.log('- 동수:', item.kaptDongCnt);
        console.log('- 사용승인일:', item.kaptUsedate);
        console.log('- 시공사:', item.kaptBcompany);
        console.log('- 시행사:', item.kaptAcompany);
        console.log('- 관리방식:', item.codeMgrNm);
        console.log('- 난방방식:', item.codeHeatNm);
        console.log('- 분양형태:', item.codeSaleNm);
        console.log('- 연면적:', item.kaptTarea + '㎡');
        console.log('- 전화번호:', item.kaptTel);
        
        return item;
      }
    } else {
      const result = parseXmlV4(xmlText);
      
      if (result.item) {
        console.log('\n✅ 단지 기본정보:');
        console.log('- 단지명:', result.item.kaptName);
        console.log('- 주소:', result.item.kaptAddr);
        console.log('- 세대수:', result.item.kaptdaCnt);
        console.log('- 동수:', result.item.kaptDongCnt);
        console.log('- 건축년도:', result.item.kaptUsedate);
        console.log('- 시공사:', result.item.kaptBcompany);
        console.log('- 시행사:', result.item.kaptAcompany);
        console.log('- 관리방식:', result.item.codeMgrNm);
        console.log('- 난방방식:', result.item.codeHeatNm);
        
        return result.item;
      }
    }
    
    console.log('❌ 데이터 없음');
    return null;
  } catch (error) {
    console.error('❌ 단지 기본정보 조회 실패:', error.message);
    return null;
  }
}

// 2. 단지 상세정보 조회
async function getApartmentDetailInfo(kaptCode) {
  try {
    console.log(`\n🏗️ 단지 상세정보 조회 (kaptCode: ${kaptCode})`);
    
    const searchParams = new URLSearchParams({
      serviceKey: SERVICE_KEY,
      kaptCode: kaptCode,
    });
    
    const url = `${API_BASE_URL}/AptBasisInfoServiceV4/getAphusDtlInfoV4?${searchParams.toString()}`;
    console.log('요청 URL:', url);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const xmlText = await response.text();
    console.log('원본 XML 응답:', xmlText.substring(0, 500) + '...');
    
    const result = parseXmlV4(xmlText);
    
    if (result.item) {
      console.log('\n✅ 단지 상세정보:');
      console.log('- 주차대수(지상):', result.item.kaptdPcnt);
      console.log('- 주차대수(지하):', result.item.kaptdPcntu);
      console.log('- 승강기대수:', result.item.kaptdEcnt);
      console.log('- CCTV대수:', result.item.kaptdCccnt);
      console.log('- 건물구조:', result.item.codeStr);
      console.log('- 편의시설:', result.item.convenientFacility);
      console.log('- 교육시설:', result.item.educationFacility);
      console.log('- 지하철 정보:', result.item.subwayLine, result.item.subwayStation);
      
      return result.item;
    } else {
      console.log('❌ 데이터 없음');
      return null;
    }
  } catch (error) {
    console.error('❌ 단지 상세정보 조회 실패:', error.message);
    return null;
  }
}

// 3. 실거래가 조회를 위한 지역코드 찾기 (단지명으로 검색)
async function findRegionByApartmentName(apartmentName) {
  try {
    console.log(`\n🔍 지역코드 찾기 (단지명: ${apartmentName})`);
    
    // 주요 지역코드들 (서울) - 중랑구를 우선으로
    const regions = [
      { name: '중랑구', code: '11260' }, // 신내대성유니드아파트가 있는 구
      { name: '강남구', code: '11680' },
      { name: '서초구', code: '11650' },
      { name: '송파구', code: '11710' },
      { name: '강동구', code: '11740' },
      { name: '마포구', code: '11440' },
      { name: '용산구', code: '11170' },
      { name: '성동구', code: '11200' },
      { name: '광진구', code: '11215' },
      { name: '동대문구', code: '11230' },
      { name: '성북구', code: '11290' },
      { name: '강북구', code: '11305' },
      { name: '도봉구', code: '11320' },
      { name: '노원구', code: '11350' },
      { name: '은평구', code: '11380' },
      { name: '서대문구', code: '11410' },
      { name: '종로구', code: '11110' },
      { name: '중구', code: '11140' },
    ];
    
    // 최근 3개월 데이터로 검색
    const now = new Date();
    now.setMonth(now.getMonth() - 3);
    const yearMonth = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}`;
    
    for (const region of regions.slice(0, 5)) { // 처음 5개 지역만 테스트
      try {
        console.log(`  ${region.name} (${region.code}) 검색 중...`);
        
        // 매매 데이터 검색
        const tradeParams = new URLSearchParams({
          serviceKey: SERVICE_KEY,
          LAWD_CD: region.code,
          DEAL_YMD: yearMonth,
          numOfRows: '1000'
        });
        
        const tradeUrl = `${API_BASE_URL}/RTMSDataSvcAptTrade/getRTMSDataSvcAptTrade?${tradeParams.toString()}`;
        const tradeResponse = await fetch(tradeUrl);
        
        if (tradeResponse.ok) {
          const xmlText = await tradeResponse.text();
          
          // 아파트명에서 검색어 추출 (간단한 키워드들)
          const searchTerms = [
            apartmentName,
            '신내대성',
            '대성유니드',
            '유니드아파트',
            '신내',
            '대성'
          ];
          
          const found = searchTerms.some(term => xmlText.includes(term));
          
          if (found) {
            console.log(`  ✅ ${region.name}에서 관련 아파트 발견!`);
            return { regionCode: region.code, regionName: region.name, yearMonth };
          }
        }
        
        // 잠시 대기 (API 제한 방지)
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.log(`  ❌ ${region.name} 검색 실패:`, error.message);
      }
    }
    
    console.log('❌ 해당 단지를 찾을 수 없습니다.');
    return null;
  } catch (error) {
    console.error('❌ 지역코드 찾기 실패:', error.message);
    return null;
  }
}

// 4. 매매 실거래가 조회
async function getTradeData(regionCode, yearMonth, apartmentName) {
  try {
    console.log(`\n💰 매매 실거래가 조회 (지역코드: ${regionCode}, 년월: ${yearMonth})`);
    
    const searchParams = new URLSearchParams({
      serviceKey: SERVICE_KEY,
      LAWD_CD: regionCode,
      DEAL_YMD: yearMonth,
      numOfRows: '1000'
    });
    
    const url = `${API_BASE_URL}/RTMSDataSvcAptTrade/getRTMSDataSvcAptTrade?${searchParams.toString()}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const xmlText = await response.text();
    const jsonObj = parser.parse(xmlText);
    
    const items = jsonObj.response?.body?.items?.item || [];
    const apartmentItems = Array.isArray(items) ? items : [items];
    
    const searchTerms = ['신내대성', '대성유니드', '유니드아파트', '신내', '대성'];
    const matchingData = apartmentItems.filter(item => 
      item.aptNm && (
        item.aptNm.includes(apartmentName) ||
        searchTerms.some(term => item.aptNm.includes(term))
      )
    );
    
    if (matchingData.length > 0) {
      console.log(`✅ 매매 실거래가 (${matchingData.length}건 발견):`);
      matchingData.slice(0, 5).forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.dealYear}년 ${item.dealMonth}월 ${item.dealDay}일`);
        console.log(`     거래금액: ${item.dealAmount}만원`);
        console.log(`     전용면적: ${item.excluUseAr}㎡`);
        console.log(`     층: ${item.floor}층`);
        console.log(`     건축년도: ${item.buildYear}년`);
        console.log('');
      });
      
      return matchingData;
    } else {
      console.log('❌ 매매 실거래가 데이터 없음');
      return [];
    }
  } catch (error) {
    console.error('❌ 매매 실거래가 조회 실패:', error.message);
    return [];
  }
}

// 5. 전월세 실거래가 조회
async function getRentData(regionCode, yearMonth, apartmentName) {
  try {
    console.log(`\n🏠 전월세 실거래가 조회 (지역코드: ${regionCode}, 년월: ${yearMonth})`);
    
    const searchParams = new URLSearchParams({
      serviceKey: SERVICE_KEY,
      LAWD_CD: regionCode,
      DEAL_YMD: yearMonth,
      numOfRows: '1000'
    });
    
    const url = `${API_BASE_URL}/RTMSDataSvcAptRent/getRTMSDataSvcAptRent?${searchParams.toString()}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const xmlText = await response.text();
    const jsonObj = parser.parse(xmlText);
    
    const items = jsonObj.response?.body?.items?.item || [];
    const apartmentItems = Array.isArray(items) ? items : [items];
    
    const searchTerms = ['신내대성', '대성유니드', '유니드아파트', '신내', '대성'];
    const matchingData = apartmentItems.filter(item => 
      item.aptNm && (
        item.aptNm.includes(apartmentName) ||
        searchTerms.some(term => item.aptNm.includes(term))
      )
    );
    
    if (matchingData.length > 0) {
      console.log(`✅ 전월세 실거래가 (${matchingData.length}건 발견):`);
      matchingData.slice(0, 5).forEach((item, index) => {
        const monthlyRent = parseInt(item.monthlyRent || '0');
        const dealType = monthlyRent > 0 ? '월세' : '전세';
        
        console.log(`  ${index + 1}. ${item.dealYear}년 ${item.dealMonth}월 ${item.dealDay}일 (${dealType})`);
        console.log(`     보증금: ${item.deposit}만원`);
        if (monthlyRent > 0) {
          console.log(`     월세: ${item.monthlyRent}만원`);
        }
        console.log(`     전용면적: ${item.excluUseAr}㎡`);
        console.log(`     층: ${item.floor}층`);
        console.log(`     건축년도: ${item.buildYear}년`);
        console.log('');
      });
      
      return matchingData;
    } else {
      console.log('❌ 전월세 실거래가 데이터 없음');
      return [];
    }
  } catch (error) {
    console.error('❌ 전월세 실거래가 조회 실패:', error.message);
    return [];
  }
}

// 메인 실행 함수
async function main() {
  // 사용자가 요청한 kaptCode 사용
  const kaptCode = 'A10027297'; // 사용자 요청 코드
  
  console.log('🔍 아파트 정보 종합 조회 테스트');
  console.log('=====================================');
  
  try {
    // 1. 단지 기본정보 조회
    const basisInfo = await getApartmentBasisInfo(kaptCode);
    
    // 2. 단지 상세정보 조회
    const detailInfo = await getApartmentDetailInfo(kaptCode);
    
    if (basisInfo && basisInfo.kaptName) {
      // 3. 실거래가 조회를 위한 지역 찾기
      const regionInfo = await findRegionByApartmentName(basisInfo.kaptName);
      
      if (regionInfo) {
        // 4. 매매 실거래가 조회
        const tradeData = await getTradeData(regionInfo.regionCode, regionInfo.yearMonth, basisInfo.kaptName);
        
        // 5. 전월세 실거래가 조회
        const rentData = await getRentData(regionInfo.regionCode, regionInfo.yearMonth, basisInfo.kaptName);
        
        // 요약 정보
        console.log('\n📊 조회 결과 요약');
        console.log('=====================================');
        console.log('단지코드:', kaptCode);
        console.log('단지명:', basisInfo.kaptName);
        console.log('주소:', basisInfo.kaptAddr);
        console.log('지역:', regionInfo.regionName);
        console.log('매매 거래건수:', tradeData.length);
        console.log('전월세 거래건수:', rentData.length);
        
        if (tradeData.length > 0) {
          const prices = tradeData.map(item => parseInt(item.dealAmount.replace(/,/g, '')));
          const avgPrice = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
          console.log('매매 평균가격:', avgPrice.toLocaleString() + '만원');
        }
        
        if (rentData.length > 0) {
          const deposits = rentData.map(item => parseInt(item.deposit.replace(/,/g, '')));
          const avgDeposit = Math.round(deposits.reduce((a, b) => a + b, 0) / deposits.length);
          console.log('전월세 평균보증금:', avgDeposit.toLocaleString() + '만원');
        }
      }
    }
    
  } catch (error) {
    console.error('❌ 전체 프로세스 실패:', error);
  }
}

// 스크립트 실행
main().catch(console.error);