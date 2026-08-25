import type sqlite3 from 'sqlite3';
import type { AuditLogEntry, Notification } from '../../../preload/types';
import { queryAll, queryRun } from '../connection';

export class AuditRepository {
  constructor(private db: sqlite3.Database) {}

  async log(action: string, tableName: string, recordId: number | null, details: string, actor = 'owner'): Promise<void> {
    await queryRun(
      this.db,
      `INSERT INTO audit_logs (al_actor, al_action, al_table_name, al_record_id, al_details) VALUES (?, ?, ?, ?, ?)`,
      [actor, action, tableName, recordId, details]
    );
  }

  async getRecent(limit = 50): Promise<AuditLogEntry[]> {
    return queryAll<AuditLogEntry>(
      this.db,
      `SELECT al_id as id, al_actor as actor, al_action as action, al_table_name as table_name,
              al_record_id as record_id, al_details as details, al_created_at as created_at
       FROM audit_logs ORDER BY al_created_at DESC LIMIT ?`,
      [limit]
    );
  }

  async pushNotification(type: string, title: string, message: string, color = '#3B82F6'): Promise<Notification> {
    const res = await queryRun(
      this.db,
      `INSERT INTO notifications (notif_type, notif_title, notif_message, notif_color) VALUES (?, ?, ?, ?)`,
      [type, title, message, color]
    );
    return { id: res.lastID, type, title, message, color, is_read: false };
  }

  async getNotifications(): Promise<Notification[]> {
    const rows = await queryAll<any>(
      this.db,
      `SELECT notif_id as id, notif_type as type, notif_title as title, notif_message as message,
              notif_color as color, notif_is_read as is_read, notif_created_at as created_at
       FROM notifications ORDER BY notif_created_at DESC LIMIT 50`
    );
    return rows.map((r) => ({ ...r, is_read: !!r.is_read }));
  }

  async markNotificationRead(id: number): Promise<boolean> {
    const res = await queryRun(this.db, 'UPDATE notifications SET notif_is_read = 1 WHERE notif_id = ?', [id]);
    return res.changes > 0;
  }

  async clearNotifications(): Promise<void> {
    await queryRun(this.db, 'UPDATE notifications SET notif_is_read = 1 WHERE notif_is_read = 0');
  }

  async deleteNotification(id: number): Promise<boolean> {
    const res = await queryRun(this.db, 'DELETE FROM notifications WHERE notif_id = ?', [id]);
    return res.changes > 0;
  }
}
