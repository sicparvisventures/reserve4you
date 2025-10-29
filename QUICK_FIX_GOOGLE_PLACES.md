# 🚀 QUICK FIX: Google Places API op Vercel

**Probleem:** "Google Places API not configured" op Vercel  
**Tijd:** 5 minuten  
**Datum:** 29 oktober 2025

---

## ⚡ SNELLE OPLOSSING (3 stappen)

### **Stap 1: Open Vercel Dashboard** ⏱️ 1 min

```
1. Ga naar: https://vercel.com/dashboard
2. Selecteer je project
3. Klik op "Settings" tab
4. Klik op "Environment Variables"
```

### **Stap 2: Voeg API Key toe** ⏱️ 2 min

```
Name:        GOOGLE_PLACES_API_KEY
Value:       [Plak je Google API key hier]
Environment: ✅ Production  ✅ Preview  ✅ Development
```

**Klik op "Save"**

### **Stap 3: Redeploy** ⏱️ 2 min

```
1. Ga naar "Deployments" tab
2. Klik op laatste deployment
3. Klik "..." menu → "Redeploy"
```

**Klaar!** Test nu de import functie in onboarding.

---

## 📍 Waar vind ik mijn Google API Key?

### **Optie A: Al een key?**
```
1. Ga naar: https://console.cloud.google.com/apis/credentials
2. Kopieer je bestaande "API key"
3. Gebruik deze in Vercel (zie Stap 2 hierboven)
```

### **Optie B: Nieuwe key maken?**
```
1. Ga naar: https://console.cloud.google.com/
2. Selecteer je project (of maak nieuwe)
3. Enable API: https://console.cloud.google.com/apis/library/places-backend.googleapis.com
4. Ga naar: https://console.cloud.google.com/apis/credentials
5. Klik "Create Credentials" → "API Key"
6. Kopieer de key
7. Gebruik in Vercel (zie Stap 2 hierboven)
```

---

## ✅ Verificatie

Test of het werkt:

### **1. Check Environment Variables**
```
https://je-app.vercel.app/api/debug/env-check
```

Zou moeten tonen:
```json
{
  "GOOGLE_PLACES_API_KEY": true,
  "status": "OK"
}
```

### **2. Test Import in Onboarding**
```
1. Ga naar: https://je-app.vercel.app/manager/onboarding
2. Klik "Importeer van Google"
3. Zoek je bedrijf
4. Zou moeten werken!
```

---

## 🐛 Nog steeds niet werkend?

### **Check 1: API Key restrictions**

Ga naar: https://console.cloud.google.com/apis/credentials

Klik op je API key → Edit:

**API restrictions:**
- ✅ Places API moet aangevinkt zijn

**Application restrictions:**
- Selecteer "HTTP referrers"
- Voeg toe:
  ```
  *.vercel.app/*
  je-custom-domain.com/*
  *.je-custom-domain.com/*
  ```

### **Check 2: Billing enabled?**

Google Places API vereist billing (maar heeft $200 free tier):

```
1. Ga naar: https://console.cloud.google.com/billing
2. Zorg dat billing is enabled voor je project
```

### **Check 3: Variable naam correct?**

Moet EXACT zijn (hoofdlettergevoelig):
```
GOOGLE_PLACES_API_KEY
```

**Niet:**
- ❌ `Google_Places_API_Key`
- ❌ `GOOGLE_PLACES_API_KEY ` (spatie aan einde)
- ❌ `NEXT_PUBLIC_GOOGLE_PLACES_API_KEY`

---

## 📚 Meer Info

- **Volledige setup:** Zie `VERCEL_ENV_SETUP.md`
- **Google Places docs:** Zie `GOOGLE_PLACES_SETUP.md`
- **Environment check:** https://je-app.vercel.app/api/debug/env-check

---

## 💡 Pro Tip: Lokaal testen

Voeg ook toe aan je `.env.local`:

```bash
GOOGLE_PLACES_API_KEY=je_api_key_hier
```

**Restart dev server:**
```bash
pnpm run dev
```

Test op: http://localhost:3007/manager/onboarding

---

## ✨ Samenvatting

**Lokaal werkt, Vercel niet?**
→ Voeg `GOOGLE_PLACES_API_KEY` toe aan Vercel Environment Variables

**Beide werken niet?**
→ Check of Places API is enabled in Google Cloud Console

**Nog steeds issues?**
→ Check API key restrictions en billing

**Alles werkt!**
→ Geniet van 1-click business import! 🎉

