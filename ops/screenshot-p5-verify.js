const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const OUTDIR = '/home/node/.openclaw/workspace/public/screenshots/post-p5-verification';
if (!fs.existsSync(OUTDIR)) fs.mkdirSync(OUTDIR, { recursive: true });

const ANIMATION_DISABLE_CSS = `
  .fade-in { opacity: 1 !important; transform: none !important; transition: none !important; }
  * { animation: none !important; transition-duration: 0s !important; }
`;

(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });

  const captures = [
    { url: 'https://qiyadon.com/onboarding-intake.html', name: 'desktop-onboarding.png', w: 1280, h: 900 },
    { url: 'https://qiyadon.com/dashboard.html', name: 'desktop-dashboard.png', w: 1280, h: 900 },
    { url: 'https://qiyadon.com/pricing.html', name: 'desktop-pricing-footer.png', w: 1280, h: 900 },
    { url: 'https://qiyadon.com/sign-trial.html', name: 'desktop-sign-trial-backlink.png', w: 1280, h: 900 },
    { url: 'https://qiyadon.com/onboarding-intake.html', name: 'mobile-onboarding.png', w: 375, h: 812 },
    { url: 'https://qiyadon.com/onboarding-intake.html', name: 'mobile-onboarding-nav-open.png', w: 375, h: 812 },
  ];

  for (const c of captures) {
    const page = await browser.newPage();
    await page.setViewportSize({ width: c.w, height: c.h });
    await page.goto(c.url, { waitUntil: 'networkidle', timeout: 30000 });
    await page.addStyleTag({ content: ANIMATION_DISABLE_CSS });

    if (c.name.includes('nav-open')) {
      await page.evaluate(() => {
        const toggle = document.getElementById('mobileToggle');
        if (toggle) toggle.click();
        else {
          const links = document.getElementById('navLinks');
          if (links) links.classList.add('active');
        }
      });
      await page.waitForTimeout(300);
    } else if (c.name.includes('pricing-footer')) {
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    } else if (c.name.includes('sign-trial')) {
      await page.evaluate(() => window.scrollTo(0, 0));
    }

    await page.screenshot({ path: path.join(OUTDIR, c.name), fullPage: false, type: 'png' });
    console.log('✓', c.name);
    await page.close();
  }

  await browser.close();
  console.log('\nP5 verification screenshots captured.');
})().catch(e => { console.error('Error:', e.message); process.exit(1); });