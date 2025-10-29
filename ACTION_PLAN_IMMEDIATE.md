# Reserve4You - Immediate Action Plan
## Start Hier → Revenue in 2 Weken

**Datum:** 29 Oktober 2025  
**Voor:** Dietmar (of wie de Stripe fix doet)  
**Doel:** Platform production-ready maken + eerste betalende klant

---

## 🎯 DE SITUATIE

Je hebt een **volledig functioneel multi-sector booking platform** gebouwd.  
Maar: **Stripe payments zijn in TEST MODE** → gebruikers kunnen upgraden zonder te betalen.

**Result:** €0 revenue, hoewel platform klaar is.

**Fix tijd:** 4-6 uur werk  
**ROI:** Onmiddellijk revenue capability

---

## ⚡ PHASE 0: STRIPE FIX (DAG 1-2)

### Stap 1: Maak Echte Stripe Producten (1 uur)

1. **Login bij Stripe Dashboard**
   ```
   https://dashboard.stripe.com
   ```

2. **Ga naar Products → Create Product**
   
3. **Maak 3 producten aan:**

   **Product 1: Reserve4You START**
   - Name: Reserve4You START
   - Description: Basis reserveringssysteem voor 1 locatie
   - Price: €49.00 EUR / month
   - Recurring: Monthly
   - ✅ Click "Save product"
   - **Copy de Price ID:** `price_1xxxxxxxxxxxx` → dit is je `STRIPE_PRICE_ID_START`

   **Product 2: Reserve4You PRO**
   - Name: Reserve4You PRO  
   - Description: Voor groeiende bedrijven, max 3 locaties
   - Price: €99.00 EUR / month
   - Recurring: Monthly
   - ✅ Click "Save product"
   - **Copy de Price ID:** `price_1xxxxxxxxxxxx` → dit is je `STRIPE_PRICE_ID_PRO`

   **Product 3: Reserve4You PLUS**
   - Name: Reserve4You PLUS
   - Description: Professioneel plan, onbeperkte locaties
   - Price: €149.00 EUR / month
   - Recurring: Monthly
   - ✅ Click "Save product"
   - **Copy de Price ID:** `price_1xxxxxxxxxxxx` → dit is je `STRIPE_PRICE_ID_PLUS`

4. **Write down alle 3 Price IDs!**

---

### Stap 2: Update Environment Variables (10 min)

1. **Open je `.env.local` bestand**
   ```bash
   cd /Users/dietmar/Desktop/ray2
   code .env.local  # of nano .env.local
   ```

2. **Vervang deze regels:**
   ```bash
   # OUDE VALUES (verwijder):
   STRIPE_PRICE_ID_START=price_starter
   STRIPE_PRICE_ID_PRO=price_growth
   STRIPE_PRICE_ID_PLUS=price_premium

   # NIEUWE VALUES (van Stripe Dashboard):
   STRIPE_PRICE_ID_START=price_1xxxxxxxxxxxx  # ← jouw echte ID
   STRIPE_PRICE_ID_PRO=price_1xxxxxxxxxxxx    # ← jouw echte ID
   STRIPE_PRICE_ID_PLUS=price_1xxxxxxxxxxxx   # ← jouw echte ID
   ```

3. **Verify je SECRET KEY is live key:**
   ```bash
   STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxx  # Moet beginnen met sk_live_
   # Als je sk_test_ ziet → ga naar Stripe Dashboard → Developers → API Keys → Reveal live key
   ```

4. **Save bestand**

---

### Stap 3: Update Code (15 min)

1. **Open `/Users/dietmar/Desktop/ray2/app/api/profile/upgrade-checkout/route.ts`**

2. **Delete lines 105-174** (hele test mode bypass sectie)
   
   **Verwijder dit:**
   ```typescript
   // TEST MODE: If using default/placeholder price IDs, activate plan directly (bypass Stripe)
   const isPlaceholderPrice = !priceId || 
     priceId === 'price_starter' || 
     priceId === 'price_growth' || 
     priceId === 'price_premium' ||
     !priceId.startsWith('price_1');
   
   if (isPlaceholderPrice) {
     console.log('✅ TEST MODE: Activating plan directly (no Stripe payment)');
     
     // ... hele sectie tot line 174
   }
   ```

3. **Keep ALLEEN de echte Stripe checkout code (lines 176-200):**
   ```typescript
   // Create Checkout session
   const checkoutSession = await stripe.checkout.sessions.create({
     customer: customerId,
     mode: 'subscription',
     payment_method_types: ['card', 'ideal', 'bancontact'],  // ← Add EU payment methods
     line_items: [
       {
         price: priceId,
         quantity: 1,
       },
     ],
     success_url: `${origin}/profile?upgraded=true&plan=${plan}&session_id={CHECKOUT_SESSION_ID}`,
     cancel_url: `${origin}/profile?tab=subscription&cancelled=true`,
     metadata: {
       tenantId: tenantId,
       plan: plan,
     },
     subscription_data: {
       metadata: {
         tenantId: tenantId,
         plan: plan,
       },
     },
   });

   return NextResponse.json({ url: checkoutSession.url });
   ```

