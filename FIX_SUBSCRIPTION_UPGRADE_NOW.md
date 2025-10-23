# 🚀 FIX SUBSCRIPTION UPGRADE - COMPLETE GUIDE

## ❌ PROBLEMEN:

1. **Redirect naar /profile** → Dit is correct gedrag (upgrade knop stuurt naar profile)
2. **Subscription switcher doet niets** → Werkt wel, maar UI refresht niet
3. **Dashboard blijft "FREE" tonen** → Database niet geüpdatet

---

## ✅ OPLOSSING IN 3 STAPPEN

### STAP 1: FIX DATABASE (5 minuten) ⚡ **BELANGRIJK!**

**1. Open Supabase SQL Editor:**
```
https://supabase.com/dashboard/project/jrudqxovozqnmxypjtij/sql/new
```

**2. Plak en run het complete SQL script:**

Zie: `COMPLETE_BILLING_FIX.sql`

Of gebruik deze quick versie:

```sql
-- Quick fix: Create missing billing states and set correct limits
INSERT INTO billing_state (
    tenant_id, plan, status, trial_end, 
    max_locations, max_bookings_per_month, bookings_used_this_month
)
SELECT t.id, 'FREE'::billing_plan, 'TRIALING'::billing_status, 
       NOW() + INTERVAL '14 days', 1, 50, 0
FROM tenants t
WHERE NOT EXISTS (SELECT 1 FROM billing_state bs WHERE bs.tenant_id = t.id)
ON CONFLICT (tenant_id) DO NOTHING;

-- Verify (should show all tenants with billing)
SELECT t.name, bs.plan, bs.status, bs.max_locations
FROM tenants t
LEFT JOIN billing_state bs ON bs.tenant_id = t.id
ORDER BY t.name;
```

**3. Klik "Run" (▶️)**

✅ **Dit creëert billing records voor alle tenants**

---

### STAP 2: RESTART DEV SERVER (30 seconden)

```bash
# Stop server (Ctrl+C in terminal)
cd /Users/dietmar/Desktop/ray2
npm run dev
```

✅ **Dit laadt de nieuwe code en database state**

---

### STAP 3: TEST SUBSCRIPTION UPGRADE (2 minuten)

**1. Ga naar Profile:**
```
http://localhost:3007/profile
```

**2. Klik op "Abonnementen" tab** (links in navigatie)

**3. Selecteer een plan** (bijvoorbeeld "STARTER")

**4. Klik "Upgrade naar [PLAN]"**

**5. Je wordt geredirect terug naar /profile**
   - ✅ Na 1-2 seconden zie je het nieuwe plan
   - ✅ Het herlaadt automatisch de data

**6. Ga naar je Dashboard:**
```
http://localhost:3007/manager/6110187b-80f7-466c-98cc-15895dcb286b/dashboard
```

**7. Check top-right:**
   - Voor fix: `OWNER • FREE`
   - Na fix: `OWNER • STARTER` (of je gekozen plan)

✅ **Als je het nieuwe plan ziet: SUCCESS!** 🎉

---

## 🔧 WAT IS ER GEFIXED

### Code Changes:

**1. ProfileClient.tsx** ✅
- Na upgrade: Hard refresh om nieuwe billing data op te halen
- Voorkomt stale data in cache

**2. SettingsClient.tsx** ✅
- Null-safe billing check (geen crash meer)
- Friendly error als billing ontbreekt

**3. COMPLETE_BILLING_FIX.sql** ✅
- Creëert ontbrekende billing_state records
- Set correcte plan limits (locations, bookings)
- Fix trial dates
- Verification queries

---

## 📊 PLAN LIMITS (na SQL fix)

| Plan | Locaties | Bookings/maand | Prijs |
|------|----------|----------------|-------|
| **FREE** | 1 | 50 | €0 (trial) |
| **STARTER** | 1 | 200 | €29/maand |
| **GROWTH** | 3 | 1000 | €79/maand |
| **PREMIUM** | 10 | 5000 | €199/maand |

---

## 🧪 HOE HET WERKT

### Subscription Upgrade Flow:

1. **User klikt "Upgrade"** in /profile
2. **API call** naar `/api/profile/upgrade-checkout`
3. **Check:** Is price ID echt (begins met `price_1`)?
   - ❌ **Nee (test mode):** Update billing_state direct, redirect naar /profile
   - ✅ **Ja (productie):** Create Stripe checkout session
4. **Redirect** terug naar /profile met `?upgraded=true&plan=STARTER`
5. **ProfileClient** ziet URL params
6. **Hard refresh** om nieuwe billing data op te halen
7. **UI update** toont nieuwe plan

### Dashboard Display:

```tsx
// app/manager/[tenantId]/dashboard/DashboardClient.tsx:157
{role} • {billing?.plan || 'No active subscription'}
```

Na database + code fix:
- Haalt billing data op uit database
- Toont actueel plan
- Refresht bij elke page load

---

## 🆘 TROUBLESHOOTING

### Probleem: Na upgrade nog steeds "FREE"

**Check 1: Is billing_state geüpdatet in database?**

