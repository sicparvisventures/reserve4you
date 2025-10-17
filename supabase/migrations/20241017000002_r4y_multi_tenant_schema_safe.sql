-- ============================================================================
-- R4Y MULTI-TENANT SCHEMA MIGRATION (SAFE VERSION)
-- ============================================================================
-- This migration can be run multiple times safely using IF NOT EXISTS
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- ENUMS (Safe creation)
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE membership_role AS ENUM ('OWNER', 'MANAGER', 'STAFF');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE booking_status AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'NO_SHOW', 'COMPLETED', 'WAITLIST');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('NONE', 'REQUIRES_PAYMENT', 'PAID', 'FAILED', 'REFUNDED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE billing_plan AS ENUM ('START', 'PRO', 'PLUS');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE billing_status AS ENUM ('ACTIVE', 'PAST_DUE', 'CANCELLED', 'TRIALING');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE pos_vendor AS ENUM ('LIGHTSPEED', 'SQUARE', 'TOAST', 'CLOVER');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- TENANTS
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  brand_color VARCHAR(7) DEFAULT '#FF5A5F',
  logo_url TEXT,
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- MEMBERSHIPS
CREATE TABLE IF NOT EXISTS memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role membership_role NOT NULL DEFAULT 'STAFF',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraint inline (only applied if table is created)
  CONSTRAINT memberships_tenant_id_user_id_key UNIQUE(tenant_id, user_id)
);

-- LOCATIONS
CREATE TABLE IF NOT EXISTS locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  cuisine VARCHAR(100),
  price_range INT CHECK (price_range BETWEEN 1 AND 4),
  
  -- Address (old structure, will be migrated to address_json)
  address_line1 VARCHAR(255),
  address_line2 VARCHAR(255),
  city VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(2) DEFAULT 'NL',
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  
  -- Contact
  phone VARCHAR(20),
  email VARCHAR(255),
  website VARCHAR(255),
  
  -- Hours
  opening_hours_json JSONB DEFAULT '{}',
  
  -- Reservation settings (per location defaults)
  slot_minutes INT NOT NULL DEFAULT 90,
  buffer_minutes INT NOT NULL DEFAULT 15,
  
  -- Status
  is_public BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- SEO
  hero_image_url TEXT,
  meta_description TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- TABLES
CREATE TABLE IF NOT EXISTS tables (
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
  
  -- Constraint inline (only applied if table is created)
  CONSTRAINT tables_location_id_name_key UNIQUE(location_id, name)
);

-- SHIFTS
CREATE TABLE IF NOT EXISTS shifts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  days_of_week INT[] NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  slot_minutes INT NOT NULL DEFAULT 90,
  buffer_minutes INT NOT NULL DEFAULT 15,
  max_parallel INT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- POLICIES
CREATE TABLE IF NOT EXISTS policies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  
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
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraint inline (only applied if table is created)
  CONSTRAINT policies_location_id_key UNIQUE(location_id)
);

-- CONSUMERS
CREATE TABLE IF NOT EXISTS consumers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(255),
  phone_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraint inline (only applied if table is created)
  CONSTRAINT consumers_auth_user_id_key UNIQUE(auth_user_id)
);

-- BOOKINGS
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  table_id UUID REFERENCES tables(id) ON DELETE SET NULL,
  consumer_id UUID REFERENCES consumers(id) ON DELETE SET NULL,
  
  -- Guest info
  guest_name VARCHAR(255) NOT NULL,
  guest_phone VARCHAR(20),
  guest_email VARCHAR(255),
  
  -- Booking details
  party_size INT NOT NULL CHECK (party_size > 0),
  start_ts TIMESTAMPTZ NOT NULL,
  end_ts TIMESTAMPTZ NOT NULL,
  
  -- Status
  status booking_status NOT NULL DEFAULT 'PENDING',
  payment_status payment_status NOT NULL DEFAULT 'NONE',
  
  -- Payments
  stripe_payment_intent_id TEXT,
  deposit_amount_cents INT DEFAULT 0,
  
  -- Notes
  guest_note TEXT,
  internal_note TEXT,
  
  -- Source
  source VARCHAR(20) DEFAULT 'WEB',
  
  -- Idempotency
  idempotency_key VARCHAR(255),
  
  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  -- Constraint inline (only applied if table is created)
  CONSTRAINT bookings_idempotency_key_key UNIQUE(idempotency_key)
);

