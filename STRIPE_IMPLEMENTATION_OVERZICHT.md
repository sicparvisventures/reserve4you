# Stripe Payments Implementatie - Volledig Overzicht

## 📋 Samenvatting

Volledige Stripe betalingsintegratie voor Reserve4You is geïmplementeerd met support voor:
- 💳 Payment Intents (deposits, vooruitbetalingen)
- 🔒 Pre-authorization (hold zonder direct afschrijven)
- 💰 Refunds (volledig en gedeeltelijk)
- 📅 No-show fees
- 📊 Platform fees via Stripe Connect
- 💡 Apple Pay, Google Pay, iDEAL, Bancontact

---

## 📁 Geïmplementeerde Bestanden

### Database & SQL

#### `STRIPE_BOOKING_PAYMENTS_SETUP.sql`
**Locatie:** `/STRIPE_BOOKING_PAYMENTS_SETUP.sql`

**Wat doet het:**
- Voegt Stripe Connect velden toe aan `locations` table
- Breidt `bookings` table uit met payment tracking
- Creëert `payment_transactions` table voor transaction logging
- Voegt nieuwe payment status enums toe
- Creëert helper functies voor berekeningen
- Configureert RLS policies
- Voegt payment stats view toe

**Key features:**
- `calculate_platform_fee()` - Platform commissie berekenen
- `calculate_deposit_amount()` - Deposit berekenen op basis van policy
- `calculate_refund_percentage()` - Refund percentage op basis van tijd
- `location_payment_stats` - View voor rapportage

**Run command:**
```sql
-- Via Supabase SQL Editor
-- Plak en run de volledige inhoud
```

---

### API Routes

#### 1. `/app/api/manager/stripe/connect-onboarding/route.ts`
**Locatie:** `/app/api/manager/stripe/connect-onboarding/route.ts`

**Endpoints:**
- `POST /api/manager/stripe/connect-onboarding` - Stripe Connect account aanmaken
- `GET /api/manager/stripe/connect-onboarding?locationId=xxx` - Status opvragen

**Functionaliteit:**
- Creëert Stripe Standard Connect account voor restaurant
- Genereert onboarding link
- Tracked account status (charges_enabled, payouts_enabled)
- Updates location met Stripe account info

**Request:**
```json
POST /api/manager/stripe/connect-onboarding
{
  "locationId": "uuid"
}
```

**Response:**
```json
{
  "accountId": "acct_xxx",
  "onboardingUrl": "https://connect.stripe.com/...",
  "status": "PENDING"
}
```

#### 2. `/app/api/bookings/payment-intent/route.ts`
**Locatie:** `/app/api/bookings/payment-intent/route.ts`

**Endpoints:**
- `POST /api/bookings/payment-intent` - Nieuwe payment intent aanmaken
- `GET /api/bookings/payment-intent?bookingId=xxx` - Status opvragen
- `PATCH /api/bookings/payment-intent` - Capture of cancel pre-auth

**Functionaliteit:**
- Creëert Stripe Payment Intent met platform fee
- Ondersteunt DEPOSIT, FULL_PAYMENT, PRE_AUTH types
- Automatic vs manual capture
- Multi-payment method (card, iDEAL, Bancontact)
- Transaction logging

**Request:**
```json
POST /api/bookings/payment-intent
{
  "bookingId": "uuid",
  "paymentType": "DEPOSIT",
  "returnUrl": "https://..."
}
```

**Response:**
```json
{
  "clientSecret": "pi_xxx_secret_xxx",
  "paymentIntentId": "pi_xxx",
  "amount": 2500,
  "currency": "eur",
  "platformFee": 50,
  "restaurantAmount": 2450,
  "status": "requires_payment_method"
}
```

**Capture pre-auth:**
```json
PATCH /api/bookings/payment-intent
{
  "bookingId": "uuid",
  "action": "capture"
}
```

#### 3. `/app/api/bookings/refund/route.ts`
**Locatie:** `/app/api/bookings/refund/route.ts`

**Endpoints:**
- `POST /api/bookings/refund` - Refund verwerken
- `GET /api/bookings/refund?bookingId=xxx` - Refund preview/berekening

**Functionaliteit:**
- Automatische refund berekening op basis van cancellation policy
- Manager override voor custom bedragen
- Partial en full refunds
- Reverse transfers naar restaurant
- Platform fee blijft bij R4Y

**Request:**
```json
POST /api/bookings/refund
{
  "bookingId": "uuid",
  "amount": 2500,  // Optional
  "reason": "Customer request",
  "manualOverride": false
}
```

**Preview request:**
```
GET /api/bookings/refund?bookingId=uuid
```

