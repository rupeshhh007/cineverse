const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE_URL = 'http://localhost:3005';
const SCREENSHOTS_DIR = path.join(__dirname, '..', 'screenshots');

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

async function run() {
  console.log('🚀 Starting screenshot capture engine...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  try {
    const page = await browser.newPage();

    // 1. Capture Login (Unauthenticated)
    console.log('📸 Capturing: 09-login-desktop.png');
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle0' });
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '09-login-desktop.png') });

    // 1b. Capture Register Mode
    console.log('📸 Capturing: 09-register-desktop.png');
    const regButtons = await page.$$('button');
    for (const b of regButtons) {
      const text = await page.evaluate(el => el.textContent, b);
      if (text.includes('Register')) {
        await b.click();
        break;
      }
    }
    await new Promise(r => setTimeout(r, 400));
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '09-register-desktop.png') });

    // 2. Perform 1-click Demo Login as Alex Rivera
    console.log('🔑 Performing demo login as Alex Rivera...');
    const demoButtons = await page.$$('button');
    let alexBtn = null;
    for (const b of demoButtons) {
      const text = await page.evaluate(el => el.textContent, b);
      if (text.includes('Alex')) {
        alexBtn = b;
        break;
      }
    }
    if (alexBtn) {
      await alexBtn.click();
      await page.waitForNavigation({ waitUntil: 'networkidle0' });
    } else {
      // Fallback via API
      await page.evaluate(async () => {
        await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'alex@cineverse.io', password: 'password123' })
        });
      });
      await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle0' });
    }

    // 3. Capture Discover Home (Desktop 1440x900)
    console.log('📸 Capturing: 01-discover-home-desktop.png');
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '01-discover-home-desktop.png') });

    // 4. Capture Discover Home (Mobile 390x844)
    console.log('📸 Capturing: 01-discover-home-mobile.png');
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '01-discover-home-mobile.png') });

    // Reset to Desktop Viewport
    await page.setViewport({ width: 1440, height: 900, isMobile: false, hasTouch: false });

    // 5. Capture The Query Lens Drawer Open on Discover
    console.log('📸 Capturing: 10-query-lens-drawer-desktop.png');
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle0' });
    // Click on "Query Lens" or "DBMS INSPECTOR" or drawer toggle button
    const buttons = await page.$$('button');
    for (const b of buttons) {
      const txt = await page.evaluate(el => el.textContent, b);
      if (txt.includes('Query Lens') || txt.includes('DBMS') || txt.includes('SQL')) {
        await b.click();
        break;
      }
    }
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '10-query-lens-drawer-desktop.png') });

    // 6. Capture Movie Details (Inception /movies/1)
    console.log('📸 Capturing: 02-movie-details-desktop.png');
    await page.goto(`${BASE_URL}/movies/1`, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '02-movie-details-desktop.png') });

    // 7. Capture The Projection Room — Query Editor
    console.log('📸 Capturing: 03-projection-room-query-desktop.png');
    await page.goto(`${BASE_URL}/dbms-console`, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1000));
    // Click "Run Query" button to show live result table
    const runBtns = await page.$$('button');
    for (const b of runBtns) {
      const txt = await page.evaluate(el => el.textContent, b);
      if (txt.includes('Run Query')) {
        await b.click();
        break;
      }
    }
    await new Promise(r => setTimeout(r, 1200));
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '03-projection-room-query-desktop.png') });

    // 8. Capture The Projection Room — Trigger Lab
    console.log('📸 Capturing: 12-projection-room-trigger-desktop.png');
    const triggerTabBtns = await page.$$('button');
    for (const b of triggerTabBtns) {
      const txt = await page.evaluate(el => el.textContent, b);
      if (txt.includes('Trigger lab') || txt.includes('Trigger')) {
        await b.click();
        break;
      }
    }
    await new Promise(r => setTimeout(r, 600));
    // Click "Execute Test Trigger Mutation"
    const execTrgBtns = await page.$$('button');
    for (const b of execTrgBtns) {
      const txt = await page.evaluate(el => el.textContent, b);
      if (txt.includes('Execute Test Trigger')) {
        await b.click();
        break;
      }
    }
    await new Promise(r => setTimeout(r, 1200));
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '12-projection-room-trigger-desktop.png') });

    // 9. Capture The Projection Room — Schema Relationship Map
    console.log('📸 Capturing: 11-projection-room-schema-desktop.png');
    const schemaTabBtns = await page.$$('button');
    for (const b of schemaTabBtns) {
      const txt = await page.evaluate(el => el.textContent, b);
      if (txt.includes('Schema & ER') || txt.includes('Schema')) {
        await b.click();
        break;
      }
    }
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '11-projection-room-schema-desktop.png') });

    // 10. Capture Activity Feed
    console.log('📸 Capturing: 04-activity-feed-desktop.png');
    await page.goto(`${BASE_URL}/feed`, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '04-activity-feed-desktop.png') });

    // 11. Capture Curated Collections
    console.log('📸 Capturing: 05-curated-collections-desktop.png');
    await page.goto(`${BASE_URL}/lists`, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '05-curated-collections-desktop.png') });

    // 12. Capture Single Collection
    console.log('📸 Capturing: 06-single-collection-desktop.png');
    await page.goto(`${BASE_URL}/lists/1`, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '06-single-collection-desktop.png') });

    // 13. Capture Community Leaderboard
    console.log('📸 Capturing: 07-community-leaderboard-desktop.png');
    await page.goto(`${BASE_URL}/community`, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '07-community-leaderboard-desktop.png') });

    // 14. Capture User Profile (Alex Rivera /profile/1)
    console.log('📸 Capturing: 08-user-profile-desktop.png');
    await page.goto(`${BASE_URL}/profile/1`, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '08-user-profile-desktop.png') });

    console.log('✨ All 14 screenshots captured successfully in screenshots/!');
  } finally {
    await browser.close();
  }
}

run().catch(err => {
  console.error('Screenshot capture failed:', err);
  process.exit(1);
});
