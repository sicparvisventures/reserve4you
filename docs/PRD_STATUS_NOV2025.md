# Reserve4You – Product Requirements & Status Overview

**Date:** 17 November 2025  
**Owner:** Product & Engineering  
**Purpose:** Capture the current functional state, open work, and the exact steps required to take Reserve4You live with end-to-end payments and reservations.

---

## 1. Executive Summary
- Reserve4You is a multi-sector booking and membership platform (Next.js 15 + Supabase) targeting restaurants, beauty, medical, fitness, and professional services.
- Core tenant, authentication, messaging, CRM, and calendar systems are production-ready (>90% complete), but payments and sector-agnostic reservations still block launch.
- Stripe upgrades currently bypass Checkout when placeholder price IDs are detected (`app/api/profile/upgrade-checkout/route.ts`) which results in unpaid plan activation. This must be removed and replaced with live price IDs.
- Reservation creation (`app/api/bookings/create/route.ts`) still assumes restaurant tables (`tables` table) and lacks resource/service/staff logic. Consumers cannot yet book beauty/medical/fitness services end-to-end.
- Goal: Activate Stripe in live mode, finalize the reservation engine so any sector can accept bookings with payments/deposits, and ensure operations (support, monitoring, success metrics) are in place.

---

## 2. Product Scope & Users
- **Consumers:** Discover locations, manage favorites, place reservations, receive confirmations, manage profile.
- **Managers/Owners:** Configure locations, resources, staff, service catalog, policies, handle reservations, messaging, analytics, billing.
- **Staff:** Use lightweight login to view daily bookings, update statuses, message guests.
- **Platform Operators:** Monitor tenant health, enforce quotas, manage billing, support escalations.

**North-star outcome:** “From signup to a paid tenant receiving their first multi-sector reservation with confirmation, payment/deposit, reminders, and reporting – all without manual intervention.”

---

## 3. Current Functional Coverage
- **Multi-tenant foundation:** Ownership & membership roles, tenant auto-creation, RLS enforced across Supabase tables.
- **Authentication & access:** Supabase Auth, PIN-based staff access, session middleware, protected routes.
- **Booking engine (restaurant-ready):** Idempotency, policy validation, conflict detection, deposits via Stripe PaymentIntents, booking notifications, consumer profile linking.
- **UI Shell:** Dashboard, calendar, messaging inbox, profile billing tab, consumer-facing location pages, discover map.
- **Terminology & sector config:** 43-sector terminology layer (`lib/terminology.ts`), JSONB `sector_config`, context providers powering dynamic copy.
- **Notifications:** Resend email templates, webhook-driven updates, in-app alerts; SMS plumbing prepared.
- **CRM & analytics:** Consumer histories, favorites, reviews, dashboard KPIs, booking quotas tied to plan.
- **Storage & media:** Supabase storage for logos, galleries with RLS guards.

---

## 4. Critical Gaps Blocking Launch
1. **Stripe not live (P0)**
   - Placeholder price IDs trigger a bypass of Checkout and mark plans active without payment.
   - Live price IDs, secret keys, and webhook secrets are absent from `.env` / production.
   - No audit log of actual payments; risk of fraud and zero revenue.

2. **Reservation engine not sector-agnostic yet (P0)**
   - `createBookingWithTransaction()` still queries `tables` only; no `resources`, `service_offerings`, or staff qualification logic.
   - Frontend booking modal lacks service selection, staff assignment, intake forms, and recurring booking flows.
   - No enforcement of sector-specific booking rules (duration, buffers, lead times) defined in `sector_config`.

3. **Operational readiness gaps (P1)**
   - Need launch runbooks: payment reconciliation, failed webhook recovery, booking SLA monitoring, escalation paths.
   - Observability: log aggregation, alerting on failed bookings/checkout, quota overages.
   - QA coverage for multi-sector flows, integration tests for payments + bookings.

4. **Content & data consistency (P1)**
   - Ensure every production tenant has sector metadata, resources, services, photos, and policy settings to avoid runtime errors.
   - Confirm email templates (e.g., `supabase/email-templates/confirm-signup-improved.html`) match live branding and include legal copy.

---

## 5. Detailed Workstreams & Requirements

### 5.1 Stripe Activation (Owner: Payments squad) – **P0**
**Current behavior:** `app/api/profile/upgrade-checkout/route.ts` lines 96-174 detect placeholder price IDs and upsert `billing_state` with `status: 'ACTIVE'` without contacting Stripe.

**Requirements**
1. **Stripe setup**
   - Create live products/prices for START (€49), PRO (€99), PLUS (€149) in Stripe Dashboard.
   - Enable ideal/Bancontact and mandate 3DS for EU compliance.
2. **Environment & secrets**
   - Populate `.env.production` + Vercel env with `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID_START|PRO|PLUS`.
   - Rotate test keys where stored in Supabase Config.
3. **Code changes**
   - Remove placeholder bypass logic; always require a valid `price_1...` ID.
   - Expand `payment_method_types` to include `bancontact` (already requested in legacy doc).
   - Add defensive logging & Sentry breadcrumbs for Checkout creation failures.
4. **Webhook hardening**
   - Validate signature against `STRIPE_WEBHOOK_SECRET`.
   - Persist invoice IDs, subscription status, and next billing dates in `billing_state`.
   - On `invoice.payment_failed`, downgrade after grace period and notify owner via email + in-app banner.
