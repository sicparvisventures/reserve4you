# Technical Implementation Guide - Multi-Sector Expansion

**Voor**: Engineering Team  
**Datum**: 28 Oktober 2025  
**Status**: Implementation Ready

---

## 🎯 OVERVIEW

Dit document beschrijft de exacte technische stappen om Reserve4You sector-agnostic te maken zonder bestaande functionaliteit te breken.

**Principe**: Configuration over Customization

---

## 📦 PHASE 1: DATABASE SCHEMA CHANGES

### Step 1.1: Create New ENUMs

```sql
-- File: supabase/migrations/20251028000001_multi_sector_enums.sql

-- Business sectors ENUM
CREATE TYPE business_sector AS ENUM (
  'RESTAURANT',
  'CAFE', 
  'BAR',
  'BEAUTY_SALON',
  'HAIR_SALON',
  'NAIL_STUDIO',
  'SPA',
  'MASSAGE_THERAPY',
  'MEDICAL_PRACTICE',
  'DENTIST',
  'PHYSIOTHERAPY',
  'PSYCHOLOGY',
  'VETERINARY',
  'GYM',
  'YOGA_STUDIO',
  'PERSONAL_TRAINING',
  'LEGAL',
  'ACCOUNTING',
  'CONSULTING',
  'CAR_REPAIR',
  'CAR_WASH',
  'EVENT_VENUE',
  'HOTEL',
  'COWORKING_SPACE',
  'OTHER'
);

-- Resource types ENUM
CREATE TYPE resource_type AS ENUM (
  'TABLE',
  'ROOM',
  'STAFF',
  'EQUIPMENT',
  'VEHICLE',
  'SPACE'
);
```

### Step 1.2: Extend Locations Table

```sql
-- File: supabase/migrations/20251028000002_extend_locations_for_sectors.sql

-- Add sector fields to locations
ALTER TABLE locations 
  ADD COLUMN IF NOT EXISTS business_sector business_sector DEFAULT 'RESTAURANT',
  ADD COLUMN IF NOT EXISTS sector_config JSONB DEFAULT '{}';

-- Add index for sector-based queries
CREATE INDEX IF NOT EXISTS idx_locations_business_sector 
  ON locations(business_sector) 
  WHERE is_public = true;

-- Backfill existing restaurants
UPDATE locations 
SET 
  business_sector = 'RESTAURANT',
  sector_config = '{
    "terminology": {
      "booking": "Reservering",
      "resource": "Tafel",
      "customer": "Gast",
      "staff": "Personeel"
    },
    "features": {
      "requires_staff_assignment": false,
      "has_service_menu": true,
      "allows_recurring_bookings": false,
      "duration_type": "flexible"
    }
  }'::jsonb
WHERE business_sector IS NULL OR business_sector = 'RESTAURANT';
```

### Step 1.3: Create Resources Table (Generic Tables)

```sql
-- File: supabase/migrations/20251028000003_create_resources_table.sql

CREATE TABLE IF NOT EXISTS resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  resource_type resource_type NOT NULL DEFAULT 'TABLE',
  name VARCHAR(100) NOT NULL,
  capacity INT DEFAULT 1 CHECK (capacity > 0),
  metadata JSONB DEFAULT '{}',
  
  -- For staff: specializations, bio, photo_url
  -- For rooms: equipment, dimensions
  -- For vehicles: license_plate, brand, model
  -- For equipment: specifications
  
  is_active BOOLEAN DEFAULT true,
  display_order INT DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT resources_location_name_key UNIQUE(location_id, name)
);

-- Indexes
CREATE INDEX idx_resources_location_active 
  ON resources(location_id, is_active);
  
CREATE INDEX idx_resources_type 
  ON resources(resource_type);

-- RLS Policies
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view resources"
  ON resources FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Tenant members can manage resources"
  ON resources FOR ALL
  TO authenticated
  USING (
    location_id IN (
      SELECT l.id FROM locations l
      JOIN tenants t ON t.id = l.tenant_id
      JOIN memberships m ON m.tenant_id = t.id
      WHERE m.user_id = auth.uid()
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_resources_updated_at
  BEFORE UPDATE ON resources
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### Step 1.4: Create Service Offerings Table

```sql
-- File: supabase/migrations/20251028000004_create_service_offerings.sql

