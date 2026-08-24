# Database Schema Reference — Jayraldine's Catering System

> **Freeze Version:** v4.0.6 (SQLite Database Reference)
> **Database File:** `catering.db` (28 Tables, 11 Views)

---

## 1. Tables Overview

### `address_barangays`

| Column Name | Data Type | Not Null | Default Value | Primary Key |
|---|---|---|---|---|
| `ab_id` | `INTEGER` | No | `NULL` | **PK (1)** |
| `ab_city_id` | `INTEGER` | No | `NULL` | No |
| `ab_name` | `TEXT` | Yes | `NULL` | No |

**Foreign Keys:**
- `ab_city_id` -> `address_cities`(`ac_id`)

### `address_cities`

| Column Name | Data Type | Not Null | Default Value | Primary Key |
|---|---|---|---|---|
| `ac_id` | `INTEGER` | No | `NULL` | **PK (1)** |
| `ac_province_id` | `INTEGER` | No | `NULL` | No |
| `ac_name` | `TEXT` | Yes | `NULL` | No |

**Foreign Keys:**
- `ac_province_id` -> `address_provinces`(`ap_id`)

### `address_provinces`

| Column Name | Data Type | Not Null | Default Value | Primary Key |
|---|---|---|---|---|
| `ap_id` | `INTEGER` | No | `NULL` | **PK (1)** |
| `ap_name` | `TEXT` | Yes | `NULL` | No |

**Indexes:**
- `sqlite_autoindex_address_provinces_1` (UNIQUE)

### `addresses`

| Column Name | Data Type | Not Null | Default Value | Primary Key |
|---|---|---|---|---|
| `ad_id` | `INTEGER` | No | `NULL` | **PK (1)** |
| `ad_street` | `TEXT` | No | `NULL` | No |
| `ad_barangay_id` | `INTEGER` | No | `NULL` | No |
| `ad_city_id` | `INTEGER` | No | `NULL` | No |
| `ad_province_id` | `INTEGER` | No | `NULL` | No |
| `ad_zip_code` | `TEXT` | No | `NULL` | No |

**Foreign Keys:**
- `ad_province_id` -> `address_provinces`(`ap_id`)
- `ad_city_id` -> `address_cities`(`ac_id`)
- `ad_barangay_id` -> `address_barangays`(`ab_id`)

### `app_settings`

| Column Name | Data Type | Not Null | Default Value | Primary Key |
|---|---|---|---|---|
| `setting_key` | `TEXT` | No | `NULL` | **PK (1)** |
| `setting_value` | `TEXT` | No | `NULL` | No |
| `created_at` | `DATETIME` | No | `CURRENT_TIMESTAMP` | No |

**Indexes:**
- `sqlite_autoindex_app_settings_1` (UNIQUE)

### `audit_logs`

| Column Name | Data Type | Not Null | Default Value | Primary Key |
|---|---|---|---|---|
| `al_id` | `INTEGER` | No | `NULL` | **PK (1)** |
| `al_actor` | `TEXT` | No | `'System'` | No |
| `al_action` | `TEXT` | Yes | `NULL` | No |
| `al_table_name` | `TEXT` | No | `'bookings'` | No |
| `al_record_id` | `INTEGER` | No | `1` | No |
| `al_old_value` | `TEXT` | No | `NULL` | No |
| `al_new_value` | `TEXT` | No | `NULL` | No |
| `al_user` | `TEXT` | No | `'System'` | No |
| `al_details` | `TEXT` | No | `NULL` | No |
| `al_created_at` | `DATETIME` | No | `CURRENT_TIMESTAMP` | No |

### `booking_items`

| Column Name | Data Type | Not Null | Default Value | Primary Key |
|---|---|---|---|---|
| `bi_id` | `INTEGER` | No | `NULL` | **PK (1)** |
| `bi_booking_id` | `INTEGER` | Yes | `NULL` | No |
| `bi_item_name` | `TEXT` | Yes | `NULL` | No |
| `bi_category` | `TEXT` | No | `NULL` | No |
| `bi_price` | `REAL` | No | `0.0` | No |
| `bi_quantity` | `INTEGER` | No | `1` | No |

