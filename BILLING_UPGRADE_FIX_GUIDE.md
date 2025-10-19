# Billing Upgrade Fix Guide

Als je een abonnement hebt geupgraded maar het dashboard toont nog steeds het oude plan, volg dan deze stappen.

## 🎯 Probleem

Na het upgraden van een abonnement (bijv. START → PRO of PRO → PLUS):
- Dashboard toont nog steeds het oude plan
- Kan geen extra locaties toevoegen
- Features van het nieuwe plan werken niet

## ✅ Oplossing (3 stappen)

### Stap 1: Voer SQL Script uit in Supabase

1. **Open Supabase Dashboard**: https://supabase.com/dashboard
2. Selecteer je project
3. Ga naar **SQL Editor** (in het linker menu)
4. Klik op **New query**
5. Open het bestand: `FIX_BILLING_AND_REFRESH.sql`
6. Kopieer en plak de HELE inhoud
7. Klik op **Run** of druk op `Cmd+Enter` / `Ctrl+Enter`
8. ✅ Script voltooid? Ga naar Stap 2

**Optioneel**: Als je weet welke tenant geupgraded is, uncomment en pas aan:
```sql
UPDATE billing_state
SET 
  plan = 'PLUS',  -- of 'START', 'PRO', 'PLUS'
  status = 'ACTIVE',
  updated_at = NOW()
WHERE tenant_id = 'f327645c-a658-41f2-853a-215cce39196a';
```

### Stap 2: Clear Cache & Restart Server

**Optie A: Automatisch (met script)**
```bash
cd /Users/dietmar/Desktop/ray2
./refresh_after_upgrade.sh
```

**Optie B: Handmatig**
```bash
# 1. Clear Next.js cache
rm -rf .next/cache

# 2. Stop de development server (Ctrl+C)

# 3. Herstart de server
pnpm dev
```

### Stap 3: Hard Refresh in Browser

1. Ga naar je dashboard: `http://localhost:3007/manager/[tenant-id]/dashboard`
2. Doe een **HARD REFRESH**:
   - **Mac**: `Cmd + Shift + R` of `Cmd + Option + R`
   - **Windows/Linux**: `Ctrl + Shift + R` of `Ctrl + F5`
3. ✅ Dashboard zou nu het juiste plan moeten tonen!

## 📊 Verificatie

Na het uitvoeren van alle stappen:

### Check 1: Plan wordt correct getoond
- Ga naar dashboard
- Kijk naar de "Usage & Billing" card
- Het plan zou correct moeten zijn (START / PRO / PLUS)

### Check 2: Quota's zijn correct
| Plan | Max Locaties | Max Bookings/maand |
|------|--------------|-------------------|
| FREE | 1 | 50 |
| START | 1 | 200 |
| PRO | 3 | 1,000 |
| PLUS | ∞ (onbeperkt) | ∞ (onbeperkt) |

### Check 3: Features werken
- **PRO & PLUS**: Aanbetalingen beschikbaar
- **PLUS**: POS integratie beschikbaar
- **PLUS**: White-label opties beschikbaar

## 🔍 Troubleshooting

### Dashboard toont nog steeds oud plan

**Probleem**: Cache is niet gecleared
**Oplossing**:
```bash
# Clear alles
rm -rf .next/cache
rm -rf .next/server
rm -rf .next/static
pnpm dev
```

### Kan nog steeds geen locatie toevoegen

**Check 1: Plan Status**
Voer uit in Supabase SQL Editor:
```sql
SELECT plan, status FROM billing_state 
WHERE tenant_id = 'JE_TENANT_ID_HIER';
```

Moet zijn: `status = 'ACTIVE'`

**Fix**:
```sql
UPDATE billing_state 
SET status = 'ACTIVE', updated_at = NOW()
WHERE tenant_id = 'JE_TENANT_ID_HIER';
```

**Check 2: Huidige locatie count**
```sql
SELECT 
  bs.plan,
  COUNT(l.id) as huidige_locaties
FROM billing_state bs
LEFT JOIN locations l ON l.tenant_id = bs.tenant_id
WHERE bs.tenant_id = 'JE_TENANT_ID_HIER'
GROUP BY bs.plan;
```

### Error: "No billing state found"

**Probleem**: Tenant heeft geen billing_state record
**Oplossing**:
```sql
INSERT INTO billing_state (tenant_id, plan, status, created_at, updated_at)
VALUES (
  'JE_TENANT_ID_HIER',
  'PRO',  -- of 'START', 'PRO', 'PLUS'
  'ACTIVE',
  NOW(),
  NOW()
)
ON CONFLICT (tenant_id) DO UPDATE
SET plan = EXCLUDED.plan, status = EXCLUDED.status, updated_at = NOW();
```

## 📁 Bestanden

- `FIX_BILLING_AND_REFRESH.sql` - Complete SQL fix script
- `refresh_after_upgrade.sh` - Automatisch cache clear + restart
- `supabase/migrations/20250119000005_fix_billing_state_and_quotas.sql` - Permanente migratie

## 🚀 Voor Productie

Wanneer je klaar bent voor echte Stripe betalingen:

1. **Maak Stripe Products aan**:
   - https://dashboard.stripe.com → Products
   - Maak 3 recurring products (START, PRO, PLUS)
   - Kopieer de Price IDs (beginnen met `price_1...`)

2. **Update Environment Variables**:
   ```bash
   STRIPE_PRICE_ID_START=price_1xxxxxxxxxxxxx
   STRIPE_PRICE_ID_PRO=price_1xxxxxxxxxxxxx
   STRIPE_PRICE_ID_PLUS=price_1xxxxxxxxxxxxx
   ```

3. **Verwijder Test Mode Code**:
   - In `app/api/profile/upgrade-checkout/route.ts`
   - Verwijder de "TEST MODE" check
   - Laat alleen echte Stripe checkout over

4. **Herstart server**:
   ```bash
   pnpm dev
   ```

## 💡 Tips

1. **Development Mode**: Momenteel werkt alles in test mode (geen echte betalingen)
2. **Caching**: Next.js cached server components, daarom is hard refresh nodig
3. **Database First**: SQL updates worden direct toegepast, maar cache moet gecleared
4. **Migrations**: Run de migratie in `/supabase/migrations/` voor permanente fix

## ❓ Hulp nodig?

1. Check de console logs in de terminal
2. Check browser console voor errors (F12)
3. Voer de verificatie queries uit in SQL Editor
4. Check de troubleshooting sectie hierboven

---

**Laatste update**: 19 januari 2025  
**Versie**: 1.0

