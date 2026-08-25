import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import electron from 'electron';
const app = electron?.app;

let dbInstance: sqlite3.Database | null = null;
let dbFilePath: string | null = null;

export function getDatabasePath(): string {
  if (dbFilePath) return dbFilePath;
  const userDataPath = app ? app.getPath('userData') : path.join(process.cwd(), '.data');
  return path.join(userDataPath, 'electron-test.db');
}

export async function getDatabase(): Promise<sqlite3.Database> {
  if (dbInstance) return dbInstance;

  const userDataPath = app ? app.getPath('userData') : path.join(process.cwd(), '.data');
  if (!fs.existsSync(userDataPath)) {
    fs.mkdirSync(userDataPath, { recursive: true });
  }

  const dbPath = path.join(userDataPath, 'electron-test.db');
  dbFilePath = dbPath;
  console.log(`[Database] Connecting to SQLite database at: ${dbPath}`);

  const db = await new Promise<sqlite3.Database>((resolve, reject) => {
    const d = new sqlite3.Database(dbPath, (err) => {
      if (err) reject(err);
      else resolve(d);
    });
  });

  await queryExec(db, 'PRAGMA journal_mode = WAL');
  await queryExec(db, 'PRAGMA synchronous = NORMAL');
  await queryExec(db, 'PRAGMA foreign_keys = ON');

  dbInstance = db;
  return dbInstance;
}

export async function closeDatabase(): Promise<void> {
  if (dbInstance) {
    await new Promise<void>((resolve, reject) => {
      dbInstance!.close((err) => (err ? reject(err) : resolve()));
    });
    dbInstance = null;
  }
}

export async function queryAll<T>(db: sqlite3.Database, sql: string, params: any[] = []): Promise<T[]> {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows as T[])));
  });
}

export async function queryGet<T>(db: sqlite3.Database, sql: string, params: any[] = []): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row as T | undefined)));
  });
}

export async function queryRun(db: sqlite3.Database, sql: string, params: any[] = []): Promise<{ lastID: number; changes: number }> {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (this: sqlite3.RunResult, err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

export async function queryExec(db: sqlite3.Database, sql: string): Promise<void> {
  return new Promise((resolve, reject) => {
    db.exec(sql, (err) => (err ? reject(err) : resolve()));
  });
}
