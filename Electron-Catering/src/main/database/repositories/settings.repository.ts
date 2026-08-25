import type sqlite3 from 'sqlite3';
import type { BusinessInfo, Occasion, MonthlySalesTarget } from '../../../preload/types';
import { queryAll, queryGet, queryRun } from '../connection';

export class SettingsRepository {
  constructor(private db: sqlite3.Database) {}

  async getBusinessInfo(): Promise<BusinessInfo> {
    const row = await queryGet<any>(
      this.db,
      `SELECT bi_name as name, bi_address as address, bi_contact as contact, bi_email as email,
              bi_min_downpayment_pct as min_downpayment_pct, bi_allow_zero_downpayment as allow_zero_downpayment,
              bi_max_daily_pax as max_daily_pax, bi_smtp_host as smtp_host, bi_smtp_port as smtp_port,
              bi_smtp_user as smtp_user, bi_smtp_pass as smtp_pass
       FROM business_info WHERE bi_id = 1`
    );
    return {
      name: row?.name || '',
      address: row?.address || '',
      contact: row?.contact || '',
      email: row?.email || '',
      min_downpayment_pct: row?.min_downpayment_pct ?? 20,
      allow_zero_downpayment: !!row?.allow_zero_downpayment,
      max_daily_pax: row?.max_daily_pax ?? 600,
      smtp_host: row?.smtp_host || '',
      smtp_port: row?.smtp_port ?? 587,
      smtp_user: row?.smtp_user || '',
      smtp_pass: row?.smtp_pass || '',
    };
  }

  async updateBusinessInfo(data: BusinessInfo): Promise<BusinessInfo> {
    await queryRun(
      this.db,
      `UPDATE business_info SET bi_name = ?, bi_address = ?, bi_contact = ?, bi_email = ?,
              bi_min_downpayment_pct = ?, bi_allow_zero_downpayment = ?, bi_max_daily_pax = ?,
              bi_smtp_host = ?, bi_smtp_port = ?, bi_smtp_user = ?, bi_smtp_pass = ?, bi_updated_at = CURRENT_TIMESTAMP
       WHERE bi_id = 1`,
      [
        data.name,
        data.address,
        data.contact,
        data.email,
        data.min_downpayment_pct,
        data.allow_zero_downpayment ? 1 : 0,
        data.max_daily_pax,
        data.smtp_host || '',
        data.smtp_port || 587,
        data.smtp_user || '',
        data.smtp_pass || '',
      ]
    );
    return this.getBusinessInfo();
  }

  async getOccasions(): Promise<Occasion[]> {
    return queryAll<Occasion>(this.db, 'SELECT occ_id as id, occ_name as name FROM occasions ORDER BY occ_name ASC');
  }

  async addOccasion(name: string): Promise<Occasion> {
    const res = await queryRun(this.db, 'INSERT INTO occasions (occ_name) VALUES (?)', [name]);
    return { id: res.lastID, name };
  }

  async deleteOccasion(id: number): Promise<boolean> {
    const res = await queryRun(this.db, 'DELETE FROM occasions WHERE occ_id = ?', [id]);
    return res.changes > 0;
  }

  async getSalesTargets(year: number): Promise<MonthlySalesTarget[]> {
    return queryAll<MonthlySalesTarget>(
      this.db,
      'SELECT mst_year as year, mst_month as month, mst_target_amount as target_amount FROM monthly_sales_targets WHERE mst_year = ? ORDER BY mst_month ASC',
      [year]
    );
  }

  async setSalesTarget(year: number, month: number, amount: number): Promise<void> {
    await queryRun(
      this.db,
      `INSERT INTO monthly_sales_targets (mst_year, mst_month, mst_target_amount) VALUES (?, ?, ?)
       ON CONFLICT(mst_year, mst_month) DO UPDATE SET mst_target_amount = excluded.mst_target_amount`,
      [year, month, amount]
    );
  }

  async setYearlyTarget(year: number, amount: number): Promise<void> {
    for (let month = 1; month <= 12; month++) {
      await this.setSalesTarget(year, month, amount);
    }
  }
}
