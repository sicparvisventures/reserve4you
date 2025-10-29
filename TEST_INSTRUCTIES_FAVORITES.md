# Test Instructies: Smart Favorites

## ⚠️ BELANGRIJK: Je Moet Eerst Inloggen!

De `/favorites` pagina vereist dat je ingelogd bent. Als je niet ingelogd bent, word je automatisch doorgestuurd naar `/sign-in`.

## Snelle Test Stappen

### Stap 1: Login

```
1. Open: http://localhost:3007/sign-in
2. Log in met je account
3. Of maak een nieuw account aan via /sign-up
```

### Stap 2: Voeg Favoriet Toe

```
1. Ga naar: http://localhost:3007/discover
2. Zoek een restaurant
3. Klik op het hartje ❤️ bij een restaurant
4. Hartje wordt gevuld (rood/primary color)
```

### Stap 3: Ga Naar Favorites

```
1. Ga naar: http://localhost:3007/favorites
2. Je ziet nu de nieuwe Smart Availability Alerts UI!
```

### Stap 4: Test de Alert Feature

```
1. Klik op "Alert instellen" bij een favoriet
2. Dialog opent
3. Configureer:
   - Dag: Vrijdag
   - Van: 18:00
   - Tot: 20:00
   - Personen: 2
4. Klik "Alert aanmaken"
5. Groene toast verschijnt: "Alert succesvol aangemaakt!"
6. "Alert actief" badge verschijnt op card
7. Alert info wordt getoond
```

## Als Je Geen Account Hebt

### Optie A: Maak Account

```
1. Ga naar: http://localhost:3007/sign-up
2. Vul email + wachtwoord in
3. Klik "Sign Up"
4. Bevestig email (check inbox)
5. Log in
```

### Optie B: Gebruik Test Account (indien beschikbaar)

```
Email: test@reserve4you.com
Password: testpassword123
```

## Wat Je Zult Zien

### Dashboard Header (3 Stats Cards)
```
┌─────────────┬──────────────┬─────────────┐
│ Favorieten  │ Alerts       │ Geboekt     │
│ 💖 5        │ 🔔 2         │ 📚 12       │
└─────────────┴──────────────┴─────────────┘
```

### Feature Banner
```
✨ Smart Availability Alerts [NIEUW]

Mis nooit meer een kans! Stel alerts in voor je
favoriete restaurants en krijg automatisch een
melding wanneer ze beschikbaar zijn.

ℹ️ Je hebt 2 actieve alerts
```

### Favorite Cards
```
┌───────────────────────────────┐
│ [Foto]          [Alert ✓]     │
│                 [⭐ 4.5]      │
├───────────────────────────────┤
│ Restaurant Name          ❤️    │
│ Adres, Stad                   │
│                               │
│ 📅 Vrijdag  ⏰ 18:00-20:00   │
│ 👥 2 personen   0/5 meldingen│
│                               │
│ [🔔 Alert beheren] [📊] [⏸️] │
│ [Reserveer nu →]              │
└───────────────────────────────┘
```

### Tabs
```
[Alle Favorieten]  [Met Alerts]
     (actief)
```

## Troubleshooting

### "Redirecting to /sign-in"
✅ Normaal! Je moet eerst inloggen.
→ Ga naar /sign-in en log in

### "Nog geen favorieten"
✅ Ook normaal als je net bent ingelogd!
→ Ga naar /discover en voeg favorieten toe

### Errors in Console
→ Open browser DevTools (F12)
→ Ga naar Console tab
→ Kopieer errors en check ze

### SQL Script Niet Uitgevoerd?
```sql
-- Test in Supabase SQL Editor:
SELECT COUNT(*) FROM favorite_availability_alerts;

-- Als je een error krijgt:
-- 1. Ga naar Supabase Dashboard
-- 2. SQL Editor
-- 3. Run SMART_AVAILABILITY_ALERTS_SETUP.sql opnieuw
```

## Complete Flow Test

1. ✅ **Login**: `/sign-in`
2. ✅ **Voeg Favoriet Toe**: `/discover` → Klik hartje
3. ✅ **Ga Naar Favorites**: `/favorites`
4. ✅ **Zie Stats Dashboard**: 3 cards bovenaan
5. ✅ **Zie Feature Banner**: "Smart Availability Alerts"
6. ✅ **Zie Favorite Card**: Met "Alert instellen" button
7. ✅ **Open Alert Dialog**: Klik "Alert instellen"
8. ✅ **Configureer Alert**: Dag, tijd, personen
9. ✅ **Maak Alert**: Klik "Alert aanmaken"
10. ✅ **Zie Toast**: "Alert succesvol aangemaakt!"
11. ✅ **Zie Badge**: "Alert actief" op card
12. ✅ **Zie Info**: Alert details onder in card
13. ✅ **Test Stats**: Klik stats icoon 📊
14. ✅ **Test Toggle**: Klik pauze icoon ⏸️
15. ✅ **Test Tabs**: Klik "Met Alerts" tab
16. ✅ **Check Notifications**: `/notifications`

## Expected Results

Alle stappen hierboven zouden moeten werken zonder errors.

Als iets niet werkt:
1. Check browser console voor errors
2. Check of SQL script is uitgevoerd
3. Check of je ingelogd bent
4. Hard refresh (Cmd+Shift+R / Ctrl+Shift+R)

## Screenshots van Wat Je Zou Moeten Zien

### 1. Login Page (/sign-in)
- Email input
- Password input
- "Sign In" button
- Link naar "Sign Up"

### 2. Discover Page (/discover)
- Grid met restaurant cards
- Hartje rechtsboven in elke card
- Search/filter opties

### 3. Favorites Page (/favorites) - HOOFD FEATURE
- Hero sectie met titel
- Stats dashboard (3 cards)
- Feature banner met "Smart Availability Alerts"
- Grid met favorite cards
- Elke card heeft "Alert instellen" button
- Tabs: "Alle Favorieten" en "Met Alerts"

### 4. Alert Dialog
- Dag selector (dropdown)
- Tijd inputs (van/tot)
- Personen selector
- Cooldown selector
- "Alert aanmaken" button (primary color)
- "Annuleer" button

### 5. Notifications Page (/notifications)
- "Alert ingesteld" notificatie
- Details over je alert
- Link "Bekijk alerts"

---

**Status**: Production Ready ✅  
**Datum**: 29 Oktober 2025

**Nu testen:**
1. Login eerst: http://localhost:3007/sign-in
2. Dan naar: http://localhost:3007/favorites

**Veel succes! 🚀**

