# Stripe Environment Variables voor Reserve4You

## Benodigde Stripe API Keys

Voeg de volgende environment variables toe aan je `.env.local` bestand:

```bash
# ============================================
# STRIPE CONFIGURATIE
# ============================================

# Basis Stripe Keys (verplicht)
# Verkrijg deze via: https://dashboard.stripe.com/apikeys
STRIPE_SECRET_KEY=sk_test_... # of sk_live_... voor productie
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_... # of pk_live_... voor productie

# Webhook Secrets (verplicht voor webhooks)
# Verkrijg deze via: https://dashboard.stripe.com/webhooks
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_WEBHOOK_SECRET_CONNECT=whsec_... # Aparte webhook voor Connect events (optioneel)

# Currency (optioneel, standaard: EUR)
STRIPE_CURRENCY=eur

# Platform Fee (optioneel, standaard: 2%)
STRIPE_PLATFORM_FEE_PERCENTAGE=2.0

# ============================================
# SUBSCRIPTION PRICE IDs (voor SaaS billing)
# ============================================
# Verkrijg deze via: https://dashboard.stripe.com/products

# Nieuwe 6-tier systeem
STRIPE_PRICE_ID_STARTER=price_xxxxxxxxxxxxx
STRIPE_PRICE_ID_GROWTH=price_xxxxxxxxxxxxx
STRIPE_PRICE_ID_BUSINESS=price_xxxxxxxxxxxxx
STRIPE_PRICE_ID_PREMIUM=price_xxxxxxxxxxxxx

# Legacy tiers (backwards compatibility)
STRIPE_PRICE_ID_START=price_xxxxxxxxxxxxx
STRIPE_PRICE_ID_PRO=price_xxxxxxxxxxxxx
STRIPE_PRICE_ID_PLUS=price_xxxxxxxxxxxxx

# ============================================
# OPTIONELE CONFIGURATIE
# ============================================

# Stripe Product Name
STRIPE_PRODUCT_NAME="Reserve4You Subscription"

# Site URL (voor redirects)
NEXT_PUBLIC_SITE_URL=http://localhost:3000 # of https://yourdomain.com voor productie
```

---

## Stap-voor-stap Setup Instructies

### 1. Maak een Stripe Account aan

