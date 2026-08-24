import fs from 'fs';
import path from 'path';
import { app, shell } from 'electron';

export class LoggerService {
  private logDir: string;
  private currentDateStr: string = '';
  private currentLogPath: string = '';

  constructor() {
    try {
      this.logDir = path.join(app.getPath('userData'), 'logs');
    } catch {
      this.logDir = path.join(process.cwd(), 'logs');
    }

    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }

    this.initDailyLogFile();
    this.registerGlobalErrorHooks();
  }

  private getTodayStr(): string {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private initDailyLogFile() {
    const today = this.getTodayStr();
    if (today !== this.currentDateStr || !this.currentLogPath) {
      this.currentDateStr = today;
      this.currentLogPath = path.join(this.logDir, `app_${today}.log`);
      
      const header = `============================================================\n` +
                     `Jayraldine's Catering Desktop v5.0.0 Daily Log Session\n` +
                     `Date: ${today} | OS: ${process.platform} ${process.arch}\n` +
                     `Log File: ${this.currentLogPath}\n` +
                     `============================================================\n\n`;

      if (!fs.existsSync(this.currentLogPath)) {
        fs.writeFileSync(this.currentLogPath, header, { encoding: 'utf8' });
      }
    }
  }

  private write(level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG', message: string, meta?: any) {
    try {
      this.initDailyLogFile();
      const timeStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
      let logLine = `[${timeStr}] [${level}] ${message}`;
      if (meta) {
        if (meta instanceof Error) {
          logLine += `\nStack: ${meta.stack}`;
        } else {
          logLine += ` ${JSON.stringify(meta)}`;
        }
      }
      logLine += '\n';

      fs.appendFileSync(this.currentLogPath, logLine, { encoding: 'utf8' });
      console.log(logLine.trim());
    } catch (err) {
      console.error('[LoggerService] Failed to write log:', err);
    }
  }

  public info(message: string, meta?: any) {
    this.write('INFO', message, meta);
  }

  public warn(message: string, meta?: any) {
    this.write('WARN', message, meta);
  }

  public error(message: string, meta?: any) {
    this.write('ERROR', message, meta);
  }

  public getActiveLogPath(): string {
    this.initDailyLogFile();
    return this.currentLogPath;
  }

  public readActiveLogContent(maxLines = 100): string {
    this.initDailyLogFile();
    if (!fs.existsSync(this.currentLogPath)) return 'No log entries recorded today yet.';
    const content = fs.readFileSync(this.currentLogPath, 'utf8');
    const lines = content.split('\n');
    return lines.slice(-maxLines).join('\n');
  }

  public openLogFolder() {
    if (fs.existsSync(this.logDir)) {
      shell.openPath(this.logDir);
    }
  }

  private registerGlobalErrorHooks() {
    process.on('uncaughtException', (err) => {
      this.error('Uncaught Exception caught by LoggerService:', err);
    });

    process.on('unhandledRejection', (reason) => {
      this.error('Unhandled Promise Rejection caught by LoggerService:', reason);
    });
  }
}

export const logger = new LoggerService();
