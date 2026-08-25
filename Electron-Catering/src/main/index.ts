import electron from 'electron';
const { app, BrowserWindow, ipcMain, Menu, dialog } = electron;
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI } from '@google/generative-ai';

import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// This host's GPU/GBM stack can't export DMA-BUF planes (Chromium logs a flood of
// gbm_wrapper.cc errors and the process is left in a state where even unrelated
// native module loads, like better-sqlite3, start failing). Disabling hardware
// acceleration avoids that whole failure path; software-rendered backdrop-filter
// blur is a worthwhile tradeoff over the app not launching at all.
app.disableHardwareAcceleration();

// Completely remove default Electron native menu bar (File, Edit, View, Window, Help)
Menu.setApplicationMenu(null);

import { getDatabase, closeDatabase, getDatabasePath } from './database/connection';
import { runMigrations } from './database/migration-runner';

import { CustomerRepository } from './database/repositories/customer.repository';
import { BookingRepository } from './database/repositories/booking.repository';
import { PackageRepository } from './database/repositories/package.repository';
import { ExpenseRepository } from './database/repositories/expense.repository';
import { UserRepository } from './database/repositories/user.repository';
import { BillingRepository } from './database/repositories/billing.repository';
import { KitchenRepository } from './database/repositories/kitchen.repository';
import { CashFlowRepository } from './database/repositories/cashflow.repository';
import { MenuItemRepository } from './database/repositories/menuitem.repository';
import { SettingsRepository } from './database/repositories/settings.repository';
import { CalendarRepository } from './database/repositories/calendar.repository';
import { AuditRepository } from './database/repositories/audit.repository';

import { CustomerService } from './services/customer.service';
import { BookingService } from './services/booking.service';
import { PackageService } from './services/package.service';
import { ExpenseService } from './services/expense.service';
import { AuthService } from './services/auth.service';
import { BillingService } from './services/billing.service';
import { KitchenService } from './services/kitchen.service';
import { CashFlowService } from './services/cashflow.service';
import { MenuItemService } from './services/menuitem.service';
import { SettingsService } from './services/settings.service';
import { CalendarService } from './services/calendar.service';
import { AuditService } from './services/audit.service';
import { EmailService } from './services/email.service';
import { PdfExporterService } from './services/pdf-exporter.service';
import { MigrationToolService } from './services/migration-tool.service';
import { logger } from './services/logger.service';

// Gemini AI client (Google Generative AI)
const GEMINI_API_KEY = 'AIzaSyDKGhi-taHlCa_2WabBC5BDXIr5CXd1PJM';
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

let mainWindow: BrowserWindow | null = null;
let currentDbVersion = 0;

