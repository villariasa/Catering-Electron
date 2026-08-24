-- Migration 002: Seed Initial Sample Data
INSERT OR IGNORE INTO packages (pkg_id, pkg_name, pkg_category, pkg_price_per_pax, pkg_min_pax, pkg_description) VALUES
(1, 'Standard Fiesta Buffet', 'Buffet', 450.00, 30, 'Pork Hamonado, Bam-I, Lechon Kawali, Rice, Iced Tea & Salad'),
(2, 'Executive Grand Buffet', 'Buffet', 650.00, 50, 'Lechon Belly, Beef Caldereta, Fish Fillet, Baked Mac, Dessert Bar'),
(3, 'VIP Wedding Gala Package', 'VIP', 950.00, 100, 'Full Premium Menu with Roast Beef, Seafood Medley & Grazing Table');

INSERT OR IGNORE INTO customers (cus_id, cus_name, cus_phone, cus_email, cus_address, cus_loyalty_tier) VALUES
(1, 'Juan Dela Cruz', '09171234567', 'juan@gmail.com', 'Lahug, Cebu City', 'Regular'),
(2, 'Maria Santos', '09189876543', 'maria@yahoo.com', 'Banilad, Mandaue City', 'VIP'),
(3, 'Carlos Reyes', '09223334444', 'carlos@outlook.com', 'Tisa, Cebu City', 'New');

INSERT OR IGNORE INTO bookings (bk_id, bk_booking_ref, bk_customer_name, bk_occasion, bk_event_date, bk_event_time, bk_venue, bk_pax, bk_total_amount, bk_amount_paid, bk_balance, bk_status, bk_payment_status) VALUES
(1, 'BK-2026-0001', 'Juan Dela Cruz', 'Birthday Party', '2026-08-28', '17:00', 'Marco Polo Ballroom, Nivel Hills', 100, 45000.00, 15000.00, 30000.00, 'CONFIRMED', 'Partial'),
(2, 'BK-2026-0002', 'Maria Santos', 'Wedding Reception', '2026-09-12', '18:30', 'Waterfront Hotel Grand Ballroom', 200, 130000.00, 130000.00, 0.00, 'CONFIRMED', 'Paid'),
(3, 'BK-2026-0003', 'Carlos Reyes', 'Corporate Anniversary', '2026-09-25', '12:00', 'Cebu Trade Hall', 150, 67500.00, 0.00, 67500.00, 'PENDING', 'Unpaid');

INSERT OR IGNORE INTO expenses (exp_id, exp_category, exp_description, exp_amount, exp_date) VALUES
(1, 'Ingredients', 'Fresh Pork Belly & Chicken (Carbon Market)', 12500.00, '2026-08-20'),
(2, 'Labor/Wages', 'Kitchen Assistant & Catering Waiters Payroll', 6400.00, '2026-08-22'),
(3, 'Utilities', 'LPG Gas Tanks & Fuel Delivery', 3200.00, '2026-08-23');
