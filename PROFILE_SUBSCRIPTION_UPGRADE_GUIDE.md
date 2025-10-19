# Profile Subscription Upgrade Guide

Deze gids legt uit hoe je het subscription upgrade systeem op de profile page activeert.

## 📋 Wat is er toegevoegd?

### 1. **Profile Subscription Tab**
Op `/profile` kunnen restaurant owners nu:
- Al hun tenants (restaurants) zien
- Het huidige abonnement per restaurant bekijken
- Direct upgraden naar START, PRO of PLUS
- Via Stripe Checkout betalen

### 2. **Stripe Integration**
- API endpoint: `/api/profile/upgrade-checkout`
- Maakt Stripe Checkout sessie aan voor subscription upgrade
- Redirect naar Stripe voor betaling
- Success/cancel URL's terug naar profile

### 3. **Database Functionaliteit**
- `billing_state` table met subscription info
- RLS policies voor secure access
- Functies voor billing management
- Indexes voor performance

## 🚀 Installatie

### Stap 1: Upload Database Migratie

**Via Supabase Dashboard:**

1. Ga naar https://supabase.com/dashboard
2. Selecteer je project
3. Ga naar **SQL Editor**
4. Klik op **New Query**
5. Kopieer de inhoud van `supabase/migrations/20250119000003_profile_subscription_upgrades.sql`
6. Plak in de SQL editor
7. Klik op **Run**
8. Wacht op succesbericht met groene vinkjes

**Via Supabase CLI:**

```bash
cd /Users/dietmar/Desktop/ray2
npx supabase db push
```

### Stap 2: Configureer Stripe Price IDs

In je `.env.local` file, voeg toe:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_live_...  # Of sk_test_...

# Price IDs voor subscription tiers
STRIPE_PRICE_ID_START=price_...
STRIPE_PRICE_ID_PRO=price_...
STRIPE_PRICE_ID_PLUS=price_...
```

**Hoe krijg je Price IDs:**

1. Ga naar Stripe Dashboard: https://dashboard.stripe.com
2. Klik op **Products** in de linker menu
3. Maak 3 producten aan:
   - **Start Plan** - €49/maand
   - **Pro Plan** - €99/maand
   - **Plus Plan** - €199/maand
4. Kopieer de Price ID van elk product (begint met `price_`)
5. Plak in `.env.local`

### Stap 3: Update Config File

In `lib/config.ts`, update de Stripe configuratie:

```typescript
export const config = {
  // ... existing config
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY!,
    priceIds: {
      START: process.env.STRIPE_PRICE_ID_START!,
      PRO: process.env.STRIPE_PRICE_ID_PRO!,
      PLUS: process.env.STRIPE_PRICE_ID_PLUS!,
    },
  },
};
```

## ✅ Verificatie

Test de functionaliteit:

1. **Login als restaurant owner**: Ga naar http://localhost:3007/sign-in
2. **Ga naar Profile**: http://localhost:3007/profile
3. **Klik op "Abonnementen" tab**: Zou je tenants moeten laten zien
4. **Klik op "Upgrade" bij een plan**: Wordt doorgestuurd naar Stripe
5. **Test betaling** (met test credit card: `4242 4242 4242 4242`)
6. **Redirect terug**: Na betaling kom je terug op profile met success message

### SQL Verificatie

Run in Supabase SQL Editor:

```sql
-- Check if tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'billing_state';

-- Check if functions exist
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%billing%';

