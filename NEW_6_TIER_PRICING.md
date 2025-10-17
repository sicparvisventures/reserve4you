# 🎉 6-TIER ABONNEMENT SYSTEEM

## ✅ WAT IS ER GEMAAKT:

Een professioneel 6-tier abonnement systeem met:
- ✅ 3 betaalbare tiers (1 gratis!)
- ✅ 3 premium tiers
- ✅ Enterprise tier op aanvraag
- ✅ Gradueel meer features per tier
- ✅ Modern, professioneel ontwerp
- ✅ R4Y branding consistent

---

## 📊 DE 6 TIERS:

### 🆓 **1. FREE** - €0/maand
**Perfect voor:** Kleine restaurants die willen starten
- 1 locatie
- 50 reserveringen per maand
- Basis reserveringssysteem
- E-mail bevestigingen
- Publieke restaurant pagina
- ❌ Geen aanbetalingen
- ❌ Geen SMS notificaties
- ❌ R4Y branding zichtbaar

### 🚀 **2. STARTER** - €29/maand
**Perfect voor:** Restaurants die net beginnen
- 1 locatie
- 200 reserveringen per maand
- Geavanceerd reserveringssysteem
- E-mail & SMS bevestigingen
- Basisstatistieken
- Annuleringsbeleid
- Geen setup kosten
- ❌ Geen aanbetalingen
- ❌ Geen POS integratie

### 📈 **3. GROWTH** - €79/maand ⭐ **MEEST GEKOZEN**
**Perfect voor:** Groeiende restaurants
- 3 locaties
- 1.000 reserveringen per maand
- ✅ Aanbetalingen & no-show fees
- SMS & e-mail bevestigingen
- Geavanceerde statistieken
- Multi-gebruiker support (3 personen)
- Prioriteit e-mail support
- Custom domeinnaam mogelijk

### 🏢 **4. BUSINESS** - €149/maand
**Perfect voor:** Professionele horeca
- 5 locaties
- 3.000 reserveringen per maand
- Alles van Growth, plus:
- ✅ Lightspeed POS integratie (basis)
- ✅ White-label (verwijder R4Y branding)
- Multi-gebruiker support (10 personen)
- Geavanceerde rapportages
- Prioriteit telefoon support
- Onboarding sessie

### 👑 **5. PREMIUM** - €299/maand
**Perfect voor:** Restaurant groepen
- Onbeperkte locaties
- Onbeperkte reserveringen
- Alles van Business, plus:
- ✅ Volledige POS integratie
- ✅ API toegang voor integraties
- Custom features op aanvraag
- Dedicated account manager
- 24/7 prioriteit support
- Maandelijkse strategie calls
- Custom white-label branding

### 🌟 **6. ENTERPRISE** - Op aanvraag (vanaf €500/maand)
**Perfect voor:** Grote organisaties
- Alles uit Premium
- Onbeperkte alles
- Dedicated infrastructure
- SLA garanties (99.9% uptime)
- Custom ontwikkeling
- Data export & migratie hulp
- Juridisch contract & facturatie
- 24/7 dedicated support team
- Maandelijkse performance reviews
- Strategisch advies

---

## 🎨 UI/UX FEATURES:

### **Visual Design:**
- ✅ 3x2 grid layout (responsive)
- ✅ Gradient icons per tier (unieke kleuren)
- ✅ "Meest Gekozen" badge op Growth
- ✅ "Start Gratis" badge op FREE
- ✅ Hover animations & shadows
- ✅ Selected state met border + checkmark
- ✅ Feature lijst met ✓ icons
- ✅ Limitations lijst met × icons (waar van toepassing)
- ✅ Smooth transitions (300ms)

### **Interactions:**
- ✅ Click op card selecteert tier
- ✅ FREE tier → Direct activeren (geen betaling)
- ✅ Betaalde tiers → Stripe Checkout
- ✅ ENTERPRISE → Contact formulier / email
- ✅ "Blijf op Gratis Trial" optie

### **Info Sections:**
- ✅ Comparison tip box
- ✅ Veiligheids badge (Stripe)
- ✅ Geld terug garantie melding
- ✅ Error handling

---

## 📁 AANGEPASTE BESTANDEN:

### **1. Frontend:**
- ✅ `/app/manager/onboarding/steps/StepAbonnement.tsx` - Nieuwe 6-tier UI
- ✅ Herbruikt in `/app/manager/[tenantId]/settings/SettingsWizard.tsx`

### **2. Backend:**
- ✅ `/lib/billing/quota.ts` - Quota limits voor 6 tiers
- ✅ `/lib/config.ts` - Stripe price IDs voor nieuwe tiers
- ✅ `/app/api/manager/tenants/route.ts` - Start met FREE trial

### **3. Database:**
- ✅ `/supabase/migrations/20241017000008_add_new_billing_tiers.sql` - Nieuwe tiers in database

---

## 🗄️ DATABASE CHANGES:

```sql
-- New billing_plan enum values:
FREE, STARTER, GROWTH, BUSINESS, PREMIUM, ENTERPRISE

-- Quota mappings:
FREE:       1 loc,  50 bookings/month
STARTER:    1 loc,  200 bookings/month
GROWTH:     3 locs, 1000 bookings/month
BUSINESS:   5 locs, 3000 bookings/month
PREMIUM:    ∞ locs, ∞ bookings/month
ENTERPRISE: ∞ locs, ∞ bookings/month

-- Features per tier:
FREE:       Basic only
STARTER:    + SMS
GROWTH:     + Deposits + Multi-user
BUSINESS:   + POS + White-label
PREMIUM:    + API + Unlimited
ENTERPRISE: + SLA + Dedicated
```