**Foreign Keys:**
- `bi_booking_id` -> `bookings`(`bk_id`)

### `booking_menu_items`

| Column Name | Data Type | Not Null | Default Value | Primary Key |
|---|---|---|---|---|
| `bmi_id` | `INTEGER` | No | `NULL` | **PK (1)** |
| `bmi_booking_id` | `INTEGER` | Yes | `NULL` | No |
| `bmi_item_id` | `INTEGER` | No | `NULL` | No |
| `bmi_item_name` | `TEXT` | No | `NULL` | No |
| `bmi_category` | `TEXT` | No | `NULL` | No |
| `bmi_price` | `REAL` | No | `0.0` | No |
| `bmi_quantity` | `INTEGER` | No | `1` | No |

**Foreign Keys:**
- `bmi_item_id` -> `menu_items`(`mi_id`)
- `bmi_booking_id` -> `bookings`(`bk_id`)

### `bookings`

| Column Name | Data Type | Not Null | Default Value | Primary Key |
|---|---|---|---|---|
| `bk_id` | `INTEGER` | No | `NULL` | **PK (1)** |
| `bk_booking_ref` | `TEXT` | Yes | `NULL` | No |
| `bk_customer_id` | `INTEGER` | No | `NULL` | No |
| `bk_customer_name` | `TEXT` | Yes | `NULL` | No |
| `bk_address` | `TEXT` | No | `NULL` | No |
| `bk_event_date` | `DATE` | Yes | `NULL` | No |
| `bk_event_time` | `TIME` | No | `'18:00'` | No |
| `bk_venue` | `TEXT` | No | `NULL` | No |
| `bk_occasion` | `TEXT` | No | `NULL` | No |
| `bk_pax` | `INTEGER` | Yes | `NULL` | No |
| `bk_total_amount` | `REAL` | Yes | `NULL` | No |
| `bk_payment_mode` | `TEXT` | No | `'Cash'` | No |
| `bk_amount_paid` | `REAL` | No | `0.0` | No |
| `bk_menu_type` | `TEXT` | No | `'package'` | No |
| `bk_package_id` | `INTEGER` | No | `NULL` | No |
| `bk_notes` | `TEXT` | No | `NULL` | No |
| `bk_status` | `TEXT` | No | `'PENDING'` | No |
| `bk_cancellation_reason` | `TEXT` | No | `NULL` | No |
| `bk_created_at` | `DATETIME` | No | `CURRENT_TIMESTAMP` | No |
| `bk_down_payment` | `REAL` | No | `0.0` | No |
| `bk_down_payment_status` | `TEXT` | No | `'PENDING'` | No |

**Foreign Keys:**
- `bk_package_id` -> `packages`(`pkg_id`)
- `bk_customer_id` -> `customers`(`cus_id`)

**Indexes:**
- `sqlite_autoindex_bookings_1` (UNIQUE)

### `business_info`

| Column Name | Data Type | Not Null | Default Value | Primary Key |
|---|---|---|---|---|
| `bi_id` | `INTEGER` | No | `NULL` | **PK (1)** |
| `bi_name` | `TEXT` | No | `"Jayraldine's Catering"` | No |
| `bi_contact` | `TEXT` | No | `'+63 912 345 6789'` | No |
| `bi_email` | `TEXT` | No | `'admin@jayraldines.com'` | No |
| `bi_address` | `TEXT` | No | `'123 Rizal St., Manila, Metro Manila'` | No |
| `bi_max_daily_pax` | `INTEGER` | No | `500` | No |
| `bi_min_downpayment_pct` | `REAL` | No | `30.0` | No |
| `bi_allow_zero_downpayment` | `INTEGER` | No | `0` | No |
| `bi_smtp_host` | `TEXT` | No | `''` | No |
| `bi_smtp_port` | `INTEGER` | No | `587` | No |
| `bi_smtp_user` | `TEXT` | No | `''` | No |
| `bi_smtp_pass` | `TEXT` | No | `''` | No |
| `bi_updated_at` | `DATETIME` | No | `CURRENT_TIMESTAMP` | No |

### `calendar_events`

