const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:5173';
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;

const ARTIFACTS_DIR = 'C:\\Users\\Somto\\.gemini\\antigravity\\brain\\6ab938df-6d67-4501-9733-104fd729eebb';
const OUTPUT_VIDEO_MP4 = path.join(ARTIFACTS_DIR, 'catch_me_demo.mp4');
const LOCAL_VIDEO_MP4 = path.join(__dirname, 'catch_me_demo.mp4');

// Ensure artifacts dir exists
if (!fs.existsSync(ARTIFACTS_DIR)) {
  fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Inject visual cursor and click ripples for high quality video demo
async function injectVisualCursor(page) {
  await page.evaluate(() => {
    if (document.getElementById('pulse-demo-cursor')) return;

    const cursor = document.createElement('div');
    cursor.id = 'pulse-demo-cursor';
    cursor.style.position = 'fixed';
    cursor.style.top = '0px';
    cursor.style.left = '0px';
    cursor.style.width = '20px';
    cursor.style.height = '20px';
    cursor.style.borderRadius = '50%';
    cursor.style.backgroundColor = 'rgba(59, 130, 246, 0.85)';
    cursor.style.border = '2px solid rgba(255, 255, 255, 0.9)';
    cursor.style.boxShadow = '0 0 14px rgba(59, 130, 246, 0.8)';
    cursor.style.pointerEvents = 'none';
    cursor.style.zIndex = '9999999';
    cursor.style.transform = 'translate(-50%, -50%)';
    cursor.style.transition = 'transform 0.12s ease-out, background-color 0.2s, width 0.15s, height 0.15s';
    document.body.appendChild(cursor);

    window.addEventListener('mousemove', (e) => {
      cursor.style.left = `${e.clientX}px`;
      cursor.style.top = `${e.clientY}px`;
    });

    window.addEventListener('mousedown', (e) => {
      cursor.style.width = '14px';
      cursor.style.height = '14px';
      cursor.style.backgroundColor = 'rgba(239, 68, 68, 0.9)';

      const ripple = document.createElement('div');
      ripple.style.position = 'fixed';
      ripple.style.left = `${e.clientX}px`;
      ripple.style.top = `${e.clientY}px`;
      ripple.style.width = '10px';
      ripple.style.height = '10px';
      ripple.style.borderRadius = '50%';
      ripple.style.border = '2px solid rgba(59, 130, 246, 0.85)';
      ripple.style.transform = 'translate(-50%, -50%) scale(1)';
      ripple.style.pointerEvents = 'none';
      ripple.style.zIndex = '9999998';
      ripple.style.animation = 'pulse-ripple 0.55s cubic-bezier(0.1, 0.8, 0.3, 1) forwards';
      document.body.appendChild(ripple);
      setTimeout(() => ripple.remove(), 550);
    });

    window.addEventListener('mouseup', () => {
      cursor.style.width = '20px';
      cursor.style.height = '20px';
      cursor.style.backgroundColor = 'rgba(59, 130, 246, 0.85)';
    });

    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse-ripple {
        0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
        100% { transform: translate(-50%, -50%) scale(4.5); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  });
}

// Smooth mouse movement
async function moveMouseSmooth(page, targetX, targetY, steps = 14) {
  await page.mouse.move(targetX, targetY, { steps });
  await sleep(40);
}

// Human-like smooth typing
async function typeSmoothly(element, text, delayMs = 28) {
  for (const char of text) {
    await element.type(char, { delay: delayMs });
  }
}

// Helper to find and click element by selector or text
async function clickByText(page, text, tag = 'button, a, div, span, tr') {
  const clicked = await page.evaluate((t, selector) => {
    const elements = Array.from(document.querySelectorAll(selector));
    const target = elements.find(el => el.innerText && el.innerText.trim().toLowerCase().includes(t.toLowerCase()));
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const rect = target.getBoundingClientRect();
      target.click();
      return { found: true, x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    }
    return { found: false };
  }, text, tag);

  if (clicked.found && clicked.x && clicked.y) {
    await moveMouseSmooth(page, clicked.x, clicked.y, 10);
    await sleep(200);
    return true;
  }
  return false;
}

async function moveAndClickSelector(page, selector) {
  const el = await page.$(selector);
  if (!el) return false;
  const box = await el.boundingBox();
  if (box) {
    await moveMouseSmooth(page, box.x + box.width / 2, box.y + box.height / 2, 12);
    await sleep(80);
    await el.click();
    await sleep(200);
    return true;
  } else {
    await el.evaluate(e => e.click());
    return true;
  }
}

async function runDemo() {
  console.log('🎬 Starting Non-Headless Controlled Browser for "Catch Me" Sports Networking Startup Demonstration...');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: false,
    defaultViewport: { width: 1440, height: 900 },
    args: [
      '--window-size=1480,980',
      '--window-position=40,25',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-blink-features=AutomationControlled',
      '--disable-features=TranslateUI'
    ]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });

  // Setup CDP screencast recording directly to FFmpeg MP4
  console.log('🎥 Initializing real-time Screencast Video Pipeline to FFmpeg...');
  const client = await page.target().createCDPSession();

  const ffmpeg = spawn(ffmpegPath, [
    '-y',
    '-f', 'image2pipe',
    '-vcodec', 'mjpeg',
    '-r', '30',
    '-i', '-',
    '-c:v', 'libx264',
    '-pix_fmt', 'yuv420p',
    '-preset', 'fast',
    '-crf', '19',
    OUTPUT_VIDEO_MP4
  ]);

  let frameCount = 0;
  client.on('Page.screencastFrame', async ({ data, sessionId }) => {
    try {
      ffmpeg.stdin.write(Buffer.from(data, 'base64'));
      frameCount++;
      await client.send('Page.screencastFrameAck', { sessionId });
    } catch (e) {}
  });

  await client.send('Page.startScreencast', {
    format: 'jpeg',
    quality: 94,
    maxWidth: 1440,
    maxHeight: 900,
    everyNthFrame: 1
  });

  console.log('✨ Screencast started. Executing Project Manager demonstration sequence...');

  // Setup localStorage with Catch Me workspace session
  await page.goto(`${BASE_URL}/welcome`, { waitUntil: 'domcontentloaded' });
  await injectVisualCursor(page);

  await page.evaluate(() => {
    const orgId = '97ba7dfa-724b-4349-8c0a-6eeb1ee096b0';
    const orgSlug = 'catchme';
    const orgName = 'Catch Me — Sports Networking';
    const userId = '00000000-0000-0000-0000-000000000001';

    localStorage.setItem('pulse_auth_token', 'demo-token-catchme');
    localStorage.setItem('pulse_tenant_slug', orgSlug);
    localStorage.setItem('pulse_user_id', userId);
    localStorage.setItem('pulse_user_name', 'Alex Rivera');
    localStorage.setItem('pulse_user_email', 'alex.rivera@catchme.app');
    localStorage.setItem(`pulse_org_status_${orgSlug}`, 'APPROVED');
    localStorage.setItem(`pulse_user_role_${orgSlug}`, 'Admin');
    localStorage.setItem('pulse_theme', 'dark');

    const orgs = [
      {
        id: orgId,
        name: orgName,
        slug: orgSlug,
        role: 'Admin',
        status: 'APPROVED',
        membersCount: 5,
        activeProjects: 3
      },
      {
        id: 'org-epicordia',
        name: 'Epicordia Systems',
        slug: 'epicordia',
        role: 'Executive',
        status: 'APPROVED',
        membersCount: 12,
        activeProjects: 4
      }
    ];
    localStorage.setItem('pulse_user_orgs', JSON.stringify(orgs));
    localStorage.setItem('pulse_client_orgs', JSON.stringify(orgs));
  });

  // ==========================================
  // SCENE 1: Welcome Screen & Workspace Hub
  // ==========================================
  console.log('▶ Scene 1: Welcome & Landing Showcase');
  await injectVisualCursor(page);
  await sleep(1500);

  // Scroll smoothly down and up on welcome page
  await moveMouseSmooth(page, 720, 450, 15);
  await page.evaluate(() => window.scrollBy({ top: 380, behavior: 'smooth' }));
  await sleep(1200);
  await page.evaluate(() => window.scrollBy({ top: -380, behavior: 'smooth' }));
  await sleep(1000);

  // Navigate to Organization Switcher
  console.log('  -> Opening Workspace Selector...');
  await page.goto(`${BASE_URL}/select-org`, { waitUntil: 'domcontentloaded' });
  await injectVisualCursor(page);
  await sleep(1500);

  // Select "Catch Me" Workspace Card
  await clickByText(page, 'Catch Me', 'div, button, a');
  await sleep(1200);

  // ==========================================
  // SCENE 2: PM Dashboard & Alignment Telemetry
  // ==========================================
  console.log('▶ Scene 2: Project Manager Dashboard Overview');
  await page.goto(`${BASE_URL}/catchme/dashboard`, { waitUntil: 'domcontentloaded' });
  await injectVisualCursor(page);
  await sleep(2200);

  // Hover over telemetry metrics (Pulse Score, Sprint Velocity, Energy Index)
  await moveMouseSmooth(page, 280, 190, 18);
  await sleep(700);
  await moveMouseSmooth(page, 580, 190, 18);
  await sleep(700);
  await moveMouseSmooth(page, 880, 190, 18);
  await sleep(700);
  await moveMouseSmooth(page, 1180, 190, 18);
  await sleep(900);

  // Submit Daily Reflection / Morale Note
  console.log('  -> Logging Daily PM Reflection & Morale...');
  const happyMoodBtn = await page.$('button[title*="Happy" i], button svg.lucide-smile, button svg[class*="smile"]');
  if (happyMoodBtn) {
    await moveAndClickSelector(page, 'button[title*="Happy" i], button svg.lucide-smile, button svg[class*="smile"]');
    await sleep(500);
  }

  const reflectionInput = await page.$('input[placeholder*="reflection" i], input[placeholder*="mind" i], textarea[placeholder*="reflection" i]');
  if (reflectionInput) {
    const box = await reflectionInput.boundingBox();
    if (box) await moveMouseSmooth(page, box.x + box.width / 2, box.y + box.height / 2, 10);
    await reflectionInput.click();
    await typeSmoothly(reflectionInput, 'Sprint 4 kickoff: Mapbox court finder & real-time matchmaking MVP ready for pilot rollout! 🏆', 24);
    await sleep(600);
    await clickByText(page, 'Post', 'button');
    await sleep(800);
  }

  // Scroll down to review Urgent Tasks & Active Sprints
  await page.evaluate(() => window.scrollBy({ top: 320, behavior: 'smooth' }));
  await sleep(1500);
  await moveMouseSmooth(page, 450, 480, 15);
  await sleep(800);
  await page.evaluate(() => window.scrollBy({ top: -320, behavior: 'smooth' }));
  await sleep(1000);

  // ==========================================
  // SCENE 3: Strategic Goals & OKRs Planning
  // ==========================================
  console.log('▶ Scene 3: Strategic Goals & OKRs (Sports Startup Milestones)');
  await page.goto(`${BASE_URL}/catchme/goals`, { waitUntil: 'domcontentloaded' });
  await injectVisualCursor(page);
  await sleep(2000);

  // Hover over Goal card: "Q3 Launch: 10,000 Active Athletes & 500 Verified Venues"
  await moveMouseSmooth(page, 450, 320, 18);
  await sleep(1000);

  // Open Goal Detail Slide-Over Drawer
  console.log('  -> Opening Goal Detail Drawer...');
  await clickByText(page, '10,000 Active Athletes', 'div, span, p, h3');
  await sleep(2000);

  // Inspect Key Results inside Drawer
  await moveMouseSmooth(page, 1120, 380, 18);
  await sleep(900);
  await moveMouseSmooth(page, 1120, 520, 18);
  await sleep(900);

  // Close Drawer
  await page.keyboard.press('Escape');
  await sleep(800);

  // ==========================================
  // SCENE 4: Interactive Relationship & Knowledge Graph
  // ==========================================
  console.log('▶ Scene 4: Interactive Spider-Web / Obsidian-Style Network Canvas');
  await page.goto(`${BASE_URL}/catchme/relationships`, { waitUntil: 'domcontentloaded' });
  await injectVisualCursor(page);
  await sleep(2500);

  // Pan across network nodes
  await moveMouseSmooth(page, 720, 450, 20);
  await sleep(800);
  await moveMouseSmooth(page, 620, 380, 20);
  await sleep(800);
  await moveMouseSmooth(page, 820, 520, 20);
  await sleep(1000);

  // Zoom control
  const zoomInBtn = await page.$('button svg.lucide-zoom-in, button svg[class*="zoom-in"], button[title*="Zoom In" i]');
  if (zoomInBtn) {
    await moveAndClickSelector(page, 'button svg.lucide-zoom-in, button svg[class*="zoom-in"], button[title*="Zoom In" i]');
    await sleep(600);
  }

  // Click on a Squad Folder in sidebar
  await clickByText(page, 'Mobile Core Squad', 'button, div, span');
  await sleep(1200);

  // ==========================================
  // SCENE 5: Project Portfolio & Milestones
  // ==========================================
  console.log('▶ Scene 5: Project Portfolio & Milestone Tracking');
  await page.goto(`${BASE_URL}/catchme/projects`, { waitUntil: 'domcontentloaded' });
  await injectVisualCursor(page);
  await sleep(2000);

  // Hover over Project Cards
  await moveMouseSmooth(page, 380, 320, 18);
  await sleep(800);
  await moveMouseSmooth(page, 750, 320, 18);
  await sleep(800);
  await moveMouseSmooth(page, 1100, 320, 18);
  await sleep(900);

  // Open "Catch Me Mobile MVP" Project Detail Drawer
  console.log('  -> Opening Project Detail Drawer...');
  await clickByText(page, 'Catch Me Mobile MVP', 'div, h3, span, p');
  await sleep(2000);

  // Inspect Project Drawer details
  await moveMouseSmooth(page, 1120, 360, 18);
  await sleep(900);
  await moveMouseSmooth(page, 1120, 520, 18);
  await sleep(900);

  // Close Drawer
  await page.keyboard.press('Escape');
  await sleep(800);

  // ==========================================
  // SCENE 6: Task Execution Hub & Kanban Board
  // ==========================================
  console.log('▶ Scene 6: Task Execution Hub & Kanban Board');
  await page.goto(`${BASE_URL}/catchme/tasks`, { waitUntil: 'domcontentloaded' });
  await injectVisualCursor(page);
  await sleep(2000);

  // Switch to Kanban Board View
  console.log('  -> Switching to Kanban Board View...');
  await clickByText(page, 'Board', 'button');
  await sleep(1800);

  // Move across columns (To Do, In Progress, Blocked, Done)
  await moveMouseSmooth(page, 260, 420, 18);
  await sleep(700);
  await moveMouseSmooth(page, 560, 420, 18);
  await sleep(700);
  await moveMouseSmooth(page, 860, 420, 18);
  await sleep(700);
  await moveMouseSmooth(page, 1160, 420, 18);
  await sleep(800);

  // Open Blocked Task to inspect and resolve blocker
  console.log('  -> Inspecting Blocked Task & Posting Update...');
  await clickByText(page, 'Stripe Split Payments', 'div, tr, span, p');
  await sleep(2000);

  // Scroll down inside drawer
  await moveMouseSmooth(page, 1150, 450, 15);
  await page.evaluate(() => {
    const drawer = document.querySelector('aside, div[class*="drawer"], div[class*="fixed right-0"]');
    if (drawer) drawer.scrollBy({ top: 320, behavior: 'smooth' });
  });
  await sleep(1000);

  // Add a collaboration comment
  const commentInput = await page.$('input[placeholder*="comment" i], textarea[placeholder*="comment" i]');
  if (commentInput) {
    const box = await commentInput.boundingBox();
    if (box) await moveMouseSmooth(page, box.x + box.width / 2, box.y + box.height / 2, 10);
    await commentInput.click();
    await typeSmoothly(commentInput, 'Stripe KYC verified! Moving forward with escrow test in staging environment.', 24);
    await sleep(600);
    await clickByText(page, 'Comment', 'button');
    await sleep(1000);
  }

  await page.keyboard.press('Escape');
  await sleep(800);

  // Create a New High-Priority Task via the Top Creation Modal
  console.log('  -> Creating New Task via Quick Creation Modal...');
  const newInitiativeSuccess = await clickByText(page, 'New Initiative', 'button') || await clickByText(page, '+ Create', 'button');
  if (newInitiativeSuccess) {
    await sleep(1200);

    const titleInput = await page.$('input[placeholder*="title" i], input[placeholder*="Task" i], input[type="text"]');
    if (titleInput) {
      await titleInput.click();
      await typeSmoothly(titleInput, 'Real-Time Player Match Lobbies & Push Notifications', 28);
      await sleep(600);
    }

    await clickByText(page, 'Urgent', 'button, div, span');
    await sleep(500);

    const created = await clickByText(page, 'Create Task', 'button') || await clickByText(page, 'Save', 'button');
    if (!created) {
      await page.keyboard.press('Escape');
    }
    await sleep(1500);
  }

  // ==========================================
  // SCENE 7: Daily Pulse Check-In (4-Step Wizard)
  // ==========================================
  console.log('▶ Scene 7: Daily Pulse (EOD Check-In) 4-Step Wizard');
  await page.goto(`${BASE_URL}/catchme/pulse`, { waitUntil: 'domcontentloaded' });
  await injectVisualCursor(page);
  await sleep(2000);

  // Step 1: Accomplishments
  console.log('  -> Step 1: Logging Daily Accomplishments...');
  const accInput = await page.$('input[placeholder*="accomplish" i], textarea[placeholder*="accomplish" i], input[placeholder*="today" i], input[type="text"]');
  if (accInput) {
    await accInput.click();
    await typeSmoothly(accInput, 'Completed Mapbox venue cluster optimization and reviewed ELO matchmaking benchmark tests.', 24);
    await sleep(800);
  }

  // Click Next
  await clickByText(page, 'Next', 'button') || await clickByText(page, 'Continue', 'button');
  await sleep(1000);

  // Step 2: Next Priorities
  console.log('  -> Step 2: Setting Tomorrow Priorities...');
  const nextPriorityInput = await page.$('input[placeholder*="tomorrow" i], textarea[placeholder*="tomorrow" i], input[type="text"]');
  if (nextPriorityInput) {
    await nextPriorityInput.click();
    await typeSmoothly(nextPriorityInput, 'Deploy TestFlight v0.4 to local Austin soccer clubs for pilot pickup games.', 24);
    await sleep(800);
  }

  await clickByText(page, 'Next', 'button') || await clickByText(page, 'Continue', 'button');
  await sleep(1000);

  // Step 3: Energy Rating (5/5 Peak Energy!)
  console.log('  -> Step 3: Selecting Energy Level (5/5 Peak Energy)...');
  await clickByText(page, '5', 'button, div') || await clickByText(page, 'Peak', 'button, div');
  await sleep(800);

  // Submit EOD Check-In with Confetti
  console.log('  -> Submitting EOD Check-In (Triggering Confetti)...');
  await clickByText(page, 'Submit', 'button') || await clickByText(page, 'Done', 'button');
  await sleep(2500); // Celebrate confetti!

  // ==========================================
  // SCENE 8: Team Roster & Squad Capacity
  // ==========================================
  console.log('▶ Scene 8: Team Roster & Squad Capacity Planning');
  await page.goto(`${BASE_URL}/catchme/team`, { waitUntil: 'domcontentloaded' });
  await injectVisualCursor(page);
  await sleep(2000);

  // Inspect squad cards & roster table
  await moveMouseSmooth(page, 380, 300, 18);
  await sleep(800);
  await moveMouseSmooth(page, 850, 300, 18);
  await sleep(800);
  await page.evaluate(() => window.scrollBy({ top: 280, behavior: 'smooth' }));
  await sleep(1200);
  await page.evaluate(() => window.scrollBy({ top: -280, behavior: 'smooth' }));
  await sleep(800);

  // ==========================================
  // SCENE 9: Analytics & Sprint Velocity
  // ==========================================
  console.log('▶ Scene 9: Telemetry & Sprint Velocity Charts');
  await page.goto(`${BASE_URL}/catchme/analytics`, { waitUntil: 'domcontentloaded' });
  await injectVisualCursor(page);
  await sleep(2200);

  // Hover over Velocity chart & Burndown
  await moveMouseSmooth(page, 450, 380, 18);
  await sleep(900);
  await moveMouseSmooth(page, 950, 380, 18);
  await sleep(900);

  // Switch tabs: Burndown / Bottlenecks
  await clickByText(page, 'Trajectory', 'button') || await clickByText(page, 'Burndown', 'button');
  await sleep(1500);

  // ==========================================
  // SCENE 10: Multi-Role Simulator & Global Omnibox Search
  // ==========================================
  console.log('▶ Scene 10: Live Role Switcher & Global Omnibox (Ctrl+K)');
  await page.goto(`${BASE_URL}/catchme/dashboard`, { waitUntil: 'domcontentloaded' });
  await injectVisualCursor(page);
  await sleep(1500);

  // Click "Executive" Role Pill in top bar
  console.log('  -> Simulating Executive View...');
  await clickByText(page, 'Executive', 'button, div');
  await sleep(1800);

  // Switch back to Admin / Lead PM
  console.log('  -> Switching back to Admin / PM View...');
  await clickByText(page, 'Admin', 'button, div');
  await sleep(1200);

  // Trigger Omnibox Search with Ctrl+K
  console.log('  -> Triggering Global Search Omnibox (Ctrl+K)...');
  await page.keyboard.down('Control');
  await page.keyboard.press('KeyK');
  await page.keyboard.up('Control');
  await sleep(1000);

  const omniInput = await page.$('input[placeholder*="Search" i], input[type="text"]');
  if (omniInput) {
    await typeSmoothly(omniInput, 'Matchmaking', 30);
    await sleep(1200);
    await page.keyboard.press('Escape');
    await sleep(800);
  }

  // Final celebration outro on Dashboard
  console.log('▶ Demo Outro: Final Overview');
  await moveMouseSmooth(page, 720, 450, 18);
  await sleep(2000);

  // Stop Screencast & finalize video stream
  console.log('🛑 Stopping screencast and finalizing MP4 video encoding...');
  await client.send('Page.stopScreencast');
  await sleep(1000);

  ffmpeg.stdin.end();

  await new Promise((resolve) => {
    ffmpeg.on('close', (code) => {
      console.log(`✅ FFmpeg closed with code ${code}. Total frames captured: ${frameCount}`);
      resolve();
    });
  });

  // Copy to local repo for easy access
  if (fs.existsSync(OUTPUT_VIDEO_MP4)) {
    fs.copyFileSync(OUTPUT_VIDEO_MP4, LOCAL_VIDEO_MP4);
    const stats = fs.statSync(OUTPUT_VIDEO_MP4);
    console.log(`🎉 Demo Video successfully saved to:\n  - ${OUTPUT_VIDEO_MP4} (${(stats.size / 1024 / 1024).toFixed(2)} MB)\n  - ${LOCAL_VIDEO_MP4}`);
  }

  await browser.close();
  console.log('🏁 Catch Me Startup Demonstration Recording Finished Successfully!');
}

runDemo().catch((err) => {
  console.error('Fatal recording error:', err);
  process.exit(1);
});