-- BILLING STATE
CREATE TABLE IF NOT EXISTS billing_state (
  tenant_id UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
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
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints inline (only applied if table is created)
  CONSTRAINT billing_state_stripe_customer_id_key UNIQUE(stripe_customer_id),
  CONSTRAINT billing_state_stripe_subscription_id_key UNIQUE(stripe_subscription_id)
);

-- POS INTEGRATIONS
CREATE TABLE IF NOT EXISTS pos_integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  vendor pos_vendor NOT NULL,
  
  -- OAuth tokens
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
  
  -- Constraint inline (only applied if table is created)
  CONSTRAINT pos_integrations_location_id_vendor_key UNIQUE(location_id, vendor)
);

-- FAVORITES
CREATE TABLE IF NOT EXISTS favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  consumer_id UUID NOT NULL REFERENCES consumers(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraint inline (only applied if table is created)
  CONSTRAINT favorites_consumer_id_location_id_key UNIQUE(consumer_id, location_id)
);

-- ============================================================================
-- INDEXES (Safe creation)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_tenants_owner ON tenants(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_tenant ON memberships(tenant_id);
CREATE INDEX IF NOT EXISTS idx_memberships_user ON memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_tenant_user ON memberships(tenant_id, user_id);
CREATE INDEX IF NOT EXISTS idx_locations_tenant ON locations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_locations_slug ON locations(slug);
CREATE INDEX IF NOT EXISTS idx_locations_public ON locations(is_public, is_active) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_tables_location ON tables(location_id);
CREATE INDEX IF NOT EXISTS idx_tables_active ON tables(location_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_shifts_location ON shifts(location_id);
CREATE INDEX IF NOT EXISTS idx_shifts_active ON shifts(location_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_bookings_location_time ON bookings(location_id, start_ts);
CREATE INDEX IF NOT EXISTS idx_bookings_location_status ON bookings(location_id, status);
CREATE INDEX IF NOT EXISTS idx_bookings_consumer ON bookings(consumer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_table_time ON bookings(table_id, start_ts, end_ts) WHERE table_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bookings_idempotency ON bookings(idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_consumers_auth_user ON consumers(auth_user_id) WHERE auth_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_consumers_phone ON consumers(phone) WHERE phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_consumers_email ON consumers(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_billing_stripe_customer ON billing_state(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_billing_subscription ON billing_state(stripe_subscription_id) WHERE stripe_subscription_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_favorites_consumer ON favorites(consumer_id);
CREATE INDEX IF NOT EXISTS idx_favorites_location ON favorites(location_id);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Update updated_at trigger function (if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Security helper functions
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

CREATE OR REPLACE FUNCTION get_location_tenant(p_location_id UUID)
RETURNS UUID AS $$
BEGIN
  RETURN (SELECT tenant_id FROM locations WHERE id = p_location_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

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
-- TRIGGERS
-- ============================================================================

DROP TRIGGER IF EXISTS update_tenants_updated_at ON tenants;
CREATE TRIGGER update_tenants_updated_at 
  BEFORE UPDATE ON tenants 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_memberships_updated_at ON memberships;
CREATE TRIGGER update_memberships_updated_at 
  BEFORE UPDATE ON memberships 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_locations_updated_at ON locations;
CREATE TRIGGER update_locations_updated_at 
  BEFORE UPDATE ON locations 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tables_updated_at ON tables;
CREATE TRIGGER update_tables_updated_at 
  BEFORE UPDATE ON tables 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_shifts_updated_at ON shifts;
CREATE TRIGGER update_shifts_updated_at 
  BEFORE UPDATE ON shifts 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_policies_updated_at ON policies;
CREATE TRIGGER update_policies_updated_at 
  BEFORE UPDATE ON policies 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_consumers_updated_at ON consumers;
CREATE TRIGGER update_consumers_updated_at 
  BEFORE UPDATE ON consumers 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_bookings_updated_at ON bookings;
CREATE TRIGGER update_bookings_updated_at 
  BEFORE UPDATE ON bookings 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_billing_state_updated_at ON billing_state;
CREATE TRIGGER update_billing_state_updated_at 
  BEFORE UPDATE ON billing_state 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_pos_integrations_updated_at ON pos_integrations;
CREATE TRIGGER update_pos_integrations_updated_at 
  BEFORE UPDATE ON pos_integrations 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE consumers ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- TENANTS policies
DROP POLICY IF EXISTS "Members can view own tenant" ON tenants;
CREATE POLICY "Members can view own tenant"
  ON tenants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE memberships.tenant_id = tenants.id
        AND memberships.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Owners can update own tenant" ON tenants;
CREATE POLICY "Owners can update own tenant"
  ON tenants FOR UPDATE
  USING (is_tenant_member(auth.uid(), id, 'OWNER'));

DROP POLICY IF EXISTS "Authenticated users can create tenants" ON tenants;
CREATE POLICY "Authenticated users can create tenants"
  ON tenants FOR INSERT
  WITH CHECK (auth.uid() = owner_user_id);

DROP POLICY IF EXISTS "Service role full access to tenants" ON tenants;
CREATE POLICY "Service role full access to tenants"
  ON tenants FOR ALL TO service_role USING (true) WITH CHECK (true);

-- MEMBERSHIPS policies
DROP POLICY IF EXISTS "Members can view own tenant memberships" ON memberships;
CREATE POLICY "Members can view own tenant memberships"
  ON memberships FOR SELECT
  USING (is_tenant_member(auth.uid(), tenant_id));

DROP POLICY IF EXISTS "Owners can manage memberships" ON memberships;
CREATE POLICY "Owners can manage memberships"
  ON memberships FOR ALL
  USING (is_tenant_member(auth.uid(), tenant_id, 'OWNER'));

DROP POLICY IF EXISTS "Service role full access to memberships" ON memberships;
CREATE POLICY "Service role full access to memberships"
  ON memberships FOR ALL TO service_role USING (true) WITH CHECK (true);

-- LOCATIONS policies
DROP POLICY IF EXISTS "Public can view published locations" ON locations;
CREATE POLICY "Public can view published locations"
  ON locations FOR SELECT
  USING (is_public = true AND is_active = true);

DROP POLICY IF EXISTS "Members can view own tenant locations" ON locations;
CREATE POLICY "Members can view own tenant locations"
  ON locations FOR SELECT
  USING (is_tenant_member(auth.uid(), tenant_id));

DROP POLICY IF EXISTS "Managers can manage locations" ON locations;
CREATE POLICY "Managers can manage locations"
  ON locations FOR ALL
  USING (is_tenant_member(auth.uid(), tenant_id, 'MANAGER'));

DROP POLICY IF EXISTS "Service role full access to locations" ON locations;
CREATE POLICY "Service role full access to locations"
  ON locations FOR ALL TO service_role USING (true) WITH CHECK (true);

-- TABLES policies
DROP POLICY IF EXISTS "Public can view tables of published locations" ON tables;
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

DROP POLICY IF EXISTS "Members can manage tables" ON tables;
CREATE POLICY "Members can manage tables"
  ON tables FOR ALL
  USING (is_tenant_member(auth.uid(), get_location_tenant(location_id), 'MANAGER'));

DROP POLICY IF EXISTS "Service role full access to tables" ON tables;
CREATE POLICY "Service role full access to tables"
  ON tables FOR ALL TO service_role USING (true) WITH CHECK (true);

-- SHIFTS policies
DROP POLICY IF EXISTS "Public can view shifts of published locations" ON shifts;
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

DROP POLICY IF EXISTS "Members can manage shifts" ON shifts;
CREATE POLICY "Members can manage shifts"
  ON shifts FOR ALL
  USING (is_tenant_member(auth.uid(), get_location_tenant(location_id), 'MANAGER'));

DROP POLICY IF EXISTS "Service role full access to shifts" ON shifts;
CREATE POLICY "Service role full access to shifts"
  ON shifts FOR ALL TO service_role USING (true) WITH CHECK (true);

-- POLICIES table policies
DROP POLICY IF EXISTS "Public can view policies of published locations" ON policies;
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

DROP POLICY IF EXISTS "Members can manage policies" ON policies;
CREATE POLICY "Members can manage policies"
  ON policies FOR ALL
  USING (is_tenant_member(auth.uid(), get_location_tenant(location_id), 'MANAGER'));

DROP POLICY IF EXISTS "Service role full access to policies" ON policies;
CREATE POLICY "Service role full access to policies"
  ON policies FOR ALL TO service_role USING (true) WITH CHECK (true);

-- CONSUMERS policies
DROP POLICY IF EXISTS "Users can view own consumer record" ON consumers;
CREATE POLICY "Users can view own consumer record"
  ON consumers FOR SELECT
  USING (auth_user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own consumer record" ON consumers;
CREATE POLICY "Users can update own consumer record"
  ON consumers FOR UPDATE
  USING (auth_user_id = auth.uid());

DROP POLICY IF EXISTS "Service role full access to consumers" ON consumers;
CREATE POLICY "Service role full access to consumers"
  ON consumers FOR ALL TO service_role USING (true) WITH CHECK (true);

-- BOOKINGS policies
DROP POLICY IF EXISTS "Consumers can view own bookings" ON bookings;
CREATE POLICY "Consumers can view own bookings"
  ON bookings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM consumers
      WHERE consumers.id = bookings.consumer_id
        AND consumers.auth_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Consumers can cancel own bookings" ON bookings;
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

DROP POLICY IF EXISTS "Members can view tenant bookings" ON bookings;
CREATE POLICY "Members can view tenant bookings"
  ON bookings FOR SELECT
  USING (is_tenant_member(auth.uid(), get_location_tenant(location_id)));

DROP POLICY IF EXISTS "Staff can manage bookings" ON bookings;
CREATE POLICY "Staff can manage bookings"
  ON bookings FOR ALL
  USING (is_tenant_member(auth.uid(), get_location_tenant(location_id), 'STAFF'));

DROP POLICY IF EXISTS "Service role full access to bookings" ON bookings;
CREATE POLICY "Service role full access to bookings"
  ON bookings FOR ALL TO service_role USING (true) WITH CHECK (true);

-- BILLING STATE policies
DROP POLICY IF EXISTS "Members can view own tenant billing" ON billing_state;
CREATE POLICY "Members can view own tenant billing"
  ON billing_state FOR SELECT
  USING (is_tenant_member(auth.uid(), tenant_id));

DROP POLICY IF EXISTS "Owners can update billing" ON billing_state;
CREATE POLICY "Owners can update billing"
  ON billing_state FOR UPDATE
  USING (is_tenant_member(auth.uid(), tenant_id, 'OWNER'));

DROP POLICY IF EXISTS "Service role full access to billing" ON billing_state;
CREATE POLICY "Service role full access to billing"
  ON billing_state FOR ALL TO service_role USING (true) WITH CHECK (true);

-- POS INTEGRATIONS policies
DROP POLICY IF EXISTS "Managers can manage POS integrations" ON pos_integrations;
CREATE POLICY "Managers can manage POS integrations"
  ON pos_integrations FOR ALL
  USING (is_tenant_member(auth.uid(), get_location_tenant(location_id), 'MANAGER'));

DROP POLICY IF EXISTS "Service role full access to pos_integrations" ON pos_integrations;
CREATE POLICY "Service role full access to pos_integrations"
  ON pos_integrations FOR ALL TO service_role USING (true) WITH CHECK (true);

-- FAVORITES policies
DROP POLICY IF EXISTS "Users can manage own favorites" ON favorites;
CREATE POLICY "Users can manage own favorites"
  ON favorites FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM consumers
      WHERE consumers.id = favorites.consumer_id
        AND consumers.auth_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Service role full access to favorites" ON favorites;
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
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '🎉 R4Y Base Schema Migration Complete!';
  RAISE NOTICE '   ✅ 11 tables created (with start_ts/end_ts)';
  RAISE NOTICE '   ✅ 6 enums created';
  RAISE NOTICE '   ✅ 3 helper functions created';
  RAISE NOTICE '   ✅ RLS policies enabled';
  RAISE NOTICE '   ✅ Indexes created';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Next steps:';
  RAISE NOTICE '   1. SKIP: 20241017000003_fix_column_names.sql (already done!)';
  RAISE NOTICE '   2. Run: 20241017000004_migrate_address_to_json.sql';
  RAISE NOTICE '   3. Run: 20241017000005_fix_tenant_creation_rls_v2.sql';
  RAISE NOTICE '';
  RAISE NOTICE '💡 TIP: If you have existing data with start_time/end_time,';
  RAISE NOTICE '    run 20241017000003_fix_column_names.sql to migrate it.';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '';
END $$;

