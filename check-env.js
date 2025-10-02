/**
 * 환경변수 및 서비스 키 확인
 */

console.log('🔍 환경변수 확인');
console.log('DATA_GO_KR_SERVICE_KEY:', process.env.DATA_GO_KR_SERVICE_KEY ? 'SET' : 'NOT SET');
console.log('NEXT_PUBLIC_DATA_GO_KR_SERVICE_KEY:', process.env.NEXT_PUBLIC_DATA_GO_KR_SERVICE_KEY ? 'SET' : 'NOT SET');

const CONFIG = {
  SERVICE_KEY: process.env.DATA_GO_KR_SERVICE_KEY || process.env.NEXT_PUBLIC_DATA_GO_KR_SERVICE_KEY || 'EAl5DDYH6Ixz5ZpCY40/DTEDqkFXTG2Utgr5YJQkusuQyugyb80K+qVwRG2ZpceMiCIXqwFWmGpJRHeu7s8JUA==',
};

console.log('\n📋 배치 스크립트가 사용할 서비스 키:');
console.log('처음 20자:', CONFIG.SERVICE_KEY.substring(0, 20));
console.log('마지막 20자:', CONFIG.SERVICE_KEY.substring(CONFIG.SERVICE_KEY.length - 20));
console.log('전체 길이:', CONFIG.SERVICE_KEY.length);

const expectedKey = 'EAl5DDYH6Ixz5ZpCY40/DTEDqkFXTG2Utgr5YJQkusuQyugyb80K+qVwRG2ZpceMiCIXqwFWmGpJRHeu7s8JUA==';
console.log('\n🔎 키 비교:');
console.log('일치 여부:', CONFIG.SERVICE_KEY === expectedKey);

if (CONFIG.SERVICE_KEY !== expectedKey) {
  console.log('❌ 키가 다릅니다!');
  console.log('예상:', expectedKey.substring(0, 20) + '...');
  console.log('실제:', CONFIG.SERVICE_KEY.substring(0, 20) + '...');
} else {
  console.log('✅ 키가 일치합니다!');
}