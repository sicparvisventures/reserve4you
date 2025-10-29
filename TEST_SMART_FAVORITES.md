# Test Guide: Smart Availability Alerts

## Status Check ✅

- ✅ SQL script succesvol uitgevoerd (no rows returned = success)
- ✅ Database tabellen aangemaakt
- ✅ API endpoints gemaakt
- ✅ UI componenten geïmplementeerd
- ✅ TypeScript errors opgelost
- ✅ Toast notifications werkend

## Test Stappen

### 1. Start Development Server

```bash
cd /Users/dietmar/Desktop/ray2
npm run dev
```

Wacht tot je ziet:
```
✓ Ready in XXXms
○ Local:    http://localhost:3007
```

### 2. Test Favorites Page

Open in browser: `http://localhost:3007/favorites`

**Verwacht:**
- Hero sectie met "Mijn Favorieten" titel
- Als je favorieten hebt: Grid met favorite cards
- Als je geen favorieten hebt: "Nog geen favorieten" bericht

### 3. Voeg Favoriet Toe (indien nodig)

1. Ga naar `http://localhost:3007/discover`
2. Klik op het hartje ❤️ bij een restaurant
3. Hartje wordt gevuld (rood)
4. Ga terug naar `/favorites`
5. Restaurant verschijnt in lijst

### 4. Test Alert Aanmaken

Op `/favorites` pagina:

1. **Klik op "Alert instellen"** bij een favoriet
2. **Dialog opent** met formulier
3. **Configureer alert:**
   - Dag: Kies "Vrijdag" (of een andere dag)
   - Van tijd: Kies "18:00"
   - Tot tijd: Kies "20:00"
   - Aantal personen: Kies "2"
   - Cooldown: Laat op "24 uur"
4. **Klik "Alert aanmaken"**
5. **Verwacht:**
   - Dialog sluit
   - Groene toast rechtsboven: "Alert succesvol aangemaakt!"
   - Card toont nu "Alert actief" badge
   - Alert info onder in card: "Vrijdag 18:00 - 20:00"

### 5. Test Alert Beheren

1. **Klik op "Alert beheren"**
2. **Dialog opent** met huidige instellingen
3. **Test toggle:**
   - Klik op het pauze icoon 
⏸️
   - Alert wordt gedeactiveerd
   - Badge verdwijnt
4. **Klik nogmaals** om te hervatten
5. **Test bewerken:**
   - Verander dag naar "Zaterdag"
   - Klik "Bijwerken"
   - Toast: "Alert bijgewerkt"

### 6. Test Statistieken

1. **Klik op stats icoon** 📊 (naast alert beheren)
2. **Dialog opent** met statistieken:
   - Aantal reserveringen (bookings)
   - Aantal weergaven (views)
   - Laatst geboekt datum (indien beschikbaar)
3. **Dialog sluiten**

### 7. Test Dashboard Features

Check de header met 3 statistiek cards:
- **Totaal Favorieten**: Toont aantal (bijv. "5")
- **Actieve Alerts**: Toont aantal actieve alerts (bijv. "2")
- **Totaal Geboekt**: Som van alle bookings

Check de feature banner:
- Sparkles icoon ✨
- "Smart Availability Alerts" titel met [NIEUW] badge
- Beschrijving van de feature
- Info over aantal actieve alerts

### 8. Test Tabs

1. **Klik op "Met Alerts" tab**
2. **Verwacht:** Alleen favorieten met actieve alerts worden getoond
3. **Klik op "Alle Favorieten" tab**
4. **Verwacht:** Alle favorieten worden getoond

### 9. Test Alert Verwijderen

1. **Open "Alert beheren" dialog**
2. **Klik "Verwijder alert"** (rode knop links)
3. **Verwacht:**
   - Dialog sluit
   - Toast: "Alert verwijderd"
   - Badge verdwijnt van card
   - Alert info verdwijnt

### 10. Test Notificaties

1. Ga naar `http://localhost:3007/notifications`
2. **Verwacht:** 
   - Notificatie: "Alert ingesteld"
   - Bericht met details over je alert
   - Link "Bekijk alerts" naar `/favorites`

### 11. Test Responsive Design

Test op verschillende schermformaten:
- **Desktop (>1024px)**: 4 kolommen grid
- **Tablet (768-1024px)**: 3 kolommen grid
- **Mobile (<768px)**: 1 kolom

Open browser DevTools (F12) → Toggle device toolbar

## Verwachte UI Elementen