-- Test function
SELECT * FROM get_user_tenants_with_billing('YOUR_USER_UUID');
```

## 🎨 Features

### Voor Restaurant Owners:

✅ **Overzicht van alle restaurants** - Zie al je tenants in één overzicht
✅ **Huidig plan badge** - Direct zichtbaar welk plan actief is
✅ **Status indicators** - ACTIVE, INACTIVE, TRIALING, etc.
✅ **Vergelijk plannen** - Zie features per tier naast elkaar
✅ **One-click upgrade** - Direct upgraden via Stripe
✅ **Secure betaling** - Via Stripe Checkout (PCI compliant)
✅ **Auto redirect** - Na betaling terug naar profile
✅ **Permission check** - Alleen owners kunnen upgraden

### Voor Niet-Owners:

✅ **Read-only view** - Staff/Managers kunnen subscription zien
✅ **Clear messaging** - "Alleen eigenaren kunnen upgraden"

## 📊 Subscription Tiers

### START - €49/maand
- 1 locatie
- 200 boekingen/maand
- Basis reserveringssysteem
- Email notificaties
- Basis support

### PRO - €99/maand ⭐ Meest Populair
- 3 locaties
- 1000 boekingen/maand
- Aanbetalingen
- Wachtlijst
- Team members (3)
- SMS notificaties
- Prioriteit support

### PLUS - €199/maand
- Onbeperkte locaties
- Onbeperkte boekingen
- POS integratie
- Custom branding
- API toegang
- Dedicated support

## 🔧 Troubleshooting

### Error: "Column billing_state does not exist"

Run de migratie opnieuw. De `billing_state` table moet aangemaakt worden.

### Error: "Stripe price ID not found"

Controleer of alle Price IDs correct zijn ingesteld in `.env.local`:
```bash
STRIPE_PRICE_ID_START=price_...
STRIPE_PRICE_ID_PRO=price_...
STRIPE_PRICE_ID_PLUS=price_...
```

### Error: "Unauthorized"

Controleer of de user een OWNER rol heeft voor deze tenant:
```sql
SELECT * FROM memberships 
WHERE user_id = 'YOUR_USER_UUID' 
AND tenant_id = 'YOUR_TENANT_UUID';
```

### Subscription Tab niet zichtbaar

De tab wordt alleen getoond als de user tenants heeft. Check:
```sql
SELECT * FROM get_user_tenants_with_billing('YOUR_USER_UUID');
```

### Stripe Checkout laadt niet

1. Check Stripe Secret Key in `.env.local`
2. Check of Price IDs kloppen
3. Check browser console voor errors
4. Check Stripe Dashboard > Logs voor API errors

## 🔐 Security

✅ **RLS Policies** - Row Level Security op billing_state table
✅ **Permission checks** - API verifies OWNER role
✅ **Secure redirect** - Success/cancel URLs via config
✅ **Stripe Checkout** - PCI compliant payment
✅ **Metadata tracking** - Tenant ID in Stripe metadata

## 🔄 Webhook Setup (Optional)

Voor automatische subscription updates, setup Stripe webhooks:

1. Ga naar Stripe Dashboard > Webhooks
2. Klik "Add endpoint"
3. Endpoint URL: `https://your-domain.com/api/stripe/webhook`
4. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Kopieer Webhook Secret
6. Add to `.env.local`: `STRIPE_WEBHOOK_SECRET=whsec_...`

## 📝 Next Steps

1. **Test in development** - Use Stripe test mode
2. **Setup products in Stripe** - Create START, PRO, PLUS products
3. **Configure Price IDs** - Add to environment variables
4. **Run database migration** - Via Supabase Dashboard or CLI
5. **Test upgrade flow** - Full end-to-end test
6. **Setup webhooks** - For automatic billing updates
7. **Deploy to production** - Switch to live Stripe keys

## 🎯 User Flow

```
Profile Page
  └─> Abonnementen Tab (if user has tenants)
      └─> Select Tenant
          └─> View Current Plan
              └─> Choose Upgrade Plan
                  └─> Click "Upgrade"
                      └─> Redirect to Stripe Checkout
                          └─> Enter Payment Details
                              └─> Confirm Payment
                                  └─> Redirect to Profile (success=true)
                                      └─> Show Success Message
                                          └─> Billing State Updated
```

## 💡 Tips

1. **Test Mode First**: Always test with Stripe test keys before going live
2. **Monitor Logs**: Check Stripe Dashboard logs for payment issues
3. **Clear Messaging**: Users understand what they're paying for
4. **Success Callbacks**: Implement success page with confirmation
5. **Email Receipts**: Stripe sends automatic receipts
6. **Cancel Support**: Implement cancellation flow if needed

## 📚 Resources

- [Stripe Checkout Documentation](https://stripe.com/docs/payments/checkout)
- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Reserve4You Billing Tiers](/lib/design-tokens.ts)

