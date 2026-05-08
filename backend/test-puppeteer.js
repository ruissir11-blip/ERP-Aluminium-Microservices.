
const puppeteer = require('puppeteer');
(async () => {
  try {
    console.log('Testing puppeteer launch...');
    const browser = await puppeteer.launch({ 
      headless: true, 
      args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    });
    console.log('Success! Browser version:', await browser.version());
    await browser.close();
  } catch (err) {
    console.error('PUPPETEER_ERROR:', err.message);
    process.exit(1);
  }
})();
