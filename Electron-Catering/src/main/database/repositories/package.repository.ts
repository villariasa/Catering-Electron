import type sqlite3 from 'sqlite3';
import type { PackageItem } from '../../../preload/types';
import { queryAll, queryRun } from '../connection';

export class PackageRepository {
  constructor(private db: sqlite3.Database) {}

  async getAll(): Promise<PackageItem[]> {
    return queryAll<PackageItem>(
      this.db,
      `SELECT pkg_id as id, pkg_name as name, pkg_category as category,
              pkg_price_per_pax as price_per_pax, pkg_min_pax as min_pax,
              pkg_description as description
       FROM packages
       ORDER BY pkg_id ASC`
    );
  }

  async create(data: Omit<PackageItem, 'id'>): Promise<PackageItem> {
    const res = await queryRun(
      this.db,
      `INSERT INTO packages (pkg_name, pkg_category, pkg_price_per_pax, pkg_min_pax, pkg_description)
       VALUES (?, ?, ?, ?, ?)`,
      [data.name, data.category || 'Buffet', data.price_per_pax, data.min_pax || 30, data.description || null]
    );

    return {
      id: res.lastID,
      ...data,
    };
  }

  async delete(id: number): Promise<boolean> {
    const res = await queryRun(this.db, 'DELETE FROM packages WHERE pkg_id = ?', [id]);
    return res.changes > 0;
  }

  async getItemIdsForPackage(packageId: number): Promise<number[]> {
    const rows = await queryAll<{ pi_item_id: number }>(this.db, 'SELECT pi_item_id FROM package_items WHERE pi_package_id = ?', [packageId]);
    return rows.map((r) => r.pi_item_id);
  }

  async getItemCounts(): Promise<Record<number, number>> {
    const rows = await queryAll<{ pi_package_id: number; cnt: number }>(
      this.db,
      'SELECT pi_package_id, COUNT(*) as cnt FROM package_items GROUP BY pi_package_id'
    );
    const map: Record<number, number> = {};
    for (const r of rows) map[r.pi_package_id] = r.cnt;
    return map;
  }

  async setItemsForPackage(packageId: number, itemIds: number[]): Promise<void> {
    await queryRun(this.db, 'DELETE FROM package_items WHERE pi_package_id = ?', [packageId]);
    for (const itemId of itemIds) {
      await queryRun(this.db, 'INSERT OR IGNORE INTO package_items (pi_package_id, pi_item_id) VALUES (?, ?)', [packageId, itemId]);
    }
  }
}
