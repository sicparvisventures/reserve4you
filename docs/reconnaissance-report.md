# R4Y SaaS Template - Reconnaissance Report

**Date:** October 17, 2025  
**Project:** Transform generic SaaS template into R4Y Restaurant Reservations Platform  
**Codebase:** `/Users/dietmar/Desktop/ray2`

---

## Executive Summary

The existing codebase is a production-quality Next.js 15 SaaS starter template with a solid foundation for authentication, payments, and database operations. It follows modern best practices including Data Access Layer (DAL) patterns, Row Level Security (RLS), and proper separation of concerns. However, it requires significant extensions to support the multi-tenant, reservations-focused architecture required by R4Y.

**Overall Assessment:** ✅ Strong foundation, requires ~70% new features

---

## 1. AS-IS SUMMARY

### Architecture Overview

**Stack:**
- **Framework:** Next.js 15 with App Router (Turbopack)
- **Language:** TypeScript (full type safety)
- **Database:** PostgreSQL via Supabase
- **Auth:** Supabase Auth (email/password)
- **Payments:** Stripe (one-time payments)
- **Styling:** Tailwind CSS 4 with custom design tokens
- **UI Components:** Radix UI + shadcn/ui patterns
- **State:** React Query (@tanstack/react-query)
- **Package Manager:** pnpm

**Key Architectural Patterns:**

1. **Data Access Layer (DAL)** - `lib/auth/dal.ts`
   - Request-memoized auth checks using React `cache()`
   - Separation between user-facing and service-role operations
   - Clean redirect/error handling patterns

2. **Two-Layer Database Architecture**
   - User layer: DAL with RLS enforcement
   - System layer: Service role for webhooks (bypasses RLS)

3. **Design System** - `app/globals.css`
   - 2-variable color system (--primary, --neutral)
   - Consistent spacing, typography, animations
   - Pre-built utility classes for common patterns

### Current Database Schema

```sql
-- Existing Tables
users (
  id SERIAL PRIMARY KEY,
  supabase_user_id UUID UNIQUE,
  has_access BOOLEAN DEFAULT false,
  stripe_customer_id TEXT UNIQUE,
  created_at, updated_at
)

purchases (
  id SERIAL PRIMARY KEY,
  user_id INTEGER → users(id),
  stripe_payment_intent_id TEXT UNIQUE,
  stripe_session_id TEXT UNIQUE,
  amount INTEGER,
  currency VARCHAR(3),
  status VARCHAR(20),
  product_name VARCHAR(100),
  created_at, updated_at
)
```

**RLS Policies:**
- ✅ Users can view/update own data
- ✅ Service role has full access
- ✅ Purchases scoped to user via user_id join
- ✅ Secure user creation via SECURITY DEFINER function

### Current Auth Flow

**Implemented:**
- ✅ Email/password sign-up and sign-in
- ✅ Session management via Supabase
- ✅ Server-side auth verification (DAL)
- ✅ Middleware-level optimistic checks (cookie-based)
- ✅ Protected routes (`/app` requires auth)
- ✅ Access control (has_access boolean)

**Not Implemented:**
- ❌ Google OAuth (mentioned in requirements)
- ❌ SMS/phone verification
- ❌ Multi-tenant/organization support
- ❌ Role-based access control (OWNER/MANAGER/STAFF)
- ❌ 2FA/PIN login

### Current Payment Integration

**Stripe Setup:**
- ✅ One-time payment checkout
- ✅ Webhook handler for `checkout.session.completed`
- ✅ Service-role database updates on payment success
- ✅ Signature verification
- ✅ Customer ID storage and tracking
- ✅ Purchase history

**Not Implemented:**
- ❌ Subscription billing (required for R4Y tiers)
- ❌ Stripe Connect (for payouts to restaurants)
- ❌ Deposit/payment intent creation
- ❌ Billing quota enforcement
- ❌ Customer portal for plan management
- ❌ Tiered pricing (Start/Pro/Plus)

