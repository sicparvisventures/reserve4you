# Reserve4You - Product Requirements Document
## Multi-Sector Expansion: From Horeca to Universal Booking Platform

**Versie**: 3.0  
**Datum**: 28 Oktober 2025  
**Status**: Strategic Roadmap Document  
**Auteur**: Product & Strategy Team  

---

## 📋 EXECUTIVE SUMMARY

Reserve4You (R4Y) is momenteel een professioneel restaurant reserveringsplatform. Dit document beschrijft de strategie en technische roadmap om R4Y te transformeren naar een **universeel booking platform** dat alle sectoren ter wereld kan bedienen, zonder de huidige UI drastisch te wijzigen.

### Huidige Status
- ✅ **Sector**: Horeca (restaurants, cafés, bars)
- ✅ **Technologie**: Next.js 15, TypeScript, Supabase, Stripe
- ✅ **Core Features**: Multi-tenant booking systeem met real-time availability
- ✅ **Markt**: België/Nederland focus
- ✅ **MRR Capacity**: €10K-€50K in jaar 1

### Visie: Reserve4You Universal
- 🎯 **Doelstelling**: Het #1 commissievrije booking platform voor alle appointment-based bedrijven
- 🌍 **Scope**: 15+ sectoren, 50+ landen, 10+ talen
- 💰 **Revenue Target**: €1M+ MRR binnen 3 jaar
- 🚀 **USP**: Sector-agnostisch platform met sector-specifieke aanpassingen via configuratie

---

## 🎯 WAAROM MULTI-SECTOR?

### Business Rationale

**1. Markt Opportunity**
- **Horeca**: €2B markt, maar veel competitie (Zenchef, OpenTable, TheFork)
- **Wellness**: €3.5B markt, minder mature tech (veel nog telefoon/excel)
- **Healthcare**: €15B+ markt, massieve behoefte aan digitalisering
- **Services**: €50B+ markt, gefragmenteerd landschap

**Total Addressable Market (TAM)**: €70B+ vs €2B (horeca alleen)

**2. Platform Leverage**
Onze bestaande technologie is 85% herbruikbaar:
- ✅ Multi-tenant architectuur
- ✅ Booking engine met conflict detection
- ✅ Time-slot management
- ✅ Payment processing (deposits, no-shows)
- ✅ CRM & notification systeem
- ✅ Calendar & availability management

**3. Competitive Moat**
- Geen concurrenten met universal approach
- Sector-specific spelers (Booksy voor wellness, Doctolib voor healthcare) zijn verticaal gelocked
- Wij bieden one platform voor bedrijven met multiple service types

### Strategic Advantages

1. **Cross-Sell Opportunities**
   - Restaurant met privé events → Event Planning mode
   - Wellness center met personal trainer → Fitness mode
   - Beauty salon met nagelstudio & spa → Multi-service mode

2. **Data Network Effects**
   - Consumer account works across all sectors
   - Loyalty points spanning multiple businesses
   - Better recommendations engine

3. **Reduced Churn**
   - Bedrijven met multiple sectors blijven langer
   - Higher switching costs
   - Community lock-in

4. **Pricing Power**
   - Premium features per sector
   - Add-ons stackable across sectors
   - Enterprise deals for multi-sector businesses

---

## 🏗️ TECHNISCHE ARCHITECTUUR: SECTOR-AGNOSTIC DESIGN

### Core Principle: Configuration Over Customization

**De huidige database ondersteunt al 90% van wat we nodig hebben.**  
In plaats van nieuwe tabellen, voegen we **metadata en configuratie** toe.

### Schema Uitbreidingen

#### 1. Nieuwe ENUM: Sector Types

```sql
CREATE TYPE business_sector AS ENUM (
  -- Existing
  'RESTAURANT',
  'CAFE',
  'BAR',
  
  -- Wellness & Beauty
  'BEAUTY_SALON',
  'HAIR_SALON',
  'NAIL_STUDIO',
  'SPA',
  'MASSAGE_THERAPY',
  'TANNING_SALON',
  
  -- Healthcare
  'MEDICAL_PRACTICE',
  'DENTIST',
  'PHYSIOTHERAPY',
  'PSYCHOLOGY',
  'VETERINARY',
  
  -- Fitness
  'GYM',
  'YOGA_STUDIO',
  'PERSONAL_TRAINING',
  'DANCE_STUDIO',
  'MARTIAL_ARTS',
  
  -- Professional Services
  'LEGAL',
  'ACCOUNTING',
  'CONSULTING',
  'FINANCIAL_ADVISORY',
  
  -- Education
  'TUTORING',
  'MUSIC_LESSONS',
  'LANGUAGE_SCHOOL',
  'DRIVING_SCHOOL',
  
  -- Automotive
  'CAR_REPAIR',
  'CAR_WASH',
  'CAR_RENTAL',
  
  -- Home Services
  'CLEANING',
  'PLUMBING',
  'ELECTRICIAN',
  'GARDENING',
  
  -- Events & Entertainment
  'EVENT_VENUE',
  'PHOTO_STUDIO',
  'ESCAPE_ROOM',
  'BOWLING',
  
  -- Accommodation
  'HOTEL',
  'VACATION_RENTAL',
  'COWORKING_SPACE',
  'MEETING_ROOM',
  
  -- Other
  'OTHER'
);
```

