# Reserve4You - Complete Project Documentatie

**Versie:** 1.0  
**Datum:** Januari 2025  
**Status:** Live Platform  
**Doel:** Uitgebreide beschrijving van alle functies en database structuur

---

## 📋 INHOUDSOPGAVE

1. [Project Overzicht](#project-overzicht)
2. [Technische Stack](#technische-stack)
3. [Applicatie Functies](#applicatie-functies)
4. [Database Schema](#database-schema)
5. [API Endpoints](#api-endpoints)
6. [Componenten Overzicht](#componenten-overzicht)
7. [Beveiliging & RLS](#beveiliging--rls)

---

## 🎯 PROJECT OVERZICHT

### Wat is Reserve4You?

Reserve4You (R4Y) is een **universeel reserveringsplatform** voor alle appointment-based bedrijven. Het platform verbindt consumenten met bedrijven die op afspraak werken - van restaurants tot kappers, van dokters tot fitness studio's.

### Kernconcept

**"Het Stripe van Booking Systemen"** - Net zoals Stripe alle soorten betalingen kan verwerken zonder dat developers voor elke betalingstype nieuwe code hoeven te schrijven, kan Reserve4You alle soorten reserveringen afhandelen - ongeacht sector.

**Kernprincipe:** Één platform, 43+ sectoren, zero UI-wijzigingen nodig.

### Smart Terminology Mapping

Reserve4You gebruikt een **terminology mapping systeem** dat automatisch de juiste sector-specifieke termen toont zonder UI-code te wijzigen:

| Sector | Action Button | Resource | Customer | Staff |
|--------|---------------|----------|----------|-------|
| **Restaurant** | "Reserveer Tafel" | "Tafel" | "Gast" | "Personeel" |
| **Beauty Salon** | "Boek Afspraak" | "Behandelkamer" | "Klant" | "Specialist" |
| **Medical** | "Maak Afspraak" | "Spreekkamer" | "Patiënt" | "Arts" |

---

## 🛠️ TECHNISCHE STACK

### Frontend
- **Framework:** Next.js 15 (App Router)
- **Taal:** TypeScript
- **Styling:** Tailwind CSS 4.1.7
- **UI Components:** Radix UI + shadcn/ui
- **State Management:** React Query (TanStack Query)
- **Forms:** React Hook Form + Zod validation
- **Animations:** Framer Motion, GSAP
- **Maps:** Leaflet + React Leaflet
- **Calendar:** React Big Calendar

### Backend
- **Database:** PostgreSQL (Supabase)
- **Auth:** Supabase Auth
- **Storage:** Supabase Storage
- **Payments:** Stripe
- **Email:** Resend + Nodemailer
- **AI:** OpenAI (Chatbot)

### Infrastructure
- **Hosting:** Vercel
- **Database Hosting:** Supabase
- **CDN:** Vercel Edge Network
- **Monitoring:** Vercel Analytics

---

## 🚀 APPLICATIE FUNCTIES

### 1. Consumer Experience (Consumenten App)

#### 1.1 Homepage (`/`)
- **Hero Section** met moderne grid distortion effect
- **Featured Restaurants** grid (12 locaties)
- **Populaire keukens** sectie
- **Restaurant owner CTA** sectie
- **Floating staff login** button
- **Responsive design** voor alle devices

#### 1.2 Discover Page (`/discover`)
- **Zoekfunctionaliteit** met real-time search
- **Filters:**
  - Keuken type
  - Prijsklasse (1-4)
  - Stad
  - Beschikbaarheid
  - Rating
- **Location grid** met cards
- **Map view** met Leaflet integratie
- **Loading states** & skeletons
- **Empty states** met suggesties

#### 1.3 Location Detail (`/p/[slug]`)
- **Hero image** met gradient overlay
- **Restaurant informatie:**
  - Naam, keuken type, prijsklasse
  - Rating en aantal reviews
  - Beschrijving
- **Openingstijden** display
- **Adres en contact info**
- **Promoties** display
- **Menu weergave** (als beschikbaar)
- **Reviews** sectie met sterren rating
- **"Reserveren" button** → booking modal

#### 1.4 Booking Flow
**3-stap booking proces:**

**Stap 1: Gasten & Datum**
- Party size selector
- Datum picker
- Beschikbare tijd slots (real-time)

**Stap 2: Details**
- Gast naam (verplicht)
- Email (verplicht)
- Telefoon (optioneel)
- Speciale verzoeken

**Stap 3: Bevestiging**
- Booking overzicht
- Auto-accept of manual approval
- Email bevestiging
- Success screen met booking details

**Features:**
- ✅ Real-time availability check
- ✅ Guest checkout (no account needed)
- ✅ Idempotency keys voor duplicate prevention
- ✅ Transaction safety (SERIALIZABLE)
- ✅ Email notifications

#### 1.5 Profile (`/profile`)
- **Persoonlijke informatie:**
  - Naam, email, telefoon
  - Profielfoto upload
  - Bio
- **Booking historie:**
  - Upcoming bookings
  - Past bookings
  - Booking details met status
- **Favorieten** lijst
- **Reviews** geschreven
- **Abonnement sectie** (voor managers)
- **Accountinstellingen:**
  - Taal (NL/FR/EN)
  - Notificaties
  - Privacy instellingen

#### 1.6 Favorites (`/favorites`)
- **Smart Favorites System:**
  - Sla locaties op als favoriet
  - Alerts bij nieuwe beschikbaarheid
  - Insights (bijv. "Populair op vrijdagavond")
  - Quick booking links
- **Grid view** met location cards
- **Filter & sort** opties

#### 1.7 Bookings (`/bookings`)
- **Booking overzicht:**
  - Upcoming bookings
  - Past bookings
- **Booking details:**
  - Datum, tijd, locatie
  - Party size
  - Status
  - Special requests
- **Acties:**
  - Annuleren
  - Wijzigen
  - Review schrijven

#### 1.8 Notifications (`/notifications`)
- **In-app notifications:**
  - Booking confirmaties
  - Booking reminders
  - Review requests
  - Messages
  - Favorites alerts
- **Real-time updates**
- **Mark as read** functionaliteit
- **Notification settings**

#### 1.9 Social Features (`/feed`, `/friends`)
- **Activity Feed:**
  - Booking shares
  - Reviews
  - Photos
  - Check-ins
  - Follows
- **Social Graph:**
  - Follow/unfollow users
  - Followers/following lijst
- **Interactions:**
  - Likes op activiteiten
  - Comments op activiteiten
- **Moment Photos:**
  - Upload foto's bij bookings
  - Captions en tags
- **Booking Companions:**
  - Nodig vrienden uit voor bookings
  - Accept/decline invites

#### 1.10 Messaging (`/messages`)
- **iMessage-achtige berichten:**
  - Conversations tussen gebruikers
  - Text messages
  - Location sharing
  - System messages
- **Features:**
  - Read/unread status
  - Archive functionaliteit
  - Notifications enabled/disabled
  - Last message preview

#### 1.11 Search (`/search`)
- **Geavanceerde zoekfunctionaliteit:**
  - Zoek op naam, keuken, stad
  - Filters (prijs, rating, beschikbaarheid)
  - Map view
  - List view
- **Google Places integratie** voor adres autocomplete

---

### 2. Manager Portal (Bedrijfseigenaren)

#### 2.1 Onboarding (`/manager/onboarding`)
**7-stap wizard:**

**Stap 1: Bedrijfsinformatie**
- Bedrijfsnaam
- Brand color
- Logo upload

**Stap 2: Locatie Details**
- Locatie naam
- Adres (met Google Places)
- Contact informatie
- Openingstijden

**Stap 3: Tafels & Resources**
- Tafels toevoegen
- Seats per tafel
- Combinable tables
- Floor plan editor

**Stap 4: Shifts**
- Service periodes (lunch, dinner)
- Openingstijden per dag
- Slot duration
- Buffer minutes

**Stap 5: Policies**
- Cancellation policy
- No-show fees
- Deposits
- Max party size

**Stap 6: Team**
- Team members toevoegen
- Rollen toewijzen (OWNER/MANAGER/STAFF)
- Email invites

**Stap 7: Abonnement**
- Plan selectie (START/PRO/PLUS)
- Stripe checkout
- Billing informatie

#### 2.2 Dashboard (`/manager/[tenantId]/dashboard`)
- **Real-time Stats:**
  - Vandaag (met gasten)
  - Bevestigd
  - Pending
  - Bezettingsgraad
- **Advanced Filters:**
  - Status filters
  - Search by name/email/phone
  - View modes (List/Grid/Calendar)
- **Booking Management:**
  - Quick actions per status
  - One-click bevestigen/annuleren/no-show
  - Authorization checks
- **Multi-location:**
  - Location switcher
  - Per-location stats
  - Add nieuwe vestiging
  - Delete vestiging

#### 2.3 Calendar (`/manager/[tenantId]/calendar`)
- **Calendar View:**
  - Week/Day toggle
  - Tables as columns
  - Bookings as draggable blocks
  - Time slots (15min increments)
- **Features:**
  - Drag & drop bookings
  - Time slot editing
  - Table assignment
  - Booking details modal
- **Multi-location support**

#### 2.4 CRM (`/manager/[tenantId]/crm`)
- **Customer Relationship Management:**
  - Customer database
  - Booking history per customer
  - Customer notes
  - Tags & segments
- **Insights:**
  - Repeat customers
  - Average party size
  - Preferred times
  - Lifetime value

#### 2.5 Waitlist (`/manager/[tenantId]/waitlist`)
- **Smart Waitlist System:**
  - Automatische wachtlijst bij vol
  - Notificaties bij beschikbaarheid
  - Auto-confirm bij cancellatie
- **Management:**
  - Waitlist overzicht
  - Manual confirm
  - Remove from waitlist

#### 2.6 Settings (`/manager/[tenantId]/settings`)
**Tabs:**

**Locatie:**
- Address, hours
- Contact info
- Images upload
- SEO settings

**Tafels & Shifts:**
- Tables management
- Shifts management
- Floor plan editor

**Beleid:**
- Cancellation policy
- No-show fees
- Deposits
- Booking rules

**Team:**
- Members management
- Roles & permissions
- Email invites
- Staff login (PIN)

**Integraties:**
- Lightspeed POS
- Stripe Connect
- Google Places

**Facturatie:**
- Current plan
- Usage (bookings this month, quota)
- Upgrade/downgrade
- Stripe Customer Portal link

**Notifications:**
- Email notifications
- In-app notifications
- Notification preferences

#### 2.7 Reviews Management
- **Reviews overzicht:**
  - Alle reviews per locatie
  - Rating distribution
  - Verified reviews
- **Features:**
  - Reply to reviews
  - Flag inappropriate reviews
  - Review statistics

#### 2.8 Guest Messaging
- **Messaging Panel:**
  - Conversations met guests
  - Send messages
  - Message history
- **Features:**
  - Quick replies
  - Message templates
  - Notification settings

#### 2.9 Promotions Manager
- **Promoties beheer:**
  - Create promotions
  - Discount codes
  - Time-limited offers
  - Display op location page

#### 2.10 Menu Manager
- **Menu beheer:**
  - Menu items toevoegen
  - Categories
  - Prices
  - Images
  - Display op location page

#### 2.11 Widget Manager
- **Embeddable Widget:**
  - Generate widget code
  - Customize styling
  - Embed op website
  - Track widget usage

---

### 3. Staff Login (Personeel)

#### 3.1 PIN Login (`/staff-login/[slug]`)
- **PIN-based login:**
  - Geen volledige account nodig
  - PIN code per locatie
  - Limited permissions
- **Features:**
  - Toegang alleen tot bookings van die locatie
  - Geen toegang tot settings/billing
  - Calendar view (read-only of limited edit)
  - Booking confirmations

#### 3.2 Email Login (`/staff-login-email`)
- **Email-based staff login:**
  - Email + password
  - Location-specific access
  - Role-based permissions

---

### 4. Multi-Sector Support

#### 4.1 Supported Sectors (43+)
**Hospitality:**
- RESTAURANT
- CAFE
- BAR

**Beauty & Wellness:**
- BEAUTY_SALON
- HAIR_SALON
- NAIL_STUDIO
- SPA
- MASSAGE_THERAPY
- TANNING_SALON

**Healthcare:**
- MEDICAL_PRACTICE
- DENTIST
- PHYSIOTHERAPY
- PSYCHOLOGY
- VETERINARY

**Fitness & Sports:**
- GYM
- YOGA_STUDIO
- PERSONAL_TRAINING
- DANCE_STUDIO
- MARTIAL_ARTS

**Professional Services:**
- LEGAL
- ACCOUNTING
- CONSULTING
- FINANCIAL_ADVISORY

**Education:**
- TUTORING
- MUSIC_LESSONS
- LANGUAGE_SCHOOL
- DRIVING_SCHOOL

**Automotive:**
- CAR_REPAIR
- CAR_WASH
- CAR_RENTAL

**Home Services:**
- CLEANING
- PLUMBING
- ELECTRICIAN
- GARDENING

**Events & Entertainment:**
- EVENT_VENUE
- PHOTO_STUDIO
- ESCAPE_ROOM
- BOWLING

**Accommodation:**
- HOTEL
- VACATION_RENTAL
- COWORKING_SPACE
- MEETING_ROOM

#### 4.2 Resource Types
- **TABLE** - Restaurant tables
- **ROOM** - Treatment rooms, meeting rooms
- **STAFF** - Employees, doctors, trainers
- **EQUIPMENT** - Massage tables, gym equipment
- **VEHICLE** - Cars for repair/rental
- **SPACE** - Generic space (coworking, event venue)

#### 4.3 Service Offerings
- Services/Treatments/Classes per sector
- Duration
- Price
- Staff assignment
- Resources required

#### 4.4 Recurring Bookings
- Recurring booking patterns
- Weekly/Monthly repeats
- Automatic creation
- Cancellation handling

#### 4.5 Intake Forms
- Pre-booking questionnaires
- Custom fields per sector
- Required/optional fields
- Data storage

---

### 5. Billing & Subscriptions

#### 5.1 Subscription Plans

**START (€49/maand):**
- 1 locatie
- 200 bookings/maand
- Basic features
- Email support

**PRO (€99/maand):**
- 3 locaties
- 1000 bookings/maand
- Advanced features
- Priority support

**PLUS (€199/maand):**
- Unlimited locaties
- Unlimited bookings
- All features
- Dedicated support

#### 5.2 Billing Features
- **Stripe Integration:**
  - Subscription checkout
  - Payment processing
  - Customer portal
  - Webhook handling
- **Usage Tracking:**
  - Bookings per month
  - Quota enforcement
  - Upgrade prompts
- **Billing Gate:**
  - Cannot publish without active subscription
  - Read-only mode bij expired subscription

---

### 6. Integrations

#### 6.1 Lightspeed POS
- **OAuth Integration:**
  - Connect Lightspeed account
  - Sync menu items
  - Sync bookings
  - Webhook support

#### 6.2 Google Places
- **Address Autocomplete:**
  - Google Places API
  - Address validation
  - Geocoding
  - Map integration

#### 6.3 Stripe Connect
- **Payment Processing:**
  - Connect account setup
  - Payment intents
  - Refunds
  - Payouts

---

### 7. AI Features

#### 7.1 AI Chatbot
- **Chatbot Integration:**
  - OpenAI GPT integration
  - Context-aware responses
  - Booking assistance
  - FAQ handling

#### 7.2 AI Analytics
- **Smart Insights:**
  - Booking predictions
  - Peak time analysis
  - Customer behavior insights
  - Revenue forecasting

---

## 🗄️ DATABASE SCHEMA

### Core Tables

#### 1. `tenants` (Organisaties/Bedrijfsgroepen)
```sql
- id (UUID, PK)
- name (VARCHAR(255))
- brand_color (VARCHAR(7))
- logo_url (TEXT)
- owner_user_id (UUID, FK → auth.users)
- created_at, updated_at (TIMESTAMPTZ)
```

#### 2. `memberships` (Team members met rollen)
```sql
- id (UUID, PK)
- tenant_id (UUID, FK → tenants)
- user_id (UUID, FK → auth.users)
- role (ENUM: OWNER, MANAGER, STAFF)
- created_at (TIMESTAMPTZ)
UNIQUE(tenant_id, user_id)
```

#### 3. `locations` (Bedrijfslocaties)
```sql
- id (UUID, PK)
- tenant_id (UUID, FK → tenants)
- name (VARCHAR(255))
- slug (VARCHAR(255), UNIQUE)
- description (TEXT)
- business_sector (ENUM: RESTAURANT, BEAUTY_SALON, etc.)
- sector_config (JSONB)
- cuisine_type (VARCHAR(100))
- price_range (INT, 1-4)
- address_line1, address_line2 (VARCHAR(255))
- city, postal_code, country (VARCHAR)
- latitude, longitude (DECIMAL)
- phone, email, website (VARCHAR)
- opening_hours (JSONB)
- is_public, is_active (BOOLEAN)
- auto_accept_bookings (BOOLEAN)
- staff_login_slug (VARCHAR)
- hero_image_url, meta_description (TEXT)
- review_count (INT)
- average_rating (DECIMAL(3,2))
- rating_distribution (JSONB)
- created_at, updated_at (TIMESTAMPTZ)
```

#### 4. `tables` (Restaurant tafels / Resources)
```sql
- id (UUID, PK)
- location_id (UUID, FK → locations)
- name (VARCHAR(50))
- seats (INT)
- min_seats, max_seats (INT)
- is_combinable (BOOLEAN)
- group_id (VARCHAR(50))
- position_x, position_y (INT)
- is_active (BOOLEAN)
- created_at, updated_at (TIMESTAMPTZ)
UNIQUE(location_id, name)
```

#### 5. `resources` (Universele resources - Multi-sector)
```sql
- id (UUID, PK)
- location_id (UUID, FK → locations)
- resource_type (ENUM: TABLE, ROOM, STAFF, EQUIPMENT, VEHICLE, SPACE)
- name (VARCHAR(255))
- capacity (INT)
- metadata (JSONB)
- is_active (BOOLEAN)
- created_at, updated_at (TIMESTAMPTZ)
```

#### 6. `service_offerings` (Services/Aanbiedingen)
```sql
- id (UUID, PK)
- location_id (UUID, FK → locations)
- name (VARCHAR(255))
- description (TEXT)
- duration_minutes (INT)
- price_cents (INT)
- resource_type_required (ENUM)
- assigned_staff_id (UUID)
- is_active (BOOLEAN)
- created_at, updated_at (TIMESTAMPTZ)
```

#### 7. `shifts` (Service periodes)
```sql
- id (UUID, PK)
- location_id (UUID, FK → locations)
- name (VARCHAR(100))
- day_of_week (INT[])
- start_time, end_time (TIME)
- slot_duration_minutes (INT)
- buffer_minutes (INT)
- max_concurrent_bookings (INT)
- is_active (BOOLEAN)
- created_at, updated_at (TIMESTAMPTZ)
```

#### 8. `policies` (Booking regels)
```sql
- id (UUID, PK)
- location_id (UUID, FK → locations, UNIQUE)
- cancellation_hours (INT)
- allow_same_day_booking (BOOLEAN)
- no_show_fee_enabled (BOOLEAN)
- no_show_fee_cents (INT)
- deposit_required (BOOLEAN)
- deposit_type (VARCHAR: PERCENT, FIXED)
- deposit_value (INT)
- deposit_applies_to_party_size (INT)
- max_party_size (INT)
- advance_booking_days (INT)
- created_at, updated_at (TIMESTAMPTZ)
```

#### 9. `consumers` (Gasten)
```sql
- id (UUID, PK)
- auth_user_id (UUID, FK → auth.users, nullable)
- name (VARCHAR(255))
- phone (VARCHAR(20))
- email (VARCHAR(255))
- phone_verified (BOOLEAN)
- profile_picture_url (TEXT)
- bio (TEXT)
- favorite_cuisines (TEXT[])
- top_3_restaurants (UUID[])
- is_profile_public (BOOLEAN)
- show_in_discover (BOOLEAN)
- created_at, updated_at (TIMESTAMPTZ)
UNIQUE(auth_user_id)
```

#### 10. `bookings` (Reserveringen)
```sql
- id (UUID, PK)
- location_id (UUID, FK → locations)
- table_id (UUID, FK → tables, nullable)
- resource_id (UUID, FK → resources, nullable)
- service_offering_id (UUID, FK → service_offerings, nullable)
- consumer_id (UUID, FK → consumers, nullable)
- guest_name, guest_phone, guest_email (VARCHAR)
- party_size (INT)
- start_time, end_time (TIMESTAMPTZ)
- status (ENUM: PENDING, CONFIRMED, CANCELLED, NO_SHOW, COMPLETED, WAITLIST)
- payment_status (ENUM: NONE, REQUIRES_PAYMENT, PAID, FAILED, REFUNDED)
- stripe_payment_intent_id (TEXT)
- deposit_amount_cents (INT)
- guest_note, internal_note (TEXT)
- source (VARCHAR)
- idempotency_key (VARCHAR(255), UNIQUE)
- created_at, updated_at (TIMESTAMPTZ)
- created_by (UUID, FK → auth.users)
```

#### 11. `recurring_booking_patterns` (Terugkerende boekingen)
```sql
- id (UUID, PK)
- location_id (UUID, FK → locations)
- consumer_id (UUID, FK → consumers)
- pattern_type (ENUM: DAILY, WEEKLY, MONTHLY)
- pattern_config (JSONB)
- start_date, end_date (DATE)
- is_active (BOOLEAN)
- created_at, updated_at (TIMESTAMPTZ)
```

#### 12. `intake_forms` (Intake formulieren)
```sql
- id (UUID, PK)
- location_id (UUID, FK → locations)
- name (VARCHAR(255))
- fields (JSONB)
- is_active (BOOLEAN)
- created_at, updated_at (TIMESTAMPTZ)
```

#### 13. `billing_state` (Abonnement status)
```sql
- tenant_id (UUID, PK, FK → tenants)
- stripe_customer_id (TEXT, UNIQUE)
- stripe_subscription_id (TEXT, UNIQUE)
- plan (ENUM: START, PRO, PLUS)
- status (ENUM: ACTIVE, PAST_DUE, CANCELLED, TRIALING)
- max_locations (INT)
- max_bookings_per_month (INT)
- bookings_used_this_month (INT)
- current_period_start, current_period_end (TIMESTAMPTZ)
- trial_end (TIMESTAMPTZ)
- created_at, updated_at (TIMESTAMPTZ)
```

#### 14. `favorites` (Favorieten)
```sql
- id (UUID, PK)
- consumer_id (UUID, FK → consumers)
- location_id (UUID, FK → locations)
- created_at (TIMESTAMPTZ)
UNIQUE(consumer_id, location_id)
```

#### 15. `reviews` (Reviews)
```sql
- id (UUID, PK)
- location_id (UUID, FK → locations)
- consumer_id (UUID, FK → consumers)
- booking_id (UUID, FK → bookings, nullable)
- rating (INT, 1-5)
- title (VARCHAR(255))
- comment (TEXT)
- is_verified (BOOLEAN)
- visit_date (DATE)
- is_published (BOOLEAN)
- is_flagged (BOOLEAN)
- flagged_reason (TEXT)
- created_at, updated_at (TIMESTAMPTZ)
UNIQUE(booking_id)
UNIQUE(location_id, consumer_id, visit_date)
```

#### 16. `review_replies` (Review reacties)
```sql
- id (UUID, PK)
- review_id (UUID, FK → reviews)
- user_id (UUID, FK → auth.users)
- comment (TEXT)
- created_at, updated_at (TIMESTAMPTZ)
UNIQUE(review_id)
```

#### 17. `notifications` (Notificaties)
```sql
- id (UUID, PK)
- user_id (UUID, FK → auth.users)
- type (ENUM: BOOKING_CONFIRMED, BOOKING_CANCELLED, etc.)
- priority (ENUM: LOW, MEDIUM, HIGH, URGENT)
- title, message (TEXT)
- booking_id, location_id, tenant_id (UUID, nullable)
- action_url, action_label (TEXT)
- read, archived (BOOLEAN)
- metadata (JSONB)
- created_at, updated_at, read_at (TIMESTAMPTZ)
```

#### 18. `conversations` (Gesprekken)
```sql
- id (UUID, PK)
- created_at, updated_at (TIMESTAMPTZ)
- last_message_at (TIMESTAMPTZ)
- last_message_preview (TEXT)
```

#### 19. `conversation_participants` (Gespreksdeelnemers)
```sql
- id (UUID, PK)
- conversation_id (UUID, FK → conversations)
- consumer_id (UUID, FK → consumers)
- joined_at (TIMESTAMPTZ)
- last_read_at (TIMESTAMPTZ)
- is_archived (BOOLEAN)
- notifications_enabled (BOOLEAN)
- created_at (TIMESTAMPTZ)
UNIQUE(conversation_id, consumer_id)
```

#### 20. `messages` (Berichten)
```sql
- id (UUID, PK)
- conversation_id (UUID, FK → conversations)
- sender_id (UUID, FK → consumers)
- message_type (VARCHAR: text, location, system)
- message_content (TEXT)
- location_id (UUID, FK → locations, nullable)
- location_data (JSONB)
- created_at, updated_at, deleted_at (TIMESTAMPTZ)
- is_edited (BOOLEAN)
```

#### 21. `message_reads` (Gelezen status)
```sql
- id (UUID, PK)
- message_id (UUID, FK → messages)
- consumer_id (UUID, FK → consumers)
- read_at (TIMESTAMPTZ)
UNIQUE(message_id, consumer_id)
```

### Social Tables

#### 22. `follows` (Volgers)
```sql
- id (UUID, PK)
- follower_id (UUID, FK → consumers)
- following_id (UUID, FK → consumers)
- created_at (TIMESTAMPTZ)
UNIQUE(follower_id, following_id)
CHECK(follower_id != following_id)
```

#### 23. `location_follows` (Locatie volgers)
```sql
- consumer_id (UUID, FK → consumers)
- location_id (UUID, FK → locations)
- created_at (TIMESTAMPTZ)
PRIMARY KEY (consumer_id, location_id)
```

#### 24. `activity_feed` (Activity feed)
```sql
- id (UUID, PK)
- actor_id (UUID, FK → consumers)
- activity_type (VARCHAR: booking, review, photo, check_in, follow)
- target_type (VARCHAR: location, booking, review, consumer)
- target_id (UUID)
- metadata (JSONB)
- is_public (BOOLEAN)
- created_at (TIMESTAMPTZ)
```

#### 25. `moment_photos` (Moment foto's)
```sql
- id (UUID, PK)
- booking_id (UUID, FK → bookings, nullable)
- location_id (UUID, FK → locations)
- consumer_id (UUID, FK → consumers)
- photo_url (TEXT)
- caption (TEXT)
- tags (TEXT[])
- is_public (BOOLEAN)
- created_at (TIMESTAMPTZ)
```

#### 26. `feed_likes` (Likes)
```sql
- id (UUID, PK)
- activity_id (UUID, FK → activity_feed)
- consumer_id (UUID, FK → consumers)
- created_at (TIMESTAMPTZ)
UNIQUE(activity_id, consumer_id)
```

#### 27. `feed_comments` (Comments)
```sql
- id (UUID, PK)
- activity_id (UUID, FK → activity_feed)
- consumer_id (UUID, FK → consumers)
- comment_text (TEXT)
- created_at, updated_at (TIMESTAMPTZ)
```

#### 28. `booking_companions` (Booking metgezellen)
```sql
- id (UUID, PK)
- booking_id (UUID, FK → bookings)
- consumer_id (UUID, FK → consumers)
- invited_by (UUID, FK → consumers, nullable)
- status (VARCHAR: invited, accepted, declined)
- created_at, updated_at (TIMESTAMPTZ)
UNIQUE(booking_id, consumer_id)
```

#### 29. `flow_credits` (Loyalty credits)
```sql
- id (UUID, PK)
- consumer_id (UUID, FK → consumers)
- amount (INT)
- source (VARCHAR)
- expires_at (TIMESTAMPTZ, nullable)
- created_at (TIMESTAMPTZ)
```

#### 30. `consumer_social_preferences` (Social voorkeuren)
```sql
- consumer_id (UUID, PK, FK → consumers)
- auto_share_bookings (BOOLEAN)
- auto_share_reviews (BOOLEAN)
- show_location_to_friends (BOOLEAN)
- allow_friend_requests (BOOLEAN)
- notification_new_follower (BOOLEAN)
- notification_activity_feed (BOOLEAN)
- created_at, updated_at (TIMESTAMPTZ)
```

### Integration Tables

#### 31. `pos_integrations` (POS integraties)
```sql
- id (UUID, PK)
- location_id (UUID, FK → locations)
- vendor (ENUM: LIGHTSPEED, SQUARE, TOAST, CLOVER)
- access_token, refresh_token (TEXT)
- token_expires_at (TIMESTAMPTZ)
- external_location_id (VARCHAR(255))
- config (JSONB)
- is_active (BOOLEAN)
- last_sync_at (TIMESTAMPTZ)
- last_sync_status (VARCHAR(50))
- created_at, updated_at (TIMESTAMPTZ)
UNIQUE(location_id, vendor)
```

#### 32. `venue_users` (Venue users voor PIN login)
```sql
- id (UUID, PK)
- location_id (UUID, FK → locations)
- email (VARCHAR(255))
- pin_code (VARCHAR(10))
- name (VARCHAR(255))
- role (VARCHAR(50))
- is_active (BOOLEAN)
- location_ids (UUID[])
- all_locations (BOOLEAN)
- permissions (JSONB)
- created_at, updated_at (TIMESTAMPTZ)
```

#### 33. `waitlist` (Wachtlijst)
```sql
- id (UUID, PK)
- location_id (UUID, FK → locations)
- consumer_id (UUID, FK → consumers)
- party_size (INT)
- preferred_date (DATE)
- preferred_time (TIME)
- status (VARCHAR)
- notified_at (TIMESTAMPTZ, nullable)
- created_at, updated_at (TIMESTAMPTZ)
```

#### 34. `promotions` (Promoties)
```sql
- id (UUID, PK)
- location_id (UUID, FK → locations)
- title, description (TEXT)
- discount_type (VARCHAR)
- discount_value (INT)
- valid_from, valid_until (TIMESTAMPTZ)
- is_active (BOOLEAN)
- created_at, updated_at (TIMESTAMPTZ)
```

#### 35. `email_logs` (Email logs)
```sql
- id (UUID, PK)
- to_email (VARCHAR(255))
- subject (TEXT)
- template_name (VARCHAR(255))
- status (VARCHAR)
- sent_at (TIMESTAMPTZ)
- error_message (TEXT)
- metadata (JSONB)
- created_at (TIMESTAMPTZ)
```

### Indexes

**Performance Critical Indexes:**
- `idx_bookings_location_time` - Bookings per location/time
- `idx_bookings_table_time` - Bookings per table/time
- `idx_locations_geo` - Geographic search (GIST)
- `idx_memberships_tenant_user` - Membership lookups
- `idx_locations_slug` - Location slug lookups
- `idx_locations_public` - Public locations filter
- `idx_messages_conversation` - Messages per conversation
- `idx_activity_feed_actor` - Activity feed per user
- `idx_notifications_user_unread` - Unread notifications

---

## 🔌 API ENDPOINTS

### Public Endpoints (No Auth)

#### Health & Status
- `GET /api/health` - Health check

#### Bookings
- `POST /api/bookings/create` - Create booking
- `GET /api/bookings/availability` - Check available time slots
- `POST /api/bookings/invite-friends` - Invite friends to booking
- `POST /api/bookings/[bookingId]/cancel` - Cancel booking
- `POST /api/bookings/[bookingId]/no-show-fee` - Charge no-show fee
- `POST /api/bookings/[bookingId]/refund` - Refund booking
- `POST /api/bookings/payment-intent` - Create payment intent

#### Locations
- `GET /api/locations/search` - Search locations
- `GET /api/google-places/search` - Google Places autocomplete
- `GET /api/google-places/details` - Google Places details

#### Availability
- `GET /api/availability/check` - Check availability

### Authenticated Endpoints

#### User
- `GET /api/user` - Get current user info
- `POST /api/profile/update` - Update user profile
- `POST /api/profile/upgrade-checkout` - Create Stripe checkout session

#### Favorites
- `GET /api/favorites` - Get favorites
- `POST /api/favorites` - Add favorite
- `DELETE /api/favorites` - Remove favorite
- `GET /api/favorites/alerts` - Get availability alerts
- `GET /api/favorites/insights` - Get favorites insights

#### Bookings
- `GET /api/bookings` - Get user bookings

#### Messages
- `GET /api/messages` - Get conversations
- `POST /api/messages` - Send message
- `POST /api/messages/[conversationId]/read` - Mark as read
- `POST /api/messages/[conversationId]/archive` - Archive conversation

#### Notifications
- `GET /api/notifications` - Get notifications
- `GET /api/notifications/count` - Get unread count
- `POST /api/notifications/[id]` - Update notification
- `POST /api/notifications/mark-all-read` - Mark all as read

#### Social
- `GET /api/social/feed` - Get activity feed
- `POST /api/social/feed/post` - Create post
- `POST /api/social/feed/[activityId]/like` - Like activity
- `POST /api/social/feed/[activityId]/comment` - Comment on activity
- `POST /api/social/follow` - Follow user
- `GET /api/social/followers` - Get followers
- `GET /api/social/following` - Get following
- `GET /api/social/profile/[consumerId]` - Get user profile
- `POST /api/social/photos/upload` - Upload moment photo
- `GET /api/social/discover/users` - Discover users
- `GET /api/social/loyalty/credits` - Get flow credits
- `GET /api/social/loyalty/history` - Get credits history
- `GET /api/social/preferences` - Get social preferences
- `POST /api/social/preferences` - Update social preferences

#### Reviews
- `GET /api/reviews` - Get reviews
- `POST /api/reviews` - Create review
- `POST /api/reviews/[reviewId]/reply` - Reply to review

### Manager Endpoints (RLS Protected)

#### Tenants
- `GET /api/manager/tenants` - List tenants
- `GET /api/manager/tenants/[tenantId]` - Get tenant
- `POST /api/manager/tenants/[tenantId]` - Update tenant

#### Locations
- `GET /api/manager/locations` - List locations
- `POST /api/manager/locations` - Create location
- `GET /api/manager/locations/[locationId]` - Get location
- `POST /api/manager/locations/[locationId]` - Update location
- `DELETE /api/manager/locations/[locationId]` - Delete location
- `POST /api/manager/locations/publish` - Publish location

#### Bookings
- `GET /api/manager/bookings` - List bookings
- `POST /api/manager/bookings/[bookingId]/status` - Update booking status

#### Tables
- `POST /api/manager/tables/bulk` - Bulk create/update tables

#### Shifts
- `POST /api/manager/shifts/bulk` - Bulk create/update shifts

#### Billing
- `GET /api/manager/billing/portal` - Get Stripe portal URL
- `GET /api/manager/usage` - Get usage stats

#### Subscriptions
- `POST /api/manager/subscriptions/checkout` - Create checkout session

#### Messages
- `GET /api/manager/messages` - Get guest messages
- `POST /api/manager/messages/send` - Send message to guest
- `GET /api/manager/messages/stats` - Get message stats
- `GET /api/manager/messages/target-count` - Get target count

#### Notification Settings
- `GET /api/manager/notification-settings` - Get settings
- `POST /api/manager/notification-settings` - Update settings

#### Policies
- `GET /api/manager/policies` - Get policies
- `POST /api/manager/policies` - Update policies

#### Integrations
- `GET /api/manager/integrations/lightspeed/oauth` - Start OAuth
- `GET /api/manager/integrations/lightspeed/callback` - OAuth callback

#### Stripe Connect
- `GET /api/manager/stripe/connect` - Get connect URL
- `GET /api/manager/stripe/connect-onboarding` - Get onboarding URL

#### Venue Users
- `POST /api/venue-users/create` - Create venue user
- `POST /api/venue-users/update` - Update venue user
- `DELETE /api/venue-users/delete` - Delete venue user

### Webhooks

#### Stripe
- `POST /api/stripe/webhook` - Stripe webhook handler
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_succeeded`
  - `invoice.payment_failed`

#### Lightspeed
- `POST /api/webhooks/lightspeed` - Lightspeed webhook handler

### Widget

#### Widget API
- `GET /api/widget/[widgetCode]` - Get widget data
- `POST /api/widget/[widgetCode]/track` - Track widget usage

### Email

#### Email Processing
- `POST /api/email/send` - Send email
- `POST /api/email/process` - Process email
- `POST /api/email/send-booking-invitation` - Send booking invitation
- `GET /api/email/track/[logId]` - Track email

### Debug (Development Only)

#### Debug Endpoints
- `GET /api/debug/env-check` - Check environment variables
- `GET /api/debug/locations` - Debug locations
- `POST /api/debug/publish-all` - Publish all locations

---

## 🧩 COMPONENTEN OVERZICHT

### Booking Components
- `BookingModal.tsx` - Main booking modal
- `BookingSheet.tsx` - Booking form sheet
- `BookingSheetWrapper.tsx` - Booking wrapper
- `BookingPayment.tsx` - Payment processing
- `InviteFriendsSelect.tsx` - Invite friends selector
- `ReserveBookingModal.tsx` - Reserve booking modal
- `AirbnbBookingModal.tsx` - Airbnb-style booking modal

### Calendar Components
- `CalendarView.tsx` - Main calendar view
- `CalendarSettings.tsx` - Calendar settings
- `CalendarWidget.tsx` - Calendar widget
- `MultiLocationCalendar.tsx` - Multi-location calendar
- `TimelineView.tsx` - Timeline view

### Location Components
- `LocationCard.tsx` - Location card
- `LocationCardWithFavorite.tsx` - Location card with favorite
- `StaffLoginInfo.tsx` - Staff login info

### Manager Components
- `BookingDetailModal.tsx` - Booking detail modal
- `DashboardInsights.tsx` - Dashboard insights
- `EnhancedTablesManager.tsx` - Tables manager
- `GuestMessagingPanel.tsx` - Guest messaging panel
- `LocationImageUpload.tsx` - Image upload
- `MenuManager.tsx` - Menu manager
- `NotificationSettings.tsx` - Notification settings
- `PaymentsOverview.tsx` - Payments overview
- `PromotionsManager.tsx` - Promotions manager
- `ReviewsManagement.tsx` - Reviews management
- `ShiftsManager.tsx` - Shifts manager
- `UnifiedTableManagement.tsx` - Unified table management
- `UsageCard.tsx` - Usage card
- `UsersManager.tsx` - Users manager
- `VenueUserEmailLogin.tsx` - Venue user email login
- `WidgetManager.tsx` - Widget manager

### Social Components
- `ActivityCard.tsx` - Activity card
- `ActivityFeed.tsx` - Activity feed
- `CommentModal.tsx` - Comment modal
- `CreatePost.tsx` - Create post
- `FollowButton.tsx` - Follow button
- `FollowUnfollowButton.tsx` - Follow/unfollow button
- `LikesModal.tsx` - Likes modal
- `ModernActivityCard.tsx` - Modern activity card
- `ModernFeedLayout.tsx` - Modern feed layout
- `PhotoUpload.tsx` - Photo upload
- `ProfileHeader.tsx` - Profile header
- `UserActivityFeed.tsx` - User activity feed
- `UserCard.tsx` - User card
- `UserLink.tsx` - User link

### Messages Components
- `ComposeMessage.tsx` - Compose message
- `ConversationList.tsx` - Conversation list
- `LocationPicker.tsx` - Location picker
- `MessageBubble.tsx` - Message bubble
- `MessagesView.tsx` - Messages view
- `UserSelector.tsx` - User selector

### Reviews Components
- `CreateReviewDialog.tsx` - Create review dialog
- `ReviewsDisplay.tsx` - Reviews display
- `StarRating.tsx` - Star rating

### CRM Components
- `CRMManager.tsx` - CRM manager
- `CRMWidget.tsx` - CRM widget
- `MultiLocationCRM.tsx` - Multi-location CRM

### Waitlist Components
- `MultiLocationWaitlist.tsx` - Multi-location waitlist
- `WaitlistManager.tsx` - Waitlist manager
- `WaitlistWidget.tsx` - Waitlist widget

### Other Components
- `AIChatbot.tsx` - AI chatbot
- `BottomNavigation.tsx` - Bottom navigation
- `Header.tsx` - Header
- `Footer.tsx` - Footer
- `HeroSection.tsx` - Hero section
- `LanguageSelector.tsx` - Language selector
- `NotificationBadge.tsx` - Notification badge
- `OnzeKeuzeCarousel.tsx` - Onze keuze carousel
- `PromotionsDisplay.tsx` - Promotions display
- `SpotlightCarousel.tsx` - Spotlight carousel
- `RestaurantWidget.tsx` - Restaurant widget

---

## 🔒 BEVEILIGING & RLS

### Row Level Security (RLS)

Alle tabellen hebben RLS enabled met policies voor:

#### Tenants
- Users kunnen alleen tenants zien waar ze member van zijn
- Owners kunnen tenants aanmaken en updaten
- Managers kunnen tenants updaten (beperkt)

#### Locations
- Public locations zijn zichtbaar voor iedereen
- Private locations alleen voor tenant members
- Managers kunnen locations aanmaken/updaten voor hun tenant

#### Bookings
- Consumers kunnen alleen hun eigen bookings zien
- Managers kunnen bookings zien voor hun tenant locations
- Staff kunnen bookings zien voor hun toegewezen locaties

#### Messages
- Users kunnen alleen messages zien in conversations waar ze deel van uitmaken
- Users kunnen alleen berichten sturen in hun conversations

#### Notifications
- Users kunnen alleen hun eigen notifications zien
- System kan notifications aanmaken voor alle users

#### Reviews
- Public reviews zijn zichtbaar voor iedereen
- Consumers kunnen alleen hun eigen reviews updaten
- Managers kunnen reviews zien voor hun locations

### Authentication

- **Supabase Auth** voor user authentication
- **JWT tokens** voor API authentication
- **Session management** via cookies
- **Role-based access control** via memberships

### Data Isolation

- **Multi-tenant isolation** via RLS policies
- **Tenant-specific data** queries
- **Cross-tenant access prevention**

---

## 📊 STATISTIEKEN

### Database
- **Total Tables:** ~35
- **Total Indexes:** ~80
- **RLS Policies:** ~150
- **Functions:** ~50
- **Triggers:** ~20

### Codebase
- **Total Components:** ~100+
- **API Routes:** ~80+
- **Pages:** ~30+
- **Lines of Code:** ~50,000+

### Features
- **Sectors Supported:** 43+
- **Resource Types:** 6
- **Subscription Plans:** 3
- **Notification Types:** 15+
- **Activity Types:** 5+

---

## 🎯 CONCLUSIE

Reserve4You is een **technisch solide, multi-sector booking platform** met:

✅ **Complete consumer flow** - Discovery → Booking → Confirmation  
✅ **Complete manager flow** - Signup → Onboarding → Dashboard → Booking Management  
✅ **Multi-tenant architectuur** - Restaurant groups met meerdere locaties  
✅ **Real-time availability** - Accurate slot checking  
✅ **Multi-sector ready** - Database + terminology systeem klaar  
✅ **Social features** - Activity feed, follows, messaging  
✅ **Loyalty system** - FlowCredits, badges  
✅ **Review system** - Ratings, reviews, replies  
✅ **Notification system** - In-app + email notifications  
✅ **Payment processing** - Stripe integration  
✅ **POS integration** - Lightspeed support  
✅ **AI features** - Chatbot, analytics  

Het platform is **production-ready** en kan gebruikt worden voor alle appointment-based bedrijven.

---

**Document Versie:** 1.0  
**Laatste Update:** Januari 2025  
**Auteur:** Development Team

