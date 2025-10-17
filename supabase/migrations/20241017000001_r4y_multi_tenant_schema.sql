-- ============================================================================
-- R4Y MULTI-TENANT SCHEMA MIGRATION
-- ============================================================================
-- This migration transforms the generic SaaS template into R4Y:
-- - Multi-tenant architecture with tenants, memberships, locations
-- - Restaurant reservations with tables, shifts, bookings
-- - Subscription billing with quotas
-- - POS integration support
-- ============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE membership_role AS ENUM ('OWNER', 'MANAGER', 'STAFF');
CREATE TYPE booking_status AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'NO_SHOW', 'COMPLETED', 'WAITLIST');
CREATE TYPE payment_status AS ENUM ('NONE', 'REQUIRES_PAYMENT', 'PAID', 'FAILED', 'REFUNDED');
CREATE TYPE billing_plan AS ENUM ('START', 'PRO', 'PLUS');
CREATE TYPE billing_status AS ENUM ('ACTIVE', 'PAST_DUE', 'CANCELLED', 'TRIALING');
CREATE TYPE pos_vendor AS ENUM ('LIGHTSPEED', 'SQUARE', 'TOAST', 'CLOVER');

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- TENANTS (Organizations/Restaurant Groups)
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  brand_color VARCHAR(7) DEFAULT '#FF5A5F',
  logo_url TEXT,
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- MEMBERSHIPS (Team members with roles)
CREATE TABLE memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role membership_role NOT NULL DEFAULT 'STAFF',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, user_id)
);

-- LOCATIONS (Restaurant locations)
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  cuisine_type VARCHAR(100),
  price_range INT CHECK (price_range BETWEEN 1 AND 4),
  
  -- Address
  address_line1 VARCHAR(255) NOT NULL,
  address_line2 VARCHAR(255),
  city VARCHAR(100) NOT NULL,
  postal_code VARCHAR(20) NOT NULL,
  country VARCHAR(2) NOT NULL DEFAULT 'NL',
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  
  -- Contact
  phone VARCHAR(20),
  email VARCHAR(255),
  website VARCHAR(255),
  
  -- Hours: JSON format { "MON": [{"open":"11:00","close":"22:00"}], ... }
  opening_hours JSONB DEFAULT '{}',
  
  -- Status
  is_public BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- SEO
  hero_image_url TEXT,
  meta_description TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- TABLES (Restaurant tables)
CREATE TABLE tables (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  seats INT NOT NULL CHECK (seats > 0),
  min_seats INT,
  max_seats INT,
  is_combinable BOOLEAN NOT NULL DEFAULT false,
  group_id VARCHAR(50),
  position_x INT,
  position_y INT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(location_id, name)
);

-- SHIFTS (Service periods)
CREATE TABLE shifts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  day_of_week INT[] NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  slot_duration_minutes INT NOT NULL DEFAULT 90,
  buffer_minutes INT NOT NULL DEFAULT 15,
  max_concurrent_bookings INT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- POLICIES (Location-specific booking rules)
CREATE TABLE policies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE UNIQUE,
  
  -- Cancellation
  cancellation_hours INT NOT NULL DEFAULT 24,
  allow_same_day_booking BOOLEAN NOT NULL DEFAULT true,
  
  -- No-show
  no_show_fee_enabled BOOLEAN NOT NULL DEFAULT false,
  no_show_fee_cents INT DEFAULT 0,
  
  -- Deposits
  deposit_required BOOLEAN NOT NULL DEFAULT false,
  deposit_type VARCHAR(10) CHECK (deposit_type IN ('PERCENT', 'FIXED')),
  deposit_value INT,
  deposit_applies_to_party_size INT DEFAULT 6,
  
  -- Booking rules
  max_party_size INT DEFAULT 12,
  advance_booking_days INT DEFAULT 60,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- CONSUMERS (Diners - may have auth account or be guests)
CREATE TABLE consumers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(255),
  phone_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(auth_user_id)
);

-- Note: phone uniqueness handled at application level to allow NULL values

