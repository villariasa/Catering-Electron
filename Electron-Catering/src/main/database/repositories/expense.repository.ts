import type sqlite3 from 'sqlite3';
import type { Expense } from '../../../preload/types';
import { queryAll, queryRun } from '../connection';

export class ExpenseRepository {
  constructor(private db: sqlite3.Database) {}

  async getAll(): Promise<Expense[]> {
    return queryAll<Expense>(
      this.db,
      `SELECT exp_id as id, exp_category as category, exp_description as description,
              exp_amount as amount, exp_date as expense_date, exp_created_at as created_at
       FROM expenses
       ORDER BY exp_date DESC, exp_id DESC`
    );
  }

  async create(data: Omit<Expense, 'id'>): Promise<Expense> {
    const res = await queryRun(
      this.db,
      `INSERT INTO expenses (exp_category, exp_description, exp_amount, exp_date)
       VALUES (?, ?, ?, ?)`,
      [data.category, data.description, data.amount, data.expense_date]
    );

    return {
      id: res.lastID,
      ...data,
    };
  }
}