#### 2. Location Schema Extensie

```sql
ALTER TABLE locations ADD COLUMN IF NOT EXISTS business_sector business_sector DEFAULT 'RESTAURANT';
ALTER TABLE locations ADD COLUMN IF NOT EXISTS sector_config JSONB DEFAULT '{}';
```

**sector_config** bevat sector-specifieke metadata:

```json
{
  "terminology": {
    "booking": "Appointment",      // "Reservering" → "Afspraak" voor doctors
    "table": "Treatment Room",     // "Tafel" → "Behandelkamer" 
    "shift": "Opening Hours",      // "Dienst" → "Openingstijden"
    "guest": "Patient"             // "Gast" → "Patiënt"
  },
  "features": {
    "requires_staff_assignment": true,   // Voor healthcare: assign doctor
    "allows_recurring_bookings": true,   // Voor therapie: wekelijkse sessies
    "requires_intake_form": true,        // Voor healthcare: patient form
    "has_service_menu": true,            // Voor wellness: treatment menu
    "duration_type": "fixed"             // "fixed" of "flexible"
  },
  "booking_rules": {
    "min_booking_lead_hours": 24,        // Minimum advance booking
    "max_booking_lead_days": 90,         // Maximum advance booking
    "cancellation_policy_hours": 24,
    "requires_approval": false,
    "allows_waitlist": true
  },
  "display": {
    "show_price_on_cards": true,
    "show_duration": true,
    "show_staff_photos": true,
    "primary_color": "#FF5A5F",
    "icon": "medical-cross"
  }
}
```

#### 3. Services/Treatments Tabel (Replacement voor "Tables")

De `tables` tabel is specifiek voor restaurants. Voor andere sectoren hernoemen we het concept:

```sql
-- NEW: Generic "Resources" table
CREATE TABLE resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  resource_type VARCHAR(50) NOT NULL, -- 'TABLE', 'ROOM', 'STAFF', 'EQUIPMENT', 'VEHICLE'
  name VARCHAR(100) NOT NULL,
  capacity INT DEFAULT 1,
  metadata JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- metadata examples:
-- For tables: {"seats": 4, "position_x": 100, "position_y": 200}
-- For staff: {"specializations": ["haircut", "coloring"], "bio": "..."}
-- For rooms: {"equipment": ["massage_table", "aromatherapy"]}
-- For vehicles: {"license_plate": "ABC-123", "brand": "Toyota"}
```

**Migratiestrategie**:
- Bestaande `tables` blijft bestaan voor backward compatibility
- Nieuwe sectoren gebruiken `resources`
- UI bepaalt welke terminologie te gebruiken op basis van `business_sector`

#### 4. Service Menu (Replacement voor Menu Items)

