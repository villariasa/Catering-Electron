import type sqlite3 from 'sqlite3';
import type { CalendarEvent } from '../../../preload/types';
import { queryAll, queryRun } from '../connection';

export class CalendarRepository {
  constructor(private db: sqlite3.Database) {}

  async getForMonth(year: number, month: number): Promise<CalendarEvent[]> {
    const monthStr = String(month).padStart(2, '0');
    const prefix = `${year}-${monthStr}`;
    return queryAll<CalendarEvent>(
      this.db,
      `SELECT ce_id as id, ce_event_date as event_date, ce_name as name, ce_pax as pax,
              ce_event_time as event_time, ce_location as location
       FROM calendar_events WHERE ce_event_date LIKE ? ORDER BY ce_event_date ASC`,
      [`${prefix}%`]
    );
  }

  async create(data: Omit<CalendarEvent, 'id'>): Promise<CalendarEvent> {
    const res = await queryRun(
      this.db,
      `INSERT INTO calendar_events (ce_event_date, ce_name, ce_pax, ce_event_time, ce_location) VALUES (?, ?, ?, ?, ?)`,
      [data.event_date, data.name, data.pax || null, data.event_time || null, data.location || null]
    );
    return { id: res.lastID, ...data };
  }

  async delete(id: number): Promise<boolean> {
    const res = await queryRun(this.db, 'DELETE FROM calendar_events WHERE ce_id = ?', [id]);
    return res.changes > 0;
  }
}