4. **Save bestand**

---

### Stap 4: Setup Stripe Webhook (30 min)

1. **Ga naar Stripe Dashboard → Developers → Webhooks**

2. **Click "Add endpoint"**

3. **Endpoint URL:**
   ```
   https://reserve4you.com/api/stripe/webhook
   ```
   (Of als je nog op development test: `https://[jouw-vercel-preview].vercel.app/api/stripe/webhook`)

4. **Select events to listen to:**
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `checkout.session.completed`

5. **Click "Add endpoint"**

6. **Reveal webhook signing secret:**
   - Click op de webhook je net maakte
   - Click "Reveal" bij "Signing secret"
   - **Copy:** `whsec_xxxxxxxxxxxx`

7. **Update `.env.local`:**
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxx  # ← paste hier
   ```

8. **Deploy to Vercel (als production):**
   ```bash
   # Update environment variables in Vercel Dashboard:
   https://vercel.com/[your-project]/settings/environment-variables
   
   # Add:
   STRIPE_SECRET_KEY=sk_live_xxxxx
   STRIPE_WEBHOOK_SECRET=whsec_xxxxx
   STRIPE_PRICE_ID_START=price_1xxxxx
   STRIPE_PRICE_ID_PRO=price_1xxxxx
   STRIPE_PRICE_ID_PLUS=price_1xxxxx
   ```

---

### Stap 5: Test Lokaal (30 min)

1. **Restart dev server:**
   ```bash
   cd /Users/dietmar/Desktop/ray2
   
   # Stop server (Ctrl+C)
   
   # Start server
   npm run dev
   # of
   pnpm dev
   ```

2. **Open browser:**
   ```
   http://localhost:3007/profile
   ```

3. **Login met een test account**

4. **Klik "Upgrade" bij één van je tenants**

5. **Verify:**
   - ✅ Redirects naar Stripe Checkout page (niet direct success!)
   - ✅ Ziet product name "Reserve4You PRO" (of START/PLUS)
   - ✅ Ziet prijs €99.00/maand

6. **Use Stripe Test Card:**
   ```
   Card: 4242 4242 4242 4242
   Expiry: 12/34
   CVC: 123
   ZIP: 12345
   ```

7. **Complete payment**

8. **Verify:**
   - ✅ Redirects terug naar `/profile?upgraded=true`
   - ✅ In Stripe Dashboard → Customers: new customer created
   - ✅ In Stripe Dashboard → Subscriptions: active subscription
   - ✅ In Supabase → `billing_state` table: status = 'ACTIVE', plan = 'PRO'

---

### Stap 6: Test Webhook (30 min)

**Option A: Use Stripe CLI (Recommended)**

1. **Install Stripe CLI:**
   ```bash
   # Mac:
   brew install stripe/stripe-cli/stripe
   
   # Linux:
   # Follow: https://stripe.com/docs/stripe-cli
   ```

2. **Login:**
   ```bash
   stripe login
   ```

3. **Forward webhooks to localhost:**
   ```bash
   stripe listen --forward-to localhost:3007/api/stripe/webhook
   ```
   
   Dit geeft je een webhook secret voor testing: `whsec_xxxxx`
   Update `.env.local` tijdelijk met deze key.

4. **Trigger test events:**
   ```bash
   # In nieuwe terminal:
   stripe trigger customer.subscription.created
   stripe trigger invoice.payment_succeeded
   stripe trigger customer.subscription.deleted
   ```

5. **Check je logs:**
   - Terminal waar `npm run dev` draait
   - Should see: "✅ Webhook verified: customer.subscription.created"
   - Check Supabase `billing_state` table for updates

**Option B: Use Stripe Dashboard (Simpler)**

1. Ga naar Stripe Dashboard → Developers → Webhooks
2. Click op je webhook
3. Click "Send test webhook"
4. Select event type (bijv. `customer.subscription.updated`)
5. Click "Send test webhook"
6. Check je server logs + Supabase

---

### Stap 7: Deploy to Production (30 min)

**Als je Vercel gebruikt:**

1. **Update environment variables in Vercel:**
   ```
   https://vercel.com/[your-project]/settings/environment-variables
   ```
   
   Add/update:
   - `STRIPE_SECRET_KEY` = `sk_live_xxxxx` (LIVE key!)
   - `STRIPE_WEBHOOK_SECRET` = `whsec_xxxxx`
   - `STRIPE_PRICE_ID_START` = `price_1xxxxx`
   - `STRIPE_PRICE_ID_PRO` = `price_1xxxxx`
   - `STRIPE_PRICE_ID_PLUS` = `price_1xxxxx`

2. **Deploy:**
   ```bash
   git add .
   git commit -m "fix: enable real Stripe payment integration"
   git push
   ```

3. **Vercel auto-deploys**
   
4. **Verify production:**
   - Open https://reserve4you.com/profile
   - Test upgrade flow
   - Use REAL credit card (small amount, you can refund later)
   - Verify payment completes
   - Check Stripe Dashboard for real payment

5. **Update webhook endpoint URL** (if needed):
   - Stripe Dashboard → Webhooks → Edit endpoint
   - Change to: `https://reserve4you.com/api/stripe/webhook`

