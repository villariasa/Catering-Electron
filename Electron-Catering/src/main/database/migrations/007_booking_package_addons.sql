-- Migration 007: Booking package linkage, add-ons, and notes (multi-step booking wizard support)
ALTER TABLE bookings ADD COLUMN bk_package_id INTEGER REFERENCES packages(pkg_id);
ALTER TABLE bookings ADD COLUMN bk_addons TEXT;
ALTER TABLE bookings ADD COLUMN bk_special_notes TEXT;
