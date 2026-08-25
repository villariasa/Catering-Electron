import type sqlite3 from 'sqlite3';
import type { User } from '../../../preload/types';
import { queryGet } from '../connection';

export interface UserRecord extends User {
  password_hash: string;
}

export class UserRepository {
  constructor(private db: sqlite3.Database) {}

  async findByUsername(username: string): Promise<UserRecord | undefined> {
    return queryGet<UserRecord>(
      this.db,
      `SELECT usr_id as id, usr_username as username, usr_password_hash as password_hash,
              usr_full_name as full_name, usr_role as role, usr_created_at as created_at
       FROM users
       WHERE usr_username = ?`,
      [username]
    );
  }
}
