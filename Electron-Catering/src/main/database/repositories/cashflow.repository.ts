import type sqlite3 from 'sqlite3';
import type { CashFlowEntry, CashFlowSummary } from '../../../preload/types';
import { queryAll, queryRun } from '../connection';

export class CashFlowRepository {
  constructor(private db: sqlite3.Database) {}

  async getAll(): Promise<CashFlowEntry[]> {
    return queryAll<CashFlowEntry>(
      this.db,
      `SELECT cft_id as id, cft_date as date, cft_ref_no as ref_no, cft_particulars as particulars,
              cft_deposit as deposit, cft_withdrawal as withdrawal, cft_running_balance as running_balance,
              cft_notes as notes, cft_created_at as created_at
       FROM cash_flow_transactions
       ORDER BY cft_date ASC, cft_id ASC`
    );
  }

  async create(data: { date: string; ref_no?: string; particulars: string; deposit: number; withdrawal: number; notes?: string }): Promise<void> {
    await queryRun(
      this.db,
      `INSERT INTO cash_flow_transactions (cft_date, cft_ref_no, cft_particulars, cft_deposit, cft_withdrawal, cft_notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [data.date, data.ref_no || null, data.particulars, data.deposit, data.withdrawal, data.notes || null]
    );
    await this.recalculateBalances();
  }

  async delete(id: number): Promise<boolean> {
    const res = await queryRun(this.db, 'DELETE FROM cash_flow_transactions WHERE cft_id = ?', [id]);
    await this.recalculateBalances();
    return res.changes > 0;
  }

  /** Full chronological recompute of running balance, matching the Python system's recalculate_cash_flow_balances(). */
  private async recalculateBalances(): Promise<void> {
    const rows = await queryAll<{ cft_id: number; cft_deposit: number; cft_withdrawal: number }>(
      this.db,
      `SELECT cft_id, cft_deposit, cft_withdrawal FROM cash_flow_transactions ORDER BY cft_date ASC, cft_id ASC`
    );

    let running = 0;
    for (const row of rows) {
      running += row.cft_deposit - row.cft_withdrawal;
      await queryRun(this.db, 'UPDATE cash_flow_transactions SET cft_running_balance = ? WHERE cft_id = ?', [running, row.cft_id]);
    }
  }

  async getSummary(): Promise<CashFlowSummary> {
    const rows = await queryAll<{ cft_deposit: number; cft_withdrawal: number }>(
      this.db,
      'SELECT cft_deposit, cft_withdrawal FROM cash_flow_transactions'
    );
    const totalDeposits = rows.reduce((s, r) => s + r.cft_deposit, 0);
    const totalWithdrawals = rows.reduce((s, r) => s + r.cft_withdrawal, 0);
    return {
      total_deposits: totalDeposits,
      total_withdrawals: totalWithdrawals,
      current_balance: totalDeposits - totalWithdrawals,
    };
  }
}