| Column Name | Data Type | Not Null | Default Value | Primary Key |
|---|---|---|---|---|
| `ce_id` | `INTEGER` | No | `NULL` | **PK (1)** |
| `ce_event_date` | `DATE` | Yes | `NULL` | No |
| `ce_name` | `TEXT` | Yes | `NULL` | No |
| `ce_pax` | `INTEGER` | No | `0` | No |
| `ce_event_time` | `TEXT` | No | `'06:00 PM'` | No |
| `ce_location` | `TEXT` | No | `'TBD'` | No |
| `ce_created_at` | `DATETIME` | No | `CURRENT_TIMESTAMP` | No |

### `cash_flow_transactions`

| Column Name | Data Type | Not Null | Default Value | Primary Key |
|---|---|---|---|---|
| `cft_id` | `INTEGER` | No | `NULL` | **PK (1)** |
| `cft_date` | `DATE` | Yes | `NULL` | No |
| `cft_check_no` | `TEXT` | No | `''` | No |
| `cft_particulars` | `TEXT` | Yes | `NULL` | No |
| `cft_deposit` | `REAL` | No | `0.0` | No |
| `cft_withdrawal` | `REAL` | No | `0.0` | No |
| `cft_balance` | `REAL` | No | `0.0` | No |
| `cft_actual_sales` | `REAL` | No | `0.0` | No |
| `cft_notes` | `TEXT` | No | `''` | No |
| `cft_created_at` | `DATETIME` | No | `CURRENT_TIMESTAMP` | No |

### `customer_addresses`

| Column Name | Data Type | Not Null | Default Value | Primary Key |
|---|---|---|---|---|
| `ca_id` | `INTEGER` | No | `NULL` | **PK (1)** |
| `ca_customer_id` | `INTEGER` | No | `NULL` | No |
| `ca_address_id` | `INTEGER` | No | `NULL` | No |

**Foreign Keys:**
- `ca_address_id` -> `addresses`(`ad_id`)
- `ca_customer_id` -> `customers`(`cus_id`)

### `customer_follow_ups`

| Column Name | Data Type | Not Null | Default Value | Primary Key |
|---|---|---|---|---|
| `cfu_id` | `INTEGER` | No | `NULL` | **PK (1)** |
| `cf_id` | `INTEGER` | No | `NULL` | No |
| `cfu_customer_id` | `INTEGER` | No | `NULL` | No |
| `cf_customer_id` | `INTEGER` | No | `NULL` | No |
| `cfu_follow_up_date` | `DATE` | No | `DATE('now')` | No |
| `cfu_date` | `TEXT` | No | `NULL` | No |
| `cf_date` | `TEXT` | No | `NULL` | No |
| `cfu_note` | `TEXT` | No | `NULL` | No |
| `cf_note` | `TEXT` | No | `NULL` | No |
| `cfu_is_done` | `INTEGER` | No | `0` | No |
| `cf_is_done` | `INTEGER` | No | `0` | No |
| `cfu_created_at` | `DATETIME` | No | `CURRENT_TIMESTAMP` | No |

**Foreign Keys:**
- `cfu_customer_id` -> `customers`(`cus_id`)

### `customer_loyalty_tiers`

| Column Name | Data Type | Not Null | Default Value | Primary Key |
|---|---|---|---|---|
| `cl_id` | `INTEGER` | No | `NULL` | **PK (1)** |
| `cl_customer_id` | `INTEGER` | No | `NULL` | No |
| `cl_tier` | `TEXT` | No | `'Bronze'` | No |
| `cl_event_count` | `INTEGER` | No | `0` | No |
| `cl_total_spent` | `REAL` | No | `0.0` | No |
| `cl_last_recalculated` | `DATETIME` | No | `CURRENT_TIMESTAMP` | No |

**Foreign Keys:**
- `cl_customer_id` -> `customers`(`cus_id`)

**Indexes:**
- `sqlite_autoindex_customer_loyalty_tiers_1` (UNIQUE)

### `customers`