**Preview response:**
```json
{
  "refundEligible": true,
  "paidAmount": 5000,
  "alreadyRefunded": 0,
  "refundableAmount": 5000,
  "refundPercentage": 100,
  "calculatedRefund": 5000,
  "message": "Volledige refund mogelijk"
}
```

#### 4. `/app/api/bookings/no-show-fee/route.ts`
**Locatie:** `/app/api/bookings/no-show-fee/route.ts`

**Endpoint:**
- `POST /api/bookings/no-show-fee` - No-show fee aanrekenen

**Functionaliteit:**
- Charged pre-authorized bedrag (indien aanwezig)
- Of creëert nieuwe charge met saved payment method
- Policy-based fee bedragen
- Manager-only access
- Transaction logging

**Request:**
```json
POST /api/bookings/no-show-fee
{
  "bookingId": "uuid",
  "customAmount": 2500  // Optional
}
```

**Response:**
```json
{
  "success": true,
  "chargeId": "ch_xxx",
  "amount": 2500,
  "currency": "eur",
  "status": "succeeded",
  "message": "No-show fee van €25.00 is aangerekend"
}
```

---

### Webhook Handlers

#### `/app/api/stripe/webhook/route.ts` (Updated)
**Locatie:** `/app/api/stripe/webhook/route.ts`

**Nieuwe event handlers:**
1. `payment_intent.succeeded` - Payment geslaagd
2. `payment_intent.payment_failed` - Payment mislukt
3. `payment_intent.amount_capturable_updated` - Pre-auth created
4. `charge.succeeded` - Charge tracking
5. `charge.failed` - Charge failed
6. `charge.refunded` - Refund verwerkt
7. `account.updated` - Connect account status

**Functionaliteit:**
- Automatic booking status updates
- Payment method tracking
- Transaction status updates
- Refund synchronisatie
- Stripe Connect account sync

**Key updates:**
- Metadata gebruikt `booking_id` (was `bookingId`)
- Payment method type tracking
- Captured amount tracking
- Better error handling

---

### UI Components

#### 1. `/components/booking/BookingPayment.tsx`
**Locatie:** `/components/booking/BookingPayment.tsx`

**Component:** `<BookingPayment />`

**Props:**
```typescript
interface BookingPaymentProps {
  bookingId: string;
  paymentType: 'DEPOSIT' | 'FULL_PAYMENT' | 'PRE_AUTH';
  onSuccess: () => void;
  onCancel: () => void;
}
```

**Features:**
- Stripe Payment Element integratie
- Automatic Payment Intent creation
- Support voor alle payment methods
- Loading states
- Error handling
- Success states
- Mobile responsive