async function createWindow() {
  logger.info('Creating main application window...');
  const preloadPath = fs.existsSync(path.join(__dirname, '../preload/index.cjs'))
    ? path.join(__dirname, '../preload/index.cjs')
    : fs.existsSync(path.join(__dirname, '../preload/index.mjs'))
    ? path.join(__dirname, '../preload/index.mjs')
    : path.join(__dirname, '../preload/index.js');

  logger.info(`Using preload script at: ${preloadPath}`);

  mainWindow = new BrowserWindow({
    width: 1360,
    height: 860,
    minWidth: 1024,
    minHeight: 700,
    title: "Jayraldine's Catering Desktop",
    frame: true,
    show: true,
    center: true,
    webPreferences: {
      preload: preloadPath,
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.once('ready-to-show', () => {
    logger.info('Main window ready to show.');
    mainWindow?.show();
    mainWindow?.focus();
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    logger.info(`Loading dev server URL: ${process.env.VITE_DEV_SERVER_URL}`);
    await mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    // Bring window to front
    mainWindow.show();
    mainWindow.focus();
    mainWindow.webContents.openDevTools();
  } else {
    logger.info('Loading static dist/index.html');
    await mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'));
    mainWindow.show();
    mainWindow.focus();
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
    const billingRepo = new BillingRepository(db);
    const kitchenRepo = new KitchenRepository(db);
    const cashFlowRepo = new CashFlowRepository(db);
    const menuItemRepo = new MenuItemRepository(db);
    const settingsRepo = new SettingsRepository(db);
    const calendarRepo = new CalendarRepository(db);
    const auditRepo = new AuditRepository(db);

    const auditService = new AuditService(auditRepo);
    const emailService = new EmailService();

    const authService = new AuthService(userRepo);
    const customerService = new CustomerService(customerRepo);
    const bookingService = new BookingService(bookingRepo, customerRepo, settingsRepo, auditService, emailService);
    const packageService = new PackageService(packageRepo);
    const expenseService = new ExpenseService(expenseRepo);
    const billingService = new BillingService(billingRepo, auditService);
    const kitchenService = new KitchenService(kitchenRepo);
    const cashFlowService = new CashFlowService(cashFlowRepo);
    const menuItemService = new MenuItemService(menuItemRepo);
    const settingsService = new SettingsService(settingsRepo, emailService);
    const calendarService = new CalendarService(calendarRepo);
    const pdfExporterService = new PdfExporterService();
    const migrationToolService = new MigrationToolService(db);

    // Register Daily Log IPC Handlers
    ipcMain.handle('logs:getActiveLogPath', () => logger.getActiveLogPath());
    ipcMain.handle('logs:readActiveLogContent', () => logger.readActiveLogContent());
    ipcMain.handle('logs:openLogFolder', () => logger.openLogFolder());

    // Register Dashboard Stats IPC Handler
    ipcMain.handle('dashboard:getStats', async (_, period: 'Weekly' | 'Monthly' | 'Yearly') => {
      const allBookings = await bookingService.getAllBookings();
      const allExpenses = await expenseService.getAllExpenses();
      const now = new Date();

      // ── KPI Totals (all-time from non-cancelled bookings) ──
      const activeBookings = allBookings.filter(b => b.status !== 'CANCELLED');
      const grossRevenue = allBookings
        .filter(b => b.status === 'CONFIRMED' || b.status === 'COMPLETED')
        .reduce((s, b) => s + (b.total_amount || 0), 0);
      const operatingExpenses = allExpenses.reduce((s, e) => s + (e.amount || 0), 0);
      const netProfit = grossRevenue - operatingExpenses;
      const netMarginPct = grossRevenue > 0 ? Math.round((netProfit / grossRevenue) * 1000) / 10 : 0;

      // ── Chart Data generation ──
      const chartData: { label: string; revenue: number; expenses: number }[] = [];

      if (period === 'Weekly') {
        // Last 7 days: Mon–Sun labels
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        for (let i = 6; i >= 0; i--) {
          const d = new Date(now);
          d.setDate(now.getDate() - i);
          const iso = d.toISOString().split('T')[0];
          const label = days[d.getDay()];
          const revenue = allBookings
            .filter(b => (b.status === 'CONFIRMED' || b.status === 'COMPLETED') && b.event_date === iso)
            .reduce((s, b) => s + (b.total_amount || 0), 0);
          const expenses = allExpenses
            .filter(e => e.expense_date === iso)
            .reduce((s, e) => s + (e.amount || 0), 0);
          chartData.push({ label, revenue, expenses });
        }
      } else if (period === 'Monthly') {
        // Last 12 months
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        for (let i = 11; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const year = d.getFullYear();
          const month = d.getMonth(); // 0-indexed
          const label = `${months[month]}`;
          const revenue = allBookings
            .filter(b => {
              if (b.status !== 'CONFIRMED' && b.status !== 'COMPLETED') return false;
              const bd = new Date(b.event_date);
              return bd.getFullYear() === year && bd.getMonth() === month;
            })
            .reduce((s, b) => s + (b.total_amount || 0), 0);
          const expenses = allExpenses
            .filter(e => {
              const ed = new Date(e.expense_date);
              return ed.getFullYear() === year && ed.getMonth() === month;
            })
            .reduce((s, e) => s + (e.amount || 0), 0);
          chartData.push({ label, revenue, expenses });
        }
      } else {
        // Yearly: last 5 years
        for (let i = 4; i >= 0; i--) {
          const year = now.getFullYear() - i;
          const revenue = allBookings
            .filter(b => {
              if (b.status !== 'CONFIRMED' && b.status !== 'COMPLETED') return false;
              return new Date(b.event_date).getFullYear() === year;
            })
            .reduce((s, b) => s + (b.total_amount || 0), 0);
          const expenses = allExpenses
            .filter(e => new Date(e.expense_date).getFullYear() === year)
            .reduce((s, e) => s + (e.amount || 0), 0);
          chartData.push({ label: String(year), revenue, expenses });
        }
      }

      // ── Upcoming Events: future bookings, not cancelled, sorted by event_date ASC ──
      const todayIso = now.toISOString().split('T')[0];
      const upcomingEvents = allBookings
        .filter(b => b.status !== 'CANCELLED' && b.event_date >= todayIso)
        .sort((a, b) => a.event_date.localeCompare(b.event_date))
        .slice(0, 5)
        .map(b => ({
          id: b.id!,
          name: b.customer_name,
          occasion: b.occasion,
          event_date: b.event_date,
          event_time: b.event_time || '18:00',
          venue: b.venue,
          pax: b.pax,
          status: b.status,
          total_amount: b.total_amount,
          amount_paid: b.amount_paid,
          balance: b.balance,
        }));

      // ── Additional KPIs matching the Python dashboard (today's events/pax, pending, unpaid, downpayment) ──
      const todayEvents = allBookings.filter(b => b.status !== 'CANCELLED' && b.event_date === todayIso);
      const todayEventsCount = todayEvents.length;
      const todayPax = todayEvents.reduce((s, b) => s + (b.pax || 0), 0);
      const pendingBookingsCount = allBookings.filter(b => b.status === 'PENDING').length;

      const allInvoices = await billingService.getAllInvoices();
      const unpaidInvoicesTotal = allInvoices.reduce((s, inv) => s + (inv.status !== 'Paid' ? inv.balance : 0), 0);

      const downpaymentReceivedToday = (await billingService.getAllPayments())
        .filter(p => p.payment_date === todayIso)
        .reduce((s, p) => s + p.amount, 0);

      const recentActivity = await auditService.getRecent(8);
      const followUpsDueToday = await customerService.getDueTodayFollowUps();

      return {
        totalActiveBookings: activeBookings.filter(b => b.status === 'PENDING' || b.status === 'CONFIRMED').length,
        grossRevenue,
        operatingExpenses,
        netProfit,
        netMarginPct,
        chartData,
        upcomingEvents,
        todayEventsCount,
        todayPax,
        pendingBookingsCount,
        unpaidInvoicesTotal,
        downpaymentReceivedToday,
        recentActivity,
        followUpsDueToday,
      };
    });

    // Real report aggregation, shared by the getReportData IPC handler and the PDF export.
    async function computeReportData(period: 'Today' | 'This Week' | 'This Month' | 'This Year' | 'All Time') {
      const now = new Date();
      const todayIso = now.toISOString().split('T')[0];
      const allBookings = await bookingService.getAllBookings();
      const allPackages = await packageService.getAllPackages();
      const allInvoices = await billingService.getAllInvoices();

      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      const startOfWeekIso = startOfWeek.toISOString().split('T')[0];
      const startOfMonthIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
      const startOfYearIso = `${now.getFullYear()}-01-01`;

      const inPeriod = (dateStr: string) => {
        if (period === 'Today') return dateStr === todayIso;
        if (period === 'This Week') return dateStr >= startOfWeekIso;
        if (period === 'This Month') return dateStr >= startOfMonthIso;
        if (period === 'This Year') return dateStr >= startOfYearIso;
        return true; // All Time
      };

      const periodBookings = allBookings.filter((b) => b.status !== 'CANCELLED' && inPeriod(b.event_date));
      const revenueBookings = periodBookings.filter((b) => b.status === 'CONFIRMED' || b.status === 'COMPLETED');

      const totalRevenue = revenueBookings.reduce((s, b) => s + (b.total_amount || 0), 0);
      const totalPax = periodBookings.reduce((s, b) => s + (b.pax || 0), 0);
      const unpaidTotal = allInvoices.filter((inv) => inv.status !== 'Paid').reduce((s, inv) => s + inv.balance, 0);

      // Monthly revenue trend (last 12 months, all-time regardless of period filter — for the chart)
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthlyRevenue: { month: string; revenue: number }[] = [];
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const revenue = allBookings
          .filter((b) => (b.status === 'CONFIRMED' || b.status === 'COMPLETED') && new Date(b.event_date).getFullYear() === d.getFullYear() && new Date(b.event_date).getMonth() === d.getMonth())
          .reduce((s, b) => s + (b.total_amount || 0), 0);
        monthlyRevenue.push({ month: months[d.getMonth()], revenue });
      }

      // Occasion breakdown
      const occasionCounts = new Map<string, number>();
      for (const b of periodBookings) {
        occasionCounts.set(b.occasion, (occasionCounts.get(b.occasion) || 0) + 1);
      }
      const occasionBreakdown = Array.from(occasionCounts.entries())
        .map(([name, count]) => ({ name, count, share: periodBookings.length > 0 ? Math.round((count / periodBookings.length) * 100) : 0 }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 6);

      // Payment method breakdown (single query instead of one per invoice)
      const methodTotals = new Map<string, number>();
      for (const p of await billingService.getAllPayments()) {
        methodTotals.set(p.method, (methodTotals.get(p.method) || 0) + p.amount);
      }
      const totalPaymentVolume = Array.from(methodTotals.values()).reduce((s, v) => s + v, 0);
      const paymentMethods = Array.from(methodTotals.entries())
        .map(([name, amount]) => ({ name, amount, percentage: totalPaymentVolume > 0 ? Math.round((amount / totalPaymentVolume) * 100) : 0 }))
        .sort((a, b) => b.amount - a.amount);

      // Top packages by revenue (real — booking_ref join, no fabricated dish-level data)
      const packageStats = new Map<number, { name: string; orders: number; revenue: number }>();
      for (const b of revenueBookings) {
        if (!b.package_id) continue;
        const pkg = allPackages.find((p) => p.id === b.package_id);
        if (!pkg) continue;
        const existing = packageStats.get(b.package_id) || { name: pkg.name, orders: 0, revenue: 0 };
        existing.orders += 1;
        existing.revenue += b.total_amount;
        packageStats.set(b.package_id, existing);
      }
      const topPackages = Array.from(packageStats.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 8);

      return {
        totalBookings: periodBookings.length,
        totalRevenue,
        totalPax,
        unpaidTotal,
        todayBookings: allBookings.filter((b) => b.status !== 'CANCELLED' && b.event_date === todayIso).length,
        weekBookings: allBookings.filter((b) => b.status !== 'CANCELLED' && b.event_date >= startOfWeekIso).length,
        monthlyRevenue,
        occasionBreakdown,
        paymentMethods,
        topPackages,
      };
    }

    ipcMain.handle('reports:getReportData', (_, period) => computeReportData(period));

    ipcMain.handle('reports:exportFinancialPdf', async (_, args) => {
      const period = args?.period || 'All Time';
      const business = await settingsService.getBusinessInfo();
      const result = await dialog.showSaveDialog(mainWindow!, {
        title: 'Save Financial Report PDF',
        defaultPath: `jayraldines_financial_report_${new Date().toISOString().slice(0, 10)}.pdf`,
        filters: [{ name: 'PDF Documents', extensions: ['pdf'] }],
      });
      if (result.canceled || !result.filePath) return false;

      const reportData = await computeReportData(period);
      const pdfBytes = await pdfExporterService.generateFinancialReportPdf(reportData, business, period);
      fs.writeFileSync(result.filePath, pdfBytes);
      return true;
    });

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
    ipcMain.handle('system:relaunch', () => {
      app.relaunch();
      app.exit(0);
    });
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
    ipcMain.handle('customers:getFollowUps', (_, customerId) => customerService.getFollowUps(customerId));
    ipcMain.handle('customers:addFollowUp', (_, { customerId, followUpDate, note }) => customerService.addFollowUp(customerId, followUpDate, note));
    ipcMain.handle('customers:toggleFollowUp', (_, id) => customerService.toggleFollowUp(id));
    ipcMain.handle('customers:deleteFollowUp', (_, id) => customerService.deleteFollowUp(id));

    // Booking IPC
    ipcMain.handle('bookings:getAll', () => bookingService.getAllBookings());
    ipcMain.handle('bookings:create', (_, data) => bookingService.createBooking(data));
    ipcMain.handle('bookings:updateStatus', (_, { id, status, cancellationReason }) => bookingService.updateBookingStatus(id, status, cancellationReason));
    ipcMain.handle('bookings:delete', (_, id) => bookingService.deleteBooking(id));

    // Billing / Invoices / Payments IPC
    ipcMain.handle('invoices:getAll', () => billingService.getAllInvoices());
    ipcMain.handle('invoices:getPayments', (_, invoiceId) => billingService.getPaymentHistory(invoiceId));
    ipcMain.handle('invoices:recordPayment', (_, data) =>
      billingService.recordPayment(data.invoiceId, data.amount, data.paymentDate, data.method, data.referenceNo, data.notes)
    );

    // Kitchen Display System IPC
    ipcMain.handle('kitchen:getAllOrders', () => kitchenService.getAllOrders());
    ipcMain.handle('kitchen:updateOrderStatus', (_, { orderId, status }) => kitchenService.updateOrderStatus(orderId, status));
    ipcMain.handle('kitchen:addTask', (_, { orderId, label }) => kitchenService.addTask(orderId, label));
    ipcMain.handle('kitchen:toggleTask', (_, taskId) => kitchenService.toggleTask(taskId));
    ipcMain.handle('kitchen:deleteTask', (_, taskId) => kitchenService.deleteTask(taskId));

    // Cash Flow Ledger IPC
    ipcMain.handle('cashFlow:getAll', () => cashFlowService.getAll());
    ipcMain.handle('cashFlow:getSummary', () => cashFlowService.getSummary());
    ipcMain.handle('cashFlow:create', (_, data) => cashFlowService.create(data));
    ipcMain.handle('cashFlow:delete', (_, id) => cashFlowService.delete(id));

    // Settings: Business Info & Occasions IPC
    ipcMain.handle('settings:getBusinessInfo', () => settingsService.getBusinessInfo());
    ipcMain.handle('settings:updateBusinessInfo', (_, data) => settingsService.updateBusinessInfo(data));
    ipcMain.handle('settings:getOccasions', () => settingsService.getOccasions());
    ipcMain.handle('settings:addOccasion', (_, name) => settingsService.addOccasion(name));
    ipcMain.handle('settings:deleteOccasion', (_, id) => settingsService.deleteOccasion(id));

    // Settings: Real Database Backup & Restore IPC
    ipcMain.handle('settings:backupDatabase', async () => {
      const dbPath = getDatabasePath();
      const defaultName = `jayraldines_backup_${new Date().toISOString().slice(0, 10)}.db`;
      const result = await dialog.showSaveDialog(mainWindow!, {
        title: 'Save Database Backup',
        defaultPath: defaultName,
        filters: [{ name: 'SQLite Database', extensions: ['db'] }],
      });
      if (result.canceled || !result.filePath) return { success: false };
      fs.copyFileSync(dbPath, result.filePath);
      return { success: true, path: result.filePath };
    });

    ipcMain.handle('settings:restoreDatabase', async () => {
      const result = await dialog.showOpenDialog(mainWindow!, {
        title: 'Select Database Backup to Restore',
        filters: [{ name: 'SQLite Database', extensions: ['db', 'sqlite'] }],
        properties: ['openFile'],
      });
      if (result.canceled || !result.filePaths[0]) return { success: false };

      const dbPath = getDatabasePath();
      await closeDatabase();
      fs.copyFileSync(result.filePaths[0], dbPath);
      return { success: true, requiresRestart: true };
    });

    // Manual Calendar Events IPC
    ipcMain.handle('calendarEvents:getForMonth', (_, { year, month }) => calendarService.getForMonth(year, month));
    ipcMain.handle('calendarEvents:create', (_, data) => calendarService.create(data));
    ipcMain.handle('calendarEvents:delete', (_, id) => calendarService.delete(id));

    // Audit Log IPC
    ipcMain.handle('audit:getRecent', (_, limit) => auditService.getRecent(limit));

    // Notifications IPC
    ipcMain.handle('notifications:getAll', () => auditService.getNotifications());
    ipcMain.handle('notifications:markRead', (_, id) => auditService.markNotificationRead(id));
    ipcMain.handle('notifications:clearAll', () => auditService.clearNotifications());
    ipcMain.handle('notifications:delete', (_, id) => auditService.deleteNotification(id));

    // Monthly Sales Targets IPC
    ipcMain.handle('settings:getSalesTargets', (_, year) => settingsService.getSalesTargets(year));
    ipcMain.handle('settings:setSalesTarget', (_, { year, month, amount }) => settingsService.setSalesTarget(year, month, amount));
    ipcMain.handle('settings:setYearlyTarget', (_, { year, amount }) => settingsService.setYearlyTarget(year, amount));

    // SMTP Test IPC
    ipcMain.handle('settings:testSmtp', () => settingsService.testSmtpConnection());

    // Receipt Email IPC (Billing / Bookings "Email Receipt" actions)
    ipcMain.handle('billing:emailReceipt', async (_, { invoiceId }) => {
      const invoice = await billingService.getAllInvoices().then((all) => all.find((i) => i.id === invoiceId));
      if (!invoice) return { success: false, error: 'Invoice not found' };

      const email = await customerService.getAllCustomers().then((all) => all.find((c) => c.name.trim().toLowerCase() === invoice.customer_name.trim().toLowerCase())?.email);
      if (!email) return { success: false, error: 'No email address on file for this customer.' };

      const business = await settingsService.getBusinessInfo();
      const pdfBytes = await pdfExporterService.generateReceiptPdf(invoice, business);

      const html = `
        <h2>Receipt — ${business.name || "Jayraldine's Catering"}</h2>
        <p>Hi ${invoice.customer_name},</p>
        <p>Attached is your receipt for invoice <strong>${invoice.invoice_ref}</strong> (Booking ${invoice.booking_ref}).</p>
        <p>Total: ₱${invoice.total_amount.toLocaleString()}<br/>
        Paid: ₱${invoice.amount_paid.toLocaleString()}<br/>
        Balance: ₱${invoice.balance.toLocaleString()}</p>
        <p>Thank you for choosing ${business.name || "Jayraldine's Catering"}!</p>
      `;

      const result = await emailService.sendMail(
        { host: business.smtp_host, port: business.smtp_port, user: business.smtp_user, pass: business.smtp_pass },
        email,
        `Receipt — ${invoice.invoice_ref}`,
        html,
        [{ filename: `${invoice.invoice_ref}.pdf`, content: Buffer.from(pdfBytes) }]
      );

      if (result.success) {
        await auditService.log('EMAIL_RECEIPT', 'invoices', invoiceId, `Emailed receipt ${invoice.invoice_ref} to ${email}`);
      }
      return result;
    });

    ipcMain.handle('billing:saveReceiptPdf', async (_, { invoiceId }) => {
      const invoice = await billingService.getAllInvoices().then((all) => all.find((i) => i.id === invoiceId));
      if (!invoice) return { success: false };

      const business = await settingsService.getBusinessInfo();
      const result = await dialog.showSaveDialog(mainWindow!, {
        title: 'Save Receipt PDF',
        defaultPath: `${invoice.invoice_ref}.pdf`,
        filters: [{ name: 'PDF Documents', extensions: ['pdf'] }],
      });
      if (result.canceled || !result.filePath) return { success: false };

      const pdfBytes = await pdfExporterService.generateReceiptPdf(invoice, business);
      fs.writeFileSync(result.filePath, pdfBytes);
      return { success: true, path: result.filePath };
    });

    // AI-generated document download (PDF bytes already generated in the ai:query tool call)
    ipcMain.handle('documents:savePdf', async (_, { filename, pdfBase64 }) => {
      const result = await dialog.showSaveDialog(mainWindow!, {
        title: 'Save Document',
        defaultPath: filename || 'document.pdf',
        filters: [{ name: 'PDF Documents', extensions: ['pdf'] }],
      });
      if (result.canceled || !result.filePath) return { success: false };
      fs.writeFileSync(result.filePath, Buffer.from(pdfBase64, 'base64'));
      return { success: true, path: result.filePath };
    });

    // Package IPC
    ipcMain.handle('packages:getAll', () => packageService.getAllPackages());
    ipcMain.handle('packages:create', (_, data) => packageService.createPackage(data));
    ipcMain.handle('packages:delete', (_, id) => packageService.deletePackage(id));
    ipcMain.handle('packages:getItemIds', (_, packageId) => packageService.getItemIdsForPackage(packageId));
    ipcMain.handle('packages:getItemCounts', () => packageService.getItemCounts());
    ipcMain.handle('packages:setItems', (_, { packageId, itemIds }) => packageService.setItemsForPackage(packageId, itemIds));

    // Menu Item ("Dishes") IPC
    ipcMain.handle('menuItems:getAll', () => menuItemService.getAll());
    ipcMain.handle('menuItems:create', (_, data) => menuItemService.create(data));
    ipcMain.handle('menuItems:delete', (_, id) => menuItemService.delete(id));

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

    // ── Chef Jay AI IPC: query Gemini with full DB context & conversation continuity ──
    ipcMain.handle('ai:query', async (_, payload: any) => {
      const userMessage = typeof payload === 'string' ? payload : payload?.message || '';
      const rawHistory: { role: 'user' | 'model'; text: string }[] = typeof payload === 'object' && Array.isArray(payload?.history) ? payload.history : [];
      const currentScreen: string = typeof payload === 'object' ? payload?.currentScreen || '' : '';

      try {
        // ── 1. Gather fresh DB snapshot for context ──
        const [allBookings, allCustomers, allExpenses, allPackages] = await Promise.all([
          bookingService.getAllBookings(),
          customerService.getAllCustomers(),
          expenseService.getAllExpenses(),
          packageService.getAllPackages(),
        ]);

        const grossRevenue = allBookings
          .filter(b => b.status === 'CONFIRMED' || b.status === 'COMPLETED')
          .reduce((s, b) => s + (b.total_amount || 0), 0);
        const totalExpenses = allExpenses.reduce((s, e) => s + (e.amount || 0), 0);
        const netProfit = grossRevenue - totalExpenses;

        // ── 2. System prompt with live snapshot & complete system knowledge ──
        const systemPrompt = `You are Chef Jay, the intelligent executive AI assistant embedded directly inside Jayraldine's Catering's own management desktop platform, based in Cebu City and owned and operated by Jayraldine Villarias.

## SYSTEM & APPLICATION OVERVIEW
As Chef Jay, you possess full awareness of Jayraldine's Catering's entire application architecture, modules, and capabilities:
1. **Dashboard Module**: Live financial KPIs (Gross Revenue, Operating Expenses, Net Profit Surplus & Net Margin %), interactive monthly Revenue vs Expenses charts, and event countdown timers for upcoming catering events.
2. **Bookings Management**: Complete event tracking (occasion, venue, date/time, pax count, package selection, status: PENDING / CONFIRMED / COMPLETED / CANCELLED). Tracks billing totals, downpayments, remaining balances, and payment statuses (Paid, Partial, Unpaid).
3. **Customer CRM**: Client profiles, contact numbers, email, delivery addresses, order history, and loyalty tiers (New, Regular, VIP). Includes interactive View Profile drawers.
4. **Financial Reports & Expenses**: Categorized operating expenses (Ingredients, Labor/Wages, Utilities, Transportation, Equipment, Marketing, Miscellaneous) with automated net surplus and margin calculations.
5. **Menu Packages**: Management of catering menu packages, price per pax, minimum guest (pax) requirements, and detailed menu item inclusions (e.g., Budget Fiesta Buffet, Executive Grand Buffet).
6. **AI Assistant (Chef Jay)**: Powered by live SQLite database queries and automated action tools (\`create_customer\`, \`delete_customer\`, \`create_booking\`, \`update_booking_status\`, \`delete_booking\`, \`create_expense\`, \`create_package\`). Form modal overlays allow easy manual entry without typing text.

## HOW TO ANSWER & RESPONSE COMPLETENESS
- **BE COMPLETE AND THOROUGH**: Always answer questions fully and completely. Never cut off mid-sentence, omit requested details, or provide truncated answers. If asked for a list, summary, breakdown, or explanation, provide the complete list or detailed explanation.
- **ANSWER DIRECTLY**: Read the actual question asked. Answer directly using the live database snapshot below or by executing tool functions to mutate the database.
- **DATA INTEGRITY**: Never fabricate data, customer names, dates, or amounts. If data is unavailable or cannot be looked up, state plainly what is missing.
- **NEVER GUESS ON MUTATIONS**: Before calling any write tool (\`create_customer\`, \`create_booking\`, \`create_expense\`, \`create_package\`, etc.), every required field must come explicitly from the user's message or prior conversation. Never invent, default, or assume a value (e.g. category, amount, date, name) the user did not actually provide — including when the request is vague, a typo, or just a short phrase like "add expense". In that case, ask the user for the missing details (or tell them to use the form) instead of calling the tool.
- **FORMATTING & TONE**: Use clean Markdown formatting, Philippine Peso currency (₱), bullet points for multi-item lists, and bold text for key numbers. Maintain a warm, business-first, executive tone.
- **CONVERSATION CONTINUITY**: Treat the chat as an ongoing continuous conversation with the owner. Understand context from previous messages without forcing repetition.
- **HOW TO ADDRESS THE USER**: Address the user simply as "owner" (e.g. "Hi owner," or no name at all) — never "Maam Jay", "Sir Jay", "Jayraldine", or any other honorific/name-based greeting.
- **DOCUMENT GENERATION**: You can generate downloadable PDF, Excel, or CSV files via the \`generate_document\` tool (bookings, customers, expenses, invoices, packages, cash flow, or a financial report). If the owner asks to "export", "generate a report", "download", "make me a PDF/Excel/CSV" etc. without specifying which data or which format, ask a short clarifying question first (e.g. "Sure — which data would you like (bookings, customers, expenses...) and in what format (PDF, Excel, or CSV)?") instead of guessing. Once both are clear, call the tool — the app will show the owner a preview before anything is actually downloaded, so you don't need to ask for a second confirmation after that.
- **SCREEN AWARENESS**: The user's current screen is given below as CURRENT SCREEN. If they ask something like "what am I looking at", "what is this page", "what can I do here", or anything implying they want guidance on their current screen, answer specifically about THAT screen's purpose and features (using the module descriptions above), and proactively guide them on what they can do next there — don't give a generic answer about the whole app.

${currentScreen ? `=== CURRENT SCREEN ===\nThe user is currently viewing: **${currentScreen}**\n` : ''}
=== LIVE DATABASE SNAPSHOT (${new Date().toLocaleString('en-PH')}) ===

FINANCIALS:
- Gross Revenue: ₱${grossRevenue.toLocaleString('en-PH')} | Expenses: ₱${totalExpenses.toLocaleString('en-PH')} | Net Profit: ₱${netProfit.toLocaleString('en-PH')}
- Active Bookings: ${allBookings.filter(b => b.status !== 'CANCELLED').length} | Customers: ${allCustomers.length} | Expenses: ${allExpenses.length}

BOOKINGS (${allBookings.length}):
${allBookings.map(b => `  [ID:${b.id}][${b.booking_ref}] ${b.customer_name} — ${b.occasion} | ${b.event_date} ${b.event_time||''} | ${b.pax}pax | Total:₱${b.total_amount.toLocaleString()} | Paid:₱${b.amount_paid.toLocaleString()} | Bal:₱${b.balance.toLocaleString()} | Status:${b.status} | Payment:${b.payment_status} | Venue:${b.venue}`).join('\n') || '  None'}

CUSTOMERS (${allCustomers.length}):
${allCustomers.map(c => `  [ID:${c.id}] ${c.name} | ${c.contact_number} | ${c.email||'no email'} | ${c.address||'no address'} | ${c.loyalty_tier} tier`).join('\n') || '  None'}

PACKAGES (${allPackages.length}):
${allPackages.map(p => `  [ID:${p.id}] ${p.name} | ₱${p.price_per_pax}/pax | Min:${p.min_pax}pax | ${p.description||''}`).join('\n') || '  None'}

EXPENSES (${allExpenses.length}):
${allExpenses.map(e => `  [ID:${e.id}] ${e.expense_date} | ${e.category}: ${e.description} | ₱${e.amount.toLocaleString()}`).join('\n') || '  None'}`;

        // ── 3. Gemini function declarations (tool schema) ──
        const tools = [{
          functionDeclarations: [
            // ── CUSTOMER TOOLS ──
            {
              name: 'create_customer',
              description: 'Add a new customer to the database.',
              parameters: {
                type: 'object' as const,
                properties: {
                  name: { type: 'string' as const, description: 'Full name of the customer' },
                  contact_number: { type: 'string' as const, description: 'Phone number (e.g. 09171234567)' },
                  email: { type: 'string' as const, description: 'Email address (optional)' },
                  address: { type: 'string' as const, description: 'Home or delivery address (optional)' },
                  loyalty_tier: { type: 'string' as const, description: 'Loyalty tier: New, Regular, or VIP' },
                },
                required: ['name', 'contact_number'],
              },
            },
            {
              name: 'delete_customer',
              description: 'Delete a customer by their ID.',
              parameters: {
                type: 'object' as const,
                properties: {
                  id: { type: 'number' as const, description: 'Customer ID from the database snapshot' },
                  name: { type: 'string' as const, description: 'Customer name (for confirmation message)' },
                },
                required: ['id'],
              },
            },
            // ── BOOKING TOOLS ──
            {
              name: 'create_booking',
              description: 'Create a new catering booking/reservation.',
              parameters: {
                type: 'object' as const,
                properties: {
                  customer_name: { type: 'string' as const, description: 'Full name of the client' },
                  occasion: { type: 'string' as const, description: 'Type of event (e.g. Wedding Reception, Birthday Party, Corporate Anniversary)' },
                  event_date: { type: 'string' as const, description: 'Event date in YYYY-MM-DD format' },
                  event_time: { type: 'string' as const, description: 'Event start time in HH:MM format (e.g. 18:00)' },
                  venue: { type: 'string' as const, description: 'Full venue name and address' },
                  pax: { type: 'number' as const, description: 'Number of guests (pax count)' },
                  total_amount: { type: 'number' as const, description: 'Total billing amount in pesos' },
                  amount_paid: { type: 'number' as const, description: 'Downpayment or amount already paid' },
                },
                required: ['customer_name', 'occasion', 'event_date', 'venue', 'pax', 'total_amount'],
              },
            },
            {
              name: 'update_booking_status',
              description: 'Update the status of an existing booking.',
              parameters: {
                type: 'object' as const,
                properties: {
                  id: { type: 'number' as const, description: 'Booking ID from the snapshot (the number in [ID:X])' },
                  status: { type: 'string' as const, description: 'New status: PENDING, CONFIRMED, COMPLETED, or CANCELLED' },
                  booking_ref: { type: 'string' as const, description: 'Booking reference for confirmation' },
                },
                required: ['id', 'status'],
              },
            },
            {
              name: 'delete_booking',
              description: 'Delete/remove a booking from the database.',
              parameters: {
                type: 'object' as const,
                properties: {
                  id: { type: 'number' as const, description: 'Booking ID to delete' },
                  booking_ref: { type: 'string' as const, description: 'Booking reference for confirmation' },
                },
                required: ['id'],
              },
            },
            // ── EXPENSE TOOLS ──
            {
              name: 'create_expense',
              description: 'Record a new business expense.',
              parameters: {
                type: 'object' as const,
                properties: {
                  category: { type: 'string' as const, description: 'Expense category: Ingredients, Labor/Wages, Utilities, Transportation, Equipment, Marketing, or Miscellaneous' },
                  description: { type: 'string' as const, description: 'What was purchased or spent on' },
                  amount: { type: 'number' as const, description: 'Amount spent in pesos' },
                  expense_date: { type: 'string' as const, description: 'Date of expense in YYYY-MM-DD format' },
                },
                required: ['category', 'description', 'amount', 'expense_date'],
              },
            },
            // ── PACKAGE TOOLS ──
            {
              name: 'create_package',
              description: 'Add a new catering menu package.',
              parameters: {
                type: 'object' as const,
                properties: {
                  name: { type: 'string' as const, description: 'Package name (e.g. Executive Grand Buffet)' },
                  description: { type: 'string' as const, description: 'Package contents and details' },
                  price_per_pax: { type: 'number' as const, description: 'Price per person in pesos' },
                  min_pax: { type: 'number' as const, description: 'Minimum number of guests required' },
                },
                required: ['name', 'price_per_pax', 'min_pax'],
              },
            },
            // ── DOCUMENT GENERATION TOOL ──
            {
              name: 'generate_document',
              description: 'Generate a downloadable document (PDF, Excel, or CSV) from real business data — bookings, customers, expenses, invoices, packages, cash flow, or a financial report. Always confirm the entity and format with the owner first if either is ambiguous; never guess.',
              parameters: {
                type: 'object' as const,
                properties: {
                  entity: { type: 'string' as const, description: 'What data to export: bookings, customers, expenses, invoices, packages, cashflow, or financial_report' },
                  format: { type: 'string' as const, description: 'File format: pdf, excel, or csv' },
                  period: { type: 'string' as const, description: 'Only for financial_report: Today, This Week, This Month, This Year, or All Time (default All Time)' },
                },
                required: ['entity', 'format'],
              },
            },
          ]
        }];

        // ── 4. Call Gemini with function calling & systemInstruction ──
        const model = genAI.getGenerativeModel(
          {
            model: 'gemini-flash-lite-latest',
            systemInstruction: systemPrompt,
            tools,
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 2048,
            },
          },
          { timeout: 20000 }
        );

        // Limit to recent 6 turns to keep context lightweight and fast
        const recentHistory = rawHistory.slice(-6);

        // Sanitize history for Gemini SDK:
        // 1. Must exclude trailing current userMessage (sent via chat.sendMessage)
        // 2. First turn MUST be role 'user' (drop leading 'model' welcome messages)
        // 3. Roles must strictly alternate between 'user' and 'model'
        const validTurns = recentHistory.map(h => ({
          role: (h.role === 'user' ? 'user' : 'model') as 'user' | 'model',
          parts: [{ text: h.text }]
        }));

        // Remove trailing duplicate userMessage from history if renderer sent it in array
        if (validTurns.length > 0 && validTurns[validTurns.length - 1].role === 'user' && validTurns[validTurns.length - 1].parts[0].text === userMessage) {
          validTurns.pop();
        }

        // Drop any leading 'model' turns until the first 'user' turn (Gemini requires first history item to be 'user')
        while (validTurns.length > 0 && validTurns[0].role === 'model') {
          validTurns.shift();
        }

        // Ensure history strictly alternates roles
        const historyParts: { role: 'user' | 'model'; parts: { text: string }[] }[] = [];
        let expectedRole: 'user' | 'model' = 'user';
        for (const turn of validTurns) {
          if (turn.role === expectedRole) {
            historyParts.push(turn);
            expectedRole = expectedRole === 'user' ? 'model' : 'user';
          }
        }

        const chat = model.startChat({
          history: historyParts,
        });

        let response = await chat.sendMessage(userMessage);
        let candidate = response.response.candidates?.[0];
        const actions: string[] = [];
        let generatedDocument: any = null;

        // ── 5. Function calling loop ──
        const MAX_TOOL_ITERATIONS = 8;
        let toolIterations = 0;
        while (candidate?.content?.parts?.some(p => p.functionCall)) {
          if (++toolIterations > MAX_TOOL_ITERATIONS) {
            logger.info(`[AI] Aborting after ${MAX_TOOL_ITERATIONS} tool calls — model kept requesting actions without a final answer.`);
            actions.push(`⚠️ Stopped after ${MAX_TOOL_ITERATIONS} steps to avoid hanging — please rephrase your request.`);
            break;
          }
          const fnPart = candidate.content.parts.find(p => p.functionCall);
          const fnCall = fnPart?.functionCall;
          if (!fnCall) break;

          const { name: fnName } = fnCall;
          const args: any = fnCall.args;
          logger.info(`[AI] Function call: ${fnName}(${JSON.stringify(args)})`);

          let fnResult: any = { success: false, message: 'Unknown function' };

          try {
            if (fnName === 'create_customer') {
              const c = await customerService.createCustomer({
                name: args.name,
                contact_number: args.contact_number,
                email: args.email || '',
                address: args.address || '',
                loyalty_tier: args.loyalty_tier || 'New',
              });
              fnResult = { success: true, message: `Customer "${c.name}" added with ID ${c.id}.` };
              actions.push(`✅ Added customer: **${c.name}**`);
            }
            else if (fnName === 'delete_customer') {
              await customerService.deleteCustomer(Number(args.id));
              fnResult = { success: true, message: `Customer ID ${args.id} deleted.` };
              actions.push(`🗑️ Deleted customer: **${args.name || 'ID ' + args.id}**`);
            }
            else if (fnName === 'create_booking') {
              const amountPaid = args.amount_paid || 0;
              const balance = Math.max(0, args.total_amount - amountPaid);
              const paymentStatus = balance === 0 ? 'Paid' : amountPaid > 0 ? 'Partial' : 'Unpaid';
              const b = await bookingService.createBooking({
                booking_ref: `BK-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
                customer_name: args.customer_name,
                occasion: args.occasion,
                event_date: args.event_date,
                event_time: args.event_time || '18:00',
                venue: args.venue,
                pax: Number(args.pax),
                total_amount: Number(args.total_amount),
                amount_paid: amountPaid,
                balance,
                status: 'CONFIRMED',
                payment_status: paymentStatus,
              });
              fnResult = { success: true, message: `Booking created: ${b.booking_ref} for ${b.customer_name}.` };
              actions.push(`✅ Created booking: **${b.booking_ref}** — ${b.customer_name} (${b.occasion})`);
            }
            else if (fnName === 'update_booking_status') {
              await bookingService.updateBookingStatus(Number(args.id), args.status);
              fnResult = { success: true, message: `Booking ${args.booking_ref || args.id} updated to ${args.status}.` };
              actions.push(`✅ Updated booking **${args.booking_ref || 'ID ' + args.id}** → ${args.status}`);
            }
            else if (fnName === 'delete_booking') {
              await bookingService.deleteBooking(Number(args.id));
              fnResult = { success: true, message: `Booking ${args.booking_ref || args.id} deleted.` };
              actions.push(`🗑️ Deleted booking: **${args.booking_ref || 'ID ' + args.id}**`);
            }
            else if (fnName === 'create_expense') {
              const e = await expenseService.createExpense({
                category: args.category,
                description: args.description,
                amount: Number(args.amount),
                expense_date: args.expense_date,
              });
              fnResult = { success: true, message: `Expense recorded: ₱${Number(args.amount).toLocaleString()} for ${args.description}.` };
              actions.push(`✅ Recorded expense: **${args.category}** — ${args.description} ₱${Number(args.amount).toLocaleString()}`);
            }
            else if (fnName === 'create_package') {
              const pkg = await packageService.createPackage({
                name: args.name,
                description: args.description || '',
                price_per_pax: Number(args.price_per_pax),
                min_pax: Number(args.min_pax),
              });
              fnResult = { success: true, message: `Package "${pkg.name}" added at ₱${pkg.price_per_pax}/pax.` };
              actions.push(`✅ Added package: **${pkg.name}** — ₱${pkg.price_per_pax}/pax`);
            }
            else if (fnName === 'generate_document') {
              const entity = String(args.entity || '').toLowerCase();
              const format = String(args.format || '').toLowerCase();
              const period = (args.period || 'All Time') as 'Today' | 'This Week' | 'This Month' | 'This Year' | 'All Time';

              let title = '';
              let columns: string[] = [];
              let rows: (string | number)[][] = [];

              if (entity === 'bookings') {
                title = 'Bookings & Reservations';
                columns = ['Ref', 'Customer', 'Occasion', 'Event Date', 'Pax', 'Total', 'Paid', 'Balance', 'Status'];
                rows = (await bookingService.getAllBookings()).map((b) => [b.booking_ref, b.customer_name, b.occasion, b.event_date, b.pax, b.total_amount, b.amount_paid, b.balance, b.status]);
              } else if (entity === 'customers') {
                title = 'Customers Directory';
                columns = ['Name', 'Contact', 'Email', 'Address', 'Loyalty Tier'];
                rows = (await customerService.getAllCustomers()).map((c) => [c.name, c.contact_number, c.email || '', c.address || '', c.loyalty_tier || '']);
              } else if (entity === 'expenses') {
                title = 'Operating Expenses';
                columns = ['Date', 'Category', 'Description', 'Amount'];
                rows = (await expenseService.getAllExpenses()).map((e) => [e.expense_date, e.category, e.description, e.amount]);
              } else if (entity === 'invoices') {
                title = 'Invoices & Payments';
                columns = ['Invoice #', 'Booking', 'Customer', 'Total', 'Paid', 'Balance', 'Status'];
                rows = (await billingService.getAllInvoices()).map((i) => [i.invoice_ref, i.booking_ref, i.customer_name, i.total_amount, i.amount_paid, i.balance, i.status]);
              } else if (entity === 'packages') {
                title = 'Menu Packages';
                columns = ['Name', 'Category', 'Price/Pax', 'Min Pax', 'Description'];
                rows = (await packageService.getAllPackages()).map((p) => [p.name, p.category, p.price_per_pax, p.min_pax, p.description || '']);
              } else if (entity === 'cashflow') {
                title = 'Cash Flow Ledger';
                columns = ['Date', 'Ref', 'Particulars', 'Deposit', 'Withdrawal', 'Balance'];
                rows = (await cashFlowService.getAll()).map((c) => [c.date, c.ref_no || '', c.particulars, c.deposit, c.withdrawal, c.running_balance]);
              } else if (entity === 'financial_report') {
                const rd = await computeReportData(period);
                title = `Financial Report — ${period}`;
                columns = ['Month', 'Revenue'];
                rows = rd.monthlyRevenue.map((m: any) => [m.month, m.revenue]);
              } else {
                throw new Error(`Unknown entity "${args.entity}". Valid options: bookings, customers, expenses, invoices, packages, cashflow, financial_report.`);
              }

              const filenameBase = `jayraldines_${entity}_${new Date().toISOString().slice(0, 10)}`;

              if (format === 'pdf') {
                const bytes = await pdfExporterService.generateTablePdf(title, columns, rows);
                generatedDocument = {
                  entity, format: 'pdf', title, columns, rows: rows.slice(0, 50), totalRows: rows.length,
                  filename: `${filenameBase}.pdf`,
                  pdfBase64: Buffer.from(bytes).toString('base64'),
                };
              } else if (format === 'excel' || format === 'csv') {
                // Full rows here — unlike the PDF branch, this array is the actual download source
                // for Excel/CSV (built client-side), so it must not be truncated like the preview.
                generatedDocument = {
                  entity, format, title, columns, rows, totalRows: rows.length,
                  filename: `${filenameBase}.${format === 'excel' ? 'xlsx' : 'csv'}`,
                };
              } else {
                throw new Error(`Unknown format "${args.format}". Valid options: pdf, excel, csv.`);
              }

              fnResult = { success: true, message: `Generated a ${format.toUpperCase()} preview of ${title} (${rows.length} rows) for the owner to review before downloading.` };
              actions.push(`📄 Prepared **${title}** (${format.toUpperCase()}) — ${rows.length} row(s), preview shown above`);
            }
          } catch (execErr: any) {
            fnResult = { success: false, message: `Error: ${execErr?.message}` };
            actions.push(`❌ Failed: ${fnName} — ${execErr?.message}`);
          }

          // Send tool execution result back to Gemini for natural language response
          response = await chat.sendMessage(`[DATABASE ACTION EXECUTED] Function ${fnName} completed successfully: ${JSON.stringify(fnResult)}. Briefly confirm this action warmly and concisely to the owner.`);
          candidate = response.response.candidates?.[0];
        }

        const finalText = response.response.text();
        const actionsBlock = actions.length > 0
          ? `\n\n---\n**Actions performed:**\n${actions.join('\n')}`
          : '';

        logger.info(`[AI] Completed: "${userMessage.slice(0, 60)}" | Actions: ${actions.length}`);
        return { success: true, answer: finalText + actionsBlock, actions, generatedDocument };

      } catch (err: any) {
        logger.error(`[AI] Gemini query failed: ${err?.message}`);
        return {
          success: false,
          answer: `⚠️ Chef Jay encountered an error: ${err?.message || 'Unknown error'}. Please check your internet connection and try again.`,
          actions: []
        };
      }
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