| Column Name | Data Type | Not Null | Default Value | Primary Key |
|---|---|---|---|---|
| `cus_id` | `INTEGER` | No | `NULL` | **PK (1)** |
| `cus_name` | `TEXT` | Yes | `NULL` | No |
| `cus_contact` | `TEXT` | No | `NULL` | No |
| `cus_email` | `TEXT` | No | `NULL` | No |
| `cus_address` | `TEXT` | No | `NULL` | No |
| `cus_address_id` | `INTEGER` | No | `NULL` | No |
| `cus_loyalty_tier` | `TEXT` | No | `'Bronze'` | No |
| `cus_total_events` | `INTEGER` | No | `0` | No |
| `cus_total_spent` | `REAL` | No | `0.0` | No |
| `cus_status` | `TEXT` | No | `'Active'` | No |
| `cus_notes` | `TEXT` | No | `NULL` | No |
| `cus_created_at` | `DATETIME` | No | `CURRENT_TIMESTAMP` | No |

### `database_backups`

| Column Name | Data Type | Not Null | Default Value | Primary Key |
|---|---|---|---|---|
| `backup_id` | `INTEGER` | No | `NULL` | **PK (1)** |
| `file_name` | `TEXT` | Yes | `NULL` | No |
| `file_path` | `TEXT` | Yes | `NULL` | No |
| `file_size_bytes` | `INTEGER` | No | `NULL` | No |
| `status` | `TEXT` | No | `'Completed'` | No |
| `created_at` | `DATETIME` | No | `CURRENT_TIMESTAMP` | No |

### `expenses`

| Column Name | Data Type | Not Null | Default Value | Primary Key |
|---|---|---|---|---|
| `exp_id` | `INTEGER` | No | `NULL` | **PK (1)** |
| `exp_category` | `TEXT` | Yes | `NULL` | No |
| `exp_description` | `TEXT` | Yes | `NULL` | No |
| `exp_amount` | `REAL` | Yes | `NULL` | No |
| `exp_date` | `DATE` | Yes | `NULL` | No |
| `exp_expense_date` | `DATE` | No | `NULL` | No |
| `exp_created_at` | `DATETIME` | No | `CURRENT_TIMESTAMP` | No |

### `invoices`

| Column Name | Data Type | Not Null | Default Value | Primary Key |
|---|---|---|---|---|
| `inv_id` | `INTEGER` | No | `NULL` | **PK (1)** |
| `inv_booking_id` | `INTEGER` | No | `NULL` | No |
| `inv_invoice_ref` | `TEXT` | No | `NULL` | No |
| `inv_invoice_number` | `TEXT` | No | `NULL` | No |
| `inv_customer_name` | `TEXT` | No | `NULL` | No |
| `inv_event_date` | `DATE` | No | `NULL` | No |
| `inv_total_amount` | `REAL` | No | `NULL` | No |
| `inv_amount_paid` | `REAL` | No | `0.0` | No |
| `inv_balance` | `REAL` | No | `NULL` | No |
| `inv_status` | `TEXT` | No | `'Unpaid'` | No |
| `inv_created_at` | `DATETIME` | No | `CURRENT_TIMESTAMP` | No |
| `inv_down_payment` | `REAL` | No | `0.0` | No |
| `inv_payment_verified` | `INTEGER` | No | `0` | No |

**Foreign Keys:**
- `inv_booking_id` -> `bookings`(`bk_id`)

**Indexes:**
- `sqlite_autoindex_invoices_1` (UNIQUE)

### `kitchen_orders`

| Column Name | Data Type | Not Null | Default Value | Primary Key |
|---|---|---|---|---|
| `ko_id` | `INTEGER` | No | `NULL` | **PK (1)** |
| `ko_booking_id` | `INTEGER` | No | `NULL` | No |
| `ko_order_ref` | `TEXT` | Yes | `NULL` | No |
| `ko_client_name` | `TEXT` | No | `NULL` | No |
| `ko_customer_name` | `TEXT` | No | `NULL` | No |
| `ko_event_name` | `TEXT` | No | `NULL` | No |
| `ko_items_desc` | `TEXT` | No | `NULL` | No |
| `ko_event_date` | `DATE` | No | `DATE('now')` | No |
| `ko_event_time` | `TIME` | No | `'18:00'` | No |
| `ko_pax` | `INTEGER` | No | `50` | No |
| `ko_status` | `TEXT` | No | `'Queued'` | No |
| `ko_notes` | `TEXT` | No | `NULL` | No |
| `ko_created_at` | `DATETIME` | No | `CURRENT_TIMESTAMP` | No |

