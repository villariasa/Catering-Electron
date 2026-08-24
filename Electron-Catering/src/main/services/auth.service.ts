import crypto from 'crypto';
import type { UserRepository } from '../database/repositories/user.repository';
import type { User } from '../../preload/types';

export class AuthService {
  private currentUser: User | null = null;

  constructor(private userRepo: UserRepository) {}

  public hashPassword(password: string): string {
    return crypto.createHash('sha256').update(password).digest('hex');
  }

  async login(username: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
    const userRecord = await this.userRepo.findByUsername(username.trim().toLowerCase());
    if (!userRecord) {
      return { success: false, error: 'Invalid username or password' };
    }

    const inputHash = this.hashPassword(password);
    if (inputHash !== userRecord.password_hash) {
      return { success: false, error: 'Invalid username or password' };
    }

    const user: User = {
      id: userRecord.id,
      username: userRecord.username,
      full_name: userRecord.full_name,
      role: 'OWNER',
      created_at: userRecord.created_at,
    };

    this.currentUser = user;
    console.log(`[AuthService] Owner logged in successfully: ${user.full_name}`);
    return { success: true, user };
  }

  async logout(): Promise<boolean> {
    console.log(`[AuthService] Owner logged out.`);
    this.currentUser = null;
    return true;
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }
}
