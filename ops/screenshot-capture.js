const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const https = require('https');

const OUTDIR = '/home/node/.openclaw/workspace/screenshots/post-p2-verification';
if (!fs.existsSync(OUTDIR)) fs.mkdirSync(OUTDIR, { recursive: true });

const DESKTOP_URLS = [
  'https://qiyadon.com/privacy-policy.html',
  'https://qiyadon.com/terms-of-service.html',
  'https://qiyadon.com/ownership-statement.html',
  'https://qiyadon.com/cancellation-refund-policy.html',
  'https://qiyadon.com/pricing.html',
  'https://qiyadon.com/pipeline-leak-audit.html',
  'https://qiyadon.com/',
];

const MOBILE_URLS = [
  'https://qiyadon.com/privacy-policy.html',
  'https://qiyadon.com/terms-of-service.html',
  'https://qiyadon.com/pricing.html',
  'https://qiyadon.com/pipeline-leak-audit.html',
  'https://qiyadon.com/',
];

const ANIMATION_DISABLE_CSS = `
  .fade-in { opacity: 1 !important; transform: none !important; transition: none !important; }
  * { animation: none !important; transition-duration: 0s !important; }
`;

function filenameFromUrl(url) {
  let name = url.replace('https://qiyadon.com/', '').replace(/\//g, '-') || 'homepage';
  if (name === 'homepage') name = 'index';
  return name;
}

function pngUrl(pathStr) {
  return `https://qiyadon.com/screenshots/post-p2-verification/${path.basename(pathStr)}`;
}

(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });

  // Desktop screenshots
  for (const url of DESKTOP_URLS) {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    await page.addStyleTag({ content: ANIMATION_DISABLE_CSS });
    await page.evaluate(() => window.scrollTo(0, 0));
    const name = filenameFromUrl(url);
    const filepath = path.join(OUTDIR, `desktop-${name}.png`);
    await page.screenshot({ path: filepath, fullPage: false, type: 'png' });
    console.log(`✓ desktop-${name}.png`);
    await page.close();
  }

  // Mobile screenshots
  for (const url of MOBILE_URLS) {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    await page.addStyleTag({ content: ANIMATION_DISABLE_CSS });
    await page.evaluate(() => window.scrollTo(0, 0));
    const name = filenameFromUrl(url);
    const filepath = path.join(OUTDIR, `mobile-${name}.png`);
    await page.screenshot({ path: filepath, fullPage: false, type: 'png' });
    console.log(`✓ mobile-${name}.png`);
    await page.close();
  }

  await browser.close();
  console.log('\nAll screenshots captured.');
})().catch(e => { console.error('Error:', e.message); process.exit(1); });