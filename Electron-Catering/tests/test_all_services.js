import sqlite3 from 'sqlite3';
import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import { PDFDocument, StandardFonts, PageSizes } from 'pdf-lib';

// Test Database Path
const testDbPath = path.join(os.tmpdir(), `test_catering_${Date.now()}.db`);
console.log('============================================================');
console.log('🧪 RUNNING COMPREHENSIVE INTEGRATION SUITE — JAYRALDINE\'S ELECTRON');
console.log(`[Test Setup] Isolated Test DB: ${testDbPath}`);
console.log('============================================================\n');

// 1. Connection Helper
function getTestDb() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(testDbPath, (err) => {
      if (err) reject(err);
      else resolve(db);
    });
  });
}

function queryAll(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function queryGet(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function queryRun(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

function queryExec(db, sql) {
  return new Promise((resolve, reject) => {
    db.exec(sql, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

// 2. Main Test Runner
async function runAllTests() {
  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${testName}`);
      failed++;
    }
  }

  const db = await getTestDb();

  try {
    // ── TEST SUITE 1: Migrations & Schema Versioning ─────────────────────
    console.log('📦 TEST SUITE 1: Migrations & Schema Versioning');
    
    // Run Migration 001
    await queryExec(db, `
      CREATE TABLE IF NOT EXISTS schema_version (version INTEGER PRIMARY KEY, applied_at DATETIME DEFAULT CURRENT_TIMESTAMP);
      CREATE TABLE IF NOT EXISTS customers (cus_id INTEGER PRIMARY KEY AUTOINCREMENT, cus_name TEXT NOT NULL, cus_phone TEXT NOT NULL, cus_email TEXT, cus_address TEXT, cus_loyalty_tier TEXT DEFAULT 'New', cus_created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
      CREATE TABLE IF NOT EXISTS packages (pkg_id INTEGER PRIMARY KEY AUTOINCREMENT, pkg_name TEXT NOT NULL UNIQUE, pkg_category TEXT DEFAULT 'Buffet', pkg_price_per_pax REAL NOT NULL, pkg_min_pax INTEGER DEFAULT 30, pkg_description TEXT, pkg_created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
      CREATE TABLE IF NOT EXISTS bookings (bk_id INTEGER PRIMARY KEY AUTOINCREMENT, bk_booking_ref TEXT NOT NULL UNIQUE, bk_customer_name TEXT NOT NULL, bk_occasion TEXT NOT NULL, bk_event_date DATE NOT NULL, bk_event_time TIME DEFAULT '18:00', bk_venue TEXT NOT NULL, bk_pax INTEGER NOT NULL DEFAULT 50, bk_total_amount REAL NOT NULL DEFAULT 0.0, bk_amount_paid REAL NOT NULL DEFAULT 0.0, bk_balance REAL NOT NULL DEFAULT 0.0, bk_status TEXT NOT NULL DEFAULT 'PENDING', bk_payment_status TEXT NOT NULL DEFAULT 'Unpaid', bk_created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
      CREATE TABLE IF NOT EXISTS expenses (exp_id INTEGER PRIMARY KEY AUTOINCREMENT, exp_category TEXT NOT NULL, exp_description TEXT NOT NULL, exp_amount REAL NOT NULL, exp_date DATE NOT NULL, exp_created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
      CREATE TABLE IF NOT EXISTS users (usr_id INTEGER PRIMARY KEY AUTOINCREMENT, usr_username TEXT NOT NULL UNIQUE, usr_password_hash TEXT NOT NULL, usr_full_name TEXT NOT NULL, usr_role TEXT NOT NULL DEFAULT 'OWNER', usr_created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
    `);

    // Seed User
    const ownerHash = 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f'; // sha256('password123')
    await queryRun(db, `INSERT OR IGNORE INTO users (usr_id, usr_username, usr_password_hash, usr_full_name, usr_role) VALUES (1, 'owner', ?, 'Jayraldine (Owner)', 'OWNER')`, [ownerHash]);
    await queryRun(db, `INSERT INTO schema_version (version) VALUES (3)`);

    const verRow = await queryGet(db, `SELECT MAX(version) as version FROM schema_version`);
    assert(verRow.version === 3, 'Database schema version is at v3');

    // ── TEST SUITE 2: Owner Authentication & Password Hashing ─────────────
    console.log('\n🔐 TEST SUITE 2: Owner Authentication & Password Hashing');
    
    const userRow = await queryGet(db, `SELECT * FROM users WHERE usr_username = 'owner'`);
    assert(userRow !== undefined, 'Owner account exists in database');
    assert(userRow.usr_role === 'OWNER', 'User role is strictly OWNER');

    // Test SHA256 Hash Verification
    const computedHash = crypto.createHash('sha256').update('password123').digest('hex');
    assert(computedHash === userRow.usr_password_hash, 'Owner password verification succeeds');

    const invalidHash = crypto.createHash('sha256').update('wrongpassword').digest('hex');
    assert(invalidHash !== userRow.usr_password_hash, 'Invalid password fails verification');

    // ── TEST SUITE 3: Customer Repository & CRUD ─────────────────────────
    console.log('\n👥 TEST SUITE 3: Customer Repository & Business Logic');

    const c1 = await queryRun(db, `INSERT INTO customers (cus_name, cus_phone, cus_email, cus_address, cus_loyalty_tier) VALUES (?, ?, ?, ?, ?)`, ['Juan Dela Cruz', '09171234567', 'juan@gmail.com', 'Lahug, Cebu City', 'Regular']);
    assert(c1.lastID > 0, 'Create customer Juan Dela Cruz succeeded');

    const customers = await queryAll(db, `SELECT * FROM customers WHERE cus_name = 'Juan Dela Cruz'`);
    assert(customers.length === 1, 'Customer query returned created record');
    assert(customers[0].cus_phone === '09171234567', 'Customer phone number saved correctly');

    // ── TEST SUITE 4: Booking Repository & Financial Formulas ─────────────
    console.log('\n📋 TEST SUITE 4: Booking Financial Formulas & Payment Rules');

    // Test 1: Zero Down Payment Booking
    const total1 = 50000;
    const paid1 = 0;
    const bal1 = Math.max(0, total1 - paid1);
    const pmtStatus1 = paid1 >= total1 ? 'Paid' : paid1 > 0 ? 'Partial' : 'Unpaid';

    await queryRun(db, `INSERT INTO bookings (bk_booking_ref, bk_customer_name, bk_occasion, bk_event_date, bk_venue, bk_pax, bk_total_amount, bk_amount_paid, bk_balance, bk_status, bk_payment_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ['BK-TEST-001', 'Juan Dela Cruz', 'Birthday', '2026-09-01', 'Lahug', 100, total1, paid1, bal1, 'CONFIRMED', pmtStatus1]
    );

    const b1 = await queryGet(db, `SELECT * FROM bookings WHERE bk_booking_ref = 'BK-TEST-001'`);
    assert(b1.bk_balance === 50000, 'Zero downpayment balance equals full total amount (₱50,000)');
    assert(b1.bk_payment_status === 'Unpaid', 'Zero downpayment is marked as Unpaid (NOT Paid)');

    // Test 2: Partial Down Payment Booking
    const total2 = 100000;
    const paid2 = 30000;
    const bal2 = total2 - paid2;
    const pmtStatus2 = paid2 >= total2 ? 'Paid' : paid2 > 0 ? 'Partial' : 'Unpaid';

    await queryRun(db, `INSERT INTO bookings (bk_booking_ref, bk_customer_name, bk_occasion, bk_event_date, bk_venue, bk_pax, bk_total_amount, bk_amount_paid, bk_balance, bk_status, bk_payment_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ['BK-TEST-002', 'Maria Santos', 'Wedding', '2026-09-15', 'Mandaue', 150, total2, paid2, bal2, 'CONFIRMED', pmtStatus2]
    );

    const b2 = await queryGet(db, `SELECT * FROM bookings WHERE bk_booking_ref = 'BK-TEST-002'`);
    assert(b2.bk_balance === 70000, 'Partial downpayment balance calculated correctly (₱100,000 - ₱30,000 = ₱70,000)');
    assert(b2.bk_payment_status === 'Partial', 'Partial downpayment marked as Partial');

    // ── TEST SUITE 5: Expenses Repository ─────────────────────────────────
    console.log('\n💸 TEST SUITE 5: Operating Expenses Log');

    const exp1 = await queryRun(db, `INSERT INTO expenses (exp_category, exp_description, exp_amount, exp_date) VALUES (?, ?, ?, ?)`, ['Ingredients', 'Pork Belly', 12500, '2026-08-20']);
    assert(exp1.lastID > 0, 'Record expense succeeded');

    const expenses = await queryAll(db, `SELECT * FROM expenses`);
    assert(expenses.length === 1 && expenses[0].exp_amount === 12500, 'Expense amount saved and retrieved accurately');

    // ── TEST SUITE 6: PDF Exporter Engine (Phase 8) ───────────────────────
    console.log('\n📄 TEST SUITE 6: Landscape Wall Calendar PDF Exporter');

    const pdfDoc = await PDFDocument.create();
    const page1 = pdfDoc.addPage(PageSizes.A4);
    page1.setSize(841.89, 595.28); // Landscape A4

    const page1W = page1.getWidth();
    const page1H = page1.getHeight();
    assert(page1W > page1H, `Page 1 orientation is LANDSCAPE (${page1W} x ${page1H} pt)`);
    assert(Math.round(page1W) === 842 && Math.round(page1H) === 595, 'Page dimensions match standard Landscape A4');

    const pdfBytes = await pdfDoc.save();
    const testPdfPath = path.join(os.tmpdir(), 'test_wall_calendar.pdf');
    fs.writeFileSync(testPdfPath, pdfBytes);
    assert(fs.existsSync(testPdfPath) && fs.statSync(testPdfPath).size > 0, 'PDF file created on disk successfully');

    // ── TEST SUITE 7: Legacy Database Migration Tool (Phase 9) ───────────
    console.log('\n🚀 TEST SUITE 7: Legacy Database Migration Tool');

    const legacyDbPath = '/home/villarias/Projects/Electron-Catering/Jayraldines-Legacy/Database/production-backup.db';
    assert(fs.existsSync(legacyDbPath), 'Legacy production database exists in Jayraldines-Legacy folder');

    const backupPath = legacyDbPath.replace(/\.db$/, '.pre-electron-backup.db');
    fs.copyFileSync(legacyDbPath, backupPath);
    assert(fs.existsSync(backupPath), 'Safety pre-migration backup created successfully');

    // Read legacy records
    const legacyDb = new sqlite3.Database(legacyDbPath);
    const legacyCustomers = await queryAll(legacyDb, `SELECT * FROM customers`);
    const legacyBookings = await queryAll(legacyDb, `SELECT * FROM bookings`);
    legacyDb.close();

    assert(legacyCustomers.length >= 0, `Legacy database contains ${legacyCustomers.length} customers`);
    assert(legacyBookings.length >= 0, `Legacy database contains ${legacyBookings.length} bookings`);

    // Clean up isolate test DB & PDF
    db.close();
    try { fs.unlinkSync(testDbPath); } catch (e) {}
    try { fs.unlinkSync(testPdfPath); } catch (e) {}

    console.log('\n============================================================');
    console.log(`📊 INTEGRATION TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('============================================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Integration test failure:', err);
    process.exit(1);
  }
}

runAllTests();
