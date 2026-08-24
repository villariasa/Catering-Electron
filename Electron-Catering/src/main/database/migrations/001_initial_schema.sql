-- Migration 001: Initial Schema for Jayraldine's Catering System
CREATE TABLE IF NOT EXISTS schema_version (
    version INTEGER PRIMARY KEY,
    applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

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
