import { chromium } from '@playwright/test';
const browser = await chromium.launch();
const page = await browser.newPage();
page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
page.on('pageerror', error => console.log('BROWSER ERROR:', error.message));
await page.goto('http://localhost:8081', { waitUntil: 'networkidle' });
await new Promise(r => setTimeout(r, 2000));
await browser.close();
