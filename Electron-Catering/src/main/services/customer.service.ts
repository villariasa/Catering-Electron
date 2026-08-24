import type { CustomerRepository } from '../database/repositories/customer.repository';
import type { Customer } from '../../preload/types';

export class CustomerService {
  constructor(private customerRepo: CustomerRepository) {}

  async getAllCustomers(): Promise<Customer[]> {
    return this.customerRepo.getAll();
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
}
