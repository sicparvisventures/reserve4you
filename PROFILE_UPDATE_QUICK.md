# PROFILE UPDATE - QUICK FIX

## PROBLEEM:
"Wijzigingen opslaan" button deed niets in `/profile`

## OPLOSSING:
✅ SQL functie voor database updates
✅ API endpoint voor profile updates  
✅ Frontend onClick handler + state management

---

## SETUP IN 2 STAPPEN:

### STAP 1: Run SQL Migration

Open **Supabase SQL Editor** en run:

```sql
-- File: /supabase/migrations/20241017000012_consumer_profile_update.sql
```

### STAP 2: Test Profile

```
http://localhost:3007/profile
```

1. Klik tab "Mijn gegevens"
2. Vul naam in
3. Vul telefoonnummer in
4. Klik "Wijzigingen opslaan"
5. Zie success message
6. Data is opgeslagen! ✅

---

## WAT ER NU WERKT:

✅ **Controlled Inputs**
- Naam en telefoon inputs werken real-time
- Wijzigingen worden direct bijgehouden

✅ **Save Functionaliteit**
- Button heeft onClick handler
- API call naar `/api/profile/update`
- Database update via SQL functie

✅ **Feedback**
- Loading state: "Opslaan..."
- Success message: "Wijzigingen succesvol opgeslagen!"
- Error messages bij problemen

✅ **Security**
- Alleen eigen profiel updaten
- Authorization checks
- Input validatie

✅ **Database**
- Updates `consumers` table
- Auto-create consumer record als niet bestaat
- Email uit `auth.users`

---

## VALIDATIE:

**Naam:** 2-100 karakters
**Telefoon:** Minimaal 10 karakters
**Email:** Kan niet gewijzigd (disabled)

---

## CHECK DATABASE:

```sql
-- Zie je opgeslagen data:
SELECT * FROM consumers 
WHERE auth_user_id = auth.uid();
```

---

## READY!

Profile update werkt nu volledig!

**Zie `PROFILE_UPDATE_GUIDE.md` voor complete documentatie.**

