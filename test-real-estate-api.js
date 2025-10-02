/**
 * 실거래가 API 데이터 구조 확인
 */

const axios = require('axios');
const { XMLParser } = require('fast-xml-parser');

const SERVICE_KEY = 'EAl5DDYH6Ixz5ZpCY40/DTEDqkFXTG2Utgr5YJQkusuQyugyb80K+qVwRG2ZpceMiCIXqwFWmGpJRHeu7s8JUA==';
const API_BASE_URL = 'https://apis.data.go.kr/1613000';

const parser = new XMLParser();

// 실거래가 API 테스트
async function testRealEstateAPIs() {
  console.log('🏡 실거래가 API 데이터 구조 테스트\n');
  
  // 서울 강남구 (11680) 2024년 1월 데이터
  const testParams = {
    LAWD_CD: '11680', // 강남구
    DEAL_YMD: '202401', // 2024년 1월
    numOfRows: '5'
  };
  
  try {
    // 1. 매매 실거래가 API 테스트
    console.log('📊 매매 실거래가 API 테스트');
    const tradeResponse = await axios.get(`${API_BASE_URL}/RTMSDataSvcAptTrade/getRTMSDataSvcAptTrade`, {
      params: {
        serviceKey: SERVICE_KEY,
        ...testParams
      }
    });
    
    if (tradeResponse.data.response?.header?.resultCode === '00') {
      const items = tradeResponse.data.response.body?.items?.item || [];
      console.log(`✅ 매매 데이터 ${items.length}건 조회 성공\n`);
      
      if (items.length > 0) {
        console.log('📋 매매 데이터 구조 (첫 번째 거래):');
        const firstItem = Array.isArray(items) ? items[0] : items;
        console.log(JSON.stringify(firstItem, null, 2));
        
        console.log('\n🔍 매매 데이터 주요 필드:');
        console.log(`- 단지명: ${firstItem.aptNm}`);
        console.log(`- 전용면적: ${firstItem.excluUseAr}㎡`);
        console.log(`- 거래금액: ${firstItem.dealAmount}만원`);
        console.log(`- 거래일: ${firstItem.dealYear}-${firstItem.dealMonth}-${firstItem.dealDay}`);
        console.log(`- 층수: ${firstItem.floor}층`);
        console.log(`- 건축년도: ${firstItem.buildYear}년`);
        console.log(`- 법정동: ${firstItem.umdNm}`);
        console.log(`- 지번: ${firstItem.jibun}`);
      }
    } else {
      console.log(`❌ 매매 API 실패: ${tradeResponse.data.response?.header?.resultMsg}`);
    }
    
    console.log('\n' + '='.repeat(60) + '\n');
    
    // 2. 전세/월세 실거래가 API 테스트
    console.log('📊 전세/월세 실거래가 API 테스트');
    const rentResponse = await axios.get(`${API_BASE_URL}/RTMSDataSvcAptRent/getRTMSDataSvcAptRent`, {
      params: {
        serviceKey: SERVICE_KEY,
        ...testParams
      }
    });
    
    if (rentResponse.data.response?.header?.resultCode === '00') {
      const items = rentResponse.data.response.body?.items?.item || [];
      console.log(`✅ 전세/월세 데이터 ${items.length}건 조회 성공\n`);
      
      if (items.length > 0) {
        console.log('📋 전세/월세 데이터 구조 (첫 번째 거래):');
        const firstItem = Array.isArray(items) ? items[0] : items;
        console.log(JSON.stringify(firstItem, null, 2));
        
        console.log('\n🔍 전세/월세 데이터 주요 필드:');
        console.log(`- 단지명: ${firstItem.aptNm}`);
        console.log(`- 전용면적: ${firstItem.excluUseAr}㎡`);
        console.log(`- 보증금: ${firstItem.deposit}만원`);
        console.log(`- 월세: ${firstItem.monthlyRent}만원`);
        console.log(`- 거래일: ${firstItem.dealYear}-${firstItem.dealMonth}-${firstItem.dealDay}`);
        console.log(`- 층수: ${firstItem.floor}층`);
        console.log(`- 건축년도: ${firstItem.buildYear}년`);
        console.log(`- 계약기간: ${firstItem.contractTerm}`);
        console.log(`- 계약구분: ${firstItem.contractType}`);
      }
    } else {
      console.log(`❌ 전세/월세 API 실패: ${rentResponse.data.response?.header?.resultMsg}`);
    }
    
  } catch (error) {
    console.error('❌ API 테스트 오류:', error.message);
  }
}

