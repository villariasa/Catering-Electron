import type { PackageRepository } from '../database/repositories/package.repository';
import type { PackageItem } from '../../preload/types';

export class PackageService {
  constructor(private packageRepo: PackageRepository) {}

  async getAllPackages(): Promise<PackageItem[]> {
    return this.packageRepo.getAll();
  }

  async createPackage(data: Omit<PackageItem, 'id'>): Promise<PackageItem> {
    if (!data.name || data.name.trim().length === 0) {
      throw new Error('Package name is required');
    }
    if (data.price_per_pax <= 0) {
      throw new Error('Price per pax must be a positive number');
    }
    return this.packageRepo.create(data);
  }
}