CREATE TABLE IF NOT EXISTS service_offerings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  
  service_type VARCHAR(100) NOT NULL, -- "Haircut", "Massage", "Checkup"
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  duration_minutes INT NOT NULL DEFAULT 60 CHECK (duration_minutes > 0),
  price_cents INT CHECK (price_cents >= 0),
  
  category VARCHAR(100), -- "Hair", "Spa", "Medical"
  
  -- Staff requirements
  requires_specific_staff BOOLEAN DEFAULT false,
  staff_ids UUID[], -- Array of resource IDs (staff)
  
  -- Metadata for sector-specific info
  metadata JSONB DEFAULT '{}',
  -- Examples:
  -- {"preparation_required": true, "requires_equipment": ["massage_table"]}
  
  is_available BOOLEAN DEFAULT true,
  display_order INT DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_service_offerings_location 
  ON service_offerings(location_id, is_available);
  
CREATE INDEX idx_service_offerings_category 
  ON service_offerings(category);

-- RLS
ALTER TABLE service_offerings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view available services"
  ON service_offerings FOR SELECT
  TO authenticated, anon
  USING (is_available = true);

CREATE POLICY "Tenant members can manage services"
  ON service_offerings FOR ALL
  TO authenticated
  USING (
    location_id IN (
      SELECT l.id FROM locations l
      JOIN tenants t ON t.id = l.tenant_id
      JOIN memberships m ON m.tenant_id = t.id
      WHERE m.user_id = auth.uid()
    )
  );
