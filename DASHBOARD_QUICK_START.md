# PROFESSIONAL DASHBOARD - QUICK START

## IN 3 STAPPEN KLAAR:

### STAP 1: RUN SQL MIGRATION

Open **Supabase SQL Editor** en kopieer + run:

```sql
-- File: /supabase/migrations/20241017000011_booking_management_functions.sql
```

✅ Dit creëert 7 SQL functies voor booking management

### STAP 2: TEST DASHBOARD

```
http://localhost:3007/manager/[your-tenant-id]/dashboard
```

✅ Professional interface met TableFever features
✅ R4Y branding en kleuren
✅ Geen emoji's, clean design

### STAP 3: TEST FEATURES

**Uitloggen:**
- Klik "Uitloggen" button (rechts boven)
- Redirect naar homepage
- Session cleared

**Booking Actions:**
- PENDING booking → Klik "Bevestigen" of "Annuleren"
- CONFIRMED booking → Klik "No-show"
- Status update real-time

**Filters:**
- Klik status filters (All/Pending/Confirmed/etc.)
- Type in search box
- Switch view modes

**Locaties:**
- Klik location cards om te switchen
- Stats update per locatie
- Add/delete locations

---

## KEY FEATURES:

✅ **Sticky Navigation**
- Brand logo + tenant info
- Quick actions
- Uitloggen button

✅ **Real-time Stats (4 Cards)**
- Vandaag (met gasten)
- Bevestigd
- Pending
- Bezettingsgraad

✅ **Advanced Filters**
- Status filters
- Search by name/email/phone
- View modes (List/Grid/Calendar)

✅ **Booking Management**
- Quick actions per status
- One-click bevestigen/annuleren/no-show
- Authorization checks

✅ **Multi-location**
- Location switcher
- Per-location stats
- Add nieuwe vestiging
- Delete vestiging

✅ **Professional UI**
- R4Y kleuren consistent
- Geen emoji's
- Clean typography
- Responsive design
- Hover/loading states

---

## TROUBLESHOOTING:

**SQL Error:**
```
Run migration eerst in Supabase SQL Editor
```

**Booking Actions Niet Werkend:**
```
Check console for API errors
Verify user is OWNER/MANAGER/STAFF
```

**Stats Niet Correct:**
```
Refresh page
Check database data
```

**Logout Niet Werkend:**
```
Check /api/auth/logout endpoint
Check browser console
```

---

## READY!

Dashboard is nu volledig functioneel met alle TableFever features maar dan met R4Y branding!

**Zie `PROFESSIONAL_DASHBOARD.md` voor complete documentatie.**

