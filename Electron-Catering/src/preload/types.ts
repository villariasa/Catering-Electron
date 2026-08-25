export interface User {
  id: number;
  username: string;
  full_name: string;
  role: 'OWNER';
  created_at?: string;
}

export interface Customer {
  id?: number;
  name: string;
  contact_number: string;
  email?: string;
  address?: string;
  loyalty_tier?: string;
  created_at?: string;
  total_bookings?: number;
  total_spent?: number;
}

export interface FollowUp {
  id: number;
  customer_id: number;
  follow_up_date: string;
  note?: string;
  is_done: boolean;
}

export interface Booking {
  id?: number;
  booking_ref: string;
  customer_id?: number;
  customer_name: string;
  occasion: string;
  event_date: string;
  event_time?: string;
  venue: string;
  pax: number;
  package_id?: number;
  package_name?: string;
  addons?: string;
  total_amount: number;
  amount_paid: number;
  balance: number;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  payment_status: 'Unpaid' | 'Partial' | 'Paid';
  created_at?: string;
}

export interface PackageItem {
  id?: number;
  name: string;
  category: string;
  price_per_pax: number;
  min_pax: number;
  description?: string;
}

export interface Expense {
  id?: number;
  category: string;
  description: string;
  amount: number;
  expense_date: string;
  created_at?: string;
}

export interface Invoice {
  id: number;
  invoice_ref: string;
  booking_id: number;
  booking_ref: string;
  customer_name: string;
  event_date: string;
  total_amount: number;
  amount_paid: number;
  balance: number;
  status: 'Unpaid' | 'Partial' | 'Paid';
  due_date?: string;
  notes?: string;
  created_at?: string;
}

export interface PaymentRecord {
  id: number;
  invoice_id: number;
  amount: number;
  payment_date: string;
  method: string;
  reference_no?: string;
  notes?: string;
  created_at?: string;
}

export interface AuditLogEntry {
  id: number;
  actor: string;
  action: string;
  table_name: string;
  record_id?: number;
  details: string;
  created_at: string;
}

export interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  color: string;
  is_read: boolean;
  created_at?: string;
}

export interface MonthlySalesTarget {
  year: number;
  month: number;
  target_amount: number;
}

export interface CalendarEvent {
  id?: number;
  event_date: string;
  name: string;
  pax?: number;
  event_time?: string;
  location?: string;
}

export interface BusinessInfo {
  name: string;
  address: string;
  contact: string;
  email: string;
  min_downpayment_pct: number;
  allow_zero_downpayment: boolean;
  max_daily_pax: number;
  smtp_host: string;
  smtp_port: number;
  smtp_user: string;
  smtp_pass: string;
}

export interface Occasion {
  id: number;
  name: string;
}

export interface MenuItem {
  id?: number;
  name: string;
  description?: string;
  category: string;
  price: number;
  package_tier?: string;
  is_active?: boolean;
}

export interface CashFlowEntry {
  id: number;
  date: string;
  ref_no?: string;
  particulars: string;
  deposit: number;
  withdrawal: number;
  running_balance: number;
  notes?: string;
  created_at?: string;
}

export interface CashFlowSummary {
  total_deposits: number;
  total_withdrawals: number;
  current_balance: number;
}

export interface KitchenTask {
  id: number;
  order_id: number;
  label: string;
  is_done: boolean;
  sort_order: number;
}

export interface KitchenOrder {
  id: number;
  order_ref: string;
  booking_id: number | null;
  customer_name: string;
  occasion: string;
  pax: number;
  items_desc: string;
  status: 'Queued' | 'In Prep' | 'Ready' | 'Completed';
  booking_ref: string | null;
  event_date: string | null;
  event_time: string | null;
  venue: string | null;
  tasks?: KitchenTask[];
}

export interface SystemInfo {
  version: string;
  db_version: number;
  db_path: string;
  platform: string;
  total_bookings: number;
  total_customers: number;
  total_revenue: number;
  total_expenses: number;
}

export interface DashboardChartPoint {
  label: string;
  revenue: number;
  expenses: number;
}

