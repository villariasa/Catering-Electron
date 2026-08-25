import type { CalendarRepository } from '../database/repositories/calendar.repository';
import type { CalendarEvent } from '../../preload/types';

export class CalendarService {
  constructor(private calendarRepo: CalendarRepository) {}

  async getForMonth(year: number, month: number): Promise<CalendarEvent[]> {
    return this.calendarRepo.getForMonth(year, month);
  }

  async create(data: Omit<CalendarEvent, 'id'>): Promise<CalendarEvent> {
    if (!data.name || !data.name.trim()) {
      throw new Error('Event name is required');
    }
    if (!data.event_date) {
      throw new Error('Event date is required');
    }
    return this.calendarRepo.create(data);
  }

  async delete(id: number): Promise<boolean> {
    return this.calendarRepo.delete(id);
  }
}
