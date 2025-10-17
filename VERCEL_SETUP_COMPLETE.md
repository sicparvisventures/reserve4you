# 🚀 Reserve4You - Vercel Deployment Setup

## ✅ **KRITIEKE STAPPEN - DOE DIT NU!**

### **STAP 1: Supabase URL Configuration**

**Ga naar:** https://supabase.com/dashboard/project/jrudqxovozqnmxypjtij/auth/url-configuration

**1. Site URL - Vervang door:**
```
https://reserve4you-git-main-dietmarkuh-6243s-projects.vercel.app
```

**2. Redirect URLs - Voeg ALLE deze toe:**
```
https://reserve4you-git-main-dietmarkuh-6243s-projects.vercel.app/auth/callback
https://reserve4you-git-main-dietmarkuh-6243s-projects.vercel.app/*
http://localhost:3007/auth/callback
http://localhost:3007/*
```

**3. Klik "Save"**

---

### **STAP 2: Supabase Google OAuth Provider**

**Ga naar:** https://supabase.com/dashboard/project/jrudqxovozqnmxypjtij/auth/providers

**1. Klik op "Google"**
**2. Enable Google provider** → Toggle ON
**3. Authorized redirect URIs (voeg toe aan Google Cloud Console):**
```
https://jrudqxovozqnmxypjtij.supabase.co/auth/v1/callback
```

**4. Client ID:** (al ingevuld)
```
827831354245-uhupctssjrjr7coi4rr66mcurldtu8fl.apps.googleusercontent.com
```

**5. Client Secret:** (vul in als je die hebt)

**6. Save**

---

### **STAP 3: Google Cloud Console**

**Ga naar:** https://console.cloud.google.com/apis/credentials

**1. Selecteer je OAuth 2.0 Client**
**2. Voeg toe aan "Authorized redirect URIs":**
```
https://jrudqxovozqnmxypjtij.supabase.co/auth/v1/callback
https://reserve4you-git-main-dietmarkuh-6243s-projects.vercel.app/auth/callback
```

**3. Save**

---

### **STAP 4: Vercel Environment Variables**

**Ga naar:** https://vercel.com/dietmarkuh-6243s-projects/reserve4you/settings/environment-variables

**Controleer dat ALLE deze variables bestaan (Production):**

```bash
NEXT_PUBLIC_SUPABASE_URL=https://jrudqxovozqnmxypjtij.supabase.co

NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpydWRxeG92b3pxbm14eXBqdGlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2NTUzMjIsImV4cCI6MjA3NjIzMTMyMn0.FfDS1LufkcAf4Ef9R3-urObmP-euwif4hVDblv76st4

SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpydWRxeG92b3pxbm14eXBqdGlqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDY1NTMyMiwiZXhwIjoyMDc2MjMxMzIyfQ.kjOKtORnFfRWlys3WyErMlq89_Cj9H_XZ44ISSWYn-c

NEXT_PUBLIC_GOOGLE_CLIENT_ID=827831354245-uhupctssjrjr7coi4rr66mcurldtu8fl.apps.googleusercontent.com

STRIPE_SECRET_KEY=sk_test_51SISvy5vlstoxNykYTm886IkyFu1Qn2tla8iotqllReSgCuE4KWummJnIqN0VAE0N0D1VAM2uno6bJ96sU73GaDp00Z9q0ZDj0

NEXT_PUBLIC_APP_URL=https://reserve4you-git-main-dietmarkuh-6243s-projects.vercel.app

NODE_ENV=production
```

**Als variabelen ontbreken:**
1. Klik "Add New"
2. Key: (naam van variable)
3. Value: (waarde)
4. Environment: **Production** ✅
5. Klik "Save"

---

## 🎯 **WAAROM DIT NODIG IS:**

1. **Site URL in Supabase:** Vertelt Supabase waar je app draait
2. **Redirect URLs:** Waar Supabase naartoe mag redirecten na login
3. **Google OAuth:** Moet weten waar callbacks naartoe gaan
4. **Environment Variables:** App moet weten hoe te connecten

---

## ✅ **NA DEZE STAPPEN:**

1. ✅ Google login werkt op Vercel
2. ✅ Email verification werkt
3. ✅ Geen localhost redirects meer
4. ✅ Alles productie-klaar!

---

## 🆘 **ALS HET NOG NIET WERKT:**

1. **Clear browser cache**
2. **Wacht 2-3 minuten** (DNS propagation)
3. **Test in incognito window**
4. **Check browser console voor errors**

---

**BUILD TIMESTAMP:** 2025-10-17 22:35:00
**DEPLOYMENT:** aa14b58 (All TypeScript errors fixed + Production ready)