export interface DashboardUpcomingEvent {
  id: number;
  name: string;
  occasion: string;
  event_date: string;
  event_time: string;
  venue: string;
  pax: number;
  status: string;
  total_amount: number;
  amount_paid: number;
  balance: number;
}

export interface DashboardActivityItem {
  id: number;
  actor: string;
  action: string;
  table_name: string;
  details: string;
  created_at: string;
}

export interface DashboardFollowUp {
  id: number;
  customer_id: number;
  customer_name: string;
  follow_up_date: string;
  note?: string;
  is_done: boolean;
}

export interface ReportData {
  totalBookings: number;
  totalRevenue: number;
  totalPax: number;
  unpaidTotal: number;
  todayBookings: number;
  weekBookings: number;
  monthlyRevenue: { month: string; revenue: number }[];
  occasionBreakdown: { name: string; count: number; share: number }[];
  paymentMethods: { name: string; amount: number; percentage: number }[];
  topPackages: { name: string; orders: number; revenue: number }[];
}

export interface DashboardStats {
  totalActiveBookings: number;
  grossRevenue: number;
  operatingExpenses: number;
  netProfit: number;
  netMarginPct: number;
  chartData: DashboardChartPoint[];
  upcomingEvents: DashboardUpcomingEvent[];
  todayEventsCount: number;
  todayPax: number;
  pendingBookingsCount: number;
  unpaidInvoicesTotal: number;
  downpaymentReceivedToday: number;
  recentActivity: DashboardActivityItem[];
  followUpsDueToday: DashboardFollowUp[];
}

export interface ElectronAPI {
  getSystemInfo: () => Promise<SystemInfo>;

  // Dashboard aggregated stats
  dashboard: {
    getStats: (period: 'Weekly' | 'Monthly' | 'Yearly') => Promise<DashboardStats>;
  };
  ping: () => Promise<string>;
  relaunch: () => Promise<void>;

  // Auth (Owner)
  auth: {
    login: (credentials: { username: string; password: string }) => Promise<{ success: boolean; user?: User; error?: string }>;
    logout: () => Promise<boolean>;
    getCurrentUser: () => Promise<User | null>;
  };
  
  // Customers
  customers: {
    getAll: () => Promise<Customer[]>;
    create: (data: Omit<Customer, 'id'>) => Promise<Customer>;
    delete: (id: number) => Promise<boolean>;
    getFollowUps: (customerId: number) => Promise<FollowUp[]>;
    addFollowUp: (customerId: number, followUpDate: string, note?: string) => Promise<FollowUp>;
    toggleFollowUp: (id: number) => Promise<boolean>;
    deleteFollowUp: (id: number) => Promise<boolean>;
  };

  // Bookings
  bookings: {
    getAll: () => Promise<Booking[]>;
    create: (data: Omit<Booking, 'id'>) => Promise<Booking>;
    updateStatus: (id: number, status: Booking['status'], cancellationReason?: string) => Promise<boolean>;
    delete: (id: number) => Promise<boolean>;
  };

  // Packages
  packages: {
    getAll: () => Promise<PackageItem[]>;
    create: (data: Omit<PackageItem, 'id'>) => Promise<PackageItem>;
    delete: (id: number) => Promise<boolean>;
    getItemIds: (packageId: number) => Promise<number[]>;
    getItemCounts: () => Promise<Record<number, number>>;
    setItems: (packageId: number, itemIds: number[]) => Promise<void>;
  };

  // Menu Items ("Dishes")
  menuItems: {
    getAll: () => Promise<MenuItem[]>;
    create: (data: Omit<MenuItem, 'id'>) => Promise<MenuItem>;
    delete: (id: number) => Promise<boolean>;
  };

  // Expenses
  expenses: {
    getAll: () => Promise<Expense[]>;
    create: (data: Omit<Expense, 'id'>) => Promise<Expense>;
  };

  // Billing / Invoices / Payments
  invoices: {
    getAll: () => Promise<Invoice[]>;
    getPayments: (invoiceId: number) => Promise<PaymentRecord[]>;
    recordPayment: (data: {
      invoiceId: number;
      amount: number;
      paymentDate: string;
      method: string;
      referenceNo?: string;
      notes?: string;
    }) => Promise<Invoice>;
    emailReceipt: (invoiceId: number) => Promise<{ success: boolean; error?: string }>;
    saveReceiptPdf: (invoiceId: number) => Promise<{ success: boolean; path?: string }>;
  };

