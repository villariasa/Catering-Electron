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
    { version: 4, name: '004_core_schema_expansion.sql', sql: getMigration004Sql() },
    { version: 5, name: '005_cash_flow_ledger.sql', sql: getMigration005Sql() },
    { version: 6, name: '006_audit_notifications_targets_smtp.sql', sql: getMigration006Sql() },
    { version: 7, name: '007_booking_package_addons.sql', sql: getMigration007Sql() },
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

function getMigration004Sql(): string {
  return `
    ALTER TABLE bookings ADD COLUMN bk_customer_id INTEGER REFERENCES customers(cus_id);

    CREATE TABLE IF NOT EXISTS invoices (
        inv_id INTEGER PRIMARY KEY AUTOINCREMENT,
        inv_invoice_ref TEXT NOT NULL UNIQUE,
        inv_booking_id INTEGER NOT NULL REFERENCES bookings(bk_id) ON DELETE CASCADE,
        inv_total_amount REAL NOT NULL DEFAULT 0,
        inv_amount_paid REAL NOT NULL DEFAULT 0,
        inv_balance REAL NOT NULL DEFAULT 0,
        inv_status TEXT NOT NULL DEFAULT 'Unpaid',
        inv_due_date DATE,
        inv_notes TEXT,
        inv_created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        inv_updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS payment_records (
        pr_id INTEGER PRIMARY KEY AUTOINCREMENT,
        pr_invoice_id INTEGER NOT NULL REFERENCES invoices(inv_id) ON DELETE CASCADE,
        pr_amount REAL NOT NULL DEFAULT 0,
        pr_payment_date DATE NOT NULL DEFAULT (date('now')),
        pr_method TEXT NOT NULL DEFAULT 'Cash',
        pr_reference_no TEXT,
        pr_notes TEXT,
        pr_created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS menu_items (
        mi_id INTEGER PRIMARY KEY AUTOINCREMENT,
        mi_name TEXT NOT NULL,
        mi_description TEXT,
        mi_category TEXT NOT NULL DEFAULT 'Uncategorized',
        mi_price REAL NOT NULL DEFAULT 0,
        mi_package_tier TEXT,
        mi_is_active INTEGER NOT NULL DEFAULT 1,
        mi_created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        mi_updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS package_items (
        pi_id INTEGER PRIMARY KEY AUTOINCREMENT,
        pi_package_id INTEGER NOT NULL REFERENCES packages(pkg_id) ON DELETE CASCADE,
        pi_item_id INTEGER NOT NULL REFERENCES menu_items(mi_id) ON DELETE CASCADE,
        UNIQUE(pi_package_id, pi_item_id)
    );

    CREATE TABLE IF NOT EXISTS kitchen_orders (
        ko_id INTEGER PRIMARY KEY AUTOINCREMENT,
        ko_order_ref TEXT NOT NULL UNIQUE,
        ko_booking_id INTEGER REFERENCES bookings(bk_id) ON DELETE SET NULL,
        ko_client_name TEXT NOT NULL DEFAULT '',
        ko_event_name TEXT NOT NULL DEFAULT '',
        ko_pax INTEGER NOT NULL DEFAULT 1,
        ko_items_desc TEXT,
        ko_status TEXT NOT NULL DEFAULT 'Pending',
        ko_created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        ko_updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS kitchen_tasks (
        kt_id INTEGER PRIMARY KEY AUTOINCREMENT,
        kt_order_id INTEGER NOT NULL REFERENCES kitchen_orders(ko_id) ON DELETE CASCADE,
        kt_task_label TEXT NOT NULL,
        kt_is_done INTEGER NOT NULL DEFAULT 0,
        kt_sort_order INTEGER NOT NULL DEFAULT 0,
        kt_updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS business_info (
        bi_id INTEGER PRIMARY KEY AUTOINCREMENT,
        bi_name TEXT NOT NULL DEFAULT '',
        bi_address TEXT NOT NULL DEFAULT '',
        bi_contact TEXT NOT NULL DEFAULT '',
        bi_email TEXT NOT NULL DEFAULT '',
        bi_logo_path TEXT NOT NULL DEFAULT '',
        bi_min_downpayment_pct REAL NOT NULL DEFAULT 20,
        bi_allow_zero_downpayment INTEGER NOT NULL DEFAULT 1,
        bi_max_daily_pax INTEGER NOT NULL DEFAULT 600,
        bi_updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    INSERT OR IGNORE INTO business_info (bi_id, bi_name, bi_address, bi_contact) VALUES
    (1, 'Jayraldine''s Catering', 'Cebu City, Philippines', '');

    CREATE TABLE IF NOT EXISTS occasions (
        occ_id INTEGER PRIMARY KEY AUTOINCREMENT,
        occ_name TEXT NOT NULL UNIQUE,
        occ_created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    INSERT OR IGNORE INTO occasions (occ_name) VALUES
    ('Birthday'), ('Wedding'), ('Debut'), ('Anniversary'), ('Baptism'),
    ('Graduation'), ('Corporate Event'), ('Christmas Party'), ('New Year Celebration'),
    ('Reunion'), ('Seminar/Conference'), ('Other');

    CREATE TABLE IF NOT EXISTS customer_follow_ups (
        cfu_id INTEGER PRIMARY KEY AUTOINCREMENT,
        cfu_customer_id INTEGER NOT NULL REFERENCES customers(cus_id) ON DELETE CASCADE,
        cfu_follow_up_date DATE NOT NULL,
        cfu_note TEXT,
        cfu_is_done INTEGER NOT NULL DEFAULT 0,
        cfu_created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        cfu_updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS calendar_events (
        ce_id INTEGER PRIMARY KEY AUTOINCREMENT,
        ce_event_date DATE NOT NULL,
        ce_name TEXT NOT NULL,
        ce_pax INTEGER,
        ce_event_time TIME,
        ce_location TEXT,
        ce_created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_invoices_booking ON invoices(inv_booking_id);
    CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(inv_status);
    CREATE INDEX IF NOT EXISTS idx_payment_records_invoice ON payment_records(pr_invoice_id);
    CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(mi_category);
    CREATE INDEX IF NOT EXISTS idx_package_items_package ON package_items(pi_package_id);
    CREATE INDEX IF NOT EXISTS idx_package_items_item ON package_items(pi_item_id);
    CREATE INDEX IF NOT EXISTS idx_kitchen_orders_booking ON kitchen_orders(ko_booking_id);
    CREATE INDEX IF NOT EXISTS idx_kitchen_orders_status ON kitchen_orders(ko_status);
    CREATE INDEX IF NOT EXISTS idx_kitchen_tasks_order ON kitchen_tasks(kt_order_id);
    CREATE INDEX IF NOT EXISTS idx_follow_ups_customer ON customer_follow_ups(cfu_customer_id);
    CREATE INDEX IF NOT EXISTS idx_follow_ups_date ON customer_follow_ups(cfu_follow_up_date);
    CREATE INDEX IF NOT EXISTS idx_calendar_events_date ON calendar_events(ce_event_date);
  `;
}

