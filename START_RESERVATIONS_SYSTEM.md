# 🚀 Quick Start - Reserveringssysteem

## TL;DR

1. **Run SQL script** in Supabase (5 min)
2. **Herstart dev server** (1 min)
3. **Test reserveren** (2 min)
4. **Klaar!** ✅

---

## Stap 1: Database Setup

### Open Supabase Dashboard

```
1. Ga naar https://supabase.com/dashboard
2. Selecteer je project
3. Klik "SQL Editor" in sidebar
4. Klik "+ New query"
```

### Run SQL Script

```
1. Open bestand: SETUP_RESERVATIONS_COMPLETE.sql
2. Kopieer HELE inhoud (368 regels)
3. Plak in Supabase SQL Editor
4. Klik "Run" (of Cmd/Ctrl + Enter)
5. Wacht ~5 seconden
```

### Verwachte Output

```
NOTICE:  ✅ Tables table created
NOTICE:  ✅ Bookings table created
NOTICE:  ✅ Triggers created
NOTICE:  ✅ Availability functions created
NOTICE:  ✅ RLS policies for tables created
NOTICE:  ✅ RLS policies for bookings created
NOTICE:  ✅ Helper functions created
NOTICE:  ✅ Sample tables added to location [uuid]
NOTICE:  
NOTICE:  ================================================
NOTICE:  ✅ RESERVATIONS SYSTEM SETUP COMPLETE
NOTICE:  ================================================
```

**+ Query result:** Tabel met "Tables per location"

✅ **Success!** Database is klaar

---

## Stap 2: Dev Server Herstarten

```bash
# Stop dev server (Ctrl+C)

# Herstart
pnpm dev

# Of npm
npm run dev
```

✅ **Server running** op http://localhost:3007

---

## Stap 3: Test Reserveren

### Als Klant

```
1. Ga naar http://localhost:3007
2. Scroll naar "Vanavond beschikbaar"
3. Klik "Reserveren" op een restaurant card
4. Vul in:
   - Datum: morgen
   - Tijd: 19:00
   - Personen: 4
   - Naam: Test Gebruiker
   - Email: test@example.com
   - Telefoon: +32 123 456 789
5. Klik "Reserveren"
6. Zie success scherm! ✅
```

### Als Manager

**Dashboard - Alle Vestigingen:**
```
1. Ga naar http://localhost:3007/manager/[tenantId]/dashboard
2. Klik "Alle Vestigingen" (eerste knop in grid)
3. Zie alle reserveringen van alle locaties
4. Stats tonen totalen
```

**Locatie Beheer:**
```
1. In dashboard, klik op een specifieke vestiging
2. Klik op de vestiging naam/link
3. Je komt op locatie management pagina
4. Zie:
   - Stats (bookings, gasten, tafels, stoelen)
   - Tafels sectie
   - Reserveringen sectie
```

**Tafel Toevoegen:**
```
1. Klik "Tafel Toevoegen"
2. Vul in:
   - Tafelnummer: T1
   - Stoelen: 4
   - Beschrijving: Bij het raam (optioneel)
3. Klik "Tafel Toevoegen"
4. Zie nieuwe tafel in lijst ✅
```

**Reservering Bevestigen:**
```
1. Zie je test reservering in lijst
2. Status: "pending" (geel)
3. Klik "Bevestigen"
4. Status wordt "confirmed" (groen) ✅
```

---

## ✅ Checklist

Werk deze af om te verifiëren dat alles werkt:

### Database
- [ ] SQL script succesvol uitgevoerd
- [ ] "✅ COMPLETE" bericht gezien
- [ ] Sample tables aangemaakt

### Klant Flow
- [ ] Reserveer knop zichtbaar
- [ ] Modal opent
- [ ] Formulier werkt
- [ ] Success scherm verschijnt
- [ ] Reservering in database

### Manager Flow
- [ ] Dashboard "Alle Vestigingen" werkt
- [ ] Specifieke vestiging filter werkt
- [ ] Locatie pagina toegankelijk
- [ ] Tafel toevoegen werkt
- [ ] Reserveringen zichtbaar
- [ ] Status update werkt

---

## 🎯 URLs

**Voor Klanten:**
```
Homepage: http://localhost:3007
Discover: http://localhost:3007/discover
```

**Voor Managers:**
```
Dashboard: http://localhost:3007/manager/[tenantId]/dashboard
Locatie:   http://localhost:3007/manager/[tenantId]/location/[locationId]
```

Vervang `[tenantId]` en `[locationId]` met echte IDs.

---

## 🐛 Problemen?

### SQL script geeft error

**Error: "syntax error at or near"**
→ Verkeerd script gebruikt. Gebruik `SETUP_RESERVATIONS_COMPLETE.sql`

**Error: "relation already exists"**
→ Script al eerder gerund. Dit is OK, tables bestaan al.

**Error: "permission denied"**
→ Check of je de juiste Supabase project hebt geselecteerd

### Reserveer knop doet niks

**Check:**
1. Herstart dev server na SQL script
2. Hard refresh browser (Cmd/Ctrl + Shift + R)
3. Check browser console voor errors

### Geen tafels in locatie

**Fix:**
1. Ga naar locatie management pagina
2. Klik "Tafel Toevoegen"
3. Voeg minimaal 1 tafel toe

### Reservering niet zichtbaar in dashboard

**Check:**
1. Selecteer "Alle Vestigingen" in dashboard
2. Refresh pagina
3. Check of reservering datum in toekomst is (niet verleden)

---

## 📚 Meer Info

**Complete Guide:** `RESERVATIONS_SYSTEM_COMPLETE.md`
- Database schema details
- Alle functies uitgelegd
- Code examples
- Troubleshooting
- Future enhancements

**SQL Script:** `SETUP_RESERVATIONS_COMPLETE.sql`
- Creates tables
- Sets up RLS
- Adds functions
- Includes sample data

---

## 🎉 Success!

Als alles werkt heb je nu:

✅ **Klanten** kunnen reserveren via je website  
✅ **Managers** kunnen tafels beheren  
✅ **Dashboard** toont alle reserveringen  
✅ **Per locatie** gedetailleerd overzicht  
✅ **Status management** voor bookings  
✅ **Auto table assignment** werkt  
✅ **Security** via RLS policies  

**Ready for production!** 🚀

Deploy naar Vercel/Netlify en je bent live!

---

**Questions?**  
Check `RESERVATIONS_SYSTEM_COMPLETE.md` voor details.

**Bug gevonden?**  
Check browser console en Supabase logs.

**Works?**  
Time to add more features! 🎨

