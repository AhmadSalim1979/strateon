const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const delay = () => new Promise(r => setTimeout(r, 800));

  // Capture function
  async function capture(page, url, filename, fullPage = false) {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    await page.evaluate(() => {
      document.querySelectorAll('.fade-in').forEach(el => {
        el.style.opacity = '1';
        el.style.transform = 'none';
      });
    });
    await delay();
    await page.screenshot({ path: `public/screenshots/${filename}`, fullPage });
    console.log(`${filename} done`);
  }

  const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 } });

  const dPage = await desktop.newPage();
  const mPage = await mobile.newPage();

  // Pricing
  await capture(dPage, 'https://qiyadon.com/pricing.html', 'desktop-pricing.png', true);
  await capture(mPage, 'https://qiyadon.com/pricing.html', 'mobile-pricing.png', true);

  // Audit page
  await capture(dPage, 'https://qiyadon.com/pipeline-leak-audit.html', 'desktop-audit.png', true);
  await capture(mPage, 'https://qiyadon.com/pipeline-leak-audit.html', 'mobile-audit.png', true);

  // Privacy Policy
  await capture(dPage, 'https://qiyadon.com/privacy-policy.html', 'desktop-privacy.png', true);

  // Terms of Service
  await capture(dPage, 'https://qiyadon.com/terms-of-service.html', 'desktop-terms.png', true);

  // Sign Trial (CTA routing check)
  await capture(dPage, 'https://qiyadon.com/sign-trial.html', 'desktop-sign-trial.png', true);

  await browser.close();
  console.log('ALL DONE');
})();