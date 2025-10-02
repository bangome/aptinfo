const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Collect console logs
  const logs = [];
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    logs.push(`[${type.toUpperCase()}] ${text}`);
    console.log(`[${type.toUpperCase()}] ${text}`);
  });
  
  // Collect errors
  page.on('pageerror', error => {
    console.log(`[PAGE ERROR] ${error.message}`);
    logs.push(`[PAGE ERROR] ${error.message}`);
  });
  
  try {
    console.log('Navigating to http://localhost:3005...');
    await page.goto('http://localhost:3005');
    
    console.log('Waiting for page to load...');
    await page.waitForSelector('main', { timeout: 10000 });
    
    console.log('Waiting a bit more for React to process...');
    await page.waitForTimeout(3000);
    
    // Check if apartment cards are present
    const cardSelector = '[data-testid*="apartment"], .apartment-card, [class*="apartment"]';
    const cards = await page.$$(cardSelector);
    console.log(`\nFound ${cards.length} apartment cards`);
    
    // Check if the grid container has children
    const gridSelector = '.grid.grid-cols-1.sm\\:grid-cols-2.lg\\:grid-cols-3';
    const grid = await page.$(gridSelector);
    if (grid) {
      const gridChildren = await grid.$$('> *');
      console.log(`Grid container has ${gridChildren.length} direct children`);
    }
    
    // Check for dummy data in page content
    const pageContent = await page.textContent('body');
    const dummyNames = ['롯데캐슬 골드파크', '힐스테이트 광교', '푸르지오 월드마크'];
    const foundNames = dummyNames.filter(name => pageContent.includes(name));
    console.log(`\nDummy apartment names found: ${foundNames.length} of ${dummyNames.length}`);
    console.log('Found names:', foundNames);
    
    // Take screenshot for debugging
    await page.screenshot({ path: 'debug-screenshot.png', fullPage: true });
    console.log('\nScreenshot saved as debug-screenshot.png');
    
    console.log('\n=== All Console Logs ===');
    logs.forEach(log => console.log(log));
    
  } catch (error) {
    console.error('Error during debug:', error);
  } finally {
    await browser.close();
  }
})();