// 기본정보 API vs 실거래가 API 면적 비교
async function compareAreaData() {
  console.log('\n' + '='.repeat(60));
  console.log('📐 면적 데이터 비교: 기본정보 API vs 실거래가 API\n');
  
  // 알려진 단지코드로 기본정보 조회
  const kaptCode = 'A10026207'; // 서울숲리버뷰자이 (예시)
  
  try {
    // 1. 기본정보 API - 총 면적
    console.log('🏢 기본정보 API - 단지 전체 면적 정보');
    const basisResponse = await axios.get(`${API_BASE_URL}/AptBasisInfoServiceV4/getAphusBassInfoV4`, {
      params: {
        serviceKey: SERVICE_KEY,
        kaptCode: kaptCode
      }
    });
    
    if (basisResponse.data.response?.header?.resultCode === '00') {
      const item = basisResponse.data.response.body.item;
      console.log(`- 단지명: ${item.kaptName}`);
      console.log(`- 대지면적: ${item.kaptTarea}㎡ (단지 전체)`);
      console.log(`- 연면적: ${item.kaptMarea}㎡ (건물 전체)`);
      console.log(`- 전용면적: ${item.privArea}㎡ (전체 세대 합)`);
      console.log(`- 60㎡ 이하 세대수: ${item.kaptMparea60}세대`);
      console.log(`- 60~85㎡ 세대수: ${item.kaptMparea85}세대`);
      console.log(`- 85~135㎡ 세대수: ${item.kaptMparea135}세대`);
      console.log(`- 135㎡ 초과 세대수: ${item.kaptMparea136}세대`);
      console.log(`- 총 세대수: ${item.kaptdaCnt}세대`);
    }
    
    console.log('\n📊 실거래가 API - 개별 거래 면적 정보');
    console.log('※ 각 거래마다 해당 세대의 실제 전용면적이 기록됨');
    
    // 2. 실거래가 API에서 같은 단지 검색 (단지명으로)
    const aptName = '서울숲리버뷰자이';
    const tradeResponse = await axios.get(`${API_BASE_URL}/RTMSDataSvcAptTrade/getRTMSDataSvcAptTrade`, {
      params: {
        serviceKey: SERVICE_KEY,
        LAWD_CD: '11200', // 성동구
        DEAL_YMD: '202401'
      }
    });
    
    if (tradeResponse.data.response?.header?.resultCode === '00') {
      const items = tradeResponse.data.response.body?.items?.item || [];
      const matchingTrades = (Array.isArray(items) ? items : [items])
        .filter(trade => trade.aptNm && trade.aptNm.includes('서울숲'));
      
      if (matchingTrades.length > 0) {
        console.log(`- 해당 단지 거래 ${matchingTrades.length}건 발견:`);
        matchingTrades.slice(0, 3).forEach((trade, index) => {
          console.log(`  ${index + 1}. ${trade.aptNm}: ${trade.excluUseAr}㎡, ${trade.dealAmount}만원`);
        });
      } else {
        console.log('- 해당 기간에 거래 데이터 없음');
      }
    }
    
  } catch (error) {
    console.error('❌ 면적 비교 오류:', error.message);
  }
}

// 실행
async function main() {
  await testRealEstateAPIs();
  await compareAreaData();
  
  console.log('\n' + '='.repeat(60));
  console.log('📝 결론:');
  console.log('1. 기본정보 API: 단지 전체의 총 면적 (모든 세대 합산)');
  console.log('2. 실거래가 API: 개별 거래 세대의 실제 전용면적');
  console.log('3. 공급면적은 별도 API 필드가 없어 계산 또는 추정값 사용');
}

main().catch(console.error);