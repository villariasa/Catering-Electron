-- Migration 003: Add Users Table for Owner Authentication
CREATE TABLE IF NOT EXISTS users (
    usr_id INTEGER PRIMARY KEY AUTOINCREMENT,
    usr_username TEXT NOT NULL UNIQUE,
    usr_password_hash TEXT NOT NULL,
    usr_full_name TEXT NOT NULL,
    usr_role TEXT NOT NULL DEFAULT 'OWNER',
    usr_created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Seed default Owner account: username = 'owner', password = 'password123'
-- Hash is SHA-256 of 'password123' -> ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f
INSERT OR IGNORE INTO users (usr_id, usr_username, usr_password_hash, usr_full_name, usr_role) VALUES
(1, 'owner', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'Jayraldine (Owner)', 'OWNER');
