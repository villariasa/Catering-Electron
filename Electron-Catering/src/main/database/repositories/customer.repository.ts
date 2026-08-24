import type sqlite3 from 'sqlite3';
import type { Customer } from '../../../preload/types';
import { queryAll, queryRun } from '../connection';

export class CustomerRepository {
  constructor(private db: sqlite3.Database) {}

  async getAll(): Promise<Customer[]> {
    return queryAll<Customer>(
      this.db,
      `SELECT cus_id as id, cus_name as name, cus_phone as contact_number,
              cus_email as email, cus_address as address, cus_loyalty_tier as loyalty_tier,
              cus_created_at as created_at
       FROM customers
       ORDER BY cus_id DESC`
    );
  }

  async create(data: Omit<Customer, 'id'>): Promise<Customer> {
    const res = await queryRun(
      this.db,
      `INSERT INTO customers (cus_name, cus_phone, cus_email, cus_address, cus_loyalty_tier)
       VALUES (?, ?, ?, ?, ?)`,
      [data.name, data.contact_number, data.email || null, data.address || null, data.loyalty_tier || 'New']
    );

    return {
      id: res.lastID,
      ...data,
    };
  }

  async delete(id: number): Promise<boolean> {
    const res = await queryRun(this.db, 'DELETE FROM customers WHERE cus_id = ?', [id]);
    return res.changes > 0;
  }
}
