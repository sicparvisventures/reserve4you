# R4Y (Reserve4You) - Complete Product Requirements Document 2025

**Versie**: 2.0  
**Datum**: 24 Oktober 2025  
**Status**: Living Document  
**Doel**: Volledige analyse van huidige functionaliteit + roadmap om Zenchef/Resengo te overtreffen

---

## 📋 EXECUTIVE SUMMARY

Reserve4You (R4Y) is een professioneel restaurant reserveringsplatform gebouwd met Next.js 15, TypeScript, Supabase en Stripe. Het platform verbindt gasten met restaurants en biedt restaurantmanagers krachtige tools voor booking management.

**Huidige Status**: 
- ✅ Core MVP features geïmplementeerd
- ✅ Multi-tenant architectuur operationeel
- ✅ Basis booking systeem werkend
- 🚧 Concurrentie features in ontwikkeling

**Concurrenten**: Zenchef, Resengo, OpenTable, TheFork
**Marktpositie**: Emerging player met focus op België/Nederland
**USP**: Commissievrij, gebruiksvriendelijk, moderne tech stack

---

## 🎨 DESIGN SYSTEM & BRANDING

### Brand Identity

**Naam**: Reserve4You (R4Y)  
**Tagline**: "Stop guessing, Start booking"  
**Positionering**: Modern, betrouwbaar, gebruiksvriendelijk

### Kleurenschema

#### Primaire Kleuren
```css
--primary: 0 86% 67%;           /* #FF5A5F - R4Y Brand Red */
--background: 240 5% 97%;       /* #F7F7F9 - Light Gray */
--foreground: 0 0% 7%;          /* #111111 - Near Black */
--border: 240 4% 92%;           /* #E7E7EC - Light Gray Border */
```

#### Semantische Kleuren
```css
--success: 142 76% 45%;         /* #18C964 - Green */
--warning: 32 95% 56%;          /* #FFB020 - Orange */
--error: 346 77% 50%;           /* #E11D48 - Red */
--info: 221 83% 62%;            /* #3B82F6 - Blue */
```

#### Grijstinten
```css
--gray-50: #FAFAFA
--gray-100: #F5F5F5
--gray-200: #E7E7EC
--gray-300: #D4D4D8
--gray-400: #A1A1AA
--gray-500: #71717A
--gray-600: #52525B
--gray-700: #3F3F46
--gray-800: #27272A
--gray-900: #18181B
```

### Typografie

**Font Stack**:
```css
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
```

**Font Sizes**:
- XS: 12px - Labels, captions
- SM: 14px - Body text small
- Base: 16px - Body text
- LG: 18px - Subheadings
- XL: 20px - Section titles
- 2XL: 24px - Page titles
- 3XL: 32px - Hero headings
- 4XL: 48px - Landing page hero

**Line Heights**:
- Tight: 1.2 - Headings
- Normal: 1.5 - Body text
- Relaxed: 1.75 - Long-form content

### Spacing (8pt Grid)

```
xs: 4px
sm: 8px
md: 16px
lg: 24px
xl: 32px
2xl: 48px
3xl: 64px
```

### Border Radius

```
sm: 8px    - Small elements
md: 12px   - Buttons
lg: 16px   - Cards
xl: 20px   - Large cards
2xl: 24px  - Hero sections
full: 9999px - Pills, avatars
```

### Shadows

```css
sm: 0 1px 2px rgba(0, 0, 0, 0.04)
md: 0 2px 8px rgba(0, 0, 0, 0.04)
lg: 0 4px 12px rgba(0, 0, 0, 0.08)
xl: 0 8px 24px rgba(0, 0, 0, 0.12)
```

### Animaties

**Timings**:
```css
--duration-fast: 200ms
--duration-medium: 250ms
--duration-slow: 300ms
--transition-timing: cubic-bezier(0.4, 0, 0.2, 1) /* ease-out */
```

**Animations**:
- fade-in: Opacity 0 → 1
- slide-up: TranslateY(20px) → 0
- scale-in: Scale(0.95) → 1
- float: Gentle up/down motion
- gradient-shift: Animated gradients

---

## 🏗️ HUIDIGE ARCHITECTUUR

### Tech Stack

**Frontend**:
- Next.js 15 (App Router, Turbopack)
- React 19
- TypeScript 5.8
- Tailwind CSS 4.1
- Radix UI + shadcn/ui patterns
- React Hook Form + Zod validation
- React Query (@tanstack)
- Framer Motion voor animaties

**Backend**:
- Next.js API Routes (Edge Runtime waar mogelijk)
- Supabase (PostgreSQL + Auth)
- Row Level Security (RLS) voor data isolation
- Stripe voor betalingen

**Infrastructure**:
- Vercel (hosting + edge network)
- Supabase (database + auth + storage)
- Cloudflare (DNS + CDN - optioneel)
- pnpm voor package management

### Database Schema

#### Core Tables (11 tabellen)

**1. tenants** - Restaurant organisaties
```sql
- id, name, brand_color, logo_url
- owner_user_id (FK naar auth.users)
- created_at, updated_at
```

**2. memberships** - Team members met rollen
```sql
- id, tenant_id, user_id
- role: OWNER | MANAGER | STAFF
- Unique(tenant_id, user_id)
```

**3. locations** - Restaurant vestigingen
```sql
- id, tenant_id, name, slug (unique)
- description, cuisine_type, price_range (1-4)
- address (line1, line2, city, postal_code, country)
- latitude, longitude (voor nearby search)
- phone, email, website
- opening_hours (JSONB)
- is_public, is_active
- hero_image_url, meta_description
- auto_accept_bookings (boolean)
- staff_login_slug (voor PIN login)
```

**4. tables** - Restaurant tafels
```sql
- id, location_id, name, seats
- min_seats, max_seats, is_combinable
- group_id, position_x, position_y
- is_active
```

**5. shifts** - Service periodes
```sql
- id, location_id, name
- day_of_week (array), start_time, end_time
- slot_duration_minutes, buffer_minutes
- max_concurrent_bookings, is_active
```

**6. policies** - Booking regels
```sql
- id, location_id (unique)
- cancellation_hours, allow_same_day_booking
- no_show_fee_enabled, no_show_fee_cents
- deposit_required, deposit_type, deposit_value
- deposit_applies_to_party_size
- max_party_size, advance_booking_days
```

**7. consumers** - Gasten (met of zonder account)
```sql
- id, auth_user_id (nullable)
- name, phone, email
- phone_verified
```