```

### Step 1.5: Extend Bookings for Service-Based Booking

```sql
-- File: supabase/migrations/20251028000005_extend_bookings_for_services.sql

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS service_offering_id UUID REFERENCES service_offerings(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS assigned_staff_id UUID REFERENCES resources(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS recurring_pattern_id UUID; -- Will create table later

-- Index for staff assignment queries
CREATE INDEX IF NOT EXISTS idx_bookings_assigned_staff 
  ON bookings(assigned_staff_id, start_time)
  WHERE assigned_staff_id IS NOT NULL;

-- Index for service queries
CREATE INDEX IF NOT EXISTS idx_bookings_service 
  ON bookings(service_offering_id);

COMMENT ON COLUMN bookings.service_offering_id IS 'The specific service being booked (haircut, massage, consultation, etc)';
COMMENT ON COLUMN bookings.assigned_staff_id IS 'The specific staff member assigned to this booking (hairdresser, doctor, trainer)';
```

### Step 1.6: Create Recurring Bookings Tables

```sql
-- File: supabase/migrations/20251028000006_recurring_bookings.sql

CREATE TABLE IF NOT EXISTS recurring_booking_patterns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  consumer_id UUID REFERENCES consumers(id) ON DELETE CASCADE,
  service_offering_id UUID REFERENCES service_offerings(id) ON DELETE SET NULL,
  assigned_staff_id UUID REFERENCES resources(id) ON DELETE SET NULL,
  
  -- Pattern details
  pattern_type VARCHAR(20) NOT NULL CHECK (pattern_type IN ('DAILY', 'WEEKLY', 'BI_WEEKLY', 'MONTHLY')),
  interval INT DEFAULT 1 CHECK (interval > 0),
  days_of_week INT[], -- [1,3,5] for Mon/Wed/Fri (1=Monday, 7=Sunday)
  
  -- Booking template
  party_size INT NOT NULL DEFAULT 1,
  duration_minutes INT NOT NULL,
  preferred_time TIME NOT NULL,
  
  -- End conditions (one must be set)
  total_occurrences INT CHECK (total_occurrences IS NULL OR total_occurrences > 0),
  end_date DATE CHECK (end_date IS NULL OR end_date > CURRENT_DATE),
  
  -- Guest info (copied from first booking)
  guest_name VARCHAR(255) NOT NULL,
  guest_phone VARCHAR(20),
  guest_email VARCHAR(255),
  guest_note TEXT,
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CHECK (total_occurrences IS NOT NULL OR end_date IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS recurring_booking_instances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pattern_id UUID NOT NULL REFERENCES recurring_booking_patterns(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NOT NULL,
  
  was_created BOOLEAN DEFAULT false,
  was_modified BOOLEAN DEFAULT false, -- User changed this instance
  was_cancelled BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(pattern_id, scheduled_date)
);

-- Indexes
CREATE INDEX idx_recurring_patterns_active 
  ON recurring_booking_patterns(location_id, is_active);
  
CREATE INDEX idx_recurring_instances_schedule 
  ON recurring_booking_instances(scheduled_date, was_created)
  WHERE was_created = false;

-- RLS
ALTER TABLE recurring_booking_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_booking_instances ENABLE ROW LEVEL SECURITY;

-- Policies similar to bookings table
```

### Step 1.7: Create Intake Forms Tables

```sql
-- File: supabase/migrations/20251028000007_intake_forms.sql

CREATE TABLE IF NOT EXISTS intake_forms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Questions is a JSONB array of question objects
  -- Each question: {id, type, text, required, options, validation}
  questions JSONB NOT NULL DEFAULT '[]',
  
  is_required BOOLEAN DEFAULT false, -- Must fill before booking
  applies_to_services UUID[], -- Specific service IDs, or NULL for all
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS intake_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  form_id UUID NOT NULL REFERENCES intake_forms(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  consumer_id UUID REFERENCES consumers(id) ON DELETE SET NULL,
  
  -- Responses is JSONB: {question_id: answer}
  responses JSONB NOT NULL DEFAULT '{}',
  
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(form_id, booking_id)
);

-- Indexes
CREATE INDEX idx_intake_forms_location 
  ON intake_forms(location_id);
  
CREATE INDEX idx_intake_responses_booking 
  ON intake_responses(booking_id);

-- RLS
ALTER TABLE intake_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE intake_responses ENABLE ROW LEVEL SECURITY;
```

---

## 🎨 PHASE 2: FRONTEND TERMINOLOGY SYSTEM

### Step 2.1: Create Terminology Types

```typescript
// lib/types/terminology.ts

export type BusinessSector = 
  | 'RESTAURANT'
  | 'CAFE'
  | 'BAR'
  | 'BEAUTY_SALON'
  | 'HAIR_SALON'
  | 'NAIL_STUDIO'
  | 'SPA'
  | 'MASSAGE_THERAPY'
  | 'MEDICAL_PRACTICE'
  | 'DENTIST'
  | 'PHYSIOTHERAPY'
  | 'PSYCHOLOGY'
  | 'VETERINARY'
  | 'GYM'
  | 'YOGA_STUDIO'
  | 'PERSONAL_TRAINING'
  | 'LEGAL'
  | 'ACCOUNTING'
  | 'CONSULTING'
  | 'CAR_REPAIR'
  | 'CAR_WASH'
  | 'EVENT_VENUE'
  | 'HOTEL'
  | 'COWORKING_SPACE'
  | 'OTHER';

export interface TermSet {
  singular: string;
  plural: string;
  verb?: string;
  article?: string; // "de" or "het" for Dutch
}

export interface TerminologySet {
  booking: TermSet;
  resource: TermSet;
  customer: TermSet;
  staff: TermSet;
  service: TermSet;
  location: TermSet;
}
```

### Step 2.2: Build Terminology Map

```typescript
// lib/terminology.ts

import { BusinessSector, TerminologySet } from './types/terminology';

export const TERMINOLOGY_MAP: Record<BusinessSector, TerminologySet> = {
  // HOSPITALITY
  RESTAURANT: {
    booking: { singular: 'Reservering', plural: 'Reserveringen', verb: 'Reserveren', article: 'de' },
    resource: { singular: 'Tafel', plural: 'Tafels', article: 'de' },
    customer: { singular: 'Gast', plural: 'Gasten', article: 'de' },
    staff: { singular: 'Medewerker', plural: 'Personeel', article: 'de' },
    service: { singular: 'Gerecht', plural: 'Menu', article: 'het' },
    location: { singular: 'Restaurant', plural: 'Restaurants', article: 'het' }
  },
  
  CAFE: {
    booking: { singular: 'Reservering', plural: 'Reserveringen', verb: 'Reserveren', article: 'de' },
    resource: { singular: 'Tafel', plural: 'Tafels', article: 'de' },
    customer: { singular: 'Bezoeker', plural: 'Bezoekers', article: 'de' },
    staff: { singular: 'Medewerker', plural: 'Personeel', article: 'de' },
    service: { singular: 'Item', plural: 'Menu', article: 'het' },
    location: { singular: 'Café', plural: "Café's", article: 'het' }
  },
  
  // BEAUTY & WELLNESS
  BEAUTY_SALON: {
    booking: { singular: 'Afspraak', plural: 'Afspraken', verb: 'Boeken', article: 'de' },
    resource: { singular: 'Behandelkamer', plural: 'Behandelkamers', article: 'de' },
    customer: { singular: 'Klant', plural: 'Klanten', article: 'de' },
    staff: { singular: 'Schoonheidsspecialist', plural: 'Specialisten', article: 'de' },
    service: { singular: 'Behandeling', plural: 'Behandelingen', article: 'de' },
    location: { singular: 'Salon', plural: 'Salons', article: 'de' }
  },
  
  HAIR_SALON: {
    booking: { singular: 'Afspraak', plural: 'Afspraken', verb: 'Boeken', article: 'de' },
    resource: { singular: 'Stoel', plural: 'Stoelen', article: 'de' },
    customer: { singular: 'Klant', plural: 'Klanten', article: 'de' },
    staff: { singular: 'Kapper', plural: 'Kappers', article: 'de' },
    service: { singular: 'Behandeling', plural: 'Behandelingen', article: 'de' },
    location: { singular: 'Kapsalon', plural: 'Kapsalons', article: 'de' }
  },
  
  SPA: {
    booking: { singular: 'Afspraak', plural: 'Afspraken', verb: 'Boeken', article: 'de' },
    resource: { singular: 'Behandelruimte', plural: 'Behandelruimtes', article: 'de' },
    customer: { singular: 'Gast', plural: 'Gasten', article: 'de' },
    staff: { singular: 'Therapeut', plural: 'Therapeuten', article: 'de' },
    service: { singular: 'Behandeling', plural: 'Behandelingen', article: 'de' },
    location: { singular: 'Spa', plural: "Spa's", article: 'de' }
  },
  
  MASSAGE_THERAPY: {
    booking: { singular: 'Afspraak', plural: 'Afspraken', verb: 'Boeken', article: 'de' },
    resource: { singular: 'Massageruimte', plural: 'Massageruimtes', article: 'de' },
    customer: { singular: 'Cliënt', plural: 'Cliënten', article: 'de' },
    staff: { singular: 'Masseur', plural: 'Masseurs', article: 'de' },
    service: { singular: 'Massage', plural: 'Massages', article: 'de' },
    location: { singular: 'Praktijk', plural: 'Praktijken', article: 'de' }
  },
  
  // HEALTHCARE
  MEDICAL_PRACTICE: {
    booking: { singular: 'Afspraak', plural: 'Afspraken', verb: 'Plannen', article: 'de' },
    resource: { singular: 'Spreekkamer', plural: 'Spreekkamers', article: 'de' },
    customer: { singular: 'Patiënt', plural: 'Patiënten', article: 'de' },
    staff: { singular: 'Arts', plural: 'Artsen', article: 'de' },
    service: { singular: 'Consultatie', plural: 'Consultaties', article: 'de' },
    location: { singular: 'Praktijk', plural: 'Praktijken', article: 'de' }
  },
  
  DENTIST: {
    booking: { singular: 'Afspraak', plural: 'Afspraken', verb: 'Plannen', article: 'de' },
    resource: { singular: 'Behandelstoel', plural: 'Behandelstoelen', article: 'de' },
    customer: { singular: 'Patiënt', plural: 'Patiënten', article: 'de' },
    staff: { singular: 'Tandarts', plural: 'Tandartsen', article: 'de' },
    service: { singular: 'Behandeling', plural: 'Behandelingen', article: 'de' },
    location: { singular: 'Praktijk', plural: 'Praktijken', article: 'de' }
  },
  
  PHYSIOTHERAPY: {
    booking: { singular: 'Afspraak', plural: 'Afspraken', verb: 'Plannen', article: 'de' },
    resource: { singular: 'Behandelruimte', plural: 'Behandelruimtes', article: 'de' },
    customer: { singular: 'Patiënt', plural: 'Patiënten', article: 'de' },
    staff: { singular: 'Fysiotherapeut', plural: 'Fysiotherapeuten', article: 'de' },
    service: { singular: 'Behandeling', plural: 'Behandelingen', article: 'de' },
    location: { singular: 'Praktijk', plural: 'Praktijken', article: 'de' }
  },
  
  PSYCHOLOGY: {
    booking: { singular: 'Sessie', plural: 'Sessies', verb: 'Plannen', article: 'de' },
    resource: { singular: 'Spreekkamer', plural: 'Spreekkamers', article: 'de' },
    customer: { singular: 'Cliënt', plural: 'Cliënten', article: 'de' },
    staff: { singular: 'Psycholoog', plural: 'Psychologen', article: 'de' },
    service: { singular: 'Sessie', plural: 'Sessies', article: 'de' },
    location: { singular: 'Praktijk', plural: 'Praktijken', article: 'de' }
  },
  
  VETERINARY: {
    booking: { singular: 'Afspraak', plural: 'Afspraken', verb: 'Plannen', article: 'de' },
    resource: { singular: 'Spreekkamer', plural: 'Spreekkamers', article: 'de' },
    customer: { singular: 'Eigenaar', plural: 'Eigenaren', article: 'de' },
    staff: { singular: 'Dierenarts', plural: 'Dierenartsen', article: 'de' },
    service: { singular: 'Behandeling', plural: 'Behandelingen', article: 'de' },
    location: { singular: 'Praktijk', plural: 'Praktijken', article: 'de' }
  },
  
  // FITNESS
  GYM: {
    booking: { singular: 'Sessie', plural: 'Sessies', verb: 'Inschrijven', article: 'de' },
    resource: { singular: 'Ruimte', plural: 'Ruimtes', article: 'de' },
    customer: { singular: 'Lid', plural: 'Leden', article: 'het' },
    staff: { singular: 'Trainer', plural: 'Trainers', article: 'de' },
    service: { singular: 'Training', plural: 'Trainingen', article: 'de' },
    location: { singular: 'Sportschool', plural: 'Sportscholen', article: 'de' }
  },
  
  YOGA_STUDIO: {
    booking: { singular: 'Les', plural: 'Lessen', verb: 'Inschrijven', article: 'de' },
    resource: { singular: 'Studio', plural: "Studio's", article: 'de' },
    customer: { singular: 'Deelnemer', plural: 'Deelnemers', article: 'de' },
    staff: { singular: 'Instructeur', plural: 'Instructeurs', article: 'de' },
    service: { singular: 'Les', plural: 'Lessen', article: 'de' },
    location: { singular: 'Studio', plural: "Studio's", article: 'de' }
  },
  
  PERSONAL_TRAINING: {
    booking: { singular: 'Sessie', plural: 'Sessies', verb: 'Boeken', article: 'de' },
    resource: { singular: 'Ruimte', plural: 'Ruimtes', article: 'de' },
    customer: { singular: 'Cliënt', plural: 'Cliënten', article: 'de' },
    staff: { singular: 'Personal Trainer', plural: 'Personal Trainers', article: 'de' },
    service: { singular: 'Training', plural: 'Trainingen', article: 'de' },
    location: { singular: 'Studio', plural: "Studio's", article: 'de' }
  },
  
  // Add more sectors as needed...
  // (Continue with LEGAL, ACCOUNTING, CAR_REPAIR, etc.)
};

// Helper function to get terminology for a sector
export function getTerminology(sector?: BusinessSector): TerminologySet {
  return TERMINOLOGY_MAP[sector || 'RESTAURANT'];
}
```

### Step 2.3: Create useTerminology Hook

```typescript
// lib/hooks/useTerminology.ts

import { useContext } from 'react';
import { BusinessSector, TerminologySet } from '@/lib/types/terminology';
import { getTerminology } from '@/lib/terminology';

// Context for current location (if available)
import { LocationContext } from '@/lib/contexts/LocationContext';

export function useTerminology(): TerminologySet {
  const { location } = useContext(LocationContext);
  const sector = location?.business_sector as BusinessSector | undefined;
  
  return getTerminology(sector);
}

// Usage in components:
// const terms = useTerminology();
// <Button>{terms.booking.verb}</Button> // "Reserveren" or "Boeken" etc
```

### Step 2.4: Refactor Components to Use Terminology

**Example: BookingButton Component**

```typescript
// components/BookingButton.tsx

import { useTerminology } from '@/lib/hooks/useTerminology';
import { Button } from '@/components/ui/button';

interface BookingButtonProps {
  locationId: string;
  onClick: () => void;
}

export function BookingButton({ locationId, onClick }: BookingButtonProps) {
  const terms = useTerminology();
  
  return (
    <Button onClick={onClick} size="lg">
      {terms.booking.verb} {/* Dynamic: "Reserveren", "Boeken", "Plannen" */}
    </Button>
  );
}
```

**Example: Dashboard Page**

```typescript
// app/manager/[tenantId]/dashboard/page.tsx

import { useTerminology } from '@/lib/hooks/useTerminology';

export default function DashboardPage() {
  const terms = useTerminology();
  
  return (
    <div>
      <h1>{ terms.booking.plural }</h1> {/* "Reserveringen" or "Afspraken" */}
      
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          title={`Vandaag's ${terms.booking.plural}`}
          value={todayCount}
        />
        <StatCard
          title={`Totaal ${terms.customer.plural}`}
          value={customerCount}
        />
      </div>
      
      <BookingsTable terminology={terms} />
    </div>
  );
}
```

---

## 🚧 PHASE 3: ONBOARDING WIZARD UPDATES

### Step 3.1: Add Sector Selector (New Step 0)

```typescript
// app/manager/onboarding/steps/StepSectorSelector.tsx

import { BusinessSector } from '@/lib/types/terminology';

const SECTOR_OPTIONS: {
  value: BusinessSector;
  label: string;
  description: string;
  icon: React.ReactNode;
  comingSoon?: boolean;
}[] = [
  {
    value: 'RESTAURANT',
    label: 'Restaurant',
    description: 'Fine dining, casual dining, café',
    icon: <RestaurantIcon />
  },
  {
    value: 'BEAUTY_SALON',
    label: 'Beauty & Wellness',
    description: 'Schoonheidssalon, spa, massage',
    icon: <SparklesIcon />
  },
  {
    value: 'MEDICAL_PRACTICE',
    label: 'Gezondheidszorg',
    description: 'Huisarts, tandarts, fysio',
    icon: <HeartIcon />,
    comingSoon: true // During beta
  },
  // ... more sectors
];

export function StepSectorSelector({ onSelect }: { onSelect: (sector: BusinessSector) => void }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {SECTOR_OPTIONS.map((option) => (
        <button
          key={option.value}
          onClick={() => !option.comingSoon && onSelect(option.value)}
          disabled={option.comingSoon}
          className={cn(
            "p-6 rounded-xl border-2 hover:border-primary transition",
            option.comingSoon && "opacity-50 cursor-not-allowed"
          )}
        >
          <div className="text-4xl mb-4">{option.icon}</div>
          <h3 className="font-semibold text-lg">{option.label}</h3>
          <p className="text-sm text-muted-foreground">{option.description}</p>
          {option.comingSoon && (
            <span className="mt-2 inline-block text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
              Binnenkort beschikbaar
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
```

### Step 3.2: Dynamic Onboarding Steps

```typescript
// app/manager/onboarding/OnboardingWizard.tsx

import { BusinessSector } from '@/lib/types/terminology';

function getStepsForSector(sector: BusinessSector) {
  const baseSteps = [
    { id: 'sector', title: 'Type Business', component: StepSectorSelector },
    { id: 'company', title: 'Bedrijf', component: StepBedrijf },
    { id: 'location', title: 'Locatie', component: StepLocatie },
  ];
  
  // Sector-specific steps
  if (sector === 'RESTAURANT' || sector === 'CAFE' || sector === 'BAR') {
    baseSteps.push(
      { id: 'tables', title: 'Tafels', component: StepTafels },
      { id: 'menu', title: 'Menu', component: StepMenu },
    );
  } else if (sector === 'BEAUTY_SALON' || sector === 'HAIR_SALON' || sector === 'SPA') {
    baseSteps.push(
      { id: 'staff', title: 'Team', component: StepStaff },
      { id: 'services', title: 'Diensten', component: StepServices },
      { id: 'rooms', title: 'Kamers', component: StepRooms },
    );
  } else if (['MEDICAL_PRACTICE', 'DENTIST', 'PHYSIOTHERAPY'].includes(sector)) {
    baseSteps.push(
      { id: 'staff', title: 'Artsen', component: StepStaff },
      { id: 'services', title: 'Behandelingen', component: StepServices },
      { id: 'rooms', title: 'Spreekkamers', component: StepRooms },
      { id: 'intake', title: 'Intake Formulier', component: StepIntakeForm },
    );
  }
  
  // Universal final steps
  baseSteps.push(
    { id: 'policies', title: 'Beleid', component: StepPolicies },
    { id: 'subscription', title: 'Abonnement', component: StepAbonnement },
    { id: 'preview', title: 'Preview', component: StepPreview },
  );
  
  return baseSteps;
}
```

---

## 🔄 PHASE 4: MIGRATION & BACKWARD COMPATIBILITY

### Step 4.1: Migrate Existing Tables to Resources

```sql
-- File: supabase/migrations/20251028000008_migrate_tables_to_resources.sql

-- Create a function to migrate existing tables
CREATE OR REPLACE FUNCTION migrate_tables_to_resources()
RETURNS void AS $$
BEGIN
  INSERT INTO resources (
    location_id,
    resource_type,
    name,
    capacity,
    metadata,
    is_active,
    created_at,
    updated_at
  )
  SELECT 
    location_id,
    'TABLE'::resource_type,
    name,
    seats,
    jsonb_build_object(
      'min_seats', min_seats,
      'max_seats', max_seats,
      'is_combinable', is_combinable,
      'group_id', group_id,
      'position_x', position_x,
      'position_y', position_y
    ),
    is_active,
    created_at,
    updated_at
  FROM tables
  WHERE NOT EXISTS (
    SELECT 1 FROM resources r 
    WHERE r.location_id = tables.location_id 
    AND r.name = tables.name
  );
END;
$$ LANGUAGE plpgsql;

-- Run migration (can be run multiple times, idempotent)
SELECT migrate_tables_to_resources();

-- Keep tables table for backward compatibility (don't drop it yet)
-- Components can query either table or resources depending on sector
```

### Step 4.2: Compatibility Layer

```typescript
// lib/db/compatibility.ts

import { createClient } from '@/lib/supabase/server';
import { BusinessSector } from '@/lib/types/terminology';

/**
 * Fetches "resources" for a location, abstracting away tables vs resources
 */
export async function getLocationResources(locationId: string) {
  const supabase = createClient();
  
  // Check location's business sector
  const { data: location } = await supabase
    .from('locations')
    .select('business_sector')
    .eq('id', locationId)
    .single();
  
  const isRestaurant = ['RESTAURANT', 'CAFE', 'BAR'].includes(location?.business_sector);
  
  if (isRestaurant) {
    // For backward compatibility, query tables table
    const { data: tables } = await supabase
      .from('tables')
      .select('*')
      .eq('location_id', locationId)
      .eq('is_active', true);
    
    // Transform to generic resource format
    return tables?.map(t => ({
      id: t.id,
      type: 'TABLE',
      name: t.name,
      capacity: t.seats,
      metadata: {
        min_seats: t.min_seats,
        max_seats: t.max_seats,
        is_combinable: t.is_combinable
      }
    })) || [];
  } else {
    // Query new resources table
    const { data: resources } = await supabase
      .from('resources')
      .select('*')
      .eq('location_id', locationId)
      .eq('is_active', true);
    
    return resources || [];
  }
}
```

---

## ✅ TESTING CHECKLIST

### Unit Tests

- [ ] Terminology mapping returns correct terms for each sector
- [ ] useTerminology hook works with and without location context
- [ ] Resource queries handle both tables and resources correctly
- [ ] Migration scripts are idempotent

### Integration Tests

- [ ] Onboarding wizard adapts steps based on selected sector
- [ ] Booking flow works for restaurant (existing)
- [ ] Booking flow works for beauty salon (new)
- [ ] Dashboard terminology updates dynamically

### E2E Tests

- [ ] Restaurant onboarding completes successfully
- [ ] Beauty salon onboarding completes successfully
- [ ] Consumer can book in both sectors
- [ ] Manager dashboard shows correct terminology

---

## 🚀 DEPLOYMENT STRATEGY

### Stage 1: Feature Flag (Week 1-2)

```typescript
// lib/featureFlags.ts

export const FEATURE_FLAGS = {
  MULTI_SECTOR_ENABLED: process.env.NEXT_PUBLIC_MULTI_SECTOR === 'true',
  ENABLED_SECTORS: (process.env.NEXT_PUBLIC_ENABLED_SECTORS || 'RESTAURANT').split(',') as BusinessSector[]
};

// In components:
if (FEATURE_FLAGS.MULTI_SECTOR_ENABLED) {
  // Show sector selector
} else {
  // Default to restaurant
}
```

### Stage 2: Beta Testing (Week 3-4)

- Deploy to staging with multi-sector enabled
- Invite 5-10 beta locations per new sector
- Collect feedback
- Fix bugs

### Stage 3: Gradual Rollout (Week 5-6)

- Deploy to production with feature flag
- Enable for new signups only
- Monitor metrics
- Iterate

### Stage 4: Full Launch (Week 7+)

- Enable for all users
- Marketing campaign per sector
- Remove feature flags

---

## 📊 MONITORING & METRICS

### Technical Metrics

- [ ] Database query performance (p95 < 100ms)
- [ ] Page load time (p95 < 2s)
- [ ] Error rate (<0.1%)
- [ ] API response time (p95 < 500ms)

### Product Metrics

- [ ] Onboarding completion rate per sector
- [ ] Booking success rate per sector
- [ ] Feature adoption (staff assignment, service menu, etc.)
- [ ] User satisfaction (NPS) per sector

### Business Metrics

- [ ] New signups per sector
- [ ] MRR per sector
- [ ] Churn rate per sector
- [ ] Average booking value per sector

---

## 🎉 SUCCESS CRITERIA

**Phase 1 (Foundation) is successful if**:
- ✅ Zero breaking bugs in production
- ✅ 3 sectors working (Restaurant, Beauty, Medical)
- ✅ 10+ beta locations using new sectors
- ✅ Positive feedback from beta testers

**Launch is successful if**:
- ✅ 25+ paying locations in new sectors within 3 months
- ✅ Churn rate < 5%
- ✅ NPS > 50
- ✅ No major bugs reported
- ✅ Team can add new sector in < 1 week

---

**Document Owner**: Engineering Team Lead  
**Last Updated**: 28 Oktober 2025  
**Status**: READY TO IMPLEMENT


