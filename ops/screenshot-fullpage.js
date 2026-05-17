const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const OUTDIR = '/home/node/.openclaw/workspace/public/screenshots/post-p2-verification';

const ANIMATION_DISABLE_CSS = `
  .fade-in { opacity: 1 !important; transform: none !important; transition: none !important; }
  * { animation: none !important; transition-duration: 0s !important; }
`;

(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });

  // Full-page homepage desktop
  let page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('https://qiyadon.com/', { waitUntil: 'networkidle', timeout: 30000 });
  await page.addStyleTag({ content: ANIMATION_DISABLE_CSS });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: path.join(OUTDIR, 'fullpage-desktop-home.png'), fullPage: true, type: 'png' });
  console.log('✓ fullpage-desktop-home.png');
  await page.close();

  // Full-page homepage mobile
  page = await browser.newPage();
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('https://qiyadon.com/', { waitUntil: 'networkidle', timeout: 30000 });
  await page.addStyleTag({ content: ANIMATION_DISABLE_CSS });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: path.join(OUTDIR, 'fullpage-mobile-home.png'), fullPage: true, type: 'png' });
  console.log('✓ fullpage-mobile-home.png');
  await page.close();

  // Full-page pricing desktop
  page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('https://qiyadon.com/pricing.html', { waitUntil: 'networkidle', timeout: 30000 });
  await page.addStyleTag({ content: ANIMATION_DISABLE_CSS });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: path.join(OUTDIR, 'fullpage-desktop-pricing.png'), fullPage: true, type: 'png' });
  console.log('✓ fullpage-desktop-pricing.png');
  await page.close();

  // Full-page pricing mobile
  page = await browser.newPage();
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('https://qiyadon.com/pricing.html', { waitUntil: 'networkidle', timeout: 30000 });
  await page.addStyleTag({ content: ANIMATION_DISABLE_CSS });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: path.join(OUTDIR, 'fullpage-mobile-pricing.png'), fullPage: true, type: 'png' });
  console.log('✓ fullpage-mobile-pricing.png');
  await page.close();

  await browser.close();
  console.log('\nFull-page screenshots captured.');
})().catch(e => { console.error('Error:', e.message); process.exit(1); });