import type { ExpenseRepository } from '../database/repositories/expense.repository';
import type { Expense } from '../../preload/types';

export class ExpenseService {
  constructor(private expenseRepo: ExpenseRepository) {}

  async getAllExpenses(): Promise<Expense[]> {
    return this.expenseRepo.getAll();
  }

  async createExpense(data: Omit<Expense, 'id'>): Promise<Expense> {
    if (!data.description || data.description.trim().length === 0) {
      throw new Error('Expense description is required');
    }
    if (data.amount <= 0) {
      throw new Error('Expense amount must be greater than 0');
    }
    return this.expenseRepo.create(data);
  }
}
