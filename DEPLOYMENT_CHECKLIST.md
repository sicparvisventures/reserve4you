# 📋 Reserve4You - Production Deployment Checklist

## 🚀 PRE-DEPLOYMENT

### Code Preparation
- [ ] All SQL migrations tested and working
- [ ] No console errors in browser
- [ ] All TypeScript types are correct (run `pnpm build` locally)
- [ ] All linter errors fixed
- [ ] `.gitignore` configured (no `.env` files in git!)
- [ ] Production environment variables prepared

### Database (Supabase)
- [ ] All migrations run on production database
- [ ] RLS policies tested and working
- [ ] Service role key secured
- [ ] Database backups enabled
- [ ] Row Level Security enabled on all tables

### Authentication
- [ ] Google OAuth credentials created (production)
- [ ] OAuth redirect URLs configured for production domain
- [ ] Supabase Auth configured with production URLs
- [ ] Email templates customized (optional)

### Payments (Stripe)
- [ ] Production Stripe account created
- [ ] Stripe price IDs created for all tiers
- [ ] Webhook endpoint configured
- [ ] Stripe keys secured (use `sk_live_...`)
- [ ] Test mode thoroughly tested first

---

## 🌐 DEPLOYMENT STEPS

### 1. Push to Git
```bash
git add .
git commit -m "Production ready"
git push origin main
```

### 2. Create Cloudflare Pages Project
1. Go to Cloudflare Dashboard
2. Workers & Pages → Create
3. Connect to Git → Select repository
4. Configure build settings:
   - Framework: Next.js
   - Build command: `pnpm build`
   - Build directory: `.next`

### 3. Configure Environment Variables
Add all variables from `.env.production.example` in Cloudflare Pages settings

### 4. Update External Services

#### Google OAuth Console
- Authorized JavaScript origins: `https://your-domain.pages.dev`
- Authorized redirect URIs: `https://your-domain.pages.dev/auth/callback/google`

#### Supabase Dashboard
- Site URL: `https://your-domain.pages.dev`
- Redirect URLs: `https://your-domain.pages.dev/**`

#### Stripe Dashboard
- Webhook endpoint: `https://your-domain.pages.dev/api/stripe/webhook`
- Select events to listen to:
  - `checkout.session.completed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_succeeded`
  - `invoice.payment_failed`

### 5. Deploy
- Push to main branch
- Cloudflare Pages will automatically build and deploy

---

## ✅ POST-DEPLOYMENT TESTING

### Basic Functionality
- [ ] Homepage loads correctly
- [ ] No console errors
- [ ] Images load correctly
- [ ] Navigation works
- [ ] Responsive design works on mobile

### Authentication Flow
- [ ] Google OAuth login works
- [ ] Redirect after login works
- [ ] Logout works
- [ ] Session persists across pages

### Consumer Features
- [ ] Search restaurants works
- [ ] Location detail pages load
- [ ] Booking sheet opens
- [ ] Can select date/time
- [ ] Can complete booking
- [ ] Booking saves to database
- [ ] Profile page shows bookings

### Manager Features
- [ ] Can access manager portal
- [ ] Onboarding wizard works
- [ ] Can create tenant
- [ ] Can add location
- [ ] Can configure tables/shifts
- [ ] Dashboard shows bookings
- [ ] Can update booking status

### Payment Flow (if enabled)
- [ ] Can select subscription tier
- [ ] Stripe Checkout opens
- [ ] Payment processes successfully
- [ ] Subscription status updates
- [ ] Webhook receives events

---

## 🐛 TROUBLESHOOTING

### Build Fails
- Check build logs in Cloudflare Pages
- Verify all dependencies are in `package.json`
- Ensure `pnpm-lock.yaml` is committed

### Auth Not Working
- Verify redirect URLs match exactly (including https://)
- Check environment variables are set correctly
- Verify Supabase project URL is correct

### Database Errors
- Check Supabase connection string
- Verify RLS policies allow production access
- Check service role key is correct

### Stripe Webhooks Not Receiving
- Verify webhook URL is correct
- Check webhook signing secret
- Test with Stripe CLI first

---

## 📊 MONITORING

### Setup Analytics
- [ ] Cloudflare Web Analytics enabled
- [ ] Vercel Analytics (if using Vercel)
- [ ] Google Analytics (optional)

### Error Tracking
- [ ] Sentry or similar error tracking (optional)
- [ ] Check Cloudflare Pages logs regularly

### Performance
- [ ] Run Lighthouse audit
- [ ] Check Core Web Vitals
- [ ] Monitor load times

---

## 🔒 SECURITY

### Environment Variables
- [ ] All secrets stored securely
- [ ] No secrets in git repository
- [ ] Different keys for dev/staging/prod

### Headers
- [ ] Security headers configured
- [ ] CORS configured correctly
- [ ] CSP headers (optional)

### Database
- [ ] RLS policies tested
- [ ] Service role key secured
- [ ] Regular backups enabled

---

## 📱 FINAL CHECKS

- [ ] Test on mobile devices
- [ ] Test on different browsers (Chrome, Safari, Firefox)
- [ ] Test slow network conditions
- [ ] Test with ad blockers
- [ ] Test all critical user flows end-to-end

---

## 🎉 GO LIVE!

When all checkboxes are ticked:

1. Update DNS (if using custom domain)
2. Enable SSL/TLS in Cloudflare
3. Announce to users!
4. Monitor for issues in first 24 hours

---

## 🚨 ROLLBACK PLAN

If something goes wrong:

1. **Cloudflare Pages:** Deploy previous working version
2. **Database:** Restore from backup
3. **Environment:** Revert environment variables
4. **Communication:** Notify users of maintenance

---

## 📞 SUPPORT CONTACTS

- Cloudflare Support: https://dash.cloudflare.com/support
- Supabase Support: https://supabase.com/support
- Stripe Support: https://support.stripe.com
- Next.js Docs: https://nextjs.org/docs

---

**GOOD LUCK WITH YOUR LAUNCH!** 🚀

