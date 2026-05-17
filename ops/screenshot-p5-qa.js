const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const OUTDIR = '/home/node/.openclaw/workspace/public/screenshots/post-p5-full-site-qa';
if (!fs.existsSync(OUTDIR)) fs.mkdirSync(OUTDIR, { recursive: true });

const ANIMATION_DISABLE_CSS = `
  .fade-in { opacity: 1 !important; transform: none !important; transition: none !important; }
  * { animation: none !important; transition-duration: 0s !important; }
`;

(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });

  // Desktop captures
  const desktopPages = [
    { url: 'https://qiyadon.com/', name: 'desktop-homepage' },
    { url: 'https://qiyadon.com/pricing.html', name: 'desktop-pricing' },
    { url: 'https://qiyadon.com/pipeline-leak-audit.html', name: 'desktop-audit' },
    { url: 'https://qiyadon.com/privacy-policy.html', name: 'desktop-privacy' },
    { url: 'https://qiyadon.com/sign-trial.html', name: 'desktop-sign-trial' },
  ];

  for (const p of desktopPages) {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(p.url, { waitUntil: 'networkidle', timeout: 30000 });
    await page.addStyleTag({ content: ANIMATION_DISABLE_CSS });
    await page.screenshot({ path: path.join(OUTDIR, p.name + '.png'), fullPage: false, type: 'png' });
    console.log('✓', p.name + '.png');
    await page.close();
  }

  // Mobile captures
  const mobilePages = [
    { url: 'https://qiyadon.com/', name: 'mobile-homepage' },
    { url: 'https://qiyadon.com/pricing.html', name: 'mobile-pricing' },
    { url: 'https://qiyadon.com/pipeline-leak-audit.html', name: 'mobile-audit' },
    { url: 'https://qiyadon.com/sign-trial.html', name: 'mobile-sign-trial' },
  ];

  for (const p of mobilePages) {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(p.url, { waitUntil: 'networkidle', timeout: 30000 });
    await page.addStyleTag({ content: ANIMATION_DISABLE_CSS });
    await page.screenshot({ path: path.join(OUTDIR, p.name + '.png'), fullPage: false, type: 'png' });
    console.log('✓', p.name + '.png');
    await page.close();
  }

  // Mobile nav open state for homepage
  const page = await browser.newPage();
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('https://qiyadon.com/', { waitUntil: 'networkidle', timeout: 30000 });
  await page.addStyleTag({ content: ANIMATION_DISABLE_CSS });
  await page.evaluate(() => {
    const toggle = document.getElementById('mobileToggle');
    if (toggle) toggle.click();
    else {
      const navLinks = document.getElementById('navLinks');
      if (navLinks) navLinks.classList.add('active');
    }
  });
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(OUTDIR, 'mobile-nav-open.png'), fullPage: false, type: 'png' });
  console.log('✓ mobile-nav-open.png');
  await page.close();

  await browser.close();
  console.log('\nP5 full site QA screenshots captured.');
})().catch(e => { console.error('Error:', e.message); process.exit(1); });