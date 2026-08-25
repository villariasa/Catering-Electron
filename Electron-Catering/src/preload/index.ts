import { contextBridge, ipcRenderer } from 'electron';
import type { Customer, Booking, PackageItem, Expense, MenuItem, BusinessInfo, CalendarEvent } from './types';

contextBridge.exposeInMainWorld('electronAPI', {
  getSystemInfo: () => ipcRenderer.invoke('system:info'),
  ping: () => ipcRenderer.invoke('system:ping'),
  relaunch: () => ipcRenderer.invoke('system:relaunch'),

  dashboard: {
    getStats: (period: 'Weekly' | 'Monthly' | 'Yearly') => ipcRenderer.invoke('dashboard:getStats', period),
  },

  windowControls: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    maximize: () => ipcRenderer.invoke('window:maximize'),
    close: () => ipcRenderer.invoke('window:close'),
  },

  auth: {
    login: (credentials: { username: string; password: string }) => ipcRenderer.invoke('auth:login', credentials),
    logout: () => ipcRenderer.invoke('auth:logout'),
    getCurrentUser: () => ipcRenderer.invoke('auth:getCurrentUser'),
  },

  customers: {
    getAll: () => ipcRenderer.invoke('customers:getAll'),
    create: (data: Omit<Customer, 'id'>) => ipcRenderer.invoke('customers:create', data),
    delete: (id: number) => ipcRenderer.invoke('customers:delete', id),
    getFollowUps: (customerId: number) => ipcRenderer.invoke('customers:getFollowUps', customerId),
    addFollowUp: (customerId: number, followUpDate: string, note?: string) =>
      ipcRenderer.invoke('customers:addFollowUp', { customerId, followUpDate, note }),
    toggleFollowUp: (id: number) => ipcRenderer.invoke('customers:toggleFollowUp', id),
    deleteFollowUp: (id: number) => ipcRenderer.invoke('customers:deleteFollowUp', id),
  },

  bookings: {
    getAll: () => ipcRenderer.invoke('bookings:getAll'),
    create: (data: Omit<Booking, 'id'>) => ipcRenderer.invoke('bookings:create', data),
    updateStatus: (id: number, status: Booking['status'], cancellationReason?: string) => ipcRenderer.invoke('bookings:updateStatus', { id, status, cancellationReason }),
    delete: (id: number) => ipcRenderer.invoke('bookings:delete', id),
  },

  packages: {
    getAll: () => ipcRenderer.invoke('packages:getAll'),
    create: (data: Omit<PackageItem, 'id'>) => ipcRenderer.invoke('packages:create', data),
    delete: (id: number) => ipcRenderer.invoke('packages:delete', id),
    getItemIds: (packageId: number) => ipcRenderer.invoke('packages:getItemIds', packageId),
    getItemCounts: () => ipcRenderer.invoke('packages:getItemCounts'),
    setItems: (packageId: number, itemIds: number[]) => ipcRenderer.invoke('packages:setItems', { packageId, itemIds }),
  },

  menuItems: {
    getAll: () => ipcRenderer.invoke('menuItems:getAll'),
    create: (data: Omit<MenuItem, 'id'>) => ipcRenderer.invoke('menuItems:create', data),
    delete: (id: number) => ipcRenderer.invoke('menuItems:delete', id),
  },

  expenses: {
    getAll: () => ipcRenderer.invoke('expenses:getAll'),
    create: (data: Omit<Expense, 'id'>) => ipcRenderer.invoke('expenses:create', data),
  },

  invoices: {
    getAll: () => ipcRenderer.invoke('invoices:getAll'),
    getPayments: (invoiceId: number) => ipcRenderer.invoke('invoices:getPayments', invoiceId),
    recordPayment: (data: {
      invoiceId: number;
      amount: number;
      paymentDate: string;
      method: string;
      referenceNo?: string;
      notes?: string;
    }) => ipcRenderer.invoke('invoices:recordPayment', data),
    emailReceipt: (invoiceId: number) => ipcRenderer.invoke('billing:emailReceipt', { invoiceId }),
    saveReceiptPdf: (invoiceId: number) => ipcRenderer.invoke('billing:saveReceiptPdf', { invoiceId }),
  },

  kitchen: {
    getAllOrders: () => ipcRenderer.invoke('kitchen:getAllOrders'),
    updateOrderStatus: (orderId: number, status: string) => ipcRenderer.invoke('kitchen:updateOrderStatus', { orderId, status }),
    addTask: (orderId: number, label: string) => ipcRenderer.invoke('kitchen:addTask', { orderId, label }),
    toggleTask: (taskId: number) => ipcRenderer.invoke('kitchen:toggleTask', taskId),
    deleteTask: (taskId: number) => ipcRenderer.invoke('kitchen:deleteTask', taskId),
  },

  cashFlow: {
    getAll: () => ipcRenderer.invoke('cashFlow:getAll'),
    getSummary: () => ipcRenderer.invoke('cashFlow:getSummary'),
    create: (data: { date: string; ref_no?: string; particulars: string; deposit: number; withdrawal: number; notes?: string }) =>
      ipcRenderer.invoke('cashFlow:create', data),
    delete: (id: number) => ipcRenderer.invoke('cashFlow:delete', id),
  },

  settings: {
    getBusinessInfo: () => ipcRenderer.invoke('settings:getBusinessInfo'),
    updateBusinessInfo: (data: BusinessInfo) => ipcRenderer.invoke('settings:updateBusinessInfo', data),
    getOccasions: () => ipcRenderer.invoke('settings:getOccasions'),
    addOccasion: (name: string) => ipcRenderer.invoke('settings:addOccasion', name),
    deleteOccasion: (id: number) => ipcRenderer.invoke('settings:deleteOccasion', id),
    backupDatabase: () => ipcRenderer.invoke('settings:backupDatabase'),
    restoreDatabase: () => ipcRenderer.invoke('settings:restoreDatabase'),
    getSalesTargets: (year: number) => ipcRenderer.invoke('settings:getSalesTargets', year),
    setSalesTarget: (year: number, month: number, amount: number) => ipcRenderer.invoke('settings:setSalesTarget', { year, month, amount }),
    setYearlyTarget: (year: number, amount: number) => ipcRenderer.invoke('settings:setYearlyTarget', { year, amount }),
    testSmtp: () => ipcRenderer.invoke('settings:testSmtp'),
  },

  audit: {
    getRecent: (limit?: number) => ipcRenderer.invoke('audit:getRecent', limit),
  },

  notifications: {
    getAll: () => ipcRenderer.invoke('notifications:getAll'),
    markRead: (id: number) => ipcRenderer.invoke('notifications:markRead', id),
    clearAll: () => ipcRenderer.invoke('notifications:clearAll'),
    delete: (id: number) => ipcRenderer.invoke('notifications:delete', id),
  },

  calendarEvents: {
    getForMonth: (year: number, month: number) => ipcRenderer.invoke('calendarEvents:getForMonth', { year, month }),
    create: (data: Omit<CalendarEvent, 'id'>) => ipcRenderer.invoke('calendarEvents:create', data),
    delete: (id: number) => ipcRenderer.invoke('calendarEvents:delete', id),
  },

  reports: {
    exportCalendarPdf: (savePath: string, year: number, month: number) => ipcRenderer.invoke('reports:exportCalendarPdf', { savePath, year, month }),
    getReportData: (period: string) => ipcRenderer.invoke('reports:getReportData', period),
    exportFinancialPdf: (period: string) => ipcRenderer.invoke('reports:exportFinancialPdf', { period }),
  },

  migration: {
    migrateFromLegacyDb: (legacyPath: string) => ipcRenderer.invoke('migration:migrateFromLegacyDb', legacyPath),
  },

  logs: {
    getActiveLogPath: () => ipcRenderer.invoke('logs:getActiveLogPath'),
    readActiveLogContent: () => ipcRenderer.invoke('logs:readActiveLogContent'),
    openLogFolder: () => ipcRenderer.invoke('logs:openLogFolder'),
  },

  ai: {
    query: (message: string, history?: { role: 'user' | 'model'; text: string }[], currentScreen?: string) => ipcRenderer.invoke('ai:query', { message, history, currentScreen }),
  },

  documents: {
    savePdf: (data: { filename: string; pdfBase64: string }) => ipcRenderer.invoke('documents:savePdf', data),
  },
});

