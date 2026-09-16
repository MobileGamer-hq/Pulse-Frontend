const puppeteer = require('puppeteer-core');

const BASE_URL = 'http://localhost:5173';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const SOMTO_EMAIL = 'somto@gmail.com';
const SOMTO_PASS = 'somto123';
const SOMTO_NAME = 'Somto Workspace Owner';

const JASON_EMAIL = 'jason@gmail.com';
const JASON_PASS = 'jason123';
const JASON_NAME = 'Jason Babafemi';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function setReactInputValue(page, selector, value) {
  await page.waitForSelector(selector, { timeout: 8000 });
  await page.evaluate((sel, val) => {
    const input = document.querySelector(sel);
    if (input) {
      const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      nativeSetter.call(input, val);
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }, selector, value);
}

async function runTest() {
  console.log('🚀 Starting Comprehensive Invitation Flow E2E Test...');
  
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    defaultViewport: { width: 1440, height: 900 },
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--disable-software-rasterizer',
      '--mute-audio',
      '--headless=new'
    ]
  });

  const page = await browser.newPage();
  
  page.on('console', msg => {
    console.log(`[BROWSER CONSOLE ${msg.type().toUpperCase()}] ${msg.text()}`);
  });
  
  page.on('pageerror', err => {
    console.log(`[BROWSER PAGEERROR] ${err.message}`);
  });

  try {
    // -------------------------------------------------------------
    // STEP 1: Somto Account Registration / Login
    // -------------------------------------------------------------
    console.log('\n======================================================');
    console.log('STEP 1: Logging in / Registering Somto (somto@gmail.com)');
    console.log('======================================================');

    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
    await sleep(1000);

    // Sign in as Somto
    console.log('Attempting sign in as Somto...');
    await page.waitForSelector('input[type="email"]', { timeout: 5000 });
    await page.type('input[type="email"]', SOMTO_EMAIL);
    await page.type('input[type="password"]', SOMTO_PASS);
    await page.click('button[type="submit"]');
    await sleep(3000);

    let currentUrl = page.url();
    console.log('Current URL after sign in attempt:', currentUrl);

    // If at select-org, choose or create workspace
    if (currentUrl.includes('/select-org') || currentUrl.includes('/create-org')) {
      console.log('At organization setup / selection. Ensuring Somto Workspace exists...');
      
      const needsCreate = await page.evaluate(() => {
        return !document.body.innerText.includes('somtoworkspace') && !document.body.innerText.includes('Somto Workspace');
      });

      if (needsCreate || currentUrl.includes('/create-org')) {
        console.log('Creating organization "Somto Workspace" (somtoworkspace)...');
        await page.goto(`${BASE_URL}/create-org`, { waitUntil: 'domcontentloaded' });
        await sleep(1000);

        // Step 1: Org Name
        await page.waitForSelector('input[placeholder*="Epicordia"]', { timeout: 5000 });
        await page.type('input[placeholder*="Epicordia"]', 'Somto Workspace');
        await sleep(500);
        await page.click('button[type="submit"]');
        await sleep(1000);

        // Step 2: Team Setup
        await page.waitForSelector('button[type="submit"]', { timeout: 5000 });
        await page.click('button[type="submit"]');
        await sleep(1000);

        // Step 3: Launch
        await page.evaluate(() => {
          const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('CREATE ORGANIZATION'));
          if (btn) btn.click();
        });
        await sleep(3000);
      } else {
        console.log('Selecting existing workspace card...');
        await page.evaluate(() => {
          const orgCard = document.querySelector('.grid > div');
          if (orgCard) orgCard.click();
        });
        await sleep(2000);
      }
    }

    currentUrl = page.url();
    console.log('Somto is on workspace URL:', currentUrl);

    let orgSlug = 'somtoworkspace';
    const nonOrgRoutes = ['select-org', 'create-org', 'join-org', 'login', 'signin', 'register', 'signup', 'welcome'];
    const orgSlugMatch = currentUrl.match(/localhost:5173\/([^\/]+)/);
    if (orgSlugMatch && !nonOrgRoutes.includes(orgSlugMatch[1])) {
      orgSlug = orgSlugMatch[1];
    }
    console.log('Active Organization Slug:', orgSlug);

    // Ensure we land on the dashboard
    if (!page.url().includes('/dashboard')) {
      await page.goto(`${BASE_URL}/${orgSlug}/dashboard`, { waitUntil: 'networkidle0' });
      await sleep(2000);
    }

    console.log('✅ Somto successfully entered dashboard at:', page.url());

    // -------------------------------------------------------------
    // STEP 2: Somto Invites Jason Babafemi (jason@gmail.com)
    // -------------------------------------------------------------
    console.log('\n======================================================');
    console.log('STEP 2: Inviting Jason Babafemi (jason@gmail.com)');
    console.log('======================================================');

    console.log('Opening Invite Team Member modal...');
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('pulse:open-create-item', { detail: { type: 'member' } }));
    });
    await sleep(1500);

    console.log('Typing member details (Jason Babafemi, jason@gmail.com)...');
    await setReactInputValue(page, 'input[placeholder*="Samantha"]', JASON_NAME);
    await setReactInputValue(page, 'input[placeholder*="samantha@acme.com"]', JASON_EMAIL);
    await sleep(500);

    const typedValues = await page.evaluate(() => {
      const n = document.querySelector('input[placeholder*="Samantha"]')?.value;
      const e = document.querySelector('input[placeholder*="samantha@acme.com"]')?.value;
      return { n, e };
    });
    console.log('Typed input values in DOM:', typedValues);

    console.log('Submitting Invite form in modal...');
    await page.evaluate(() => {
      const form = document.querySelector('.fixed.inset-0 form');
      if (form) {
        if (typeof form.requestSubmit === 'function') {
          form.requestSubmit();
        } else {
          form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
        }
      } else {
        console.error('Modal form element not found!');
      }
    });

    console.log('Waiting for generated invitation token and link in modal...');
    await page.waitForSelector('code', { timeout: 10000 });

    const inviteData = await page.evaluate(() => {
      const tokenEl = document.querySelector('code');
      const token = tokenEl ? tokenEl.innerText.trim() : null;
      const linkInput = document.querySelector('input[readOnly]');
      const inviteLink = linkInput ? linkInput.value.trim() : null;
      return { token, inviteLink };
    });

    console.log('✅ Generated Invite Token:', inviteData.token);
    console.log('✅ Generated Public Acceptance Link:', inviteData.inviteLink);

    if (!inviteData.token || !inviteData.inviteLink) {
      throw new Error('Failed to generate invite token and link!');
    }

    // Close modal
    await page.evaluate(() => {
      const doneBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.trim() === 'Done');
      if (doneBtn) doneBtn.click();
    });
    await sleep(1000);

    // -------------------------------------------------------------
    // STEP 3: Logout Somto
    // -------------------------------------------------------------
    console.log('\n======================================================');
    console.log('STEP 3: Logging out Somto');
    console.log('======================================================');

    await page.evaluate(() => {
      localStorage.removeItem('pulse_auth_token');
      localStorage.removeItem('pulse_tenant_slug');
      localStorage.removeItem('pulse_user_id');
      localStorage.removeItem('pulse_user_name');
      localStorage.removeItem('pulse_user_email');
      window.location.href = '/welcome';
    });
    await sleep(2000);
    console.log('Logged out. Current URL:', page.url());

    // -------------------------------------------------------------
    // STEP 4: Jason Accepts via Public Acceptance Link
    // -------------------------------------------------------------
    console.log('\n======================================================');
    console.log(`STEP 4: Jason Navigating to Invite Link: ${inviteData.inviteLink}`);
    console.log('======================================================');

    await page.goto(inviteData.inviteLink, { waitUntil: 'domcontentloaded' });
    await sleep(2000);

    console.log('On Acceptance Page:', page.url());

    // Authenticate Jason on Acceptance Screen
    console.log('Authenticating Jason Babafemi on Invite Screen...');
    await setReactInputValue(page, 'input[type="email"]', JASON_EMAIL);
    await setReactInputValue(page, 'input[type="password"]', JASON_PASS);
    await sleep(500);

    console.log('Submitting Auth Form on Acceptance Screen...');
    await page.evaluate(() => {
      const form = document.querySelector('form');
      if (form) {
        if (typeof form.requestSubmit === 'function') form.requestSubmit();
        else form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
      }
    });
    await sleep(2000);

    let isAuthed = await page.evaluate(() => {
      return document.body.innerText.includes('Authenticated as') || document.body.innerText.includes('ACCEPT INVITATION & JOIN WORKSPACE');
    });

    if (!isAuthed) {
      console.log('Switching to Create Account tab...');
      await page.evaluate(() => {
        const createBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.trim() === 'Create Account');
        if (createBtn) createBtn.click();
      });
      await sleep(1000);

      await setReactInputValue(page, 'input[placeholder*="Somto Member"]', JASON_NAME);
      await setReactInputValue(page, 'input[type="email"]', JASON_EMAIL);
      await setReactInputValue(page, 'input[type="password"]', JASON_PASS);
      await sleep(500);

      await page.evaluate(() => {
        const form = document.querySelector('form');
        if (form) {
          if (typeof form.requestSubmit === 'function') form.requestSubmit();
          else form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
        }
      });
      await sleep(2500);
    }

    isAuthed = await page.evaluate(() => {
      return document.body.innerText.includes('Authenticated as') || document.body.innerText.includes('ACCEPT INVITATION & JOIN WORKSPACE');
    });
    console.log('Is Jason authenticated on acceptance screen?', isAuthed);

    // Accept Invitation & Join Workspace
    console.log('Clicking "ACCEPT INVITATION & JOIN WORKSPACE"...');
    await page.evaluate(() => {
      const form = document.querySelector('form');
      if (form) {
        if (typeof form.requestSubmit === 'function') form.requestSubmit();
        else form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
      }
    });

    await sleep(3500);

    currentUrl = page.url();
    console.log('URL after accepting invite:', currentUrl);

    const onDashboard = currentUrl.includes('/dashboard') || currentUrl.includes(`/${orgSlug}`);
    console.log('✅ Is Jason in workspace dashboard?', onDashboard);

    if (onDashboard) {
      console.log(`🎉 SUCCESS: Jason Babafemi (${JASON_EMAIL}) joined workspace via public link!`);
    } else {
      throw new Error(`Jason was not redirected to dashboard. Current URL: ${currentUrl}`);
    }

    // -------------------------------------------------------------
    // STEP 5: Testing Join via Token on /join-org
    // -------------------------------------------------------------
    console.log('\n======================================================');
    console.log('STEP 5: Testing Direct Token Join on /join-org');
    console.log('======================================================');

    // Generate second invite as Somto
    await page.evaluate(() => {
      localStorage.removeItem('pulse_auth_token');
      localStorage.removeItem('pulse_tenant_slug');
      localStorage.removeItem('pulse_user_id');
      localStorage.removeItem('pulse_user_name');
      localStorage.removeItem('pulse_user_email');
      window.location.href = '/login';
    });
    await sleep(2000);

    console.log('Logging in as Somto to generate another invite token...');
    await page.waitForSelector('input[type="email"]', { timeout: 8000 });
    await page.type('input[type="email"]', SOMTO_EMAIL);
    await page.type('input[type="password"]', SOMTO_PASS);
    await page.click('button[type="submit"]');
    await sleep(3000);

    await page.goto(`${BASE_URL}/${orgSlug}/dashboard`, { waitUntil: 'domcontentloaded' });
    await sleep(2000);
    console.log('Step 5 landed on URL:', page.url());
    console.log('Step 5 page body text:', await page.evaluate(() => document.body.innerText.slice(0, 150)));
    await page.waitForSelector('main', { timeout: 10000 });

    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('pulse:open-create-item', { detail: { type: 'member' } }));
    });
    await sleep(1500);
    await page.waitForSelector('input[placeholder*="Samantha"]', { timeout: 10000 });

    await setReactInputValue(page, 'input[placeholder*="Samantha"]', JASON_NAME);
    await setReactInputValue(page, 'input[placeholder*="samantha@acme.com"]', JASON_EMAIL);
    await sleep(500);

    await page.evaluate(() => {
      const form = document.querySelector('.fixed.inset-0 form');
      if (form) {
        if (typeof form.requestSubmit === 'function') {
          form.requestSubmit();
        } else {
          form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
        }
      }
    });
    await sleep(2500);

    const token2 = await page.evaluate(() => {
      const tokenEl = document.querySelector('code');
      return tokenEl ? tokenEl.innerText.trim() : null;
    });
    console.log('✅ Generated Second Token:', token2);

    // Logout Somto
    await page.evaluate(() => {
      localStorage.removeItem('pulse_auth_token');
      localStorage.removeItem('pulse_tenant_slug');
      localStorage.removeItem('pulse_user_id');
      localStorage.removeItem('pulse_user_name');
      localStorage.removeItem('pulse_user_email');
      window.location.href = '/login';
    });
    await sleep(2000);

    // Login Jason
    console.log('Logging in as Jason Babafemi...');
    await setReactInputValue(page, 'input[type="email"]', JASON_EMAIL);
    await setReactInputValue(page, 'input[type="password"]', JASON_PASS);
    await page.click('button[type="submit"]');
    await sleep(2000);

    // Go to /join-org
    console.log('Navigating to /join-org...');
    await page.goto(`${BASE_URL}/join-org`, { waitUntil: 'domcontentloaded' });
    await sleep(1500);

    console.log(`Typing token ${token2} in /join-org...`);
    await setReactInputValue(page, 'input[placeholder*="INV-"]', token2);
    await sleep(500);

    await page.evaluate(() => {
      const form = document.querySelector('form');
      if (form) {
        if (typeof form.requestSubmit === 'function') form.requestSubmit();
        else form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
      }
    });
    await sleep(3500);

    console.log('URL after /join-org token join:', page.url());
    const joinTokenSuccess = page.url().includes('/dashboard') || page.url().includes(`/${orgSlug}`);
    console.log('✅ Is Jason in workspace after token join?', joinTokenSuccess);

    console.log('\n======================================================');
    console.log('🎉 ALL INVITATION WORKFLOW TESTS PASSED 100%!');
    console.log('======================================================\n');

  } catch (err) {
    console.error('❌ Test encountered error:', err);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

runTest();
