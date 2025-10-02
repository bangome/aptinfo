#!/usr/bin/env node

/**
 * 정부 API 클라이언트 실제 테스트 스크립트
 */

const { GovernmentApiClient } = require('./src/lib/api/government-api-client.ts');
require('dotenv').config({ path: '.env.local' });

async function testGovernmentApiClient() {
  try {
    console.log('🚀 정부 API 클라이언트 테스트 시작...\n');
    
    // API 클라이언트 생성
    const client = new GovernmentApiClient();
    
    console.log('1️⃣ API 연결 테스트...');
    const connectionTest = await client.testConnection();
    console.log(`   결과: ${connectionTest ? '✅ 성공' : '❌ 실패'}\n`);
    
    if (!connectionTest) {
      console.error('❌ API 연결에 실패했습니다. 서비스 키를 확인해주세요.');
      return;
    }
    
    // 아파트 매매 실거래가 테스트
    console.log('2️⃣ 아파트 매매 실거래가 조회 테스트...');
    try {
      const tradeData = await client.getApartmentTradeData({
        LAWD_CD: '11110', // 서울 종로구
        DEAL_YMD: '202407', // 2024년 7월
        pageNo: 1,
        numOfRows: 5
      });
      
      console.log(`   📊 총 ${tradeData.body.totalCount}건 중 ${tradeData.body.items.length}건 조회`);
      if (tradeData.body.items.length > 0) {
        const firstItem = tradeData.body.items[0];
        console.log(`   🏠 첫 번째 거래: ${firstItem.aptNm} - ${firstItem.dealAmount}만원`);
        console.log(`   📍 위치: ${firstItem.umdNm} ${firstItem.jibun || ''}`);
        console.log(`   📅 거래일: ${firstItem.dealYear}.${firstItem.dealMonth}.${firstItem.dealDay}`);
      }
      console.log('   ✅ 매매 실거래가 조회 성공\n');
    } catch (error) {
      console.error(`   ❌ 매매 실거래가 조회 실패: ${error.message}\n`);
    }
    
    // 아파트 전월세 실거래가 테스트
    console.log('3️⃣ 아파트 전월세 실거래가 조회 테스트...');
    try {
      const rentData = await client.getApartmentRentData({
        LAWD_CD: '11110', // 서울 종로구
        DEAL_YMD: '202407', // 2024년 7월
        pageNo: 1,
        numOfRows: 5
      });
      
      console.log(`   📊 총 ${rentData.body.totalCount}건 중 ${rentData.body.items.length}건 조회`);
      if (rentData.body.items.length > 0) {
        const firstItem = rentData.body.items[0];
        console.log(`   🏠 첫 번째 임대: ${firstItem.aptNm}`);
        console.log(`   💰 보증금: ${firstItem.deposit}만원, 월세: ${firstItem.monthlyRent}만원`);
        console.log(`   📅 계약일: ${firstItem.dealYear}.${firstItem.dealMonth}.${firstItem.dealDay}`);
      }
      console.log('   ✅ 전월세 실거래가 조회 성공\n');
    } catch (error) {
      console.error(`   ❌ 전월세 실거래가 조회 실패: ${error.message}\n`);
    }
    
    // 공동주택 기본 정보 테스트 (종로중흥S클래스 아파트)
    console.log('4️⃣ 공동주택 기본 정보 조회 테스트...');
    try {
      const basicInfo = await client.getApartmentBasicInfo({
        kaptCode: 'A10027875' // 예시 단지코드
      });
      
      if (basicInfo.body.items.length > 0) {
        const info = basicInfo.body.items[0];
        console.log(`   🏠 단지명: ${info.kaptName}`);
        console.log(`   📍 주소: ${info.kaptAddr}`);
        console.log(`   🏢 동수: ${info.kaptDongCnt}동, 세대수: ${info.kaptdaCnt}세대`);
        console.log(`   🏗️ 시공사: ${info.kaptBcompany}, 시행사: ${info.kaptAcompany}`);
      }
      console.log('   ✅ 기본 정보 조회 성공\n');
    } catch (error) {
      console.error(`   ❌ 기본 정보 조회 실패: ${error.message}\n`);
    }
    
    // 공동주택 상세 정보 테스트
    console.log('5️⃣ 공동주택 상세 정보 조회 테스트...');
    try {
      const detailInfo = await client.getApartmentDetailInfo({
        kaptCode: 'A15876402' // 예시 단지코드
      });
      
      if (detailInfo.body.items.length > 0) {
        const info = detailInfo.body.items[0];
        console.log(`   🏠 단지명: ${info.kaptName}`);
        console.log(`   🔧 관리방식: ${info.codeMgr}`);
        console.log(`   👥 일반관리인원: ${info.kaptMgrCnt}명`);
        console.log(`   🚗 주차대수: 지상 ${info.kaptdPcnt}대, 지하 ${info.kaptdPcntu}대`);
        console.log(`   📹 CCTV: ${info.kaptdCccnt}대`);
      }
      console.log('   ✅ 상세 정보 조회 성공\n');
    } catch (error) {
      console.error(`   ❌ 상세 정보 조회 실패: ${error.message}\n`);
    }
    
    console.log('🎉 모든 테스트 완료!');
    
  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error);
  }
}

// 스크립트 실행
if (require.main === module) {
  testGovernmentApiClient();
}

module.exports = { testGovernmentApiClient };