const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const OUTDIR = '/home/node/.openclaw/workspace/public/screenshots/post-p3-verification';
if (!fs.existsSync(OUTDIR)) fs.mkdirSync(OUTDIR, { recursive: true });

const ANIMATION_DISABLE_CSS = `
  .fade-in { opacity: 1 !important; transform: none !important; transition: none !important; }
  * { animation: none !important; transition-duration: 0s !important; }
`;

(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });

  const captures = [
    { url: 'https://qiyadon.com/pricing.html', name: 'desktop-pricing.png', w: 1280, h: 900 },
    { url: 'https://qiyadon.com/sign-trial.html', name: 'desktop-sign-trial.png', w: 1280, h: 900 },
    { url: 'https://qiyadon.com/sign-starter.html', name: 'desktop-sign-starter.png', w: 1280, h: 900 },
    { url: 'https://qiyadon.com/pricing.html', name: 'mobile-pricing.png', w: 375, h: 812 },
    { url: 'https://qiyadon.com/sign-trial.html', name: 'mobile-sign-trial.png', w: 375, h: 812 },
  ];

  for (const c of captures) {
    const page = await browser.newPage();
    await page.setViewportSize({ width: c.w, height: c.h });
    await page.goto(c.url, { waitUntil: 'networkidle', timeout: 30000 });
    await page.addStyleTag({ content: ANIMATION_DISABLE_CSS });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: path.join(OUTDIR, c.name), fullPage: false, type: 'png' });
    console.log('✓', c.name);
    await page.close();
  }

  await browser.close();
  console.log('Done.');
})().catch(e => { console.error('Error:', e.message); process.exit(1); });