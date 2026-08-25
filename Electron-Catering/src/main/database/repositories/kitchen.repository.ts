import type sqlite3 from 'sqlite3';
import type { KitchenOrder, KitchenTask } from '../../../preload/types';
import { queryAll, queryGet, queryRun } from '../connection';

interface BookingRow {
  bk_id: number;
  bk_customer_name: string;
  bk_occasion: string;
  bk_pax: number;
}

export class KitchenRepository {
  constructor(private db: sqlite3.Database) {}

  private async generateOrderRef(): Promise<string> {
    for (let attempt = 0; attempt < 25; attempt++) {
      const ref = `KO-${Math.floor(100000 + Math.random() * 900000)}`;
      const existing = await queryGet<{ ko_id: number }>(this.db, 'SELECT ko_id FROM kitchen_orders WHERE ko_order_ref = ?', [ref]);
      if (!existing) return ref;
    }
    return `KO-${Date.now()}`;
  }

  /** Creates a kitchen order for every PENDING/CONFIRMED booking that doesn't have one yet. Idempotent. */
  async syncFromBookings(): Promise<void> {
    const bookings = await queryAll<BookingRow>(
      this.db,
      `SELECT bk_id, bk_customer_name, bk_occasion, bk_pax FROM bookings WHERE bk_status IN ('PENDING', 'CONFIRMED')`
    );
    for (const b of bookings) {
      const existing = await queryGet<{ ko_id: number }>(this.db, 'SELECT ko_id FROM kitchen_orders WHERE ko_booking_id = ?', [b.bk_id]);
      if (existing) continue;

      const ref = await this.generateOrderRef();
      const itemsDesc = `Catering for ${b.bk_pax} pax — ${b.bk_occasion}`;
      const res = await queryRun(
        this.db,
        `INSERT INTO kitchen_orders (ko_order_ref, ko_booking_id, ko_client_name, ko_event_name, ko_pax, ko_items_desc, ko_status)
         VALUES (?, ?, ?, ?, ?, ?, 'Queued')`,
        [ref, b.bk_id, b.bk_customer_name, b.bk_occasion, b.bk_pax, itemsDesc]
      );
      await this.autoGenerateTasks(res.lastID, itemsDesc);
    }
  }

  /** Splits items_desc on commas into one prep task per item, only if the order has none yet. Idempotent. */
  async autoGenerateTasks(orderId: number, itemsDesc: string): Promise<void> {
    const existing = await queryGet<{ cnt: number }>(this.db, 'SELECT COUNT(*) as cnt FROM kitchen_tasks WHERE kt_order_id = ?', [orderId]);
    if (existing && existing.cnt > 0) return;

    const items = itemsDesc.split(',').map((s) => s.trim()).filter(Boolean);
    for (let i = 0; i < items.length; i++) {
      await queryRun(
        this.db,
        `INSERT INTO kitchen_tasks (kt_order_id, kt_task_label, kt_sort_order) VALUES (?, ?, ?)`,
        [orderId, `Prepare: ${items[i]}`, i]
      );
    }
  }

  async getAllOrders(): Promise<KitchenOrder[]> {
    return queryAll<KitchenOrder>(
      this.db,
      `SELECT ko.ko_id as id, ko.ko_order_ref as order_ref, ko.ko_booking_id as booking_id,
              ko.ko_client_name as customer_name, ko.ko_event_name as occasion, ko.ko_pax as pax,
              ko.ko_items_desc as items_desc, ko.ko_status as status,
              bk.bk_booking_ref as booking_ref, bk.bk_event_date as event_date,
              bk.bk_event_time as event_time, bk.bk_venue as venue
       FROM kitchen_orders ko
       LEFT JOIN bookings bk ON bk.bk_id = ko.ko_booking_id
       ORDER BY bk.bk_event_date ASC, ko.ko_id DESC`
    );
  }

  async getTasks(orderId: number): Promise<KitchenTask[]> {
    const rows = await queryAll<any>(
      this.db,
      `SELECT kt_id as id, kt_order_id as order_id, kt_task_label as label, kt_is_done as is_done, kt_sort_order as sort_order
       FROM kitchen_tasks WHERE kt_order_id = ? ORDER BY kt_sort_order ASC, kt_id ASC`,
      [orderId]
    );
    return rows.map((r) => ({ ...r, is_done: !!r.is_done }));
  }

  async updateOrderStatus(orderId: number, status: string): Promise<boolean> {
    const res = await queryRun(this.db, `UPDATE kitchen_orders SET ko_status = ?, ko_updated_at = CURRENT_TIMESTAMP WHERE ko_id = ?`, [status, orderId]);
    return res.changes > 0;
  }

  async addTask(orderId: number, label: string): Promise<KitchenTask> {
    const sortRow = await queryGet<{ maxSort: number | null }>(this.db, 'SELECT MAX(kt_sort_order) as maxSort FROM kitchen_tasks WHERE kt_order_id = ?', [orderId]);
    const sortOrder = (sortRow?.maxSort ?? -1) + 1;
    const res = await queryRun(this.db, `INSERT INTO kitchen_tasks (kt_order_id, kt_task_label, kt_sort_order) VALUES (?, ?, ?)`, [orderId, label, sortOrder]);
    return { id: res.lastID, order_id: orderId, label, is_done: false, sort_order: sortOrder };
  }

  async toggleTask(taskId: number): Promise<boolean> {
    const res = await queryRun(
      this.db,
      `UPDATE kitchen_tasks SET kt_is_done = NOT kt_is_done, kt_updated_at = CURRENT_TIMESTAMP WHERE kt_id = ?`,
      [taskId]
    );
    return res.changes > 0;
  }

  async deleteTask(taskId: number): Promise<boolean> {
    const res = await queryRun(this.db, 'DELETE FROM kitchen_tasks WHERE kt_id = ?', [taskId]);
    return res.changes > 0;
  }
}
