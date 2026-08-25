import type sqlite3 from 'sqlite3';
import type { Invoice, PaymentRecord } from '../../../preload/types';
import { queryAll, queryGet, queryRun } from '../connection';

interface BookingRow {
  bk_id: number;
  bk_total_amount: number;
  bk_amount_paid: number;
}

export class BillingRepository {
  constructor(private db: sqlite3.Database) {}

  private async generateInvoiceRef(): Promise<string> {
    const year = new Date().getFullYear();
    for (let attempt = 0; attempt < 25; attempt++) {
      const ref = `INV-${year}-${Math.floor(1000 + Math.random() * 9000)}`;
      const existing = await queryGet<{ inv_id: number }>(this.db, 'SELECT inv_id FROM invoices WHERE inv_invoice_ref = ?', [ref]);
      if (!existing) return ref;
    }
    return `INV-${year}-${Date.now()}`;
  }

  /** Ensures every non-cancelled booking has a backing invoice row. Idempotent. */
  async ensureInvoicesForAllBookings(): Promise<void> {
    // Single query for "which bookings already have an invoice" instead of one
    // existence check per booking — was O(n) queries, now O(1) plus O(missing).
    const bookings = await queryAll<BookingRow>(
      this.db,
      `SELECT bk.bk_id, bk.bk_total_amount, bk.bk_amount_paid
       FROM bookings bk
       LEFT JOIN invoices inv ON inv.inv_booking_id = bk.bk_id
       WHERE bk.bk_status != 'CANCELLED' AND inv.inv_id IS NULL`
    );
    for (const b of bookings) {
      const ref = await this.generateInvoiceRef();
      const total = Number(b.bk_total_amount || 0);
      const paid = Number(b.bk_amount_paid || 0);
      const balance = Math.max(0, total - paid);
      const status = balance <= 0.01 && paid > 0 ? 'Paid' : paid > 0 ? 'Partial' : 'Unpaid';

      await queryRun(
        this.db,
        `INSERT INTO invoices (inv_invoice_ref, inv_booking_id, inv_total_amount, inv_amount_paid, inv_balance, inv_status)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [ref, b.bk_id, total, paid, balance, status]
      );
    }
  }

  /** All payments across all invoices in one query — used for report aggregation instead of an N+1 loop. */
  async getAllPayments(): Promise<PaymentRecord[]> {
    return queryAll<PaymentRecord>(
      this.db,
      `SELECT pr_id as id, pr_invoice_id as invoice_id, pr_amount as amount, pr_payment_date as payment_date,
              pr_method as method, pr_reference_no as reference_no, pr_notes as notes, pr_created_at as created_at
       FROM payment_records`
    );
  }

  async getAll(): Promise<Invoice[]> {
    return queryAll<Invoice>(
      this.db,
      `SELECT inv.inv_id as id, inv.inv_invoice_ref as invoice_ref, inv.inv_booking_id as booking_id,
              bk.bk_booking_ref as booking_ref, bk.bk_customer_name as customer_name, bk.bk_event_date as event_date,
              inv.inv_total_amount as total_amount, inv.inv_amount_paid as amount_paid, inv.inv_balance as balance,
              inv.inv_status as status, inv.inv_due_date as due_date, inv.inv_notes as notes,
              inv.inv_created_at as created_at
       FROM invoices inv
       JOIN bookings bk ON bk.bk_id = inv.inv_booking_id
       ORDER BY bk.bk_event_date DESC, inv.inv_id DESC`
    );
  }

  async getById(id: number): Promise<Invoice | undefined> {
    return queryGet<Invoice>(
      this.db,
      `SELECT inv.inv_id as id, inv.inv_invoice_ref as invoice_ref, inv.inv_booking_id as booking_id,
              bk.bk_booking_ref as booking_ref, bk.bk_customer_name as customer_name, bk.bk_event_date as event_date,
              inv.inv_total_amount as total_amount, inv.inv_amount_paid as amount_paid, inv.inv_balance as balance,
              inv.inv_status as status, inv.inv_due_date as due_date, inv.inv_notes as notes,
              inv.inv_created_at as created_at
       FROM invoices inv
       JOIN bookings bk ON bk.bk_id = inv.inv_booking_id
       WHERE inv.inv_id = ?`,
      [id]
    );
  }

  async getPayments(invoiceId: number): Promise<PaymentRecord[]> {
    return queryAll<PaymentRecord>(
      this.db,
      `SELECT pr_id as id, pr_invoice_id as invoice_id, pr_amount as amount, pr_payment_date as payment_date,
              pr_method as method, pr_reference_no as reference_no, pr_notes as notes, pr_created_at as created_at
       FROM payment_records WHERE pr_invoice_id = ? ORDER BY pr_payment_date DESC, pr_id DESC`,
      [invoiceId]
    );
  }

  async recordPayment(
    invoiceId: number,
    amount: number,
    paymentDate: string,
    method: string,
    referenceNo: string | undefined,
    notes: string | undefined
  ): Promise<Invoice> {
    const invoice = await this.getById(invoiceId);
    if (!invoice) throw new Error('Invoice not found');

    await queryRun(
      this.db,
      `INSERT INTO payment_records (pr_invoice_id, pr_amount, pr_payment_date, pr_method, pr_reference_no, pr_notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [invoiceId, amount, paymentDate, method, referenceNo || null, notes || null]
    );

    const totalPaid = invoice.amount_paid + amount;
    const balance = Math.max(0, invoice.total_amount - totalPaid);
    const status: Invoice['status'] = balance <= 0.01 && totalPaid > 0 ? 'Paid' : totalPaid > 0 ? 'Partial' : 'Unpaid';

    await queryRun(
      this.db,
      `UPDATE invoices SET inv_amount_paid = ?, inv_balance = ?, inv_status = ?, inv_updated_at = CURRENT_TIMESTAMP WHERE inv_id = ?`,
      [totalPaid, balance, status, invoiceId]
    );

    // Mirror payment status back onto the booking so Dashboard/Bookings/Kitchen stay consistent.
    await queryRun(
      this.db,
      `UPDATE bookings SET bk_amount_paid = ?, bk_balance = ?, bk_payment_status = ? WHERE bk_id = ?`,
      [totalPaid, balance, status, invoice.booking_id]
    );

    return { ...invoice, amount_paid: totalPaid, balance, status };
  }
}