-- BOOKINGS (Reservations)
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  table_id UUID REFERENCES tables(id) ON DELETE SET NULL,
  consumer_id UUID REFERENCES consumers(id) ON DELETE SET NULL,
  
  -- Guest info (denormalized for reliability)
  guest_name VARCHAR(255) NOT NULL,
  guest_phone VARCHAR(20),
  guest_email VARCHAR(255),
  
  -- Booking details
  party_size INT NOT NULL CHECK (party_size > 0),
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  
  -- Status
  status booking_status NOT NULL DEFAULT 'PENDING',
  payment_status payment_status NOT NULL DEFAULT 'NONE',
  
  -- Payments
  stripe_payment_intent_id TEXT,
  deposit_amount_cents INT DEFAULT 0,
  
  -- Notes
  guest_note TEXT,
  internal_note TEXT,
  
  -- Source tracking
  source VARCHAR(20) DEFAULT 'WEB',
  
  -- Idempotency
  idempotency_key VARCHAR(255),
  
  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  UNIQUE(idempotency_key)
);

-- BILLING STATE (Subscription status per tenant)
CREATE TABLE billing_state (
  tenant_id UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  plan billing_plan NOT NULL DEFAULT 'START',
  status billing_status NOT NULL DEFAULT 'TRIALING',
  
  -- Quotas
  max_locations INT NOT NULL DEFAULT 1,
  max_bookings_per_month INT NOT NULL DEFAULT 200,
  bookings_used_this_month INT NOT NULL DEFAULT 0,
  
  -- Subscription dates
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- POS INTEGRATIONS (Lightspeed, etc.)
CREATE TABLE pos_integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  vendor pos_vendor NOT NULL,
  
  -- OAuth tokens (encrypt in production!)
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  
  -- Configuration
  external_location_id VARCHAR(255),
  config JSONB DEFAULT '{}',
  
  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  last_sync_status VARCHAR(50),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(location_id, vendor)
);

