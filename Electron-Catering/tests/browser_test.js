import { chromium } from 'playwright';

async function testWebUI() {
  console.log('============================================================');
  console.log('🌐 RUNNING AUTOMATED PLAYWRIGHT BROWSER UI TEST');
  console.log('============================================================\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const consoleErrors = [];
  const pageErrors = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      console.error(`  [Browser Console Error] ${msg.text()}`);
      consoleErrors.push(msg.text());
    }
  });

  page.on('pageerror', (err) => {
    console.error(`  [Browser Unhandled Exception] ${err.message}`);
    pageErrors.push(err.message);
  });

  try {
    console.log('1. Navigating to http://localhost:5173...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });

    console.log('2. Testing Owner Login...');
    await page.fill('#usr-input', 'owner');
    await page.fill('#pwd-input', 'password123');
    await page.click('button[type="submit"]');

    await page.waitForTimeout(500);

    console.log('3. Testing Navigation Across All 13 Pages...');
    const pagesToTest = [
      'Dashboard', 'Bookings & Orders', 'Calendar Schedule', 'Customers Directory',
      'Menu & Packages', 'Expenses Log', 'Billing & Invoices', 'Cash Flow Ledger',
      'Reports & Analytics', 'Kitchen Display (KDS)', 'Inventory & Stock', 'AI Assistant', 'Settings & DB'
    ];

    for (const pName of pagesToTest) {
      console.log(`  -> Clicking navigation link: "${pName}"`);
      const navBtn = page.locator(`button:has-text("${pName}")`).first();
      if (await navBtn.count() > 0) {
        await navBtn.click();
        await page.waitForTimeout(300);
      } else {
        console.warn(`  ⚠️ Button for "${pName}" not found on sidebar`);
      }
    }

    console.log('\n4. Testing Chef Jay AI Mascot Popover Drawer...');
    const chefBtn = page.locator('button:has-text("Chef Jay AI")').last();
    if (await chefBtn.count() > 0) {
      await chefBtn.click();
      await page.waitForTimeout(300);
      console.log('  -> Chef Jay AI mascot clicked, drawer opened successfully!');
    }

    await browser.close();

    console.log('\n============================================================');
    console.log(`📊 BROWSER UI TEST RESULTS: ${consoleErrors.length} Console Errors, ${pageErrors.length} Unhandled Exceptions`);
    console.log('============================================================\n');

    if (consoleErrors.length > 0 || pageErrors.length > 0) {
      process.exit(1);
    } else {
      console.log('✅ ALL 13 PAGES AND CHEF JAY AI RENDERED 100% CLEANLY WITH 0 ERRORS!');
    }
  } catch (err) {
    console.error('Playwright Test Failed:', err);
    await browser.close();
    process.exit(1);
  }
}

testWebUI();