**8. bookings** - Reserveringen
```sql
- id, location_id, table_id, consumer_id
- guest_name, guest_phone, guest_email (gedenormaliseerd)
- party_size, start_time, end_time
- status: PENDING | CONFIRMED | CANCELLED | NO_SHOW | COMPLETED | WAITLIST
- payment_status: NONE | REQUIRES_PAYMENT | PAID | FAILED | REFUNDED
- stripe_payment_intent_id, deposit_amount_cents
- guest_note, internal_note
- source, idempotency_key
```

**9. billing_state** - Abonnement status per tenant
```sql
- tenant_id (PK), stripe_customer_id, stripe_subscription_id
- plan: START | PRO | PLUS
- status: ACTIVE | PAST_DUE | CANCELLED | TRIALING
- max_locations, max_bookings_per_month
- bookings_used_this_month
- current_period_start/end, trial_end
```

**10. pos_integrations** - POS koppelingen
```sql
- id, location_id, vendor: LIGHTSPEED | SQUARE | TOAST | CLOVER
- access_token, refresh_token, token_expires_at
- external_location_id, config (JSONB)
- is_active, last_sync_at, last_sync_status
```

**11. favorites** - Opgeslagen locaties per consumer
```sql
- id, consumer_id, location_id
- created_at
```

#### Extra Tables (Features)

**12. notifications** - Notificaties systeem
```sql
- id, user_id, type, priority
- title, message
- booking_id, location_id, tenant_id
- action_url, action_label
- read, archived, read_at
```

**13. notification_settings** - Notificatie voorkeuren
```sql
- tenant_id, location_id
- booking_confirmed_enabled, booking_cancelled_enabled
- booking_reminder_enabled, reminder_hours_before
- etc.
```

**14. guest_messages** - Manager naar gast berichten
```sql
- id, tenant_id, location_id
- message_type, subject, message
- target_type, target_date
- sent_at, sent_by
```

**15. message_recipients** - Bericht ontvangers tracking
```sql
- id, message_id, consumer_id, booking_id
- delivered_at
```

**16. menu_items** - Menu management
```sql
- id, location_id, category
- name, description, price
- image_url, is_available
- dietary_tags (array)
```

**17. promotions** - Promoties/aanbiedingen
```sql
- id, location_id, title, description
- discount_type, discount_value
- valid_from, valid_until
- image_url, is_active
```

**18. widget_configurations** - Embeddable widgets
```sql
- id, tenant_id, widget_code (unique)
- theme, primary_color, logo_url
- layout, card_style, show_promotions
- location_ids (array)
```

**19. widget_analytics** - Widget tracking
```sql
- id, widget_id, event_type
- location_id, referrer_url
- user_agent, created_at
```

**20. venue_users** - Staff login systeem
```sql
- id, tenant_id, email, pin_code
- name, role, is_active
- location_ids (array), all_locations
- can_view_dashboard, can_manage_bookings, etc.
```

### Kritische Indexes

```sql
-- Performance critical
idx_bookings_location_time
idx_bookings_table_time
idx_locations_geo (GIST index voor nearby search)
idx_memberships_tenant_user
idx_locations_slug
idx_locations_public
```

---

## ✅ HUIDIGE FEATURES (WAT ER AL IS)

### 1. Multi-Tenant Systeem ✅

**Volledig geïmplementeerd**:
- ✅ Tenant management met ownership
- ✅ Membership rollen (OWNER/MANAGER/STAFF)
- ✅ Complete data isolatie via RLS
- ✅ Hierarchische permissions
- ✅ Team member management UI

**Wat werkt**:
- Eigenaar kan managers en staff toevoegen
- Elke tenant heeft eigen data
- RLS policies blokkeren cross-tenant access
- Role-based feature toegang

### 2. Consumer Experience ✅

**Homepage** (`/`):
- ✅ Modern hero section met grid distortion effect
- ✅ Featured restaurants grid (12 locaties)
- ✅ Populaire keukens sectie
- ✅ Restaurant owner CTA sectie
- ✅ Floating staff login button
- ✅ Responsive design

**Discover Page** (`/discover`):
- ✅ Search functionaliteit
- ✅ Filters: keuken, prijsklasse, stad
- ✅ Location grid met cards
- ✅ Loading states & skeletons
- ✅ Empty states

**Location Detail** (`/p/[slug]`):
- ✅ Hero image met gradient overlay
- ✅ Restaurant informatie
- ✅ Openingstijden display
- ✅ Adres en contact info
- ✅ Promoties display
- ✅ Menu weergave (als beschikbaar)
- ✅ "Reserveren" button → booking modal

**Booking Flow**:
- ✅ 3-step booking modal (guests, date/time, details)
- ✅ Real-time availability check
- ✅ Guest checkout (no account needed)
- ✅ Special requests field
- ✅ Auto-accept of manual approval
- ✅ Email required field
- ✅ Success confirmation screen

**Profile** (`/profile`):
- ✅ Persoonlijke informatie
- ✅ Booking historie met details
- ✅ Mooie booking cards met status
- ✅ Link naar locaties
- ✅ Abonnement sectie (voor managers)

**Favorites** (`/favorites`):
- ✅ Opgeslagen restaurants
- ✅ Quick access naar favorieten

### 3. Manager Portal ✅

**Onboarding Wizard** (`/manager/onboarding`):
- ✅ 8-staps wizard
- ✅ Stap 1: Bedrijf (naam, logo, brand color)
- ✅ Stap 2: Locatie (adres, contact, openingstijden)
- ✅ Stap 3: Tafels & Shifts
- ✅ Stap 4: Policies (annulering, deposits)
- ✅ Stap 5: Betaalinstellingen (Stripe Connect)
- ✅ Stap 6: Abonnement keuze + checkout
- ✅ Stap 7: Integraties (POS - optioneel)
- ✅ Stap 8: Preview & publiceren
- ✅ Progress indicator
- ✅ LocalStorage save progress
- ✅ Skip logic voor nieuwe locaties

**Dashboard** (`/manager/[tenantId]/dashboard`):
- ✅ Professional sticky navigation
- ✅ Real-time stats cards (4):
  - Vandaag (met totaal gasten)
  - Bevestigde reserveringen
  - Pending actions
  - Bezettingsgraad %
