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
}

export interface Booking {
  id?: number;
  booking_ref: string;
  customer_name: string;
  occasion: string;
  event_date: string;
  event_time?: string;
  venue: string;
  pax: number;
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

export interface ElectronAPI {
  getSystemInfo: () => Promise<SystemInfo>;
  ping: () => Promise<string>;

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
  };

  // Bookings
  bookings: {
    getAll: () => Promise<Booking[]>;
    create: (data: Omit<Booking, 'id'>) => Promise<Booking>;
    updateStatus: (id: number, status: Booking['status']) => Promise<boolean>;
    delete: (id: number) => Promise<boolean>;
  };

  // Packages
  packages: {
    getAll: () => Promise<PackageItem[]>;
    create: (data: Omit<PackageItem, 'id'>) => Promise<PackageItem>;
  };

  // Expenses
  expenses: {
    getAll: () => Promise<Expense[]>;
    create: (data: Omit<Expense, 'id'>) => Promise<Expense>;
  };

  // Reports & PDF Exporter (Phase 8)
  reports: {
    exportCalendarPdf: (savePath: string, year: number, month: number) => Promise<boolean>;
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
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

