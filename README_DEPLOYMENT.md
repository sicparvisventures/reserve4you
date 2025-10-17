# 🚀 Reserve4You - Deployment Opties

## ⚠️ BELANGRIJKE INFORMATIE

**Je kunt GEEN ZIP uploaden naar Cloudflare Pages** voor deze app.

**Waarom?** Reserve4You is een **full-stack Next.js app** met:
- Server Components
- API Routes  
- Database queries
- Real-time authentication
- Server-side rendering

**Deze features vereisen een Node.js runtime en kunnen NIET als statische files draaien.**

---

## 🎯 JOUW DEPLOYMENT OPTIES

### **OPTIE 1: Vercel (AANBEVOLEN)** ⭐⭐⭐

**Tijd: 2 minuten | Moeilijkheid: Zeer makkelijk**

```bash
cd /Users/dietmar/Desktop/ray2
./QUICK_DEPLOY.sh  # Push naar GitHub
```

Daarna:
1. Ga naar https://vercel.com/new
2. Import je GitHub repository
3. Klik "Deploy"
4. ✅ **KLAAR!**

**Waarom Vercel?**
- ✅ Gemaakt voor Next.js (door creators van Next.js!)
- ✅ Zero configuration nodig
- ✅ Automatische optimalisatie
- ✅ Gratis SSL & CDN
- ✅ Automatische deploys
- ✅ Preview URLs voor elke branch

📖 **Volledige guide:** `VERCEL_DEPLOY.md`

---

### **OPTIE 2: Cloudflare Pages via Git** ⭐⭐

**Tijd: 5 minuten | Moeilijkheid: Makkelijk**

```bash
cd /Users/dietmar/Desktop/ray2
./QUICK_DEPLOY.sh  # Push naar GitHub
```

Daarna:
1. Ga naar https://dash.cloudflare.com
2. Workers & Pages → Create → Connect to Git
3. Selecteer repository
4. Deploy!

📖 **Volledige guide:** `CLOUDFLARE_DEPLOYMENT_GUIDE.md`

---

### **OPTIE 3: Railway** ⭐

**Tijd: 3 minuten | Moeilijkheid: Makkelijk**

1. Ga naar https://railway.app
2. "Deploy from GitHub repo"
3. Selecteer je repository
4. ✅ **KLAAR!**

---

### **OPTIE 4: Netlify** ⭐

**Tijd: 3 minuten | Moeilijkheid: Makkelijk**

1. Ga naar https://app.netlify.com
2. "Import from Git"
3. Selecteer je repository
4. ✅ **KLAAR!**

---

## 📦 QUICK DEPLOY SCRIPT

```bash
cd /Users/dietmar/Desktop/ray2

# Run het deployment script
./QUICK_DEPLOY.sh

# Volg de instructies:
# 1. Push naar GitHub
# 2. Kies je deployment platform
# 3. Deploy!
```

---

## 📋 DEPLOYMENT CHECKLIST

Gebruik deze checklist voor je deployment:

```
📖 DEPLOYMENT_CHECKLIST.md
```

Volledige stap-voor-stap checklist met alles wat je moet doen.

---

## 🔒 ENVIRONMENT VARIABLES

Na deployment, configureer deze in je platform:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# Google OAuth  
NEXT_PUBLIC_GOOGLE_CLIENT_ID=xxx

# Stripe
STRIPE_SECRET_KEY=sk_live_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# App URL
NEXT_PUBLIC_APP_URL=https://jouw-domain.vercel.app
```

📖 **Voorbeeld:** `.env.production.example`

---

## ⚙️ POST-DEPLOYMENT SETUP

Na deployment moet je:

### 1. Update Google OAuth
```
Google Console → Credentials → Authorized redirect URIs
→ https://jouw-domain.vercel.app/auth/callback/google
```

### 2. Update Supabase URLs
```
Supabase Dashboard → Authentication → URL Configuration
→ Site URL: https://jouw-domain.vercel.app
→ Redirect URLs: https://jouw-domain.vercel.app/**
```

### 3. Update Stripe Webhooks
```
Stripe Dashboard → Webhooks → Add endpoint
→ https://jouw-domain.vercel.app/api/stripe/webhook
```

---

## 🧪 TEST JE DEPLOYMENT

Na deployment, test:

- [ ] Homepage laadt
- [ ] Google login werkt
- [ ] Kan restaurant zoeken
- [ ] Kan reservering maken
- [ ] Manager portal werkt
- [ ] Dashboard toont bookings

---

## 🆘 PROBLEMEN?

### Build Fails
→ Check build logs in je platform dashboard

### Auth Werkt Niet
→ Verify redirect URLs zijn correct

### Database Errors  
→ Check Supabase connection & RLS policies

### Meer hulp?
- 📖 `CLOUDFLARE_DEPLOYMENT_GUIDE.md`
- 📖 `VERCEL_DEPLOY.md`
- 📖 `BUILD_FOR_UPLOAD.md`

---

## 💰 KOSTEN

### Vercel
- **Hobby:** GRATIS (perfect voor start)
- **Pro:** $20/maand (voor production met team)

### Cloudflare Pages
- **Free:** GRATIS (500 builds/maand)
- **Pro:** $20/maand (unlimited builds)

### Railway
- **Free:** $5 credit/maand
- **Developer:** $10/maand

### Netlify
- **Free:** GRATIS (300 build minutes)
- **Pro:** $19/maand

**Aanbeveling:** Start met **Vercel Free tier** - perfect voor MVP!

---

## 🎯 SNELSTE WEG NAAR PRODUCTION

```bash
# Stap 1: Deploy script runnen (1 min)
cd /Users/dietmar/Desktop/ray2
./QUICK_DEPLOY.sh

# Stap 2: Push naar GitHub (volg instructies script)

# Stap 3: Deploy via Vercel (1 min)
# - Ga naar vercel.com/new
# - Import GitHub repo
# - Klik Deploy
# - KLAAR!

# Stap 4: Add environment variables (2 min)
# - Kopieer van .env.local naar Vercel dashboard

# Stap 5: Update OAuth URLs (1 min)
# - Google Console
# - Supabase Dashboard

# ✅ JE BENT LIVE! (totaal: ~5 minuten)
```

---

## 📞 SUPPORT

- **Vercel:** https://vercel.com/docs
- **Cloudflare:** https://developers.cloudflare.com/pages/
- **Next.js:** https://nextjs.org/docs/deployment
- **Supabase:** https://supabase.com/docs

---

## ✅ CONCLUSIE

**Voor Reserve4You production deployment:**

1. ⭐⭐⭐ **BEST:** Vercel (snelst & makkelijkst)
2. ⭐⭐ **GOED:** Cloudflare Pages (via Git)
3. ⭐ **OK:** Railway/Netlify
4. ❌ **WERKT NIET:** ZIP upload

**Kies Vercel en je bent in 5 minuten live!** 🚀

---

**VOLGENDE STAP:** Run `./QUICK_DEPLOY.sh` en volg de instructies!

Good luck! 🎉

