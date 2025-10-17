# COMPLETE R4Y SETUP - FINAL CHECKLIST

## ALLE FEATURES NU LIVE:

### 1. BEDRIJF BEHEER
- ✅ Bedrijf aanmaken via `/manager`
- ✅ Bedrijf verwijderen (cascade delete)
- ✅ Meerdere bedrijven per gebruiker

### 2. VESTIGING BEHEER
- ✅ Vestiging toevoegen via dashboard
- ✅ Vestiging verwijderen per locatie
- ✅ Meerdere vestigingen per bedrijf
- ✅ Empty state in dashboard

### 3. ABONNEMENT SYSTEEM
- ✅ 6-tier pricing (FREE tot ENTERPRISE)
- ✅ Quota enforcement per tier
- ✅ Gratis tier zonder betaling
- ✅ Clean UI zonder emoji's

### 4. CONSUMER EXPERIENCE
- ✅ Homepage met published locations
- ✅ Booking flow (3 stappen)
- ✅ Location detail pages
- ✅ Restaurant search & filter

### 5. MANAGER PORTAL
- ✅ Dashboard met stats
- ✅ Onboarding wizard (8 stappen)
- ✅ Settings page
- ✅ Multi-location support

---

## DATABASE MIGRATIONS TO RUN:

Open **Supabase SQL Editor** en run in volgorde:

```sql
-- 1. Base schema (if not done)
-- File: /supabase/migrations/20241017000002_r4y_multi_tenant_schema_safe.sql

-- 2. Tenant RLS fix (if not done)
-- File: /supabase/migrations/20241017000005_fix_tenant_creation_rls.sql

-- 3. Onboarding columns fix (if not done)
-- File: /supabase/migrations/20241017000006_fix_onboarding_columns.sql

-- 4. New billing tiers
-- File: /supabase/migrations/20241017000008_add_new_billing_tiers.sql

-- 5. Tenant cascade delete
-- File: /supabase/migrations/20241017000009_tenant_cascade_delete.sql

-- 6. Location cascade delete
-- File: /supabase/migrations/20241017000010_location_cascade_delete.sql
```

---

## QUICK START:

### STAP 1: Database Setup
```sql
-- Run alle 6 migrations hierboven in Supabase SQL Editor
```

### STAP 2: Maak Een Bedrijf
```
http://localhost:3007/manager/onboarding?step=1
```

**Vul in:**
- Stap 1: Bedrijfsnaam, branding
- Stap 2: Eerste vestiging (adres, openingstijden)
- Stap 3: Tafels (bijv. 5 tafels, 2-4 personen)
- Stap 4: Policies (optioneel)
- Stap 5: Betaalinstellingen (skip)
- Stap 6: Kies **FREE** (gratis, geen betaling!)
- Stap 7: Integraties (skip)
- Stap 8: Klik "Publiceer Restaurant"

### STAP 3: Check Homepage
```
http://localhost:3007
```

Je restaurant verschijnt in "Vanavond beschikbaar"!

### STAP 4: Test Dashboard
```
http://localhost:3007/manager/[tenant-id]/dashboard
```

**Features:**
- Zie je eerste vestiging
- Stats: vandaag, bevestigd, capaciteit
- Klik "Nieuwe Vestiging" om tweede locatie toe te voegen
- Klik trash icon om vestiging te verwijderen

---

## KEY URLS:

### Consumer:
- Homepage: `http://localhost:3007`
- Discover: `http://localhost:3007/discover`
- Location detail: `http://localhost:3007/p/[slug]`
- Profile: `http://localhost:3007/profile`

### Manager:
- Hub: `http://localhost:3007/manager`
- Dashboard: `http://localhost:3007/manager/[tenantId]/dashboard`
- Onboarding: `http://localhost:3007/manager/onboarding?step=1`
- New location: `http://localhost:3007/manager/onboarding?step=2&tenantId=[ID]`
- Settings: `http://localhost:3007/manager/[tenantId]/settings`

---

## SQL HELPER QUERIES:

### View All Data:
```sql
-- All tenants
SELECT * FROM tenants ORDER BY created_at DESC;

-- All locations with status
SELECT 
  l.id,
  l.name,
  l.slug,
  l.is_public,
  l.is_active,
  t.name as tenant_name,
  (SELECT COUNT(*) FROM tables WHERE location_id = l.id) as tables,
  (SELECT COUNT(*) FROM shifts WHERE location_id = l.id) as shifts,
  (SELECT COUNT(*) FROM bookings WHERE location_id = l.id) as bookings
FROM locations l
JOIN tenants t ON l.tenant_id = t.id
ORDER BY l.created_at DESC;

-- All billing states
SELECT 
  bs.*,
  t.name as tenant_name
FROM billing_state bs
JOIN tenants t ON bs.tenant_id = t.id;
```

### Publish Location:
```sql
-- Manual publish
UPDATE locations 
SET is_public = TRUE, is_active = TRUE 
WHERE id = 'your-location-id';

-- Or use helper script:
-- File: /supabase/scripts/publish_location.sql
```

### Delete Data:
```sql
-- Delete tenant (cascade)
SELECT delete_tenant_cascade(
  'tenant-id'::uuid,
  'owner-user-id'::uuid
);

-- Delete location (cascade)
SELECT delete_location_cascade(
  'location-id'::uuid,
  'manager-user-id'::uuid
);
```

---

## TESTING CHECKLIST:

### Consumer Flow:
```
☐ 1. Open homepage
☐ 2. See published restaurants
☐ 3. Click on restaurant card
☐ 4. See detail page with tabs
☐ 5. Click "Reserveer"
☐ 6. Select people, date, time
☐ 7. Fill in guest info
☐ 8. Submit booking
☐ 9. See confirmation
```

