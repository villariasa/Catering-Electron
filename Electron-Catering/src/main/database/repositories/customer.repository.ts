import type sqlite3 from 'sqlite3';
import type { Customer, FollowUp } from '../../../preload/types';
import { queryAll, queryGet, queryRun } from '../connection';

function tierForBookingCount(count: number): string {
  if (count >= 5) return 'VIP';
  if (count >= 1) return 'Regular';
  return 'New';
}

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

  /**
   * Matches the Python system's sp_recalculate_loyalty: recomputes loyalty tier from the
   * customer's CONFIRMED/COMPLETED booking count. Bookings are matched by customer name
   * since bookings don't reliably carry a customer_id yet. Also returns order-history stats.
   */
  async getAllWithStats(): Promise<(Customer & { total_bookings: number; total_spent: number })[]> {
    const customers = await this.getAll();
    const stats = await queryAll<{ bk_customer_name: string; total_bookings: number; total_spent: number }>(
      this.db,
      `SELECT bk_customer_name,
              COUNT(*) as total_bookings,
              COALESCE(SUM(bk_amount_paid), 0) as total_spent
       FROM bookings
       WHERE bk_status IN ('CONFIRMED', 'COMPLETED')
       GROUP BY bk_customer_name`
    );
    const statsByName = new Map(stats.map((s) => [s.bk_customer_name.trim().toLowerCase(), s]));

    const enriched = [];
    for (const c of customers) {
      const s = statsByName.get(c.name.trim().toLowerCase());
      const totalBookings = s?.total_bookings || 0;
      const totalSpent = s?.total_spent || 0;
      const computedTier = tierForBookingCount(totalBookings);

      if (computedTier !== c.loyalty_tier) {
        await queryRun(this.db, 'UPDATE customers SET cus_loyalty_tier = ? WHERE cus_id = ?', [computedTier, c.id]);
      }

      enriched.push({ ...c, loyalty_tier: computedTier, total_bookings: totalBookings, total_spent: totalSpent });
    }
    return enriched;
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

  async getEmailByName(name: string): Promise<string | null> {
    const row = await queryGet<{ cus_email: string | null }>(
      this.db,
      'SELECT cus_email FROM customers WHERE LOWER(TRIM(cus_name)) = LOWER(TRIM(?)) LIMIT 1',
      [name]
    );
    return row?.cus_email || null;
  }

  async getFollowUps(customerId: number): Promise<FollowUp[]> {
    const rows = await queryAll<any>(
      this.db,
      `SELECT cfu_id as id, cfu_customer_id as customer_id, cfu_follow_up_date as follow_up_date,
              cfu_note as note, cfu_is_done as is_done
       FROM customer_follow_ups WHERE cfu_customer_id = ? ORDER BY cfu_follow_up_date ASC, cfu_id ASC`,
      [customerId]
    );
    return rows.map((r) => ({ ...r, is_done: !!r.is_done }));
  }

  async addFollowUp(customerId: number, followUpDate: string, note?: string): Promise<FollowUp> {
    const res = await queryRun(
      this.db,
      `INSERT INTO customer_follow_ups (cfu_customer_id, cfu_follow_up_date, cfu_note) VALUES (?, ?, ?)`,
      [customerId, followUpDate, note || null]
    );
    return { id: res.lastID, customer_id: customerId, follow_up_date: followUpDate, note, is_done: false };
  }

  async toggleFollowUp(id: number): Promise<boolean> {
    const res = await queryRun(
      this.db,
      `UPDATE customer_follow_ups SET cfu_is_done = NOT cfu_is_done, cfu_updated_at = CURRENT_TIMESTAMP WHERE cfu_id = ?`,
      [id]
    );
    return res.changes > 0;
  }

  async deleteFollowUp(id: number): Promise<boolean> {
    const res = await queryRun(this.db, 'DELETE FROM customer_follow_ups WHERE cfu_id = ?', [id]);
    return res.changes > 0;
  }

  async getDueTodayFollowUps(): Promise<(FollowUp & { customer_name: string })[]> {
    const rows = await queryAll<any>(
      this.db,
      `SELECT cfu.cfu_id as id, cfu.cfu_customer_id as customer_id, cfu.cfu_follow_up_date as follow_up_date,
              cfu.cfu_note as note, cfu.cfu_is_done as is_done, cus.cus_name as customer_name
       FROM customer_follow_ups cfu
       JOIN customers cus ON cus.cus_id = cfu.cfu_customer_id
       WHERE cfu.cfu_is_done = 0 AND cfu.cfu_follow_up_date <= date('now')
       ORDER BY cfu.cfu_follow_up_date ASC`
    );
    return rows.map((r) => ({ ...r, is_done: !!r.is_done }));
  }
}
