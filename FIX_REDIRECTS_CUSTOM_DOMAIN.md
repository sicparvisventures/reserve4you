# 🔧 FIX REDIRECTS NAAR CUSTOM DOMAIN

## ❌ PROBLEEM

Website werkt op www.reserve4you.com, maar bij login/acties springt het naar:
```
https://reserve4you-git-main-dietmarkuh-6243s-projects.vercel.app
```

**Oorzaak:** Environment variables wijzen nog naar oude Vercel URL

---

## ✅ OPLOSSING IN 3 STAPPEN

### STAP 1: UPDATE VERCEL ENVIRONMENT VARIABLES (5 minuten)

**Ga naar:**
```
https://vercel.com/sicparvisventures/reserve4you/settings/environment-variables
```

**Zoek deze variable:**
```
NEXT_PUBLIC_APP_URL
```

**Update de waarde:**

**VAN:**
```
https://reserve4you-git-main-dietmarkuh-6243s-projects.vercel.app
```

**NAAR:**
```
https://reserve4you.com
```

**Hoe:**
1. Klik op de **drie puntjes** `⋮` rechts bij `NEXT_PUBLIC_APP_URL`
2. Klik **"Edit"**
3. Wijzig de waarde naar: `https://reserve4you.com`
4. Zorg dat **"Production"** ✅ aangevinkt is
5. Klik **"Save"**

---

### STAP 2: UPDATE SUPABASE REDIRECT URLS (5 minuten)

**Ga naar:**
```
https://supabase.com/dashboard/project/jrudqxovozqnmxypjtij/auth/url-configuration
```

**1. Site URL - Update naar:**
```
https://reserve4you.com
```

**2. Redirect URLs - Voeg TOE (behoud de rest):**
```
https://reserve4you.com/*
https://reserve4you.com/auth/callback
https://www.reserve4you.com/*
https://www.reserve4you.com/auth/callback
```

**Huidige URLs (BEHOUDEN):**
```
https://reserve4you-git-main-dietmarkuh-6243s-projects.vercel.app/*
https://reserve4you-git-main-dietmarkuh-6243s-projects.vercel.app/auth/callback
http://localhost:3007/*
http://localhost:3007/auth/callback
```

> **Let op:** Behoud de Vercel URL voor nu, zodat deployments blijven werken

**3. Klik "Save"**

---

### STAP 3: UPDATE GOOGLE OAUTH (5 minuten)

**Ga naar:**
```
https://console.cloud.google.com/apis/credentials
```

**1. Selecteer je OAuth 2.0 Client ID**
   - Zoek: `827831354245-uhupctssjrjr7coi4rr66mcurldtu8fl.apps.googleusercontent.com`

**2. Authorized redirect URIs - Voeg TOE:**
```
https://reserve4you.com/auth/callback
https://www.reserve4you.com/auth/callback
```

**Huidige URLs (BEHOUDEN):**
```
https://jrudqxovozqnmxypjtij.supabase.co/auth/v1/callback
https://reserve4you-git-main-dietmarkuh-6243s-projects.vercel.app/auth/callback
```

**3. Klik "Save"**

---

### STAP 4: REDEPLOY DE APP (2 minuten)

**Na het updaten van environment variables:**

**Ga naar:**
```
https://vercel.com/sicparvisventures/reserve4you/deployments
```

**Trigger een redeploy:**

**Optie A: Via Vercel dashboard**
1. Klik op de **drie puntjes** `⋮` bij laatste deployment
2. Klik **"Redeploy"**
3. Selecteer: **"Use existing Build Cache"** ✅
4. Klik **"Redeploy"**

**Optie B: Push een commit (als je code wijzigingen hebt)**
```bash
cd /Users/dietmar/Desktop/ray2

# Maak een dummy commit (forceert redeploy)
git commit --allow-empty -m "Redeploy with updated env vars"
git push origin main
```

**Wacht 2-3 minuten voor deployment**

---

## 🧪 TEST NA REDEPLOY

### Test 1: Custom domain werkt
```
https://reserve4you.com → Je homepage ✅
```

### Test 2: Login blijft op custom domain
1. Ga naar: https://reserve4you.com
2. Klik "Login" of "Sign up"
3. Login met Google of Email
4. **Check URL na login:** Moet `reserve4you.com` blijven! ✅

### Test 3: Alle navigatie blijft op custom domain
1. Klik door je app
2. Maak een booking
3. Ga naar dashboard
4. **Check URL:** Moet altijd `reserve4you.com` zijn! ✅

---

## 📋 VOLLEDIGE ENVIRONMENT VARIABLES CHECKLIST