### UI/UX State

**Design System:**
- ✅ Modern, clean aesthetic
- ✅ 2-variable color system (easy rebranding)
- ✅ Consistent spacing (8pt grid implied)
- ✅ Smooth animations (200-800ms)
- ✅ Responsive design
- ✅ Basic UI components (Button, Input, Card, Avatar, Dropdown)

**Current Components:**
- Header with auth state
- Hero section
- Features section
- Footer
- Basic form components
- Submit button with loading state

**Missing for R4Y:**
- ❌ Bottom sheet/drawer component (for booking flow)
- ❌ Calendar/date picker
- ❌ Time slot selector
- ❌ Location/map components
- ❌ Stepper component
- ❌ Badge/chip components
- ❌ Toast notifications
- ❌ Skeleton loaders
- ❌ Table/grid layout components
- ❌ Search/filter UI

### Current Routes

```
/ - Landing page (public)
/sign-in - Auth
/sign-up - Auth
/auth/callback - OAuth callback
/app - Main app (requires has_access)
/privacy - Privacy policy
/terms - Terms of service

API Routes:
/api/health - Health check
/api/stripe/checkout - Create checkout session
/api/stripe/webhook - Stripe webhook handler
/api/user - User data
/api/user/purchases - Purchase history
```

### Environment Configuration

