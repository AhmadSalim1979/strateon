const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const OUTDIR = '/home/node/.openclaw/workspace/public/screenshots/post-p3-pricing-audit';
if (!fs.existsSync(OUTDIR)) fs.mkdirSync(OUTDIR, { recursive: true });

const ANIMATION_DISABLE_CSS = `
  .fade-in { opacity: 1 !important; transform: none !important; transition: none !important; }
  * { animation: none !important; transition-duration: 0s !important; }
`;

const DESKTOP_URLS = [
  'https://qiyadon.com/pricing.html',
  'https://qiyadon.com/sign-trial.html',
  'https://qiyadon.com/sign-starter.html',
  'https://qiyadon.com/sign-growth.html',
  'https://qiyadon.com/sign-scale.html',
  'https://qiyadon.com/sign-csa.html',
  'https://qiyadon.com/trial.html',
];

const MOBILE_URLS = [
  'https://qiyadon.com/pricing.html',
  'https://qiyadon.com/sign-trial.html',
  'https://qiyadon.com/trial.html',
];

function filenameFromUrl(url) {
  return url.replace('https://qiyadon.com/', '').replace(/\//g, '-');
}

(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });

  for (const url of DESKTOP_URLS) {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    await page.addStyleTag({ content: ANIMATION_DISABLE_CSS });
    await page.evaluate(() => window.scrollTo(0, 0));
    const name = filenameFromUrl(url);
    await page.screenshot({ path: path.join(OUTDIR, `desktop-${name}.png`), fullPage: false, type: 'png' });
    console.log('✓ desktop-' + name + '.png');
    await page.close();
  }

  for (const url of MOBILE_URLS) {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    await page.addStyleTag({ content: ANIMATION_DISABLE_CSS });
    await page.evaluate(() => window.scrollTo(0, 0));
    const name = filenameFromUrl(url);
    await page.screenshot({ path: path.join(OUTDIR, `mobile-${name}.png`), fullPage: false, type: 'png' });
    console.log('✓ mobile-' + name + '.png');
    await page.close();
  }

  await browser.close();
  console.log('\nAll pricing audit screenshots captured.');
})().catch(e => { console.error('Error:', e.message); process.exit(1); });