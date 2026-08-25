-- Migration 006: Audit Log, Notifications, Monthly Sales Targets, SMTP config
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
