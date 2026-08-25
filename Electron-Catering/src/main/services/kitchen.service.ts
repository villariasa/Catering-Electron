import type { KitchenRepository } from '../database/repositories/kitchen.repository';
import type { KitchenOrder, KitchenTask } from '../../preload/types';

const VALID_STATUSES: KitchenOrder['status'][] = ['Queued', 'In Prep', 'Ready', 'Completed'];

export class KitchenService {
  constructor(private kitchenRepo: KitchenRepository) {}

  async getAllOrders(): Promise<(KitchenOrder & { tasks: KitchenTask[] })[]> {
    await this.kitchenRepo.syncFromBookings();
    const orders = await this.kitchenRepo.getAllOrders();

    const withTasks = [];
    for (const order of orders) {
      const tasks = await this.kitchenRepo.getTasks(order.id);
      withTasks.push({ ...order, tasks });
    }
    return withTasks;
  }

  async updateOrderStatus(orderId: number, status: string): Promise<boolean> {
    if (!VALID_STATUSES.includes(status as KitchenOrder['status'])) {
      throw new Error(`Invalid kitchen status: ${status}`);
    }
    return this.kitchenRepo.updateOrderStatus(orderId, status);
  }

  async addTask(orderId: number, label: string): Promise<KitchenTask> {
    if (!label || !label.trim()) {
      throw new Error('Task label is required');
    }
    return this.kitchenRepo.addTask(orderId, label.trim());
  }

  async toggleTask(taskId: number): Promise<boolean> {
    return this.kitchenRepo.toggleTask(taskId);
  }

  async deleteTask(taskId: number): Promise<boolean> {
    return this.kitchenRepo.deleteTask(taskId);
  }
}