**Current Variables:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://jrudqxovozqnmxypjtij.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=***
SUPABASE_SERVICE_ROLE_KEY=***
STRIPE_SECRET_KEY=sk_test_***
STRIPE_WEBHOOK_SECRET=whsec_your-secret (needs update)
STRIPE_PRICE_ID=price_your-price-id (needs update)
```

**Missing:**
- Google OAuth credentials
- Lightspeed API credentials
- App URL configuration
- Stripe Connect keys

### Code Quality

**Strengths:**
- ✅ TypeScript throughout
- ✅ Proper error handling
- ✅ Logging and debugging aids
- ✅ Security-first patterns
- ✅ Clean separation of concerns
- ✅ Documentation inline
- ✅ Consistent naming conventions

**Areas for Improvement:**
- ⚠️ No input validation with Zod (required by spec)
- ⚠️ No automated tests
- ⚠️ Limited error boundary handling
- ⚠️ No internationalization (i18n)

---

## 2. GAP ANALYSIS

### Critical Gaps (Blockers for MVP)

#### A. Multi-Tenancy Architecture ⭐⭐⭐
**Current:** Single-user SaaS model  
**Required:** Multi-tenant with organizations, locations, memberships

**Missing:**
- Tenants table and RLS policies
- Memberships table with role enum (OWNER/MANAGER/STAFF)
- Locations table (multiple per tenant)
- Tenant-scoped data access helpers
- Organization onboarding flow
- Team member invitation system

**Effort:** 🔴 High (40+ hours)

#### B. Restaurant Reservations Core ⭐⭐⭐
**Current:** Generic app dashboard  
**Required:** Complete reservations system

**Missing:**
- Tables and table groups
- Shifts and scheduling system
- Booking entity with status workflow
- Availability calculation engine
- Real-time table assignment logic
- Cancellation and no-show handling
- Waitlist functionality
- Consumer guest records

**Effort:** 🔴 Very High (60+ hours)

#### C. Subscription Billing ⭐⭐⭐
**Current:** One-time payment  
**Required:** Tiered subscription with quotas

**Missing:**
- Stripe subscription setup (vs one-time)
- Billing_state table
- Three tiers: Start/Pro/Plus
- Quota enforcement (bookings/month, locations)
- Publish gating based on billing status
- Customer portal integration
- Subscription webhooks (updated, canceled, etc.)

**Effort:** 🟡 Medium-High (30+ hours)

#### D. Dual-Persona UX ⭐⭐⭐
**Current:** Single user type  
**Required:** Consumer app + Manager portal

**Missing:**
- Consumer-facing routes (/, /discover, /favorites, /profile)
- Manager portal (/manager with separate auth)
- Provider detail pages (/p/[slug])
- Booking bottom-sheet flow
- Manager dashboard (calendar, reservations list)
- Onboarding wizard (7 steps)
- Settings and configuration UIs

**Effort:** 🔴 Very High (50+ hours)

#### E. Edge Functions/Server Actions ⭐⭐
**Current:** Basic API routes  
**Required:** Transaction-heavy booking logic

**Missing:**
- check_availability edge function
- create_booking with serializable transaction
- publish_location with validation
- stripe_webhook extensions for subscriptions
- lightspeed_webhook stub
- Idempotency key handling
- Correlation ID logging

**Effort:** 🟡 Medium (25+ hours)

### Important Gaps (MVP Required)

#### F. Location-Based Features ⭐⭐
**Missing:**
- Address geocoding
- Nearby search/filtering
- Map integration
- Opening hours management
- Multi-location support per tenant

**Effort:** 🟡 Medium (20+ hours)

#### G. Policies and Rules ⭐⭐
**Missing:**
- Cancellation hours
- No-show fee
- Deposit settings (required, type, value)
- Buffer times between bookings
- Maximum parallel bookings per shift

**Effort:** 🟢 Low-Medium (15+ hours)

#### H. Authentication Extensions ⭐⭐
**Missing:**
- Google OAuth for consumers
- SMS verification for guest bookings
- PIN login for managers
- Optional 2FA

**Effort:** 🟡 Medium (20+ hours)

### Nice-to-Have Gaps (Post-MVP)

#### I. Lightspeed POS Integration ⭐
**Missing:**
- OAuth flow with Lightspeed
- Menu ingestion
- Table status sync
- Webhook verification

**Effort:** 🟡 Medium (15+ hours, can be stubbed)

#### J. Advanced Features
**Missing:**
- Push notifications
- Email notifications
- CRM features
- Analytics dashboard
- Advanced search
- Review/rating system
- Photo gallery
- Special offers/deals

**Effort:** 🔴 High (varies)

---

## 3. RISKS & MITIGATION

### Technical Risks

#### Risk 1: Data Model Complexity 🔴 HIGH
**Description:** Moving from 2 tables to 15+ tables with complex relationships increases chance of migration errors, RLS policy mistakes, and data integrity issues.

**Mitigation:**
- Write migrations incrementally, test after each
- Use helper functions for complex RLS checks
- Add database constraints and indexes
- Create seed data for testing
- Test edge cases (concurrent bookings, quota limits)

#### Risk 2: Transaction Isolation ⭐ CRITICAL
**Description:** Booking creation requires SERIALIZABLE transaction to prevent double-booking. Edge function must handle high concurrency.

**Mitigation:**
- Use explicit transaction isolation level
- Implement row-level locking (SELECT ... FOR UPDATE)
- Add retry logic for serialization failures
- Test with concurrent requests (load testing)
- Add timeout handling

#### Risk 3: Stripe Subscription Complexity 🟡 MEDIUM
**Description:** Subscription webhooks are more complex than one-time payments. Must handle: subscription.created, updated, canceled, payment_intent.succeeded, invoice.paid, etc.

**Mitigation:**
- Start with existing webhook structure
- Add event handlers incrementally
- Test with Stripe CLI
- Implement idempotency
- Add comprehensive logging

#### Risk 4: Multi-Tenant Data Leakage 🔴 HIGH
**Description:** If RLS policies are incorrect, tenant data could leak across organizations.

**Mitigation:**
- Write RLS policies with explicit tenant_id checks
- Use SECURITY DEFINER helper: `is_tenant_member(user_id, tenant_id)`
- Add tests for cross-tenant access attempts
- Peer review all policies
- Add monitoring/alerting for suspicious queries

#### Risk 5: UI Complexity ⚠️ MEDIUM-HIGH
**Description:** Building dual-persona UX (consumer + manager) with 20+ routes and complex flows (booking, onboarding) in limited time.

**Mitigation:**
- Reuse existing components where possible
- Use shadcn/ui for complex components (calendar, sheet, etc.)
- Build mobile-first
- Implement iteratively (consumer → manager)
- Use feature flags to hide incomplete sections

### Business Risks

#### Risk 6: OAuth Integration Delays ⚠️ MEDIUM
**Description:** Google OAuth and Lightspeed integration require external approvals and setup time.

**Mitigation:**
- Prioritize Google OAuth (critical for consumers)
- Make Lightspeed optional for MVP
- Document setup steps clearly
- Provide fallback (email/password for consumers)

#### Risk 7: Scope Creep 🟡 MEDIUM
**Description:** Requirements are extensive; risk of adding features beyond MVP.

**Mitigation:**
- Strict prioritization (P0/P1/P2)
- Mark Lightspeed as "stub" for MVP
- Skip: notifications, CRM, analytics, reviews
- Focus on core booking flow + billing gate

### Operational Risks

#### Risk 8: Migration Rollback ⚠️ MEDIUM
**Description:** Database schema changes are extensive; rollback could be challenging.

**Mitigation:**
- Keep original schema intact (users, purchases tables)
- Add new tables in separate migration
- Test rollback procedure
- Backup database before production deploy

#### Risk 9: Performance at Scale 🟢 LOW (MVP)
**Description:** Complex queries for availability calculation could be slow at scale.

**Mitigation:**
- MVP: acceptable for < 100 locations
- Add indexes on (location_id, start_ts)
- Consider caching layer post-MVP
- Monitor query performance

---

## 4. RECOMMENDATIONS

### Phased Approach

**Phase 1 - Foundation (Week 1)**
- Design tokens and UI kit
- Database migrations (tenants, locations, tables, bookings)
- RLS policies and helpers
- Multi-tenant auth scaffolding

**Phase 2 - Consumer Experience (Week 2)**
- Consumer routes (/, /discover, /p/[slug])
- Booking bottom-sheet
- check_availability edge function
- create_booking edge function
- Google OAuth

**Phase 3 - Manager Portal (Week 3)**
- Manager auth and onboarding wizard (steps 1-5)
- Stripe subscription integration (step 6)
- Publish flow with billing gate
- Dashboard: reservations list, basic calendar

**Phase 4 - Polish & Integration (Week 4)**
- Advanced calendar (drag/drop)
- Policies UI
- Lightspeed connector stub
- QA and error handling
- Deployment prep

### Success Criteria

**Must Have (MVP):**
- ✅ Consumer can search and book a table
- ✅ Manager can onboard, subscribe, and publish location
- ✅ Billing gate prevents publishing without active subscription
- ✅ No double-bookings (transaction integrity)
- ✅ RLS prevents data leakage
- ✅ Google OAuth works for consumers

**Should Have (MVP+):**
- ✅ Manager can view/edit bookings in calendar
- ✅ Cancellation and no-show handling
- ✅ Deposit support
- ✅ Waitlist support

**Could Have (Post-MVP):**
- ⚪ Lightspeed integration (full)
- ⚪ Email/SMS notifications
- ⚪ CRM features
- ⚪ Analytics

### Technology Decisions

**Confirmed:**
- Keep Next.js 15 App Router ✅
- Keep Supabase (Postgres + Auth) ✅
- Keep Stripe ✅
- Keep Tailwind + shadcn/ui patterns ✅
- Use Zod for validation (add dependency) ✅
- Use React Query for client state ✅

**To Add:**
- Zod for form/API validation
- vaul (already present) for bottom sheets
- date-fns or day.js for date handling
- @googlemaps/js-api-loader or similar for maps
- react-hook-form for complex forms

**To Consider:**
- Edge Functions via Supabase (or Next.js API routes) - Decision: Use Next.js API routes for now
- Vercel Postgres (alternative to Supabase) - Decision: Keep Supabase

---

## 5. CURRENT STRENGTHS TO LEVERAGE

### Architecture Strengths

1. **DAL Pattern**: Extend for multi-tenant helpers
   - `getTenantForUser(userId)`
   - `isTenantMember(userId, tenantId, role?)`
   - `getLocationForTenant(tenantId, locationId)`

2. **Service Role Pattern**: Perfect for webhook operations
   - Booking creation (bypasses consumer RLS)
   - Billing state updates
   - POS data sync

3. **Middleware**: Extend for manager portal auth
   - Add `/manager` route protection
   - Add role-based checks

4. **Design System**: 2-variable system perfect for R4Y rebrand
   - Just update `--primary` to `#FF5A5F` (accent)
   - Update `--neutral` for borders

