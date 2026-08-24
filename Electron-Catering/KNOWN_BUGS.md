# Known Bugs & Issues Log — Jayraldine's Catering System

> **Freeze Version:** v4.0.6 (Legacy Bug & Issue Registry)  
> **Target Migration:** Electron + Node.js/SQLite  

This document logs historical bugs, edge cases, past fixes, and known pitfalls identified during testing and development of the legacy Python application.

---

## 1. Resolved Historical Bugs (Fixed in Legacy)

| Bug ID | Component / Area | Description | Resolution / Fix Applied |
|---|---|---|---|
| `BUG-001` | Application Startup (`main.py`) | `UnboundLocalError: cannot access local variable 'QApplication'` on cold startup. | Moved `QApplication` instantiation to module top-level scope before UI initialization. |
| `BUG-002` | Customers Page (`ui/customers_page.py`) | Customer delete confirmation dialog text overlapped buttons on low-resolution displays. | Refactored layout margins, auto-wrapping labels, and flexible dialog dimensions. |
| `BUG-003` | Booking Payment Modal (`booking_modal.py`) | Saving a booking with ₱0.00 down payment was incorrectly marking the status as `Fully Paid`. | Updated `_status_style` and payment logic to strictly enforce `Unpaid` status when amount paid is 0. |
| `BUG-004` | Calendar PDF Export (`utils/exporter.py`) | Calendar PDF export generated a single portrait page with small unreadable text when printed for office wall display. | Redesigned export to 100% **Landscape A4** wall calendar layout with pax badges inside date cells and multi-month range support. |
| `BUG-005` | PDF Merging (`utils/exporter.py`) | Exporting multi-page calendar PDF failed or outputted only 1 page when `pypdf` dependency was missing in PyInstaller environment. | Replaced multi-document PDF merger with a **single ReportLab Canvas** using `canvas.setPageSize(landscape(A4))` between pages. |

---

## 2. Active Known Issues & Migration Attention Areas

### 2.1 Concurrency & Database Locking
- **Issue:** SQLite database locking (`sqlite3.OperationalError: database is locked`) when background threads (e.g. notification scheduler, AI client) attempt concurrent write operations while UI is executing a transaction.
- **Migration Remedy:** In the new Electron architecture, handle all SQLite operations via a dedicated single-threaded IPC Database Service or use WAL mode (`PRAGMA journal_mode=WAL;`).

### 2.2 Date & Time Parsing Variances
- **Issue:** Legacy database contains mixed date formats (`YYYY-MM-DD`, `YYYY-MM-DD HH:MM:SS`, and ISO strings) due to legacy migrations.
- **Migration Remedy:** Standardize all date stores to ISO 8601 UTC strings (`YYYY-MM-DDTHH:mm:ss.sssZ`) in Electron / SQLite.

### 2.3 High-DPI UI Scaling & Font Rendering
- **Issue:** PySide6 QSS stylesheet rendering experienced font blurring or button padding clipping on 4K / High-DPI screens.
- **Migration Remedy:** Web-based UI in Electron (HTML5/CSS3/React/Tailwind) naturally handles high-DPI scaling seamlessly across Windows, Linux, and macOS.

### 2.4 Currency Precision & Floating-Point Rounding
- **Issue:** Using JavaScript/Python floats for financial totals can introduce floating-point rounding errors (e.g. `5000.000000000001`).
- **Migration Remedy:** Represent all monetary amounts in integer cents (e.g. `₱50,000.00` stored as `5000000` cents) or use `Decimal` / `bignumber.js` libraries.

---

## 3. Edge Cases Checklist for Electron Build

- [ ] **Zero-Downpayment Bookings:** Ensure ₱0 payments result in `Unpaid` status.
- [ ] **Overbooking Capacity Warning:** Trigger warning alert when total pax on a single date exceeds 600 pax.
- [ ] **Customer Deletion Integrity:** Prevent deletion of customers with active bookings.
- [ ] **Printable PDF Export:** Ensure wall calendar PDF export generates landscape pages without external PDF binary dependencies.
- [ ] **Database Backup & Recovery:** Ensure database backup creates a verifiable `.db` file that can be restored cleanly.
