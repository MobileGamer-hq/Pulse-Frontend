const puppeteer = require('puppeteer-core');

async function test() {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--disable-software-rasterizer',
      '--mute-audio',
      '--headless=new'
    ]
  });
  console.log('Browser launched. Opening new page...');
  const page = await browser.newPage();
  console.log('Navigating to http://localhost:5173/welcome ...');
  await page.goto('http://localhost:5173/welcome', { waitUntil: 'domcontentloaded', timeout: 15000 });
  const title = await page.title();
  const url = page.url();
  console.log('Successfully navigated to:', url, 'Title:', title);
  await browser.close();
  console.log('Done!');
}

test().catch(err => {
  console.error('Smoke test failed:', err);
  process.exit(1);
});
