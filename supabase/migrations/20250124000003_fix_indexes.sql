-- ============================================================================
-- FIX INDEXES - REMOVE NON-IMMUTABLE PREDICATES
-- ============================================================================
-- PostgreSQL requires functions in index predicates to be IMMUTABLE
-- CURRENT_DATE is not IMMUTABLE, so we remove it from WHERE clause
-- ============================================================================

-- Drop old indexes if they exist with problematic predicates
DROP INDEX IF EXISTS idx_bookings_tenant_date;
DROP INDEX IF EXISTS idx_bookings_status_date;
DROP INDEX IF EXISTS idx_bookings_created_at;

-- Recreate indexes without CURRENT_DATE in WHERE clause
CREATE INDEX IF NOT EXISTS idx_bookings_tenant_date 
  ON bookings(location_id, booking_date);

CREATE INDEX IF NOT EXISTS idx_bookings_status_date 
  ON bookings(status, booking_date);

CREATE INDEX IF NOT EXISTS idx_bookings_created_at 
  ON bookings(created_at);

-- Additional useful indexes for AI queries
CREATE INDEX IF NOT EXISTS idx_bookings_location_status 
  ON bookings(location_id, status);

CREATE INDEX IF NOT EXISTS idx_bookings_date_status 
  ON bookings(booking_date, status)
  WHERE status IN ('confirmed', 'pending', 'cancelled', 'no_show');

-- ============================================================================
-- ✅ INDEXES FIXED
-- ============================================================================

