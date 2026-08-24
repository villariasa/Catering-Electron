import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import electron from 'electron';
const app = electron?.app;

let dbInstance: sqlite3.Database | null = null;

export function getDatabase(): Promise<sqlite3.Database> {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      return resolve(dbInstance);
    }

    const userDataPath = app ? app.getPath('userData') : path.join(process.cwd(), '.data');
    if (!fs.existsSync(userDataPath)) {
      fs.mkdirSync(userDataPath, { recursive: true });
    }

    const dbPath = path.join(userDataPath, 'electron-test.db');
    console.log(`[Database] Connecting to SQLite database at: ${dbPath}`);

    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('[Database] Failed to open SQLite database:', err);
        return reject(err);
      }
      
      db.run('PRAGMA journal_mode = WAL;');
      db.run('PRAGMA foreign_keys = ON;', (pragmaErr) => {
        if (pragmaErr) console.warn('[Database] Pragma error:', pragmaErr);
        dbInstance = db;
        resolve(dbInstance);
      });
    });
  });
}

export function closeDatabase(): Promise<void> {
  return new Promise((resolve) => {
    if (dbInstance) {
      dbInstance.close(() => {
        dbInstance = null;
        resolve();
      });
    } else {
      resolve();
    }
  });
}

export function queryAll<T>(db: sqlite3.Database, sql: string, params: any[] = []): Promise<T[]> {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows as T[]);
    });
  });
}

export function queryGet<T>(db: sqlite3.Database, sql: string, params: any[] = []): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row as T);
    });
  });
}

export function queryRun(db: sqlite3.Database, sql: string, params: any[] = []): Promise<{ lastID: number; changes: number }> {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

export function queryExec(db: sqlite3.Database, sql: string): Promise<void> {
  return new Promise((resolve, reject) => {
    db.exec(sql, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}
