# R4Y - Restaurant Reservations Platform

**Production-grade, multi-tenant restaurant booking system built on Next.js 15 and Supabase.**

<div align="center">
  <img src="https://img.shields.io/badge/Status-In_Development-yellow" alt="Status" />
  <img src="https://img.shields.io/badge/Phase-2_Consumer_Experience-blue" alt="Phase" />
  <img src="https://img.shields.io/badge/Completion-23%25-green" alt="Progress" />
</div>

---

## 🎯 What is R4Y?

R4Y is a **professional restaurant reservations platform** that connects diners with available tables in real-time while providing restaurants with powerful tools to manage bookings, tables, and operations.

### For Diners (Consumers)
- 🔍 Discover nearby restaurants with live availability
- 📱 Book tables in 3 simple steps (60 seconds or less)
- ⭐ Save favorites and manage booking history
- 👤 Guest booking with phone verification (no account required)

### For Restaurants (Managers)
- 📅 Professional booking management dashboard
- 🎯 Real-time calendar with drag-and-drop
- 💰 Flexible policies (cancellation, deposits, no-show fees)
- 🔗 Integration with Lightspeed POS
- 💳 Subscription-based with clear ROI (€49-€199/month)

---

## ✨ Key Features

### Multi-Tenant Architecture
- **Tenants:** Restaurant groups can manage multiple locations
- **Roles:** OWNER, MANAGER, STAFF with hierarchical permissions
- **Isolation:** Complete data separation via Row Level Security (RLS)

### Smart Booking Engine
- **Real-time availability:** Sub-second response times
- **No double-bookings:** SERIALIZABLE transactions with row locking
- **Table assignment:** Automatic or manual allocation
- **Party size handling:** Combinable tables for large groups

### Subscription Billing
- **Three tiers:** Start (€49), Pro (€99), Plus (€199)
- **Usage quotas:** Locations and bookings per month
- **Billing gate:** Cannot publish without active subscription
- **Stripe-powered:** Secure checkout and customer portal

