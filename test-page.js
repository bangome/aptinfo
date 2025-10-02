// Simple test to check if the page loads correctly
const https = require('https');
const http = require('http');

function testPageLoad() {
  const options = {
    hostname: 'localhost',
    port: 3004,
    path: '/',
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  };

  const req = http.request(options, (res) => {
    console.log('Status Code:', res.statusCode);
    console.log('Headers:', res.headers);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      console.log('Response length:', data.length);
      
      // Check for common HTML elements
      const checks = {
        'HTML document': data.includes('<html'),
        'Title present': data.includes('<title>'),
        'Body present': data.includes('<body'),
        'Header': data.includes('아파트인포'),
        'Search section': data.includes('검색'),
        'Popular areas section': data.includes('인기 지역'),
        'Recent apartments section': data.includes('최신 등록 아파트'),
        'CSS loaded': data.includes('/_next/static/css/'),
        'JavaScript loaded': data.includes('/_next/static/chunks/')
      };

      console.log('\n페이지 구성 요소 검사:');
      Object.entries(checks).forEach(([key, passed]) => {
        console.log(`  ${passed ? '✅' : '❌'} ${key}`);
      });

      // Look for potential errors
      const errorPatterns = [
        'Error:',
        'TypeError:',
        'ReferenceError:',
        'Failed to',
        'Cannot read property',
        'is not defined'
      ];

      const errors = errorPatterns.filter(pattern => 
        data.toLowerCase().includes(pattern.toLowerCase())
      );

      if (errors.length > 0) {
        console.log('\n🔴 감지된 잠재적 에러 패턴:');
        errors.forEach(error => console.log(`  - ${error}`));
      } else {
        console.log('\n✅ 명백한 에러 패턴이 발견되지 않음');
      }
      
      // Check for empty content areas that might indicate loading issues
      const contentChecks = {
        'Recent apartments grid': data.includes('grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'),
        'Popular areas grid': data.includes('grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'),
        'Search functionality': data.includes('placeholder="찾고 계신 아파트나 지역을 검색해보세요"')
      };
      
      console.log('\n콘텐츠 영역 검사:');
      Object.entries(contentChecks).forEach(([key, passed]) => {
        console.log(`  ${passed ? '✅' : '❌'} ${key}`);
      });
    });
  });

  req.on('error', (error) => {
    console.error('Request error:', error.message);
  });

  req.setTimeout(10000, () => {
    console.error('Request timeout');
    req.destroy();
  });

  req.end();
}

testPageLoad();