1. Ga naar [https://stripe.com](https://stripe.com)
2. Klik op "Sign up"
3. Vul je bedrijfsgegevens in

### 2. Verkrijg API Keys

1. Log in op [Stripe Dashboard](https://dashboard.stripe.com)
2. Ga naar **Developers → API keys**
3. Kopieer de **Publishable key** en **Secret key**
4. Plak deze in je `.env.local`:
   ```bash
   STRIPE_SECRET_KEY=sk_test_...
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   ```

### 3. Configureer Webhooks

#### Webhook voor Algemene Events (Subscriptions, Payments)

1. Ga naar **Developers → Webhooks**
2. Klik op **Add endpoint**
3. Endpoint URL: `https://yourdomain.com/api/stripe/webhook`
4. Selecteer de volgende events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `payment_intent.amount_capturable_updated`
   - `charge.succeeded`
   - `charge.failed`
   - `charge.refunded`
   - `checkout.session.completed`
5. Klik op **Add endpoint**
6. Kopieer de **Signing secret** (begint met `whsec_`)
7. Plak deze in je `.env.local`:
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

#### Webhook voor Stripe Connect Events (optioneel)

1. Herhaal bovenstaande stappen
2. Endpoint URL: `https://yourdomain.com/api/stripe/webhook`
3. Selecteer events:
   - `account.updated`
   - `account.application.deauthorized`
4. Plak de signing secret:
   ```bash
   STRIPE_WEBHOOK_SECRET_CONNECT=whsec_...
   ```

### 4. Activeer Stripe Connect

Voor restaurant betalingen (booking deposits, no-show fees):

1. Ga naar **Settings → Connect**
2. Klik op **Get started**
3. Vul je platform informatie in:
   - **Platform name**: Reserve4You
   - **Brand icon**: Upload je logo
   - **Brand color**: #2563eb (of je brand kleur)
4. Kies **Standard accounts** (restaurants hebben volledige controle)
5. Vul je support email en website in
6. Accepteer de Connect Agreement

### 5. Maak Subscription Products aan (voor SaaS billing)

1. Ga naar **Products → Add product**
2. Maak de volgende producten aan:

#### Starter Tier
- Name: Reserve4You Starter
- Price: €29/maand
- Kopieer de Price ID → `STRIPE_PRICE_ID_STARTER`

#### Growth Tier
- Name: Reserve4You Growth
- Price: €79/maand
- Kopieer de Price ID → `STRIPE_PRICE_ID_GROWTH`

#### Business Tier
- Name: Reserve4You Business
- Price: €149/maand
- Kopieer de Price ID → `STRIPE_PRICE_ID_BUSINESS`

#### Premium Tier
- Name: Reserve4You Premium
- Price: €299/maand
- Kopieer de Price ID → `STRIPE_PRICE_ID_PREMIUM`

### 6. Test Mode vs Live Mode

**Test Mode** (voor development):
- Keys beginnen met `sk_test_` en `pk_test_`
- Gebruik test cards: https://stripe.com/docs/testing
- Geen echte betalingen

**Live Mode** (voor productie):
- Keys beginnen met `sk_live_` en `pk_live_`
- Echte betalingen
- Vereist KYC verificatie

---

## Test Cards (voor development)

Gebruik deze kaarten in test mode:

| Kaart nummer | Beschrijving |
|--------------|--------------|
| `4242 4242 4242 4242` | Standaard success |
| `4000 0025 0000 3155` | Requires authentication (3D Secure) |
| `4000 0000 0000 9995` | Declined (insufficient funds) |
| `4000 0000 0000 0069` | Expired card |
| `4000 0082 6000 0000` | Bancontact (Belgium) |
| `4000 0056 3000 0008` | iDEAL (Netherlands) |

Gebruik **elke geldige toekomst datum** en **elke 3-cijferige CVC**.

---

## Webhook Testing (local development)

Om webhooks lokaal te testen:

### Optie 1: Stripe CLI (aanbevolen)

1. Installeer Stripe CLI:
   ```bash
   # macOS
   brew install stripe/stripe-cli/stripe
   
   # Windows
   scoop install stripe
   ```

2. Login:
   ```bash
   stripe login
   ```

3. Forward webhooks naar localhost:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

4. Kopieer de webhook signing secret die getoond wordt
5. Update je `.env.local`:
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_... (de secret van CLI)
   ```

### Optie 2: ngrok

1. Installeer ngrok: https://ngrok.com
2. Start ngrok:
   ```bash
   ngrok http 3000
   ```
3. Kopieer de HTTPS URL (bijv. `https://abc123.ngrok.io`)
4. Voeg webhook toe in Stripe Dashboard met URL: `https://abc123.ngrok.io/api/stripe/webhook`
5. Kopieer de signing secret naar `.env.local`

---

## Veelgestelde Vragen

### Wat kost Stripe?

**Standaard transactiekosten:**
- 1.4% + €0.25 per Europese kaart
- 2.9% + €0.25 per niet-Europese kaart
- Extra kosten voor iDEAL, Bancontact, etc.

**Stripe Connect kosten:**
- Platform fee: jij bepaalt (bijv. 2%)
- Stripe fee: standaard transactiekosten
- Transfer fees: gratis voor Standard accounts

### Hoe werkt de platform fee?

1. Klant betaalt €50 voor reservering
2. Stripe neemt transactie fee (bijv. €0.98)
3. Platform fee van 2% (€1.00) gaat naar R4Y
4. Restaurant ontvangt €48.02

### Hoe krijg ik mijn geld?

**Voor Platform (R4Y):**
- Platform fees komen op je Stripe balance
- Automatische uitbetaling naar je bankrekening (standaard na 2 dagen)

**Voor Restaurants:**
- Via Stripe Connect Standard accounts
- Zij ontvangen betalingen direct op hun eigen Stripe account
- Zij beheren zelf hun uitbetalingen

### Hoe test ik refunds?

```bash
# Via Stripe CLI
stripe refunds create --charge=ch_xxxxx --amount=1000

# Of via Dashboard
# Ga naar Payments → Selecteer payment → Refund
```

---

## Productie Checklist

Voordat je live gaat:

- [ ] Vervang alle `sk_test_` en `pk_test_` keys met `sk_live_` en `pk_live_`
- [ ] Update webhook endpoints naar productie URL
- [ ] Test alle payment flows in test mode
- [ ] Verifieer webhook events werken correct
- [ ] Zet Stripe Connect live
- [ ] Test een echte betaling met kleine bedrag
- [ ] Configureer uitbetalingen (payout schedule)
- [ ] Voeg business details toe in Stripe Dashboard
- [ ] Activeer Radar (fraud prevention)
- [ ] Configureer email notificaties

---

## Support

- **Stripe Documentatie**: https://stripe.com/docs
- **Stripe Support**: https://support.stripe.com
- **Stripe Status**: https://status.stripe.com

---

## Voorbeeld .env.local (volledig)

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxx
SUPABASE_SERVICE_ROLE_KEY=xxxxx

# Stripe
STRIPE_SECRET_KEY=sk_test_xxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
STRIPE_WEBHOOK_SECRET_CONNECT=whsec_xxxxx
STRIPE_CURRENCY=eur
STRIPE_PLATFORM_FEE_PERCENTAGE=2.0

# Stripe Prices
STRIPE_PRICE_ID_STARTER=price_xxxxx
STRIPE_PRICE_ID_GROWTH=price_xxxxx
STRIPE_PRICE_ID_BUSINESS=price_xxxxx
STRIPE_PRICE_ID_PREMIUM=price_xxxxx

# Site
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NODE_ENV=development
```

