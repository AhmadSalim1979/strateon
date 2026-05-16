const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });

  // Desktop - full homepage, scroll through all sections
  const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await desktop.newPage();
  await page.goto('https://qiyadon.com', { waitUntil: 'networkidle', timeout: 30000 });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(1000);
  // Force all fade-in elements to visible
  await page.evaluate(() => {
    document.querySelectorAll('.fade-in').forEach(el => {
      el.style.opacity = '1';
      el.style.transform = 'none';
    });
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'public/screenshots/desktop-home.png', fullPage: true });
  console.log('desktop-home.png done');

  // Mobile - full homepage
  await desktop.close();
  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const mobilePage = await mobile.newPage();
  await mobilePage.goto('https://qiyadon.com', { waitUntil: 'networkidle', timeout: 30000 });
  await mobilePage.evaluate(() => window.scrollTo(0, 0));
  await mobilePage.waitForTimeout(1000);
  await mobilePage.evaluate(() => {
    document.querySelectorAll('.fade-in').forEach(el => {
      el.style.opacity = '1';
      el.style.transform = 'none';
    });
  });
  await mobilePage.waitForTimeout(500);
  await mobilePage.screenshot({ path: 'public/screenshots/mobile-home.png', fullPage: true });
  console.log('mobile-home.png done');

  // Desktop - Operational Evidence section
  await mobile.close();
  const ovDesktop = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const ovPage = await ovDesktop.newPage();
  await ovPage.goto('https://qiyadon.com#operational-evidence', { waitUntil: 'networkidle', timeout: 30000 });
  await ovPage.waitForTimeout(1500);
  // Scroll to section and force visible
  await ovPage.evaluate(() => {
    const section = document.getElementById('operational-evidence');
    if (section) section.scrollIntoView({ behavior: 'instant' });
    document.querySelectorAll('.fade-in').forEach(el => {
      el.style.opacity = '1';
      el.style.transform = 'none';
    });
  });
  await ovPage.waitForTimeout(800);
  await ovPage.screenshot({ path: 'public/screenshots/desktop-evidence.png', fullPage: true });
  console.log('desktop-evidence.png done');

  // Mobile - Operational Evidence
  await ovDesktop.close();
  const ovMobile = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const ovMobPage = await ovMobile.newPage();
  await ovMobPage.goto('https://qiyadon.com#operational-evidence', { waitUntil: 'networkidle', timeout: 30000 });
  await ovMobPage.waitForTimeout(1500);
  await ovMobPage.evaluate(() => {
    const section = document.getElementById('operational-evidence');
    if (section) section.scrollIntoView({ behavior: 'instant' });
    document.querySelectorAll('.fade-in').forEach(el => {
      el.style.opacity = '1';
      el.style.transform = 'none';
    });
  });
  await ovMobPage.waitForTimeout(800);
  await ovMobPage.screenshot({ path: 'public/screenshots/mobile-evidence.png', fullPage: true });
  console.log('mobile-evidence.png done');

  // Desktop - Pipeline Reality Check
  await ovMobile.close();
  const prcDesktop = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const prcPage = await prcDesktop.newPage();
  await prcPage.goto('https://qiyadon.com#pipeline-reality-check', { waitUntil: 'networkidle', timeout: 30000 });
  await prcPage.waitForTimeout(1500);
  await prcPage.evaluate(() => {
    const section = document.getElementById('pipeline-reality-check');
    if (section) section.scrollIntoView({ behavior: 'instant' });
    document.querySelectorAll('.fade-in').forEach(el => {
      el.style.opacity = '1';
      el.style.transform = 'none';
    });
  });
  await prcPage.waitForTimeout(800);
  await prcPage.screenshot({ path: 'public/screenshots/desktop-prc.png', fullPage: true });
  console.log('desktop-prc.png done');

  // Mobile - Pipeline Reality Check
  await prcDesktop.close();
  const prcMobile = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const prcMobPage = await prcMobile.newPage();
  await prcMobPage.goto('https://qiyadon.com#pipeline-reality-check', { waitUntil: 'networkidle', timeout: 30000 });
  await prcMobPage.waitForTimeout(1500);
  await prcMobPage.evaluate(() => {
    const section = document.getElementById('pipeline-reality-check');
    if (section) section.scrollIntoView({ behavior: 'instant' });
    document.querySelectorAll('.fade-in').forEach(el => {
      el.style.opacity = '1';
      el.style.transform = 'none';
    });
  });
  await prcMobPage.waitForTimeout(800);
  await prcMobPage.screenshot({ path: 'public/screenshots/mobile-prc.png', fullPage: true });
  console.log('mobile-prc.png done');

  await browser.close();
  console.log('ALL DONE');
})();