# System Architecture — Jayraldine's Catering Electron App

> **Architecture Spec:** Electron + Svelte 5 + TypeScript + Vite + SQLite (`better-sqlite3`)  
> **Target Application:** Jayraldine's Catering Management System (v5.0.0)

---

## 1. High-Level Architecture Overview

The system follows a strict **Layered Architecture Pattern** to separate UI rendering, IPC communication, business domain logic, data access, and persistence.

```mermaid
flowchart TD
    subgraph Renderer ["Renderer Process (Svelte 5 UI)"]
        SvelteViews["Svelte Pages & Components\n(Dashboard, Bookings, Calendar, etc.)"]
        Stores["Svelte Stores / State"]
    end

    subgraph Preload ["Preload Bridge (Type-Safe Context Bridge)"]
        IPCBridge["electronAPI (window.electronAPI)"]
    end

    subgraph MainProcess ["Main Process (Node.js Runtime)"]
        IPCHandlers["IPC Main Handlers"]

        subgraph ServicesLayer ["Application Services Layer (Business Logic)"]
            BookingService["BookingService"]
            CustomerService["CustomerService"]
            InvoiceService["InvoiceService"]
            CalendarService["CalendarService"]
            ReportService["ReportService"]
        end

        subgraph RepoLayer ["Repository Layer (Data Access)"]
            BookingRepo["BookingRepository"]
            CustomerRepo["CustomerRepository"]
            InvoiceRepo["InvoiceRepository"]
            ExpenseRepo["ExpenseRepository"]
            MenuRepo["MenuRepository"]
        end

        subgraph DBLayer ["Database Layer"]
            DBConn["SQLite Connection (better-sqlite3)"]
            MigrationRunner["Migration Runner"]
            SQLiteFile["catering.db / electron-test.db"]
        end
    end

    SvelteViews --> Stores
    SvelteViews -- "electronAPI.invokes" --> IPCBridge
    IPCBridge -- "ipcRenderer.invoke" --> IPCHandlers
    IPCHandlers --> ServicesLayer
    ServicesLayer --> RepoLayer
    RepoLayer --> DBConn
    DBConn --> MigrationRunner
    MigrationRunner --> SQLiteFile
```

---

## 2. Layer Responsibilities & Design Rules

### Rule #1: Zero Business Logic or Direct SQL in UI Components
> 🚫 **BAD:** Writing SQL queries, financial calculations, or raw DB updates inside `.svelte` files.  
> ✅ **GOOD:** Components call `window.electronAPI.bookings.create(data)` and render state returned by services.

| Layer | Technologies | Responsibilities | Forbidden Patterns |
|---|---|---|---|
| **1. UI Layer (Renderer)** | Svelte 5, HTML5, CSS3, Tailwind/Vanilla | User interface rendering, form validation UX, local component state, event dispatching. | ❌ Direct SQL execution, raw file system access, financial formulas. |
| **2. IPC Bridge Layer** | Electron `contextBridge`, `ipcRenderer` | Type-safe bridge exposing validated APIs to window object via TypeScript definitions. | ❌ Exposing raw Node `child_process` or `fs` primitives directly to renderer. |
| **3. IPC Handler Layer** | `ipcMain.handle()` | Receives IPC requests, unpacks DTO payloads, delegates calls to Application Services, catches errors. | ❌ Heavy domain logic or direct SQL queries inside IPC route definitions. |
| **4. Services Layer** | TypeScript Application Services | **Core Business Rules:** Downpayment calculations, balance remaining, calendar load thresholds, state transitions (`PENDING` $\rightarrow$ `CONFIRMED`). | ❌ Direct UI rendering code or raw SQLite query string building. |
| **5. Repository Layer** | TypeScript Repositories | Prepared SQL statement execution, object relational mapping, table CRUD, transaction management. | ❌ Financial business logic decisions or UI state management. |
| **6. Database Layer** | SQLite (`better-sqlite3`), Migration Engine | Schema migrations (`schema_version`), table creation, indexes, foreign key enforcement, WAL mode. | ❌ Unindexed full table scans or unversioned schema modifications. |

