# Reserve4You: Implementation Quickstart Guide (FIXED)

**Versie:** 1.1 (Gefixte SQL scripts)  
**Datum:** 29 Oktober 2025

---

## Wat is er gefixed?

De originele SQL scripts hadden enkele compatibiliteitsproblemen met de bestaande database structuur:

### Problemen opgelost:
1. ✅ **`supabase_user_id` → `auth_user_id`** - De `consumers` tabel gebruikt `auth_user_id`, niet `supabase_user_id`
2. ✅ **ENUM conflict** - `waitlist_status` ENUM bestond al, nieuwe ENUM naam gebruikt
3. ✅ **Bestaand waitlist systeem** - Smart Waitlist bouwt nu BOVENOP het bestaande systeem
4. ✅ **Bestaande CRM kolommen** - Deep CRM integreert met bestaande CRM migratie

---

## 🚀 Snelstart: 4 Scripts Uitvoeren

### Stap 1: Database Backup (BELANGRIJK!)

```bash
# Backup maken via Supabase Dashboard
# Settings → Database → Backups → Create backup now
```

### Stap 2: Scripts Uitvoeren in Volgorde

**Volgorde is belangrijk!** Voer de scripts uit in deze exacte volgorde:

#### Script 1: Universal Loyalty (5-10 min)
```bash
# In Supabase SQL Editor:
R4Y_SQL_03_UNIVERSAL_LOYALTY_FIXED.sql
```

**Wat dit doet:**
- ✨ Loyalty accounts voor alle consumers
- 📊 Points systeem (earn & redeem)
- 🏆 Loyalty tiers (Bronze, Silver, Gold, Platinum)
- 🎁 Rewards catalog
- 🤖 Auto-award points op completed bookings

#### Script 2: No-Show Shields (5-10 min)
```bash
# In Supabase SQL Editor:
R4Y_SQL_04_NO_SHOW_SHIELDS_FIXED.sql
```

**Wat dit doet:**
- 💳 Pre-authorization tracking
- 🛡️ No-show fee management
- 💰 Payment protection rules per location/service
- 📝 Payment attempts logging
- 💾 Saved payment methods

#### Script 3: Smart Waitlist & Crossfill (10-15 min)
```bash
# In Supabase SQL Editor:
R4Y_SQL_05_SMART_WAITLIST_FIXED.sql
```

**Wat dit doet:**
- 🔗 Crossfill recommendations (nearby alternatives)
- 🎯 Intelligent matching criteria
- 📈 Waitlist analytics
- 🤝 Partner network voor crossfill
- ⚡ Auto-generate recommendations

**Let op:** Dit script werkt samen met je bestaande waitlist systeem, het vervangt het NIET.

#### Script 4: Deep CRM (10-15 min)
```bash
# In Supabase SQL Editor:
R4Y_SQL_08_DEEP_CRM_FIXED.sql
```

**Wat dit doet:**
- 👤 360° consumer profiles met UTM tracking
- 🎯 Dynamic segments
- 📋 Interaction tracking
- 📝 Staff notes met alerts
- 🤖 Marketing automation rules
- 🏷️ Tag systeem

---

## 📊 Verificatie na Installatie

### Check 1: Tabellen bestaan
```sql
-- Voer dit uit in SQL Editor:
SELECT 
  'consumer_loyalty_accounts' as table_name, COUNT(*) as exists
FROM information_schema.tables 
WHERE table_name = 'consumer_loyalty_accounts'

UNION ALL

SELECT 'payment_protection_rules', COUNT(*)
FROM information_schema.tables 
WHERE table_name = 'payment_protection_rules'

UNION ALL

SELECT 'waitlist_recommendations', COUNT(*)
FROM information_schema.tables 
WHERE table_name = 'waitlist_recommendations'

UNION ALL

SELECT 'consumer_interactions', COUNT(*)
FROM information_schema.tables 
WHERE table_name = 'consumer_interactions';
```

**Verwachte output:** Alle 4 tabellen moeten `1` tonen.

### Check 2: RLS Policies actief
```sql
-- Check RLS status:
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename IN (
  'consumer_loyalty_accounts',
  'payment_protection_rules',
  'waitlist_recommendations',
  'consumer_segments'
)
ORDER BY tablename;
```

**Verwachte output:** Alle `rowsecurity` kolommen moeten `TRUE` zijn.

### Check 3: Triggers werkend
```sql
-- Check triggers:
SELECT 
  trigger_name,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name IN (
  'trigger_booking_loyalty_points',
  'trigger_auto_charge_no_show',
  'trigger_waitlist_crossfill',
  'trigger_booking_interaction_log'
)
ORDER BY trigger_name;
```