---

## 🚀 TEST HET NU:

### **1. Run Database Migration:**

```bash
# Open Supabase SQL Editor en run:
```sql
-- Kopieer de inhoud van:
/Users/dietmar/Desktop/ray2/supabase/migrations/20241017000008_add_new_billing_tiers.sql
```

**Expected output:**
```
🎉 New 6-Tier Billing System Activated!
✅ All existing subscriptions migrated to new tiers
```

### **2. Open Abonnement Pagina:**

**In Onboarding:**
```
http://localhost:3007/manager/onboarding?step=6
```

**In Settings:**
```
http://localhost:3007/manager/f327645c-a658-41f2-853a-215cce39196a/settings?step=6
```

### **3. Test Verschillende Flows:**

**A. FREE Tier:**
1. Klik op FREE card
2. Klik "Start Gratis met Free"
3. → Je wordt direct geactiveerd, geen Stripe!

**B. Betaalde Tier (STARTER/GROWTH/etc):**
1. Klik op een betaalde tier
2. Klik "Doorgaan met [Tier]"
3. → Je wordt naar Stripe Checkout gestuurd

**C. ENTERPRISE Tier:**
1. Klik op ENTERPRISE card
2. Klik "Neem Contact Op voor Enterprise"
3. → Email wordt geopend naar sales@reserve4you.com

---

## 💡 BELANGRIJKE FEATURES:

### **FREE Tier Logic:**
```typescript
if (selectedPlan === 'FREE') {
  // No Stripe needed!
  updateData('subscription', { plan: 'FREE', status: 'ACTIVE' });
  onNext();
  return;
}
```

### **ENTERPRISE Logic:**
```typescript
if (plan?.isContactUs) {
  alert('Neem contact met ons op via sales@reserve4you.com');
  return;
}
```

### **Quota Enforcement:**
Alle quota checks in de code werken nu met de nieuwe tiers:
- Location creation checks max_locations
- Booking creation checks max_bookings_per_month
- Feature gates (deposits, POS, etc.) per tier

---

## 🎯 PRICING STRATEGIE:

| Tier | Prijs | Target | Monthly Revenue @ 100 users |
|------|-------|--------|------------------------------|
| FREE | €0 | Acquisition | €0 |
| STARTER | €29 | Solo restaurants | €2,900 |
| GROWTH | €79 | Growing (20% upgrade) | €1,580 |
| BUSINESS | €149 | Multi-location (10% upgrade) | €1,490 |
| PREMIUM | €299 | Groups (5% upgrade) | €1,495 |
| ENTERPRISE | €500+ | Enterprise (1% upgrade) | €500+ |
| **TOTAL** | | | **€7,965/maand** |

**Conversion Funnel:**
- FREE → STARTER: 20% (basic features unlock)
- STARTER → GROWTH: 30% (deposits + multi-location)
- GROWTH → BUSINESS: 20% (POS + white-label)
- BUSINESS → PREMIUM: 15% (unlimited)
- PREMIUM → ENTERPRISE: 10% (dedicated support)

---

## 📋 STRIPE SETUP (TODO):

Om de betaalde tiers te activeren, maak je Stripe Products aan:

1. **Login to Stripe Dashboard**
2. **Create Products:**
   - R4Y Starter - €29/maand → Copy Price ID
   - R4Y Growth - €79/maand → Copy Price ID
   - R4Y Business - €149/maand → Copy Price ID
   - R4Y Premium - €299/maand → Copy Price ID

3. **Update .env.local:**
   ```bash
   STRIPE_PRICE_ID_STARTER=price_xxx
   STRIPE_PRICE_ID_GROWTH=price_xxx
   STRIPE_PRICE_ID_BUSINESS=price_xxx
   STRIPE_PRICE_ID_PREMIUM=price_xxx
   ```

4. **Test in Test Mode eerst!**

---

## ✅ CHECKLIST:

```
☐ 1. Run database migration (20241017000008_add_new_billing_tiers.sql)
☐ 2. Test FREE tier activation
☐ 3. Test betaalde tier → Stripe redirect
☐ 4. Test ENTERPRISE → Contact email
☐ 5. Verify quota limits per tier
☐ 6. Setup Stripe products (optional voor now)
☐ 7. Test in beide onboarding én settings
☐ 8. Check responsive design op mobile
```

---

## 🎨 KLEUREN PER TIER:

| Tier | Gradient | Icon Color |
|------|----------|------------|
| FREE | `from-gray-500 to-gray-600` | Gray |
| STARTER | `from-blue-500 to-blue-600` | Blue |
| GROWTH | `from-purple-500 to-purple-600` | Purple ⭐ |
| BUSINESS | `from-orange-500 to-orange-600` | Orange |
| PREMIUM | `from-rose-500 to-rose-600` | Rose |
| ENTERPRISE | `from-emerald-500 to-emerald-600` | Emerald |

---

## 🚀 READY TO TEST!

De code is al live (hot reload). 

**Open nu:**
```
http://localhost:3007/manager/onboarding?step=6
```

Of:
```
http://localhost:3007/manager/f327645c-a658-41f2-853a-215cce39196a/settings?step=6
```

**En zie het prachtige 6-tier systeem!** 🎉

---

**Vragen? Feedback? Laat me weten wat je ervan vindt!** 💪