-- FAVORITES (Consumer saved locations)
CREATE TABLE favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  consumer_id UUID NOT NULL REFERENCES consumers(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(consumer_id, location_id)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Tenants
CREATE INDEX idx_tenants_owner ON tenants(owner_user_id);

-- Memberships
CREATE INDEX idx_memberships_tenant ON memberships(tenant_id);
CREATE INDEX idx_memberships_user ON memberships(user_id);
CREATE INDEX idx_memberships_tenant_user ON memberships(tenant_id, user_id);

-- Locations
CREATE INDEX idx_locations_tenant ON locations(tenant_id);
CREATE INDEX idx_locations_slug ON locations(slug);
CREATE INDEX idx_locations_public ON locations(is_public, is_active) WHERE is_public = true;
CREATE INDEX idx_locations_geo ON locations USING gist(ll_to_earth(latitude::float8, longitude::float8)) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
-- Note: ll_to_earth requires earthdistance extension, or use simpler index:
-- CREATE INDEX idx_locations_lat_lng ON locations(latitude, longitude) WHERE latitude IS NOT NULL;

-- Tables
CREATE INDEX idx_tables_location ON tables(location_id);
CREATE INDEX idx_tables_active ON tables(location_id, is_active) WHERE is_active = true;

-- Shifts
CREATE INDEX idx_shifts_location ON shifts(location_id);
CREATE INDEX idx_shifts_active ON shifts(location_id, is_active) WHERE is_active = true;

-- Bookings (critical for performance)
CREATE INDEX idx_bookings_location_time ON bookings(location_id, start_time);
CREATE INDEX idx_bookings_location_status ON bookings(location_id, status);
CREATE INDEX idx_bookings_consumer ON bookings(consumer_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_table_time ON bookings(table_id, start_time, end_time) WHERE table_id IS NOT NULL;
CREATE INDEX idx_bookings_idempotency ON bookings(idempotency_key) WHERE idempotency_key IS NOT NULL;

-- Consumers
CREATE INDEX idx_consumers_auth_user ON consumers(auth_user_id) WHERE auth_user_id IS NOT NULL;
CREATE INDEX idx_consumers_phone ON consumers(phone) WHERE phone IS NOT NULL;
CREATE INDEX idx_consumers_email ON consumers(email) WHERE email IS NOT NULL;

-- Billing
CREATE INDEX idx_billing_stripe_customer ON billing_state(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;
CREATE INDEX idx_billing_subscription ON billing_state(stripe_subscription_id) WHERE stripe_subscription_id IS NOT NULL;

-- Favorites
CREATE INDEX idx_favorites_consumer ON favorites(consumer_id);
CREATE INDEX idx_favorites_location ON favorites(location_id);

-- ============================================================================
-- UPDATED_AT TRIGGERS
-- ============================================================================

-- Use existing update_updated_at_column() function

CREATE TRIGGER update_tenants_updated_at 
  BEFORE UPDATE ON tenants 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_memberships_updated_at 
  BEFORE UPDATE ON memberships 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_locations_updated_at 
  BEFORE UPDATE ON locations 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tables_updated_at 
  BEFORE UPDATE ON tables 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shifts_updated_at 
  BEFORE UPDATE ON shifts 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_policies_updated_at 
  BEFORE UPDATE ON policies 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_consumers_updated_at 
  BEFORE UPDATE ON consumers 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at 
  BEFORE UPDATE ON bookings 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_billing_state_updated_at 
  BEFORE UPDATE ON billing_state 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pos_integrations_updated_at 
  BEFORE UPDATE ON pos_integrations 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SECURITY DEFINER HELPER FUNCTIONS
-- ============================================================================

-- Check if user is member of tenant with optional role check
CREATE OR REPLACE FUNCTION is_tenant_member(
  p_user_id UUID,
  p_tenant_id UUID,
  p_required_role membership_role DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_role membership_role;
BEGIN
  SELECT role INTO v_role
  FROM memberships
  WHERE user_id = p_user_id 
    AND tenant_id = p_tenant_id;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  IF p_required_role IS NULL THEN
    RETURN TRUE;
  END IF;
  
  -- Role hierarchy: OWNER > MANAGER > STAFF
  IF p_required_role = 'STAFF' THEN
    RETURN TRUE;
  ELSIF p_required_role = 'MANAGER' THEN
    RETURN v_role IN ('OWNER', 'MANAGER');
  ELSIF p_required_role = 'OWNER' THEN
    RETURN v_role = 'OWNER';
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Get tenant_id for a location
CREATE OR REPLACE FUNCTION get_location_tenant(p_location_id UUID)
RETURNS UUID AS $$
BEGIN
  RETURN (SELECT tenant_id FROM locations WHERE id = p_location_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Check if billing is active for tenant
CREATE OR REPLACE FUNCTION is_billing_active(p_tenant_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM billing_state
    WHERE tenant_id = p_tenant_id
      AND status IN ('ACTIVE', 'TRIALING')
      AND (current_period_end IS NULL OR current_period_end > NOW())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- TENANTS
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view own tenant"
  ON tenants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE memberships.tenant_id = tenants.id
        AND memberships.user_id = auth.uid()
    )
  );

CREATE POLICY "Owners can update own tenant"
  ON tenants FOR UPDATE
  USING (is_tenant_member(auth.uid(), id, 'OWNER'));

CREATE POLICY "Authenticated users can create tenants"
  ON tenants FOR INSERT
  WITH CHECK (auth.uid() = owner_user_id);

-- MEMBERSHIPS
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view own tenant memberships"
  ON memberships FOR SELECT
  USING (is_tenant_member(auth.uid(), tenant_id));

CREATE POLICY "Owners can manage memberships"
  ON memberships FOR ALL
  USING (is_tenant_member(auth.uid(), tenant_id, 'OWNER'));

-- LOCATIONS
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view published locations"
  ON locations FOR SELECT
  USING (is_public = true AND is_active = true);

CREATE POLICY "Members can view own tenant locations"
  ON locations FOR SELECT
  USING (is_tenant_member(auth.uid(), tenant_id));

CREATE POLICY "Managers can manage locations"
  ON locations FOR ALL
  USING (is_tenant_member(auth.uid(), tenant_id, 'MANAGER'));

-- TABLES
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view tables of published locations"
  ON tables FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM locations
      WHERE locations.id = tables.location_id
        AND locations.is_public = true
        AND locations.is_active = true
    )
  );

CREATE POLICY "Members can manage tables"
  ON tables FOR ALL
  USING (is_tenant_member(auth.uid(), get_location_tenant(location_id), 'MANAGER'));

-- SHIFTS
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view shifts of published locations"
  ON shifts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM locations
      WHERE locations.id = shifts.location_id
        AND locations.is_public = true
        AND locations.is_active = true
    )
  );

