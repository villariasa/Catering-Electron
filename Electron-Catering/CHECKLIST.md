# Master Application Checklist & Phase Roadmap — Jayraldine's Catering System

> **Project Path:** `/home/villarias/Projects/Electron-Catering`  
> **Application Version:** `v5.0.0` (Electron + Svelte 5 + TypeScript + Vite + SQLite)  
> **Current Status:** **Phases 0 through 9 ARE COMPLETED.** Phase 10 (Parallel Testing) is NEXT.

---

## 📌 Complete 14-Phase Master Checklist

### [x] PHASE 0 — Freeze the Current Python App
- [x] Document 14 primary screens & dialogs in `FEATURES.md`
- [x] Document screen-to-database table & view mapping in `DATABASE_TABLES.md`
- [x] Record all financial calculations, formulas, and payment status rules in `BUSINESS_RULES.md`
- [x] Record historical bugs, active issues, and edge cases in `KNOWN_BUGS.md`

### [x] PHASE 1 — Protect the Existing System
- [x] Copy full Python source code to `Jayraldines-Legacy/Python-Source/`
- [x] Copy build scripts, spec files & installers to `Jayraldines-Legacy/Installer/`
- [x] Backup production database to `Jayraldines-Legacy/Database/production-backup.db`
- [x] Create secondary development database copies (`backup-1.db`, `backup-2.db`, `electron-test.db`)
- [x] Copy project manuals & flowcharts to `Jayraldines-Legacy/Documentation/`

### [x] PHASE 2 — Inspect and Document the SQLite Database
- [x] Document schema for all 28 tables and 11 SQL views in `DATABASE_SCHEMA.md`
- [x] Document entity relationship diagram (ERD), foreign keys, and cardinality in `DATABASE_RELATIONSHIPS.md`

### [x] PHASE 3 — Define the New Architecture
- [x] Define Layered Architecture in `ARCHITECTURE.md`
- [x] Establish flow: Svelte 5 UI $\rightarrow$ IPC ContextBridge $\rightarrow$ IPC Handlers $\rightarrow$ Services $\rightarrow$ Repositories $\rightarrow$ SQLite DB
- [x] Enforce strict rule: Zero SQL queries and zero business calculations inside `.svelte` components

### [x] PHASE 4 — Build the Electron Foundation
- [x] Configure Electron 34, Svelte 5, TypeScript 5.7, Vite 6, and Tailwind CSS
- [x] Build collapsible navigation sidebar & topbar layout shell
- [x] Create navigation tabs for Dashboard, Bookings, Calendar, Customers, Packages, Expenses, Reports, Settings
- [x] Implement type-safe IPC bridge (`src/preload/index.ts` & `src/preload/types.ts`)
- [x] Verify IPC ping & database query execution

### [x] PHASE 5 — Create the Database Layer & Migration Engine
- [x] Implement SQLite connection singleton with WAL mode & foreign key pragmas (`src/main/database/connection.ts`)
- [x] Build version-tracked migration engine (`src/main/database/migration-runner.ts`)
- [x] Write initial SQL migration scripts (`001_initial_schema.sql`, `002_sample_data.sql`)
- [x] Implement Repository layer (`customer.repository.ts`, `booking.repository.ts`, `package.repository.ts`, `expense.repository.ts`)
- [x] Implement Application Services layer (`customer.service.ts`, `booking.service.ts`, `package.service.ts`, `expense.service.ts`)
- [x] Verify production build compiles with 0 errors (`npm run build`)

### [x] PHASE 6 — Owner Authentication & Single-User Access
- [x] Create `003_add_users.sql` migration for `users` table (`usr_id`, `usr_username`, `usr_password_hash`, `usr_full_name`, `usr_role` = `'OWNER'`).
- [x] Seed default Owner account (`owner` / SHA-256 hashed password).
- [x] Implement secure password hashing (`AuthService.hashPassword()`).
- [x] Build `UserRepository` (`src/main/database/repositories/user.repository.ts`).
- [x] Build `AuthService` (`src/main/services/auth.service.ts`) for single Owner session authentication.
- [x] Register IPC handlers (`auth:login`, `auth:logout`, `auth:getCurrentUser`).
- [x] Build Login screen Svelte UI (`Login.svelte`).
- [x] Protect application shell so Owner login session is required before accessing application features.
- [x] Add Logout button and Owner profile badge in Topbar.

