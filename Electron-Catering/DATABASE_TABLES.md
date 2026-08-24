# Database Tables Mapping — Jayraldine's Catering System

> **Freeze Version:** v4.0.6 (Legacy SQLite Database Mapping)  
> **Database File:** `catering.db` (28 Tables, 11 Views)  

This document maps every database table and SQL view to the application screens, features, and modules that consume or modify them.

---

## Table Inventory & Screen Mapping Matrix

| Table Name | Screen / Module | Access Type | Description & Primary Use |
|---|---|---|---|
| `bookings` | Dashboard, Bookings, Calendar, Billing, Kitchen, Reports | Read / Write / Delete | Core catering reservation records, event details, pax count, financial totals, and booking status. |
| `booking_items` | Bookings, BookingModal | Read / Write | Itemized charges, package selections, and extra fees linked to a booking. |
| `booking_menu_items` | Bookings, Menu, Kitchen, Reports | Read / Write | Junction table mapping specific menu items/dishes to a booking. |
| `customers` | Customers, Bookings, Billing, Reports | Read / Write / Delete | Customer CRM records, names, phone numbers, email, and creation timestamps. |
| `customer_addresses` | Customers, Bookings | Read / Write | Junction table linking customers to address records. |
| `addresses` | Customers, Bookings, AddressSearch | Read / Write | Detailed street address records linked to barangays and cities. |
| `address_cities` | Customer Registration, Address Lookup | Read Only | Pre-populated Cebu cities/municipalities master reference table. |
| `address_barangays` | Customer Registration, Address Lookup | Read Only | Pre-populated Cebu barangays master reference table. |
| `invoices` | Billing, Bookings, Cash Flow, Dashboard, Reports | Read / Write | Billing invoices linked to bookings, total invoice amounts, amount paid, and balance due. |
| `payment_records` | Billing, Cash Flow, Bookings, Reports | Read / Write | Detailed payment transaction log (downpayments, installments, final balances, GCash refs). |
| `cash_flow_transactions` | Cash Flow Ledger, Reports | Read / Write | Accounting cash ledger tracking deposits, withdrawals, and running cash balances. |
| `expenses` | Expenses, Dashboard, Cash Flow, Reports | Read / Write / Delete | Business operating expenses, ingredient costs, staff wages, utilities, and maintenance costs. |
| `menu_items` | Menu, Bookings, Reports | Read / Write / Delete | Dishes master catalog, category, price, package tier, and availability status. |
| `packages` | Menu, Bookings | Read / Write / Delete | Catering package bundles (Standard, Executive, VIP) with base price per pax and min pax. |
| `package_items` | Menu, Bookings | Read / Write | Items included within each catering package bundle. |
| `kitchen_orders` | Kitchen Display (KDS), Bookings | Read / Write | Kitchen tickets for food preparation, event date/time, pax, and status (`Queued`, `In Prep`, `Completed`). |
| `kitchen_tasks` | Kitchen Display (KDS) | Read / Write | Sub-task checklist items for kitchen prep tickets. |
| `calendar_events` | Calendar, Bookings | Read / Write | Manual calendar reminders, notes, and blackout dates. |
| `business_info` | Settings, Invoices PDF, Wall Calendar PDF | Read / Write | Business header information (Name, Tagline, Phone, Email, Address, Logo path). |
| `app_settings` | Settings, Application Shell | Read / Write | System key-value settings (Theme mode, Accent color, Notification preferences). |
| `database_backups` | Settings / Database Management | Read / Write | Audit log of database backups created, file paths, and file sizes. |
| `audit_logs` | Settings, Dashboard | Read / Write | System audit trail recording user actions, inserts, edits, and deletions. |
| `notifications` | Topbar, Sidebar, Application Shell | Read / Write | In-app notification alerts (upcoming event reminders, unpaid invoice alerts, low stock). |
| `occasions` | Bookings, Reports | Read / Write | Master list of catering event occasions (Wedding, Birthday, Corporate, Fiesta, etc.). |
| `customer_follow_ups` | Customers | Read / Write | Scheduled follow-up notes and contact reminders for clients. |
| `customer_loyalty_tiers` | Customers | Read / Write | Customer LTV tiers (`VIP`, `Regular`, `New`). |
| `monthly_sales_targets` | Dashboard, Reports | Read / Write | Monthly target revenue goals vs actual sales. |

---

## SQL Views & Screen Usage

| View Name | Source Tables | Screen / Module Using View | Purpose |
|---|---|---|---|
| `v_dashboard_kpis` | `bookings`, `invoices` | Dashboard Page | Pre-computed KPI metrics (Today's events, Pending count, Weekly revenue, Unpaid total, Today's pax). |
| `v_upcoming_events` | `bookings` | Dashboard, Calendar | Filtered view of upcoming events sorted by event date and time. |
| `v_profit_summary` | `bookings`, `expenses` | Dashboard, Reports | Monthly revenue vs expenses vs net profit calculation. |
| `v_customer_ledger` | Customers Page | `customers`, `bookings`, `invoices`, `payment_records` | Full accounting ledger of debits, credits, and payments per customer. |
| `v_customer_order_frequency` | Dashboard, Customers, Reports | `bookings` | Top 10 customers by confirmed booking count. |
| `v_monthly_income` | Reports, Dashboard | `invoices` | Breakdown of total invoice revenue and paid amounts by month for current year. |
| `v_payment_methods` | Reports, Dashboard | `bookings`, `payment_records` | Distribution count of payment modes used (Cash, GCash, Bank Transfer). |
| `v_report_kpis` | Reports Page | `bookings`, `invoices` | High-level analytics summary KPIs. |
| `v_top_menu_items` | Dashboard, Reports | `booking_menu_items`, `menu_items`, `bookings` | Most frequently ordered dishes ranking. |
| `v_recent_activity` | Dashboard Page | `bookings` | Recent booking creation and status updates activity feed. |
| `v_audit_log_recent` | Settings Page | `audit_logs` | Latest 50 system audit logs stream. |
