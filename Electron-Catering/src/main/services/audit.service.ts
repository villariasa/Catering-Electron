import type { AuditRepository } from '../database/repositories/audit.repository';
import type { AuditLogEntry, Notification } from '../../preload/types';

export class AuditService {
  constructor(private auditRepo: AuditRepository) {}

  async log(action: string, tableName: string, recordId: number | null, details: string): Promise<void> {
    return this.auditRepo.log(action, tableName, recordId, details);
  }

  async getRecent(limit?: number): Promise<AuditLogEntry[]> {
    return this.auditRepo.getRecent(limit);
  }

  async pushNotification(type: string, title: string, message: string, color?: string): Promise<Notification> {
    return this.auditRepo.pushNotification(type, title, message, color);
  }

  async getNotifications(): Promise<Notification[]> {
    return this.auditRepo.getNotifications();
  }

  async markNotificationRead(id: number): Promise<boolean> {
    return this.auditRepo.markNotificationRead(id);
  }

  async clearNotifications(): Promise<void> {
    return this.auditRepo.clearNotifications();
  }

  async deleteNotification(id: number): Promise<boolean> {
    return this.auditRepo.deleteNotification(id);
  }
}
