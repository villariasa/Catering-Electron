# Features & Screen Inventory — Jayraldine's Catering System

> **Freeze Version:** v4.0.6 (Legacy Python/PySide6 Desktop Application)  
> **Target Migration Platform:** Electron + React/Vue + Node.js/SQLite  

This document provides a comprehensive inventory of every screen, dialog, component, and user flow in the current application prior to rewriting in Electron.

---

## Table of Contents
1. [Application Shell & Navigation](#application-shell--navigation)
2. [Dashboard Page](#1-dashboard-page)
3. [Bookings & Orders Page](#2-bookings--orders-page)
4. [Calendar & Schedule Page](#3-calendar--schedule-page)
5. [Customers Directory Page](#4-customers-directory-page)
6. [Menu & Packages Page](#5-menu--packages-page)
7. [Expenses & Operating Costs Page](#6-expenses--operating-costs-page)
8. [Billing & Payment Invoices Page](#7-billing--payment-invoices-page)
9. [Cash Flow Ledger Page](#8-cash-flow-ledger-page)
10. [Reports & Analytics Page](#9-reports--analytics-page)
11. [Kitchen Display System (KDS) Page](#10-kitchen-display-system-kds-page)
12. [Inventory Page](#11-inventory-page)
13. [AI Assistant Page](#12-ai-assistant-page)
14. [Settings & Database Management Page](#13-settings--database-management-page)
15. [Dialogs & Modal Wizards](#14-dialogs--modal-wizards)

---

## Application Shell & Navigation

- **Sidebar Navigation:** Collapsible left sidebar with dark theme styling, logo, version badge, navigation links with SVG icons (Dashboard, Bookings, Calendar, Customers, Menu, Expenses, Billing, Cash Flow, Reports, Kitchen, Settings), notification badge indicator, collapse/expand toggle button.
- **Topbar Bar:** Global search input with instant search popover, system clock/date display, quick "+ New Booking" action button, notifications panel launcher with unread counter, theme toggle (Light/Dark mode), user profile dropdown with role badge.
- **Global Floating AI Mascot:** Draggable floating avatar button at bottom-right, pulsing animation, instant AI assistant modal drawer.

---

## 1. Dashboard Page

- **Screen Name:** `DashboardPage` (`ui/dashboard_page.py`)
- **Purpose:** Central executive overview of catering operations, key performance indicators (KPIs), upcoming events, revenue metrics, and quick actions.
- **Current Features:**
  - 4 Main KPI Cards: Today's Events, Pending Bookings, Weekly Revenue (₱), Unpaid Invoices Amount (₱).
  - Quick Action Buttons: Create Booking, Add Customer, Log Expense, View Calendar.
  - Today's Catering Schedule List with status pills and pax counts.
  - Upcoming Events Feed (Next 7 Days).
  - Revenue vs Expense monthly bar chart widget.
  - Popular Menu Items breakdown table.
  - Recent Activity Audit Trail log stream.
- **Buttons & Interactive Elements:**
  - `+ New Booking` (Opens `BookingModal` in creation mode)
  - `+ New Customer` (Opens Quick Customer Dialog)
  - `+ Add Expense` (Navigates to Expenses / Opens Expense Dialog)
  - `View Calendar` (Navigates to Calendar Page)
  - `Refresh Data` (Re-queries database and updates KPI cards)
  - Event Row Click (Opens Booking Details View)
- **Database Tables Used:** `bookings`, `invoices`, `customers`, `expenses`, `menu_items`, `booking_menu_items`, `audit_logs`
- **Views Used:** `v_dashboard_kpis`, `v_upcoming_events`, `v_profit_summary`, `v_top_menu_items`, `v_recent_activity`
- **Business Rules:**
  - Weekly revenue calculates bookings where `bk_event_date` is within the current calendar week (Monday–Sunday) and status is `CONFIRMED` or `COMPLETED`.
  - Unpaid invoices KPI includes sum of (`inv_total_amount - inv_amount_paid`) where `inv_status != 'Paid'`.
  - Today's Pax aggregates `SUM(bk_pax)` for `bk_event_date = DATE('now')`.
- **Known Bugs:** Chart re-rendering on high-DPI displays occasionally flickers during quick tab switches.
- **Priority:** High

---

## 2. Bookings & Orders Page

- **Screen Name:** `BookingPage` (`ui/booking_page.py`)
- **Purpose:** Full management of catering bookings, orders, event dates, guest counts (pax), package selections, and lifecycle statuses.
- **Current Features:**
  - Search bar filtering by Reference #, Customer Name, Occasion, or Venue.
  - Filter Popover: Filter by Status (`All`, `Pending`, `Confirmed`, `Completed`, `Cancelled`), Payment Status (`All`, `Paid`, `Partial`, `Unpaid`), Date Range.
  - Summary KPI cards: Total Bookings, Confirmed Bookings, Pending Requests, Total Guests.
  - Data Table: Ref #, Customer Name, Occasion, Event Date & Time, Venue, Pax, Total Amount (₱), Down Payment / Amount Paid (₱), Remaining Balance (₱), Booking Status, Actions.
  - Status badges with distinct color coding:
    - `Confirmed` (Green `#22C55E`)
    - `Pending` (Amber `#F59E0B`)
    - `Completed` (Blue `#3B82F6`)
    - `Cancelled` (Red `#EF4444`)
  - Payment Status badges: `Paid`, `Partial`, `Unpaid`.
  - Action buttons per row: View/Edit, Confirm Booking & Payment, Print Receipt/Invoice PDF, Delete/Cancel.
  - Pagination controls (Items per page selector, Page navigation).
- **Buttons & Interactive Elements:**
  - `+ New Booking` (Opens `BookingModal`)
  - `Export Data` (Opens `ExportWizardDialog` preselected for Bookings)
  - `Import Data` (Opens `ImportWizardDialog`)
  - Table Row Actions: `Edit` (pencil icon), `Confirm` (check icon), `Invoice PDF` (file-text icon), `Delete` (trash icon)
- **Database Tables Used:** `bookings`, `customers`, `packages`, `booking_menu_items`, `booking_items`, `invoices`, `payment_records`
- **Business Rules:**
  - Total Amount = Package Base Price (`pkg_price_per_pax * bk_pax`) + Additional Dishes Custom Cost + Additional Charges - Discounts.
  - When saving a booking with Down Payment = ₱0.00, status must remain `Unpaid` (or `Pending`), **NOT** automatically `Paid`.
  - When Down Payment > 0 and < Total Amount, status is `Partial`.
  - When Down Payment >= Total Amount, status is `Paid`.
  - Deleting a booking creates an `audit_logs` record and soft-deletes or cancels associated invoices.
- **Known Bugs:** Deleting a booking with existing verified payment records requires cascading prompt confirmation.
- **Priority:** Critical

---

## 3. Calendar & Schedule Page

- **Screen Name:** `CalendarPage` (`ui/calendar_page.py`)
- **Purpose:** Interactive monthly grid view displaying scheduled catering events, daily booking load indicators, and multi-month printable PDF wall calendar exports.
- **Current Features:**
  - Month/Year Navigation header with `Previous Month`, `Next Month`, `Today` reset button.
  - Weekday header grid (Sunday to Saturday).
  - 7x5 / 7x6 Monthly Calendar Grid cells showing:
    - Date number (highlighted for Today).
    - Booking count & Pax badges inside cell.
    - Pax load color-coding:
      - 🟩 **Available / Light Load:** `< 400 pax` (Green `#16A34A` / Light `#DCFCE7`)
      - 🟨 **Near Full:** `400 – 599 pax` (Amber `#D97706` / Light `#FEF3C7`)
      - 🟥 **Fully Booked:** `>= 600 pax` (Red `#DC2626` / Light `#FEE2E2`)
  - Day Cell Click: Side panel populates with itemized list of bookings for that specific date.
  - Multi-Month Printable Wall Calendar PDF Export Wizard (`CalendarExportDialog`):
    - Date range selection (From Month/Year → To Month/Year).
    - Presets: This Month, Next 3 Mo., Next 6 Mo., Full Year, Prev 3 Mo.
    - Toggle itemized agenda pages.
    - Toggle empty month pages.
    - Generates 100% **Landscape A4** printable wall calendar with day cell badges + itemized agenda pages.
- **Buttons & Interactive Elements:**
  - `< Prev` and `Next >` Month Buttons
  - `Today` Button
  - `Export PDF` (Opens `CalendarExportDialog`)
  - Date Cell Click (Opens Day Events Panel)
  - Event Item Click in side panel (Opens Booking Details)
- **Database Tables Used:** `bookings`, `calendar_events`
- **Business Rules:**
  - Bookings with `CANCELLED` status are excluded from daily pax load calculations and calendar badges.
  - PDF export must use landscape A4 for both wall calendar grid and itemized agenda pages.
- **Known Bugs:** None in v4.0.6.
- **Priority:** High

---

## 4. Customers Directory Page

- **Screen Name:** `CustomersPage` (`ui/customers_page.py`)
- **Purpose:** Master customer relationship management (CRM), contact information, location addresses (Province, City, Barangay), booking history, and customer lifetime value (LTV).
- **Current Features:**
  - Search by Name, Contact Number, Email, or Address.
  - Cebu Address Autocomplete Integration (Province, City/Municipality, Barangay dropdowns from `address_cities` and `address_barangays`).
  - Loyalty Tier Badge (`VIP`, `Regular`, `New`).
  - Customer Card / Table view toggle.
  - Customer Profile Drawer: Total Bookings count, Total Spent (₱), Last Booking Date, Address Details, Booking History table, Customer Notes.
  - Add / Edit / Delete Customer actions.
- **Buttons & Interactive Elements:**
  - `+ Add Customer` (Opens Add Customer Dialog)
  - `Export Directory` (Exports customer list to Excel/CSV)
  - `View Ledger` (Opens Customer Ledger View)
  - `Edit` and `Delete` buttons per customer row/card
- **Database Tables Used:** `customers`, `customer_addresses`, `addresses`, `address_cities`, `address_barangays`, `bookings`, `invoices`
- **Views Used:** `v_customer_ledger`, `v_customer_order_frequency`
- **Business Rules:**
  - Customer phone numbers are formatted and validated (Philippine mobile format e.g. `09XX-XXX-XXXX` or `+639XXXXXXXXX`).
  - Cannot hard-delete a customer who has active non-cancelled bookings without confirmation.
- **Known Bugs:** Delete dialog text overflow fixed in v4.0.4.
- **Priority:** High

---

## 5. Menu & Packages Page

- **Screen Name:** `MenuPage` (`ui/menu_page.py`)
- **Purpose:** Management of food dishes, menu categories, package pricing tiers (Standard, Premium, Deluxe), package menu item compositions, and availability status.
- **Current Features:**
  - Tab 1: **Dishes / Menu Items**
    - Filter by Category (`Main Course`, `Appetizer`, `Dessert`, `Beverage`, `Soup`, `Pasta/Noodle`, `Seafood`, `Pork`, `Beef`, `Chicken`).
    - Filter by Package Tier (`Standard`, `Executive`, `VIP`).
    - Dish Card Grid with price, category badge, package tier badge, description, availability toggle switch (`Available` / `Out of Stock`).
    - Add / Edit / Delete Dish modal dialog.
  - Tab 2: **Catering Packages**
    - Package Cards (e.g. *Standard Fiesta Package*, *Executive Wedding Package*, *VIP Gala Package*).
    - Base Price per Pax (₱/pax) and Minimum Pax requirement.
    - Included Menu Items checklist manager.
    - Add / Edit Package modal dialog.
- **Buttons & Interactive Elements:**
  - `+ Add Menu Item` (Opens Menu Item Form Dialog)
  - `+ Create Package` (Opens Package Form Dialog)
  - Dish Availability Toggle Switch (Instant DB update)
  - Category Filter Buttons
  - Edit & Delete buttons per item/package
- **Database Tables Used:** `menu_items`, `packages`, `package_items`
- **Business Rules:**
  - Dishes marked `Out of Stock` cannot be selected as new custom add-ons in `BookingModal`.
  - Package minimum pax must be enforced (default: 30 pax).
- **Known Bugs:** None.
- **Priority:** Medium

---

## 6. Expenses & Operating Costs Page

- **Screen Name:** `ExpensesPage` (`ui/expenses_page.py`)
- **Purpose:** Tracking business operating expenses, ingredient costs, staff wages, utilities, equipment maintenance, and venue rental costs.
- **Current Features:**
  - Expense Summary KPI Cards: Total Expenses (Selected Period), Ingredients & Supplies, Staff & Labor, Utilities & Rent.
  - Expense Entry Form / Modal: Category (`Ingredients`, `Labor/Wages`, `Utilities`, `Transportation`, `Equipment`, `Marketing`, `Miscellaneous`), Description, Amount (₱), Expense Date, Payment Method.
  - Expense Log Table with search and category filtering.
  - Monthly Expense Breakdown Chart.
  - Export Expenses to Excel/CSV.
- **Buttons & Interactive Elements:**
  - `+ Record Expense` (Opens Add Expense Dialog)
  - Category Filter Dropdown
  - Date Range Picker
  - `Export Expenses` button
  - Edit & Delete buttons per expense entry
- **Database Tables Used:** `expenses`
- **Views Used:** `v_profit_summary`
- **Business Rules:**
  - Expense amounts must be positive numbers > 0.
  - Expense date defaults to today's date if unspecified.
- **Known Bugs:** None.
- **Priority:** Medium

---

## 7. Billing & Payment Invoices Page

- **Screen Name:** `BillingPage` (`ui/billing_page.py`)
- **Purpose:** Financial invoice management, tracking payment status, recording downpayments and final balance payments, issuing receipts, and payment verification.
- **Current Features:**
  - Invoices Table: Invoice # (`INV-YYYY-XXXX`), Booking Ref #, Customer Name, Event Date, Total Amount (₱), Down Payment Paid (₱), Amount Paid (₱), Balance Due (₱), Payment Status (`Paid`, `Partial`, `Unpaid`), Verified Checkbox.
  - Payment Modal (`ConfirmBookingDialog`):
    - Display Total Amount, Previous Payments.
    - Down Payment options: Quick selection (`Fully Paid`, `50% Downpayment`, `30% Downpayment`, `Custom Amount`).
    - Payment Method (`Cash`, `GCash`, `Bank Transfer / BDO / BPI`, `Check`).
    - Reference Number input (for GCash/Bank Transfer).
    - Payment Notes.
  - Invoice & Receipt PDF Generator (`utils/exporter.py`):
    - Professional branded receipt layout.
    - Business header, logo, customer details, itemized breakdown, downpayment recorded, remaining balance, signature block.
- **Buttons & Interactive Elements:**
  - `+ Record Payment` / `Confirm Payment` button
  - `Print Invoice PDF` button
  - `Verify Payment` toggle checkbox
  - Search by Invoice #, Reference, or Customer Name
  - Filter by Payment Status (`All`, `Paid`, `Partial`, `Unpaid`)
- **Database Tables Used:** `invoices`, `payment_records`, `bookings`, `customers`
- **Views Used:** `v_customer_ledger`
- **Business Rules:**
  - Invoice balance = `inv_total_amount - inv_amount_paid`.
  - When `inv_amount_paid == 0`, status = `Unpaid`.
  - When `0 < inv_amount_paid < inv_total_amount`, status = `Partial`.
  - When `inv_amount_paid >= inv_total_amount`, status = `Paid` and balance = 0.
  - Recording a payment creates an entry in `payment_records` and updates `inv_amount_paid` in `invoices`.
- **Known Bugs:** Verified downpayments must immediately update both `invoices` and `bookings` table cash balances.
- **Priority:** Critical

---

## 8. Cash Flow Ledger Page

- **Screen Name:** `CashFlowPage` (`ui/cash_flow_page.py`)
- **Purpose:** Complete financial ledger combining all cash inflows (payments received, deposits) and cash outflows (expenses, refunds) for accounting and audit compliance.
- **Current Features:**
  - Cash Flow Summary KPI Cards: Total Cash Inflow (₱), Total Cash Outflow (₱), Net Cash Flow / Operating Surplus (₱).
  - Cash Ledger Table: Transaction Date, Reference/Check #, Particulars / Description, Inflow/Deposit (₱), Outflow/Expense (₱), Running Cash Balance (₱), Actual Sales, Variance.
  - Filter by Date Range (This Month, Last Month, Year-to-Date, Custom).
  - Export Cash Flow Ledger to PDF (`export_cash_flow_pdf`) or Master Excel.
- **Buttons & Interactive Elements:**
  - Date Filter Controls
  - `Export PDF` button
  - `Export Excel` button
- **Database Tables Used:** `cash_flow_transactions`, `invoices`, `payment_records`, `expenses`
- **Business Rules:**
  - Running balance is calculated sequentially: `Running Balance[i] = Running Balance[i-1] + Deposit[i] - Withdrawal[i]`.
  - Net Profit = `Total Revenue - Total Expenses`.
- **Known Bugs:** None.
- **Priority:** High

---

## 9. Reports & Analytics Page

- **Screen Name:** `ReportsPage` (`ui/reports_page.py`)
- **Purpose:** Visual business intelligence, revenue trend analysis, booking volume metrics, top customer analysis, and financial performance reports.
- **Current Features:**
  - KPI Cards: Total Bookings, Total Guests Served (Pax), Total Revenue Generated (₱), Outstanding Receivables (₱).
  - Interactive Charts:
    - Monthly Revenue & Growth Trend (Line/Bar Chart).
    - Booking Status Distribution (Donut/Pie Chart).
    - Top 10 Catering Occasions Breakdown.
    - Popular Menu Items Ranking.
    - Payment Method Preference Breakdown (GCash vs Cash vs Bank Transfer).
  - Filter by Year, Month, or Custom Date Range.
  - Export Master System Workbook (Excel `.xlsx` with multiple formatted tabs).
- **Buttons & Interactive Elements:**
  - Year/Month Filter Dropdowns
  - `Generate Master Report` button
  - `Export Charts` / `Print Summary PDF`
- **Database Tables Used:** `bookings`, `invoices`, `expenses`, `customers`, `menu_items`, `booking_menu_items`
- **Views Used:** `v_report_kpis`, `v_monthly_income`, `v_profit_summary`, `v_payment_methods`, `v_top_menu_items`
- **Business Rules:**
  - Only non-cancelled bookings are counted in revenue metrics and guest totals.
- **Known Bugs:** None.
- **Priority:** High

---

## 10. Kitchen Display System (KDS) Page

- **Screen Name:** `KitchenPage` (`ui/kitchen_page.py`)
- **Purpose:** Kitchen staff operational board for viewing upcoming order preparation tickets, dish quantities to cook, and task checklists.
- **Current Features:**
  - Kitchen Order Cards grouped by Event Date & Time.
  - Order details: Booking Ref, Customer Name, Event Name, Pax Count, Event Time, Venue.
  - Consolidated Preparation Checklist (e.g. *Lechon Pork Belly - 20 kg*, *Pork Hamonado - 15 kg*, *BAM-I Noodles - 10 trays*).
  - Order Status Workflow buttons: `Queued` → `In Prep` → `Ready for Dispatch` → `Completed`.
  - Kitchen Task Checkbox list per order ticket.
- **Buttons & Interactive Elements:**
  - `Start Preparation` button
  - `Mark Ready` button
  - `Mark Completed` button
  - Individual Task Item Checkboxes
- **Database Tables Used:** `kitchen_orders`, `kitchen_tasks`, `bookings`, `booking_menu_items`
- **Business Rules:**
  - Kitchen orders are automatically created or updated when a booking status changes to `CONFIRMED`.
  - Item prep quantities scale dynamically based on booking pax (`pax * standard_portion_per_pax`).
- **Known Bugs:** None.
- **Priority:** Medium

---

## 11. Inventory Page

- **Screen Name:** `InventoryPage` (`ui/inventory_page.py`)
- **Purpose:** Ingredient, kitchen equipment, cutlery, and catering supply stock level tracking.
- **Current Features:**
  - Stock Table: Item Name, Category, Current Quantity, Unit of Measure (kg, pcs, trays, liters), Minimum Stock Level, Reorder Alert Status.
  - Quick Stock Adjustment (+ / - Quantity).
  - Reorder Low Stock Items list.
- **Buttons & Interactive Elements:**
  - `+ Add Inventory Item` button
  - `Adjust Stock` button
  - Category Filter
- **Database Tables Used:** `app_settings` / inventory tables
- **Business Rules:**
  - Triggers low stock alert notification when `Current Quantity <= Minimum Stock Level`.
- **Known Bugs:** Basic inventory module in v4.0.6.
- **Priority:** Low

---

## 12. AI Assistant Page

- **Screen Name:** `AIPage` (`ui/ai_page.py` & `components/global_ai_floating.py`)
- **Purpose:** Conversational AI copilot ("Jayraldine Assistant") providing instant business insights, booking lookup, recipe portion recommendations, and revenue Q&A.
- **Current Features:**
  - Chat Interface with message history.
  - Natural Language Database Q&A (e.g., *"How many bookings do we have this weekend?"*, *"What is our total revenue for August?"*).
  - Quick Suggestion Prompts:
    - *"Show summary of unpaid invoices"*
    - *"What are the top 5 most popular dishes?"*
    - *"Calculate ingredient portions for 200 pax"*
    - *"Generate monthly business summary"*
  - Integration with local fallback engine & OpenAI / Gemini API endpoints.
- **Buttons & Interactive Elements:**
  - Chat Input Box & `Send` button
  - Quick Suggestion Pill Buttons
  - Clear History button
- **Database Tables Used:** `bookings`, `invoices`, `customers`, `menu_items`, `expenses`
- **Business Rules:**
  - Fallback offline response generator works even when internet connectivity is lost.
- **Known Bugs:** None.
- **Priority:** Low

---

## 13. Settings & Database Management Page

- **Screen Name:** `SettingsPage` (`ui/settings_page.py`)
- **Purpose:** System configuration, business profile (Name, Tagline, Phone, Address, Logo), database backup/restore, audit logs, and theme customization.
- **Current Features:**
  - Business Profile Editor: Business Name, Tagline, Contact #, Email, Address, Upload Logo.
  - Database Management Tab:
    - `Create Backup Now` (Saves timestamped `.db` file to backup folder).
    - `Restore Database` (Restores database from selected `.db` backup file).
    - `Reset / Clean Sample Data` (With safety confirmation).
    - Database Backup History Table (`database_backups`).
  - System Audit Logs Viewer (`audit_logs` table stream).
  - Theme Customizer: Dark Mode / Light Mode, Accent Color Palette selection (`Emerald Green`, `Sapphire Blue`, `Ruby Red`, `Amber Gold`, `Deep Purple`).
- **Buttons & Interactive Elements:**
  - `Save Profile Changes` button
  - `Create Backup` button
  - `Restore Backup` button
  - Accent Color Swatches
- **Database Tables Used:** `business_info`, `app_settings`, `database_backups`, `audit_logs`
- **Business Rules:**
  - Creating a backup automatically creates an entry in `database_backups` with file path and file size.
  - Restoring a backup requires creating an automatic safety backup first before replacing `catering.db`.
- **Known Bugs:** None.
- **Priority:** High

---

## 14. Dialogs & Modal Wizards

1. **`BookingModal` (`components/booking_modal.py`):**
   - Step 1: Customer Details (Search existing or create new with Cebu address lookup).
   - Step 2: Event Details (Occasion, Date, Time, Venue, Pax count).
   - Step 3: Package & Dishes Selection (Select base package + add custom dishes).
   - Step 4: Pricing & Payment (Total Amount, Down Payment amount paid, Payment Method, Notes).
2. **`ConfirmBookingDialog` (`components/confirm_booking_dialog.py`):**
   - Quick payment recorder allowing user to select `Fully Paid`, `50% Downpayment`, `30% Downpayment`, or enter a custom paid amount.
3. **`CalendarExportDialog` (`components/calendar_export_dialog.py`):**
   - Multi-month date range picker for wall calendar PDF export with background threading.
4. **`ExportWizardDialog` (`components/export_dialog.py`):**
   - System data export wizard for Excel (`.xlsx`) or CSV (`.csv`).
5. **`ImportWizardDialog` (`components/import_dialog.py`):**
   - System data import wizard with schema validation and error report preview.
