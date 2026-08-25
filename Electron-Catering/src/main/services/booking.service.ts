import type { BookingRepository } from '../database/repositories/booking.repository';
import type { CustomerRepository } from '../database/repositories/customer.repository';
import type { SettingsRepository } from '../database/repositories/settings.repository';
import type { AuditService } from './audit.service';
import type { EmailService } from './email.service';
import type { Booking } from '../../preload/types';

export class BookingService {
  constructor(
    private bookingRepo: BookingRepository,
    private customerRepo: CustomerRepository,
    private settingsRepo: SettingsRepository,
    private auditService: AuditService,
    private emailService: EmailService
  ) {}

  async getAllBookings(): Promise<Booking[]> {
    return this.bookingRepo.getAll();
  }

  async createBooking(data: Omit<Booking, 'id'>): Promise<Booking> {
    if (!data.customer_name || data.customer_name.trim().length === 0) {
      throw new Error('Customer name is required for booking');
    }
    if (!data.event_date) {
      throw new Error('Event date is required');
    }
    if (data.pax <= 0) {
      throw new Error('Pax count must be greater than 0');
    }

    // Business Rule 1.2: Balance = Total - Paid
    const amountPaid = Number(data.amount_paid || 0);
    const totalAmount = Number(data.total_amount || 0);
    const balance = Math.max(0, totalAmount - amountPaid);

    // Business Rule 2.1: Payment status determination
    let paymentStatus: Booking['payment_status'] = 'Unpaid';
    if (amountPaid >= totalAmount && totalAmount > 0) {
      paymentStatus = 'Paid';
    } else if (amountPaid > 0) {
      paymentStatus = 'Partial';
    }

    const bookingRef = data.booking_ref || `BK-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const processed: Omit<Booking, 'id'> = {
      ...data,
      booking_ref: bookingRef,
      amount_paid: amountPaid,
      balance: balance,
      payment_status: paymentStatus,
    };

    const created = await this.bookingRepo.create(processed);

    await this.auditService.log('CREATE_BOOKING', 'bookings', created.id || null, `Created booking ${created.booking_ref} for ${created.customer_name} (₱${created.total_amount.toLocaleString()})`);
    await this.auditService.pushNotification('booking', 'New Booking Created', `${created.customer_name} — ${created.occasion} on ${created.event_date}`, '#3B82F6');

    return created;
  }

  async updateBookingStatus(id: number, status: Booking['status'], cancellationReason?: string): Promise<boolean> {
    const existing = await this.bookingRepo.getById(id);
    const updated = await this.bookingRepo.updateStatus(id, status);

    if (updated && existing) {
      const action = status === 'CONFIRMED' ? 'APPROVE' : status === 'CANCELLED' ? 'CANCEL' : status === 'COMPLETED' ? 'COMPLETE' : 'UPDATE_STATUS';
      const details = cancellationReason
        ? `Booking ${existing.booking_ref} set to ${status}: ${cancellationReason}`
        : `Booking ${existing.booking_ref} set to ${status}`;
      await this.auditService.log(action, 'bookings', id, details);
      await this.auditService.pushNotification(
        'booking',
        `Booking ${status}`,
        `${existing.customer_name} — ${existing.booking_ref} is now ${status}`,
        status === 'CONFIRMED' ? '#10B981' : status === 'CANCELLED' ? '#EF4444' : '#3B82F6'
      );

      if (status === 'CONFIRMED') {
        // Best-effort auto confirmation email — never blocks the status update if it fails.
        this.sendConfirmationEmail(existing).catch((err) => console.error('[Booking] Confirmation email failed:', err));
      }
    }

    return updated;
  }

  private async sendConfirmationEmail(booking: Booking): Promise<void> {
    const email = await this.customerRepo.getEmailByName(booking.customer_name);
    if (!email) return;

    const business = await this.settingsRepo.getBusinessInfo();
    if (!business.smtp_host || !business.smtp_user) return;

    const html = `
      <h2>Booking Confirmed — ${business.name || "Jayraldine's Catering"}</h2>
      <p>Hi ${booking.customer_name},</p>
      <p>Your booking <strong>${booking.booking_ref}</strong> for <strong>${booking.occasion}</strong> on
      <strong>${booking.event_date}</strong> at <strong>${booking.venue}</strong> has been confirmed.</p>
      <p>Guest count: ${booking.pax} pax<br/>
      Total amount: ₱${booking.total_amount.toLocaleString()}<br/>
      Amount paid: ₱${booking.amount_paid.toLocaleString()}<br/>
      Balance due: ₱${booking.balance.toLocaleString()}</p>
      <p>Thank you for choosing ${business.name || "Jayraldine's Catering"}!</p>
    `;

    await this.emailService.sendMail(
      { host: business.smtp_host, port: business.smtp_port, user: business.smtp_user, pass: business.smtp_pass },
      email,
      `Booking Confirmed — ${booking.booking_ref}`,
      html
    );
  }

  async deleteBooking(id: number): Promise<boolean> {
    return this.bookingRepo.delete(id);
  }
}