---

### Stap 8: Verify Everything Works (30 min)

**Checklist:**

**Payments:**
- [ ] User kan upgraden van FREE → START
- [ ] User kan upgraden van START → PRO
- [ ] User kan upgraden van PRO → PLUS
- [ ] Stripe Checkout pagina toont juiste prijs
- [ ] Payment succeeds
- [ ] Redirect terug naar /profile met success message
- [ ] `billing_state` table updated met plan + status

**Webhooks:**
- [ ] `customer.subscription.created` event received
- [ ] `billing_state` table updated naar ACTIVE
- [ ] `invoice.payment_succeeded` event received
- [ ] No webhook errors in Stripe Dashboard

**Edge Cases:**
- [ ] User cancels payment → blijft op oude plan
- [ ] Payment fails → blijft op oude plan, geen ACTIVE status
- [ ] Webhook komt 2x → idempotent (geen duplicate updates)

---

## 📊 SUCCESS CRITERIA

Na deze fix:
- ✅ **Real Stripe products** gemaakt (START, PRO, PLUS)
- ✅ **Environment variables** updated (live keys + price IDs)
- ✅ **Test mode bypass** verwijderd uit code
- ✅ **Webhook** configured en tested
- ✅ **End-to-end test** passed (betaling → webhook → database update)
- ✅ **Production deployment** met live Stripe keys

**Result:** 🎉 **Platform kan nu echte inkomsten genereren!**

---

## 🚨 TROUBLESHOOTING

### Error: "No such price: price_starter"
**Probleem:** Oude placeholder price ID nog in code  
**Fix:** Check `.env.local` heeft echte `price_1xxxxx` IDs

### Error: "Webhook signature verification failed"
**Probleem:** Verkeerde webhook secret  
**Fix:** Check `STRIPE_WEBHOOK_SECRET` in `.env.local` matches Stripe Dashboard

### Error: "Customer already has an active subscription"
**Probleem:** User probeert zelfde plan opnieuw te activeren  
**Fix:** Check in `/app/profile/SubscriptionSection.tsx` - disable button als `isCurrentPlan`

### Webhook komt niet aan
**Probleem:** Webhook URL verkeerd of server niet bereikbaar  
**Fix:**
1. Check Stripe Dashboard → Webhooks → jouw endpoint → "Recent events"
2. Als errors: kijk naar response body
3. Verify URL is correct: `https://reserve4you.com/api/stripe/webhook`
4. Test met Stripe CLI: `stripe listen --forward-to ...`

### Database update gebeurt niet na payment
**Probleem:** Webhook handler faalt stilletjes  
**Fix:**
1. Check server logs (Vercel dashboard of `npm run dev` terminal)
2. Check `/app/api/stripe/webhook/route.ts` - zijn er errors?
3. Check Supabase RLS policies - heeft webhook handler access?

---

## 📞 HULP NODIG?

**Als je vastloopt:**
1. Check Stripe Dashboard → Developers → Logs (zie API calls)
2. Check Vercel logs (als production)
3. Check Supabase logs
4. Google: "Stripe [error message]"
5. Stripe docs: https://stripe.com/docs

**Of:**
- Hire een freelance dev voor 4-6 uur (€300-€600)
- Platforms: Upwork, Toptal, Codementor

---

## ✅ VOLGENDE STAP NA STRIPE FIX

**Week 1-2: Start Recruitment**
1. Post job voor Senior Full-stack Developer
2. Budget: €60K-€80K/jaar + equity
3. Platforms: WeWorkRemotely, AngelList, RemoteOK
4. See: `TEAM_RECRUITMENT_GUIDE.md`

**Week 3-6: Phase 1 - Beauty Sector**
1. Hire developer start
2. Build service management UI
3. Build staff scheduling
4. Test met 10 beauty salons
5. Target: +€5K MRR

**Full roadmap:** See `COMPREHENSIVE_PRD_2025.md`

---

## 🎯 JE BENT KLAAR ALS...

- [ ] Je kunt een echte credit card gebruiken om te upgraden
- [ ] Payment wordt geprocessed in Stripe Dashboard (live mode)
- [ ] Je ziet het bedrag in Stripe balance
- [ ] Database wordt automatisch updated via webhook
- [ ] User ziet success message na betaling
- [ ] Je kunt subscription cancelen (optional test)

**Dan:** 🎉 **Platform is production-ready voor betalende klanten!**

---

**Start nu. 4-6 uur werk. Unlock revenue capability.** 🚀

**Vragen? Check:**
- `COMPREHENSIVE_PRD_2025.md` - Full technical analysis
- `EXECUTIVE_SUMMARY_2025.md` - Business case & roadmap
- `TEAM_RECRUITMENT_GUIDE.md` - Hiring help

**Let's build.** 💪

