import type sqlite3 from 'sqlite3';
import { queryExec, queryGet, queryRun } from './connection';

export async function runMigrations(db: sqlite3.Database): Promise<number> {
  console.log('[Migration] Checking database schema version...');

  await queryExec(db, `
    CREATE TABLE IF NOT EXISTS schema_version (
      version INTEGER PRIMARY KEY,
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const row = await queryGet<{ current_version: number | null }>(
    db,
    'SELECT MAX(version) as current_version FROM schema_version'
  );
  const currentVersion = row?.current_version || 0;
  console.log(`[Migration] Current database schema version: v${currentVersion}`);

  const migrationFiles = [
    { version: 1, name: '001_initial_schema.sql', sql: getMigration001Sql() },
    { version: 2, name: '002_sample_data.sql', sql: getMigration002Sql() },
    { version: 3, name: '003_add_users.sql', sql: getMigration003Sql() },
  ];

  let appliedCount = 0;
  for (const m of migrationFiles) {
    if (m.version > currentVersion) {
      console.log(`[Migration] Applying migration v${m.version}: ${m.name}`);
      await queryExec(db, m.sql);
      await queryRun(db, 'INSERT INTO schema_version (version) VALUES (?)', [m.version]);
      appliedCount++;
    }
  }

  const newVersionRow = await queryGet<{ version: number }>(
    db,
    'SELECT MAX(version) as version FROM schema_version'
  );
  const newVersion = newVersionRow?.version || 0;
  console.log(`[Migration] Schema migrations up to date at v${newVersion} (${appliedCount} new migrations applied)`);

  return newVersion;
}

function getMigration001Sql(): string {
  return `
    CREATE TABLE IF NOT EXISTS customers (
        cus_id INTEGER PRIMARY KEY AUTOINCREMENT,
        cus_name TEXT NOT NULL,
        cus_phone TEXT NOT NULL,
        cus_email TEXT,
        cus_address TEXT,
        cus_loyalty_tier TEXT DEFAULT 'New',
        cus_created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS packages (
        pkg_id INTEGER PRIMARY KEY AUTOINCREMENT,
        pkg_name TEXT NOT NULL UNIQUE,
        pkg_category TEXT DEFAULT 'Buffet',
        pkg_price_per_pax REAL NOT NULL,
        pkg_min_pax INTEGER DEFAULT 30,
        pkg_description TEXT,
        pkg_created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS bookings (
        bk_id INTEGER PRIMARY KEY AUTOINCREMENT,
        bk_booking_ref TEXT NOT NULL UNIQUE,
        bk_customer_name TEXT NOT NULL,
        bk_occasion TEXT NOT NULL,
        bk_event_date DATE NOT NULL,
        bk_event_time TIME DEFAULT '18:00',
        bk_venue TEXT NOT NULL,
        bk_pax INTEGER NOT NULL DEFAULT 50,
        bk_total_amount REAL NOT NULL DEFAULT 0.0,
        bk_amount_paid REAL NOT NULL DEFAULT 0.0,
        bk_balance REAL NOT NULL DEFAULT 0.0,
        bk_status TEXT NOT NULL DEFAULT 'PENDING',
        bk_payment_status TEXT NOT NULL DEFAULT 'Unpaid',
        bk_created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS expenses (
        exp_id INTEGER PRIMARY KEY AUTOINCREMENT,
        exp_category TEXT NOT NULL,
        exp_description TEXT NOT NULL,
        exp_amount REAL NOT NULL,
        exp_date DATE NOT NULL,
        exp_created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(bk_event_date);
    CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(bk_status);
    CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(cus_name);
  `;
}

function getMigration002Sql(): string {
  return `
    INSERT OR IGNORE INTO packages (pkg_id, pkg_name, pkg_category, pkg_price_per_pax, pkg_min_pax, pkg_description) VALUES
    (1, 'Standard Fiesta Buffet', 'Buffet', 450.00, 30, 'Pork Hamonado, Bam-I, Lechon Kawali, Rice, Iced Tea & Salad'),
    (2, 'Executive Grand Buffet', 'Buffet', 650.00, 50, 'Lechon Belly, Beef Caldereta, Fish Fillet, Baked Mac, Dessert Bar'),
    (3, 'VIP Wedding Gala Package', 'VIP', 950.00, 100, 'Full Premium Menu with Roast Beef, Seafood Medley & Grazing Table');

    INSERT OR IGNORE INTO customers (cus_id, cus_name, cus_phone, cus_email, cus_address, cus_loyalty_tier) VALUES
    (1, 'Juan Dela Cruz', '09171234567', 'juan@gmail.com', 'Lahug, Cebu City', 'Regular'),
    (2, 'Maria Santos', '09189876543', 'maria@yahoo.com', 'Banilad, Mandaue City', 'VIP'),
    (3, 'Carlos Reyes', '09223334444', 'carlos@outlook.com', 'Tisa, Cebu City', 'New');

    INSERT OR IGNORE INTO bookings (bk_id, bk_booking_ref, bk_customer_name, bk_occasion, bk_event_date, bk_event_time, bk_venue, bk_pax, bk_total_amount, bk_amount_paid, bk_balance, bk_status, bk_payment_status) VALUES
    (1, 'BK-2026-0001', 'Juan Dela Cruz', 'Birthday Party', '2026-08-28', '17:00', 'Marco Polo Ballroom, Nivel Hills', 100, 45000.00, 15000.00, 30000.00, 'CONFIRMED', 'Partial'),
    (2, 'BK-2026-0002', 'Maria Santos', 'Wedding Reception', '2026-09-12', '18:30', 'Waterfront Hotel Grand Ballroom', 200, 130000.00, 130000.00, 0.00, 'CONFIRMED', 'Paid'),
    (3, 'BK-2026-0003', 'Carlos Reyes', 'Corporate Anniversary', '2026-09-25', '12:00', 'Cebu Trade Hall', 150, 67500.00, 0.00, 67500.00, 'PENDING', 'Unpaid');

    INSERT OR IGNORE INTO expenses (exp_id, exp_category, exp_description, exp_amount, exp_date) VALUES
    (1, 'Ingredients', 'Fresh Pork Belly & Chicken (Carbon Market)', 12500.00, '2026-08-20'),
    (2, 'Labor/Wages', 'Kitchen Assistant & Catering Waiters Payroll', 6400.00, '2026-08-22'),
    (3, 'Utilities', 'LPG Gas Tanks & Fuel Delivery', 3200.00, '2026-08-23');
  `;
}

function getMigration003Sql(): string {
  return `
    CREATE TABLE IF NOT EXISTS users (
        usr_id INTEGER PRIMARY KEY AUTOINCREMENT,
        usr_username TEXT NOT NULL UNIQUE,
        usr_password_hash TEXT NOT NULL,
        usr_full_name TEXT NOT NULL,
        usr_role TEXT NOT NULL DEFAULT 'OWNER',
        usr_created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    INSERT OR IGNORE INTO users (usr_id, usr_username, usr_password_hash, usr_full_name, usr_role) VALUES
    (1, 'owner', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'Jayraldine (Owner)', 'OWNER');
  `;
}