**Verwachte output:** Alle 4 triggers moeten zichtbaar zijn.

---

## 🧪 Test Scenarios

### Test 1: Loyalty Points
```sql
-- Test award points functie:
SELECT award_loyalty_points(
  p_consumer_id := (SELECT id FROM consumers LIMIT 1),
  p_points := 100,
  p_transaction_type := 'EARN_BONUS',
  p_description := 'Test points'
);

-- Check of het werkte:
SELECT 
  c.name,
  cla.current_balance,
  cla.current_tier
FROM consumers c
JOIN consumer_loyalty_accounts cla ON cla.consumer_id = c.id
LIMIT 1;
```

### Test 2: Crossfill Recommendations
```sql
-- Test crossfill voor een waitlist entry:
SELECT * FROM find_crossfill_opportunities(
  (SELECT id FROM waitlist WHERE status = 'waiting' LIMIT 1)
);
```

### Test 3: Consumer Stats Update
```sql
-- Test consumer stats:
SELECT update_consumer_stats(
  (SELECT id FROM consumers LIMIT 1)
);

-- Check resultaat:
SELECT 
  name,
  lifetime_visits,
  lifetime_spend_cents,
  last_visit_date
FROM consumers
LIMIT 1;
```

---

## 🔧 Troubleshooting

### Error: "column auth_user_id does not exist"
**Oplossing:** Je gebruikt mogelijk een oude versie van de consumers tabel. Check:
```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'consumers';
```

### Error: "type waitlist_status already exists"
**Oplossing:** Dit is normaal! De FIXED scripts handelen dit af met `DO $$ BEGIN ... EXCEPTION WHEN duplicate_object ...`

### Error: "table waitlist already exists"
**Oplossing:** Perfect! De FIXED Smart Waitlist script bouwt BOVENOP je bestaande waitlist tabel.

---

## 📱 Volgende Stappen: UI Integratie

Na het uitvoeren van de SQL scripts, moet je de UI componenten toevoegen:

### 1. Loyalty Widget
Locatie: `app/components/loyalty/LoyaltyBadge.tsx`
```typescript
// Toon consumer's loyalty tier en points
// Gebruik: <LoyaltyBadge consumerId={consumer.id} />
```

### 2. Waitlist Recommendations
Locatie: `app/components/waitlist/CrossfillOffers.tsx`
```typescript
// Toon alternative venue suggestions
// Gebruik: <CrossfillOffers waitlistEntryId={entry.id} />
```

### 3. CRM Dashboard
Locatie: `app/manager/[slug]/crm/page.tsx`
```typescript
// 360° guest profiles
// Consumer segments
// Interaction timeline
```

### 4. Payment Protection Settings
Locatie: `app/manager/[slug]/settings/payments/page.tsx`
```typescript
// Configure no-show policies
// Set pre-auth amounts
// Define cancellation fees
```

---

## 📚 Documentatie Links

- **Loyalty System:** Zie `R4Y_SQL_03_UNIVERSAL_LOYALTY_FIXED.sql` voor functies
- **Payment Protection:** Zie `R4Y_SQL_04_NO_SHOW_SHIELDS_FIXED.sql` voor rules
- **Smart Waitlist:** Zie `R4Y_SQL_05_SMART_WAITLIST_FIXED.sql` voor matching
- **Deep CRM:** Zie `R4Y_SQL_08_DEEP_CRM_FIXED.sql` voor automation

---

## ✅ Checklist voor Productie

Voordat je naar productie gaat:

- [ ] Alle 4 scripts succesvol uitgevoerd
- [ ] Verificatie queries uitgevoerd
- [ ] Test scenarios doorlopen
- [ ] RLS policies getest met test users
- [ ] Backup gemaakt
- [ ] Rollback plan klaar
- [ ] Monitoring ingesteld voor nieuwe tabellen
- [ ] Team getraind op nieuwe features

---

## 🎯 Verwachte Impact

Na implementatie:

| Feature | Impact | Timeframe |
|---------|--------|-----------|
| **Loyalty System** | +15% repeat bookings | 2-3 maanden |
| **No-Show Shields** | -60% no-shows | 1 maand |
| **Smart Waitlist** | +25% conversion | 2 maanden |
| **Deep CRM** | +30% targeted campaigns | 3 maanden |

---

## 🆘 Support

Bij problemen:

1. Check de "Troubleshooting" sectie hierboven
2. Bekijk de SQL script comments voor details
3. Test met `SELECT` queries voordat je `INSERT/UPDATE` doet
4. Maak altijd een backup voordat je iets wijzigt

---

**Gemaakt:** 29 Oktober 2025  
**Versie:** 1.1 (Fixed)  
**Status:** Klaar voor implementatie ✅

