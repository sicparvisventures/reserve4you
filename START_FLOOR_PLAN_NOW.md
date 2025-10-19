# 🚀 START FLOOR PLAN NOW! (5 minuten)

## ⚡ Quick Setup

### 1️⃣ Install Dependency
```bash
pnpm install @radix-ui/react-switch
```

### 2️⃣ Run SQL Migration
1. Open **Supabase SQL Editor**
2. Kopieer **ALLE regels** van:
   ```
   supabase/migrations/20250119000010_floor_plan_and_auto_accept.sql
   ```
3. Plak in editor
4. Klik **RUN**
5. Wacht op groene success messages ✅

### 3️⃣ Restart Server
```bash
# Kill server (Ctrl+C)
pnpm dev
```

### 4️⃣ Test!
```
http://localhost:3007/manager/b0402eea-4296-4951-aff6-8f4c2c219818/location/2ca30ee4-140a-4a09-96ae-1455406e0a02
```

---

## 🎨 Wat Je Nu Hebt

### ✅ Visual Floor Plan Editor
- Drag-and-drop tafels op canvas
- Zoom & grid snapping
- 3 tafelvormen (circle, square, rectangle)
- Real-time database sync

### ✅ Auto-Accept Reserveringen
- Toggle in Settings tab
- Auto = direct confirmed
- Manual = pending → handmatig accepteren

### ✅ Professional Tabs UI
- **Plattegrond** - Visual editor zoals Lightspeed
- **Reserveringen** - Lijst met filters (Alle/Pending/Bevestigd)
- **Instellingen** - Auto-accept toggle

---

## 🎯 Probeer Dit!

### Test 1: Floor Plan
1. Ga naar Plattegrond tab
2. Klik "Tafel Toevoegen"
3. Vul in: T5, 4 personen, square
4. Sleep tafel naar andere positie
5. Zie positie auto-save!

### Test 2: Auto-Accept AAN
1. Ga naar Instellingen tab
2. Zet "Automatisch Accepteren" AAN
3. Open website in incognito
4. Maak een reservering
5. Zie in dashboard: direct "confirmed"!

### Test 3: Auto-Accept UIT
1. Zet toggle UIT
2. Maak nieuwe reservering  
3. Ga naar Reserveringen tab
4. Zie onder "Pending"
5. Klik "Accepteren"
6. Status wordt "confirmed"!

---

## 📊 Database Check

```sql
-- Check floor plan columns
SELECT table_number, position_x, position_y, shape 
FROM public.tables 
LIMIT 5;

-- Check auto-accept setting
SELECT name, auto_accept_bookings 
FROM public.locations;

-- Check booking statuses
SELECT customer_name, status, booking_date 
FROM public.bookings 
ORDER BY created_at DESC 
LIMIT 10;
```

---

## 🐛 Problemen?

### Geen tafels zichtbaar
- Refresh page (hard refresh: Cmd+Shift+R)
- Check console voor errors

### Toggle werkt niet
- Check migration is successful
- Verify `auto_accept_bookings` column exists

### Drag werkt niet
- Check RPC functie `update_table_positions` exists
- Verify ownership (je moet owner zijn)

---

## 📚 Volledige Docs

Lees `FLOOR_PLAN_COMPLETE_SETUP.md` voor:
- Detailed feature lijst
- Database schema
- Security policies
- Troubleshooting
- Code examples

---

## ✅ Success Criteria

Je bent klaar als:
- [ ] Tafels verschijnen op canvas
- [ ] Kan tafels slepen naar nieuwe positie
- [ ] Positie blijft na refresh
- [ ] Auto-accept toggle werkt
- [ ] Reserveringen krijgen correcte status
- [ ] Filters werken in Reserveringen tab

---

## 🎉 DONE!

**Je hebt nu een production-ready floor plan zoals Lightspeed!**

Vragen? Check de complete guide of vraag me! 🚀

