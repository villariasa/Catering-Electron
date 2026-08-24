import sqlite3 from 'sqlite3';
import fs from 'fs';
import path from 'path';
import type Database from 'better-sqlite3';
import { queryAll, queryRun } from '../database/connection';

export interface MigrationSummary {
  success: boolean;
  backup_created_path: string;
  customers_count: number;
  bookings_count: number;
  packages_count: number;
  expenses_count: number;
  error?: string;
}

export class MigrationToolService {
  constructor(private targetDb: sqlite3.Database) {}

  /**
   * Safely migrates data from legacy Python SQLite database into the new Electron database.
   */
  async migrateFromLegacyDb(legacyDbPath: string): Promise<MigrationSummary> {
    console.log(`[MigrationTool] Starting legacy migration from: ${legacyDbPath}`);

    if (!fs.existsSync(legacyDbPath)) {
      throw new Error(`Legacy database file not found at: ${legacyDbPath}`);
    }

    // 1. Create Pre-Migration Safety Backup of legacy DB
    const backupPath = legacyDbPath.replace(/\.db$/, '.pre-electron-backup.db');
    fs.copyFileSync(legacyDbPath, backupPath);
    console.log(`[MigrationTool] Safety backup created at: ${backupPath}`);

    // 2. Open Legacy Database in Read-Only mode
    const legacyDb = await new Promise<sqlite3.Database>((resolve, reject) => {
      const db = new sqlite3.Database(legacyDbPath, sqlite3.OPEN_READONLY, (err) => {
        if (err) reject(err);
        else resolve(db);
      });
    });

    try {
      // 3. Read & Transform Customers
      const legacyCustomers = await queryAll<any>(legacyDb, `
        SELECT cus_name, cus_phone, cus_email, cus_address, cus_loyalty_tier
        FROM customers
      `);

      let customerCount = 0;
      for (const c of legacyCustomers) {
        await queryRun(
          this.targetDb,
          `INSERT INTO customers (cus_name, cus_phone, cus_email, cus_address, cus_loyalty_tier)
           VALUES (?, ?, ?, ?, ?)`,
          [c.cus_name, c.cus_phone || '09000000000', c.cus_email || null, c.cus_address || null, c.cus_loyalty_tier || 'New']
        );
        customerCount++;
      }

      // 4. Read & Transform Packages
      const legacyPackages = await queryAll<any>(legacyDb, `
        SELECT pkg_name, pkg_category, pkg_price_per_pax, pkg_min_pax, pkg_description
        FROM packages
      `);

      let packageCount = 0;
      for (const p of legacyPackages) {
        await queryRun(
          this.targetDb,
          `INSERT OR IGNORE INTO packages (pkg_name, pkg_category, pkg_price_per_pax, pkg_min_pax, pkg_description)
           VALUES (?, ?, ?, ?, ?)`,
          [p.pkg_name, p.pkg_category || 'Buffet', p.pkg_price_per_pax, p.pkg_min_pax || 30, p.pkg_description || null]
        );
        packageCount++;
      }

      // 5. Read & Transform Bookings
      const legacyBookings = await queryAll<any>(legacyDb, `
        SELECT bk_booking_ref, bk_customer_name, bk_occasion, bk_event_date, bk_event_time,
               bk_venue, bk_pax, bk_total_amount, bk_amount_paid, bk_balance, bk_status, bk_payment_status
        FROM bookings
      `);

      let bookingCount = 0;
      for (const b of legacyBookings) {
        await queryRun(
          this.targetDb,
          `INSERT OR IGNORE INTO bookings 
           (bk_booking_ref, bk_customer_name, bk_occasion, bk_event_date, bk_event_time, bk_venue, bk_pax, bk_total_amount, bk_amount_paid, bk_balance, bk_status, bk_payment_status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            b.bk_booking_ref,
            b.bk_customer_name,
            b.bk_occasion || 'Catering Event',
            b.bk_event_date,
            b.bk_event_time || '18:00',
            b.bk_venue || 'Venue',
            b.bk_pax || 50,
            b.bk_total_amount || 0.0,
            b.bk_amount_paid || 0.0,
            b.bk_balance || 0.0,
            b.bk_status || 'CONFIRMED',
            b.bk_payment_status || 'Unpaid',
          ]
        );
        bookingCount++;
      }

      // 6. Read & Transform Expenses
      const legacyExpenses = await queryAll<any>(legacyDb, `
        SELECT exp_category, exp_description, exp_amount, exp_date
        FROM expenses
      `);

      let expenseCount = 0;
      for (const e of legacyExpenses) {
        await queryRun(
          this.targetDb,
          `INSERT INTO expenses (exp_category, exp_description, exp_amount, exp_date)
           VALUES (?, ?, ?, ?)`,
          [e.exp_category || 'General', e.exp_description || 'Expense', e.exp_amount, e.exp_date]
        );
        expenseCount++;
      }

      legacyDb.close();

      console.log(`[MigrationTool] Migration completed successfully. Customers: ${customerCount}, Bookings: ${bookingCount}, Packages: ${packageCount}, Expenses: ${expenseCount}`);

      return {
        success: true,
        backup_created_path: backupPath,
        customers_count: customerCount,
        bookings_count: bookingCount,
        packages_count: packageCount,
        expenses_count: expenseCount,
      };
    } catch (err: any) {
      console.error('[MigrationTool] Migration error:', err);
      legacyDb.close();
      return {
        success: false,
        backup_created_path: backupPath,
        customers_count: 0,
        bookings_count: 0,
        packages_count: 0,
        expenses_count: 0,
        error: err.message,
      };
    }
  }
}
