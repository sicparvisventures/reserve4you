# R4Y - Product Requirements Document (PRD)

**Product:** R4Y - Restaurant Reservations Platform  
**Version:** 1.0 MVP  
**Date:** October 17, 2025  
**Status:** In Development

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Brand & Design System](#2-brand--design-system)
3. [User Personas & Flows](#3-user-personas--flows)
4. [Information Architecture](#4-information-architecture)
5. [Data Model](#5-data-model)
6. [Security & RLS](#6-security--rls)
7. [API Specifications](#7-api-specifications)
8. [Frontend Specifications](#8-frontend-specifications)
9. [Billing & Subscription](#9-billing--subscription)
10. [Integration: Lightspeed POS](#10-integration-lightspeed-pos)
11. [Acceptance Criteria](#11-acceptance-criteria)
12. [Implementation Checklist](#12-implementation-checklist)

---

## 1. Product Overview

### Vision

R4Y is a production-grade, multi-tenant restaurant reservations platform that connects diners with available tables in real-time while providing restaurants with professional tools to manage bookings, tables, and operations.

### Core Value Propositions

**For Diners (Consumers):**
- Discover nearby restaurants with live availability
- Book tables in 3 simple steps
- Manage favorites and booking history
- Guest booking with phone verification (no account required)

**For Restaurants (Managers):**
- Professional booking management dashboard
- Real-time calendar with drag-and-drop
- Flexible policies (cancellation, deposits, no-show fees)
- Integration with Lightspeed POS
- Subscription-based with clear ROI

### Success Metrics (MVP)

- **Consumer:** Complete a booking in < 60 seconds
- **Manager:** Complete onboarding in < 15 minutes
- **Platform:** Zero double-bookings (transaction integrity)
- **Business:** 95% of published locations have active subscriptions
- **Technical:** < 2 second availability calculation

### MVP Scope

**In Scope:**
- ✅ Consumer discovery and booking
- ✅ Manager portal with onboarding
- ✅ Calendar and reservations management
- ✅ Subscription billing (3 tiers)
- ✅ Billing gate for publishing
- ✅ Basic policies (cancellation, deposits, no-show)
- ✅ Google OAuth for consumers
- ✅ SMS verification for guest bookings
- ✅ Lightspeed POS connector (read-only stub)

**Out of Scope (Post-MVP):**
- ❌ Email/SMS notifications (manual confirmation only)
- ❌ CRM features
- ❌ Analytics dashboard
- ❌ Review/rating system
- ❌ Photo galleries
- ❌ Special offers/promotions
- ❌ Multi-language UI (NL only for MVP)
- ❌ Mobile native apps
- ❌ Lightspeed write-back

---

## 2. Brand & Design System

### Color Palette (Strict)

```typescript
// R4Y Design Tokens
const colors = {
  background: '#F7F7F9',    // Light gray background
  card: '#FFFFFF',           // Pure white cards
  text: '#111111',           // Near-black text
  border: '#E7E7EC',         // Light gray borders
  accent: '#FF5A5F',         // R4Y brand red (primary)
  success: '#18C964',        // Green for success states
  warning: '#FFB020',        // Orange for warnings
  error: '#E11D48',          // Red for errors
  info: '#3B82F6',           // Blue for info
};

// Apply to existing design system
:root {
  --primary: 0 86% 67%;         /* #FF5A5F → accent */
  --background: 240 5% 97%;     /* #F7F7F9 */
  --foreground: 0 0% 7%;        /* #111111 */
  --border: 240 4% 92%;         /* #E7E7EC */
  --success: 142 76% 45%;       /* #18C964 */
  --destructive: 346 77% 50%;   /* #E11D48 */
}
```

### Visual Language

**Aesthetic:** Apple-like minimalism
- Clean, spacious layouts
- Soft shadows: `0 2px 8px rgba(0,0,0,0.04)`
- Border radius: `rounded-2xl` (16px) for cards
- Micro-interactions: 200–250ms ease-out
- Professional line icons (Lucide React)
- No emoji in production UI

**Typography:**
- Font family: System stack (existing: Manrope)
- Scale: 12px / 14px / 16px / 18px / 24px / 32px / 48px
- Line height: 1.5 for body, 1.2 for headings
- Letter spacing: tight for headings, normal for body

**Spacing:**
- 8pt grid system
- Standard gaps: 4px, 8px, 16px, 24px, 32px, 48px

**Components:**
- Buttons: h-11 (44px touch target), rounded-xl
- Inputs: h-11, rounded-lg, border focus ring
- Cards: p-6, rounded-2xl, shadow-sm
- Badges: px-3 py-1, rounded-full, text-sm

### Dark Mode

**MVP:** Light mode only  
**Post-MVP:** Optional dark mode using existing CSS variables

### Internationalization

**MVP:** Dutch (NL) as default
- Hardcoded strings in NL
- Language switcher in Profile (NL/FR/EN) - UI only, backend ready

**Post-MVP:** Full i18n with next-intl or similar

---

## 3. User Personas & Flows

### Persona 1: Diner (Consumer)

**Name:** Emma  
**Age:** 32  
**Behavior:** Uses mobile, books last-minute, values speed and simplicity

**Goals:**
- Find a table for tonight near me
- Book without lengthy sign-up
- See menu and photos before deciding
- Easy cancellation if plans change

**Flow: Discovery & Booking**

```
1. Land on / (Home)
   - See "Vanavond beschikbaar" carousel
   - Action ribbon: "Bij mij in de buurt", "Nu open", "Vandaag"
   
2. Tap "Bij mij in de buurt"
   - Location permission prompt
   - Show nearby restaurants with live availability
   
3. Tap restaurant card → /p/[slug]
   - See overview (photos, cuisine, ratings)
   - Tabs: Overzicht, Beschikbaarheid, Menu, Foto's, Locatie
   
4. Tap "Reserveren" → Bottom sheet opens
   Step 1: Personen (2, 4, 6, 8+)
   Step 2: Datum/Tijd (calendar + time slots)
   Step 3: Gegevens (name, phone, email, note)
   
5. Submit booking
   - If guest: SMS verification code
   - If Google user: Auto-filled details
   
6. Confirmation screen
   - Booking details
   - Add to calendar (iOS/Android)
   - View in Profile → Mijn reserveringen
```

**Edge Cases:**
- No availability → Suggest nearby or different times
- Deposit required → Stripe Payment Intent (€10-20)
- Already booked this slot → Error + suggest alternative

### Persona 2: Restaurant Manager

**Name:** Marco  
**Age:** 45  
**Role:** Restaurant owner  
**Behavior:** Desktop-first, wants control, skeptical of SaaS

**Goals:**
- Manage bookings without phone calls
- Prevent no-shows with deposits
- See availability at a glance
- Control when to accept bookings (policies)

**Flow: Onboarding**

```
1. Land on /manager
   - "Nieuw bedrijf starten" → Email + password signup
   
2. Onboarding wizard (7 steps)
   
   Step 1: Bedrijf
   - Bedrijfsnaam
   - Logo upload (optional)
   - Accent kleur (brand color)
   
   Step 2: Locatie
   - Naam locatie (e.g., "Hoofdvestiging")
   - Adres (geocoded)
   - Telefoon, email
   - Openingstijden (weekdays + hours)
   
   Step 3: Tafels & Shifts
   - Add tables (name, seats, combineerbaar?)
   - Create shifts (naam, start, eind, slot minuten, buffer)
   
   Step 4: Beleid
   - Annulatiebeleid: X uur van tevoren
   - No-show boete: €X
   - Aanbetaling: Ja/Nee, Type (%, fixed), Waarde
   
   Step 5: Betaalinstellingen (optional for MVP)
   - Stripe Connect (for deposits/payouts)
   - Or: Skip if no deposits
   
   Step 6: Abonnement & betaling ⭐
   - Choose plan: Start / Pro / Plus
   - Stripe Checkout (subscription)
   - Must complete to proceed
   
   Step 7: Preview & Publiceer
   - Preview public page
   - Server validation: billing active? tables exist? shifts exist?
   - Publish button → is_public = true
   
3. Redirect to dashboard
```

**Flow: Daily Operations**

```
1. Dashboard: /manager/dashboard
   - Calendar view (week or day)
   - Reservations list (today, upcoming)
   - Quick actions: "Nieuwe reservering", "Wachtlijst"
   
2. Calendar interactions
   - Drag booking to different time slot
   - Click slot → Create manual booking
   - Color-coded: CONFIRMED (green), PENDING (yellow), CANCELLED (gray)
   
3. Reservation detail
   - Guest details, party size, table
   - Status: Confirm, Cancel, Mark no-show
   - Add internal note
   - Resend confirmation (post-MVP)
```

**Edge Cases:**
- Subscription expires → Cannot publish, existing bookings read-only
- Quota exceeded → Cannot accept new bookings, upgrade prompt
- Concurrent booking → Transaction handles, show error "Conflict, try again"

---

## 4. Information Architecture

### Consumer App Routes

```
/ (Home)
├── Header: R4Y logo, location chip, notifications, profile
├── Action ribbon
│   ├── Bij mij in de buurt
│   ├── Nu open
│   ├── Vandaag
│   ├── Groepen
│   ├── Deals
│   └── Zoeken
└── Sections
    ├── Vanavond beschikbaar (carousel)
    ├── Populair bij jou in de buurt
    └── Nieuwe restaurants

/discover
├── Search bar (sticky)
├── Category chips (Italiaans, Sushi, Steaks, etc.)
├── Filters sheet
│   ├── Prijs
│   ├── Keuken
│   ├── Dieet (Vegetarisch, Vegan, Glutenvrij)
│   └── Faciliteiten (Terras, Parking, Rolstoeltoegankelijk)
├── List/Map toggle
└── Restaurant cards

/p/[slug] (Provider detail)
├── Hero image
├── Header: Name, cuisine, price range, rating
├── CTA: "Reserveren" (fixed bottom on mobile)
└── Tabs
    ├── Overzicht (description, hours, policies)
    ├── Beschikbaarheid (calendar + time slots)
    ├── Menu (from POS or manual)
    ├── Foto's (gallery)
    └── Locatie (map, address, directions)

/favorites
└── Grid of saved restaurants

/profile
├── Mijn reserveringen (upcoming, past)
├── Favorieten
├── Accountinstellingen
│   ├── Naam, email, telefoon
│   ├── Taal (NL/FR/EN)
│   └── Notificaties (post-MVP)
└── Uitloggen

/booking/[id]
└── Confirmation page
    ├── Booking details
    ├── Locatie info
    ├── Add to calendar
    └── "Annuleren" button
```

### Manager Portal Routes

```
/manager
├── Login (email/password or PIN)
├── "Nieuw bedrijf starten"
└── Redirect to /manager/onboarding or /manager/dashboard

/manager/onboarding
└── Wizard (7 steps, progress indicator)

/manager/dashboard
├── Sidebar nav
│   ├── Dashboard
│   ├── Reserveringen
│   ├── Wachtlijst
│   ├── Instellingen
│   └── Facturatie
├── Calendar view
│   ├── Week / Day toggle
│   ├── Tables as columns (per shift)
│   ├── Bookings as draggable blocks
│   └── Time slots (15min increments)
├── Today's reservations (list)
└── Stats (total bookings, no-shows, revenue - post-MVP)

/manager/reservations
├── Filters: Status, Date range, Search
├── Table with columns
│   ├── Datum/Tijd
│   ├── Gast
│   ├── Personen
│   ├── Tafel
│   ├── Status
│   └── Acties
└── Bulk actions (post-MVP)

/manager/settings
├── Tabs
│   ├── Locatie (address, hours)
│   ├── Tafels & Shifts
│   ├── Beleid
│   ├── Team (members, roles)
│   ├── Integraties (Lightspeed)
│   └── Facturatie (plan, billing portal)

/manager/billing
├── Current plan
├── Usage (bookings this month, quota)
├── "Upgrade" / "Wijzig abonnement"
└── Stripe Customer Portal link
```

### API Routes

```
/api/auth/google (OAuth callback)
/api/auth/sms-verify (verify phone)

/api/locations/search (query, filters)
/api/locations/[slug] (public detail)
/api/locations/nearby (lat, lng)

/api/availability/check (location_id, date, party_size)
/api/bookings/create (idempotency key, payload)
/api/bookings/[id] (get, update, cancel)
/api/bookings/confirm (manager action)

/api/manager/onboarding/validate (step validation)
/api/manager/locations/publish (location_id)
/api/manager/bookings (CRUD for manager)
/api/manager/calendar (date range, location_id)

/api/stripe/checkout (create subscription session)
/api/stripe/webhook (subscription + payment events)
/api/stripe/create-payment-intent (for deposits)
/api/stripe/portal (customer portal link)

/api/lightspeed/connect (OAuth flow)
/api/lightspeed/webhook (status updates)
/api/lightspeed/sync (manual sync trigger)
```

---

## 5. Data Model

### Complete Schema

```sql
-- ============================================================================
-- R4Y MULTI-TENANT SCHEMA
-- ============================================================================

-- TENANTS (Organizations)
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  brand_color VARCHAR(7) DEFAULT '#FF5A5F',
  logo_url TEXT,
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- MEMBERSHIPS (Team members)
CREATE TYPE membership_role AS ENUM ('OWNER', 'MANAGER', 'STAFF');

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
  price_range INT CHECK (price_range BETWEEN 1 AND 4), -- €, ££, £££, ££££
  
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
  
  -- Hours (JSON: { "MON": [{"open":"11:00","close":"22:00"}], ... })
  opening_hours JSONB,
  
  -- Status
  is_public BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- TABLES (Restaurant tables)
CREATE TABLE tables (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL, -- "Table 1", "Bar Seat 3"
  seats INT NOT NULL CHECK (seats > 0),
  min_seats INT, -- Allow smaller parties
  max_seats INT, -- Allow larger if combined
  is_combinable BOOLEAN NOT NULL DEFAULT false,
  group_id VARCHAR(50), -- For pre-combined groups (e.g., "Group A")
  position_x INT, -- For visual layout (post-MVP)
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
  name VARCHAR(100) NOT NULL, -- "Lunch", "Dinner", "Weekend Brunch"
  day_of_week INT[] NOT NULL, -- [1,2,3,4,5] for Mon-Fri
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  slot_duration_minutes INT NOT NULL DEFAULT 90, -- Typical reservation length
  buffer_minutes INT NOT NULL DEFAULT 15, -- Time between bookings
  max_concurrent_bookings INT, -- Optional limit
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- POLICIES (Location-specific rules)
CREATE TABLE policies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE UNIQUE,
  
  -- Cancellation
  cancellation_hours INT NOT NULL DEFAULT 24, -- Hours before booking
  allow_same_day_booking BOOLEAN NOT NULL DEFAULT true,
  
  -- No-show
  no_show_fee_enabled BOOLEAN NOT NULL DEFAULT false,
  no_show_fee_cents INT DEFAULT 0,
  
  -- Deposits
  deposit_required BOOLEAN NOT NULL DEFAULT false,
  deposit_type VARCHAR(10) CHECK (deposit_type IN ('PERCENT', 'FIXED')),
  deposit_value INT, -- Percentage (e.g., 20) or cents (e.g., 1000 = €10)
  deposit_applies_to_party_size INT, -- Only for parties >= X
  
  -- Booking rules
  max_party_size INT DEFAULT 12,
  advance_booking_days INT DEFAULT 60,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- CONSUMERS (Guests, may or may not have auth account)
CREATE TABLE consumers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(255),
  phone_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(phone), -- Phone is unique identifier for guests
  UNIQUE(auth_user_id)
);

-- BOOKINGS (Reservations)
CREATE TYPE booking_status AS ENUM (
  'PENDING',    -- Awaiting confirmation or payment
  'CONFIRMED',  -- Confirmed and ready
  'CANCELLED',  -- Cancelled by guest or manager
  'NO_SHOW',    -- Guest didn't show up
  'COMPLETED',  -- Past booking, guest arrived
  'WAITLIST'    -- On waitlist
);

CREATE TYPE payment_status AS ENUM (
  'NONE',               -- No payment required
  'REQUIRES_PAYMENT',   -- Deposit required, not paid
  'PAID',               -- Deposit paid
  'FAILED',             -- Payment failed
  'REFUNDED'            -- Refunded
);

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
  internal_note TEXT, -- Manager only
  
  -- Source
  source VARCHAR(20) DEFAULT 'WEB', -- WEB, PHONE, WALKIN, POS
  
  -- Idempotency
  idempotency_key VARCHAR(255),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id), -- Manager who created (if manual)
  
  UNIQUE(idempotency_key)
);

-- BILLING STATE (Subscription status per tenant)
CREATE TYPE billing_plan AS ENUM ('START', 'PRO', 'PLUS');
CREATE TYPE billing_status AS ENUM ('ACTIVE', 'PAST_DUE', 'CANCELLED', 'TRIALING');

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
CREATE TYPE pos_vendor AS ENUM ('LIGHTSPEED', 'SQUARE', 'TOAST', 'CLOVER');

CREATE TABLE pos_integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  vendor pos_vendor NOT NULL,
  
  -- OAuth tokens (encrypted in production)
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  
  -- Configuration
  external_location_id VARCHAR(255), -- Vendor's location ID
  config JSONB, -- Vendor-specific config
  
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

CREATE INDEX idx_locations_tenant ON locations(tenant_id);
CREATE INDEX idx_locations_slug ON locations(slug);
CREATE INDEX idx_locations_public ON locations(is_public, is_active);
CREATE INDEX idx_locations_geo ON locations(latitude, longitude);

CREATE INDEX idx_tables_location ON tables(location_id);
CREATE INDEX idx_shifts_location ON shifts(location_id);

CREATE INDEX idx_bookings_location_time ON bookings(location_id, start_time);
CREATE INDEX idx_bookings_consumer ON bookings(consumer_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_idempotency ON bookings(idempotency_key);

CREATE INDEX idx_consumers_auth_user ON consumers(auth_user_id);
CREATE INDEX idx_consumers_phone ON consumers(phone);

CREATE INDEX idx_memberships_tenant ON memberships(tenant_id);
CREATE INDEX idx_memberships_user ON memberships(user_id);

CREATE INDEX idx_favorites_consumer ON favorites(consumer_id);
CREATE INDEX idx_favorites_location ON favorites(location_id);

-- ============================================================================
-- UPDATED_AT TRIGGERS
-- ============================================================================

-- Reuse existing function: update_updated_at_column()

CREATE TRIGGER update_tenants_updated_at 
  BEFORE UPDATE ON tenants 
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
```

### Tier Definitions

```typescript
const BILLING_TIERS = {
  START: {
    name: 'Start',
    price: 49, // €49/month
    maxLocations: 1,
    maxBookingsPerMonth: 200,
    features: ['Basis reserveringssysteem', 'Kalender', 'SMS notificaties'],
  },
  PRO: {
    name: 'Pro',
    price: 99, // €99/month
    maxLocations: 3,
    maxBookingsPerMonth: 1000,
    features: ['Alles van Start', 'Aanbetalingen', 'Wachtlijst', 'Team members (3)'],
  },
  PLUS: {
    name: 'Plus',
    price: 199, // €199/month
    maxLocations: 999, // Unlimited
    maxBookingsPerMonth: 999999, // Unlimited
    features: ['Alles van Pro', 'Onbeperkte locaties', 'POS integratie', 'Prioriteit support'],
  },
};
```

---

## 6. Security & RLS

### Helper Functions

```sql
-- ============================================================================
-- SECURITY DEFINER HELPERS
-- ============================================================================

-- Check if user is member of tenant (with optional role check)
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
  
  -- If no specific role required, just check membership
  IF p_required_role IS NULL THEN
    RETURN TRUE;
  END IF;
  
  -- Check role hierarchy: OWNER > MANAGER > STAFF
  IF p_required_role = 'STAFF' THEN
    RETURN TRUE; -- Any role can do STAFF actions
  ELSIF p_required_role = 'MANAGER' THEN
    RETURN v_role IN ('OWNER', 'MANAGER');
  ELSIF p_required_role = 'OWNER' THEN
    RETURN v_role = 'OWNER';
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get tenant_id for a location (used in RLS)
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
```

### RLS Policies

```sql
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

-- Public can view published locations
CREATE POLICY "Public can view published locations"
  ON locations FOR SELECT
  USING (is_public = true AND is_active = true);

-- Members can view own tenant locations
CREATE POLICY "Members can view own tenant locations"
  ON locations FOR SELECT
  USING (is_tenant_member(auth.uid(), tenant_id));

-- Managers can manage locations
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
    )
  );

CREATE POLICY "Members can manage tables"
  ON tables FOR ALL
  USING (
    is_tenant_member(auth.uid(), get_location_tenant(location_id), 'MANAGER')
  );

-- SHIFTS
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view shifts of published locations"
  ON shifts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM locations
      WHERE locations.id = shifts.location_id
        AND locations.is_public = true
    )
  );

CREATE POLICY "Members can manage shifts"
  ON shifts FOR ALL
  USING (
    is_tenant_member(auth.uid(), get_location_tenant(location_id), 'MANAGER')
  );

-- POLICIES
ALTER TABLE policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view policies of published locations"
  ON policies FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM locations
      WHERE locations.id = policies.location_id
        AND locations.is_public = true
    )
  );

CREATE POLICY "Members can manage policies"
  ON policies FOR ALL
  USING (
    is_tenant_member(auth.uid(), get_location_tenant(location_id), 'MANAGER')
  );

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

-- Consumers can view own bookings
CREATE POLICY "Consumers can view own bookings"
  ON bookings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM consumers
      WHERE consumers.id = bookings.consumer_id
        AND consumers.auth_user_id = auth.uid()
    )
  );

-- Consumers can cancel own bookings
CREATE POLICY "Consumers can cancel own bookings"
  ON bookings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM consumers
      WHERE consumers.id = bookings.consumer_id
        AND consumers.auth_user_id = auth.uid()
    )
  )
  WITH CHECK (status IN ('CANCELLED')); -- Can only set to CANCELLED

-- Members can view tenant bookings
CREATE POLICY "Members can view tenant bookings"
  ON bookings FOR SELECT
  USING (
    is_tenant_member(auth.uid(), get_location_tenant(location_id))
  );

-- Managers can manage bookings
CREATE POLICY "Managers can manage bookings"
  ON bookings FOR ALL
  USING (
    is_tenant_member(auth.uid(), get_location_tenant(location_id), 'STAFF')
  );

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
  USING (
    is_tenant_member(auth.uid(), get_location_tenant(location_id), 'MANAGER')
  );

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
-- SERVICE ROLE ACCESS
-- ============================================================================

-- Service role has full access (for webhooks, background jobs)
CREATE POLICY "Service role has full access to all tables"
  ON tenants FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role has full access to memberships"
  ON memberships FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role has full access to locations"
  ON locations FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role has full access to bookings"
  ON bookings FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role has full access to billing"
  ON billing_state FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Add for other tables as needed...
```

---

## 7. API Specifications

### 7.1 Availability Check

**Endpoint:** `POST /api/availability/check`

**Purpose:** Calculate available time slots for a given location, date, and party size.

**Request:**
```typescript
{
  location_id: string;       // UUID
  date: string;              // YYYY-MM-DD
  party_size: number;        // 2, 4, 6, etc.
  shift_id?: string;         // Optional: filter by shift
}
```

**Response:**
```typescript
{
  location_id: string;
  date: string;
  party_size: number;
  slots: Array<{
    time: string;            // "18:00"
    available: boolean;
    tables: string[];        // Table IDs that can accommodate
    shift_id: string;
    shift_name: string;      // "Dinner"
  }>;
  top_suggestions: string[]; // Top 6 times: ["18:00", "18:30", ...]
}
```

**Algorithm:**
1. Get location's shifts for the day of week
2. Get location's tables that can accommodate party_size (exact or combinable)
3. Get all bookings for the date
4. For each shift:
   - Generate time slots (start_time to end_time, every slot_duration)
   - For each slot:
     - Check if any table is free (not booked + buffer)
     - Mark as available if yes
5. Return all slots + top 6 available

**Edge Cases:**
- No shifts defined → Return empty
- No tables that fit party_size → Return no availability
- All tables booked → Return no availability
- Party size > max_party_size → Return error

**Performance:** Should complete in < 500ms for typical location (20 tables, 100 bookings/day)

---

### 7.2 Create Booking

**Endpoint:** `POST /api/bookings/create`

**Purpose:** Create a new booking with transaction safety (no double-booking).

**Request:**
```typescript
{
  idempotency_key: string;   // Required: UUID
  location_id: string;
  start_time: string;        // ISO 8601
  end_time: string;
  party_size: number;
  guest_name: string;
  guest_phone?: string;
  guest_email?: string;
  guest_note?: string;
  source: 'WEB' | 'PHONE' | 'WALKIN';
  
  // If authenticated consumer
  consumer_id?: string;
}
```

**Response (Success):**
```typescript
{
  booking_id: string;
  status: 'CONFIRMED' | 'PENDING';
  table_id?: string;
  payment_required: boolean;
  payment_intent_id?: string;
  confirmation_code: string;  // 6-digit code
}
```

**Response (Error):**
```typescript
{
  error: string;
  code: 'NO_AVAILABILITY' | 'QUOTA_EXCEEDED' | 'INVALID_TIME' | 'BILLING_INACTIVE';
  details?: any;
}
```

**Algorithm:**
```typescript
async function createBooking(payload) {
  // 1. Validation
  validateInput(payload); // Zod schema
  
  // 2. Check idempotency
  const existing = await getBookingByIdempotencyKey(payload.idempotency_key);
  if (existing) return existing; // Already created
  
  // 3. Check billing state (if manager-created)
  if (payload.source !== 'WEB') {
    const tenant = await getTenantForLocation(payload.location_id);
    if (!isBillingActive(tenant.id)) {
      throw new Error('BILLING_INACTIVE');
    }
    
    // Check quota
    const usage = await getMonthlyBookingCount(tenant.id);
    if (usage >= tenant.max_bookings_per_month) {
      throw new Error('QUOTA_EXCEEDED');
    }
  }
  
  // 4. SERIALIZABLE TRANSACTION
  const booking = await db.transaction(async (tx) => {
    tx.query('SET TRANSACTION ISOLATION LEVEL SERIALIZABLE');
    
    // Re-check availability with row lock
    const availableTables = await tx.query(`
      SELECT id FROM tables
      WHERE location_id = $1
        AND seats >= $2
        AND is_active = true
        AND id NOT IN (
          SELECT table_id FROM bookings
          WHERE location_id = $1
            AND status IN ('CONFIRMED', 'PENDING')
            AND (
              (start_time, end_time) OVERLAPS ($3, $4)
            )
        )
      FOR UPDATE
      LIMIT 1
    `, [location_id, party_size, start_time, end_time]);
    
    if (availableTables.length === 0) {
      throw new Error('NO_AVAILABILITY');
    }
    
    // Create consumer record if needed
    let consumer_id = payload.consumer_id;
    if (!consumer_id && payload.guest_phone) {
      consumer_id = await upsertConsumer({
        phone: payload.guest_phone,
        name: payload.guest_name,
        email: payload.guest_email,
      });
    }
    
    // Create booking
    const booking = await tx.query(`
      INSERT INTO bookings (
        id, idempotency_key, location_id, table_id, consumer_id,
        guest_name, guest_phone, guest_email, guest_note,
        party_size, start_time, end_time, status, source
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `, [
      uuid(), payload.idempotency_key, payload.location_id, availableTables[0].id,
      consumer_id, payload.guest_name, payload.guest_phone, payload.guest_email,
      payload.guest_note, payload.party_size, payload.start_time, payload.end_time,
      'CONFIRMED', payload.source
    ]);
    
    return booking;
  });
  
  // 5. Check if deposit required
  const policy = await getLocationPolicy(payload.location_id);
  if (policy.deposit_required && party_size >= policy.deposit_applies_to_party_size) {
    const paymentIntent = await createDepositPaymentIntent(booking);
    booking.payment_required = true;
    booking.payment_intent_id = paymentIntent.id;
    booking.status = 'PENDING';
  }
  
  // 6. Return
  return {
    booking_id: booking.id,
    status: booking.status,
    table_id: booking.table_id,
    payment_required: booking.payment_required,
    payment_intent_id: booking.payment_intent_id,
    confirmation_code: generateConfirmationCode(),
  };
}
```

**Error Handling:**
- `NO_AVAILABILITY`: Race condition, table taken
- `QUOTA_EXCEEDED`: Tenant hit monthly limit
- `BILLING_INACTIVE`: Tenant subscription expired
- `SERIALIZABLE_ERROR`: Retry (3x with exponential backoff)

---

### 7.3 Publish Location

**Endpoint:** `POST /api/manager/locations/publish`

**Purpose:** Validate and publish a location (make it publicly bookable).

**Request:**
```typescript
{
  location_id: string;
}
```

**Response (Success):**
```typescript
{
  success: true;
  location_id: string;
  public_url: string;
}
```

**Response (Error):**
```typescript
{
  error: string;
  validations: Array<{
    field: string;
    message: string;
  }>;
}
```

**Validation Checks:**
```typescript
async function validateForPublish(location_id) {
  const errors = [];
  
  // 1. Location has required fields
  const location = await getLocation(location_id);
  if (!location.address_line1 || !location.city) {
    errors.push({ field: 'address', message: 'Complete address required' });
  }
  if (!location.opening_hours || Object.keys(location.opening_hours).length === 0) {
    errors.push({ field: 'opening_hours', message: 'Opening hours required' });
  }
  
  // 2. At least one table exists
  const tables = await getTables(location_id);
  if (tables.length === 0) {
    errors.push({ field: 'tables', message: 'At least one table required' });
  }
  
  // 3. At least one shift exists
  const shifts = await getShifts(location_id);
  if (shifts.length === 0) {
    errors.push({ field: 'shifts', message: 'At least one shift required' });
  }
  
  // 4. Policy configured
  const policy = await getPolicy(location_id);
  if (!policy) {
    errors.push({ field: 'policy', message: 'Booking policy required' });
  }
  
  // 5. CRITICAL: Billing is active
  const tenant = await getTenantForLocation(location_id);
  const billingState = await getBillingState(tenant.id);
  if (!billingState || billingState.status !== 'ACTIVE') {
    errors.push({ field: 'billing', message: 'Active subscription required to publish' });
  }
  
  // 6. Check location quota
  const publishedCount = await getPublishedLocationCount(tenant.id);
  if (publishedCount >= billingState.max_locations) {
    errors.push({ field: 'billing', message: `Plan allows ${billingState.max_locations} locations. Upgrade to publish more.` });
  }
  
  return errors;
}
```

---

## 8. Frontend Specifications

### 8.1 Booking Bottom Sheet

**Component:** `BookingSheet.tsx`

**Behavior:**
- Triggered by "Reserveren" button on location page
- Slides up from bottom (mobile) or modal (desktop)
- 3-step flow with progress indicator
- Cannot skip steps
- Form state persisted if user closes and reopens

**Step 1: Party Size**
```tsx
<div className="grid grid-cols-4 gap-3">
  {[2, 4, 6, 8].map(size => (
    <button
      key={size}
      className={cn(
        "h-16 rounded-xl border-2 transition-all",
        selected === size ? "border-accent bg-accent/10" : "border-border"
      )}
      onClick={() => setPartySize(size)}
    >
      <UserIcon />
      <span>{size}</span>
    </button>
  ))}
  <button onClick={() => setShowCustomInput(true)}>
    Meer
  </button>
</div>
```

**Step 2: Date & Time**
```tsx
<div>
  <DatePicker
    value={selectedDate}
    onChange={setSelectedDate}
    minDate={new Date()}
    maxDate={addDays(new Date(), 60)}
    disabled={getDisabledDates()} // Closed days
  />
  
  <div className="mt-6">
    <h3>Beschikbare tijden</h3>
    {loading ? (
      <TimeSkeleton />
    ) : (
      <div className="grid grid-cols-3 gap-2">
        {availableSlots.map(slot => (
          <button
            key={slot.time}
            className="px-4 py-2 rounded-lg border"
            onClick={() => setSelectedTime(slot.time)}
          >
            {slot.time}
          </button>
        ))}
      </div>
    )}
  </div>
</div>
```

**Step 3: Guest Details**
```tsx
<Form>
  <Input
    label="Naam"
    value={name}
    onChange={setName}
    required
  />
  <Input
    label="Telefoonnummer"
    type="tel"
    value={phone}
    onChange={setPhone}
    required
  />
  <Input
    label="Email"
    type="email"
    value={email}
    onChange={setEmail}
    required
  />
  <Textarea
    label="Speciale verzoeken (optioneel)"
    value={note}
    onChange={setNote}
    placeholder="Bijv. kindersto el, allergieën..."
  />
  
  {depositRequired && (
    <Alert variant="info">
      Voor deze reservering is een aanbetaling van €{depositAmount} vereist.
    </Alert>
  )}
  
  <Button
    size="lg"
    className="w-full"
    onClick={handleSubmit}
    loading={submitting}
  >
    {depositRequired ? 'Doorgaan naar betaling' : 'Reservering bevestigen'}
  </Button>
</Form>
```

**Error Handling:**
- Network error → Toast + retry button
- Slot no longer available → "Deze tijd is helaas niet meer beschikbaar. Kies een andere tijd."
- Validation error → Inline field errors

---

### 8.2 Manager Calendar

**Component:** `ManagerCalendar.tsx`

**View Modes:**
- Day view: Hour-by-hour grid, tables as columns
- Week view: Days as columns, aggregated bookings

**Day View Layout:**
```tsx
<div className="calendar-grid">
  {/* Header: Table names */}
  <div className="grid grid-cols-[80px_repeat(auto-fit,minmax(120px,1fr))] gap-2">
    <div>Time</div>
    {tables.map(table => (
      <div key={table.id} className="font-medium text-center">
        {table.name}
        <span className="text-sm text-muted-foreground">({table.seats}p)</span>
      </div>
    ))}
  </div>
  
  {/* Time slots */}
  {timeSlots.map(time => (
    <div key={time} className="grid grid-cols-[80px_repeat(auto-fit,minmax(120px,1fr))] gap-2">
      <div className="text-sm text-muted-foreground">{time}</div>
      {tables.map(table => {
        const booking = getBookingAt(table.id, time);
        return (
          <div
            key={table.id}
            className="min-h-[60px] border border-border rounded-lg"
            onClick={() => !booking && createBooking(table.id, time)}
          >
            {booking && (
              <BookingBlock
                booking={booking}
                onDragStart={() => handleDragStart(booking)}
                onDragEnd={handleDragEnd}
              />
            )}
          </div>
        );
      })}
    </div>
  ))}
</div>
```

**Booking Block:**
```tsx
<div
  className={cn(
    "p-2 rounded-lg text-sm cursor-move",
    booking.status === 'CONFIRMED' && "bg-success/20 border-success",
    booking.status === 'PENDING' && "bg-warning/20 border-warning",
    booking.status === 'CANCELLED' && "bg-muted border-muted"
  )}
  draggable
>
  <div className="font-medium">{booking.guest_name}</div>
  <div className="text-xs">{booking.party_size}p • {formatTime(booking.start_time)}</div>
  {booking.guest_phone && (
    <div className="text-xs text-muted-foreground">{booking.guest_phone}</div>
  )}
</div>
```

**Drag & Drop:**
- onDragStart: Store booking ID
- onDragOver: Highlight drop zone if valid (table can accommodate, time is free)
- onDrop: Call API to update booking time/table
- onError: Revert UI, show toast

---

### 8.3 Onboarding Wizard

**Component:** `OnboardingWizard.tsx`

**State Management:**
```typescript
const [step, setStep] = useState(1);
const [data, setData] = useState({
  tenant: { name: '', logo_url: '', brand_color: '#FF5A5F' },
  location: { name: '', address: '', phone: '', email: '', opening_hours: {} },
  tables: [],
  shifts: [],
  policy: {},
  billing: {},
});

const canProceed = (step: number) => {
  switch (step) {
    case 1: return data.tenant.name.length > 0;
    case 2: return data.location.name && data.location.address;
    case 3: return data.tables.length > 0 && data.shifts.length > 0;
    case 4: return true; // Policy optional
    case 5: return true; // Stripe Connect optional
    case 6: return data.billing.stripe_subscription_id; // REQUIRED
    case 7: return true;
    default: return false;
  }
};
```

**Progress Indicator:**
```tsx
<div className="flex items-center justify-between mb-8">
  {[1, 2, 3, 4, 5, 6, 7].map(s => (
    <div key={s} className="flex items-center">
      <div
        className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center",
          s < step && "bg-success text-white",
          s === step && "bg-accent text-white",
          s > step && "bg-muted text-muted-foreground"
        )}
      >
        {s < step ? <CheckIcon /> : s}
      </div>
      {s < 7 && <div className="w-12 h-0.5 bg-muted" />}
    </div>
  ))}
</div>
```

**Step 6: Subscription (Critical)**
```tsx
<div className="space-y-6">
  <h2>Kies je abonnement</h2>
  
  <div className="grid grid-cols-3 gap-4">
    {Object.values(BILLING_TIERS).map(tier => (
      <Card
        key={tier.name}
        className={cn(
          "p-6 cursor-pointer transition-all",
          selectedPlan === tier.name && "ring-2 ring-accent"
        )}
        onClick={() => setSelectedPlan(tier.name)}
      >
        <h3 className="text-xl font-bold">{tier.name}</h3>
        <div className="text-3xl font-bold my-4">
          €{tier.price}<span className="text-sm text-muted-foreground">/maand</span>
        </div>
        <ul className="space-y-2">
          {tier.features.map(feature => (
            <li key={feature} className="flex items-start">
              <CheckIcon className="text-success mr-2 shrink-0" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </Card>
    ))}
  </div>
  
  <Alert variant="warning">
    Je kunt pas publiceren nadat je betaling is voltooid. Je eerste 14 dagen zijn gratis.
  </Alert>
  
  <Button
    size="lg"
    className="w-full"
    onClick={handleCheckout}
    disabled={!selectedPlan}
  >
    Doorgaan naar betaling
  </Button>
</div>
```

---

## 9. Billing & Subscription

### Stripe Setup

**Products:**
```bash
# Create products
stripe products create \
  --name="R4Y Start" \
  --description="1 locatie, 200 boekingen/maand"

stripe products create \
  --name="R4Y Pro" \
  --description="3 locaties, 1.000 boekingen/maand, aanbetalingen"

stripe products create \
  --name="R4Y Plus" \
  --description="Onbeperkte locaties en boekingen, POS integratie"

# Create prices (recurring monthly)
stripe prices create \
  --product=prod_XXX \
  --unit-amount=4900 \
  --currency=eur \
  --recurring-interval=month

# Similar for Pro (€99) and Plus (€199)
```

### Checkout Flow

```typescript
// API: /api/stripe/checkout
export async function POST(req: Request) {
  const { plan, tenant_id } = await req.json();
  
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card', 'ideal'],
    line_items: [{
      price: PRICE_IDS[plan], // price_XXX
      quantity: 1,
    }],
    subscription_data: {
      trial_period_days: 14,
      metadata: {
        tenant_id,
        plan,
      },
    },
    client_reference_id: tenant_id,
    success_url: `${APP_URL}/manager/onboarding?step=7&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${APP_URL}/manager/onboarding?step=6`,
  });
  
  return Response.json({ url: session.url });
}
```

### Webhook Events

```typescript
// /api/stripe/webhook
switch (event.type) {
  case 'checkout.session.completed':
    // User completed checkout, subscription created
    const session = event.data.object;
    await updateBillingState(session.client_reference_id, {
      stripe_customer_id: session.customer,
      stripe_subscription_id: session.subscription,
      status: 'TRIALING',
      plan: session.metadata.plan,
      trial_end: new Date(session.subscription.trial_end * 1000),
    });
    break;
  
  case 'customer.subscription.updated':
    // Subscription changed (upgrade/downgrade/renew)
    const subscription = event.data.object;
    await updateBillingState(subscription.metadata.tenant_id, {
      status: subscription.status === 'active' ? 'ACTIVE' : 'PAST_DUE',
      current_period_end: new Date(subscription.current_period_end * 1000),
    });
    break;
  
  case 'customer.subscription.deleted':
    // Subscription cancelled
    const sub = event.data.object;
    await updateBillingState(sub.metadata.tenant_id, {
      status: 'CANCELLED',
    });
    // Unpublish all locations
    await unpublishLocations(sub.metadata.tenant_id);
    break;
  
  case 'invoice.payment_succeeded':
    // Payment succeeded, reset monthly quota
    const invoice = event.data.object;
    await resetMonthlyQuota(invoice.subscription_metadata.tenant_id);
    break;
  
  case 'invoice.payment_failed':
    // Payment failed, mark as past due
    const failedInvoice = event.data.object;
    await updateBillingState(failedInvoice.subscription_metadata.tenant_id, {
      status: 'PAST_DUE',
    });
    // Grace period: 3 days before unpublishing
    break;
}
```

### Quota Enforcement

```typescript
// Before creating booking (if manager-initiated)
const billingState = await getBillingState(tenant_id);

if (billingState.bookings_used_this_month >= billingState.max_bookings_per_month) {
  return Response.json(
    {
      error: 'QUOTA_EXCEEDED',
      message: `Je hebt je limiet van ${billingState.max_bookings_per_month} boekingen bereikt. Upgrade je abonnement.`,
      upgrade_url: '/manager/billing',
    },
    { status: 402 } // Payment Required
  );
}

// After successful booking
await incrementBookingCount(tenant_id);
```

---

## 10. Integration: Lightspeed POS

### OAuth Flow

```typescript
// /api/lightspeed/connect
export async function GET(req: Request) {
  const { code, location_id } = new URL(req.url).searchParams;
  
  if (!code) {
    // Redirect to Lightspeed OAuth
    const authUrl = `https://cloud.lightspeedapp.com/oauth/authorize?` +
      `client_id=${LIGHTSPEED_CLIENT_ID}&` +
      `redirect_uri=${APP_URL}/api/lightspeed/connect&` +
      `scope=employee:all&` +
      `state=${location_id}`;
    return Response.redirect(authUrl);
  }
  
  // Exchange code for token
  const tokenResponse = await fetch('https://cloud.lightspeedapp.com/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: LIGHTSPEED_CLIENT_ID,
      client_secret: LIGHTSPEED_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
    }),
  });
  
  const { access_token, refresh_token, expires_in } = await tokenResponse.json();
  
  // Store in database
  await createPOSIntegration({
    location_id,
    vendor: 'LIGHTSPEED',
    access_token, // Encrypt in production!
    refresh_token,
    token_expires_at: new Date(Date.now() + expires_in * 1000),
  });
  
  return Response.redirect('/manager/settings?tab=integrations&success=true');
}
```

### Sync Menu (Read-Only MVP)

```typescript
// /api/lightspeed/sync
export async function POST(req: Request) {
  const { location_id } = await req.json();
  
  const integration = await getPOSIntegration(location_id, 'LIGHTSPEED');
  if (!integration) {
    return Response.json({ error: 'Not connected' }, { status: 400 });
  }
  
  // Fetch menu from Lightspeed
  const menu = await fetch(
    `https://api.lightspeedapp.com/API/Account/${integration.external_location_id}/Item.json`,
    {
      headers: { Authorization: `Bearer ${integration.access_token}` },
    }
  );
  
  const items = await menu.json();
  
  // Store in location metadata (for now, no separate menu table)
  await updateLocation(location_id, {
    menu: items.Item.map(item => ({
      name: item.description,
      price: parseFloat(item.Prices.ItemPrice[0].amount),
      category: item.Category?.name,
    })),
  });
  
  await updatePOSIntegration(integration.id, {
    last_sync_at: new Date(),
    last_sync_status: 'SUCCESS',
  });
  
  return Response.json({ success: true, items_synced: items.Item.length });
}
```

### Webhook (Stub for MVP)

```typescript
// /api/lightspeed/webhook
export async function POST(req: Request) {
  const signature = req.headers.get('X-Lightspeed-Signature');
  
  // Verify signature (production)
  // ...
  
  const event = await req.json();
  
  console.log('Lightspeed webhook received:', event.type);
  
  // MVP: Just log, no action
  // Post-MVP: Update table status, menu items, etc.
  
  return Response.json({ received: true });
}
```

---

## 11. Acceptance Criteria

### Consumer Flow

**AC-C1: Discovery**
- [ ] User lands on / (home) and sees "Vanavond beschikbaar" carousel
- [ ] User can tap "Bij mij in de buurt" and grant location permission
- [ ] Nearby restaurants appear in < 2 seconds
- [ ] User can navigate to /discover and see full list
- [ ] Filters work (cuisine, price, open now)
- [ ] Map view shows restaurant pins

**AC-C2: Booking (Happy Path)**
- [ ] User taps restaurant card → Goes to /p/[slug]
- [ ] User taps "Reserveren" → Bottom sheet opens
- [ ] Step 1: User selects 4 persons → "Volgende" enabled
- [ ] Step 2: User selects tomorrow + 19:00 → "Volgende" enabled
- [ ] Step 3: User fills name, phone, email → "Bevestigen" enabled
- [ ] User submits → Booking created, confirmation shown
- [ ] Booking appears in /profile → "Mijn reserveringen"

**AC-C3: Booking (Guest Flow)**
- [ ] User NOT logged in
- [ ] User fills booking form
- [ ] SMS verification code sent to phone
- [ ] User enters code → Booking confirmed
- [ ] User can access booking via link (no login required)

**AC-C4: Booking (Deposit)**
- [ ] Location requires deposit for parties ≥ 6
- [ ] User books for 8 people
- [ ] After step 3, redirect to Stripe Payment Intent
- [ ] User pays €20 deposit
- [ ] Booking status = CONFIRMED
- [ ] Deposit shown in booking details

**AC-C5: Error Handling**
- [ ] No availability for selected time → Show "Geen beschikbaarheid" + suggestions
- [ ] User tries to book < 24h before and policy disallows → Error message
- [ ] Network error during submission → Toast + retry button
- [ ] Slot taken while form open → "Deze tijd is niet meer beschikbaar"

### Manager Flow

**AC-M1: Onboarding (Full)**
- [ ] User goes to /manager → "Nieuw bedrijf starten"
- [ ] User signs up with email + password
- [ ] Step 1: User enters company name "Test Restaurant"
- [ ] Step 2: User enters address, phone, hours → "Volgende" enabled
- [ ] Step 3: User adds 5 tables, creates "Lunch" and "Dinner" shifts
- [ ] Step 4: User sets cancellation policy 24h, no deposit
- [ ] Step 5: User skips Stripe Connect
- [ ] Step 6: User selects "Pro" plan → Redirects to Stripe Checkout
- [ ] User completes payment (test card)
- [ ] Webhook received → billing_state = ACTIVE
- [ ] Step 7: User clicks "Publiceer" → Success, redirects to dashboard

**AC-M2: Onboarding (Billing Gate)**
- [ ] User completes steps 1-5
- [ ] User tries to skip step 6 → "Volgende" disabled
- [ ] User completes step 6 but payment fails → Cannot proceed to step 7
- [ ] User tries to publish without active subscription → Error "Actief abonnement vereist"

**AC-M3: Dashboard (Calendar)**
- [ ] User logs in → Sees dashboard
- [ ] Calendar shows today's bookings
- [ ] Each booking shows guest name, party size, time
- [ ] User can drag booking to different time → API updates, calendar refreshes
- [ ] User can click empty slot → Create manual booking form
- [ ] User can click booking → Detail modal with actions (Confirm, Cancel, No-show)

**AC-M4: Quota Enforcement**
- [ ] User on "Start" plan (200 bookings/month)
- [ ] User has 199 bookings this month
- [ ] User creates 1 more booking → Success
- [ ] User tries to create another → Error "Quota bereikt, upgrade vereist"
- [ ] User upgrades to "Pro" → Quota increases to 1000
- [ ] User can create bookings again

**AC-M5: Subscription Management**
- [ ] User goes to /manager/billing
- [ ] User sees current plan, usage (150/200 bookings)
- [ ] User clicks "Wijzig abonnement" → Redirects to Stripe Customer Portal
- [ ] User upgrades from Start to Pro
- [ ] Webhook received → billing_state updated
- [ ] Dashboard shows new quota

### Technical

**AC-T1: No Double-Bookings**
- [ ] Simulate 2 concurrent requests for same table/time
- [ ] Only 1 booking succeeds
- [ ] Other request gets "NO_AVAILABILITY" error
- [ ] No orphaned locks or hanging transactions

**AC-T2: RLS Security**
- [ ] User A cannot see User B's bookings
- [ ] Tenant A manager cannot see Tenant B locations
- [ ] Public user can only see is_public=true locations
- [ ] Service role can access all data (webhooks)

**AC-T3: Performance**
- [ ] Availability check completes in < 500ms (20 tables, 100 bookings)
- [ ] Booking creation completes in < 1s
- [ ] Calendar load completes in < 2s (1 week view, 50 bookings)
- [ ] Home page loads in < 1.5s (10 locations)

**AC-T4: Idempotency**
- [ ] Same idempotency_key sent twice
- [ ] Second request returns existing booking (no duplicate)
- [ ] Works across retries and network failures

---

## 12. Implementation Checklist

### Phase 1: Foundation (Week 1)

**Design Tokens & UI**
- [ ] Update `globals.css` with R4Y color palette
- [ ] Create `lib/design-tokens.ts` with typed color constants
- [ ] Create `/ui-kit` page showcasing all components
- [ ] Add missing components: `Sheet`, `DatePicker`, `Badge`, `Skeleton`, `Toast`
- [ ] Test responsive layout (mobile, tablet, desktop)

**Database**
- [ ] Create migration `20241017_r4y_schema.sql` with all tables
- [ ] Create RLS helper functions
- [ ] Create RLS policies for all tables
- [ ] Test migrations locally with `supabase db push`
- [ ] Create seed data for development
- [ ] Update types: `pnpm db:types`

**Auth Extensions**
- [ ] Add Google OAuth configuration in Supabase dashboard
- [ ] Create `lib/auth/google.ts` for OAuth flow
- [ ] Create SMS verification helper
- [ ] Extend DAL with tenant-scoped helpers
- [ ] Test: User can sign up with Google
- [ ] Test: Guest can verify phone

### Phase 2: Consumer Experience (Week 2)

**Routes & Pages**
- [ ] Implement `/` (Home) with action ribbon and carousel
- [ ] Implement `/discover` with search, filters, list/map toggle
- [ ] Implement `/p/[slug]` with tabs
- [ ] Implement `/favorites` with grid
- [ ] Implement `/profile` with reservations and settings

**Booking Flow**
- [ ] Create `BookingSheet` component (3 steps)
- [ ] Create `DatePicker` component
- [ ] Create `TimeSlotSelector` component
- [ ] Integrate with availability API
- [ ] Handle deposit flow (Stripe Payment Intent)
- [ ] Create confirmation page

**API Endpoints**
- [ ] `POST /api/availability/check` with algorithm
- [ ] `POST /api/bookings/create` with transaction
- [ ] `GET /api/locations/[slug]`
- [ ] `GET /api/locations/nearby` with geo query
- [ ] `GET /api/locations/search` with filters
- [ ] Add Zod validation to all endpoints

**Testing**
- [ ] Test booking creation (happy path)
- [ ] Test concurrent booking (no double-booking)
- [ ] Test deposit flow
- [ ] Test guest flow with SMS
- [ ] Test error handling (no availability, quota exceeded)

### Phase 3: Manager Portal (Week 3)

**Onboarding Wizard**
- [ ] Create `/manager/onboarding` with 7 steps
- [ ] Step 1: Company details form
- [ ] Step 2: Location details form with address autocomplete
- [ ] Step 3: Tables & Shifts builder
- [ ] Step 4: Policy configuration
- [ ] Step 5: Stripe Connect (optional)
- [ ] Step 6: Subscription checkout (REQUIRED)
- [ ] Step 7: Preview & Publish
- [ ] Persist wizard state (localStorage or DB)

**Dashboard**
- [ ] Create `/manager/dashboard` layout with sidebar
- [ ] Implement calendar (day/week view)
- [ ] Implement reservations list with filters
- [ ] Create booking detail modal
- [ ] Add drag-and-drop for bookings
- [ ] Add "Create manual booking" form

**API Endpoints**
- [ ] `POST /api/manager/locations/publish` with validation
- [ ] `GET /api/manager/calendar` with date range
- [ ] `PUT /api/manager/bookings/[id]` for updates
- [ ] `POST /api/manager/bookings/confirm`
- [ ] `POST /api/manager/bookings/cancel`

**Testing**
- [ ] Test full onboarding flow
- [ ] Test billing gate (cannot publish without subscription)
- [ ] Test calendar interactions
- [ ] Test manual booking creation
- [ ] Test quota enforcement

### Phase 4: Billing & Integrations (Week 4)

**Stripe Subscription**
- [ ] Create Stripe products and prices
- [ ] Update `POST /api/stripe/checkout` for subscriptions
- [ ] Extend webhook handler for subscription events
- [ ] Implement quota reset on invoice.payment_succeeded
- [ ] Create Customer Portal integration
- [ ] Test subscription lifecycle (create, upgrade, cancel)

**Lightspeed POS (Stub)**
- [ ] Create `POST /api/lightspeed/connect` OAuth flow
- [ ] Create `POST /api/lightspeed/sync` menu sync
- [ ] Create `POST /api/lightspeed/webhook` handler (stub)
- [ ] Add POS settings UI in `/manager/settings`
- [ ] Test OAuth flow (sandbox)

**Polish**
- [ ] Add loading states to all async actions
- [ ] Add error boundaries
- [ ] Add offline detection banner
- [ ] Add toast notifications system
- [ ] Add form validation with Zod
- [ ] Improve accessibility (ARIA labels, keyboard nav)
- [ ] Optimize images (next/image)

**QA**
- [ ] Run through all acceptance criteria
- [ ] Test error paths (network failures, validation errors)
- [ ] Test edge cases (expired subscription, quota limits)
- [ ] Performance testing (Lighthouse, Web Vitals)
- [ ] Security audit (RLS, auth flows)
- [ ] Browser testing (Chrome, Safari, Firefox)

### Phase 5: Deployment

**Environment**
- [ ] Create `.env.example` from `.env.local`
- [ ] Document all environment variables
- [ ] Update `README.md` with setup instructions
- [ ] Create deployment guide for Vercel

**Production Prep**
- [ ] Set up production Supabase project
- [ ] Run migrations on production DB
- [ ] Configure Stripe webhooks for production
- [ ] Set up Google OAuth production credentials
- [ ] Configure Lightspeed OAuth (if applicable)
- [ ] Test end-to-end on staging

**Launch**
- [ ] Deploy to Vercel
- [ ] Verify all environment variables
- [ ] Test critical paths (booking, onboarding, payment)
- [ ] Monitor error logs
- [ ] Set up basic analytics

---

## Appendix A: Glossary

- **Tenant:** An organization (restaurant group) that can have multiple locations
- **Location:** A physical restaurant with address, tables, shifts
- **Consumer:** A diner who books tables (may have account or be guest)
- **Manager:** Restaurant owner/manager who manages bookings and settings
- **Shift:** A service period (e.g., "Lunch", "Dinner")
- **Table:** A physical table with seat count
- **Booking:** A reservation for a specific time and party size
- **Policy:** Rules for cancellation, deposits, no-shows
- **Quota:** Monthly booking limit based on billing tier
- **RLS:** Row Level Security (database-level access control)
- **DAL:** Data Access Layer (centralized auth checks)
- **POS:** Point of Sale system (e.g., Lightspeed)

---

## Appendix B: Out of Scope

The following features are intentionally excluded from MVP to maintain focus and ship quickly:

1. **Email/SMS Notifications** → Use manual confirmation for MVP
2. **CRM Features** → Customer notes and history can be manual
3. **Analytics Dashboard** → Basic counts only, no charts
4. **Review/Rating System** → Third-party integrations (Google, TripAdvisor)
5. **Photo Galleries** → Single hero image only
6. **Special Offers/Promotions** → Standard pricing only
7. **Waitlist Management** → Placeholder only, no automated SMS
8. **Multi-Language UI** → NL only, infrastructure ready for i18n
9. **Mobile Apps** → Responsive web app only
10. **Advanced POS Features** → Read-only menu sync, no table status write-back
11. **Revenue/Payout Tracking** → Stripe dashboard only
12. **Team Chat** → External tools (Slack, WhatsApp)
13. **Customer Loyalty Programs** → Post-MVP
14. **Dietary/Allergen Filters** → Basic notes field only
15. **Event Bookings** → Regular bookings only, no special events

---

**Document Status:** ✅ Complete and Ready for Implementation  
**Next Step:** Begin Phase 1 - Design Tokens & Database Migrations  
**Estimated Timeline:** 4 weeks to production-ready MVP