- ✅ Multi-location switcher
- ✅ Advanced filters (status, search)
- ✅ View modes (List/Grid/Calendar UI klaar)
- ✅ Booking management met quick actions
- ✅ Confirm/Cancel/No-show buttons
- ✅ Authorization checks
- ✅ Logout functionaliteit
- ✅ TableFever-style professional UI
- ✅ R4Y branding (geen emoji's)

**Location Dashboard** (`/manager/[tenantId]/location/[locationId]`):
- ✅ Location-specific view
- ✅ Tabs: Dashboard, Reservaties, Tafels, Shifts, Instellingen
- ✅ Stats per locatie
- ✅ Booking lijst met filters
- ✅ Table management
- ✅ Shift management

**Settings** (`/manager/[tenantId]/settings`):
- ✅ Multi-tab interface
- ✅ Bedrijf instellingen
- ✅ Locatie beheer
- ✅ Tafels & diensten
- ✅ Policies configuratie
- ✅ Team management (Users)
- ✅ Integraties (POS, Stripe)
- ✅ Widget configuratie
- ✅ Notificatie instellingen
- ✅ Facturatie & abonnement

**Reservations Management**:
- ✅ Status updates (API + UI)
- ✅ Booking detail modal
- ✅ Internal notes
- ✅ Table assignment
- ✅ Search & filters
- ✅ Bulk operations (SQL ready)

### 4. Notificatie Systeem ✅

**In-app Notifications**:
- ✅ Notifications page (`/notifications`)
- ✅ Notification badge met count
- ✅ Real-time updates
- ✅ Mark as read/unread
- ✅ Archive functionaliteit
- ✅ Filters: All/Unread/Read/Archived
- ✅ Priority badges
- ✅ Action buttons in notifications

**Automatic Triggers**:
- ✅ Nieuwe reservering → BOOKING_PENDING notificatie
- ✅ Bevestiging → BOOKING_CONFIRMED
- ✅ Annulering → BOOKING_CANCELLED
- ✅ Wijziging → BOOKING_MODIFIED
- ✅ Manager messages → MESSAGE_RECEIVED

**Notification Settings**:
- ✅ Per tenant/location configuratie
- ✅ Enable/disable per type
- ✅ Reminder timing configuratie
- ✅ Manager notificatie toggle

### 5. Guest Messaging Systeem ✅

**Features**:
- ✅ Manager kan berichten sturen naar gasten
- ✅ 7 bericht types (Aankondiging, Herinnering, Speciale Aanbieding, etc.)
- ✅ 3 targeting opties:
  - Alle gasten met aankomende reservering
  - Gasten met reservering in date range
  - Specifieke datum
- ✅ Real-time target count
- ✅ Character limits (100 subject, 500 message)
- ✅ Stats dashboard (Totaal bereikt, Deze maand, etc.)
- ✅ Recente berichten historie
- ✅ Integratie met notifications
- ✅ 1 bericht per persoon (deduplicated)

### 6. Widget Systeem ✅

**Embeddable Widget**:
- ✅ Externe website integratie
- ✅ Restaurant kaarten display
- ✅ Promoties weergave
- ✅ Direct reserveren functionaliteit
- ✅ Volledig customizable:
  - Theme (light/dark/auto)
  - Brand colors
  - Logo upload & positioning
  - Layout (grid/list/carousel)
  - Card style (modern/classic/minimal)
  - Toggle features (cuisine, price, promotions)
- ✅ Analytics tracking (views, clicks, bookings)
- ✅ Copy-paste embed code
- ✅ Preview functionaliteit
- ✅ Widget manager UI

### 7. Menu Management ✅

**Features**:
- ✅ Menu items management
- ✅ Categorieën
- ✅ Prijzen en beschrijvingen
- ✅ Image uploads
- ✅ Dietary tags
- ✅ Availability toggle
- ✅ Public display op location pages
- ✅ Manager editing interface

### 8. Promotions Systeem ✅

**Features**:
- ✅ Promoties aanmaken en beheren
- ✅ Discount types (percentage, fixed, free item)
- ✅ Geldigheidsperiode
- ✅ Image upload naar Supabase Storage
- ✅ Public display op location pages
- ✅ Widget integratie
- ✅ Active/inactive toggle
- ✅ Manager UI voor CRUD

### 9. Billing & Subscriptions ✅

**3-Tier Pricing**:
- ✅ START (€49/maand): 1 locatie, 200 bookings
- ✅ PRO (€99/maand): 3 locaties, 1000 bookings
- ✅ PLUS (€199/maand): Unlimited locaties & bookings

**Features**:
- ✅ Stripe Checkout integratie
- ✅ Subscription management
- ✅ Billing gate (can't publish zonder active sub)
- ✅ Usage tracking (bookings per maand)
- ✅ Quota enforcement
- ✅ Customer portal link
- ✅ Plan upgrade/downgrade
- ✅ Trial period support
- ✅ Webhook handling (subscription events)

### 10. Staff Login Systeem ✅

**Features**:
- ✅ PIN-based login
- ✅ Email + password login
- ✅ Per-location slugs (`/staff-login/[slug]`)
- ✅ Global staff login page (`/staff-login`)
- ✅ Fine-grained permissions:
  - can_view_dashboard
  - can_manage_bookings
  - can_manage_tables
  - can_manage_settings
  - can_view_reports
  - can_manage_menu
- ✅ Location-specific access (array of location_ids)
- ✅ All locations access toggle
- ✅ Active/inactive status
- ✅ Manager UI voor staff management
- ✅ Auto-redirect naar toegewezen locaties

### 11. Image Upload & Storage ✅

**Features**:
- ✅ Supabase Storage integratie
- ✅ Buckets: logos, location-images, menu-images, promotion-images
- ✅ RLS policies voor secure uploads
- ✅ Image upload UI components
- ✅ Preview functionaliteit
- ✅ Delete functionaliteit
- ✅ Optimized voor web (resize/compress aanbevolen)

### 12. Security & Authentication ✅

**Auth Methods**:
- ✅ Google OAuth (consumers)
- ✅ Email/Password (managers)
- ✅ PIN code (staff)
- ✅ Guest checkout (no account)
- ✅ SMS verification support (ready)

**Security**:
- ✅ Row Level Security op alle tabellen
- ✅ Role-based access control
- ✅ Tenant data isolation
- ✅ CSRF protection (Next.js built-in)
- ✅ Input validation met Zod
- ✅ SQL injection prevention (Supabase parameterized queries)
- ✅ XSS prevention (React auto-escaping)

### 13. API Endpoints ✅

**Public APIs**:
- ✅ GET `/api/locations/search` - Zoek restaurants
- ✅ GET `/api/availability/check` - Check beschikbaarheid
- ✅ POST `/api/bookings/create` - Maak reservering
- ✅ GET `/api/widget/[widgetCode]` - Widget data
- ✅ POST `/api/widget/[widgetCode]/track` - Analytics

**Manager APIs**:
- ✅ All CRUD voor locations, tables, shifts, policies
- ✅ POST `/api/manager/locations/publish` - Publiceer locatie
- ✅ PATCH `/api/manager/bookings/[id]/status` - Update booking status
- ✅ GET `/api/manager/usage` - Usage stats
- ✅ POST `/api/manager/messages/send` - Verstuur guest message
- ✅ GET/POST `/api/manager/notification-settings`

**Stripe Webhooks**:
- ✅ POST `/api/stripe/webhook` - Handle subscription events
- ✅ Signature verification
- ✅ Idempotency

---

## 🚀 ROADMAP: FEATURES OM ZENCHEF/RESENGO TE OVERTREFFEN

### FASE 1: CORE IMPROVEMENTS (Q1 2025)

#### 1.1 Geavanceerd Calendar Systeem 🔴 PRIORITEIT

**Zenchef heeft**: Drag-and-drop calendar, week/day/month views
**Resengo heeft**: Timeline view, table-based calendar

**Wat we nodig hebben**:
- [ ] **Full Calendar Component**
  - Week view met tijd slots (15min increments)
  - Day view gedetailleerd
  - Month overview
  - Drag & drop bookings tussen tijdslots
  - Drag & drop tussen tafels
  - Color-coded status (green=confirmed, yellow=pending, etc.)
  - Conflict detection (visual warnings)
  
- [ ] **Table Floor Plan View**
  - Visual table layout editor
  - Drag & drop table positioning
  - Table shapes (round, square, rectangle)
  - Occupancy visualization (real-time)
  - Click table → see bookings
  - Click empty time slot → create booking
  
- [ ] **Timeline View** (Resengo-style)
  - Horizontal timeline met alle tafels
  - Booking blocks met duration
  - Easy overlapping conflict view
  - Zoom in/out functionaliteit

**UI Design**:
```css
Calendar:
- Sticky header met datum navigatie
- Sidebar met tafels/shifts
- Grid layout 15-30min slots
- Booking cards: 
  - Background: status color (opacity 20%)
  - Border: status color
  - Font: 14px, semibold
  - Info: time, party size, name
  - Hover: Shadow + scale(1.02)
```

**Technical**:
- Libraries: react-big-calendar, fullcalendar, of custom
- Real-time updates met Supabase Realtime
- Optimistic UI updates
- Conflict validation before save

#### 1.2 Waitlist Management 🔴 PRIORITEIT

**Wat concurrenten hebben**:
- Zenchef: Full waitlist met auto-notify
- Resengo: Waitlist met SMS alerts

**Features**:
- [ ] Waitlist tabel in database
  ```sql
  CREATE TABLE waitlist (
    id UUID PRIMARY KEY,
    location_id UUID,
    guest_name VARCHAR(255),
    guest_phone VARCHAR(20),
    guest_email VARCHAR(255),
    party_size INT,
    preferred_date DATE,
    preferred_time_start TIME,
    preferred_time_end TIME,
    status: WAITING | NOTIFIED | CONVERTED | EXPIRED | CANCELLED,
    notes TEXT,
    priority INT DEFAULT 0,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ
  );
  ```

- [ ] **Waitlist UI** (Manager)
  - Lijst met waiting guests
  - Priority sorting
  - Quick actions: Notify, Convert to booking, Remove
  - Filters: Date, party size, status
  
- [ ] **Auto-Notify Systeem**
  - Check voor cancellations → notify waitlist
  - Match party size & time preferences
  - SMS/Email notification: "Table available, book now!"
  - Time limit op notifications (30min response)
  
- [ ] **Consumer Waitlist**
  - "Geen beschikbaarheid? Voeg toe aan wachtlijst"
  - Form: preferred dates/times, party size
  - Notification wanneer tafel beschikbaar
  - One-click confirm

#### 1.3 Advanced Booking Rules 🟡

**Wat concurrenten hebben**:
- Time-based rules (lunch vs dinner pricing)
- Party size based deposits
- Special event pricing
- VIP tables reserveren

**Features**:
- [ ] **Time-Based Rules**
  ```sql
  CREATE TABLE booking_rules (
    id UUID PRIMARY KEY,
    location_id UUID,
    name VARCHAR(255),
    applies_to_shift_id UUID,
    day_of_week INT[],
    time_start TIME,
    time_end TIME,
    min_party_size INT,
    max_party_size INT,
    deposit_override JSONB,
    requires_approval BOOLEAN,
    max_concurrent_bookings INT,
    priority INT,
    is_active BOOLEAN
  );
  ```

- [ ] **Special Events**
  - Valentine's Day special menu + higher deposit
  - New Year's Eve premium seating
  - Private events blocking
  
- [ ] **VIP Tables**
  - Mark tables as VIP
  - Require manual approval voor VIP tables
  - Special pricing
  
- [ ] **Dynamic Pricing** (Post-MVP)
  - Peak hours = higher deposits
  - Off-peak hours = discounts
  - Last-minute deals

#### 1.4 CRM & Guest Profiles 🟡

**Wat concurrenten hebben**:
- Zenchef: Full CRM, tags, notes, visit history
- Resengo: Guest profiles, preferences

**Features**:
- [ ] **Enhanced Consumer Profiles**
  ```sql
  ALTER TABLE consumers ADD COLUMN:
    - birthday DATE
    - anniversary DATE  
    - dietary_preferences TEXT[]
    - allergies TEXT[]
    - preferred_table_type VARCHAR(50)
    - vip_status BOOLEAN
    - lifetime_visits INT
    - lifetime_spend_cents INT
    - average_party_size INT
    - favorite_location_id UUID
    - notes TEXT
    - tags TEXT[]
  ```

- [ ] **Auto-Tracking**
  - Visit count increment on completion
  - Average party size calculation
  - Preferred booking times analysis
  
- [ ] **Guest Tags**
  - VIP, Regular, First-timer, Birthday, Anniversary
  - Custom tags per restaurant
  - Filter bookings by tags
  
- [ ] **Notes & Preferences**
  - Manager kan notes toevoegen
  - "Prefers window seat"
  - "Allergic to peanuts"
  - "Regular - knows staff"
  - Automatic display bij booking

- [ ] **Birthday/Anniversary Reminders**
  - Auto-detect upcoming birthdays
  - Suggest manager to send promo
  - Auto-tag bookings around these dates

#### 1.5 Email & SMS Notifications 🔴 PRIORITEIT

**Huidige status**: ✅ In-app notifications only

**Wat we nodig hebben**:
- [ ] **Email Integration** (Resend of SendGrid)
  - Email templates (React Email)
  - Booking confirmation email
  - Reminder emails (24h, 2h voor reservering)
  - Cancellation confirmation
  - Manager notifications
  - HTML templates met branding
  
- [ ] **SMS Integration** (Twilio of MessageBird)
  - SMS booking confirmation
  - SMS reminders
  - SMS waitlist notifications
  - Phone number verification
  - International support
  
- [ ] **Templates Systeem**
  - Customizable email/SMS templates per tenant
  - Variables: {guest_name}, {date}, {time}, {location}
  - Preview functionaliteit
  - Multi-language support
  
- [ ] **Delivery Tracking**
  - Email open tracking
  - SMS delivery confirmation
  - Failed delivery handling
  - Resend functionaliteit

---

### FASE 2: COMPETITIVE ADVANTAGES (Q2 2025)

#### 2.1 Analytics & Reporting Dashboard 🟡

**Wat concurrenten hebben**:
- Zenchef: Uitgebreide analytics, export, grafiek
- Resengo: Basic reporting

**Features**:
- [ ] **Booking Analytics**
  - Total bookings per day/week/month/year
  - Conversion rates (views → bookings)
  - Average party size
  - Popular time slots
  - Peak days/times heatmap
  - No-show rate
  - Cancellation rate
  - Average booking lead time
  
- [ ] **Revenue Tracking**
  - Total revenue (deposits + no-show fees)
  - Revenue per table
  - Revenue per shift
  - Average revenue per cover
  - Projected vs actual revenue
  
- [ ] **Guest Analytics**
  - New vs returning guests
  - Guest acquisition sources
  - Most valuable guests (lifetime spend)
  - Guest retention rate
  - Demographics (als beschikbaar)
  
- [ ] **Visual Charts**
  - Line charts (bookings over time)
  - Bar charts (bookings per shift)
  - Pie charts (booking sources)
  - Heatmaps (popular tables/times)
  - Export to PDF/CSV
  
- [ ] **Comparative Analytics**
  - Compare periods (this month vs last month)
  - Compare locations
  - Industry benchmarks (post-MVP)

**UI Design**:
```
Analytics Dashboard Layout:
- Top: Date range selector + export button
- Row 1: 4 stat cards (total bookings, revenue, no-shows, conversion)
- Row 2: Large line chart (bookings trend)
- Row 3: 2 columns (shifts distribution | table popularity)
- Row 4: Guest analytics section
- All charts: R4Y colors, tooltips, responsive
```

#### 2.2 Marketing Tools 🟠

**Wat concurrenten hebben**:
- Email campaigns
- Loyalty programs
- Gift cards
- Review requests

**Features**:
- [ ] **Email Campaigns**
  - Bulk email naar guest segments
  - Campaign templates
  - Schedule sending
  - A/B testing
  - Open/click tracking
  - Unsubscribe management
  
- [ ] **Loyalty Program**
  ```sql
  CREATE TABLE loyalty_programs (
    id UUID PRIMARY KEY,
    tenant_id UUID,
    name VARCHAR(255),
    points_per_visit INT,
    points_per_euro_spent INT,
    rewards JSONB,
    is_active BOOLEAN
  );
  
  CREATE TABLE loyalty_points (
    id UUID PRIMARY KEY,
    consumer_id UUID,
    tenant_id UUID,
    points INT,
    last_visit DATE
  );
  ```
  - Points bij elke visit
  - Rewards: gratis dessert, €10 korting, etc.
  - Display points in profile
  - Automatic apply rewards
  
- [ ] **Gift Cards/Vouchers**
  - Generate gift card codes
  - Redeem at checkout
  - Track usage
  - Expiry dates
  
- [ ] **Review Requests**
  - Auto-send na completed booking
  - Link to Google/TripAdvisor/Facebook
  - Track review rate
  - Display reviews on location page

#### 2.3 POS Integration Improvements 🟠

**Huidige status**: ✅ Basic structure, OAuth ready

**Verbeteringen**:
- [ ] **Lightspeed Complete Integration**
  - Sync reserveringen naar POS
  - Sync menu items naar R4Y
  - Sync table layout
  - Real-time occupancy
  - Order totals import (voor revenue tracking)
  
- [ ] **Square Integration**
  - Same features as Lightspeed
  - Square loyalty integration
  
- [ ] **Toast Integration**
  - Voor Amerikaanse markt
  
- [ ] **Untill Integration**
  - Populair in België/Nederland
  
- [ ] **Generic API Integration**
  - Webhook support voor custom POS
  - CSV import/export
  - FTP sync

#### 2.4 Multi-Language Support 🟢

**Huidige status**: 🇳🇱 Nederlands only

**Features**:
- [ ] **i18n Setup**
  - next-intl of next-i18next
  - Language files: nl, en, fr, de, es
  - URL structure: /nl/, /en/, /fr/
  - Auto-detect browser language
  
- [ ] **Translated UI**
  - All consumer pages
  - All manager pages
  - Email templates per language
  - SMS templates per language
  
- [ ] **Location-Specific Language**
  - Restaurant kan default language instellen
  - Menu in multiple languages
  - Booking confirmations in guest language

#### 2.5 Mobile Apps 🟢 (Post-MVP)

**Native Apps**:
- [ ] **Consumer App** (React Native)
  - Browse restaurants
  - Book tables
  - View bookings
  - Push notifications
  - Favorites
  - Loyalty points
  - iOS + Android
  
- [ ] **Manager App** (React Native)
  - View today's bookings
  - Quick actions (confirm/cancel)
  - Push notifications for new bookings
  - Simplified calendar view
  - iOS + Android

---

### FASE 3: ADVANCED FEATURES (Q3 2025)

#### 3.1 AI-Powered Features 🔵

**Wat dit zou geven**:
- Competitive edge
- Modern tech stack showcase
- Automation = time savings

**Features**:
- [ ] **Smart Table Assignment**
  - AI suggests best table based on:
    - Party size
    - Historical preferences
    - Table turnover predictions
    - VIP status
  - OpenAI API of custom model
  
- [ ] **Demand Forecasting**
  - Predict busy periods
  - Suggest optimal shifts
  - Staff scheduling hints
  
- [ ] **Dynamic Pricing Suggestions**
  - Suggest deposit amounts
  - Peak hour pricing
  - Based on historical no-show rates
  
- [ ] **Chatbot Support** (Post-MVP)
  - Answer guest questions
  - Help with booking modifications
  - Integrated in widget
  - Multi-language

#### 3.2 Advanced Payment Features 🔵

**Huidige status**: ✅ Stripe subscriptions, deposits ready

**Verbeteringen**:
- [ ] **Pay-at-Table**
  - Link payment to booking
  - Guest pays via QR code
  - Tip support
  - Split bills
  
- [ ] **Automated Deposits**
  - Auto-charge deposit bij booking
  - Auto-refund bij cancellation (within policy)
  - Partial refunds
  
- [ ] **No-Show Auto-Charge**
  - Automatic charge no-show fee
  - Email notification
  - Dispute handling
  
- [ ] **Multiple Payment Methods**
  - Credit card (Stripe)
  - iDEAL (Nederland)
  - Bancontact (België)
  - Apple Pay / Google Pay
  - PayPal

#### 3.3 Event Management 🔵

**Wat concurrenten niet hebben**: Full event management

**Features**:
- [ ] **Private Events**
  - Book entire restaurant or section
  - Custom menus voor events
  - Deposit requirements
  - Event timeline
  - Guest list management
  
- [ ] **Group Bookings**
  - Large parties (12+ people)
  - Multiple tables linked
  - Special requirements
  - Menu pre-ordering
  
- [ ] **Recurring Events**
  - Weekly business lunch
  - Monthly wine tasting
  - Automatic booking creation

#### 3.4 Reviews & Ratings 🔵

**Wat concurrenten hebben**: Integrate met Google/TripAdvisor

**Native Reviews**:
- [ ] **Review System**
  ```sql
  CREATE TABLE reviews (
    id UUID PRIMARY KEY,
    location_id UUID,
    consumer_id UUID,
    booking_id UUID,
    rating INT CHECK (rating BETWEEN 1 AND 5),
    food_rating INT,
    service_rating INT,
    ambiance_rating INT,
    title VARCHAR(255),
    comment TEXT,
    response TEXT,  -- Manager response
    responded_at TIMESTAMPTZ,
    is_verified BOOLEAN,
    is_visible BOOLEAN,
    created_at TIMESTAMPTZ
  );
  ```
  
- [ ] **Features**:
  - 5-star overall + breakdown
  - Text reviews
  - Photos van gasten
  - Manager responses
  - Filter by rating
  - Sort by date/rating
  - Verified booking badge
  - Display on location page
  
- [ ] **Aggregations**:
  - Average rating per location
  - Total review count
  - Rating distribution
  - Trending up/down indicators

---

### FASE 4: ENTERPRISE FEATURES (Q4 2025)

#### 4.1 White Label Solution 🔵

**Voor restaurant groepen**:
- [ ] **Custom Branding**
  - Eigen domain (reservations.restaurant.com)
  - Volledig custom styling
  - Remove R4Y branding
  - Custom emails/SMS
  
- [ ] **Multi-Brand Management**
  - Restaurant groep met meerdere concepten
  - Shared guest database
  - Cross-brand loyalty
  - Consolidated reporting

#### 4.2 API for Partners 🔵

**Public API**:
- [ ] **REST API**
  - Booking CRUD
  - Availability check
  - Location search
  - Menu access
  - Rate limiting
  - API key management
  
- [ ] **Webhooks**
  - New booking event
  - Cancellation event
  - Custom webhooks
  
- [ ] **Documentation**
  - API docs (OpenAPI/Swagger)
  - Code examples
  - SDKs (JS, Python, PHP)

#### 4.3 Advanced Integrations 🔵

**Third-party integrations**:
- [ ] **Google Reserve**
  - Direct booking via Google Search/Maps
  - XML feed
  - Real-time sync
  
- [ ] **Facebook/Instagram Booking**
  - Book directly via social media
  - Meta Pixel integration
  - Social proof
  
- [ ] **TheFork/OpenTable Import**
  - Import existing reservations
  - Migration tool
  
- [ ] **Accounting Software**
  - Exact Online
  - Yuki
  - QuickBooks
  - Export invoices/receipts

---

## 🎯 COMPETITIVE ANALYSIS

### Zenchef

**Wat ze goed doen**:
✅ Commissievrij model  
✅ Uitgebreide analytics  
✅ Mooie calendar interface  
✅ Email/SMS campaigns  
✅ Website builder  
✅ Menu management  
✅ Review management  
✅ POS integraties  

**Wat ze missen**:
❌ Moderne tech stack (oudere codebase)  
❌ Slow performance  
❌ Moeilijke setup  
❌ Dure prijzen voor kleine restaurants  
❌ Geen AI features  
❌ Geen native mobile apps  

**Hoe we beter zijn/worden**:
✅ Snellere performance (Next.js 15, Edge)  
✅ Modernere UI/UX (Tailwind, Radix)  
✅ Eenvoudigere onboarding  
✅ Betere pricing (€49 start vs €69 Zenchef)  
🚧 AI-powered features  
🚧 Better mobile experience  

### Resengo

**Wat ze goed doen**:
✅ Timeline view  
✅ Eenvoudige interface  
✅ Goede widget  
✅ Fair pricing  
✅ Goede support  

**Wat ze missen**:
❌ Beperkte analytics  
❌ Geen marketing tools  
❌ Basic notification system  
❌ Geen loyalty program  
❌ Limited customization  

**Hoe we beter zijn/worden**:
✅ Uitgebreidere features  
✅ Modern design systeem  
✅ Notification system ✅  
✅ Guest messaging ✅  
🚧 Marketing suite  
🚧 Loyalty program  
🚧 Better analytics  

### OpenTable / TheFork

**Wat ze goed doen**:
✅ Enorme guest database  
✅ Discovery platform  
✅ Brand recognition  
✅ Mobile apps  
✅ Review system  

**Wat ze verkeerd doen**:
❌ **Commissies!** (3-5€ per cover)  
❌ Duur voor restaurants  
❌ Locked-in ecosystem  
❌ Slow innovation  
❌ Poor customer service  

**Ons voordeel**:
✅ **Commissievrij!**  
✅ Predictable pricing  
✅ Restaurant owns data  
✅ Modern platform  
✅ Better support (kleiner = persoonlijker)  
✅ Open ecosystem (API access)  

---

## 💰 PRICING STRATEGY

### Huidige Pricing

| Plan | Prijs | Locaties | Bookings | Features |
|------|-------|----------|----------|----------|
| START | €49/maand | 1 | 200/maand | Basic features |
| PRO | €99/maand | 3 | 1.000/maand | + Deposits, Waitlist, Team (3) |
| PLUS | €199/maand | Unlimited | Unlimited | + POS, API, Priority support |

### Aanbevolen Improvements

**Extra Plans**:
- [ ] **FREE Plan** (Trial forever)
  - 1 locatie
  - 50 bookings/maand
  - R4Y branding on booking page
  - Great voor kleine cafés/testing
  - Upsell naar START
  
- [ ] **ENTERPRISE Plan** (Custom pricing)
  - White label
  - Dedicated support
  - SLA guarantees
  - Custom integrations
  - Voor grote restaurant groepen (10+ locaties)

**Add-ons** (Extra revenue):
- [ ] Email/SMS bundle: +€19/maand
  - 1000 emails, 100 SMS
  - Extra per unit
  
- [ ] Marketing suite: +€29/maand
  - Campaigns, Loyalty program
  
- [ ] Advanced analytics: +€9/maand
  - Extra reports, exports
  
- [ ] AI features: +€19/maand
  - Smart assignment, forecasting

**Annual Discount**:
- [ ] 20% korting bij jaarlijks betalen
- [ ] Verhoogt customer lifetime value
- [ ] Lagere churn

---

## 🎨 UI/UX IMPROVEMENTS

### Design Principles

**Wat we volgen**:
1. **Apple-like Minimalism**
   - Veel whitespace
   - Clean typography
   - Subtle shadows
   - Focus op content
   
2. **Progressive Disclosure**
   - Show essentials first
   - Advanced features in settings
   - Geen overwhelming UI
   
3. **Speed & Responsiveness**
   - Loading states everywhere
   - Optimistic updates
   - Skeleton loaders
   - Sub-second page loads
   
4. **Accessibility**
   - WCAG 2.1 AA compliance
   - Keyboard navigation
   - Screen reader support
   - Color contrast > 4.5:1

### Specific Improvements Needed

#### Homepage
- [ ] Better hero animation (3D graphics?)
- [ ] Video explainer
- [ ] Social proof (X restaurants, Y bookings)
- [ ] Customer testimonials
- [ ] Trust badges (SSL, GDPR)

#### Discover Page
- [ ] Map view (Google Maps API)
- [ ] Filter presets ("Open now", "Accepts deposits")
- [ ] Sort options (Distance, Rating, Price)
- [ ] Infinite scroll vs pagination toggle

#### Location Detail
- [ ] Image gallery (fullscreen carousel)
- [ ] 360° virtual tour (post-MVP)
- [ ] Live availability preview
- [ ] Social media feed integration
- [ ] Related restaurants suggestions

#### Booking Modal
- [ ] Progress indicator (Step 1 of 3)
- [ ] Time slot suggestions ("Popular times")
- [ ] Special occasion toggle (Birthday, Anniversary)
- [ ] Accessibility needs checkbox
- [ ] Estimated wait time display

#### Manager Dashboard
- [ ] Customizable dashboard (drag & drop widgets)
- [ ] Dark mode toggle
- [ ] Quick stats toggle (show/hide cards)
- [ ] Keyboard shortcuts
- [ ] Command palette (CMD+K)

#### Mobile Experience
- [ ] Bottom navigation
- [ ] Swipe gestures
- [ ] Pull to refresh
- [ ] Native-like transitions
- [ ] Offline mode (cache bookings)

---

## 🔧 TECHNICAL IMPROVEMENTS

### Performance

**Current**:
- Average page load: ~1-2s
- Time to Interactive: ~2-3s

**Goals**:
- [ ] Average page load: <1s
- [ ] Time to Interactive: <1.5s
- [ ] Lighthouse score: >95
- [ ] Core Web Vitals: All green

**Actions**:
- [ ] Image optimization (Next.js Image, WebP, lazy loading)
- [ ] Code splitting (dynamic imports)
- [ ] Edge caching (Vercel Edge Network)
- [ ] Database query optimization
- [ ] Bundle size reduction (<300KB)
- [ ] Font optimization (font-display: swap)

### Scalability

**Current capacity**:
- ~1000 concurrent users (estimate)
- ~10,000 bookings/day (estimate)

**Goals**:
- [ ] 10,000+ concurrent users
- [ ] 100,000+ bookings/day
- [ ] 99.9% uptime

**Actions**:
- [ ] Database connection pooling
- [ ] Redis caching layer
- [ ] CDN voor static assets
- [ ] Horizontal scaling (Vercel auto-scales)
- [ ] Database read replicas (Supabase)
- [ ] Rate limiting improvements
- [ ] DDoS protection (Cloudflare)

### Monitoring & Observability

- [ ] **Error Tracking**: Sentry integration
- [ ] **Performance Monitoring**: Vercel Analytics + custom
- [ ] **Uptime Monitoring**: UptimeRobot or Pingdom
- [ ] **Logging**: Structured logging (Winston/Pino)
- [ ] **Metrics Dashboard**: Grafana or Datadog
- [ ] **Alerts**: PagerDuty for critical issues

### Testing

**Current**: ❌ Minimal testing

**Needed**:
- [ ] **Unit Tests**: Jest + React Testing Library
  - Target: >80% coverage
  - All utils, hooks, components
  
- [ ] **Integration Tests**: Playwright or Cypress
  - Booking flow end-to-end
  - Manager dashboard flows
  - Payment flows
  
- [ ] **API Tests**: Supertest
  - All endpoints
  - Auth & permissions
  
- [ ] **Visual Regression**: Chromatic or Percy
  - Component library
  - Key pages
  
- [ ] **Load Testing**: k6 or Artillery
  - Peak load scenarios
  - Breaking point tests

### Database Optimization

- [ ] **Query Optimization**
  - Add missing indexes
  - Analyze slow queries
  - Use EXPLAIN ANALYZE
  
- [ ] **Partitioning** (for scale)
  - Partition bookings by date
  - Archive old bookings
  
- [ ] **Materialized Views**
  - Pre-aggregate analytics
  - Faster dashboard loads
  
- [ ] **Full-Text Search**
  - PostgreSQL full-text search
  - Or Algolia for advanced search

---

## 📱 MARKETING & GO-TO-MARKET

### Target Markets

**Primary**: 🇧🇪 België, 🇳🇱 Nederland
**Secondary**: 🇩🇪 Duitsland, 🇫🇷 Frankrijk
**Future**: 🇬🇧 UK, 🇪🇸 Spanje, 🇮🇹 Italië

### Customer Segments

**1. Small Independent Restaurants**
- 1-2 locaties
- 20-50 seats
- Limited tech budget
- **Pain**: No-shows, phone bookings, tijd verspilling
- **Solution**: START plan, easy setup, reliable

**2. Mid-size Restaurant Groups**
- 3-10 locaties
- 50-150 seats per locatie
- Have POS, need integration
- **Pain**: Fragmented systems, no overview
- **Solution**: PRO/PLUS plan, multi-location, analytics

**3. Enterprise Restaurant Groups**
- 10+ locaties
- Chain/franchise
- Complex needs
- **Pain**: Custom requirements, white label
- **Solution**: ENTERPRISE plan, dedicated support

### Marketing Channels

**1. Content Marketing**
- [ ] Blog: "How to reduce no-shows"
- [ ] SEO: "restaurant reserveringssysteem"
- [ ] Video tutorials: YouTube
- [ ] Case studies: Success stories

**2. Paid Advertising**
- [ ] Google Ads: "reserveringssysteem restaurant"
- [ ] Facebook/Instagram: Visual ads
- [ ] LinkedIn: B2B targeting
- [ ] Retargeting campaigns

**3. Partnerships**
- [ ] POS vendors: Lightspeed, Untill
- [ ] Restaurant consultants
- [ ] Horeca associations
- [ ] Food bloggers/influencers

**4. Sales**
- [ ] Direct sales team (later)
- [ ] Demo calls
- [ ] Free trial (14 days)
- [ ] Money-back guarantee

### Growth Metrics

**North Star Metric**: Active Bookings per Month

**Key Metrics**:
- MRR (Monthly Recurring Revenue)
- Customer Acquisition Cost (CAC)
- Customer Lifetime Value (LTV)
- Churn rate
- NPS (Net Promoter Score)
- Trial → Paid conversion rate

**Goals Year 1**:
- 100 paying customers
- €10,000 MRR
- <5% monthly churn
- NPS > 50

---

## 🚦 IMPLEMENTATION PRIORITY

### Must-Have (Q1 2025) 🔴

1. ✅ Advanced Calendar (drag & drop)
2. ✅ Waitlist Management
3. ✅ Email Notifications (Resend)
4. ✅ SMS Notifications (Twilio)
5. ⚠️ Better Analytics Dashboard
6. ⚠️ Testing Suite (unit + e2e)

### Should-Have (Q2 2025) 🟡

1. Marketing Tools (campaigns, loyalty)
2. Multi-language (NL, EN, FR, DE)
3. CRM & Guest Profiles
4. POS Integration (Lightspeed complete)
5. Review System
6. Mobile-optimized experience

### Nice-to-Have (Q3 2025) 🟢

1. AI Features (smart assignment)
2. Mobile Apps (React Native)
3. Event Management
4. Advanced Payment Features
5. White Label Option

### Future (Q4 2025+) 🔵

1. Public API
2. Third-party integrations (Google Reserve)
3. Advanced AI (forecasting)
4. International expansion tools

---

## 📊 SUCCESS METRICS

### Product Metrics

**Engagement**:
- Daily Active Managers (DAM)
- Weekly Active Consumers (WAC)
- Bookings per location per month
- Average session duration

**Retention**:
- Monthly churn rate: <5%
- 6-month retention: >80%
- Annual renewal rate: >90%

**Quality**:
- No-show rate: <10%
- Booking confirmation time: <5min average
- Customer support tickets: <2 per customer per month
- Bug reports: <1 per week

### Business Metrics

**Revenue**:
- MRR growth: +20% month-over-month (Year 1)
- Average Revenue Per User (ARPU): €75
- LTV:CAC ratio: >3:1

**Market**:
- Market share België/Nederland: 5% (Year 2)
- Brand awareness: Top 3 in category

---

## 🎓 LEARNING & DOCUMENTATION

### Documentation Needed

- [ ] **User Guides**
  - Manager quickstart
  - Feature guides
  - Video tutorials
  - FAQ
  
- [ ] **Developer Docs**
  - Architecture overview
  - API documentation
  - Database schema
  - Contributing guide
  
- [ ] **Marketing Materials**
  - Product brochure
  - Feature comparison sheet
  - Case studies
  - Press kit

### Knowledge Base

- [ ] Help center (Intercom or Zendesk)
- [ ] Chatbot for common questions
- [ ] Community forum
- [ ] Webinars voor onboarding

---

## 🎉 CONCLUSION

R4Y heeft een **solide basis** met moderne technologie en een goed doordacht multi-tenant systeem. Om Zenchef en Resengo te overtreffen, moeten we focussen op:

### Onze Sterke Punten:
✅ Moderne tech stack (Next.js 15, TypeScript, Supabase)
✅ Snelle performance
✅ Mooie, professionele UI
✅ Commissievrij model
✅ Goede pricing
✅ Uitbreidbaar systeem

### Wat We Moeten Toevoegen:
🔴 Advanced calendar met drag & drop
🔴 Email/SMS notificaties
🔴 Waitlist management
🟡 Uitgebreide analytics
🟡 Marketing tools
🟡 Multi-language support
🟢 AI features
🟢 Mobile apps

### Concurrentievoordeel:
1. **Technologie**: Modernste stack = snelste, meest betrouwbare
2. **Prijs**: Betaalbaar voor kleine restaurants
3. **UX**: Makkelijkste setup & daily use
4. **Innovatie**: AI features die anderen niet hebben
5. **Support**: Persoonlijke service, snelle response

**Met deze roadmap kunnen we binnen 12 maanden een toonaangevend reserveringsplatform worden in de Benelux, en daarna internationaal uitbreiden.**

---

**Document Versie**: 2.0  
**Laatst Bijgewerkt**: 24 Oktober 2025  
**Volgende Review**: 1 December 2025  
**Eigenaar**: Product Team R4Y

