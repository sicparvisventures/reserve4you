# VERCEL ENVIRONMENT VARIABLES SETUP

**Datum:** 29 oktober 2025  
**Status:** 🔧 ACTION REQUIRED

---

## 🚨 PROBLEEM

Je krijgt "Google Places API not configured" op Vercel omdat de environment variables niet zijn ingesteld in Vercel Dashboard.

**Environment variables in `.env.local` worden NIET automatisch naar Vercel geüpload!**

---

## ✅ OPLOSSING: Vercel Environment Variables Toevoegen

### **Stap 1: Ga naar Vercel Dashboard**

1. Open: https://vercel.com/dashboard
2. Selecteer je project (reserve4you of similar)
3. Klik op **"Settings"** tab
4. Klik op **"Environment Variables"** in het linker menu

---

### **Stap 2: Voeg Google Places API Key toe**

#### **Variable 1: GOOGLE_PLACES_API_KEY (Server-side)**

```
Name:     GOOGLE_PLACES_API_KEY
Value:    [Je Google Places API Key van Google Cloud Console]
Environment: Production, Preview, Development (selecteer alles)
```

**Voorbeeld:**
```
GOOGLE_PLACES_API_KEY=AIzaSyC-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

#### **Variable 2: NEXT_PUBLIC_GOOGLE_MAPS_API_KEY (Client-side)**

```
Name:     NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
Value:    [Je Google Maps Embed API Key - kan dezelfde zijn]
Environment: Production, Preview, Development (selecteer alles)
```

**Voorbeeld:**
```
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyC-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

### **Stap 3: Andere Required Environment Variables**

Zorg ervoor dat ALLE volgende variables zijn ingesteld in Vercel:

#### **Supabase:**
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

#### **Stripe:**
```
STRIPE_SECRET_KEY=sk_test_... of sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_... of pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

#### **Google OAuth (indien gebruikt):**
```
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
```

#### **Email (Resend of andere):**
```
RESEND_API_KEY=re_...
```

#### **Base URL:**
```
NEXT_PUBLIC_BASE_URL=https://reserve4you.com
```

---

### **Stap 4: Redeploy**

**BELANGRIJK:** Na het toevoegen van environment variables moet je de app opnieuw deployen!

**Optie A: Automatische redeploy**
- Sommige environment variables triggeren automatisch een redeploy

**Optie B: Handmatige redeploy**
1. Ga naar **"Deployments"** tab
2. Klik op de laatste deployment
3. Klik op **"Redeploy"** knop (3 dots menu → Redeploy)

**Optie C: Git push**
```bash
git commit --allow-empty -m "Trigger redeploy for env vars"
git push
```

---

## 🔍 CHECKLIST: Vercel Environment Variables

Gebruik deze checklist om te controleren of alles is ingesteld:

### **Google APIs:**
- [ ] `GOOGLE_PLACES_API_KEY` (server-side, voor import)
- [ ] `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (client-side, voor embeds)

### **Supabase:**
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`

### **Stripe:**
- [ ] `STRIPE_SECRET_KEY`
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- [ ] `STRIPE_WEBHOOK_SECRET`

### **Email:**
- [ ] `RESEND_API_KEY` (of andere email provider)

### **App Config:**
- [ ] `NEXT_PUBLIC_BASE_URL`

---

## 🐛 TROUBLESHOOTING

### **"Google Places API not configured" na setup**

**Check 1: Variable naam correct?**
- Moet exact zijn: `GOOGLE_PLACES_API_KEY` (geen spaties, hoofdlettergevoelig)

**Check 2: Redeploy gedaan?**
- Environment variables worden pas actief na redeploy

**Check 3: Environment geselecteerd?**
- Zorg dat "Production" is aangevinkt bij de variable

**Check 4: API Key restrictions**
- Ga naar Google Cloud Console
- Check of je Vercel domain is toegevoegd aan "HTTP referrers"
- Voeg toe: `*.vercel.app/*` en je custom domain

### **Lokaal werkt wel, Vercel niet**

**Dit betekent:**
- ✅ Je `.env.local` is correct (lokaal)
- ❌ Vercel environment variables missen

**Fix:**
1. Kopieer alle values uit je `.env.local`
2. Voeg ze 1-voor-1 toe aan Vercel
3. Redeploy

---

## 📋 QUICK REFERENCE: Waar vind ik mijn API Keys?

### **Google Cloud Console:**
https://console.cloud.google.com/apis/credentials

### **Supabase Dashboard:**
https://supabase.com/dashboard/project/[your-project]/settings/api

### **Stripe Dashboard:**
https://dashboard.stripe.com/apikeys

### **Resend Dashboard:**
https://resend.com/api-keys

---

## 🎯 NEXT STEPS

1. [ ] Open Vercel Dashboard → Settings → Environment Variables
2. [ ] Voeg `GOOGLE_PLACES_API_KEY` toe
3. [ ] Voeg alle andere missing variables toe
4. [ ] Klik "Save"
5. [ ] Redeploy de app
6. [ ] Test de Google Places import in onboarding

**Klaar!** De import zou nu moeten werken op Vercel.

---

## 💡 TIP: .env.local Template

Maak een `.env.example` bestand in je repo met placeholder values:

```bash
# Google APIs
GOOGLE_PLACES_API_KEY=your_google_places_api_key_here
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Stripe
STRIPE_SECRET_KEY=your_stripe_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret_here

# Email
RESEND_API_KEY=your_resend_api_key_here

# App Config
NEXT_PUBLIC_BASE_URL=http://localhost:3007
```

Dit helpt je team weten welke variables nodig zijn!

