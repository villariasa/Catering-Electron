import type { SettingsRepository } from '../database/repositories/settings.repository';
import type { EmailService } from './email.service';
import type { BusinessInfo, Occasion, MonthlySalesTarget } from '../../preload/types';

export class SettingsService {
  constructor(private settingsRepo: SettingsRepository, private emailService: EmailService) {}

  async getBusinessInfo(): Promise<BusinessInfo> {
    return this.settingsRepo.getBusinessInfo();
  }

  async updateBusinessInfo(data: BusinessInfo): Promise<BusinessInfo> {
    if (!data.name || !data.name.trim()) {
      throw new Error('Business name is required');
    }
    return this.settingsRepo.updateBusinessInfo(data);
  }

  async getOccasions(): Promise<Occasion[]> {
    return this.settingsRepo.getOccasions();
  }

  async addOccasion(name: string): Promise<Occasion> {
    if (!name || !name.trim()) {
      throw new Error('Occasion name is required');
    }
    return this.settingsRepo.addOccasion(name.trim());
  }

  async deleteOccasion(id: number): Promise<boolean> {
    return this.settingsRepo.deleteOccasion(id);
  }

  async getSalesTargets(year: number): Promise<MonthlySalesTarget[]> {
    return this.settingsRepo.getSalesTargets(year);
  }

  async setSalesTarget(year: number, month: number, amount: number): Promise<void> {
    return this.settingsRepo.setSalesTarget(year, month, amount);
  }

  async setYearlyTarget(year: number, amount: number): Promise<void> {
    return this.settingsRepo.setYearlyTarget(year, amount);
  }

  async testSmtpConnection(): Promise<{ success: boolean; error?: string }> {
    const info = await this.settingsRepo.getBusinessInfo();
    return this.emailService.testConnection({
      host: info.smtp_host,
      port: info.smtp_port,
      user: info.smtp_user,
      pass: info.smtp_pass,
    });
  }
}
