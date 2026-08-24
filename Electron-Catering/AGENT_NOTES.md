# AI Agent & Developer Handoff Instructions — Jayraldine's Catering Electron App

> **READ THIS FIRST BEFORE WRITING ANY CODE IN THIS REPOSITORY.**  
> **Project Location:** `/home/villarias/Projects/Electron-Catering`  
> **Current App Version:** `v5.0.0` (Electron + Svelte 5 + TypeScript + Vite + SQLite)  
> **Last Status Check:** August 24, 2026 — **Phases 0, 1, 2, 3, 4 & 5 ARE COMPLETED.**  

---

## 🚀 Quick Summary for AI Assistants / Laptop Sessions

If you are an AI assistant starting a new session or running on a laptop:

1. **Do NOT modify or touch the legacy Python app in `/home/villarias/Projects/jayraldinescateringsystem/`.**
2. **All work must take place inside `/home/villarias/Projects/Electron-Catering/`.**
3. **Phases 0 through 9 ARE FULLY FINISHED AND VERIFIED:**
   - **Phase 6 (Owner Auth):** Single Owner authentication active (`owner` / `password123`). Password SHA256 hashed. `Login.svelte` active.
   - **Phase 7 (Features):** Customers, Packages, Bookings, Calendar, Expenses & Dashboard live with SQLite read/write.
   - **Phase 8 (PDF Engine):** 100% Landscape A4 Wall Calendar & Itemized Agenda PDF exporter (`PdfExporterService`).
   - **Phase 9 (Legacy Migration Tool):** Automated importer (`MigrationToolService`) with pre-migration safety backup protection.
   - Production build compiles cleanly with 0 errors (`npm run build`).

---

## 🎯 NEXT STEP FOR USER: PHASE 10 — Parallel Testing & Output Comparison

The user is now ready to perform testing on Phase 6, 7, 8, and 9 features:
- Test Owner Login & Logout session.
- Test Customer creation & Bookings management.
- Test Monthly Calendar load indicators.
- Test 100% Landscape Wall Calendar PDF export.
- Test Legacy Database Migration tool in Settings tab.


### Phase 6 Implementation Blueprint:
1. **Database Migration (`003_add_users.sql`):**
   - Create `users` table:
     - `usr_id` (INTEGER PK AUTOINCREMENT)
     - `usr_username` (TEXT UNIQUE NOT NULL)
     - `usr_password_hash` (TEXT NOT NULL) — **Do NOT store plain text! Use PBKDF2 or bcrypt**
     - `usr_full_name` (TEXT NOT NULL)
     - `usr_role` (TEXT DEFAULT `'OWNER'`)
     - `usr_created_at` (DATETIME DEFAULT CURRENT_TIMESTAMP)
   - Seed default Owner account (`owner` / secure hashed password).

2. **Backend Services & IPC:**
   - Build `UserRepository` (`src/main/database/repositories/user.repository.ts`).
   - Build `AuthService` (`src/main/services/auth.service.ts`) for single Owner session authentication.
   - Register IPC routes in `src/main/index.ts`:
     - `auth:login` ({ username, password })
     - `auth:logout` ()
     - `auth:getCurrentUser` ()

3. **Frontend UI (Svelte 5):**
   - Build `Login.svelte` (`src/renderer/src/lib/pages/Login.svelte`).
   - Protect navigation in `App.svelte` so authenticated Owner session is required before accessing application features.
   - Display active Owner badge in Topbar / Sidebar with a working Logout button.

---

## 📐 Strict Coding & Architectural Rules

### Rule 1: Layered Architecture Pattern
```
Svelte 5 UI (renderer) ──(electronAPI)──> ContextBridge (preload) ──(IPC)──> IPC Main Handlers
                                                                                    │
SQLite (catering.db) <── Repositories <── Application Services <────────────────────┘
```

### Rule 2: Zero Domain Logic in UI
- ❌ **Forbidden:** Writing SQL queries, financial formulas, or status calculations inside `.svelte` components.
- ✅ **Required:** UI components call `window.electronAPI.bookings.create(data)` and render DTO responses.

### Rule 3: Business Logic Rules (DO NOT CHANGE)
- **Zero Down Payment (`₱0.00`):** Must result in `Unpaid` status (NOT Paid).
- **Balance Formula:** $\text{Remaining Balance} = \text{Total Amount} - \text{Amount Paid}$.
- **Calendar Indicator Thresholds:** `< 400 Pax` 🟩 Green, `400–599 Pax` 🟨 Amber, `>= 600 Pax` 🟥 Red.
- **Wall Calendar PDF:** 100% Landscape A4 format for wall calendar grids and agenda pages.

---

## 🛠️ Commands Reference

```bash
# Navigate to project directory
cd /home/villarias/Projects/Electron-Catering

# Install dependencies (if needed)
npm install

# Run Vite dev server
npm run dev

# Run production build & verify TypeScript compilation
npm run build
```

---

## 📚 Key Reference Documents in Repository

- **[`CHECKLIST.md`](file:///home/villarias/Projects/Electron-Catering/CHECKLIST.md):** Complete 14-Phase Master Checklist with sub-task checkboxes (Phase 0 to Phase 14).
- **[`PROGRESS_TRACKER.md`](file:///home/villarias/Projects/Electron-Catering/PROGRESS_TRACKER.md):** Complete tracking document mirroring all 14 phases.
- **[`ARCHITECTURE.md`](file:///home/villarias/Projects/Electron-Catering/ARCHITECTURE.md):** Detailed system architecture blueprint.
- **[`BUSINESS_RULES.md`](file:///home/villarias/Projects/Electron-Catering/BUSINESS_RULES.md):** All formulas, calculations & status rules.
- **[`DATABASE_SCHEMA.md`](file:///home/villarias/Projects/Electron-Catering/DATABASE_SCHEMA.md):** SQLite 28-table schema reference.
- **[`DATABASE_RELATIONSHIPS.md`](file:///home/villarias/Projects/Electron-Catering/DATABASE_RELATIONSHIPS.md):** Entity relationship diagrams & foreign keys.
- **[`FEATURES.md`](file:///home/villarias/Projects/Electron-Catering/FEATURES.md):** Screen-by-screen feature inventory.
- **[`KNOWN_BUGS.md`](file:///home/villarias/Projects/Electron-Catering/KNOWN_BUGS.md):** Historical bug fixes & migration pitfalls.
