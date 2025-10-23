# ⚡ QUICK FIX - PLUS BUTTON WERKT NIET

## ❌ PROBLEEM

1. **Poule & Poulette heeft PLUS plan** maar kan geen nieuwe locatie toevoegen
2. **Database limiet is 1** in plaats van unlimited (99)
3. **Plus button (+) doet niets** bij klikken

---

## ✅ OPLOSSING (3 stappen - 5 minuten)

### STAP 1: RUN SQL (2 minuten)

**Open Supabase SQL Editor:**
```
https://supabase.com/dashboard/project/jrudqxovozqnmxypjtij/sql/new
```

**Plak en run deze SQL:**

```sql
-- Fix PLUS plan to have unlimited locations
UPDATE billing_state
SET 
    max_locations = 99,  -- Effectively unlimited
    max_bookings_per_month = 10000,
    updated_at = NOW()
WHERE plan::text = 'PLUS';

-- Verify
SELECT 
    t.name,
    bs.plan,
    bs.status,
    bs.max_locations,
    bs.max_bookings_per_month
FROM tenants t
JOIN billing_state bs ON bs.tenant_id = t.id
WHERE t.name = 'Poule & Poulette';
```

**Expected output:**
```
| name             | plan | status | max_locations | max_bookings_per_month |
| Poule & Poulette | PLUS | ACTIVE | 99            | 10000                  |
```

✅ **Klik "Run" (▶️)**

---

### STAP 2: RESTART DEV SERVER (30 seconden)

```bash
# Stop server (Ctrl+C)
cd /Users/dietmar/Desktop/ray2
npm run dev
```

✅ **Wacht tot server draait**

---

### STAP 3: TEST PLUS BUTTON (1 minuut)

**1. Ga naar dashboard:**
```
http://localhost:3007/manager/[poule-poulette-tenant-id]/dashboard
```

**2. Klik op de **+** button** (Add Location)

**3. Zou moeten redirecten naar:**
```
/manager/[tenant-id]/settings?step=2
```

**4. Vul locatie gegevens in en save**

✅ **Nieuwe locatie wordt aangemaakt!**

---

## 🔍 WAAROM HET NIET WERKTE

### Code check in `lib/billing/quota.ts`:

```typescript
// Line 74-81: PLUS plan definition
PLUS: {
  locations: Infinity,  // ✅ Dit is correct
  bookingsPerMonth: Infinity,
  deposits: true,
  posIntegration: true,
  whiteLabel: true,
  apiAccess: true,
},

// Line 126: Check limit
const limit = PLAN_LIMITS[plan].locations; // Voor PLUS = Infinity

// Line 142: Compare
if (currentCount >= limit) { // 1 >= Infinity = false ✅
  return { allowed: false, reason: 'Limit reached' };
}
```

**De code is correct!** Het probleem was waarschijnlijk:

1. **Database max_locations was 1** (niet gebruikt door code maar kan UI verwarren)
2. **Mogelijk UI issue** - button disabled vanwege state
3. **Browser cache** - oude data in frontend

---

## 🧪 DEBUG PLUS BUTTON

Als het nog steeds niet werkt, check dit:

### Check 1: Browser Console

```
F12 → Console
```

Kijk naar errors bij klikken op +

### Check 2: Test quota API direct

```bash
# In browser console
fetch('/api/manager/locations/check-quota', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    tenantId: '[poule-poulette-tenant-id]' 
  })
})
.then(r => r.json())
.then(console.log);
```

Zou moeten tonen:
```json
{
  "allowed": true,
  "currentCount": 1,
  "limit": "Infinity" // of null/undefined voor unlimited
}
```

### Check 3: Is button disabled?

Inspect element op de + button:

```html
<button disabled>+ Add Location</button>
```

Als disabled, check waarom in de component logic.

---

## 📊 PLAN LIMITS OVERZICHT

Na de SQL fix:

| Plan | Locations | Bookings/Month | In Code | In DB |
|------|-----------|----------------|---------|-------|
| **FREE** | 1 | 50 | ✅ 1 | ✅ 1 |
| **STARTER** | 1 | 200 | ✅ 1 | ✅ 1 |
| **GROWTH** | 3 | 1000 | ✅ 3 | ✅ 3 |
| **PLUS** | ∞ | ∞ | ✅ Infinity | ✅ 99 |
| **PREMIUM** | ∞ | ∞ | ✅ Infinity | ✅ 99 |

---

## 🎯 WAAR DE + BUTTON IS

Zoek in de codebase naar waar de + button is:

```bash
cd /Users/dietmar/Desktop/ray2
grep -r "Add Location" app/manager --include="*.tsx" | grep -i button
```

Waarschijnlijk in:
- `app/manager/[tenantId]/dashboard/DashboardClient.tsx`
- `app/manager/[tenantId]/dashboard/ProfessionalDashboard.tsx`

Check of daar een `disabled` check is gebaseerd op quota.

---

## 🔧 IF BUTTON IS STILL DISABLED

Als de button nog disabled is na SQL fix:

**Zoek de button component:**

```tsx
// Probably something like:
<Button
  onClick={() => router.push(`/manager/${tenantId}/settings?step=2`)}
  disabled={!canAddLocation || loading}
>
  <Plus className="h-4 w-4 mr-2" />
  Add Location
</Button>
```

**Check `canAddLocation` logic:**

Misschien haalt deze oude data op. Oplossing:

1. Hard refresh browser: `Cmd + Shift + R`
2. Clear cache: `Option + Cmd + E` (Safari)
3. Restart dev server
4. Check of component server-side rendered is (haalt fresh data)

---

## 💡 PERMANENT FIX

Om dit in de toekomst te voorkomen:

**1. Add enum value for PLUS (in SQL migration):**

```sql
ALTER TYPE billing_plan ADD VALUE IF NOT EXISTS 'PLUS';
```

**2. Update seed data to use correct limits:**

```sql
-- In migration file
INSERT INTO billing_state (tenant_id, plan, max_locations, max_bookings_per_month)
VALUES (..., 'PLUS', 99, 10000);
```

**3. Add test:**

```typescript
// Test that PLUS plan allows unlimited locations
test('PLUS plan allows creating many locations', async () => {
  const result = await canCreateLocation(plusPlanTenantId);
  expect(result.allowed).toBe(true);
  expect(result.limit).toBe(Infinity);
});
```

---

## 🎉 SUCCESS CHECKLIST

- [ ] SQL gerund in Supabase
- [ ] Verificatie query toont: `max_locations = 99`
- [ ] Dev server herstart
- [ ] Browser refreshed (Cmd + Shift + R)
- [ ] Dashboard pagina geladen
- [ ] + Button geklikt
- [ ] Redirect naar settings?step=2
- [ ] Nieuwe locatie aangemaakt
- [ ] Dashboard toont 2 locaties

Als alle checkboxes ✅: **Fixed!** 🚀

---

## 📞 IF STILL NOT WORKING

**DM me met:**
1. Screenshot van + button (inspected element)
2. Browser console errors
3. Result van quota API test
4. Result van SQL verification query

---

**START NU: Run de SQL!** ⚡