Run in Supabase SQL:
```sql
SELECT tenant_id, plan, status, updated_at
FROM billing_state
WHERE tenant_id = '6110187b-80f7-466c-98cc-15895dcb286b';
```

Als plan nog steeds "FREE":
```sql
-- Manually update to STARTER
UPDATE billing_state
SET plan = 'STARTER'::billing_plan,
    status = 'ACTIVE'::billing_status,
    trial_end = NULL,
    max_locations = 1,
    max_bookings_per_month = 200,
    updated_at = NOW()
WHERE tenant_id = '6110187b-80f7-466c-98cc-15895dcb286b';
```

**Check 2: Is dev server herstart?**
```bash
# Stop en restart
Ctrl+C
npm run dev
```

**Check 3: Hard refresh browser**
```
Cmd + Shift + R (Chrome/Safari)
```

**Check 4: Clear browser cache**
```
Safari: Option + Command + E
Chrome: Cmd + Shift + Delete
```

---

### Probleem: "Upgrade" knop doet niets

**Console check:**
```
F12 → Console tab
```

Kijk naar errors. Mogelijke oorzaken:

**1. API error:** Check terminal logs voor `/api/profile/upgrade-checkout`

**2. Price ID niet gevonden:** 

Check lib/config.ts:
```typescript
stripe: {
  priceIds: {
    STARTER: 'price_starter', // Test mode ID
    GROWTH: 'price_growth',
    PREMIUM: 'price_premium',
  }
}
```

**3. Geen OWNER role:**

Check in Supabase:
```sql
SELECT role 
FROM memberships 
WHERE tenant_id = '6110187b-80f7-466c-98cc-15895dcb286b'
  AND user_id = '[your-user-id]';
```

Moet `OWNER` zijn.

---

### Probleem: Redirect naar Stripe maar geen update

**Dit betekent:** Je hebt echte Stripe price IDs in config

**Oplossing:**

**Optie A:** Gebruik test mode (placeholder IDs)
```typescript
// lib/config.ts
priceIds: {
  STARTER: 'price_starter', // Placeholder = test mode
  GROWTH: 'price_growth',
  PREMIUM: 'price_premium',
}
```

**Optie B:** Setup echte Stripe products
1. https://dashboard.stripe.com/products
2. Maak products aan voor STARTER, GROWTH, PREMIUM
3. Copy de price IDs (beginnen met `price_1...`)
4. Update lib/config.ts
5. Setup Stripe webhooks
6. Test met Stripe test mode

---

## 💡 TEST MODE VS PRODUCTIE

### Test Mode (Placeholder Price IDs):
- ✅ Instant upgrade (geen payment)
- ✅ Perfect voor development
- ✅ Geen Stripe configuratie nodig
- ❌ Geen echte betalingen

**Herken aan:**
```typescript
priceId = 'price_starter' // NIET price_1xxxxx
```

### Productie (Echte Stripe):
- ✅ Echte betalingen
- ✅ Stripe dashboard tracking
- ✅ Webhooks voor sync
- ❌ Vereist Stripe setup

**Herken aan:**
```typescript
priceId = 'price_1Abc123...' // Begint met price_1
```

---

## 🎯 VERIFICATION CHECKLIST

Na alle stappen:

- [ ] SQL gerund in Supabase (COMPLETE_BILLING_FIX.sql)
- [ ] Verification query toont alle tenants met billing
- [ ] Dev server herstart
- [ ] /profile pagina toont "Abonnementen" tab
- [ ] Plan selecteren en "Upgrade" klikken
- [ ] Redirect naar /profile (met of zonder Stripe)
- [ ] Nieuwe plan zichtbaar in /profile → Abonnementen
- [ ] Dashboard toont nieuw plan (bijv. "OWNER • STARTER")
- [ ] Settings → Abonnement toont nieuw plan
- [ ] Geen console errors

Als alle checkboxes ✅ zijn: **Everything works!** 🚀

---

## 📄 RELATED FILES

**Database:**
- `COMPLETE_BILLING_FIX.sql` - Complete database fix
- `FIX_MISSING_BILLING_STATE.sql` - Quick billing creation

**Code:**
- `app/profile/ProfileClient.tsx` - Upgrade flow + refresh logic
- `app/profile/SubscriptionSection.tsx` - Plan selector UI
- `app/api/profile/upgrade-checkout/route.ts` - Upgrade API
- `app/manager/[tenantId]/dashboard/DashboardClient.tsx` - Shows billing
- `app/manager/[tenantId]/settings/SettingsClient.tsx` - Billing settings

**Config:**
- `lib/config.ts` - Stripe price IDs
- `lib/billing/quota.ts` - Plan limits logic

---

## 🎉 SUCCESS SCENARIO

**Start:**
```
Dashboard: OWNER • FREE
Settings → Abonnement: (crash/empty)
Profile → Abonnementen: Shows plans but upgrade doesn't work
```

**After Fix:**
```
Dashboard: OWNER • STARTER ✅
Settings → Abonnement: Shows plan with upgrade button ✅
Profile → Abonnementen: Upgrade works, shows new plan ✅
Database: billing_state with correct plan ✅
```

---

**START MET STAP 1: Run het SQL script!** 🚀