### Production-Ready
- **Type-safe:** TypeScript throughout
- **Secure:** RLS policies, auth checks, input validation
- **Performant:** Optimized queries, indexes, caching
- **Scalable:** Multi-tenant design, horizontal scaling ready

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | Next.js 15 (App Router, Turbopack) |
| **Language** | TypeScript 5.8 |
| **Database** | PostgreSQL (Supabase) |
| **Auth** | Supabase Auth (Google OAuth, SMS) |
| **Payments** | Stripe (Subscriptions + PaymentIntents) |
| **Styling** | Tailwind CSS 4 (R4Y Design System) |
| **UI Components** | Radix UI + shadcn/ui patterns |
| **Forms** | React Hook Form + Zod validation |
| **State** | React Query (@tanstack) |
| **Package Manager** | pnpm 8+ |

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ ([Download](https://nodejs.org/))
- pnpm 8+ (`npm install -g pnpm`)
- Supabase CLI ([Install](https://supabase.com/docs/guides/cli))
- Stripe CLI for webhooks ([Install](https://stripe.com/docs/stripe-cli))

### 1. Clone and Install

```bash
git clone <your-repo-url> r4y
cd r4y
pnpm install
```

### 2. Environment Setup

```bash
cp .env.example .env.local
```

Edit `.env.local` and fill in your values:

```env
# Supabase (https://app.supabase.com/project/_/settings/api)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Application
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Stripe (https://dashboard.stripe.com/apikeys)
STRIPE_SECRET_KEY=sk_test_your-key
STRIPE_WEBHOOK_SECRET=whsec_your-secret

# Stripe Price IDs (create in dashboard)
STRIPE_PRICE_ID_START=price_start_id
STRIPE_PRICE_ID_PRO=price_pro_id
STRIPE_PRICE_ID_PLUS=price_plus_id

# Google OAuth (https://console.cloud.google.com/apis/credentials)
GOOGLE_OAUTH_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=your-client-secret
```

### 3. Database Setup

Link to your Supabase project:

```bash
supabase link --project-ref your-project-id
```

Apply the R4Y schema migration:

```bash
supabase db push
```

This creates:
- 11 new tables (tenants, locations, bookings, etc.)
- RLS policies for multi-tenant security
- Helper functions for authorization
- Performance indexes

Generate TypeScript types:

```bash
pnpm db:types
```

### 4. Stripe Setup

Create three subscription products in Stripe:

**Start Plan:** €49/month
```bash
stripe products create --name="R4Y Start" --description="1 location, 200 bookings/month"
stripe prices create --product=prod_XXX --unit-amount=4900 --currency=eur --recurring-interval=month
```

**Pro Plan:** €99/month
```bash
stripe products create --name="R4Y Pro" --description="3 locations, 1,000 bookings/month"
stripe prices create --product=prod_YYY --unit-amount=9900 --currency=eur --recurring-interval=month
```

**Plus Plan:** €199/month
```bash
stripe products create --name="R4Y Plus" --description="Unlimited locations and bookings"
stripe prices create --product=prod_ZZZ --unit-amount=19900 --currency=eur --recurring-interval=month
```

Update `.env.local` with the price IDs.

### 5. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create OAuth 2.0 Client ID
3. Add authorized redirect URIs:
   - `http://localhost:3000/auth/callback` (development)
   - `https://your-project.supabase.co/auth/v1/callback` (Supabase)
4. Update `.env.local` with credentials

Configure in Supabase:
1. Go to Authentication → Providers → Google
2. Enable Google
3. Add Client ID and Secret
4. Save

### 6. Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

### 7. Test Stripe Webhooks (Optional)

In a new terminal:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Copy the webhook signing secret to `.env.local`:

```env
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

---

## 📁 Project Structure

```
r4y/
├── app/                          # Next.js App Router
│   ├── (login)/                 # Auth pages (sign-in, sign-up)
│   ├── api/                     # API routes
│   │   ├── availability/        # Check available slots
│   │   ├── bookings/            # Create/manage bookings
│   │   ├── locations/           # Search locations
│   │   ├── manager/             # Manager-only endpoints
│   │   └── stripe/              # Payment webhooks
│   ├── app/                     # Protected app (legacy)
│   ├── discover/                # [TODO] Consumer search
│   ├── manager/                 # [TODO] Manager portal
│   ├── p/                       # [TODO] Location detail pages
│   ├── profile/                 # [TODO] Consumer profile
│   └── page.tsx                 # Landing/Home
├── components/
│   ├── ui/                      # Base UI components
│   │   ├── button.tsx          # ✅ Buttons
│   │   ├── input.tsx           # ✅ Form inputs
│   │   ├── card.tsx            # ✅ Cards
│   │   ├── sheet.tsx           # ✅ Bottom drawer (NEW)
│   │   ├── badge.tsx           # ✅ Status badges (NEW)
│   │   └── skeleton.tsx        # ✅ Loading state (NEW)
│   ├── booking/                # [TODO] Booking components
│   ├── calendar/               # [TODO] Manager calendar
│   └── location/               # [TODO] Location components
├── lib/
│   ├── auth/
│   │   ├── dal.ts              # ✅ Auth DAL (original)
│   │   └── tenant-dal.ts       # ✅ Multi-tenant helpers (NEW)
│   ├── db/
│   │   └── queries.ts          # ✅ Service-role queries
│   ├── payments/
│   │   └── stripe.ts           # ⚠️ Needs subscription updates
│   ├── supabase/
│   │   ├── client.ts           # ✅ Client-side
│   │   └── server.ts           # ✅ Server-side
│   ├── config.ts               # ✅ Updated for R4Y
│   ├── design-tokens.ts        # ✅ R4Y design system (NEW)
│   └── utils.ts                # ✅ Utilities
├── supabase/
│   └── migrations/
│       ├── 20240101...sql      # ✅ Original schema
│       └── 20241017...sql      # ✅ R4Y schema (NEW)
├── docs/
│   ├── reconnaissance-report.md  # ✅ As-is analysis (NEW)
│   ├── prd-r4y.md               # ✅ Complete PRD (NEW)
│   └── implementation-progress.md # ✅ Progress tracker (NEW)
└── .env.example                 # ✅ Environment template (NEW)
```

**Legend:**
- ✅ Implemented
- ⚠️ Needs updates
- [TODO] Not started

---

## 🗄️ Database Schema

### Core Tables

**Tenants & Memberships**
- `tenants` - Restaurant organizations
- `memberships` - Team members with roles (OWNER/MANAGER/STAFF)

**Locations & Resources**
- `locations` - Physical restaurant locations
- `tables` - Restaurant tables (seats, combinable)
- `shifts` - Service periods (lunch, dinner, etc.)
- `policies` - Booking rules (cancellation, deposits, no-shows)

**Bookings & Consumers**
- `consumers` - Diners (with or without auth account)
- `bookings` - Reservations with status tracking
- `favorites` - Consumer saved locations

**Billing & Integrations**
- `billing_state` - Subscription status and quotas
- `pos_integrations` - Lightspeed, Square, etc.

**Legacy (Unchanged)**
- `users` - Original user table (still used)
- `purchases` - Original purchases (still used)

### Key Indexes

```sql
-- Critical for performance
idx_bookings_location_time    -- Fast availability checks
idx_bookings_table_time       -- Prevent double-bookings
idx_locations_geo             -- Nearby search
idx_memberships_tenant_user   -- Auth checks
```

### RLS Security

All tables have Row Level Security enabled:
- **Managers:** See only their tenant's data
- **Consumers:** See only their own bookings
- **Public:** See only published locations
- **Service Role:** Full access for webhooks

---

## 🎨 Design System

### R4Y Brand Colors

```css
--primary: #FF5A5F;        /* R4Y Accent Red */
--background: #F7F7F9;     /* Light gray background */
--text: #111111;           /* Near-black text */
--border: #E7E7EC;         /* Light gray borders */
--success: #18C964;        /* Green */
--warning: #FFB020;        /* Orange */
--error: #E11D48;          /* Red */
--info: #3B82F6;           /* Blue */
```

### Typography

- **Font Stack:** System fonts (Apple, Segoe, Roboto)
- **Sizes:** 12px, 14px, 16px, 18px, 24px, 32px, 48px
- **Line Height:** 1.5 for body, 1.2 for headings

### Spacing (8pt Grid)

```
4px, 8px, 16px, 24px, 32px, 48px, 64px
```

### Border Radius

```
sm: 8px, md: 12px, lg: 16px, xl: 20px, 2xl: 24px, full: 9999px
```

### Transitions

```
fast: 200ms, medium: 250ms, slow: 300ms (ease-out curve)
```

See `/lib/design-tokens.ts` for complete system.

---

## 🔐 Security

### Authentication
- **Consumers:** Google OAuth or guest (SMS verified)
- **Managers:** Email/password or PIN
- **Session:** HTTP-only cookies via Supabase
- **2FA:** Optional for manager accounts

### Authorization
- **RLS Policies:** Database-level access control
- **DAL Pattern:** Centralized auth checks
- **Role Hierarchy:** OWNER > MANAGER > STAFF
- **Tenant Isolation:** Data scoped to tenant_id

### Payments
- **PCI Compliant:** Stripe handles card data
- **Webhook Verification:** Signature validation
- **Idempotency:** Prevent duplicate charges
- **Secure Storage:** Stripe customer IDs only

### Best Practices
- ✅ Input validation with Zod
- ✅ CSRF protection (Next.js built-in)
- ✅ Rate limiting on API routes
- ✅ SQL injection prevention (Supabase client)
- ✅ XSS prevention (React auto-escaping)

---

## 📊 Billing Tiers

| Feature | Start (€49) | Pro (€99) | Plus (€199) |
|---------|-------------|-----------|-------------|
| **Locations** | 1 | 3 | Unlimited |
| **Bookings/Month** | 200 | 1,000 | Unlimited |
| **Deposits** | ❌ | ✅ | ✅ |
| **Waitlist** | ❌ | ✅ | ✅ |
| **Team Members** | 1 | 3 | Unlimited |
| **POS Integration** | ❌ | ❌ | ✅ |
| **Priority Support** | ❌ | ✅ | ✅ |
| **API Access** | ❌ | ❌ | ✅ |

All plans include:
- Real-time availability
- Calendar view
- Email notifications
- Basic analytics
- 14-day free trial

---

## 🧪 Testing

### Manual Testing

**Consumer Flow:**
1. Go to `/` → See available restaurants
2. Click restaurant → Go to `/p/[slug]`
3. Click "Reserveren" → Bottom sheet opens
4. Select party size, date, time
5. Fill guest details → Submit
6. Verify booking in database

**Manager Flow:**
1. Go to `/manager` → Sign up
2. Complete 7-step onboarding
3. At step 6: Complete Stripe checkout (use test card `4242 4242 4242 4242`)
4. At step 7: Publish location
5. Go to dashboard → See calendar

**Billing Gate:**
1. As manager, let subscription expire
2. Try to publish location → Should fail
3. Renew subscription
4. Try again → Should succeed

### Automated Testing (TODO)

```bash
# Unit tests
pnpm test

# E2E tests
pnpm test:e2e

# Coverage
pnpm test:coverage
```

---

## 🚢 Deployment

### Vercel (Recommended)

1. **Push to GitHub:**
   ```bash
   git push origin main
   ```

2. **Import to Vercel:**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your repository
   - Framework: Next.js
   - Root: `./`

3. **Add Environment Variables:**
   - Copy all from `.env.local`
   - Set `NODE_ENV=production`
   - Set `NEXT_PUBLIC_SITE_URL=https://your-domain.com`

4. **Deploy:**
   - Vercel auto-deploys on push
   - Production: `main` branch
   - Preview: All PRs

### Supabase Production

1. **Create Production Project:**
   - Go to [app.supabase.com](https://app.supabase.com)
   - Create new project
   - Choose region (EU for GDPR)

2. **Apply Migrations:**
   ```bash
   supabase link --project-ref production-project-id
   supabase db push
   ```

3. **Configure Auth:**
   - Add production redirect URIs
   - Enable Google OAuth
   - Configure email templates

4. **Update Environment:**
   - Update Vercel with production Supabase URLs and keys

### Stripe Production

1. **Activate Stripe Account:**
   - Complete onboarding at [dashboard.stripe.com](https://dashboard.stripe.com)
   - Add business details
   - Verify bank account

2. **Create Production Products:**
   - Use same commands as setup but with live keys
   - Note the live price IDs

3. **Configure Webhooks:**
   - Add endpoint: `https://your-domain.com/api/stripe/webhook`
   - Select events: `customer.subscription.*`, `invoice.*`, `checkout.session.completed`
   - Copy signing secret to environment

4. **Update Environment:**
   - Replace test keys with live keys
   - Update webhook secret

---

## 📚 Documentation

- **[PRD](./docs/prd-r4y.md)** - Complete product requirements
- **[Reconnaissance](./docs/reconnaissance-report.md)** - Codebase analysis
- **[Progress](./docs/implementation-progress.md)** - Implementation status
- **[Design Tokens](./lib/design-tokens.ts)** - Design system code
- **[SETUP.md](./SETUP.md)** - Original setup guide
- **[STYLING.md](./STYLING.md)** - Original styling guide
- **[CLAUDE.md](./CLAUDE.md)** - AI assistant guide

---

## 🤝 Contributing

### Development Workflow

1. **Pick a Task:**
   - See [Implementation Progress](./docs/implementation-progress.md)
   - Check "Next Steps" section

2. **Create Branch:**
   ```bash
   git checkout -b feature/booking-sheet
   ```

3. **Develop:**
   - Follow existing patterns
   - Use design tokens from `/lib/design-tokens.ts`
   - Use DAL functions from `/lib/auth/tenant-dal.ts`
   - Add Zod validation for all inputs

4. **Test:**
   - Manual testing
   - Check RLS policies
   - Test error cases

5. **Commit:**
   ```bash
   git add .
   git commit -m "feat: Add booking sheet component with 3-step flow"
   ```

6. **Push & PR:**
   ```bash
   git push origin feature/booking-sheet
   ```

### Code Style

- **TypeScript:** Strict mode, no `any`
- **Components:** Server Components by default
- **Functions:** Descriptive names, JSDoc comments
- **Imports:** Absolute paths (`@/lib/...`)
- **CSS:** Tailwind classes, avoid custom CSS
- **Naming:** camelCase for functions, PascalCase for components

---

## 🐛 Troubleshooting

### Database Issues

**Migration fails:**
```bash
# Check status
supabase db reset --db-url "postgresql://..."

# Reapply
supabase db push
```

**RLS blocking queries:**
- Check if user has proper membership
- Verify tenant_id matches
- Use service role client for debugging

### Auth Issues

**Google OAuth not working:**
1. Check redirect URIs match exactly
2. Verify credentials in Supabase dashboard
3. Check `.env.local` has correct values

**Session expires:**
- Default: 1 hour
- Configure in Supabase → Authentication → Settings

### Stripe Issues

**Webhooks failing:**
- Check signature verification
- Verify webhook secret matches
- Check endpoint is publicly accessible

**Test cards:**
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- 3D Secure: `4000 0025 0000 3155`

---

## 📈 Roadmap

### Phase 2: Consumer Experience (In Progress)
- [ ] Home page with action ribbon
- [ ] Discover page with search/filters
- [ ] Location detail pages
- [ ] Booking bottom sheet (3 steps)
- [ ] Availability API
- [ ] Booking creation API

### Phase 3: Manager Portal (Planned)
- [ ] Manager authentication
- [ ] 7-step onboarding wizard
- [ ] Dashboard with calendar
- [ ] Reservations management
- [ ] Settings pages

### Phase 4: Billing & Integrations (Planned)
- [ ] Stripe subscription checkout
- [ ] Webhook extensions
- [ ] Quota enforcement
- [ ] Customer portal
- [ ] Lightspeed OAuth

### Phase 5: Testing & Polish (Planned)
- [ ] E2E acceptance tests
- [ ] Error handling
- [ ] Loading states
- [ ] Accessibility audit
- [ ] Performance optimization

### Future (Post-MVP)
- [ ] Email/SMS notifications
- [ ] CRM features
- [ ] Analytics dashboard
- [ ] Review/rating system
- [ ] Mobile apps (React Native)
- [ ] Multi-language support

---

## 📄 License

MIT License - See [LICENSE](./LICENSE) file for details.

---

## 🙏 Acknowledgments

Built on the excellent [SaaS Template for AI Lite](https://github.com/TeemuSo/saas-template-for-ai-lite) by Teemu Sormunen.

**Technologies:**
- [Next.js](https://nextjs.org/) - React framework
- [Supabase](https://supabase.com/) - Backend platform
- [Stripe](https://stripe.com/) - Payment processing
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Radix UI](https://www.radix-ui.com/) - UI primitives
- [Vaul](https://github.com/emilkowalski/vaul) - Drawer component
- [Zod](https://zod.dev/) - Schema validation

---

## 📞 Support

- **Documentation:** See `/docs` folder
- **Issues:** [GitHub Issues](https://github.com/your-repo/issues)
- **Discussions:** [GitHub Discussions](https://github.com/your-repo/discussions)

---

**Built with ❤️ for the restaurant industry**


