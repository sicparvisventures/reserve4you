# Reserve4You - Compleet Concept & User Flow Documentatie
## Volledige contextuele beschrijving van het platform voor AI-assistenten

**Versie:** 1.0  
**Datum:** December 2024  
**Status:** Live Platform Documentatie  
**Doel:** Volledige context voor ChatGPT en AI-assistenten om het platform te begrijpen en te kunnen ontwikkelen

---

## 📋 INHOUDSOPGAVE

1. [Het Concept](#het-concept)
2. [Wat Reserve4You voor staat](#wat-reserve4you-voor-staat)
3. [Huidige Platform Status](#huidige-platform-status)
4. [Consumer User Flow](#consumer-user-flow)
5. [Manager User Flow](#manager-user-flow)
6. [Technische Architectuur](#technische-architectuur)
7. [Database Schema](#database-schema)
8. [Multi-Sector Systeem](#multi-sector-systeem)
9. [Belangrijke Features](#belangrijke-features)
10. [API Endpoints Overzicht](#api-endpoints-overzicht)

---

## 🎯 HET CONCEPT

### Wat is Reserve4You?

Reserve4You (R4Y) is **het universele reserveringsplatform voor alle appointment-based bedrijven**. Het platform verbindt consumenten met bedrijven die op afspraak werken - van restaurants tot kappers, van dokters tot fitness studio's.

### De Visie: "Het Stripe van Booking Systemen"

Net zoals Stripe alle soorten betalingen kan verwerken zonder dat developers voor elke betalingstype nieuwe code hoeven te schrijven, kan Reserve4You alle soorten reserveringen afhandelen - ongeacht sector.

**Kernprincipe:** Één platform, 43+ sectoren, zero UI-wijzigingen nodig.

### Het Geniale Concept: Smart Terminology Mapping

Reserve4You gebruikt een **terminology mapping systeem** dat automatisch de juiste sector-specifieke termen toont zonder UI-code te wijzigen:

| Sector | Action Button | Resource | Customer | Staff |
|--------|---------------|----------|----------|-------|
| **Restaurant** | "Reserveer Tafel" | "Tafel" | "Gast" | "Personeel" |
| **Beauty Salon** | "Boek Afspraak" | "Behandelkamer" | "Klant" | "Specialist" |
| **Medical** | "Maak Afspraak" | "Spreekkamer" | "Patiënt" | "Arts" |
| **Fitness** | "Boek Sessie" | "Studio" | "Member" | "Trainer" |

Dezelfde UI-componenten, andere labels - volledig automatisch gebaseerd op `location.business_sector`.

### Business Model

**Subscription-Based SaaS:**
- **START Plan:** €49/maand - 1 locatie, 200 boekingen/maand
- **PRO Plan:** €99/maand - 3 locaties, onbeperkte boekingen
- **PLUS Plan:** €149/maand - Onbeperkte locaties, advanced features

**Geen commissie per boeking** - In tegenstelling tot concurrenten zoals OpenTable (commissie) of Booksy (5% per afspraak), betaalt de klant een vaste maandelijkse prijs.

---

## 💡 WAT RESERVE4YOU VOOR STAAT

### Core Values

1. **Universal Access**
   - Één platform voor alle sectoren
   - Geen aparte app per industrie nodig
   - Consumenten kunnen alles boeken via één account

2. **Simplicity**
   - Boeken in 60 seconden of minder
   - Geen account nodig voor guest bookings
   - Intuïtieve UI voor managers

3. **Fairness**
   - Geen verborgen kosten
   - Geen commissies per boeking
   - Transparante prijzen

4. **Innovation**
   - Modern tech stack (Next.js 15, Supabase)
   - Real-time availability checking
   - AI-ready architectuur

5. **Flexibility**
   - Multi-tenant architectuur (restaurant groups kunnen meerdere locaties beheren)
   - Aanpasbare policies per locatie
   - API-first design voor integraties

### Positionering

**Voor Consumenten:**
> "Stop guessing, Start booking" - Ontdek en reserveer bij professionele bedrijven in heel België en Nederland.

**Voor Bedrijven:**
> "Het modernste reserveringsplatform zonder commissies" - Professionele tools, vaste maandelijkse prijs, geen verborgen kosten.

---

## 📊 HUIDIGE PLATFORM STATUS

### ✅ Wat Werkt Volledig

| Component | Status | Details |
|-----------|--------|---------|
| **Multi-Tenant Architectuur** | ✅ 100% | Volledige tenant isolation met RLS |
| **Consumer Booking Flow** | ✅ 95% | Guest bookings + authenticated bookings |
| **Manager Onboarding** | ✅ 90% | 8-staps wizard voor nieuwe bedrijven |
| **Calendar Systeem** | ✅ 90% | Full calendar view met shifts |
| **Table Management** | ✅ 100% | Auto-assignment, combinable tables |
| **Notification System** | ✅ 85% | Email notifications (Resend) |
| **Billing & Subscriptions** | ⚠️ 70% | Stripe integratie in TEST MODE |
| **Discovery Page** | ✅ 90% | Search, filters, maps |
| **Favorites Systeem** | ✅ 95% | Smart favorites met alerts |
| **Messaging Systeem** | ✅ 85% | Guest-to-location messaging |
| **Reviews & Ratings** | ✅ 80% | Review systeem geïmplementeerd |
| **Multi-Sector Database** | ✅ 100% | 43 sectoren ondersteund |
| **Terminology Systeem** | ✅ 100% | Automatische label mapping |

### 🔴 Kritieke Blocker

**STRIPE PAYMENT INTEGRATION IN TEST MODE**
- Upgrade knoppen bypassen Stripe betaling
- Geen echte betalingen mogelijk
- Fix nodig voor production launch

### 🟡 In Ontwikkeling

- Multi-sector booking engine (momenteel restaurant-only)
- Staff assignment voor beauty/medical sectors
- Service catalog management
- Recurring appointments
- Healthcare GDPR compliance

---

## 👤 CONSUMER USER FLOW

### 1. Discovery & Search

**Entry Points:**
- Homepage (`/`) - Featured locations, trending, spotlight
- Discover page (`/discover`) - Advanced search & filters
- Direct link (`/p/[slug]`) - Directe link naar specifieke locatie

**Discovery Flow:**
```
1. Bezoeker land op homepage
   ↓
2. Ziet featured sections:
   - Spotlight (betaalde featured restaurants)
   - Vandaag Beschikbaar
   - Stijgers (trending)
   - Best Beoordeeld
   - Nieuw op Reserve4You
   - Populaire Specialiteiten (cuisine types)
   ↓
3. Klikt op "Alles bekijken" → /discover
   ↓
4. Op /discover kan gebruiker:
   - Zoeken op naam
   - Filteren op cuisine type
   - Filteren op prijsklasse (€-€€€€)
   - Filteren op locatie (nearby, open now, today)
   - Filteren op groepsgrootte
   - Zien op kaart (geolocatie)
```

**Discovery Features:**
- **Real-time availability** - Toont alleen beschikbare slots
- **Geolocatie** - Vind restaurants in de buurt
- **Cuisine filters** - Filter op Italiaans, Frans, etc.
- **Price range** - € (Budget) tot €€€€ (Premium)
- **Map view** - Zie restaurants op kaart

### 2. Location Detail Page

**URL:** `/p/[slug]` (bijv. `/p/de-korenmarkt`)

**Wat ziet de consument:**
- **Hero image** - Restaurant foto
- **Location info** - Naam, adres, telefoon, website
- **Description** - Beschrijving van het restaurant
- **Reviews** - Gemiddelde rating + aantal reviews
- **Opening hours** - Openingstijden per dag
- **Map embed** - Google Maps embed
- **Booking button** - "Reserveer Nu" CTA

**Actions:**
- Klik "Reserveer" → Booking modal opent
- Klik "Toevoegen aan Favorieten" → Saved (als ingelogd)
- Bekijk reviews → Scroll naar reviews sectie

### 3. Booking Flow (3 Stappen)

#### Stap 1: Details Selectie
```
Consument selecteert:
- Aantal personen (2, 4, 6, 8 of custom)
- Datum (via kalender)
- Beschikbare tijdsloten worden getoond (gebaseerd op shifts)
```

**Technische Details:**
- Kalender toont alleen toekomstige datums
- Max advance booking = `policy.advance_booking_days` (default 60 dagen)
- Tijdsloten worden berekend uit:
  - `shifts` voor die dag
  - `slot_duration_minutes` (default 90 minuten)
  - `buffer_minutes` tussen boekingen (default 15 minuten)
  - Beschikbaarheid van `tables` met genoeg `seats`

#### Stap 2: Tijd Selectie
```
Consument ziet beschikbare tijdsloten:
- Alleen tijden waar echte beschikbaarheid is
- "Vroege avond", "Avond" groepering
- Grijze slots = volgeboekt
```

**Technische Details:**
- Real-time availability check via `/api/bookings/availability`
- Exclude conflicten met bestaande `bookings` (status: CONFIRMED, PENDING)
- Table assignment gebeurt later (automatisch of handmatig)

#### Stap 3: Contactgegevens
```
Consument vult in:
- Naam (verplicht)
- Email (verplicht, validatie)
- Telefoon (optioneel)
- Speciale verzoeken (optioneel)
```

**Authenticatie Opties:**
- **Guest Booking:** Geen account nodig, alleen email + naam
- **Authenticated Booking:** Als ingelogd, wordt `consumer_id` gekoppeld

#### Stap 4: Bevestiging
```
✅ Booking aangemaakt
- Status: PENDING (of CONFIRMED als auto_accept_bookings = true)
- Email confirmatie wordt verzonden
- Redirect naar booking detail page
```

### 4. Booking Confirmation

**Wat gebeurt er na boeken:**
1. **Database Insert:**
   - Record in `bookings` table
   - Status: `PENDING` of `CONFIRMED`
   - `consumer_id` gekoppeld (als authenticated)
   - Auto-assignment van `table_id` (via `assign_best_table` RPC)

2. **Notifications:**
   - **Email naar consument** - Bevestiging met booking details
   - **Email naar manager** - Nieuwe booking notificatie
   - **In-app notification** - Manager dashboard

3. **Follow-up:**
   - Manager kan booking accepteren/weigeren
   - Auto-confirmed bookings zijn direct CONFIRMED
   - Consument kan booking annuleren (via email link of dashboard)

### 5. Consumer Dashboard Features

**URL:** `/profile` (voor ingelogde gebruikers)

**Features:**
- **Mijn Boekingen** (`/bookings`)
  - Overzicht van alle boekingen
  - Status tracking (PENDING, CONFIRMED, CANCELLED)
  - Annuleer optie (volgens policy)
  
- **Favorieten** (`/favorites`)
  - Saved locations
  - Smart alerts (nieuwe beschikbaarheid)
  - Quick booking links

- **Berichten** (`/messages`)
  - Conversaties met locaties
  - St<｜place▁holder▁no▁668｜> vragen over boekingen

- **Profiel**
  - Naam, email, telefoon
  - Account instellingen

### 6. Guest Booking vs Authenticated

**Guest Booking:**
- Geen account nodig
- Email + naam voldoende
- `consumer_id` kan NULL zijn
- Alle booking info in `guest_name`, `guest_email`, `guest_phone`

**Authenticated Booking:**
- Account aangemaakt via `/sign-up`
- `consumer_id` gekoppeld aan `auth_user_id`
- Booking history zichtbaar in dashboard
- Favorieten mogelijk
- Reviews kunnen achtergelaten worden

---

## 🏢 MANAGER USER FLOW

### 1. Sign Up & Tenant Creation

**Entry Point:** `/manager` of `/sign-up`

**Flow:**
```
1. Manager klikt "Start Gratis" op homepage
   ↓
2. Redirect naar /sign-up
   ↓
3. Vul in:
   - Email
   - Password
   - Naam
   ↓
4. Submit → Supabase Auth creates user
   ↓
5. Automatisch:
   - Tenant record aangemaakt in `tenants` table
   - Membership record met role = 'OWNER'
   - Billing state record met status = 'TRIALING'
   ↓
6. Redirect naar /manager/onboarding?step=1
```

**Technische Details:**
- Tenant creation gebeurt via database trigger of API
- `billing_state` krijgt default:
  - `plan` = 'START'
  - `status` = 'TRIALING'
  - `max_locations` = 1
  - `max_bookings_per_month` = 200

### 2. Onboarding Wizard (8 Stappen)

**URL:** `/manager/onboarding?step=X`

#### **Stap 1: Bedrijf**
```
Manager vult in:
- Bedrijfsnaam (bijv. "Restaurant De Korenmarkt")
- Logo upload (optioneel)
- Accent kleur / brand color (optioneel)
```

**Data:**
- `tenants.name` = bedrijfsnaam
- `tenants.logo_url` = Supabase Storage URL
- `tenants.brand_color` = hex kleur

#### **Stap 2: Locatie**
```
Manager vult in:
- Locatienaam (bijv. "Hoofdvestiging")
- Adres (street, city, postal_code, country)
- Google Places autocomplete voor adres
- Geocoding automatisch (latitude, longitude)
- Telefoon, email, website
- Openingstijden per dag (dag + open/close tijd)
```

**Data:**
- `locations` record aangemaakt
- `locations.slug` = auto-generated from name
- `locations.opening_hours` = JSONB array
- Google Places API voor geocoding

#### **Stap 3: Resources & Diensten**
```
Voor restaurants:
- Tafels toevoegen:
  * Tafel naam (bijv. "Tafel 1")
  * Aantal stoelen (2, 4, 6, 8, etc.)
  * Combinable? (kan met andere tafels gecombineerd)
  * Group ID (voor combinable tables)
  
- Shifts toevoegen:
  * Shift naam (bijv. "Lunch", "Diner")
  * Dagen van de week (checkbox selectie)
  * Start tijd (bijv. 12:00)
  * Eind tijd (bijv. 14:00)
  * Slot duur (90 minuten default)
  * Buffer tussen slots (15 minuten default)
```

**Data:**
- `tables` records (per tafel)
- `shifts` records (per shift)

**Toekomst (multi-sector):**
- Voor beauty salons: Staff members + Services
- Voor medical: Treatment rooms + Consultations
- Voor fitness: Studios + Classes

#### **Stap 4: Policies**
```
Manager configureert:
- Annulatiebeleid:
  * X uur van tevoren annuleren (default 24 uur)
  * Same-day booking toestaan? (ja/nee)
  
- No-show boete:
  * Enabled? (ja/nee)
  * Bedrag in euro's
  
- Aanbetaling:
  * Vereist? (ja/nee)
  * Type: Percentage of Vast bedrag
  * Waarde: X% of €X
  * Vanaf hoeveel personen? (default 6)
  
- Boekingsregels:
  * Max groepsgrootte (default 12)
  * Max dagen vooruit boeken (default 60)
```

**Data:**
- `policies` record (1 per locationafe)
- Link naar Stripe voor deposit payments (later)

#### **Stap 5: Betaalinstellingen (Stripe Connect)**
```
Manager configureert:
- Stripe Connect account aanmaken
- Voor deposit & no-show fee betalingen
- Onboarding flow via Stripe
```

**Optioneel:** Kan geskipt worden als geen deposits nodig

#### **Stap 6: Abonnement**
```
Manager kiest plan:
- START (€49/maand)
  * 1 locatie
  * 200 boekingen/maand
  
- PRO (€99/maand)
  * 3 locaties
  * Onbeperkte boekingen
  * Advanced features
  
- PLUS (€149/maand)
  * Onbeperkte locaties
  * Alle features
  * API access
  * White label
```

**⚠️ KRITIEK:** Momenteel in TEST MODE - Stripe checkout wordt bypassed

**Data:**
- Stripe Checkout session aangemaakt
- Na betaling: `billing_state` updated:
  - `plan` = gekozen plan
  - `status` = 'ACTIVE'
  - `stripe_customer_id` = Stripe customer ID
  - `stripe_subscription_id` = Stripe subscription ID

#### **Systemp 7: Integraties**
```
Optionele integraties:
- Lightspeed POS
- Andere POS systemen (toekomst)
```

#### **Stap 8: Preview & Publiceer**
```
Manager ziet:
- Preview van public location page
- Check: Is billing active?
- Check: Zijn er tafels?
- Check: Zijn er shifts?

Klik "Publiceer Restaurant":
- `locations.is_public` = true
- `locations.is_active` = true
- Redirect naar dashboard
```

### 3. Manager Dashboard

**URL:** `/manager/[tenantId]/dashboard`

**Dashboard Features:**

#### **Overview Stats:**
- Vandaag: X boekingen
- Komende week: X boekingen
- CONFIRMED: X
- PENDING: X
- Revenue deze maand (als deposits enabled)

#### **Locaties Lijst:**
- Alle locaties van/of dit bedrijf
- Per locatie:
  - Naam, status (published/unpublished)
  - Aantal boekingen vandaag
  - Quick actions: Calendar, Settings, Delete
  
**Nieuwe Locatie Toevoegen:**
- Button "Nieuwe Vestiging"
- Start onboarding vanaf stap 2 (skip bedrijf)
- `tenantId` wordt meegestuurd

#### **Bookings Overzicht:**
- Filter op locatie
- Lijst van komende boekingen
- Status badges (CONFIRMED, PENDING, CANCELLED)
- Click voor details

#### **Quick Actions:**
- "Nieuwe Boeking" - Manual booking aanmaken
- "Calendar" - Full calendar view
- "Settings" - Locatie instellingen

### 4. Calendar Management

**URL:** `/manager/[tenantId]/calendar`

**Features:**
- **Week View** - Volledige week overzicht
- **Day View** - Detail per dag
- **Month View** - Maand overzicht

**Interacties:**
- Click op tijdslot → Create booking modal
- Drag booking → Change time (toekomst)
- Click op booking → Booking detail modal
- Color coding:
  - Groen = CONFIRMED
  - Geel = PENDING
  - Rood = CANCELLED
  - Grijs = NO_SHOW

**Technische Details:**
- React Big Calendar component
- Real-time updates
- Shift visualization

### 5. Booking Management

**Booking Actions:**
1. **Accept/Confirm** - Status → CONFIRMED
2. **Reject** - Status → CANCELLED
3. **Mark No-Show** - Status → NO_SHOW (triggert fee)
4. **Edit** - Change time, table, party size
5. **Cancel** - Status → CANCELLED
6. **Add Note** - Internal note (alleen manager zichtbaar)

**Booking Details Modal:**
- Guest info (naam, email, telefoon)
- Booking details (datum, tijd, aantal personen)
- Toegewezen tafel
- Status
- Payment status (als deposit)
- Notes (guest + internal)
- Actions (edit, cancel, etc.)

### 6. Location Settings

**URL:** `/manager/[tenantId]/location/[locationId]`

**Settings Categories:**

#### **Algemeen:**
- Locatienaam, adres
- Contactgegevens
- Beschrijving
- Openingstijden

#### **Booking Instellingen:**
- Auto-accept bookings? (ja/nee)
- Policies (annulering, deposits, no-show)
- Max party size
- Advance booking days

#### **Resources:**
- Tafels beheren (add, edit, delete)
- Shifts beheren (add, edit, delete)

#### **Media:**
- Hero image upload
- Logo upload
- Multiple images (galerij)

#### **SEO:**
- Slug (URL)
- Meta description
- Keywords

### 7. Staff Management

**URL:** `/manager/[tenantId]/settings`

**Team Members:**
- Invite team members
- Assign roles:
  - **OWNER** - Full access, kan bedrijf verwijderen
  - **MANAGER** - Kan alles behalve bedrijf verwijderen
  - **STAFF** - Kan boekingen beheren
  - **VIEWER** - Read-only access

**Staff Login:**
- PIN-based login voor staff
- URL: `/staff-login/[slug]`
- Geen volledige account nodig
- Alleen toegang tot bookings van die locatie

### 8. Billing & Subscription

**URL:** `/profile?tab=subscription`

**Features:**
- Huidige plan zien
- Upgrade/Downgrade knop
- Stripe Customer Portal link
- Usage stats (boekingen deze maand)

**Upgrade Flow:**
```
1. Klik "Upgrade naar PRO"
   ↓
2. Stripe Checkout session (⚠️ TEST MODE NU)
   ↓
3. Na betaling:
   - Webhook ontvangt event
   - `billing_state` updated
   - Plan features unlocked
```

---

## 🏗️ TECHNISCHE ARCHITECTUUR

### Tech Stack

| Layer | Technology | Versie | Doel |
|-------|-----------|--------|------|
| **Framework** | Next.js | 15.0.3 | App Router, Server Components |
| **Language** | TypeScript | 5.8.3 | Type safety |
| **Database** | PostgreSQL | 15 | Via Supabase |
| **Auth** | Supabase Auth | 2.45.4 | Authentication & Sessions |
| **Payments** | Stripe | 17.3.1 | Subscriptions & Deposits |
| **Email** | Resend | 6.2.2 | Transactional emails |
| **Storage** | Supabase Storage | - | Images, logos |
| **Styling** | Tailwind CSS | 4.1.7 | Utility-first CSS |
| **UI Components** | Radix UI | Various | Accessible primitives |
| **Forms** | React Hook Form | 7.65.0 | Form management |
| **Validation** | Zod | 3.25.76 | Schema validation |
| **State** | React Query | 5.81.5 | Server state |
| **Calendar** | React Big Calendar | 1.19.4 | Calendar UI |
| **Maps** | Leaflet | 1.9.4 | Interactive maps |
| **Deployment** | Vercel | - | Edge runtime |

### Project Structuur

```
reserve4you/
├── app/                          # Next.js App Router
│   ├── (login)/                 # Auth pages
│   │   ├── sign-in/
│   │   └── sign-up/
│   ├── api/                     # API Routes
│   │   ├── bookings/           # Booking endpoints
│   │   ├── stripe/             # Stripe webhooks
│   │   ├── manager/            # Manager dashboard APIs
│   │   └── profile/            # User profile APIs
│   ├── manager/                # Manager portal
│   │   ├── onboarding/         # Onboarding wizard
│   │   └── [tenantId]/         # Tenant-specific pages
│   │       ├── dashboard/
│   │       ├── calendar/
│   │       ├── location/
│   │       └── settings/
│   ├── discover/               # Discovery page
│   ├── p/[slug]/               # Public location pages
│   ├── profile/                # User profile
│   ├── bookings/               # Consumer bookings
│   ├── favorites/              # Favorites
│   └── page.tsx                # Homepage
├── lib/                        # Core utilities
│   ├── auth/                   # Auth DAL (Data Access Layer)
│   ├── db/                     # Database queries
│   ├── terminology.ts          # Multi-sector terminology
│   ├── supabase/               # Supabase clients
│   └── types/                  # TypeScript types
├── components/                 # React components
│   ├── booking/               # Booking modals
│   ├── location/              # Location cards
│   ├── ui/                    # Reusable UI components
│   └── map/                   # Map components
├── supabase/
│   └── migrations/            # Database migrations (63 files)
ordered list
```

### Authentication Flow

**Supabase Auth Integration:**
- Email/password signup/login
- Session management via cookies
- Row Level Security (RLS) policies
- API route protection via middleware

**Session Handling:**
```typescript
// Server-side: Get user
const { dbUser } = await getOptionalUser();

// Client-side: Create client
const supabase = createClient();
const { data: { user } } = await supabase.auth.getUser();
```

**Protected Routes:**
- `/manager/*` - Requires authentication
- `/profile` - Requires authentication
- `/bookings` - Requires authentication (of guest)

---

## 🗄️ DATABASE SCHEMA

### Core Tables

#### **tenants**
Multi-tenant bedrijven (restaurant groups)
```sql
- id (UUID, PK)
- name (VARCHAR)
- logo_url (TEXT)
- brand_color (VARCHAR)
- owner_user_id (UUID, FK → auth.users)
- created_at, updated_at
```

#### **memberships**
User-tenant relationships met rollen
```sql
- id (UUID, PK)
- tenant_id (UUID, FK → tenants)
- user_id (UUID, FK → auth.users)
- role (ENUM: OWNER, MANAGER, STAFF, VIEWER)
- created_at
UNIQUE(tenant_id, user_id)
```

#### **locations**
Restaurant vestigingen / bedrijfslocaties
```sql
- id (UUID, PK)
- tenant_id (UUID, FK → tenants)
- name (VARCHAR)
- slug (VARCHAR, UNIQUE) -- URL slug
- description (TEXT)
- business_sector (ENUM) -- RESTAURANT, BEAUTY_SALON, etc.
- sector_config (JSONB) -- Sector-specific config
- address (JSONB) -- street, city, postal_code, country
- latitude, longitude (NUMERIC)
- phone, email, website (VARCHAR)
- opening_hours (JSONB) -- Array van dag + open/close
- is_public (BOOLEAN) -- Published?
- is_active (BOOLEAN) -- Active?
- auto_accept_bookings (BOOLEAN)
- staff_login_slug (VARCHAR) -- Voor PIN login
- hero_image_url (TEXT)
- created_at, updated_at
```

#### **tables**
Restaurant tafels (resources)
```sql
- id (UUID, PK)
- location_id (UUID, FK → locations)
- name (VARCHAR) -- "Tafel 1"
- seats (INT) -- Aantal stoelen
- min_seats, max_seats (INT)
- is_combinable (BOOLEAN)
- group_id (VARCHAR) -- Voor combinable tables
- is_active (BOOLEAN)
- created_at, updated_at
```

**Toekomst:** `tables` wordt vervangen door universele `resources` table met `resource_type` ENUM (TABLE, ROOM, STAFF, EQUIPMENT, etc.)

#### **shifts**
Service periodes (lunch, dinner, etc.)
```sql
- id (UUID, PK)
- location_id (UUID, FK → locations)
- name (VARCHAR) -- "Lunch", "Diner"
- day_of_week (INT[]) -- [1,2,3,4,5] = ma-vr
- start_time (TIME) -- "12:00"
- end_time (TIME) -- "14:00"
- slot_duration_minutes (INT) -- 90
- buffer_minutes (INT) -- 15
- max_concurrent_bookings (INT) -- NULL = unlimited
- is_active (BOOLEAN)
- created_at, updated_at
```

#### **policies**
Booking regels per locatie
```sql
- id (UUID, PK)
- location_id (UUID, FK → locations, UNIQUE)
- cancellation_hours (INT) -- 24
- allow_same_day_booking (BOOLEAN)
- no_show_fee_enabled (BOOLEAN)
- no_show_fee_cents (INT)
- deposit_required (BOOLEAN)
- deposit_type (ENUM: PERCENT, FIXED)
- deposit_value (INT)
- deposit_applies_to_party_size (INT) -- 6
- max_party_size (INT) -- 12
- advance_booking_days (INT) -- 60
- created_at, updated_at
```

#### **consumers**
Gasten (met of zonder account)
```sql
- id (UUID, PK)
- auth_user_id (UUID, FK → auth.users, NULLABLE, UNIQUE)
- name (VARCHAR)
- phone (VARCHAR, NULLABLE)
- email (VARCHAR, NULLABLE)
- phone_verified (BOOLEAN)
- created_at, updated_at
```

#### **bookings**
Reserveringen
```sql
- id (UUID, PK)
- location_id (UUID, FK → locations)
- table_id (UUID, FK → tables, NULLABLE)
- consumer_id (UUID, FK → consumers, NULLABLE)
- guest_name, guest_phone, guest_email (VARCHAR) -- Denormalized
- party_size (INT)
- start_ts (TIMESTAMPTZ) -- Start tijd
- end_ts (TIMESTAMPTZ) -- Eind tijd
- status (ENUM: PENDING, CONFIRMED, CANCELLED, NO_SHOW, COMPLETED, WAITLIST)
- payment_status (ENUM: NONE, REQUIRES_PAYMENT, PAID, FAILED, REFUNDED)
- stripe_payment_intent_id (TEXT)
- deposit_amount_cents (INT)
- guest_note (TEXT)
- internal_note (TEXT) -- Manager only
- source (VARCHAR) -- WEB, PHONE, WALKIN, POS
- idempotency_key (VARCHAR, UNIQUE)
- created_by (UUID, FK → auth.users) -- Manager who created
- created_at, updated_at
```

**Legacy Fields (worden vervangen):**
- `booking_date` (DATE) → `start_ts`
- `booking_time` (TIME) → `start_ts`
- `duration_minutes` → berekend uit `start_ts` en `end_ts`

#### **billing_state**
Subscription status per tenant
```sql
- tenant_id (UUID, PK, FK → tenants)
- stripe_customer_id (TEXT, UNIQUE)
- stripe_subscription_id (TEXT, UNIQUE)
- plan (ENUM: START, PRO, PLUS)
- status (ENUM: ACTIVE, PAST_DUE, CANCELLED, TRIALING)
- max_locations (INT) -- 1, 3, or unlimited
- max_bookings_per_month (INT) -- 200, unlimited
- bookings_used_this_month (INT)
- current_period_start (TIMESTAMPTZ)
- current_period_end (TIMESTAMPTZ)
- trial_end (TIMESTAMPTZ)
- created_at, updated_at
```

### Multi-Sector Database Extensions

#### **resources** (Toekomst)
Universele resource table
```sql
- id (UUID, PK)
- location_id (UUID, FK → locations)
- resource_type (ENUM: TABLE, ROOM, STAFF, EQUIPMENT, VEHICLE, SPACE)
- name (VARCHAR)
- capacity (INT) -- seats, max people, etc.
- metadata (JSONB) -- Sector-specific data
- is_active (BOOLEAN)
```

#### **service_offerings** (Toekomst)
Services/treatments/menu items
```sql
- id (UUID, PK)
- location_id (UUID, FK → locations)
- name (VARCHAR)
- category (VARCHAR)
- duration_minutes (INT)
- price_cents (INT)
- description (TEXT)
```

#### **recurring_booking_patterns** (Toekomst)
Recurring appointment series
```sql
- id (UUID, PK)
- booking_id (UUID, FK → bookings)
- frequency (ENUM: WEEKLY, BIWEEKLY, MONTHLY)
- end_date (DATE)
- occurrences (INT)
```

### Row Level Security (RLS)

**Principes:**
- Alle tables hebben RLS enabled
- Policies gebaseerd op `auth.uid()`
- Tenant isolation via `memberships` check
- Public read access voor published locations

**Voorbeeld Policy:**
```sql
-- Locations: Public kan published locations lezen
CREATE POLICY "Public can view published locations"
ON locations FOR SELECT
USING (is_public = true);

-- Bookings: Managers kunnen bookings van hun tenant zien
CREATE POLICY "Managers can view tenant bookings"
ON bookings FOR SELECT
USING (
  location_id IN (
    SELECT id FROM locations
    WHERE tenant_id IN (
      SELECT tenant_id FROM memberships
      WHERE user_id = auth.uid()
    )
  )
);
```

---

## 🌍 MULTI-SECTOR SYSTEEM

### Business Sectors (43 Total)

**Horeca:**
- RESTAURANT, CAFE, BAR

**Beauty & Wellness:**
- BEAUTY_SALON, HAIR_SALON, NAIL_STUDIO, SPA, MASSAGE_THERAPY, TANNING_SALON

**Healthcare:**
- MEDICAL_PRACTICE, DENTIST, PHYSIOTHERAPY, PSYCHOLOGY, VETERINARY

**Fitness & Sports:**
- GYM, YOGA_STUDIO, PERSONAL_TRAINING, DANCE_STUDIO, MARTIAL_ARTS

**Professional Services:**
- LEGAL, ACCOUNTING, CONSULTING, FINANCIAL_ADVISORY

**Education:**
- TUTORING, MUSIC_LESSONS, LANGUAGE_SCHOOL, DRIVING_SCHOOL

**Automotive:**
- CAR_REPAIR, CAR_WASH, CAR_RENTAL

**Home Services:**
- CLEANING, PLUMBING, ELECTRICIAN, GARDENING

**Entertainment:**
- EVENT_VENUE, PHOTO_STUDIO, ESCAPE_ROOM, BOWLING, HOTEL, VACATION_RENTAL, COWORKING_SPACE, MEETING_ROOM

**Other:**
- OTHER

### Terminology Mapping

**File:** `lib/terminology.ts`

**Functie:** Automatische label mapping per sector

**Voorbeeld:**
```typescript
const terminology = getTerminology('BEAUTY_SALON');
// Returns:
{
  booking: { singular: 'Afspraak', plural: 'Afspraken', verb: 'Boeken' },
  resource: { singular: 'Behandelkamer', plural: 'Behandelkamers' },
  customer: { singular: 'Klant', plural: 'Klanten' },
  staff: { singular: 'Schoonheidsspecialist', plural: 'Specialisten' },
  service: { singular: 'Behandeling', plural: 'Behandelingen' },
  location: { singular: 'Schoonheidssalon', plural: 'Schoonheidssalons' }
}
```

**Gebruik in Components:**
```tsx
import { useTerminology } from '@/lib/contexts/business-sector-context';

function BookingButton() {
  const { terminology } = useTerminology();
  return <Button>{terminology.booking.verb} {terminology.resource.singular}</Button>;
}
// Shows: "Boeken Behandelkamer" voor beauty salon
// Shows: "Reserveren Tafel" voor restaurant
```

### Sector Config (JSONB)

**Field:** `locations.sector_config`

**Structuur:**
```json
{
  "terminology": {
    "booking": "Afspraak",
    "resource": "Behandelkamer",
    "customer": "Klant"
  },
  "features": {
    "requires_staff_assignment": true,
    "has_service_catalog": true,
    "allows_recurring_bookings": true,
    "duration_type": "fixed"
  },
  "booking_rules": {
    "min_booking_lead_hours": 24,
    "max_booking_lead_days": 90,
    "cancellation_policy_hours": 24
  },
  "primary_resource_type": "STAFF" // TABLE, ROOM, STAFF, etc.
}
```

### Huidige Status Multi-Sector

✅ **Database Ready:** Alle migrations aanwezig  
✅ **Terminology Ready:** Alle 43 sectoren hebben labels  
⚠️ **Booking Engine:** Nog restaurant-only (moet multi-sector worden)  
⏳ **UI Components:** Klaar maar nog niet volledig sector-aware  
⏳ **Onboarding:** Moet sector selectie toevoegen  

---

## ⚙️ BELANGRIJKE FEATURES

### 1. Real-Time Availability Checking

**Endpoint:** `/api/bookings/availability`

**Functie:**
- Berekent beschikbare tijdsloten voor een locatie
- Houdt rekening met:
  - Shifts (openingstijden)
  - Bestaande boekingen (conflicts)
  - Table capacity
  - Buffer tijd tussen slots

**Algorithm:**
```
1. Get shifts voor gekozen dag
2. Genereer tijdsloten per shift (slot_duration + buffer)
3. Voor elk slot:
   - Check welke tafels beschikbaar zijn (party_size <= seats)
   - Exclude tafels met conflicten (overlappende bookings)
   - Als minstens 1 tafel beschikbaar → slot is available
```

### 2. Automatic Table Assignment

**Function:** `assign_best_table` (PostgreSQL RPC)

**Logica:**
- Vind beschikbare tafels voor party size
- Kies tafel met minimale "waste" (seats - party_size)
- Bij combinable tables: Check of combinatie mogelijk is
- Assign `table_id` aan booking

### 3. Idempotency Keys

**Doel:** Voorkom double-bookings bij network retries

**Implementatie:**
- Elke booking request heeft unieke `idempotency_key`
- Database constraint: `UNIQUE(idempotency_key)`
- Bij duplicate key → Return existing booking (niet error)

### 4. Email Notifications

**Provider:** Resend

**Triggers:**
- Booking created → Email naar consument + manager
- Booking confirmed → Email naar consument
- Booking cancelled → Email naar consument
- No-show → Email naar consument (met fee info)

**Templates:**
- Booking confirmation
- Booking cancellation
- Manager notification (new booking)

### 5. Smart Favorites System

**Features:**
- Save locations als favorite
- Alerts bij nieuwe beschikbaarheid
- Insights (bijv. "Populair op vrijdagavond")
- Quick booking links

**Database:**
- `favorites` table (user_id, location_id)
- Triggers voor availability alerts

### 6. Messaging System

**Functionaliteit:**
- Guest-to-location messaging
- Threading per conversation
- Read/unread status
- Archive functionality

**Database:**
- `messages` table
- `conversations` table (optioneel)

### 7. Reviews & Ratings

**Features:**
- Consumenten kunnen reviews achterlaten
- Rating 1-5 sterren
- Text review (optioneel)
- Manager kan reageren op reviews
- Reviews tonen op public location page

**Database:**
- `reviews` table
- Aggregated ratings in `locations` (cached)

### 8. Staff Login (PIN-based)

**URL:** `/staff-login/[slug]`

**Functionaliteit:**
- Panorama PIN login voor staff members
- Geen volledige account nodig
- Toegang alleen tot bookings van die locatie
- Geen toegang tot settings/billing

**Flow:**
```
1. Staff gaat naar /staff-login/[slug]
2. Voert PIN in
3. Session aangemaakt met limited permissions
4. Redirect naar calendar view (read-only)
```

---

## 🔌 API ENDPOINTS OVERZICHT

### Public Endpoints (No Auth)

#### **GET /api/health**
Health check endpoint

#### **POST /api/bookings/create**
Create booking (guest of authenticated)
```typescript
Request: {
  location_id: string;
  guest_name: string;
  guest_email: string;
  guest_phone?: string;
  party_size: number;
  booking_date: string; // YYYY-MM-DD
  booking_time: string; // HH:MM
  special_requests?: string;
  idempotency_key: string;
}
Response: {
  success: boolean;
  booking: Booking;
  error?: string;
}
```

#### **GET /api/bookings/availability**
Check available time slots
```typescript
Query: {
  location_id: string;
  date: string; // YYYY-MM-DD
  party_size: number;
}
Response: {
  available_slots: string[]; // ["12:00", "13:30", ...]
}
```

#### **GET /api/google-places/search**
Google Places autocomplete
```typescript
Query: {
  query: string;
}
Response: {
  predictions: GooglePlacePrediction[];
}
```

### Authenticated Endpoints

#### **GET /api/user**
Get current user info
```typescript
Response: {
  user: User;
  tenant?: Tenant;
  role?: string;
}
```

#### **POST /api/profile/update**
Update user profile
```typescript
Request: {
  name?: string;
  phone?: string;
}
```

#### **POST /api/profile/upgrade-checkout**
Create Stripe checkout session (⚠️ TEST MODE)
```typescript
Request: {
  plan: 'START' | 'PRO' | 'PLUS';
}
Response: {
  url: string; // Stripe checkout URL
}
```

### Manager Endpoints (RLS Protected)

#### **GET /api/manager/tenants**
List tenants user has access to

#### **POST /api/manager/locations**
Create location
```typescript
Request: {
  tenant_id: string;
  name: string;
  address: {...};
  // ... other fields
}
```

#### **GET /api/manager/bookings**
List bookings for tenant
```typescript
Query: {
  tenant_id: string;
  location_id?: string;
  status?: string;
  date_from?: string;
  date_to?: string;
}
```

#### **POST /api/manager/bookings/[id]/status**
Update booking status
```typescript
Request: {
  status: 'CONFIRMED' | 'CANCELLED' | 'NO_SHOW';
}
```

#### **DELETE /api/manager/locations/[id]**
Delete location (cascade)

### Webhooks

#### **POST /api/stripe/webhook**
Stripe webhook handler
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

Updates `billing_state` automatisch.

---

## 📝 CONCLUSIE

Reserve4You is een **technisch solide, multi-sector booking platform** met:

✅ **Complete consumer flow** - Discovery → Booking → Confirmation  
✅ **Complete manager flow** - Signup → Onboarding → Dashboard → Booking Management  
✅ **Multi-tenant architectuur** - Restaurant groups met meerdere locaties  
✅ **Real-time availability** - Accurate slot checking  
✅ **Multi-sector ready** - Database + terminology systeem klaar  
⚠️ **Stripe integratie** - Moet gefixed worden voor production stati  
⏳ **Multi-sector booking** - Moet uitgebreid worden voor beauty/medical/fitness  

### Key Takeaways voor AI-Assistenten

1. **Terminology System:** Gebruik altijd `useTerminology()` hook voor labels - nooit hardcoded strings
2. **Multi-Tenant:** Altijd checken of user toegang heeft tot tenant via `memberships` table
3. **RLS:** Database policies zorgen voor security - check altijd permissions server-side
4. **Booking Flow:** Gebruik altijd idempotency keys voor booking creation
5. **Availability:** Check altijd via `/api/bookings/availability` - nooit client-side answers
6. **Sector Awareness:** Check altijd `location.business_sector` voor sector-specifieke logica

**Voor vragen of onduidelijkheden, zie ook:**
- `COMPREHENSIVE_PRD_2025.md` - Volledige product requirements
- `EXECUTIVE_SUMMARY_2025.md` - Business context
- `R4Y_MARKET_LEADERSHIP_IMPLEMENTATION.md` - Market strategy

---

**Document Versie:** 1.0  
**Laatste Update:** December 2024  
**Auteur:** AI Analysis Team  
**Voor:** ChatGPT & AI Development Assistants
