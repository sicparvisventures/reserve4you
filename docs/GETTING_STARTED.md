# Getting Started with R4Y

**Welcome to R4Y!** This guide will help you get up and running quickly.

---

## 📋 Prerequisites Checklist

Before you begin, make sure you have:

- [ ] Node.js 18 or higher installed
- [ ] pnpm 8 or higher installed (`npm install -g pnpm`)
- [ ] Supabase account ([sign up](https://supabase.com))
- [ ] Stripe account ([sign up](https://stripe.com))
- [ ] Google Cloud Console account (for OAuth)
- [ ] Code editor (VS Code recommended)

---

## 🚀 Quick Setup (10 minutes)

### Step 1: Install Dependencies

```bash
cd /Users/dietmar/Desktop/ray2
pnpm install
```

**Expected output:** All packages install successfully (ignore peer dependency warnings about React 19)

### Step 2: Environment Variables

You already have `.env.local` with Supabase and Stripe credentials. Verify these are present:

```bash
cat .env.local | grep -E "(NEXT_PUBLIC_SUPABASE_URL|STRIPE_SECRET_KEY)"
```

**Missing variables to add:**

```env
# Add to .env.local
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Stripe subscription price IDs (after creating products)
STRIPE_PRICE_ID_START=price_xxx
STRIPE_PRICE_ID_PRO=price_xxx  
STRIPE_PRICE_ID_PLUS=price_xxx
```

### Step 3: Apply Database Migration

**⚠️ IMPORTANT:** This creates the R4Y schema. Back up your database first if it contains important data.

```bash
# Link to your Supabase project
supabase link --project-ref jrudqxovozqnmxypjtij

# Apply migration
supabase db push

# Generate TypeScript types
pnpm db:types
```

**Expected output:**
```
Applying migration 20241017000001_r4y_multi_tenant_schema.sql...
✔ Database migration complete
```

**Verify:**
```bash
# Should show new tables: tenants, locations, bookings, etc.
supabase db ls
```

### Step 4: Create Stripe Products

**In your terminal:**

```bash
# Start (€49/month)
stripe products create \
  --name="R4Y Start" \
  --description="1 location, 200 bookings/month"

stripe prices create \
  --product=prod_XXX \  # Replace with product ID from above
  --unit-amount=4900 \
  --currency=eur \
  --recurring-interval=month

# Pro (€99/month)
stripe products create \
  --name="R4Y Pro" \
  --description="3 locations, 1,000 bookings/month"

stripe prices create \
  --product=prod_YYY \
  --unit-amount=9900 \
  --currency=eur \
  --recurring-interval=month

# Plus (€199/month)
stripe products create \
  --name="R4Y Plus" \
  --description="Unlimited locations and bookings"

stripe prices create \
  --product=prod_ZZZ \
  --unit-amount=19900 \
  --currency=eur \
  --recurring-interval=month
```

**Copy the price IDs** (they look like `price_1234...`) and add them to `.env.local`:

```env
STRIPE_PRICE_ID_START=price_1234...
STRIPE_PRICE_ID_PRO=price_5678...
STRIPE_PRICE_ID_PLUS=price_9012...
```

### Step 5: Run Development Server

```bash
pnpm dev
```

**Open:** [http://localhost:3000](http://localhost:3000)

You should see the landing page with R4Y branding (accent color #FF5A5F).

---

## 🎯 What Works Right Now

### ✅ Completed Features

1. **Design System**
   - R4Y colors (accent red #FF5A5F)
   - Typography (system font stack)
   - Spacing (8pt grid)
   - Transitions (200-250ms ease-out)

2. **Database Schema**
   - 11 new tables created
   - Row Level Security (RLS) policies
   - Multi-tenant isolation
   - Helper functions for authorization

3. **Data Access Layer**
   - `/lib/auth/tenant-dal.ts` - Multi-tenant helpers
   - `/lib/auth/dal.ts` - Original auth helpers (still works)
   - Service-role queries in `/lib/db/queries.ts`

4. **UI Components**
   - `Sheet` - Bottom drawer for booking flow
   - `Badge` - Status indicators
   - `Skeleton` - Loading placeholders
   - All original components (Button, Input, Card, etc.)

5. **Configuration**
   - `/lib/config.ts` - Updated for subscriptions
   - `/lib/design-tokens.ts` - Complete design system
   - `.env.example` - Comprehensive template

### 🚧 In Progress (Next Steps)

1. **Consumer Routes**
   - `/` - Home page (needs carousel)
   - `/discover` - Search page (not started)
   - `/p/[slug]` - Location detail (not started)
   - `/profile` - User profile (not started)

2. **Booking Flow**
   - `BookingSheet` component (not started)
   - Availability API (not started)
   - Booking creation API (not started)

3. **Manager Portal**
   - Onboarding wizard (not started)
   - Dashboard (not started)
   - Calendar (not started)

---

## 🗺️ Development Roadmap

### Week 1: Consumer Experience

**Day 1-2: Routes & Layout**
- [ ] Update `/app/page.tsx` → Consumer home
- [ ] Create `/app/discover/page.tsx`
- [ ] Create `/app/p/[slug]/page.tsx`
- [ ] Create location card component
- [ ] Create action ribbon component

**Day 3-4: Booking Flow**
- [ ] Create `BookingSheet` component
- [ ] Step 1: Party size selector
- [ ] Step 2: Date picker + time slots
- [ ] Step 3: Guest form
- [ ] Add Zod validation

**Day 5: API Endpoints**
- [ ] `POST /api/availability/check`
- [ ] `POST /api/bookings/create`
- [ ] Transaction safety (SERIALIZABLE)
- [ ] Idempotency keys

### Week 2: Manager Portal

**Day 1-3: Onboarding**
- [ ] Create `/app/manager/onboarding/page.tsx`
- [ ] 7-step wizard component
- [ ] Step validations
- [ ] Progress persistence

**Day 4-5: Dashboard**
- [ ] Create `/app/manager/dashboard/page.tsx`
- [ ] Calendar component
- [ ] Reservations list
- [ ] Booking detail modal

### Week 3: Billing & Polish

**Day 1-2: Stripe Integration**
- [ ] Subscription checkout
- [ ] Webhook updates
- [ ] Quota enforcement
- [ ] Billing gate

**Day 3-4: Testing**
- [ ] Manual acceptance testing
- [ ] Error handling
- [ ] Loading states
- [ ] Edge cases

**Day 5: Documentation**
- [ ] API documentation
- [ ] Deployment guide
- [ ] User guides

---

## 📂 File Structure Guide

### Where to Add New Code

**Consumer Pages:**
```
/app/discover/page.tsx         → Search/filter restaurants
/app/p/[slug]/page.tsx        → Location detail
/app/profile/page.tsx          → User profile
```

**Manager Pages:**
```
/app/manager/onboarding/page.tsx    → Onboarding wizard
/app/manager/dashboard/page.tsx     → Main dashboard
/app/manager/reservations/page.tsx  → Reservations list
/app/manager/settings/page.tsx      → Settings
```

**API Routes:**
```
/app/api/availability/check/route.ts     → Check available slots
/app/api/bookings/create/route.ts        → Create booking
/app/api/locations/search/route.ts       → Search locations
/app/api/manager/publish/route.ts        → Publish location
```

**Components:**
```
/components/booking/BookingSheet.tsx     → Booking flow
/components/location/LocationCard.tsx    → Location card
/components/calendar/Calendar.tsx        → Manager calendar
/components/onboarding/WizardStep.tsx    → Onboarding steps
```

**Utilities:**
```
/lib/validation/booking.ts     → Zod schemas for booking
/lib/validation/location.ts    → Zod schemas for location
/lib/api/availability.ts       → Availability algorithm
/lib/api/bookings.ts           → Booking logic
```

---

## 🔍 Testing Your Changes

### Database Queries

```bash
# Test RLS helper function
supabase db exec "SELECT is_tenant_member('some-uuid', 'some-uuid')"

# Check table counts
supabase db exec "SELECT tablename, n_live_tup FROM pg_stat_user_tables"

# View RLS policies
supabase db exec "SELECT schemaname, tablename, policyname FROM pg_policies"
```

### API Testing

```bash
# Test availability check
curl -X POST http://localhost:3000/api/availability/check \
  -H "Content-Type: application/json" \
  -d '{
    "location_id": "uuid-here",
    "date": "2025-10-20",
    "party_size": 4
  }'

# Test location search
curl http://localhost:3000/api/locations/search?query=italian&priceRange=2
```

### Stripe Testing

```bash
# Listen for webhooks locally
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Trigger test checkout
stripe trigger checkout.session.completed
```

---

## 🐛 Common Issues & Solutions

### Issue: Migration fails with "relation already exists"

**Solution:** Tables from previous run exist. Reset database:

```bash
supabase db reset
supabase db push
```

### Issue: TypeScript errors about database types

**Solution:** Regenerate types after migration:

```bash
pnpm db:types
# Restart your IDE/TypeScript server
```

### Issue: "Cannot find module '@/lib/design-tokens'"

**Solution:** TypeScript path aliases not resolved. Restart dev server:

```bash
# Kill server (Ctrl+C)
pnpm dev
```

### Issue: Stripe webhook signature verification fails

**Solution:** Update webhook secret from Stripe CLI:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
# Copy the webhook signing secret (whsec_...)
# Update STRIPE_WEBHOOK_SECRET in .env.local
# Restart dev server
```

### Issue: RLS blocking queries even for authorized users

**Solution:** Check membership exists:

```sql
SELECT * FROM memberships WHERE user_id = 'your-user-id';
```

If no membership, create one:

```sql
INSERT INTO memberships (tenant_id, user_id, role)
VALUES ('your-tenant-id', 'your-user-id', 'OWNER');
```

---

## 📚 Key Documentation Files

1. **[PRD](./prd-r4y.md)** - Complete product spec (58KB)
   - All features defined
   - User flows
   - API specifications
   - Acceptance criteria

2. **[Reconnaissance](./reconnaissance-report.md)** - Codebase analysis (21KB)
   - As-is architecture
   - Gap analysis
   - Risk assessment

3. **[Progress](./implementation-progress.md)** - Current status
   - What's complete
   - What's pending
   - Next steps

4. **[README_R4Y](../README_R4Y.md)** - Main README
   - Project overview
   - Setup guide
   - Architecture

---

## 💡 Development Tips

### Use Existing Patterns

```typescript
// ✅ Good: Use tenant DAL
import { getTenantLocations } from '@/lib/auth/tenant-dal';
const locations = await getTenantLocations(tenantId);

// ❌ Bad: Direct Supabase query
const { data } = await supabase.from('locations').select('*');
```

### Use Design Tokens

```typescript
// ✅ Good: Use design tokens
import { colors, spacing } from '@/lib/design-tokens';
const bgColor = colors.accent; // #FF5A5F

// ❌ Bad: Hardcoded values
const bgColor = '#FF5A5F';
```

### Validate with Zod

```typescript
// ✅ Good: Define schema
import { z } from 'zod';

const bookingSchema = z.object({
  location_id: z.string().uuid(),
  party_size: z.number().min(1).max(20),
  start_time: z.string().datetime(),
});

// Use it
const result = bookingSchema.safeParse(data);
if (!result.success) {
  return Response.json({ error: result.error }, { status: 400 });
}
```

### Server Components by Default

```typescript
// ✅ Good: Server Component (default)
export default async function LocationPage({ params }: { params: { slug: string } }) {
  const location = await getPublicLocation(params.slug);
  return <div>{location.name}</div>;
}

// Only use 'use client' when needed:
// - onClick handlers
// - useState, useEffect
// - Browser APIs
```

---

## 🎓 Learning Resources

### Next.js 15
- [App Router Docs](https://nextjs.org/docs/app)
- [Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
- [Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)

### Supabase
- [JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Database Functions](https://supabase.com/docs/guides/database/functions)

### Stripe
- [Subscriptions](https://stripe.com/docs/billing/subscriptions/overview)
- [Webhooks](https://stripe.com/docs/webhooks)
- [Payment Intents](https://stripe.com/docs/payments/payment-intents)

### TypeScript
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [Zod Documentation](https://zod.dev/)

---

## ✅ Verification Checklist

Before starting development, verify:

- [ ] `pnpm dev` runs without errors
- [ ] Database migration applied successfully
- [ ] Types generated (`/lib/supabase/types.ts` exists and is recent)
- [ ] Landing page loads and shows R4Y colors
- [ ] `.env.local` has all required variables
- [ ] Stripe products and prices created
- [ ] Can sign in to existing user account

---

## 🤝 Need Help?

1. **Check Documentation:**
   - Start with [PRD](./prd-r4y.md) for specifications
   - Check [Progress](./implementation-progress.md) for status
   - Review [README_R4Y](../README_R4Y.md) for architecture

2. **Common Tasks:**
   - Creating a page? See existing pages in `/app`
   - Creating a component? See `/components/ui`
   - Adding API route? See `/app/api`
   - Database query? Use `/lib/auth/tenant-dal.ts`

3. **Debugging:**
   - Check browser console for errors
   - Check terminal for server errors
   - Use `console.log()` liberally
   - Check Supabase logs in dashboard

4. **Database Issues:**
   - Use Supabase dashboard SQL editor
   - Check RLS policies if queries return empty
   - Verify foreign key relationships

---

## 🎉 You're Ready!

Your R4Y foundation is complete and solid. The database schema is ready, the design system is implemented, and all the infrastructure is in place.

**Next steps:**
1. Pick a task from [Implementation Progress](./implementation-progress.md)
2. Create a feature branch
3. Implement following existing patterns
4. Test thoroughly
5. Commit with descriptive message

**Recommended starting point:** Consumer home page (`/app/page.tsx`)
- Relatively straightforward
- Introduces key concepts
- Builds on existing components
- High user value

Good luck! 🚀


