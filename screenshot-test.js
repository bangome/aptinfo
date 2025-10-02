const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // Navigate to the main page
    await page.goto('http://localhost:3005');
    
    // Wait for the page to fully load
    await page.waitForTimeout(3000);
    
    // Wait for the main content to be visible
    await page.waitForSelector('main', { timeout: 10000 });
    
    // Take a full page screenshot
    await page.screenshot({
      path: 'main-page-final-check.png',
      fullPage: true
    });
    
    // Check console logs
    const logs = [];
    page.on('console', msg => {
      logs.push(`${msg.type()}: ${msg.text()}`);
    });
    
    // Refresh the page to capture console logs
    await page.reload();
    await page.waitForTimeout(2000);
    
    console.log('Console logs:');
    logs.forEach(log => console.log(log));
    
    // Check if apartment cards are present
    const apartmentCards = await page.$$('.apartment-card, [data-testid*="apartment"], .card');
    console.log(`Found ${apartmentCards.length} apartment cards`);
    
    // Check for specific dummy data
    const pageContent = await page.content();
    const hasDummyData = [
      '롯데캐슬 골드파크',
      '힐스테이트 광교',
      '푸르지오 월드마크'
    ].some(name => pageContent.includes(name));
    
    console.log(`Dummy data present: ${hasDummyData}`);
    
    // Check for "최신 등록 아파트" section
    const hasRecentSection = pageContent.includes('최신 등록 아파트') || pageContent.includes('최신');
    console.log(`Recent apartments section present: ${hasRecentSection}`);
    
  } catch (error) {
    console.error('Error during screenshot:', error);
  } finally {
    await browser.close();
  }
})();