### FavoriteCard Structuur
```
┌─────────────────────────────────────┐
│ [Foto]                  [Alert ✓]   │
│                         [⭐ 4.5]    │
├─────────────────────────────────────┤
│ Restaurant Naam              ❤️      │
│ Adres, Stad                         │
│ [Cuisine Type]                      │
│                                     │
│ 📅 Vrijdag  ⏰ 18:00-20:00         │
│ 👥 2 personen      2/5 meldingen   │
│                                     │
│ 📚 3x geboekt  👁️ 15x bekeken      │
│                                     │
│ [🔔 Alert beheren] [📊] [⏸️] [❤️]  │
│ [Reserveer nu →]                    │
└─────────────────────────────────────┘
```

### Toast Notifications
Verschijnen rechtsboven met:
- ✅ Groen vinkje voor success
- ❌ Rood kruis voor errors
- Bericht + optionele beschrijving
- X knop om te sluiten
- Verdwijnen automatisch na 4 seconden

## Troubleshooting

### UI Laadt niet / Errors in Console

**Check 1: Server running?**
```bash
# In terminal waar je npm run dev draait
# Zie je: ✓ Ready in XXXms?
```

**Check 2: Database verbinding?**
- Open browser DevTools → Console tab
- Zie je errors over "Failed to fetch"?
- Check `.env.local` voor NEXT_PUBLIC_SUPABASE_URL en NEXT_PUBLIC_SUPABASE_ANON_KEY

**Check 3: Authentication?**
- Ben je ingelogd?
- Ga naar `/login` en log in
- Test opnieuw

### Alerts Verschijnen Niet

**Check 1: SQL script uitgevoerd?**
```sql
-- Voer uit in Supabase SQL Editor
SELECT COUNT(*) FROM favorite_availability_alerts;
-- Zou een nummer moeten geven, geen error
```

**Check 2: Consumer record bestaat?**
```sql
-- Voer uit in Supabase SQL Editor  
SELECT * FROM consumers 
WHERE auth_user_id = auth.uid();
-- Zou je consumer record moeten tonen
```

**Check 3: Favorieten bestaan?**
```sql
-- Voer uit in Supabase SQL Editor
SELECT f.*, l.name 
FROM favorites f
JOIN locations l ON f.location_id = l.id
JOIN consumers c ON f.consumer_id = c.id
WHERE c.auth_user_id = auth.uid();
-- Toont je favorieten
```

### TypeScript Errors

```bash
# Terminal
cd /Users/dietmar/Desktop/ray2
npm run build
```

Als er errors zijn, zijn deze al opgelost in de code.

### Toast Notifications Werken Niet

- Check of `ToastProvider` in de page.tsx staat (al geïmplementeerd)
- Open browser console → kijk naar errors
- Refresh de pagina (Cmd+R / Ctrl+R)

## API Test met cURL

Test de API endpoints direct:

### Get Alerts
```bash
# Eerst: Get auth token from browser DevTools → Application → Cookies
# Zoek naar 'sb-access-token'

curl -X GET http://localhost:3007/api/favorites/alerts \
  -H "Cookie: sb-access-token=YOUR_TOKEN_HERE"
```

### Create Alert
```bash
curl -X POST http://localhost:3007/api/favorites/alerts \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=YOUR_TOKEN_HERE" \
  -d '{
    "locationId": "LOCATION_UUID_HERE",
    "preferredDayOfWeek": 5,
    "preferredTimeStart": "18:00",
    "preferredTimeEnd": "20:00",
    "preferredPartySize": 2,
    "maxNotifications": 5,
    "cooldownHours": 24
  }'
```

## Succescriteria

✅ **Feature is werkend als:**

1. Je kunt favorieten zien op `/favorites`
2. "Alert instellen" button is zichtbaar
3. Alert dialog opent en je kunt instellingen configureren
4. Alert wordt aangemaakt en toast verschijnt
5. "Alert actief" badge verschijnt op card
6. Alert info wordt getoond onder in card
7. Stats dialog toont correcte data
8. Alert kan worden ge-toggled (aan/uit)
9. Alert kan worden bewerkt
10. Alert kan worden verwijderd
11. Tabs werken (Alle / Met Alerts)
12. Dashboard stats kloppen
13. Feature banner is zichtbaar
14. Responsive design werkt
15. Notificatie verschijnt in `/notifications`

## Next Steps

Na succesvolle test:

1. **Voeg favorieten toe** voor verschillende restaurants
2. **Stel meerdere alerts in** om de UI volledig te testen
3. **Test op mobiel** via browser DevTools device emulator
4. **Test edge cases:**
   - Alert aanmaken zonder favorieten
   - Meerdere alerts voor zelfde restaurant
   - Max notifications bereiken
5. **Test performance:**
   - Snelheid van API calls
   - UI responsiveness

## Support

Bij vragen of problemen:
- Check console voor errors (F12 → Console)
- Check network tab voor API calls (F12 → Network)
- Lees volledige documentatie: `SMART_FAVORITES_IMPLEMENTATION.md`

---

**Succes met testen! 🚀**

