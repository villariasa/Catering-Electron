import type sqlite3 from 'sqlite3';
import type { Booking } from '../../../preload/types';
import { queryAll, queryGet, queryRun } from '../connection';

const SELECT_FIELDS = `
  bk.bk_id as id, bk.bk_booking_ref as booking_ref, bk.bk_customer_id as customer_id,
  bk.bk_customer_name as customer_name, bk.bk_occasion as occasion, bk.bk_event_date as event_date,
  bk.bk_event_time as event_time, bk.bk_venue as venue, bk.bk_pax as pax,
  bk.bk_package_id as package_id, pkg.pkg_name as package_name, bk.bk_addons as addons,
  bk.bk_total_amount as total_amount, bk.bk_amount_paid as amount_paid, bk.bk_balance as balance,
  bk.bk_status as status, bk.bk_payment_status as payment_status, bk.bk_created_at as created_at
`;

export class BookingRepository {
  constructor(private db: sqlite3.Database) {}

  async getAll(): Promise<Booking[]> {
    return queryAll<Booking>(
      this.db,
      `SELECT ${SELECT_FIELDS}
       FROM bookings bk
       LEFT JOIN packages pkg ON pkg.pkg_id = bk.bk_package_id
       ORDER BY bk.bk_event_date ASC, bk.bk_id DESC`
    );
  }

  async create(data: Omit<Booking, 'id'>): Promise<Booking> {
    const res = await queryRun(
      this.db,
      `INSERT INTO bookings
       (bk_booking_ref, bk_customer_id, bk_customer_name, bk_occasion, bk_event_date, bk_event_time, bk_venue, bk_pax,
        bk_package_id, bk_addons, bk_special_notes, bk_total_amount, bk_amount_paid, bk_balance, bk_status, bk_payment_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.booking_ref,
        data.customer_id || null,
        data.customer_name,
        data.occasion,
        data.event_date,
        data.event_time || '18:00',
        data.venue,
        data.pax,
        data.package_id || null,
        data.addons || null,
        (data as any).special_notes || null,
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

  async getById(id: number): Promise<Booking | undefined> {
    return queryGet<Booking>(
      this.db,
      `SELECT ${SELECT_FIELDS}
       FROM bookings bk
       LEFT JOIN packages pkg ON pkg.pkg_id = bk.bk_package_id
       WHERE bk.bk_id = ?`,
      [id]
    );
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
