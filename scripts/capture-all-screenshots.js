const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const SCREENSHOTS_DIR = path.join(__dirname, '..', 'screenshots');

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

async function run() {
  console.log(`🚀 Starting screenshot capture engine targeting ${BASE_URL}...`);
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
    await new Promise(r => setTimeout(r, 600));
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
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '09-register-desktop.png') });

    // 2. Perform 1-click Demo Login as Alex Rivera
    console.log('🔑 Performing demo login as Alex Rivera...');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle0' });
    await page.evaluate(async () => {
      await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'alex@cineverse.io', password: 'password123' })
      });
    });
    await new Promise(r => setTimeout(r, 800));
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1200));

    // 3. Capture Discover Home (Desktop 1440x900)
    console.log('📸 Capturing: 01-discover-home-desktop.png');
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1200));
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '01-discover-home-desktop.png') });

    // 4. Capture Discover Home (Mobile 390x844)
    console.log('📸 Capturing: 01-discover-home-mobile.png');
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1200));
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '01-discover-home-mobile.png') });

    // Reset to Desktop Viewport
    await page.setViewport({ width: 1440, height: 900, isMobile: false, hasTouch: false });

    // 5. Capture The Query Lens Drawer Open on Discover
    console.log('📸 Capturing: 10-query-lens-drawer-desktop.png');
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle0' });
    const buttons = await page.$$('button');
    for (const b of buttons) {
      const txt = await page.evaluate(el => el.textContent, b);
      if (txt.includes('Query Lens') || txt.includes('DBMS') || txt.includes('SQL')) {
        await b.click();
        break;
      }
    }
    await new Promise(r => setTimeout(r, 800));
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '10-query-lens-drawer-desktop.png') });

    // 6. Capture CineTrace Novelty Viewer (/trace)
    console.log('📸 Capturing: 00-cinetrace-provenance-desktop.png');
    await page.goto(`${BASE_URL}/trace`, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1200));
    // Click "Save review & capture trace →" to demonstrate live transaction tracing
    const traceBtns = await page.$$('button');
    for (const b of traceBtns) {
      const txt = await page.evaluate(el => el.textContent, b);
      if (txt.includes('Save review & capture trace')) {
        await b.click();
        break;
      }
    }
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '00-cinetrace-provenance-desktop.png') });

    // 7. Capture Movie Details (Inception /movies/1)
    console.log('📸 Capturing: 02-movie-details-desktop.png');
    await page.goto(`${BASE_URL}/movies/1`, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1200));
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '02-movie-details-desktop.png') });

    // 8. Capture DB Studio — Query Editor
    console.log('📸 Capturing: 03-projection-room-query-desktop.png');
    await page.goto(`${BASE_URL}/dbms-console`, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1000));
    // Click "Run query"
    const runBtns = await page.$$('button');
    for (const b of runBtns) {
      const txt = await page.evaluate(el => el.textContent, b);
      if (txt.toLowerCase().includes('run query') || txt.toLowerCase().includes('execute')) {
        await b.click();
        break;
      }
    }
    await new Promise(r => setTimeout(r, 1200));
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '03-projection-room-query-desktop.png') });

    // 9. Capture DB Studio — Trigger Lab
    console.log('📸 Capturing: 12-projection-room-trigger-desktop.png');
    const triggerTabBtns = await page.$$('button');
    for (const b of triggerTabBtns) {
      const txt = await page.evaluate(el => el.textContent, b);
      if (txt.includes('Trigger Lab') || txt.includes('Trigger')) {
        await b.click();
        break;
      }
    }
    await new Promise(r => setTimeout(r, 800));
    const execTrgBtns = await page.$$('button');
    for (const b of execTrgBtns) {
      const txt = await page.evaluate(el => el.textContent, b);
      if (txt.includes('Execute Test Trigger') || txt.includes('Test Trigger')) {
        await b.click();
        break;
      }
    }
    await new Promise(r => setTimeout(r, 1200));
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '12-projection-room-trigger-desktop.png') });

    // 10. Capture DB Studio — Schema & Interactive ER Diagram
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

    // 11. Capture Activity Feed
    console.log('📸 Capturing: 04-activity-feed-desktop.png');
    await page.goto(`${BASE_URL}/feed`, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1200));
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '04-activity-feed-desktop.png') });

    // 12. Capture Curated Collections
    console.log('📸 Capturing: 05-curated-collections-desktop.png');
    await page.goto(`${BASE_URL}/lists`, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1200));
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '05-curated-collections-desktop.png') });

    // 13. Capture Single Collection
    console.log('📸 Capturing: 06-single-collection-desktop.png');
    await page.goto(`${BASE_URL}/lists/1`, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1200));
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '06-single-collection-desktop.png') });

    // 14. Capture Community Leaderboard
    console.log('📸 Capturing: 07-community-leaderboard-desktop.png');
    await page.goto(`${BASE_URL}/community`, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1200));
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '07-community-leaderboard-desktop.png') });

    // 15. Capture User Profile (Alex Rivera /profile/1)
    console.log('📸 Capturing: 08-user-profile-desktop.png');
    await page.goto(`${BASE_URL}/profile/1`, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1200));
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '08-user-profile-desktop.png') });

    // 16. Capture Countercut Studio Desktop (/countercut)
    console.log('📸 Capturing: 13-countercut-studio-desktop.png');
    await page.setViewport({ width: 1440, height: 900, isMobile: false, hasTouch: false });
    await page.goto(`${BASE_URL}/countercut`, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1500));

    // If there is a "Launch Investigation" button, click it to trigger the live agent investigation
    const launchBtns = await page.$$('button');
    for (const b of launchBtns) {
      const txt = await page.evaluate(el => el.textContent, b);
      if (txt.includes('Launch Investigation') || txt.includes('Investigate My Taste') || txt.includes('Run Investigation')) {
        await b.click();
        console.log('  ⏳ Triggered live Countercut investigation...');
        await new Promise(r => setTimeout(r, 4500));
        break;
      }
    }
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '13-countercut-studio-desktop.png') });

    // 17. Capture Countercut Studio Mobile (/countercut)
    console.log('📸 Capturing: 14-countercut-studio-mobile.png');
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    await page.goto(`${BASE_URL}/countercut`, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '14-countercut-studio-mobile.png') });

    console.log('✨ All 17 screenshots captured successfully in screenshots/!');
  } finally {
    await browser.close();
  }
}

run().catch(err => {
  console.error('Screenshot capture failed:', err);
  process.exit(1);
});