**Foreign Keys:**
- `ko_booking_id` -> `bookings`(`bk_id`)

### `kitchen_tasks`

| Column Name | Data Type | Not Null | Default Value | Primary Key |
|---|---|---|---|---|
| `kt_id` | `INTEGER` | No | `NULL` | **PK (1)** |
| `kt_order_id` | `INTEGER` | No | `NULL` | No |
| `kt_task_label` | `TEXT` | Yes | `NULL` | No |
| `kt_is_done` | `INTEGER` | No | `0` | No |
| `kt_sort_order` | `INTEGER` | No | `0` | No |
| `kt_created_at` | `DATETIME` | No | `CURRENT_TIMESTAMP` | No |

**Foreign Keys:**
- `kt_order_id` -> `kitchen_orders`(`ko_id`)

### `menu_items`

| Column Name | Data Type | Not Null | Default Value | Primary Key |
|---|---|---|---|---|
| `mi_id` | `INTEGER` | No | `NULL` | **PK (1)** |
| `mi_name` | `TEXT` | Yes | `NULL` | No |
| `name` | `TEXT` | No | `NULL` | No |
| `mi_category` | `TEXT` | Yes | `NULL` | No |
| `category` | `TEXT` | No | `NULL` | No |
| `mi_package_tier` | `TEXT` | No | `'Standard'` | No |
| `mi_package` | `TEXT` | No | `'Standard'` | No |
| `package_tier` | `TEXT` | No | `'Standard'` | No |
| `package` | `TEXT` | No | `'Standard'` | No |
| `mi_price` | `REAL` | Yes | `NULL` | No |
| `price` | `REAL` | No | `NULL` | No |
| `mi_status` | `TEXT` | No | `'Available'` | No |
| `status` | `TEXT` | No | `'Available'` | No |
| `mi_description` | `TEXT` | No | `NULL` | No |
| `description` | `TEXT` | No | `NULL` | No |
| `mi_created_at` | `DATETIME` | No | `CURRENT_TIMESTAMP` | No |

### `monthly_sales_targets`

| Column Name | Data Type | Not Null | Default Value | Primary Key |
|---|---|---|---|---|
| `mst_year` | `INTEGER` | Yes | `NULL` | **PK (1)** |
| `mst_month` | `INTEGER` | Yes | `NULL` | **PK (2)** |
| `mst_target_amount` | `REAL` | No | `85000.0` | No |
| `mst_updated_at` | `DATETIME` | No | `CURRENT_TIMESTAMP` | No |

**Indexes:**
- `sqlite_autoindex_monthly_sales_targets_1` (UNIQUE)

### `notifications`

| Column Name | Data Type | Not Null | Default Value | Primary Key |
|---|---|---|---|---|
| `notif_id` | `INTEGER` | No | `NULL` | **PK (1)** |
| `notif_type` | `TEXT` | No | `'info'` | No |
| `notif_title` | `TEXT` | Yes | `NULL` | No |
| `notif_message` | `TEXT` | Yes | `NULL` | No |
| `notif_color` | `TEXT` | No | `'#3B82F6'` | No |
| `notif_link_id` | `INTEGER` | No | `NULL` | No |
| `notif_is_read` | `INTEGER` | No | `0` | No |
| `notif_created_at` | `DATETIME` | No | `CURRENT_TIMESTAMP` | No |

### `occasions`

| Column Name | Data Type | Not Null | Default Value | Primary Key |
|---|---|---|---|---|
| `occ_id` | `INTEGER` | No | `NULL` | **PK (1)** |
| `occ_name` | `TEXT` | Yes | `NULL` | No |
| `occ_description` | `TEXT` | No | `NULL` | No |
| `occ_is_active` | `INTEGER` | No | `1` | No |

**Indexes:**
- `sqlite_autoindex_occasions_1` (UNIQUE)

### `package_items`

