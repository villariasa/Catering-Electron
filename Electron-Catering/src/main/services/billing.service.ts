import type { BillingRepository } from '../database/repositories/billing.repository';
import type { AuditService } from './audit.service';
import type { Invoice, PaymentRecord } from '../../preload/types';

export class BillingService {
  constructor(private billingRepo: BillingRepository, private auditService: AuditService) {}

  async getAllInvoices(): Promise<Invoice[]> {
    // Backfills invoices for any booking that doesn't have one yet (idempotent),
    // matching the Python system's sp_auto_create_invoice behavior.
    await this.billingRepo.ensureInvoicesForAllBookings();
    return this.billingRepo.getAll();
  }

  async getPaymentHistory(invoiceId: number): Promise<PaymentRecord[]> {
    return this.billingRepo.getPayments(invoiceId);
  }

  async getAllPayments(): Promise<PaymentRecord[]> {
    return this.billingRepo.getAllPayments();
  }

  async recordPayment(
    invoiceId: number,
    amount: number,
    paymentDate: string,
    method: string,
    referenceNo?: string,
    notes?: string
  ): Promise<Invoice> {
    if (!amount || amount <= 0) {
      throw new Error('Payment amount must be greater than 0');
    }

    const invoice = await this.billingRepo.getById(invoiceId);
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    // Matches the Python system's sp_record_payment: reject overpayment beyond the remaining balance.
    if (amount > invoice.balance + 0.01) {
      throw new Error(`Payment of ₱${amount.toLocaleString()} exceeds the remaining balance of ₱${invoice.balance.toLocaleString()}`);
    }

    const updated = await this.billingRepo.recordPayment(
      invoiceId,
      amount,
      paymentDate || new Date().toISOString().split('T')[0],
      method || 'Cash',
      referenceNo,
      notes
    );

    await this.auditService.log('PAYMENT', 'invoices', invoiceId, `Recorded ₱${amount.toLocaleString()} payment on ${updated.invoice_ref} via ${method || 'Cash'}`);
    await this.auditService.pushNotification('invoice', 'Payment Recorded', `₱${amount.toLocaleString()} received for ${updated.invoice_ref} (${updated.customer_name})`, '#10B981');

    return updated;
  }
}
