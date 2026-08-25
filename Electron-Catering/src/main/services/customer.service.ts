import type { CustomerRepository } from '../database/repositories/customer.repository';
import type { Customer, FollowUp } from '../../preload/types';

export class CustomerService {
  constructor(private customerRepo: CustomerRepository) {}

  async getAllCustomers(): Promise<Customer[]> {
    // Recomputes loyalty tier from actual CONFIRMED/COMPLETED booking count each load,
    // matching the Python system's sp_recalculate_loyalty behavior.
    return this.customerRepo.getAllWithStats();
  }

  async createCustomer(data: Omit<Customer, 'id'>): Promise<Customer> {
    if (!data.name || data.name.trim().length === 0) {
      throw new Error('Customer name is required');
    }
    if (!data.contact_number || data.contact_number.trim().length === 0) {
      throw new Error('Customer phone number is required');
    }
    return this.customerRepo.create(data);
  }

  async deleteCustomer(id: number): Promise<boolean> {
    return this.customerRepo.delete(id);
  }

  async getFollowUps(customerId: number): Promise<FollowUp[]> {
    return this.customerRepo.getFollowUps(customerId);
  }

  async addFollowUp(customerId: number, followUpDate: string, note?: string): Promise<FollowUp> {
    if (!followUpDate) {
      throw new Error('Follow-up date is required');
    }
    return this.customerRepo.addFollowUp(customerId, followUpDate, note);
  }

  async toggleFollowUp(id: number): Promise<boolean> {
    return this.customerRepo.toggleFollowUp(id);
  }

  async deleteFollowUp(id: number): Promise<boolean> {
    return this.customerRepo.deleteFollowUp(id);
  }

  async getDueTodayFollowUps() {
    return this.customerRepo.getDueTodayFollowUps();
  }
}