function getMigration005Sql(): string {
  return `
    CREATE TABLE IF NOT EXISTS cash_flow_transactions (
        cft_id INTEGER PRIMARY KEY AUTOINCREMENT,
        cft_date DATE NOT NULL,
        cft_ref_no TEXT,
        cft_particulars TEXT NOT NULL,
        cft_deposit REAL NOT NULL DEFAULT 0,
        cft_withdrawal REAL NOT NULL DEFAULT 0,
        cft_running_balance REAL NOT NULL DEFAULT 0,
        cft_notes TEXT,
        cft_created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_cash_flow_date ON cash_flow_transactions(cft_date);
  `;
}

function getMigration006Sql(): string {
  return `
    ALTER TABLE business_info ADD COLUMN bi_smtp_host TEXT NOT NULL DEFAULT '';
    ALTER TABLE business_info ADD COLUMN bi_smtp_port INTEGER NOT NULL DEFAULT 587;
    ALTER TABLE business_info ADD COLUMN bi_smtp_user TEXT NOT NULL DEFAULT '';
    ALTER TABLE business_info ADD COLUMN bi_smtp_pass TEXT NOT NULL DEFAULT '';

    CREATE TABLE IF NOT EXISTS audit_logs (
        al_id INTEGER PRIMARY KEY AUTOINCREMENT,
        al_actor TEXT NOT NULL DEFAULT 'owner',
        al_action TEXT NOT NULL,
        al_table_name TEXT NOT NULL,
        al_record_id INTEGER,
        al_details TEXT,
        al_created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(al_created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_table ON audit_logs(al_table_name);

    CREATE TABLE IF NOT EXISTS notifications (
        notif_id INTEGER PRIMARY KEY AUTOINCREMENT,
        notif_type TEXT NOT NULL DEFAULT 'system',
        notif_title TEXT NOT NULL DEFAULT '',
        notif_message TEXT NOT NULL DEFAULT '',
        notif_color TEXT NOT NULL DEFAULT '#3B82F6',
        notif_is_read INTEGER NOT NULL DEFAULT 0,
        notif_created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(notif_is_read);
    CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(notif_created_at DESC);

    CREATE TABLE IF NOT EXISTS monthly_sales_targets (
        mst_id INTEGER PRIMARY KEY AUTOINCREMENT,
        mst_year INTEGER NOT NULL,
        mst_month INTEGER NOT NULL,
        mst_target_amount REAL NOT NULL DEFAULT 0,
        UNIQUE(mst_year, mst_month)
    );
  `;
}

function getMigration007Sql(): string {
  return `
    ALTER TABLE bookings ADD COLUMN bk_package_id INTEGER REFERENCES packages(pkg_id);
    ALTER TABLE bookings ADD COLUMN bk_addons TEXT;
    ALTER TABLE bookings ADD COLUMN bk_special_notes TEXT;
  `;
}

