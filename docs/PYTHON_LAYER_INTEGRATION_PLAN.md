# Python Domain Layer Integration Plan

**Date:** 17 November 2025  
**Owner:** Platform Architecture  
**Goal:** Introduce a dedicated Python service layer that centralizes business logic (bookings, billing, analytics) so the Next.js front end becomes a thin UI client while Supabase remains the system of record.

---

## 1. Architectural Choices

| Topic | Decision | Rationale |
|-------|----------|-----------|
| Python stack | **FastAPI + Pydantic + SQLModel** | FastAPI offers async performance, rich OpenAPI generation, and lightweight deployment. SQLModel (SQLAlchemy core) gives type-safe models for Supabase Postgres. |
| Hosting | **Containerized service on Fly.io (EU-West) with autoscaling** | Keeps latency low for EU tenants, supports background workers, integrates with Supabase networking, and avoids cold-start penalties. |
| Background processing | **Celery + Redis (Fly volume)** | Handles notifications, recurring bookings, analytics without blocking API threads. |
| Scope | **Migrate complex domains first**: bookings, billing/Stripe orchestration, analytics, notifications. Leave simple CRUD/UI helpers on Next.js API routes for now. |
| Data access | **Direct Postgres access via Supabase service key** using a connection pooler (pgBouncer) and supabase-js for storage/resend calls when needed. |
| Real-time | **Continue using Supabase Realtime**; Python publishes events via Postgres NOTIFY functions and Supabase channel tables so React clients keep working. |
| Authentication | **Validate Supabase JWTs** issued to clients; FastAPI middleware verifies signature against Supabase JWKs and injects tenant/user claims. Service-to-service calls use Supabase service-role key with mTLS on Fly private network. |
| Dev workflow | **Single OpenAPI contract** generated from FastAPI; use `openapi-typescript` to create typed clients for Next.js. Share core schemas via a repo package (`packages/contracts`). |
| Timeline | **Phased rollout** (Week 1 infra, Week 2 bookings, Week 3 billing, Week 4 analytics + cutover) to reduce risk and allow incremental QA. |

---

## 2. Target Service Responsibilities

1. **Booking Orchestrator**
   - APIs: `POST /bookings`, `GET /availability`, `POST /bookings/recurring`.
   - Logic: sector-aware resource allocation, policy validation, deposits/prepayments, intake forms, recurring generation.
   - Emits domain events (`booking.created`, `booking.payment_required`) via Postgres or Redis streams.

2. **Billing & Payments**
   - APIs: `POST /billing/checkout`, `POST /billing/webhooks/stripe`.
   - Responsibilities: create Stripe Checkout sessions, persist billing state, enforce quotas, downgrade on payment failure, expose subscription status to UI.

3. **Notifications & Messaging**
   - Background workers consuming domain events and sending Resend emails, SMS (future Twilio), in-app notifications.
   - Stores delivery logs for observability.

4. **Analytics & Reporting**
   - Precompute booking KPIs per tenant, feed dashboard widgets, export data to Supabase `aggregates` tables.

---

## 3. Integration Blueprint

### 3.1 API Gateway
- Add a thin Next.js API proxy that forwards `/api/python/*` requests to the FastAPI service over Fly private networking.
- Use `NEXT_PUBLIC_API_BASE` to direct client-side fetches straight to FastAPI via HTTPS for authenticated calls; fallback to SSR proxy for sensitive operations.

### 3.2 Database Connectivity
- Provision Supabase connection string with service-role key scoped to `python_service`.
- Configure pgBouncer and environment variables:
  ```
  DATABASE_URL=postgresql://postgres.<supabase>.supabase.co:6543/postgres
  SUPABASE_SERVICE_KEY=<service-key>
  ```
- Implement shared schema module referencing existing tables (`bookings`, `resources`, `service_offerings`, `billing_state`, etc.) to avoid drift.

### 3.3 Authentication Middleware
- Fetch Supabase JWKS on startup, cache for 24h.
- Middleware steps:
  1. Read `Authorization: Bearer <token>` or service header.
  2. Verify signature and expiration.
  3. Load tenant memberships if needed (via Supabase RPC) and attach to request context.
- Provide service-level API keys for internal jobs (Cron, Supabase functions).

### 3.4 Eventing & Real-time
- Bookings/Billing endpoints insert audit rows into `event_log` table (existing) and trigger Supabase Realtime.
- For heavy traffic, use Redis streams to decouple Celery workers and optionally push to Supabase via RPC.

### 3.5 Developer Experience
- Repository additions:
  ```
  /python-service
    /app
      main.py
      routers/bookings.py
      routers/billing.py
      services/...
      models/...
    /workers
    pyproject.toml
    Dockerfile
  /packages/contracts
    openapi.json
    generated/types.ts
  ```
- CI pipeline: lint (ruff), tests (pytest), type checking (mypy), Docker build, Fly deploy.
- Local dev uses `docker-compose` for FastAPI + Redis + Supabase (remote).

---

## 4. Rollout Plan

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| Week 1 | Infra & scaffolding | FastAPI repo, Fly staging app, JWT middleware, health checks, OpenAPI client generation. |
| Week 2 | Booking migration | Implement booking endpoints, integrate with Supabase tables, update Next.js booking calls to Python service, add automated tests. |
| Week 3 | Billing migration | Port Stripe checkout + webhook logic, remove legacy bypass in Next.js, validate end-to-end upgrade flows. |
| Week 4 | Notifications & analytics | Move email/SMS triggers into Celery workers, add dashboard data endpoints, run load tests, finalize observability (Prometheus/Grafana or Fly metrics). |

Post-rollout: deprecate redundant Next.js API routes, monitor performance, iterate on advanced features (ML recommendations, pricing optimization) within Python layer.

---

## 5. Immediate Tasks
1. Create `python-service` scaffold (FastAPI, Celery, Docker) inside repo.
2. Provision Fly.io apps (`reserve4you-python`, `reserve4you-python-workers`) in EU-West; set secrets (database URL, Supabase key, Stripe keys).
3. Implement auth middleware + sample `/health` + `/whoami` endpoints for verification.
4. Generate OpenAPI client and update Next.js config to consume new endpoints behind feature flag.
5. Plan booking module refactor (sequence diagrams, DB contract) before coding Week 2.

---

This plan keeps Supabase as the authoritative data layer while giving us a Python domain service suited for complex orchestration, better code reuse across sectors, and future ML capabilities, all while minimizing disruption to the existing Next.js front end.

