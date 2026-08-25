-- Migration 004: Core Schema Expansion (ported from the Python/Postgres system)
-- Adds the tables needed to make Billing/Payments (and future Kitchen, Settings,
-- Packages, Customers follow-up, Calendar work) real and persisted, instead of
-- being derived/mutated only in renderer memory.

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
