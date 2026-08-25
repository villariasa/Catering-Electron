-- Migration 005: Cash Flow Ledger (passbook-style, ported from the Python system)
-- This is a standalone manual reconciliation ledger, distinct from bookings/expenses --
-- staff record deposits/withdrawals here directly, same as the Python cash_flow_transactions table.

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
