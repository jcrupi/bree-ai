import puppeteer from 'puppeteer';
const browser = await puppeteer.launch({ headless: 'new' });
const page = await browser.newPage();
page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
page.on('pageerror', error => console.log('BROWSER ERROR:', error.message));
await page.goto('http://localhost:8081', { waitUntil: 'networkidle2' });
await browser.close();