### Verifieer dat je hebt (Production):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://jrudqxovozqnmxypjtij.supabase.co

NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

NEXT_PUBLIC_GOOGLE_CLIENT_ID=827831354245-uhupctssjrjr7coi4rr66mcurldtu8fl.apps.googleusercontent.com

STRIPE_SECRET_KEY=sk_test_51SISvy5vlstoxNyk...

NEXT_PUBLIC_APP_URL=https://reserve4you.com  ← DIT MOET CUSTOM DOMAIN ZIJN!

NODE_ENV=production
```

---

## 🔍 WAAR DE REDIRECTS VANDAAN KOMEN

### Next.js gebruikt deze variable voor:

1. **Authentication redirects** (na login)
2. **API callbacks** (OAuth, webhooks)
3. **Email links** (verification, password reset)
4. **Absolute URLs** (in emails, metadata)

Als `NEXT_PUBLIC_APP_URL` naar Vercel URL wijst → alle redirects gaan naar Vercel URL

Als `NEXT_PUBLIC_APP_URL` naar custom domain wijst → alle redirects gaan naar custom domain ✅

---

## 🆘 TROUBLESHOOTING

### Probleem: Na redeploy nog steeds Vercel URL

**Oorzaak:** Browser cache of oude session

**Oplossing:**
1. **Logout** uit de app
2. **Clear browser cache:**
   - Safari: Option + Command + E
   - Chrome: Cmd + Shift + Delete
3. **Close alle tabs** van je app
4. **Open incognito/private window**
5. Ga naar: https://reserve4you.com
6. Login opnieuw
7. Zou nu op custom domain moeten blijven ✅

### Probleem: Supabase auth errors

**Oorzaak:** Redirect URLs niet toegevoegd aan Supabase

**Oplossing:**
1. Check Supabase Auth URL Configuration
2. Verifieer dat `https://reserve4you.com/*` in de lijst staat
3. Verifieer dat `https://reserve4you.com/auth/callback` in de lijst staat
4. Save en wacht 2-3 minuten

### Probleem: Google OAuth werkt niet

**Oorzaak:** Redirect URI niet toegevoegd aan Google Console

**Oplossing:**
1. Google Cloud Console → Credentials
2. Selecteer OAuth 2.0 Client
3. Voeg toe: `https://reserve4you.com/auth/callback`
4. Save en wacht 5 minuten
5. Test opnieuw

---

## 💡 BEST PRACTICES

### Voor Development/Staging:

Als je verschillende environments hebt, gebruik dan per environment de juiste URL:

**Production:**
```
NEXT_PUBLIC_APP_URL=https://reserve4you.com
```

**Preview/Staging:**
```
NEXT_PUBLIC_APP_URL=https://staging.reserve4you.com
```

**Development:**
```
NEXT_PUBLIC_APP_URL=http://localhost:3007
```

---

## 🎯 VERWACHTE RESULTAAT

Na alle stappen:

✅ **Homepage:** `https://reserve4you.com`
✅ **Na login:** `https://reserve4you.com/...` (blijft op custom domain)
✅ **Bookings:** `https://reserve4you.com/booking/...`
✅ **Dashboard:** `https://reserve4you.com/manager/...`
✅ **API calls:** Werken correct
✅ **OAuth:** Google login werkt en blijft op custom domain

**URL bar toont ALTIJD:** `reserve4you.com` ✅

---

## 📞 EXTRA: VERWIJDER OUDE VERCEL URLS (OPTIONEEL)

Na een paar weken, als alles werkt, kun je de oude Vercel URLs verwijderen uit:

1. **Supabase redirect URLs** (behoud alleen custom domain URLs)
2. **Google OAuth URIs** (behoud alleen custom domain URIs)

Maar **voor nu: laat ze staan** zodat preview deployments blijven werken!

---

## 🎉 SUCCESS CHECKLIST

Vink af wat je hebt gedaan:

- [ ] Vercel: `NEXT_PUBLIC_APP_URL` → `https://reserve4you.com`
- [ ] Vercel: Redeploy getriggerd
- [ ] Supabase: Site URL → `https://reserve4you.com`
- [ ] Supabase: Redirect URLs toegevoegd voor custom domain
- [ ] Google OAuth: Redirect URIs toegevoegd voor custom domain
- [ ] Test: Login blijft op custom domain
- [ ] Test: Navigatie blijft op custom domain
- [ ] Test: Bookings werken
- [ ] Browser cache gecleared

Als alle checkboxes ✅ zijn: **Je custom domain is volledig werkend!** 🚀

---

**VOLGENDE STAP:** Start met STAP 1 - Update environment variable!