  // Kitchen Display System
  kitchen: {
    getAllOrders: () => Promise<KitchenOrder[]>;
    updateOrderStatus: (orderId: number, status: KitchenOrder['status']) => Promise<boolean>;
    addTask: (orderId: number, label: string) => Promise<KitchenTask>;
    toggleTask: (taskId: number) => Promise<boolean>;
    deleteTask: (taskId: number) => Promise<boolean>;
  };

  // Cash Flow Ledger
  cashFlow: {
    getAll: () => Promise<CashFlowEntry[]>;
    getSummary: () => Promise<CashFlowSummary>;
    create: (data: { date: string; ref_no?: string; particulars: string; deposit: number; withdrawal: number; notes?: string }) => Promise<CashFlowEntry[]>;
    delete: (id: number) => Promise<CashFlowEntry[]>;
  };

  // Settings: Business Info, Occasions, Backup/Restore
  settings: {
    getBusinessInfo: () => Promise<BusinessInfo>;
    updateBusinessInfo: (data: BusinessInfo) => Promise<BusinessInfo>;
    getOccasions: () => Promise<Occasion[]>;
    addOccasion: (name: string) => Promise<Occasion>;
    deleteOccasion: (id: number) => Promise<boolean>;
    backupDatabase: () => Promise<{ success: boolean; path?: string }>;
    restoreDatabase: () => Promise<{ success: boolean; requiresRestart?: boolean }>;
    getSalesTargets: (year: number) => Promise<MonthlySalesTarget[]>;
    setSalesTarget: (year: number, month: number, amount: number) => Promise<void>;
    setYearlyTarget: (year: number, amount: number) => Promise<void>;
    testSmtp: () => Promise<{ success: boolean; error?: string }>;
  };

  // Audit Log
  audit: {
    getRecent: (limit?: number) => Promise<AuditLogEntry[]>;
  };

  // Notifications
  notifications: {
    getAll: () => Promise<Notification[]>;
    markRead: (id: number) => Promise<boolean>;
    clearAll: () => Promise<void>;
    delete: (id: number) => Promise<boolean>;
  };

  // Manual Calendar Events (independent of bookings)
  calendarEvents: {
    getForMonth: (year: number, month: number) => Promise<CalendarEvent[]>;
    create: (data: Omit<CalendarEvent, 'id'>) => Promise<CalendarEvent>;
    delete: (id: number) => Promise<boolean>;
  };

  // Reports & PDF Exporter (Phase 8)
  reports: {
    exportCalendarPdf: (savePath: string, year: number, month: number) => Promise<boolean>;
    getReportData: (period: 'Today' | 'This Week' | 'This Month' | 'This Year' | 'All Time') => Promise<ReportData>;
    exportFinancialPdf: (period: string) => Promise<boolean>;
  };

  // Legacy Migration Tool (Phase 9)
  migration: {
    migrateFromLegacyDb: (legacyPath: string) => Promise<{
      success: boolean;
      backup_created_path: string;
      customers_count: number;
      bookings_count: number;
      packages_count: number;
      expenses_count: number;
      error?: string;
    }>;
  };

  // Chef Jay AI (Gemini)
  ai: {
    query: (message: string, history?: { role: 'user' | 'model'; text: string }[], currentScreen?: string) => Promise<{
      success: boolean;
      answer: string;
      actions?: string[];
      generatedDocument?: GeneratedDocument | null;
    }>;
  };

  // AI-generated document downloads
  documents: {
    savePdf: (data: { filename: string; pdfBase64: string }) => Promise<{ success: boolean; path?: string }>;
  };
}

export interface GeneratedDocument {
  entity: string;
  format: 'pdf' | 'excel' | 'csv';
  title: string;
  columns: string[];
  rows: (string | number)[][];
  totalRows: number;
  filename: string;
  pdfBase64?: string;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

