import type sqlite3 from 'sqlite3';
import type { Booking } from '../../../preload/types';
import { queryAll, queryRun } from '../connection';

export class BookingRepository {
  constructor(private db: sqlite3.Database) {}

  async getAll(): Promise<Booking[]> {
    return queryAll<Booking>(
      this.db,
      `SELECT bk_id as id, bk_booking_ref as booking_ref, bk_customer_name as customer_name,
              bk_occasion as occasion, bk_event_date as event_date, bk_event_time as event_time,
              bk_venue as venue, bk_pax as pax, bk_total_amount as total_amount,
              bk_amount_paid as amount_paid, bk_balance as balance, bk_status as status,
              bk_payment_status as payment_status, bk_created_at as created_at
       FROM bookings
       ORDER BY bk_event_date ASC, bk_id DESC`
    );
  }

  async create(data: Omit<Booking, 'id'>): Promise<Booking> {
    const res = await queryRun(
      this.db,
      `INSERT INTO bookings 
       (bk_booking_ref, bk_customer_name, bk_occasion, bk_event_date, bk_event_time, bk_venue, bk_pax, bk_total_amount, bk_amount_paid, bk_balance, bk_status, bk_payment_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.booking_ref,
        data.customer_name,
        data.occasion,
        data.event_date,
        data.event_time || '18:00',
        data.venue,
        data.pax,
        data.total_amount,
        data.amount_paid,
        data.balance,
        data.status,
        data.payment_status,
      ]
    );

    return {
      id: res.lastID,
      ...data,
    };
  }

  async updateStatus(id: number, status: Booking['status']): Promise<boolean> {
    const res = await queryRun(this.db, 'UPDATE bookings SET bk_status = ? WHERE bk_id = ?', [status, id]);
    return res.changes > 0;
  }

  async delete(id: number): Promise<boolean> {
    const res = await queryRun(this.db, 'DELETE FROM bookings WHERE bk_id = ?', [id]);
    return res.changes > 0;
  }
}
