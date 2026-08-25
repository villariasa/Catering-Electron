import type { CashFlowRepository } from '../database/repositories/cashflow.repository';
import type { CashFlowEntry, CashFlowSummary } from '../../preload/types';

export class CashFlowService {
  constructor(private cashFlowRepo: CashFlowRepository) {}

  async getAll(): Promise<CashFlowEntry[]> {
    return this.cashFlowRepo.getAll();
  }

  async getSummary(): Promise<CashFlowSummary> {
    return this.cashFlowRepo.getSummary();
  }

  async create(data: { date: string; ref_no?: string; particulars: string; deposit: number; withdrawal: number; notes?: string }): Promise<CashFlowEntry[]> {
    if (!data.particulars || !data.particulars.trim()) {
      throw new Error('Particulars/description is required');
    }
    const deposit = Number(data.deposit || 0);
    const withdrawal = Number(data.withdrawal || 0);
    if (deposit <= 0 && withdrawal <= 0) {
      throw new Error('Enter a positive deposit or withdrawal amount');
    }

    await this.cashFlowRepo.create({ ...data, deposit, withdrawal });
    return this.cashFlowRepo.getAll();
  }

  async delete(id: number): Promise<CashFlowEntry[]> {
    await this.cashFlowRepo.delete(id);
    return this.cashFlowRepo.getAll();
  }
}
