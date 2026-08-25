import type sqlite3 from 'sqlite3';
import type { MenuItem } from '../../../preload/types';
import { queryAll, queryRun } from '../connection';

export class MenuItemRepository {
  constructor(private db: sqlite3.Database) {}

  async getAll(): Promise<MenuItem[]> {
    const rows = await queryAll<any>(
      this.db,
      `SELECT mi_id as id, mi_name as name, mi_description as description, mi_category as category,
              mi_price as price, mi_package_tier as package_tier, mi_is_active as is_active
       FROM menu_items
       ORDER BY mi_id DESC`
    );
    return rows.map((r) => ({ ...r, is_active: !!r.is_active }));
  }

  async create(data: Omit<MenuItem, 'id'>): Promise<MenuItem> {
    const res = await queryRun(
      this.db,
      `INSERT INTO menu_items (mi_name, mi_description, mi_category, mi_price, mi_package_tier)
       VALUES (?, ?, ?, ?, ?)`,
      [data.name, data.description || null, data.category || 'Uncategorized', data.price, data.package_tier || null]
    );

    return { id: res.lastID, ...data };
  }

  async delete(id: number): Promise<boolean> {
    const res = await queryRun(this.db, 'DELETE FROM menu_items WHERE mi_id = ?', [id]);
    return res.changes > 0;
  }
}