```sql
CREATE TABLE IF NOT EXISTS service_offerings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  service_type VARCHAR(100) NOT NULL, -- e.g., "Haircut", "Massage", "Consultation"
  name VARCHAR(255) NOT NULL,
  description TEXT,
  duration_minutes INT NOT NULL DEFAULT 60,
  price_cents INT,
  category VARCHAR(100), -- "Hair", "Nails", "Spa", "Medical"
  requires_specific_staff BOOLEAN DEFAULT false,
  staff_ids UUID[], -- Optional: only these staff can perform
  metadata JSONB DEFAULT '{}',
  is_available BOOLEAN DEFAULT true,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 5. Recurring Bookings

```sql
CREATE TABLE recurring_booking_patterns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  pattern_type VARCHAR(20) NOT NULL, -- 'DAILY', 'WEEKLY', 'BI_WEEKLY', 'MONTHLY'
  interval INT DEFAULT 1,
  days_of_week INT[], -- [1,3,5] for Mon/Wed/Fri
  total_occurrences INT,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE recurring_booking_instances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pattern_id UUID REFERENCES recurring_booking_patterns(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  scheduled_date DATE NOT NULL,
  was_created BOOLEAN DEFAULT false,
  was_modified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 6. Intake Forms / Pre-Booking Questionnaires

```sql
CREATE TABLE intake_forms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  questions JSONB NOT NULL, -- Array of question objects
  is_required BOOLEAN DEFAULT false,
  applies_to_sectors VARCHAR(50)[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE intake_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  form_id UUID REFERENCES intake_forms(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  consumer_id UUID REFERENCES consumers(id) ON DELETE SET NULL,
  responses JSONB NOT NULL, -- {question_id: answer}
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🎨 UI/UX STRATEGIE: MINIMALE WIJZIGINGEN

### Principe: Smart Terminology Mapping

De UI **blijft exact hetzelfde**, maar labels veranderen dynamisch op basis van sector.

#### Terminologie Mapping

| UI Element | Restaurant | Beauty Salon | Medical | Fitness | Legal |
|------------|-----------|--------------|---------|---------|-------|
| **Action Button** | "Reserveer Tafel" | "Boek Afspraak" | "Maak Afspraak" | "Boek Sessie" | "Reserveer Consult" |
| **Resource** | "Tafel" | "Behandelkamer" | "Spreekkamer" | "Studio" | "Kantoor" |
| **Time Slot** | "Dienst" | "Beschikbaarheid" | "Openingstijden" | "Klassenrooster" | "Beschikbaarheid" |
| **Customer** | "Gast" | "Klant" | "Patiënt" | "Member" | "Cliënt" |
| **Staff** | "Personeel" | "Specialist" | "Arts" | "Trainer" | "Advocaat" |
| **Booking** | "Reservering" | "Afspraak" | "Afspraak" | "Sessie" | "Consult" |

#### Implementation

```typescript
// lib/terminology.ts
export const TERMINOLOGY_MAP: Record<BusinessSector, TerminologySet> = {
  RESTAURANT: {
    booking: { singular: "Reservering", plural: "Reserveringen", verb: "Reserveren" },
    resource: { singular: "Tafel", plural: "Tafels" },
    customer: { singular: "Gast", plural: "Gasten" },
    staff: { singular: "Medewerker", plural: "Personeel" }
  },
  BEAUTY_SALON: {
    booking: { singular: "Afspraak", plural: "Afspraken", verb: "Boeken" },
    resource: { singular: "Behandelkamer", plural: "Behandelkamers" },
    customer: { singular: "Klant", plural: "Klanten" },
    staff: { singular: "Specialist", plural: "Specialisten" }
  },
  MEDICAL_PRACTICE: {
    booking: { singular: "Afspraak", plural: "Afspraken", verb: "Plannen" },
    resource: { singular: "Spreekkamer", plural: "Spreekkamers" },
    customer: { singular: "Patiënt", plural: "Patiënten" },
    staff: { singular: "Arts", plural: "Artsen" }
  },
  // ... etc for all sectors
};

// Hook to use in components
export function useTerminology() {
  const { location } = useCurrentLocation();
  const sector = location?.business_sector || 'RESTAURANT';
  return TERMINOLOGY_MAP[sector];
}
```

**Component Usage:**
```tsx
function BookingButton() {
  const terms = useTerminology();
  return <Button>{terms.booking.verb}</Button>; // "Reserveren" or "Boeken" etc
}
```

### UI Componenten: Conditional Rendering

Sommige UI elementen zijn sector-specifiek:

```tsx
function LocationDetailPage() {
  const { location } = useLocation();
  const isRestaurant = location.business_sector === 'RESTAURANT';
  const isHealthcare = ['MEDICAL_PRACTICE', 'DENTIST', 'PHYSIOTHERAPY'].includes(location.business_sector);
  
  return (
    <>
      {/* Always show */}
      <HeroSection />
      <AboutSection />
      <BookingSection />
      
      {/* Conditional sections */}
      {isRestaurant && <MenuSection />}
      {isRestaurant && <CuisineTagsSection />}
      
      {location.sector_config.features.has_service_menu && <ServiceMenuSection />}
      {location.sector_config.features.requires_staff_assignment && <StaffSelectionSection />}
      {isHealthcare && <InsuranceInfoSection />}
      
      <ReviewsSection />
      <ContactSection />
    </>
  );
}
```

### Discovery Page Aanpassingen

**Filter Bar**: Dynamische filters op basis van actieve sectoren

```tsx
<Filters>
  <SectorFilter options={['All', 'Restaurants', 'Beauty', 'Healthcare', 'Fitness']} />
  
  {selectedSector === 'RESTAURANT' && (
    <>
      <CuisineFilter />
      <PriceRangeFilter />
    </>
  )}
  
  {selectedSector === 'BEAUTY_SALON' && (
    <>
      <ServiceTypeFilter options={['Hair', 'Nails', 'Spa', 'Massage']} />
      <PriceRangeFilter />
    </>
  )}
  
  {selectedSector === 'MEDICAL_PRACTICE' && (
    <>
      <SpecializationFilter />
      <InsuranceFilter />
    </>
  )}
  
  {/* Universal filters */}
  <LocationFilter />
  <AvailabilityFilter />
  <RatingFilter />
</Filters>
```

---

## 📊 SECTOR-SPECIFIEKE CONFIGURATIES

### Sector 1: Beauty & Wellness

**Bedrijven**: Kappers, Nagelstudio's, Spa's, Massage, Schoonheidsspecialisten

**Key Differences from Horeca**:
- ✅ Afspraken met specifieke medewerkers (hairstylist, masseuse)
- ✅ Service menu (treatments) i.p.v. food menu
- ✅ Fixed duration per service (30min haircut, 60min massage)
- ✅ Recurring appointments (maandelijkse knippen)
- ✅ Product sales tijdens afspraak
- ✅ Tipping culture

**Database Config**:
```json
{
  "business_sector": "BEAUTY_SALON",
  "features": {
    "requires_staff_assignment": true,
    "has_service_menu": true,
    "allows_recurring_bookings": true,
    "duration_type": "fixed",
    "supports_product_sales": true
  },
  "terminology": {
    "booking": "Afspraak",
    "resource": "Behandelkamer",
    "staff": "Specialist"
  }
}
```

**New Features Needed**:
- [ ] Staff scheduling & availability per staff member
- [ ] Service duration management
- [ ] Recurring booking UI
- [ ] Product add-ons to bookings
- [ ] Staff commissions tracking

### Sector 2: Healthcare

**Bedrijven**: Huisartsen, Tandartsen, Fysiotherapie, Psychologen, Dierenartsen

**Key Differences**:
- ✅ Strikte GDPR/privacy requirements
- ✅ Patient intake forms
- ✅ Insurance information
- ✅ Medical history tracking
- ✅ Prescription/treatment notes
- ✅ Recurring treatments (physio series)
- ✅ Emergency appointments

**Database Config**:
```json
{
  "business_sector": "MEDICAL_PRACTICE",
  "features": {
    "requires_staff_assignment": true,
    "requires_intake_form": true,
    "has_service_menu": true,
    "allows_recurring_bookings": true,
    "requires_gdpr_compliance": true,
    "supports_emergency_bookings": true
  },
  "terminology": {
    "booking": "Afspraak",
    "customer": "Patiënt",
    "staff": "Arts"
  }
}
```

**New Features Needed**:
- [ ] GDPR-compliant patient records
- [ ] Intake form builder
- [ ] Insurance provider integration
- [ ] Treatment notes/history
- [ ] Emergency booking slot reservations
- [ ] Reminder system (48h before appointment)

### Sector 3: Fitness & Sports

**Bedrijven**: Sportscholen, Yoga studio's, Personal training, Dansscholen

**Key Differences**:
- ✅ Class-based bookings (groepslessen)
- ✅ Membership/subscription model
- ✅ Drop-in vs reserved spots
- ✅ Capacity limits per class
- ✅ Equipment reservations
- ✅ Multi-location passes

**Database Config**:
```json
{
  "business_sector": "YOGA_STUDIO",
  "features": {
    "has_class_bookings": true,
    "requires_membership": true,
    "has_capacity_limits": true,
    "allows_drop_in": true,
    "has_equipment_reservations": true
  },
  "terminology": {
    "booking": "Inschrijving",
    "resource": "Studio",
    "customer": "Member"
  }
}
```

**New Features Needed**:
- [ ] Class schedule management
- [ ] Membership tiers & credits
- [ ] Capacity management (10/15 spots filled)
- [ ] Waitlist for full classes
- [ ] Multi-class packages

### Sector 4: Professional Services

**Bedrijven**: Advocaten, Accountants, Consultants, Financial advisors

**Key Differences**:
- ✅ Video/phone consultations
- ✅ Document sharing before meeting
- ✅ Billing by hour
- ✅ NDA/contracts required
- ✅ Calendar integration (Google/Outlook)

**Database Config**:
```json
{
  "business_sector": "LEGAL",
  "features": {
    "requires_staff_assignment": true,
    "supports_virtual_meetings": true,
    "requires_document_uploads": true,
    "billing_by_hour": true
  }
}
```

**New Features Needed**:
- [ ] Virtual meeting integration (Zoom/Teams)
- [ ] Document upload system
- [ ] Hourly billing tracker
- [ ] Calendar sync (iCal, Google, Outlook)

### Sector 5: Automotive

**Bedrijven**: Autowasserette, Garage/Reparatie, Autoverhuur

**Key Differences**:
- ✅ Vehicle information required
- ✅ Service checklists
- ✅ Parts/labor tracking
- ✅ Pick-up/drop-off scheduling

**Database Config**:
```json
{
  "business_sector": "CAR_REPAIR",
  "features": {
    "requires_vehicle_info": true,
    "has_service_checklist": true,
    "tracks_parts_labor": true
  }
}
```

### Complete Sector Overview (15+ Sectoren)

| Sector | Complexity | Reusability | New Features Needed | Launch Priority |
|--------|-----------|-------------|---------------------|-----------------|
| **Restaurant** | ✅ Existing | 100% | None | LIVE |
| **Beauty/Wellness** | Medium | 85% | Staff scheduling, Service menu | Q1 2025 |
| **Healthcare** | High | 70% | GDPR, Intake forms, Insurance | Q2 2025 |
| **Fitness** | Medium | 80% | Class bookings, Memberships | Q2 2025 |
| **Professional Services** | Low | 90% | Virtual meetings, Doc sharing | Q1 2025 |
| **Automotive** | Low | 85% | Vehicle info, Service checklist | Q3 2025 |
| **Education** | Medium | 85% | Course management, Homework | Q2 2025 |
| **Home Services** | Low | 90% | Location routing, Job tracking | Q3 2025 |
| **Events** | Medium | 75% | Venue layout, Catering integration | Q3 2025 |
| **Accommodation** | High | 60% | Room management, Pricing calendar | Q4 2025 |

---

## 🚀 IMPLEMENTATION ROADMAP

### Phase 1: Foundation (Q4 2024 - Q1 2025) 🔴 CRITICAL

**Goal**: Maak platform sector-agnostic zonder bestaande functionaliteit te breken

**Tasks**:
1. **Database Schema Upgrade**
   - [ ] Add `business_sector` enum + column to locations
   - [ ] Add `sector_config` JSONB to locations
   - [ ] Create `resources` table
   - [ ] Create `service_offerings` table
   - [ ] Migration script voor bestaande restaurants

2. **Terminology System**
   - [ ] Build `lib/terminology.ts` met alle mappings
   - [ ] Create `useTerminology()` hook
   - [ ] Refactor alle UI components om hook te gebruiken
   - [ ] Test met 3 sectoren (Restaurant, Beauty, Medical)

3. **Onboarding Wizard Update**
   - [ ] Step 0: "Wat voor bedrijf heeft u?" sector selector
   - [ ] Dynamic step labels op basis van sector
   - [ ] Conditional steps (skip "menu" voor non-restaurant)
   - [ ] Sector-specific templates/presets

4. **UI Componentisering**
   - [ ] Extract sector-specific sections to conditional renders
   - [ ] Create `<SectorSpecificContent>` wrapper component
   - [ ] Build fallback components voor unsupported features

**Timeline**: 6-8 weken  
**Resources**: 1 Full-stack dev + 1 Designer  
**Risk**: Medium - breaking changes mogelijk

### Phase 2: Beauty & Wellness Launch (Q1 2025) 🟡

**Goal**: Eerste nieuwe sector live, validate approach

**Tasks**:
1. **Staff Assignment System**
   - [ ] Staff profiles met specializations
   - [ ] Availability calendar per staff
   - [ ] Booking → Staff auto-assignment
   - [ ] Customer staff preferences

2. **Service Menu**
   - [ ] CRUD voor service offerings
   - [ ] Duration management
   - [ ] Pricing per service
   - [ ] Category organization
   - [ ] Public service catalog page

3. **Beauty-Specific Features**
   - [ ] Product add-ons to bookings
   - [ ] Tipping system
   - [ ] Photo gallery voor before/after
   - [ ] Beauty-specific filters (Hair, Nails, Spa, Massage)

4. **Marketing & Launch**
   - [ ] 10 beta salons in Belgium/Netherlands
   - [ ] Case studies
   - [ ] Beauty-focused landing pages
   - [ ] SEO voor "online afspraken kapper", etc.

**Timeline**: 8-10 weken  
**Resources**: 1 Full-stack dev + 1 Designer + 1 Marketer  
**Success Metrics**: 25 beta locations, 500 bookings/month

### Phase 3: Healthcare Launch (Q2 2025) 🟡

**Goal**: Enter high-value healthcare market

**Tasks**:
1. **GDPR Compliance Upgrade**
   - [ ] Encryption for patient data
   - [ ] Audit logging
   - [ ] Data retention policies
   - [ ] Patient consent management
   - [ ] GDPR compliance documentation

2. **Intake Forms System**
   - [ ] Form builder interface
   - [ ] Question types (text, select, checkbox, file upload)
   - [ ] Conditional logic
   - [ ] Response management
   - [ ] Integration with bookings

3. **Healthcare-Specific Features**
   - [ ] Insurance provider database
   - [ ] Treatment history tracking
   - [ ] Prescription notes (doctors only)
   - [ ] Recurring treatment series
   - [ ] Emergency appointment slots

4. **Partnerships**
   - [ ] Medical associations in Belgium/Netherlands
   - [ ] EMR/EHR integration research
   - [ ] Compliance certifications

**Timeline**: 12-14 weken  
**Resources**: 1 Full-stack dev + 1 Security expert + 1 Healthcare consultant  
**Success Metrics**: 15 beta practices, GDPR audit passed

### Phase 4: Fitness & Professional Services (Q2-Q3 2025) 🟢

**Goal**: Expand to 2 more high-opportunity sectors

**Fitness Features**:
- [ ] Class booking system
- [ ] Membership management
- [ ] Capacity limits
- [ ] Waitlist for full classes
- [ ] Multi-class packages

**Professional Services Features**:
- [ ] Virtual meeting integration
- [ ] Document upload/sharing
- [ ] Hourly billing tracker
- [ ] Calendar sync

**Timeline**: 10 weken per sector  
**Success Metrics**: 50 total locations across all sectors

### Phase 5: Scale & Optimize (Q3-Q4 2025) 🟢

**Goal**: Support 10+ sectors, international expansion

**Tasks**:
1. **Multi-Language Support**
   - [ ] i18n setup (next-intl)
   - [ ] 5 languages: NL, EN, FR, DE, ES
   - [ ] Auto-translation for sector terminology
   - [ ] Localized content per country

2. **Sector Templates**
   - [ ] Pre-built setups voor alle 15 sectoren
   - [ ] One-click onboarding per sector
   - [ ] Industry best practices built-in

3. **Advanced Features**
   - [ ] AI-powered scheduling optimization
   - [ ] Dynamic pricing per sector
   - [ ] Marketplace voor cross-sector discovery
   - [ ] API for third-party integrations

4. **International Expansion**
   - [ ] Germany launch
   - [ ] France launch
   - [ ] UK launch
   - [ ] Local payment methods (iDEAL, Bancontact, etc.)

**Timeline**: 16 weken  
**Success Metrics**: 500 locations, 10K bookings/day

---

## 💰 PRICING STRATEGIE: SECTOR-BASED TIERS

### Current Pricing (Restaurant Only)

| Plan | Prijs | Locations | Bookings |
|------|-------|-----------|----------|
| START | €49/mo | 1 | 200/mo |
| PRO | €99/mo | 3 | 1000/mo |
| PLUS | €199/mo | Unlimited | Unlimited |

### New Pricing: Sector-Adjusted

**Rationale**: Different sectors have different willingness-to-pay and booking volumes

| Sector | START | PRO | PLUS | Justification |
|--------|-------|-----|------|---------------|
| **Restaurant** | €49 | €99 | €199 | Baseline (established) |
| **Beauty/Wellness** | €59 | €119 | €249 | Higher booking volume |
| **Healthcare** | €79 | €159 | €349 | Compliance costs, higher value |
| **Fitness** | €69 | €129 | €279 | Class-based = high volume |
| **Professional** | €89 | €169 | €399 | High hourly rates = can afford more |
| **Automotive** | €49 | €99 | €199 | Similar to restaurant |
| **Other Sectors** | €59 | €119 | €249 | Default |

**Add-Ons (Cross-Sector)**:
- Email/SMS bundle: +€19/mo
- Advanced analytics: +€29/mo
- White label: +€99/mo
- API access: +€49/mo
- Priority support: +€39/mo

### Pricing Principle

**Base price = complexity + compliance + typical booking value**

```typescript
function calculatePricing(sector: BusinessSector, plan: BillingPlan) {
  const basePrice = BASELINE_PRICING[plan]; // START: €49, PRO: €99, PLUS: €199
  const sectorMultiplier = SECTOR_MULTIPLIERS[sector]; // 1.0 - 2.0
  const complianceAddon = sector.requiresGDPR ? 20 : 0;
  
  return Math.round(basePrice * sectorMultiplier + complianceAddon);
}
```

---

## 🎯 GO-TO-MARKET STRATEGIE PER SECTOR

### Beauty & Wellness

**Target Customers**:
- Independent hair salons (1-2 chair)
- Nail studios
- Day spas
- Mobile beauticians

**Acquisition Channels**:
- Instagram/TikTok ads (visual sector!)
- Beauty industry events
- Partnership with beauty product suppliers
- Influencer marketing

**Key Messaging**:
- "Stop met no-shows - automatische herinneringen"
- "Dubbel zoveel boekingen met online agenda"
- "Klanten boeken 24/7, jij slaapt rustig"

### Healthcare

**Target Customers**:
- Private practices (1-5 doctors)
- Physio/chiro clinics
- Psychologists
- Alternative medicine (acupuncture, etc.)

**Acquisition Channels**:
- Medical associations/conferences
- LinkedIn targeted ads
- Healthcare publications
- Word-of-mouth (one happy doctor = 10 referrals)

**Key Messaging**:
- "GDPR-compliant patient scheduling"
- "Reduce no-shows by 70%"
- "Spend less time on phone, more on patients"

### Fitness

**Target Customers**:
- Boutique studios (yoga, pilates, spinning)
- Personal trainers
- Martial arts dojos
- Dance schools

**Acquisition Channels**:
- Fitness industry trade shows
- Facebook/Instagram fitness communities
- Partnership with fitness equipment suppliers
- Fitness influencer collaborations

**Key Messaging**:
- "Fill every class automatically"
- "Waitlist management = no empty spots"
- "Members book & pay in 30 seconds"

---

## 🏆 COMPETITIVE ADVANTAGES: FUNCTIES DIE ONS ONDERSCHEIDEN

### Must-Haves (Parity with Competitors) ✅

**Already Have**:
- ✅ Online booking widget
- ✅ Calendar management
- ✅ Availability checks
- ✅ Email confirmations
- ✅ Payment processing
- ✅ Multi-location support
- ✅ Mobile-responsive
- ✅ Basic analytics

**Need to Add**:
- [ ] SMS notifications (Twilio)
- [ ] Recurring bookings
- [ ] Staff scheduling
- [ ] Email marketing campaigns

### Nice-to-Haves (Competitive Advantage) 🌟

**High Priority**:
- [ ] **AI-Powered Smart Scheduling**
  - Suggest optimal appointment times
  - Predict no-shows
  - Auto-rebalance calendar on cancellations
  
- [ ] **Universal Consumer Account**
  - One account voor bookings across all sectors
  - Loyalty points that work everywhere
  - Universal payment methods saved
  
- [ ] **Cross-Sector Recommendations**
  - Booked a restaurant? Get suggestions for nearby spa
  - Going to hairdresser? Recommended nail salons nearby
  - Network effects!

- [ ] **Dynamic Pricing Engine**
  - Off-peak discounts
  - Last-minute deals
  - Surge pricing voor high-demand slots

**Medium Priority**:
- [ ] **Marketplace Mode**
  - Consumers browse all sectors in one app
  - "Things to do today" feed
  - Location-based discovery
  
- [ ] **White Label per Sector**
  - Bedrijf kan eigen branding volledig toepassen
  - Custom domain
  - Removes R4Y branding
  
- [ ] **API-First Architecture**
  - Public API voor third-party integrations
  - Webhooks
  - Zapier integration

### Competitor Edge (Dream Features) 🚀

Features that NO competitor has:

1. **AI Concierge**
   - Chatbot that books across multiple sectors
   - "I want a haircut and massage tomorrow afternoon"
   - Bot finds availability, books both, optimizes timing
   - Multi-language, voice-enabled

2. **Predictive Analytics Dashboard**
   - ML model predicts next month's revenue
   - Suggests pricing changes
   - Identifies at-risk customers
   - Recommends marketing actions

3. **Automated Marketing Campaigns**
   - AI writes email campaigns based on customer segments
   - Auto-sends birthday offers
   - Re-engagement campaigns for inactive customers
   - A/B testing automatic

4. **Virtual Queuing System**
   - Real-time queue status
   - SMS when your turn is up
   - Works for walk-ins (restaurants, hair salons)
   - Customers can wait elsewhere

5. **Integrated Payments & Invoicing**
   - Full accounting integration
   - Automatic invoicing
   - Tax reporting
   - Integration with Exact Online, Yuki, etc.

6. **360° Business Dashboard**
   - Revenue, bookings, reviews, marketing - all in one
   - Benchmarking against sector averages
   - Gamification (achievements, leaderboards)

7. **Consumer Subscription Plans**
   - Consumers pay €9.99/mo for premium features:
     - Priority booking
     - Exclusive deals
     - Loyalty points 2x
     - Concierge support
   - New revenue stream!

---

## 📊 SUCCESS METRICS & KPIS

### Phase 1: Foundation (Q1 2025)

**Technical**:
- [ ] Zero breaking bugs in production
- [ ] All 3 terminology mappings working (Restaurant, Beauty, Medical)
- [ ] Onboarding completion rate >80%

**Product**:
- [ ] 5 beta locations per new sector
- [ ] 100+ bookings through new sectors

### Phase 2-3: Expansion (Q2-Q3 2025)

**Business**:
- [ ] €50K MRR total
- [ ] 200 paying locations (across all sectors)
- [ ] 10K bookings/month
- [ ] Churn rate <5%

**Product**:
- [ ] 5 sectors live and stable
- [ ] NPS >50
- [ ] Customer support tickets <10/week

### Phase 4-5: Scale (Q4 2025 - Q1 2026)

**Business**:
- [ ] €200K MRR
- [ ] 1000 paying locations
- [ ] 50K bookings/month
- [ ] Expand to 3 countries (BE, NL, DE)

**Product**:
- [ ] 10+ sectors supported
- [ ] 5 languages available
- [ ] Mobile apps launched (iOS + Android)
- [ ] API public and documented

### Long-Term (2026+)

**Vision Metrics**:
- [ ] €1M+ MRR
- [ ] 10K+ paying locations
- [ ] 1M bookings/month
- [ ] 10 countries
- [ ] Market leader in Benelux for appointment booking

---

## 🚧 RISKS & MITIGATION

### Risk 1: Complexity Creep 🔴 HIGH

**Risk**: Adding too many sector-specific features makes platform unmaintainable

**Mitigation**:
- Strict principle: 80% reusable, 20% sector-specific max
- Code review voor alle new features: "Is dit universal toepasbaar?"
- Quarterly "complexity audit"
- Refactor naar generic solutions waar mogelijk

### Risk 2: Poor Sector-Market Fit 🟡 MEDIUM

**Risk**: We pick wrong sectors to expand into, waste resources

**Mitigation**:
- Beta program per sector (10-20 businesses)
- Validate willingness-to-pay before full build
- Surveys and interviews with target sectors
- Pivot quickly if sector doesn't work

### Risk 3: Diluted Brand 🟡 MEDIUM

**Risk**: Being "everything to everyone" = being nothing to no one

**Mitigation**:
- Keep "Reserve4You" as main brand
- Sub-brands per sector (e.g., "Reserve4You for Wellness")
- Sector-specific landing pages
- Clear messaging per sector
- Community building per vertical

### Risk 4: Regulatory/Compliance Issues 🔴 HIGH (Healthcare)

**Risk**: Healthcare compliance is expensive and complex

**Mitigation**:
- Hire compliance expert before healthcare launch
- Partner with legal firm specialized in healthcare tech
- GDPR audit by third party
- Insurance for data breaches
- Clear terms of service: we are booking platform, not healthcare provider

### Risk 5: Competitive Response 🟡 MEDIUM

**Risk**: Incumbents copy our multi-sector approach

**Mitigation**:
- Speed is advantage: be first
- Network effects: cross-sector consumer base is moat
- Better tech: modernste stack, betere UX
- Lock-in: integrations, data, community

---

## 🎓 TEAM & RESOURCES

### Current Team (Estimated)

- 1 Full-stack developer
- 1 Product manager/owner
- (Dietmar?)

### Team Needed for Multi-Sector

**Engineering**:
- 1-2 Full-stack developers (Next.js, TypeScript, Supabase)
- 1 Mobile developer (React Native) - Phase 4
- 1 DevOps/Infrastructure engineer - Phase 3

**Product & Design**:
- 1 Product manager
- 1 UX/UI designer
- 1 Sector specialist per new sector (consultant basis)

**Marketing & Sales**:
- 1 Marketing manager
- 1 Content creator (blogs, videos, case studies)
- 2-3 Sales reps (per sector) - Phase 3+

**Operations**:
- 1 Customer success manager
- 1 Data analyst

**Total Team Size**:
- Phase 1-2: 4-5 people
- Phase 3-4: 8-10 people
- Phase 5: 15-20 people

### Budget Estimate

| Phase | Duration | Team Size | Monthly Cost | Total Cost |
|-------|----------|-----------|--------------|------------|
| Phase 1 | 2 mo | 3 | €20K | €40K |
| Phase 2 | 3 mo | 4 | €25K | €75K |
| Phase 3 | 3 mo | 5 | €30K | €90K |
| Phase 4 | 4 mo | 6 | €35K | €140K |
| Phase 5 | 4 mo | 8 | €45K | €180K |
| **Total** | **16 mo** | **-** | **-** | **€525K** |

**Funding Needed**: €500K-€750K (seed round) voor 18 maanden runway

**ROI Projection**:
- Month 12: €50K MRR = €600K ARR
- Month 18: €200K MRR = €2.4M ARR
- Valuation: €10M-€20M at 5-10x ARR multiple

---

## 🎯 CONCLUSION & NEXT STEPS

### Why This Will Work

1. **Technical Foundation is Solid** ✅
   - 85% of architecture is reusable
   - Sector-agnostic by design (with config)
   - Proven scalability (Supabase, Vercel)

2. **Market Opportunity is Massive** ✅
   - €70B+ TAM vs €2B horeca-only
   - Fragmented market with no universal player
   - High willingness-to-pay across all sectors

3. **Competitive Moat is Real** ✅
   - Network effects across sectors
   - Data advantages (cross-sector insights)
   - No competitor with this approach

4. **Go-to-Market is Clear** ✅
   - Proven playbook from horeca launch
   - Sector-specific channels identified
   - Beta program de-risks each expansion

### Immediate Next Steps (Next 30 Days)

**Week 1-2: Technical Proof of Concept**
- [ ] Add `business_sector` + `sector_config` columns
- [ ] Build terminology system
- [ ] Test with 1 beauty salon (manual config)
- [ ] Document what breaks

**Week 3: Design & Planning**
- [ ] Design sector selector UI
- [ ] Map all 50+ UI labels that need translation
- [ ] Create sector config templates (5 sectoren)
- [ ] Finalize database schema changes

**Week 4: Stakeholder Buy-In**
- [ ] Present this PRD to team/investors
- [ ] Get feedback on prioritization
- [ ] Finalize budget & hiring plan
- [ ] Set Phase 1 OKRs

### Long-Term Vision (3 Years)

**Reserve4You becomes the Stripe of booking systems**:
- Any business that takes appointments uses R4Y
- One consumer account for booking anything
- Platform revenue = €10M+ ARR
- Recognized brand across Europe
- Acquisition target for $100M+

---

**Document Owner**: Product Team  
**Last Updated**: 28 Oktober 2025  
**Next Review**: 15 November 2025  
**Status**: READY FOR REVIEW

---

## 📎 APPENDIX

### A. Competitor Analysis per Sector

**Restaurant**:
- Zenchef (FR) - €69/mo - Strong in France
- Resengo (BE) - €59/mo - Strong in Belgium
- OpenTable (US) - Commission-based - Global but expensive
- TheFork (EU) - Commission-based - Large network but high fees

**Beauty/Wellness**:
- Booksy (PL) - €29/mo - Market leader, maar basic features
- Treatwell (UK) - Commission-based - Marketplace model
- Fresha (UK) - Free + payments - Aggressive growth

**Healthcare**:
- Doctolib (FR) - Dominant in FR, expanding
- Quin (BE) - €79/mo - Medical focus Belgium
- Calendly (US) - Generic, not healthcare-optimized

**Fitness**:
- Mindbody (US) - €99/mo - Market leader but expensive
- Glofox (IE) - €69/mo - Growing in Europe
- Gymdesk (US) - €49/mo - Budget option

**Opportunity**: None of these work across all sectors!

### B. Technical Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     CONSUMER LAYER                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │Restaurant│  │  Beauty  │  │Healthcare│  │  Fitness │   │
│  │  View    │  │   View   │  │   View   │  │   View   │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘   │
│       └─────────────┴──────────────┴─────────────┘         │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────┴────────────────────────────────────┐
│              UNIVERSAL BOOKING ENGINE                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  • Availability Calculation                          │   │
│  │  • Conflict Detection                                │   │
│  │  • Resource Assignment (Staff/Table/Room/Equipment)  │   │
│  │  • Payment Processing                                │   │
│  │  • Notifications (Email/SMS/Push)                    │   │
│  └─────────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────┴────────────────────────────────────┐
│                DATA LAYER (Supabase)                         │
│  ┌──────────┐  ┌──────────┐  ┌────────────┐                │
│  │Locations │  │ Bookings │  │  Resources │                │
│  │+ sector  │  │(generic) │  │  (generic) │                │
│  │+ config  │  │          │  │  +metadata │                │
│  └──────────┘  └──────────┘  └────────────┘                │
└─────────────────────────────────────────────────────────────┘
```

### C. Example Onboarding Flows per Sector

**Restaurant** (current):
1. Company info
2. Location details
3. Tables & Shifts
4. Policies
5. Subscription
6. Publish

**Beauty Salon**:
1. Company info
2. Location details
3. **Staff & Specializations** ← New
4. **Service Menu** ← New
5. **Scheduling Rules** ← Modified
6. Policies
7. Subscription
8. Publish

**Medical Practice**:
1. Company info
2. Location details
3. **Doctors & Specializations** ← New
4. **Treatment Types** ← New
5. **Intake Form Setup** ← New
6. **Insurance Providers** ← New
7. Scheduling Rules
8. **GDPR Consent** ← New
9. Subscription
10. Publish

### D. Terminology Master List

See `TERMINOLOGY_MASTER_LIST.md` (separate document)

### E. Sector Configuration Templates

See `SECTOR_CONFIGS.json` (separate file)

---

**END OF DOCUMENT**