5. **UX polish**
   - `app/profile/page.tsx`: show loading state during Checkout creation, display success message verifying `session_id` via `/api/stripe/verify-session`.
   - Add retry + support CTA when Checkout fails.
6. **Testing**
   - End-to-end test cases: new tenant upgrade, plan switch (PRO→PLUS), cancellation, payment failure, webhook replay.
   - Document manual cutover checklist in `docs/payments/GO_LIVE_STRIPE.md`.

### 5.2 Multi-Sector Reservations (Owner: Core Product) – **P0**
**Backend requirements**
1. Refactor booking engine to use `resources` abstraction:
   - Determine primary resource type from `locations.sector_config.primary_resource_type`.
   - Introduce resource availability queries (rooms, staff, equipment, spaces) with locking semantics similar to tables.
2. Service catalog integration:
   - Require `service_offering_id` when `sector_config.requires_service_selection` is true.
   - Derive duration + price from selected service; attach to booking record.
3. Staff assignment:
   - If `resource_type === 'STAFF'`, ensure selected staff member is available, qualified (`resource_service_capabilities`), and not double-booked.
   - Store `assigned_resource_id` (unifies tables, rooms, staff).
4. Intake forms & recurring bookings:
   - Persist `intake_responses` on booking creation when forms exist.
   - Provide `/api/bookings/recurring` to create `recurring_booking_patterns` + future instances.
5. Deposits & payments:
   - Support per-service deposit configuration, not only party-size heuristics.
   - Allow optional full prepayment by linking to Stripe Checkout (one-time PaymentIntent) for services requiring upfront payment.

**Frontend requirements**
1. Booking modal enhancements (`components/booking/BookingModal.tsx`):
   - Stepper: date/time → party size/service selection → staff → intake → review & pay.
   - Dynamic terminology (from `useTerminology`) across labels and CTAs.
2. Manager dashboard:
   - CRUD for services, resource scheduling, recurring availability templates.
   - Visual indicators for deposits awaiting payment.
3. Consumer experience:
   - Show service cards on location pages, estimated duration, deposit amount, cancellation policy.
   - Provide booking summary email with resource/service/staff details.

**Deliverables**
- Technical design doc for resource allocator.
- Migration scripts if additional tables/columns needed.
- Unit + integration tests (API layer + React components).
- Updated Resend email templates for multi-sector bookings.

### 5.3 Operational Readiness (Owner: Ops/DevOps) – **P1**
- **Monitoring:** Configure Logflare/Datadog for Next.js + Supabase, alert on 5xx spikes, failed Stripe webhooks, booking errors.
- **Support tooling:** Admin dashboard for manual booking adjustments, refund triggers, plan overrides.
- **Documentation:** Update `FINAL_SETUP_CHECKLIST.md` with Stripe + booking validation steps, create “Day 1 Operations” runbook.
- **Data QA:** Script to verify each tenant has sector metadata, at least one active resource/service, and published policy. Flag via nightly cron.

---

## 6. Launch Readiness Checklist
| Area | Status | Acceptance Criteria |
|------|--------|---------------------|
| Stripe Live Checkout | 🔴 Blocked | Live keys deployed, bypass removed, webhooks verified, real charge succeeds |
| Plan Enforcement | 🟡 Partial | `billing_state` reflects subscription tier, quotas enforced, downgrade logic tested |
| Multi-Sector Booking | 🔴 Blocked | Resource-aware creation, UI supports services/staff/intake, deposits configurable |
| Notifications | 🟢 Ready | Resend templates localized, triggered for booking lifecycle + billing events |
| QA & Monitoring | 🟡 In Progress | Automated tests for payments + bookings, alerts configured |
| Operational Docs | 🟡 In Progress | Playbooks for Stripe incidents, booking recovery, tenant onboarding |

---

## 7. Timeline & Next Steps
| Week | Focus | Key Deliverables |
|------|-------|------------------|
| Week 1 | Stripe live activation | Live price IDs, env updates, bypass removal, webhook QA |
| Week 2 | Resource-aware booking backend | Refactored API, migrations, service/staff allocation tests |
| Week 3 | Booking UX & emails | Multi-step modal, service catalog UI, Resend templates |
| Week 4 | Ops hardening & launch rehearsal | Monitoring, runbooks, beta tenant end-to-end testing |

**Dependencies:** Stripe account access, Supabase service-role keys, Resend template approval, QA bandwidth.  
**Risks:** Schema complexity for multi-sector bookings, webhook failures during cutover, tenant data completeness.

---

## 8. Success Metrics
- **Activation:** ≥80% of invited tenants complete Stripe checkout within 7 days.
- **Reservations:** First 10 live tenants receive ≥5 completed bookings each within 30 days.
- **Reliability:** <1% failed booking attempts, zero double-bookings.
- **Financial:** 100% of paid plans map to successful Stripe subscriptions; recovery time <4h for webhook outage.

---

## 9. Immediate Action Items
1. Provision live Stripe price IDs and inject them into environment configs.
2. Remove test-mode bypass and deploy to staging; validate with live-mode test tenant.
3. Draft technical design for resource-aware booking refactor; align across engineering + product.
4. Schedule QA sprint covering payments + bookings + notifications across at least three sector personas (restaurant, beauty, medical).
5. Update operations checklist and assign on-call owners for launch week.

---

**Document History:** Initial version created 17 November 2025 to capture current status and unblock go-live work on payments and reservations.