| Column Name | Data Type | Not Null | Default Value | Primary Key |
|---|---|---|---|---|
| `pi_id` | `INTEGER` | No | `NULL` | **PK (1)** |
| `pi_package_id` | `INTEGER` | Yes | `NULL` | No |
| `pi_menu_item_id` | `INTEGER` | No | `NULL` | No |
| `pi_item_name` | `TEXT` | No | `NULL` | No |
| `pi_category` | `TEXT` | No | `NULL` | No |
| `pi_custom_price` | `REAL` | No | `0.0` | No |
| `pi_quantity` | `INTEGER` | No | `1` | No |

**Foreign Keys:**
- `pi_menu_item_id` -> `menu_items`(`mi_id`)
- `pi_package_id` -> `packages`(`pkg_id`)

### `packages`

| Column Name | Data Type | Not Null | Default Value | Primary Key |
|---|---|---|---|---|
| `pkg_id` | `INTEGER` | No | `NULL` | **PK (1)** |
| `pkg_name` | `TEXT` | Yes | `NULL` | No |
| `pkg_description` | `TEXT` | No | `NULL` | No |
| `pkg_price_per_pax` | `REAL` | Yes | `NULL` | No |
| `pkg_min_pax` | `INTEGER` | No | `30` | No |
| `pkg_created_at` | `DATETIME` | No | `CURRENT_TIMESTAMP` | No |

**Indexes:**
- `sqlite_autoindex_packages_1` (UNIQUE)

### `payment_records`

| Column Name | Data Type | Not Null | Default Value | Primary Key |
|---|---|---|---|---|
| `pr_id` | `INTEGER` | No | `NULL` | **PK (1)** |
| `pr_invoice_id` | `INTEGER` | No | `NULL` | No |
| `pr_amount` | `REAL` | Yes | `NULL` | No |
| `pr_payment_date` | `DATE` | Yes | `NULL` | No |
| `pr_payment_method` | `TEXT` | No | `'Cash'` | No |
| `pr_reference_number` | `TEXT` | No | `NULL` | No |
| `pr_notes` | `TEXT` | No | `NULL` | No |
| `pr_created_at` | `DATETIME` | No | `CURRENT_TIMESTAMP` | No |
| `pr_method` | `TEXT` | No | `'Cash'` | No |
| `pr_note` | `TEXT` | No | `NULL` | No |
| `pr_is_verified` | `INTEGER` | No | `0` | No |
| `pr_is_downpayment` | `INTEGER` | No | `0` | No |

**Foreign Keys:**
- `pr_invoice_id` -> `invoices`(`inv_id`)

---

## 2. Views Overview

### View: `v_audit_log_recent`

```sql
CREATE VIEW v_audit_log_recent AS
SELECT
    al_id AS id,
    al_id,
    al_actor AS actor,
    al_actor,
    al_action AS action,
    al_action,
    al_table_name AS table_name,
    al_table_name,
    al_record_id AS record_id,
    al_record_id,
    al_details AS description,
    al_details,
    al_created_at AS created_at,
    al_created_at
FROM audit_logs
ORDER BY al_created_at DESC
LIMIT 50
```

### View: `v_customer_ledger`

