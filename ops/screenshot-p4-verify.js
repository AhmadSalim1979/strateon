const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const OUTDIR = '/home/node/.openclaw/workspace/public/screenshots/post-p4-verification';
if (!fs.existsSync(OUTDIR)) fs.mkdirSync(OUTDIR, { recursive: true });

const ANIMATION_DISABLE_CSS = `
  .fade-in { opacity: 1 !important; transform: none !important; transition: none !important; }
  * { animation: none !important; transition-duration: 0s !important; }
`;

(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });

  // Desktop: audit page above-fold
  let page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('https://qiyadon.com/pipeline-leak-audit.html', { waitUntil: 'networkidle', timeout: 30000 });
  await page.addStyleTag({ content: ANIMATION_DISABLE_CSS });
  await page.screenshot({ path: path.join(OUTDIR, 'desktop-audit-above-fold.png'), fullPage: false, type: 'png' });
  console.log('✓ desktop-audit-above-fold.png');
  await page.close();

  // Desktop: audit page footer
  page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('https://qiyadon.com/pipeline-leak-audit.html', { waitUntil: 'networkidle', timeout: 30000 });
  await page.addStyleTag({ content: ANIMATION_DISABLE_CSS });
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.screenshot({ path: path.join(OUTDIR, 'desktop-audit-footer.png'), fullPage: false, type: 'png' });
  console.log('✓ desktop-audit-footer.png');
  await page.close();

  // Desktop: success state
  page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('https://qiyadon.com/pipeline-leak-audit.html', { waitUntil: 'networkidle', timeout: 30000 });
  await page.addStyleTag({ content: ANIMATION_DISABLE_CSS });
  await page.evaluate(() => {
    document.getElementById('auditForm').style.display = 'none';
    document.getElementById('successState').style.display = 'block';
    document.getElementById('confirmEmail').textContent = 'ahmad@qiyadon.com';
  });
  await page.screenshot({ path: path.join(OUTDIR, 'desktop-audit-success.png'), fullPage: false, type: 'png' });
  console.log('✓ desktop-audit-success.png');
  await page.close();

  // Mobile: audit page above-fold
  page = await browser.newPage();
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('https://qiyadon.com/pipeline-leak-audit.html', { waitUntil: 'networkidle', timeout: 30000 });
  await page.addStyleTag({ content: ANIMATION_DISABLE_CSS });
  await page.screenshot({ path: path.join(OUTDIR, 'mobile-audit-above-fold.png'), fullPage: false, type: 'png' });
  console.log('✓ mobile-audit-above-fold.png');
  await page.close();

  // Mobile: nav open state
  page = await browser.newPage();
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('https://qiyadon.com/pipeline-leak-audit.html', { waitUntil: 'networkidle', timeout: 30000 });
  await page.addStyleTag({ content: ANIMATION_DISABLE_CSS });
  await page.evaluate(() => {
    const toggle = document.getElementById('mobileToggle');
    const links = document.getElementById('navLinks');
    if (toggle) toggle.click();
  });
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(OUTDIR, 'mobile-audit-nav-open.png'), fullPage: false, type: 'png' });
  console.log('✓ mobile-audit-nav-open.png');
  await page.close();

  // Mobile: footer
  page = await browser.newPage();
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('https://qiyadon.com/pipeline-leak-audit.html', { waitUntil: 'networkidle', timeout: 30000 });
  await page.addStyleTag({ content: ANIMATION_DISABLE_CSS });
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.screenshot({ path: path.join(OUTDIR, 'mobile-audit-footer.png'), fullPage: false, type: 'png' });
  console.log('✓ mobile-audit-footer.png');
  await page.close();

  await browser.close();
  console.log('\nP4 verification screenshots captured.');
})().catch(e => { console.error('Error:', e.message); process.exit(1); });