### Code Reuse Opportunities

**Auth:**
- Extend existing DAL functions ✅
- Reuse sign-up/sign-in components ✅
- Adapt header for consumer/manager context ✅

**Payments:**
- Extend webhook handler for subscriptions ✅
- Reuse Stripe client setup ✅
- Adapt createCheckoutSession for subscriptions ✅

**UI:**
- Reuse Button, Input, Card, Avatar ✅
- Extend with Date Picker, Sheet, Badge ✅
- Adapt Hero/Features for consumer landing ✅

**Database:**
- Extend RLS pattern for new tables ✅
- Reuse service-role query pattern ✅
- Add tenant-scoped helpers ✅

---

## 6. NEXT STEPS

### Immediate Actions

1. **Create PRD Document** (docs/prd-r4y.md)
   - Detailed requirements
   - User stories
   - Acceptance criteria
   - API specifications

2. **Set Up Environment**
   - Update .env.local with complete variables
   - Create .env.example from .env.local
   - Document setup in README

3. **Install Dependencies**
   ```bash
   pnpm add zod react-hook-form @hookform/resolvers date-fns
   ```

4. **Create Design Tokens**
   - Update globals.css with R4Y colors
   - Create design-tokens.ts
   - Build UI Kit page

5. **Database Migrations**
   - Create migration: `20241017000001_r4y_multi_tenant_schema.sql`
   - Test locally
   - Apply with `supabase db push`

