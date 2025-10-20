# 🔧 Fix: Duplicate Messages per Person

## ❌ PROBLEEM

Wanneer een persoon **meerdere reservaties** heeft bij hetzelfde restaurant, ontving deze persoon **meerdere identieke berichten**:

**Voorbeeld:**
- Jan heeft 4 reservaties bij Poule & Poulette
- Manager stuurt welkomstbericht naar "Aankomende reserveringen"
- Jan ontvangt: **4 identieke notificaties** ❌

## ✅ OPLOSSING

Nu ontvangt elke persoon **slechts 1 bericht**, ongeacht het aantal reservaties:

**Voorbeeld:**
- Jan heeft 4 reservaties bij Poule & Poulette
- Manager stuurt welkomstbericht naar "Aankomende reserveringen"
- Jan ontvangt: **1 notificatie** ✅

## 🔄 WAT IS ER VERANDERD

### Database Functie: `send_message_to_guests()`

**VOORHEEN:**
```sql
-- Loop door ALLE bookings
FOR v_booking IN
  SELECT b.id, b.consumer_id, ...
  FROM bookings b
  WHERE ...
LOOP
  -- Maak notificatie per booking
  INSERT INTO notifications (...)
END LOOP;
```
↓ **Resultaat:** 4 bookings = 4 notificaties per persoon

**NU:**
```sql
-- Loop door UNIEKE consumers (DISTINCT ON consumer_id)
FOR v_consumer IN
  SELECT DISTINCT ON (b.consumer_id)
    b.consumer_id, c.auth_user_id, ...
  FROM bookings b
  WHERE ...
LOOP
  -- Maak 1 notificatie per persoon
  INSERT INTO notifications (...)
  
  -- Track alle bookings van deze persoon
  FOR v_booking IN
    SELECT b.id FROM bookings b
    WHERE b.consumer_id = v_consumer.consumer_id
  LOOP
    INSERT INTO message_recipients (...)
  END LOOP;
END LOOP;
```
↓ **Resultaat:** 4 bookings = 1 notificatie per persoon ✅

### Database Functie: `get_targetable_guests_count()`

**VOORHEEN:**
- Telde mogelijk dubbele consumers

**NU:**
```sql
SELECT COUNT(DISTINCT b.consumer_id)  -- ✅ DISTINCT toegevoegd
FROM bookings b
WHERE ...
```
- Telt unieke personen, niet aantal bookings

## 📦 INSTALLATIE

### Optie 1: Je hebt het messaging systeem NOG NIET geïnstalleerd

Run het complete script:
```bash
# In Supabase SQL Editor
GUEST_MESSAGING_SYSTEM_COMPLETE.sql
```

### Optie 2: Je hebt het messaging systeem AL en wilt alleen de fix

Run alleen de fix:
```bash
# In Supabase SQL Editor
FIX_DUPLICATE_MESSAGES_PER_PERSON.sql
```

**Deze fix update:**
1. ✅ `send_message_to_guests()` functie
2. ✅ `get_targetable_guests_count()` functie

**Geen changes nodig aan:**
- ❌ UI code (blijft hetzelfde)
- ❌ API endpoints (blijven hetzelfde)
- ❌ Database schema (blijft hetzelfde)

## ✅ VERIFICATIE

### Test het in de UI:

1. Ga naar Location Management → Berichten tab
2. Selecteer "Aankomende reserveringen"
3. **Check het aantal gasten:**
   - VOORHEEN: Mogelijk te hoog (inclusief duplicaten)
   - NU: Correct aantal unieke personen

4. Verstuur een testbericht
5. **Check voor persoon met meerdere bookings:**
   - VOORHEEN: Meerdere notificaties in `/notifications`
   - NU: 1 enkele notificatie ✅

### Test het in de database:

```sql
-- Check voor persoon met meerdere bookings
SELECT 
  c.email,
  COUNT(DISTINCT b.id) as aantal_bookings,
  COUNT(DISTINCT n.id) as aantal_notificaties
FROM consumers c
JOIN bookings b ON b.consumer_id = c.id
LEFT JOIN notifications n ON n.user_id = c.auth_user_id
  AND n.type = 'MESSAGE_RECEIVED'
  AND n.created_at > NOW() - INTERVAL '1 hour'
WHERE b.location_id = 'your-location-id'
  AND b.status IN ('confirmed', 'pending')
GROUP BY c.id, c.email
HAVING COUNT(DISTINCT b.id) > 1;

-- Verwacht resultaat NU:
-- email              | aantal_bookings | aantal_notificaties
-- jan@example.com    | 4              | 1                     ✅
```

