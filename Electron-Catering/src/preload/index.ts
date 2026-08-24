import { contextBridge, ipcRenderer } from 'electron';
import type { Customer, Booking, PackageItem, Expense } from './types';

contextBridge.exposeInMainWorld('electronAPI', {
  getSystemInfo: () => ipcRenderer.invoke('system:info'),
  ping: () => ipcRenderer.invoke('system:ping'),

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
  },

  bookings: {
    getAll: () => ipcRenderer.invoke('bookings:getAll'),
    create: (data: Omit<Booking, 'id'>) => ipcRenderer.invoke('bookings:create', data),
    updateStatus: (id: number, status: Booking['status']) => ipcRenderer.invoke('bookings:updateStatus', { id, status }),
    delete: (id: number) => ipcRenderer.invoke('bookings:delete', id),
  },

  packages: {
    getAll: () => ipcRenderer.invoke('packages:getAll'),
    create: (data: Omit<PackageItem, 'id'>) => ipcRenderer.invoke('packages:create', data),
  },

  expenses: {
    getAll: () => ipcRenderer.invoke('expenses:getAll'),
    create: (data: Omit<Expense, 'id'>) => ipcRenderer.invoke('expenses:create', data),
  },

  reports: {
    exportCalendarPdf: (savePath: string, year: number, month: number) => ipcRenderer.invoke('reports:exportCalendarPdf', { savePath, year, month }),
  },

  migration: {
    migrateFromLegacyDb: (legacyPath: string) => ipcRenderer.invoke('migration:migrateFromLegacyDb', legacyPath),
  },

  logs: {
    getActiveLogPath: () => ipcRenderer.invoke('logs:getActiveLogPath'),
    readActiveLogContent: () => ipcRenderer.invoke('logs:readActiveLogContent'),
    openLogFolder: () => ipcRenderer.invoke('logs:openLogFolder'),
  },
});