---

## 3. Data Flow Example: Creating a Booking

```mermaid
sequenceDiagram
    autonumber
    participant UI as Svelte UI (BookingModal.svelte)
    participant IPC as Context Bridge (preload.ts)
    participant Main as IPC Main Handler (booking.ipc.ts)
    participant Svc as BookingService (booking.service.ts)
    participant Repo as BookingRepository (booking.repository.ts)
    participant DB as SQLite DB (catering.db)

    UI->>IPC: window.electronAPI.bookings.create(bookingData)
    IPC->>Main: ipcRenderer.invoke('bookings:create', payload)
    Main->>Svc: bookingService.createBooking(payload)
    Note over Svc: 1. Validate Pax & Package<br/>2. Compute Total = (Price * Pax) + Extras - Discount<br/>3. Determine Status (Unpaid / Partial / Paid)
    Svc->>Repo: bookingRepo.insert(processedBooking)
    Repo->>DB: db.prepare("INSERT INTO bookings ...").run()
    DB-->>Repo: Returns rowId & reference_no
    Repo-->>Svc: Booking Record
    Svc-->>Main: Success Result DTO
    Main-->>IPC: Resolved Promise
    IPC-->>UI: Returns created booking
    UI->>UI: Update Svelte store & Toast notification
```

---

## 4. Directory & Module Blueprint

```
src/
├── main/                           # Main Process (Node.js Runtime)
│   ├── index.ts                    # Electron App entry point & window manager
│   ├── ipc/                        # IPC Route Handlers
│   │   ├── booking.ipc.ts
│   │   ├── customer.ipc.ts
│   │   ├── invoice.ipc.ts
│   │   └── system.ipc.ts
│   ├── services/                   # Application Business Services
│   │   ├── booking.service.ts
│   │   ├── customer.service.ts
│   │   ├── invoice.service.ts
│   │   └── report.service.ts
│   ├── repositories/               # Repository Data Access Objects
│   │   ├── booking.repository.ts
│   │   ├── customer.repository.ts
│   │   ├── invoice.repository.ts
│   │   └── expense.repository.ts
│   └── database/                   # SQLite Engine & Migrations
│       ├── connection.ts           # better-sqlite3 singleton
│       ├── migration-runner.ts     # Automatic migration executor
│       └── migrations/             # SQL Migration Scripts
│           ├── 001_initial_schema.sql
│           └── 002_add_updated_at.sql
│
├── preload/                        # Preload Scripts
│   ├── index.ts                    # contextBridge exposure
│   └── types.ts                    # ElectronAPI TypeScript interfaces
│
└── renderer/                       # Renderer Process (Svelte 5 Application)
    ├── index.html                  # HTML Shell
    ├── src/
    │   ├── main.ts                 # Svelte mount
    │   ├── App.svelte              # Application layout & navigation router
    │   ├── lib/
    │   │   ├── components/         # Reusable Svelte UI components
    │   │   │   ├── Sidebar.svelte
    │   │   │   ├── Topbar.svelte
    │   │   │   └── KpiCard.svelte
    │   │   ├── pages/              # Primary Screen Views
    │   │   │   ├── Dashboard.svelte
    │   │   │   ├── Bookings.svelte
    │   │   │   ├── Calendar.svelte
    │   │   │   ├── Customers.svelte
    │   │   │   ├── Packages.svelte
    │   │   │   ├── Expenses.svelte
    │   │   │   ├── Reports.svelte
    │   │   │   └── Settings.svelte
    │   │   └── stores/             # Svelte Reactive Stores
    │   │       ├── bookingStore.ts
    │   │       └── themeStore.ts
    └── vite.config.ts              # Vite Bundler configuration
```