## 📊 IMPACT

### Voor Managers:
- ✅ Correcte telling van bereik in UI
- ✅ Geen confused gasten meer
- ✅ Beter statistieken (`sent_count` = unieke personen)

### Voor Gasten:
- ✅ 1 duidelijk bericht, geen spam
- ✅ Betere user experience
- ✅ Alle bookings nog steeds getrackt

### Voor Database:
- ✅ `notifications` tabel: 1 rij per persoon
- ✅ `message_recipients` tabel: Alle bookings tracked
- ✅ Stats kloppen met werkelijkheid

## 🔍 TECHNISCHE DETAILS

### Key Changes:

1. **DISTINCT ON (consumer_id)**
   ```sql
   SELECT DISTINCT ON (b.consumer_id) ...
   ```
   - PostgreSQL functie die eerste rij per unieke consumer_id pakt
   - Elimineert duplicaten in outer loop

2. **Nested Loop**
   ```sql
   FOR v_consumer IN ... LOOP
     -- 1 notification
     FOR v_booking IN ... LOOP
       -- Track all bookings
     END LOOP
   END LOOP
   ```
   - Outer loop: Unieke consumers
   - Inner loop: Alle bookings van die consumer

3. **No booking_id in notification**
   ```sql
   INSERT INTO notifications (
     user_id,
     location_id,  -- ✅ Wel
     booking_id,   -- ❌ Niet meer (was specifiek per booking)
     ...
   )
   ```

4. **Action URL generic**
   ```sql
   action_url := '/bookings'  -- Alle bookings van persoon
   action_label := 'Bekijk reserveringen'  -- Plural!
   ```

## 🎯 BEFORE/AFTER COMPARISON

| Scenario | Voorheen | Nu |
|----------|----------|-----|
| 1 persoon, 1 booking | 1 notificatie ✅ | 1 notificatie ✅ |
| 1 persoon, 2 bookings | 2 notificaties ❌ | 1 notificatie ✅ |
| 1 persoon, 4 bookings | 4 notificaties ❌ | 1 notificatie ✅ |
| 10 personen, 30 bookings | 30 notificaties ❌ | 10 notificaties ✅ |

### Stats Impact:

**Voorbeeld: 10 unieke gasten met 30 totale bookings**

| Metric | Voorheen | Nu |
|--------|----------|-----|
| `sent_count` | 30 | 10 ✅ |
| Notificaties gemaakt | 30 | 10 ✅ |
| Recipients tracked | 30 | 30 ✅ |
| Gasten bereikt | 10 (maar 30 berichten) | 10 (met 10 berichten) ✅ |

## ❓ FAQ

**Q: Wat gebeurt er met bestaande verzonden berichten?**
A: Die blijven zoals ze zijn. De fix geldt alleen voor NIEUWE berichten die je vanaf nu verstuurt.

**Q: Moet ik oude notificaties verwijderen?**
A: Niet nodig, maar je kunt duplicaten handmatig verwijderen als je wilt:
```sql
-- Optioneel: Verwijder oude duplicaten (voorzichtig!)
DELETE FROM notifications
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id, title, message) id
  FROM notifications
  WHERE type = 'MESSAGE_RECEIVED'
  ORDER BY user_id, title, message, created_at DESC
);
```

**Q: Telt het systeem nu nog steeds alle bookings?**
A: Ja! Alle bookings worden nog steeds getrackt in `message_recipients`. Alleen het aantal NOTIFICATIES is veranderd.

**Q: Werken de API endpoints nog steeds?**
A: Ja, volledig backward compatible. Geen changes nodig aan frontend code.

**Q: Wat als iemand 1 booking op vandaag en 1 op morgen heeft, en ik target "specifieke datum"?**
A: Die persoon ontvangt:
- Als je target "vandaag": 1 notificatie voor vandaag
- Als je target "morgen": 1 notificatie voor morgen
- Verschillende dates = verschillende berichten (correct!)

---

## 📝 FILES MODIFIED

1. ✅ `GUEST_MESSAGING_SYSTEM_COMPLETE.sql` - Updated met fix
2. ✅ `FIX_DUPLICATE_MESSAGES_PER_PERSON.sql` - Nieuwe quick fix
3. ✅ `GUEST_MESSAGING_COMPLETE_GUIDE.md` - Updated documentatie
4. ✅ `DUPLICATE_MESSAGES_FIX_README.md` - Deze file

---

**Created:** ${new Date().toLocaleDateString('nl-NL')}
**Status:** ✅ Fixed & Tested
**Impact:** High (Better UX & Correct Stats)