```sql
CREATE VIEW v_customer_ledger AS
SELECT
    c.cus_id AS customer_id,
    c.cus_name AS customer_name,
    'Booking' AS entry_type,
    DATE(b.bk_created_at) AS recorded_date,
    b.bk_event_date AS event_date,
    b.bk_booking_ref AS reference,
    b.bk_occasion AS description,
    0.0 AS debit,
    0.0 AS credit,
    b.bk_status AS entry_status,
    b.bk_id AS source_id
FROM customers c
JOIN bookings b ON b.bk_customer_id = c.cus_id

UNION ALL

SELECT
    c.cus_id AS customer_id,
    c.cus_name AS customer_name,
    'Invoice' AS entry_type,
    DATE(i.inv_created_at) AS recorded_date,
    i.inv_event_date AS event_date,
    i.inv_invoice_ref AS reference,
    'Invoice issued' AS description,
    i.inv_total_amount AS debit,
    0.0 AS credit,
    i.inv_status AS entry_status,
    i.inv_id AS source_id
FROM customers c
JOIN bookings b ON b.bk_customer_id = c.cus_id
JOIN invoices i ON i.inv_booking_id = b.bk_id

UNION ALL

SELECT
    c.cus_id AS customer_id,
    c.cus_name AS customer_name,
    'Payment' AS entry_type,
    pr.pr_payment_date AS recorded_date,
    i.inv_event_date AS event_date,
    ('PMT-' || pr.pr_id) AS reference,
    COALESCE(pr.pr_note, pr.pr_notes, pr.pr_method, pr.pr_payment_method, 'Payment') AS description,
    0.0 AS debit,
    pr.pr_amount AS credit,
    'Paid' AS entry_status,
    pr.pr_id AS source_id
FROM customers c
JOIN bookings b ON b.bk_customer_id = c.cus_id
JOIN invoices i ON i.inv_booking_id = b.bk_id
JOIN payment_records pr ON pr.pr_invoice_id = i.inv_id

ORDER BY recorded_date DESC, entry_type
```

### View: `v_customer_order_frequency`

```sql
CREATE VIEW v_customer_order_frequency AS
SELECT bk_customer_name AS name, COUNT(*) AS booking_count
FROM bookings
WHERE bk_status IN ('CONFIRMED', 'COMPLETED')
GROUP BY bk_customer_name
ORDER BY booking_count DESC
LIMIT 10
```

### View: `v_dashboard_kpis`

```sql
CREATE VIEW v_dashboard_kpis AS
SELECT
    (SELECT COUNT(*) FROM bookings WHERE DATE(bk_event_date) = DATE('now')) AS todays_events,
    (SELECT COUNT(*) FROM bookings WHERE bk_status = 'PENDING') AS pending_bookings,
    (SELECT COALESCE(SUM(bk_total_amount), 0) FROM bookings
     WHERE DATE(bk_event_date) >= DATE('now', 'weekday 0', '-6 days')
       AND DATE(bk_event_date) <= DATE('now', 'weekday 0')) AS weekly_revenue,
    (SELECT COALESCE(SUM(inv_total_amount - inv_amount_paid), 0) FROM invoices WHERE inv_status != 'Paid') AS unpaid_invoices,
    (SELECT COALESCE(SUM(bk_pax), 0) FROM bookings WHERE DATE(bk_event_date) = DATE('now')) AS todays_pax
```

### View: `v_monthly_income`

```sql
CREATE VIEW v_monthly_income AS
SELECT
    strftime('%m', inv_event_date) AS month_num,
    CASE strftime('%m', inv_event_date)
        WHEN '01' THEN 'Jan' WHEN '02' THEN 'Feb' WHEN '03' THEN 'Mar' WHEN '04' THEN 'Apr'
        WHEN '05' THEN 'May' WHEN '06' THEN 'Jun' WHEN '07' THEN 'Jul' WHEN '08' THEN 'Aug'
        WHEN '09' THEN 'Sep' WHEN '10' THEN 'Oct' WHEN '11' THEN 'Nov' WHEN '12' THEN 'Dec'
        ELSE 'Other'
    END AS month_label,
    COALESCE(SUM(inv_total_amount), 0) AS total_revenue,
    COALESCE(SUM(inv_amount_paid), 0) AS total_paid
FROM invoices
WHERE strftime('%Y', inv_event_date) = strftime('%Y', 'now')
GROUP BY month_num
ORDER BY month_num
```

### View: `v_payment_methods`

```sql
CREATE VIEW v_payment_methods AS
SELECT bk_payment_mode AS method, COUNT(*) AS total
FROM bookings
WHERE bk_status IN ('CONFIRMED', 'COMPLETED')
GROUP BY bk_payment_mode
```

### View: `v_profit_summary`