### [x] PHASE 7 — Migrate Features One by One

#### [x] 7.1 Customers Module
- [x] Build Customer List view with search & responsive table (`Customers.svelte`).
- [x] Build Add Customer modal form with phone & address fields.
- [x] Build `CustomerRepository` & `CustomerService` IPC handlers.

#### [x] 7.2 Menu and Packages Module
- [x] Build Catering Packages list & tier cards (`Packages.svelte`).
- [x] Build `PackageRepository` & `PackageService` IPC handlers.

#### [x] 7.3 Bookings / Orders Core System
- [x] Build Booking List view & modal creation wizard (`Bookings.svelte`).
- [x] Implement financial balance formula ($\text{Remaining Balance} = \text{Total Amount} - \text{Amount Paid}$).
- [x] Implement payment status determination (`Unpaid`, `Partial`, `Paid`).
- [x] Enforce rule: ₱0.00 downpayment results in `Unpaid` status.

#### [x] 7.4 Calendar Module
- [x] Build Monthly Calendar Grid reading from `bookings` repository (`Calendar.svelte`).
- [x] Implement Month/Year navigation (`Prev`, `Next`, `Today`).
- [x] Calculate daily pax load indicators (Green `<400`, Amber `400-599`, Red `>=600`).

#### [x] 7.5 Expenses Module
- [x] Build Operating Expenses table & category badges (`Expenses.svelte`).
- [x] Build `ExpenseRepository` & `ExpenseService` IPC handlers.

#### [x] 7.6 Payments Module
- [x] Payment tracking integrated into `Bookings.svelte` and `Invoice` services.

#### [x] 7.7 Dashboard Statistics
- [x] Connect Dashboard KPI cards to live SQLite metrics (`Dashboard.svelte`).

### [x] PHASE 8 — Reports and Printable PDF Engine
- [x] Build `PdfExporterService` (`src/main/services/pdf-exporter.service.ts`) using `pdf-lib`.
- [x] Recreate 100% **Landscape A4 Wall Calendar PDF** with date cell pax badges.
- [x] Recreate **Landscape Itemized Event Agenda PDF** pages.
- [x] Register IPC handler (`reports:exportCalendarPdf`).

### [x] PHASE 9 — Legacy Database Migration Tool
- [x] Create `MigrationToolService` (`src/main/services/migration-tool.service.ts`).
- [x] Create pre-migration safety backup (`catering.pre-electron-backup.db`).
- [x] Read legacy tables, transform dates and columns to strict typed schema.
- [x] Validate imported record counts (Customers, Bookings, Packages, Expenses).
- [x] Add Legacy Database Migration Wizard UI in Settings tab (`Settings.svelte`).

---

### [ ] PHASE 10 — Parallel Testing *(NEXT STEP FOR USER)*
- [ ] Run Python Legacy App and Electron App on duplicate data copies.
- [ ] Perform side-by-side verification of booking calculations, invoices, calendar indicators, and exports.
- [ ] Log and resolve any output discrepancies.

---

### [ ] PHASE 11 — Production Release & Backup Strategy
- [ ] Build production desktop installers using `electron-builder` (`.exe` for Windows, `.tar.gz` / `.AppImage` for Linux).
- [ ] Implement automated backup engine:
  - [ ] Daily automatic backup on app startup.
  - [ ] Manual backup trigger in Settings.
  - [ ] Database restore wizard with safety backup creation.
- [ ] Ensure user database is stored in `userData` directory (never overwritten by updates).

---

### [ ] PHASE 12 — System Stabilization
- [ ] Perform stress testing on large datasets.
- [ ] Verify memory usage and resolve any IPC memory leaks.
- [ ] Monitor crash reports and installer behavior.

---

### [ ] PHASE 13 — Future Cloud & Multi-Device Sync Architecture
- [ ] Add `organization_id`, `created_at`, `updated_at`, `deleted_at`, and `version` columns to SQLite tables for conflict-free sync.
- [ ] Design sync engine interfaces for future REST / WebSocket backend.

---

### [ ] PHASE 14 — Mobile Companion App (Future)
- [ ] Set up Svelte + Capacitor mobile project.
- [ ] Implement QR code pairing between desktop SQLite and mobile app.
