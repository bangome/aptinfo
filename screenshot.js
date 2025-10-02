const { chromium } = require('playwright');

async function takeScreenshot() {
  let browser;
  try {
    console.log('브라우저 실행 중...');
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    // 뷰포트 설정 (일반적인 데스크탑 사이즈)
    await page.setViewportSize({ width: 1280, height: 720 });
    
    console.log('페이지 로딩 중: http://localhost:3004');
    
    // 페이지 로드 타임아웃 30초 설정
    await page.goto('http://localhost:3004', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    // 페이지가 완전히 로드될 때까지 잠시 대기
    await page.waitForTimeout(2000);
    
    console.log('스크린샷 캡처 중...');
    await page.screenshot({ 
      path: 'E:/aegis_dx/reference/aptinfo/homepage-screenshot.png',
      fullPage: true
    });
    
    console.log('✅ 스크린샷이 성공적으로 저장되었습니다: homepage-screenshot.png');
    
    // 콘솔 에러 확인
    const errors = [];
    page.on('console', message => {
      if (message.type() === 'error') {
        errors.push(message.text());
      }
    });
    
    // 네트워크 에러 확인
    const networkErrors = [];
    page.on('response', response => {
      if (!response.ok()) {
        networkErrors.push({
          url: response.url(),
          status: response.status(),
          statusText: response.statusText()
        });
      }
    });
    
    // 페이지를 다시 로드하여 에러 확인
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    
    if (errors.length > 0) {
      console.log('🔴 JavaScript 콘솔 에러 발견:');
      errors.forEach(error => console.log('  -', error));
    } else {
      console.log('✅ JavaScript 콘솔 에러 없음');
    }
    
    if (networkErrors.length > 0) {
      console.log('🔴 네트워크 에러 발견:');
      networkErrors.forEach(error => {
        console.log(`  - ${error.url}: ${error.status} ${error.statusText}`);
      });
    } else {
      console.log('✅ 네트워크 에러 없음');
    }
    
  } catch (error) {
    console.error('❌ 스크린샷 캡처 실패:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('💡 해결방안: 개발 서버가 localhost:3004에서 실행 중인지 확인하세요.');
    }
    if (error.message.includes('Timeout')) {
      console.log('💡 해결방안: 페이지 로딩에 시간이 오래 걸립니다. 네트워크나 API 응답을 확인하세요.');
    }
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

takeScreenshot();