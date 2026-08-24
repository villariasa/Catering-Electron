import type { BookingRepository } from '../database/repositories/booking.repository';
import type { Booking } from '../../preload/types';

export class BookingService {
  constructor(private bookingRepo: BookingRepository) {}

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

    return this.bookingRepo.create(processed);
  }

  async updateBookingStatus(id: number, status: Booking['status']): Promise<boolean> {
    return this.bookingRepo.updateStatus(id, status);
  }

  async deleteBooking(id: number): Promise<boolean> {
    return this.bookingRepo.delete(id);
  }
}