```sql
CREATE VIEW v_profit_summary AS
WITH months(m_num, m_label) AS (
    VALUES
    (1, 'Jan'), (2, 'Feb'), (3, 'Mar'), (4, 'Apr'),
    (5, 'May'), (6, 'Jun'), (7, 'Jul'), (8, 'Aug'),
    (9, 'Sep'), (10, 'Oct'), (11, 'Nov'), (12, 'Dec')
),
rev AS (
    SELECT CAST(strftime('%m', bk_event_date) AS INTEGER) AS m_num, SUM(bk_total_amount) AS revenue
    FROM bookings
    WHERE bk_status IN ('CONFIRMED', 'COMPLETED') AND strftime('%Y', bk_event_date) = strftime('%Y', 'now')
    GROUP BY m_num
),
exp AS (
    SELECT CAST(strftime('%m', exp_date) AS INTEGER) AS m_num, SUM(exp_amount) AS total_expense
    FROM expenses
    WHERE strftime('%Y', exp_date) = strftime('%Y', 'now')
    GROUP BY m_num
)
SELECT
    months.m_num AS month_num,
    months.m_label AS month_label,
    COALESCE(rev.revenue, 0.0) AS revenue,
    COALESCE(exp.total_expense, 0.0) AS total_expense,
    (COALESCE(rev.revenue, 0.0) - COALESCE(exp.total_expense, 0.0)) AS net_profit
FROM months
LEFT JOIN rev ON rev.m_num = months.m_num
LEFT JOIN exp ON exp.m_num = months.m_num
ORDER BY months.m_num
```

### View: `v_recent_activity`

```sql
CREATE VIEW v_recent_activity AS
SELECT
    CASE bk_status
        WHEN 'CONFIRMED' THEN 'Booking Confirmed'
        WHEN 'CANCELLED' THEN 'Booking Cancelled'
        ELSE 'New Booking Request'
    END AS title,
    bk_customer_name || ' — ' || bk_occasion || ' (' || bk_pax || ' pax)' AS description,
    CASE bk_status
        WHEN 'CONFIRMED' THEN '#22C55E'
        WHEN 'CANCELLED' THEN '#EF4444'
        ELSE '#3B82F6'
    END AS color,
    bk_created_at AS created_at
FROM bookings
ORDER BY bk_created_at DESC
LIMIT 10
```

### View: `v_report_kpis`

```sql
CREATE VIEW v_report_kpis AS
SELECT
    (SELECT COUNT(*) FROM bookings WHERE bk_status IN ('CONFIRMED', 'COMPLETED')) AS total_bookings,
    (SELECT COALESCE(SUM(bk_pax), 0) FROM bookings WHERE bk_status IN ('CONFIRMED', 'COMPLETED')) AS total_pax,
    (SELECT COALESCE(SUM(inv_total_amount), 0) FROM invoices) AS total_revenue,
    (SELECT COALESCE(SUM(inv_total_amount - inv_amount_paid), 0) FROM invoices WHERE inv_status != 'Paid') AS unpaid_amount,
    (SELECT COUNT(*) FROM bookings WHERE DATE(bk_created_at) = DATE('now') AND bk_status IN ('CONFIRMED', 'COMPLETED')) AS today_bookings,
    (SELECT COUNT(*) FROM bookings WHERE DATE(bk_created_at) >= DATE('now', '-7 days') AND bk_status IN ('CONFIRMED', 'COMPLETED')) AS week_bookings
```

### View: `v_top_menu_items`

```sql
CREATE VIEW v_top_menu_items AS
SELECT mi.mi_name AS item, COUNT(*) AS order_count
FROM booking_menu_items bmi
JOIN menu_items mi ON mi.mi_id = bmi.bmi_item_id
JOIN bookings b ON b.bk_id = bmi.bmi_booking_id
WHERE b.bk_status IN ('CONFIRMED', 'COMPLETED')
GROUP BY mi.mi_name
ORDER BY order_count DESC
LIMIT 10
```

### View: `v_upcoming_events`

```sql
CREATE VIEW v_upcoming_events AS
SELECT
    b.bk_id, b.bk_booking_ref, b.bk_customer_name, b.bk_occasion,
    b.bk_venue, b.bk_event_date, b.bk_event_time, b.bk_pax, b.bk_status
FROM bookings b
WHERE DATE(b.bk_event_date) >= DATE('now') AND b.bk_status IN ('CONFIRMED', 'PENDING')
ORDER BY b.bk_event_date, b.bk_event_time
```

