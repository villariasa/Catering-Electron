# Business Rules & Logic — Jayraldine's Catering System

> **Freeze Version:** v4.0.6 (Legacy System Business Rules)  
> **Critical Notice:** UI can be redesigned, but hidden business rules and calculation logic **MUST NOT BE LOST** during Electron migration.

---

## Table of Contents
1. [Financial & Booking Calculations](#1-financial--booking-calculations)
2. [Payment & Downpayment Rules](#2-payment--downpayment-rules)
3. [Booking Lifecycle & Status Transitions](#3-booking-lifecycle--status-transitions)
4. [Calendar Load & Indicator Thresholds](#4-calendar-load--indicator-thresholds)
5. [Kitchen Display System (KDS) Logic](#5-kitchen-display-system-kds-logic)
6. [Address & Customer Verification Rules](#6-address--customer-verification-rules)
7. [Invoice & PDF Export Formatting Rules](#7-invoice--pdf-export-formatting-rules)
8. [Data Import/Export & Sanitization Rules](#8-data-importexport--sanitization-rules)

---

## 1. Financial & Booking Calculations

### 1.1 Booking Total Calculation Formula
$$\text{Booking Total} = (\text{Package Price Per Pax} \times \text{Pax Count}) + \sum(\text{Custom Additional Dishes}) + \text{Extra Charges} - \text{Discount Amount}$$

- **Package Base Price:** `pkg_price_per_pax` (from selected package) $\times$ `bk_pax`.
- **Minimum Pax Constraint:** If selected package has `pkg_min_pax` (e.g. 30 pax), the system warns if `bk_pax < pkg_min_pax`.
- **Custom Add-on Dishes:** Additional menu items selected outside the package bundle are billed at `mi_price` per item or flat custom price.
- **Extra Charges:** Delivery fees, venue setup fees, service charge, waiters fee.
- **Discounts:** Flat peso discount (₱) or percentage discount (%).

### 1.2 Balance Remaining Calculation Formula
$$\text{Remaining Balance} = \text{Booking Total Amount} - \text{Amount Paid}$$
$$\text{Amount Paid} = \text{Down Payment} + \sum(\text{Subsequent Payment Records})$$

- **Zero Down Payment (`₱0.00`):** `Remaining Balance == Booking Total Amount`.
- **Partial Payment:** `0 < Amount Paid < Total Amount`.
- **Full Payment:** `Amount Paid >= Total Amount`, resulting in `Remaining Balance == ₱0.00`.

---

## 2. Payment & Downpayment Rules

### 2.1 Payment Status Determination Logic
When a payment or down payment is recorded, the booking and invoice statuses are determined by the following strict rules:

| Condition | Payment Status (`inv_status` & `bk_payment_status`) | Action Required |
|---|---|---|
| `Amount Paid == 0` | **`Unpaid`** | Remaining balance equals total amount. |
| `0 < Amount Paid < Total Amount` | **`Partial`** | Down payment / installment recorded. Remaining balance > 0. |
| `Amount Paid >= Total Amount` | **`Paid`** (or **`Fully Paid`**) | Balance = ₱0.00. Invoice closed. |

### 2.2 Payment Confirmation Rules
- **Rule 2.2.1:** A booking saved with **₱0.00 down payment** MUST **NOT** be automatically marked as `Paid` or `Fully Paid`. It must remain `Unpaid` (or `Pending`).
- **Rule 2.2.2:** Quick down payment options in `ConfirmBookingDialog`:
  - `Fully Paid`: Sets Amount Paid = Total Amount.
  - `50% Downpayment`: Sets Amount Paid = `Total Amount * 0.50`.
  - `30% Downpayment`: Sets Amount Paid = `Total Amount * 0.30`.
  - `Custom Amount`: User types exact numeric value.
- **Rule 2.2.3:** Payment records are appended to `payment_records` table with columns `pr_amount`, `pr_payment_date`, `pr_payment_method` (`Cash`, `GCash`, `Bank Transfer`, `Check`), `pr_reference_number`, `pr_is_downpayment`, `pr_is_verified`.

---

## 3. Booking Lifecycle & Status Transitions

### 3.1 Booking Status Definitions
- **`PENDING`:** Initial booking inquiry or draft. Date reserved provisionally.
- **`CONFIRMED`:** Customer has agreed, package chosen, down payment or agreement verified. Triggers Kitchen prep ticket.
- **`COMPLETED`:** Event catering has been successfully executed and finished.
- **`CANCELLED`:** Event cancelled by customer or office. Excluded from active calendar pax counts, weekly revenue KPIs, and kitchen prep.

### 3.2 State Transition Matrix
```
[New Inquiry] ──> PENDING ──(Confirm Payment / Verify)──> CONFIRMED ──(Event Finished)──> COMPLETED
                    │                                          │
                    └───(Customer Cancels)─────────────────────┴──> CANCELLED
```

- **Cancellation Rule:** When a booking is marked `CANCELLED`, its status in `invoices` is updated to `Cancelled`, and its pax count is set to 0 in active load calculations.

---

## 4. Calendar Load & Indicator Thresholds

### 4.1 Daily Pax Load Indicators
To prevent office staff from overbooking catering capacity on any given day, calendar cells display visual badges based on the sum of pax for all non-cancelled events on that date:

$$\text{Daily Total Pax} = \sum_{\text{events on date}} \text{bk\_pax} \quad (\text{where } \text{bk\_status} \neq \text{'CANCELLED'})$$

| Daily Total Pax Range | Color Theme | Meaning | Badge Text Style |
|---|---|---|---|
| `< 400 Pax` | 🟩 **Green** (`#16A34A` / `#DCFCE7`) | **Available / Normal Load** | `N BOOKINGS (X Pax)` |
| `400 – 599 Pax` | 🟨 **Amber** (`#D97706` / `#FEF3C7`) | **Near Full Capacity** | `N BOOKINGS (X Pax)` |
| `>= 600 Pax` | 🟥 **Red** (`#DC2626` / `#FEE2E2`) | **Fully Booked / Heavy Load** | `N BOOKINGS (X Pax)` |

### 4.2 PDF Export Rules
- Wall calendar PDF exports MUST be rendered in **Landscape A4 orientation** (`841.89 × 595.28 pt`).
- First page of each month is the **Landscape Wall Calendar Grid** with date cells, today highlights, and inner pax badges.
- Subsequent pages are **Landscape Itemized Booking Agendas** detailing reference numbers, customer names, venues, pax, and payment status pills.

---

## 5. Kitchen Display System (KDS) Logic

- **Automated Ticket Creation:** When a booking enters `CONFIRMED` status, a record is automatically inserted into `kitchen_orders` with status `Queued`.
- **Preparation Quantity Scaling:** Dish preparation targets are computed based on pax:
$$\text{Prep Target Quantity} = \text{Pax Count} \times \text{Standard Portion Factor}$$
- **KDS Status Workflow:** `Queued` $\rightarrow$ `In Prep` $\rightarrow$ `Ready for Dispatch` $\rightarrow$ `Completed`.

---

## 6. Address & Customer Verification Rules

- **Cebu Master Location Mapping:** Addresses are structured into Province (`address_provinces`), City/Municipality (`address_cities`), and Barangay (`address_barangays`).
- **Contact Number Format:** Validated for Philippine format:
  - Mobile: `09XXXXXXXXX` (11 digits) or `+639XXXXXXXXX`.
  - Landline: `(032) XXX-XXXX`.
- **Customer Lifetime Value (LTV):** Sum of all completed invoice amounts for `cus_id`.

---

## 7. Invoice & PDF Export Formatting Rules

- **Invoice Reference Format:** `INV-YYYY-XXXX` (e.g. `INV-2026-0042`).
- **Booking Reference Format:** `BK-YYYY-XXXX` (e.g. `BK-2026-0108`).
- **Currency Format:** Philippine Peso symbol `₱` formatted with commas and 2 decimal places (e.g., `₱150,000.00`).
- **Date Format:** `MMM DD, YYYY` (e.g., `Aug 24, 2026`).

---

## 8. Data Import/Export & Sanitization Rules

- **Export Formats:** Master System Excel (`.xlsx`) with formatted headers or CSV (`.csv`).
- **Backup Integrity:** Automatic backup creating `catering_backup_YYYYMMDD_HHMMSS.db` prior to any schema migration or data import batch.
- **Audit Logging:** Every INSERT, UPDATE, or DELETE on `bookings`, `invoices`, `customers`, `expenses`, or `payment_records` writes a record to `audit_logs`.
