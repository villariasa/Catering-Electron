import electron from 'electron';
const { app, BrowserWindow, ipcMain, Menu, dialog } = electron;
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Completely remove default Electron native menu bar (File, Edit, View, Window, Help)
Menu.setApplicationMenu(null);
app.disableHardwareAcceleration();

import { getDatabase, closeDatabase } from './database/connection';
import { runMigrations } from './database/migration-runner';

import { CustomerRepository } from './database/repositories/customer.repository';
import { BookingRepository } from './database/repositories/booking.repository';
import { PackageRepository } from './database/repositories/package.repository';
import { ExpenseRepository } from './database/repositories/expense.repository';
import { UserRepository } from './database/repositories/user.repository';

import { CustomerService } from './services/customer.service';
import { BookingService } from './services/booking.service';
import { PackageService } from './services/package.service';
import { ExpenseService } from './services/expense.service';
import { AuthService } from './services/auth.service';
import { PdfExporterService } from './services/pdf-exporter.service';
import { MigrationToolService } from './services/migration-tool.service';
import { logger } from './services/logger.service';

let mainWindow: BrowserWindow | null = null;
let currentDbVersion = 0;

async function createWindow() {
  logger.info('Creating main application window...');
  mainWindow = new BrowserWindow({
    width: 1360,
    height: 860,
    minWidth: 1024,
    minHeight: 700,
    title: "Jayraldine's Catering Desktop",
    frame: true,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    await mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    await mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'));
  }
}

async function initializeApp() {
  try {
    logger.info('Initializing SQLite database connection and migrations...');
    const db = await getDatabase();
    currentDbVersion = await runMigrations(db);
    logger.info(`Database ready. Current migration version: ${currentDbVersion}`);

    const userRepo = new UserRepository(db);
    const customerRepo = new CustomerRepository(db);
    const bookingRepo = new BookingRepository(db);
    const packageRepo = new PackageRepository(db);
    const expenseRepo = new ExpenseRepository(db);

    const authService = new AuthService(userRepo);
    const customerService = new CustomerService(customerRepo);
    const bookingService = new BookingService(bookingRepo);
    const packageService = new PackageService(packageRepo);
    const expenseService = new ExpenseService(expenseRepo);
    const pdfExporterService = new PdfExporterService();
    const migrationToolService = new MigrationToolService(db);

    // Register Daily Log IPC Handlers
    ipcMain.handle('logs:getActiveLogPath', () => logger.getActiveLogPath());
    ipcMain.handle('logs:readActiveLogContent', () => logger.readActiveLogContent());
    ipcMain.handle('logs:openLogFolder', () => logger.openLogFolder());

    // Register Window Control IPC Handlers
    ipcMain.handle('window:minimize', () => mainWindow?.minimize());
    ipcMain.handle('window:maximize', () => {
      if (mainWindow?.isMaximized()) {
        mainWindow.unmaximize();
      } else {
        mainWindow?.maximize();
      }
    });
    ipcMain.handle('window:close', () => mainWindow?.close());

    // Register Auth IPC Handlers
    ipcMain.handle('auth:login', (_, { username, password }) => authService.login(username, password));
    ipcMain.handle('auth:logout', () => authService.logout());
    ipcMain.handle('auth:getCurrentUser', () => authService.getCurrentUser());

    // Register System IPC Handlers
    ipcMain.handle('system:ping', () => 'pong');
    ipcMain.handle('system:info', async () => {
      const bookings = await bookingService.getAllBookings();
      const customers = await customerService.getAllCustomers();
      const expenses = await expenseService.getAllExpenses();

      const totalRevenue = bookings
        .filter((b) => b.status === 'CONFIRMED' || b.status === 'COMPLETED')
        .reduce((sum, b) => sum + (b.total_amount || 0), 0);

      const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

      return {
        version: '5.0.0',
        db_version: currentDbVersion,
        db_path: app.getPath('userData'),
        platform: process.platform,
        total_bookings: bookings.length,
        total_customers: customers.length,
        total_revenue: totalRevenue,
        total_expenses: totalExpenses,
      };
    });

    // Customer IPC
    ipcMain.handle('customers:getAll', () => customerService.getAllCustomers());
    ipcMain.handle('customers:create', (_, data) => customerService.createCustomer(data));
    ipcMain.handle('customers:delete', (_, id) => customerService.deleteCustomer(id));

    // Booking IPC
    ipcMain.handle('bookings:getAll', () => bookingService.getAllBookings());
    ipcMain.handle('bookings:create', (_, data) => bookingService.createBooking(data));
    ipcMain.handle('bookings:updateStatus', (_, { id, status }) => bookingService.updateBookingStatus(id, status));
    ipcMain.handle('bookings:delete', (_, id) => bookingService.deleteBooking(id));

    // Package IPC
    ipcMain.handle('packages:getAll', () => packageService.getAllPackages());
    ipcMain.handle('packages:create', (_, data) => packageService.createPackage(data));

    // Expense IPC
    ipcMain.handle('expenses:getAll', () => expenseService.getAllExpenses());
    ipcMain.handle('expenses:create', (_, data) => expenseService.createExpense(data));

    // Reports IPC (Phase 8)
    ipcMain.handle('reports:exportCalendarPdf', async (_, args) => {
      try {
        let savePath = typeof args === 'string' ? args : args?.savePath;
        const year = args?.year || 2026;
        const month = args?.month || 8;

        if (!savePath) {
          const result = await dialog.showSaveDialog(mainWindow!, {
            title: 'Save Landscape Wall Calendar PDF',
            defaultPath: `jayraldines_calendar_${year}_${month}.pdf`,
            filters: [{ name: 'PDF Documents', extensions: ['pdf'] }]
          });
          if (result.canceled || !result.filePath) return false;
          savePath = result.filePath;
        }

        const bookings = await bookingService.getAllBookings();
        return await pdfExporterService.exportCalendarPdf(savePath, year, month, bookings);
      } catch (err) {
        console.error('[Main] PDF export exception:', err);
        return false;
      }
    });

    // Migration Tool IPC (Phase 9)
    ipcMain.handle('migration:migrateFromLegacyDb', (_, legacyPath) => {
      return migrationToolService.migrateFromLegacyDb(legacyPath);
    });

    await createWindow();
  } catch (err) {
    console.error('[Main] Failed to initialize application:', err);
  }
}


app.whenReady().then(initializeApp);

app.on('window-all-closed', () => {
  closeDatabase();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