### Definition of Done

**Reconnaissance Phase:** ✅ COMPLETE
- [x] Code review
- [x] Architecture documentation
- [x] Gap analysis
- [x] Risk assessment
- [x] Recommendations

**PRD Phase:** 🔄 Next
- [ ] Complete product requirements
- [ ] User flows documented
- [ ] API specifications
- [ ] Acceptance criteria

**Implementation Phase:** ⏳ Queued
- [ ] Design tokens
- [ ] Database schema
- [ ] API routes/edge functions
- [ ] UI components
- [ ] Testing

---

## APPENDIX

### Technology Versions

```json
{
  "next": "15.0.3",
  "react": "19.0.0",
  "typescript": "5.8.3",
  "tailwindcss": "4.1.7",
  "@supabase/supabase-js": "2.45.4",
  "stripe": "17.3.1",
  "zod": "3.24.1"
}
```

### File Structure Map

```
ray2/
├── app/                    # Next.js App Router
│   ├── (login)/           # Auth group
│   ├── api/               # Current: health, stripe, user
│   ├── app/               # Protected app (to become manager portal)
│   └── page.tsx           # Landing (to become consumer home)
├── components/            # UI components
│   └── ui/               # Base components (extend)
├── lib/
│   ├── auth/             # DAL (extend for multi-tenant)
│   ├── db/               # Queries (extend for new tables)
│   ├── payments/         # Stripe (adapt for subscriptions)
│   └── supabase/         # Client config
├── supabase/
│   └── migrations/       # Database schema
└── docs/                 # NEW: Documentation
```

### Contact & Questions

For questions about this reconnaissance report, refer to:
- CLAUDE.md for development patterns
- SETUP.md for environment setup
- STYLING.md for design system

---

**Report Prepared By:** AI Engineering Assistant  
**Status:** ✅ Complete and Ready for PRD Phase  
**Next Document:** docs/prd-r4y.md