### Manager Flow:
```
☐ 1. Sign up / Login
☐ 2. Start onboarding
☐ 3. Create tenant (step 1)
☐ 4. Add location (step 2)
☐ 5. Configure tables (step 3)
☐ 6. Add shifts (step 3)
☐ 7. Set policies (step 4)
☐ 8. Skip Stripe (step 5)
☐ 9. Choose FREE plan (step 6)
☐ 10. Skip integrations (step 7)
☐ 11. Publish (step 8)
☐ 12. See dashboard
☐ 13. Add second location
☐ 14. Delete location
☐ 15. Test multi-location switching
```

### Pricing Page:
```
☐ 1. Go to onboarding step 6
☐ 2. See 6 tiers (FREE to ENTERPRISE)
☐ 3. No emojis visible
☐ 4. Clean R4Y branding
☐ 5. Select FREE
☐ 6. No Stripe redirect
☐ 7. Direct activation
```

### Delete Functionality:
```
☐ 1. Create multiple locations
☐ 2. Go to dashboard
☐ 3. See all locations
☐ 4. Click trash icon
☐ 5. Confirm dialog
☐ 6. Location deleted
☐ 7. Check homepage: location gone
☐ 8. Last location cannot be deleted
☐ 9. Delete tenant from /manager
☐ 10. All locations also deleted
```

---

## DOCUMENTATION FILES:

### Main Guides:
- `QUICK_START.md` - Quick setup (3 steps)
- `COMPLETE_SETUP.md` - This file
- `LOCATION_MANAGEMENT.md` - Vestiging beheer
- `TENANT_DELETE_AND_PUBLISHING.md` - Delete & publish
- `PRICING_CLEANUP.md` - 6-tier pricing details

### Developer Docs:
- `README_R4Y.md` - R4Y overview
- `docs/GETTING_STARTED.md` - Developer guide
- `docs/prd-r4y.md` - Product requirements

### SQL Scripts:
- `supabase/scripts/publish_location.sql` - Publish helper
- `supabase/scripts/view_all_locations.sql` - Overview queries

---

## TROUBLESHOOTING:

### Location Not Visible on Homepage:
```sql
-- Check publish status
SELECT id, name, slug, is_public, is_active 
FROM locations 
WHERE slug = 'your-slug';

-- Publish it
UPDATE locations 
SET is_public = TRUE, is_active = TRUE 
WHERE slug = 'your-slug';
```

### Cannot Delete:
- **Tenant:** Only OWNER can delete
- **Location:** Only OWNER/MANAGER can delete
- **Last location:** Must delete tenant instead

### Billing Issues:
```sql
-- Check billing state
SELECT * FROM billing_state 
WHERE tenant_id = 'your-tenant-id';

-- Set to TRIALING if missing
INSERT INTO billing_state (
  tenant_id, plan, status, 
  max_locations, max_bookings_per_month
) VALUES (
  'your-tenant-id', 'FREE', 'TRIALING',
  1, 50
);
```

### Migration Errors:
1. Run migrations in order (numbered)
2. Check for existing tables before running
3. Use `IF NOT EXISTS` clauses
4. See `supabase/MIGRATION_GUIDE.md`

---

## FEATURES SUMMARY:

### Pricing (6 Tiers):
| Tier | Price | Locations | Bookings | Key Features |
|------|-------|-----------|----------|--------------|
| FREE | €0 | 1 | 50/mo | Basic, email |
| STARTER | €29 | 1 | 200/mo | SMS, stats |
| GROWTH | €79 | 3 | 1K/mo | Deposits, multi-user |
| BUSINESS | €149 | 5 | 3K/mo | POS, white-label |
| PREMIUM | €299 | ∞ | ∞ | API, dedicated |
| ENTERPRISE | Custom | ∞ | ∞ | SLA, custom dev |

### Multi-Tenancy:
- ✅ Tenant = Bedrijf (1 owner, multiple managers)
- ✅ Location = Vestiging (multiple per tenant)
- ✅ Cascade deletes (safe, atomic)
- ✅ RLS policies (secure)

### Manager Portal:
- ✅ Dashboard per tenant
- ✅ Multi-location switching
- ✅ Add/delete locations
- ✅ Booking management
- ✅ Stats & analytics

### Consumer App:
- ✅ Homepage with search
- ✅ Location detail pages
- ✅ 3-step booking flow
- ✅ Profile with bookings
- ✅ Favorites

---

## NEXT STEPS:

### Optioneel:
1. **Stripe Setup:**
   - Create products in Stripe Dashboard
   - Add price IDs to `.env.local`
   - Test paid subscriptions

2. **Email Setup:**
   - Configure SMTP in Supabase
   - Customize email templates
   - Test booking confirmations

3. **SMS Setup:**
   - Add Twilio credentials
   - Implement SMS notifications
   - Test guest bookings

4. **Lightspeed POS:**
   - Implement OAuth flow
   - Sync menu/tables
   - Test webhook

5. **Production:**
   - Deploy to Vercel
   - Configure custom domain
   - Enable analytics
   - Set up monitoring

---

## DEPLOYMENT READY:

Alle core features zijn klaar voor gebruik:
- ✅ Multi-tenant architecture
- ✅ 6-tier subscription system
- ✅ Location management (add/delete)
- ✅ Booking flow
- ✅ Manager dashboard
- ✅ Clean R4Y branding
- ✅ Database migrations
- ✅ Security (RLS, cascade deletes)
- ✅ No emojis, professional UI

**Start testing nu!**

1. Run alle 6 database migrations
2. Create een bedrijf via onboarding
3. Add meerdere vestigingen
4. Test delete functionaliteit
5. Check homepage voor published locations
6. Test booking flow

**Veel succes met R4Y!** 🚀

