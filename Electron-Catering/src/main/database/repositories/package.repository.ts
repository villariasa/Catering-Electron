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
}