**Styling:**
- Professional Reserve4You branding
- Geen emoji's
- Clean, modern design
- Blue accent color (#2563eb)

**Usage:**
```tsx
<BookingPayment
  bookingId={bookingId}
  paymentType="DEPOSIT"
  onSuccess={() => router.push('/confirmation')}
  onCancel={() => setStep('details')}
/>
```

#### 2. `/components/manager/PaymentsOverview.tsx`
**Locatie:** `/components/manager/PaymentsOverview.tsx`

**Component:** `<PaymentsOverview />`

**Props:**
```typescript
interface PaymentsOverviewProps {
  locationId: string;
}
```

**Features:**
- Payment statistics (revenue, refunds, fees, net)
- Stripe Connect status check
- Connect onboarding flow
- Transaction history table
- Export functionaliteit
- Filtering options
- Real-time status indicators

**Sections:**
1. Stats cards (revenue, refunds, platform fees, net amount)
2. Stripe Connect status & onboarding
3. Transactions table
4. Export & filter options

**Usage:**
```tsx
<PaymentsOverview locationId={location.id} />
```

---

### Configuratie

#### `/lib/config.ts` (Updated)
**Locatie:** `/lib/config.ts`

**Nieuwe configuratie:**
```typescript
stripe: {
  publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  webhookSecretConnect: process.env.STRIPE_WEBHOOK_SECRET_CONNECT,
  platformFeePercentage: parseFloat(process.env.STRIPE_PLATFORM_FEE_PERCENTAGE || '2.0'),
  // ... bestaande configuratie
}
```

---

### Documentatie

#### 1. `STRIPE_ENV_VARIABLES.md`
**Locatie:** `/STRIPE_ENV_VARIABLES.md`

**Inhoud:**
- Complete lijst van benodigde ENV variables
- Stap-voor-stap Stripe setup instructies
- Webhook configuratie
- Test cards overzicht
- Local development tips
- Production checklist
- Troubleshooting

#### 2. `STRIPE_PAYMENTS_IMPLEMENTATIE_GUIDE.md`
**Locatie:** `/STRIPE_PAYMENTS_IMPLEMENTATIE_GUIDE.md`

**Inhoud:**
- Volledige implementatie overview
- Installatie instructies
- API documentatie
- Usage voorbeelden
- Flow diagrammen
- Testing checklist
- Security best practices
- Production deployment guide

#### 3. `STRIPE_IMPLEMENTATION_OVERZICHT.md` (dit bestand)
**Locatie:** `/STRIPE_IMPLEMENTATION_OVERZICHT.md`

**Inhoud:**
- Quick reference van alle bestanden
- Bestandslocaties
- API endpoints overzicht
- Component usage
- ENV variables lijst

---

## 🔑 Environment Variables (Quick Reference)

```bash
# Verplicht
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Optioneel
STRIPE_WEBHOOK_SECRET_CONNECT=whsec_...
STRIPE_CURRENCY=eur
STRIPE_PLATFORM_FEE_PERCENTAGE=2.0

# Subscription Price IDs (bestaand)
STRIPE_PRICE_ID_STARTER=price_...
STRIPE_PRICE_ID_GROWTH=price_...
STRIPE_PRICE_ID_BUSINESS=price_...
STRIPE_PRICE_ID_PREMIUM=price_...
```

**Zie `STRIPE_ENV_VARIABLES.md` voor complete lijst en setup instructies.**

---

## 📊 Database Schema Wijzigingen

### Locations Table (NEW COLUMNS)
```sql
stripe_account_id TEXT
stripe_account_status VARCHAR(20)
stripe_charges_enabled BOOLEAN
stripe_payouts_enabled BOOLEAN
stripe_onboarding_completed BOOLEAN
stripe_account_created_at TIMESTAMPTZ
```

### Bookings Table (NEW COLUMNS)
```sql
payment_method VARCHAR(20)
payment_type VARCHAR(20)
stripe_payment_method_id TEXT
payment_intent_amount_cents INT
payment_captured_amount_cents INT
platform_fee_cents INT
restaurant_amount_cents INT
refund_amount_cents INT
refund_reason TEXT
refunded_at TIMESTAMPTZ
payment_failed_reason TEXT
payment_completed_at TIMESTAMPTZ
```

### Payment Transactions Table (NEW TABLE)
```sql
CREATE TABLE payment_transactions (
  id UUID PRIMARY KEY,
  booking_id UUID REFERENCES bookings,
  location_id UUID REFERENCES locations,
  stripe_payment_intent_id TEXT,
  stripe_charge_id TEXT,
  stripe_refund_id TEXT,
  transaction_type VARCHAR(20),
  amount_cents INT,
  platform_fee_cents INT,
  net_amount_cents INT,
  status VARCHAR(20),
  created_at TIMESTAMPTZ,
  -- ... meer velden
);
```

### Billing State (NEW COLUMNS)
```sql
platform_fee_percentage DECIMAL(5,2) DEFAULT 2.00
custom_platform_fee BOOLEAN DEFAULT FALSE
```

### Policies (NEW COLUMNS)
```sql
auto_refund_on_cancellation BOOLEAN DEFAULT TRUE
refund_percentage_hours_before JSONB
charge_no_show_fee_automatically BOOLEAN DEFAULT FALSE
```

---

## 🎯 API Endpoints Overzicht

| Endpoint | Method | Functie |
|----------|--------|---------|
| `/api/manager/stripe/connect-onboarding` | POST | Stripe Connect account aanmaken |
| `/api/manager/stripe/connect-onboarding?locationId=xxx` | GET | Connect status opvragen |
| `/api/bookings/payment-intent` | POST | Payment Intent aanmaken |
| `/api/bookings/payment-intent?bookingId=xxx` | GET | Payment status opvragen |
| `/api/bookings/payment-intent` | PATCH | Pre-auth capture/cancel |
| `/api/bookings/refund` | POST | Refund verwerken |
| `/api/bookings/refund?bookingId=xxx` | GET | Refund preview |
| `/api/bookings/no-show-fee` | POST | No-show fee aanrekenen |
| `/api/stripe/webhook` | POST | Stripe events ontvangen |

---

## 🧩 Component Integratie Voorbeelden

### 1. Booking Modal met Payment

```tsx
'use client';

import { useState } from 'react';
import { BookingPayment } from '@/components/booking/BookingPayment';

export function BookingFlow() {
  const [step, setStep] = useState<'details' | 'payment' | 'confirmation'>('details');
  const [bookingId, setBookingId] = useState<string>('');

  const handleBookingCreated = async (data: BookingFormData) => {
    // Create booking
    const response = await fetch('/api/bookings/create', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    const { booking_id } = await response.json();
    
    setBookingId(booking_id);
    setStep('payment');
  };

  if (step === 'payment') {
    return (
      <BookingPayment
        bookingId={bookingId}
        paymentType="DEPOSIT"
        onSuccess={() => setStep('confirmation')}
        onCancel={() => setStep('details')}
      />
    );
  }

  // ... rest of component
}
```

### 2. Manager Dashboard

```tsx
import { PaymentsOverview } from '@/components/manager/PaymentsOverview';

export default function PaymentsPage({ params }: { params: { locationId: string } }) {
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">Betalingen & Transacties</h1>
      <PaymentsOverview locationId={params.locationId} />
    </div>
  );
}
```

### 3. Refund Button

```tsx
async function handleRefund(bookingId: string) {
  try {
    const response = await fetch('/api/bookings/refund', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bookingId,
        reason: 'Customer requested cancellation',
      }),
    });

    const result = await response.json();
    
    if (result.success) {
      toast.success(`€${(result.refundAmount / 100).toFixed(2)} terugbetaald`);
    }
  } catch (error) {
    toast.error('Refund mislukt');
  }
}
```

---

## ✅ Installatie Checklist

- [ ] **Database:**
  - [ ] Run `STRIPE_BOOKING_PAYMENTS_SETUP.sql` in Supabase
  - [ ] Verify tables created: `payment_transactions`
  - [ ] Verify new columns in `locations`, `bookings`, `policies`
  - [ ] Verify functions: `calculate_platform_fee`, `calculate_deposit_amount`

- [ ] **Dependencies:**
  - [ ] `npm install @stripe/stripe-js @stripe/react-stripe-js stripe`

- [ ] **Environment Variables:**
  - [ ] `STRIPE_SECRET_KEY`
  - [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
  - [ ] `STRIPE_WEBHOOK_SECRET`
  - [ ] Optioneel: `STRIPE_WEBHOOK_SECRET_CONNECT`
  - [ ] Optioneel: `STRIPE_PLATFORM_FEE_PERCENTAGE`

- [ ] **Stripe Dashboard:**
  - [ ] API keys gekopieerd
  - [ ] Webhook endpoint toegevoegd
  - [ ] Webhook events geselecteerd
  - [ ] Stripe Connect geactiveerd
  - [ ] Subscription products aangemaakt (indien nodig)

- [ ] **Testing:**
  - [ ] Test payment met test card
  - [ ] Test refund flow
  - [ ] Test webhook events
  - [ ] Test Stripe Connect onboarding

---

## 🚀 Quick Start

### 1. Database Setup
```bash
# Via Supabase SQL Editor
# Open: STRIPE_BOOKING_PAYMENTS_SETUP.sql
# Kopieer alles → Plak in SQL Editor → Run
```

### 2. Install Dependencies
```bash
npm install @stripe/stripe-js @stripe/react-stripe-js stripe
```

### 3. Environment Variables
```bash
# Kopieer naar .env.local
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 4. Start Development Server
```bash
npm run dev

# In andere terminal: Stripe webhook forwarding
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

### 5. Test Payment
1. Maak reservering
2. Kies deposit payment
3. Gebruik test card: `4242 4242 4242 4242`
4. Expiry: Any future date
5. CVC: Any 3 digits
6. Verifieer payment succeeded

---

## 📞 Support & Troubleshooting

**Stripe Issues:**
- Documentatie: https://stripe.com/docs
- Dashboard: https://dashboard.stripe.com
- Support: https://support.stripe.com

**Common Issues:**

1. **Webhook niet ontvangen**
   - Check Stripe Dashboard → Developers → Webhooks → Event logs
   - Verify signing secret in .env.local
   - Test met Stripe CLI: `stripe trigger payment_intent.succeeded`

2. **Payment fails**
   - Check test card gebruikt in test mode
   - Verify publishable key is correct
   - Check browser console voor errors

3. **Connect onboarding fails**
   - Verify Connect is enabled in Stripe Dashboard
   - Check metadata in account creation
   - Verify return_url en refresh_url are correct

---

## 🎉 Conclusie

Volledige Stripe betalingsintegratie is geïmplementeerd en productie-klaar!

**Alle bestanden zijn aangemaakt:**
- ✅ SQL schema updates
- ✅ API routes voor alle payment flows  
- ✅ Webhook handlers
- ✅ UI components (payment & dashboard)
- ✅ Configuratie updates
- ✅ Volledige documentatie

**Klaar voor gebruik:**
- Deposits
- Vooruitbetalingen
- Pre-authorization
- Refunds
- No-show fees
- Platform fees
- Multi-payment methods

**Volg de implementatie guide** (`STRIPE_PAYMENTS_IMPLEMENTATIE_GUIDE.md`) voor gedetailleerde setup instructies.

