import type { MenuItemRepository } from '../database/repositories/menuitem.repository';
import type { MenuItem } from '../../preload/types';

export class MenuItemService {
  constructor(private menuItemRepo: MenuItemRepository) {}

  async getAll(): Promise<MenuItem[]> {
    return this.menuItemRepo.getAll();
  }

  async create(data: Omit<MenuItem, 'id'>): Promise<MenuItem> {
    if (!data.name || !data.name.trim()) {
      throw new Error('Dish name is required');
    }
    if (data.price < 0) {
      throw new Error('Price cannot be negative');
    }
    return this.menuItemRepo.create(data);
  }

  async delete(id: number): Promise<boolean> {
    return this.menuItemRepo.delete(id);
  }
}