CREATE POLICY "Members can manage shifts"
  ON shifts FOR ALL
  USING (is_tenant_member(auth.uid(), get_location_tenant(location_id), 'MANAGER'));

-- POLICIES
ALTER TABLE policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view policies of published locations"
  ON policies FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM locations
      WHERE locations.id = policies.location_id
        AND locations.is_public = true
        AND locations.is_active = true
    )
  );

CREATE POLICY "Members can manage policies"
  ON policies FOR ALL
  USING (is_tenant_member(auth.uid(), get_location_tenant(location_id), 'MANAGER'));

-- CONSUMERS
ALTER TABLE consumers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own consumer record"
  ON consumers FOR SELECT
  USING (auth_user_id = auth.uid());

CREATE POLICY "Users can update own consumer record"
  ON consumers FOR UPDATE
  USING (auth_user_id = auth.uid());

-- BOOKINGS
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Consumers can view own bookings"
  ON bookings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM consumers
      WHERE consumers.id = bookings.consumer_id
        AND consumers.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Consumers can cancel own bookings"
  ON bookings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM consumers
      WHERE consumers.id = bookings.consumer_id
        AND consumers.auth_user_id = auth.uid()
    )
  )
  WITH CHECK (status IN ('CANCELLED'));

CREATE POLICY "Members can view tenant bookings"
  ON bookings FOR SELECT
  USING (is_tenant_member(auth.uid(), get_location_tenant(location_id)));

CREATE POLICY "Staff can manage bookings"
  ON bookings FOR ALL
  USING (is_tenant_member(auth.uid(), get_location_tenant(location_id), 'STAFF'));

-- BILLING STATE
ALTER TABLE billing_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view own tenant billing"
  ON billing_state FOR SELECT
  USING (is_tenant_member(auth.uid(), tenant_id));

CREATE POLICY "Owners can update billing"
  ON billing_state FOR UPDATE
  USING (is_tenant_member(auth.uid(), tenant_id, 'OWNER'));

-- POS INTEGRATIONS
ALTER TABLE pos_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Managers can manage POS integrations"
  ON pos_integrations FOR ALL
  USING (is_tenant_member(auth.uid(), get_location_tenant(location_id), 'MANAGER'));

-- FAVORITES
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own favorites"
  ON favorites FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM consumers
      WHERE consumers.id = favorites.consumer_id
        AND consumers.auth_user_id = auth.uid()
    )
  );

-- ============================================================================
-- SERVICE ROLE ACCESS (for webhooks and background jobs)
-- ============================================================================

CREATE POLICY "Service role full access to tenants"
  ON tenants FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access to memberships"
  ON memberships FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access to locations"
  ON locations FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access to tables"
  ON tables FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access to shifts"
  ON shifts FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access to policies"
  ON policies FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access to consumers"
  ON consumers FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access to bookings"
  ON bookings FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access to billing"
  ON billing_state FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access to pos_integrations"
  ON pos_integrations FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access to favorites"
  ON favorites FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT USAGE ON SCHEMA public TO authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Summary:
-- - 11 new tables created (tenants, memberships, locations, tables, shifts, policies, consumers, bookings, billing_state, pos_integrations, favorites)
-- - 6 enums created
-- - 3 helper functions for RLS
-- - Comprehensive RLS policies for all tables
-- - Indexes for performance
-- - Triggers for updated_at
-- 
-- Original tables (users, purchases) remain unchanged for backward compatibility
-- ============================================================================

