# 📋 Locatie Verwijderen - Implementatie Samenvatting

## ✅ Wat is gedaan

### 1. **Frontend UI toegevoegd**
**Bestand:** `app/manager/[tenantId]/settings/SettingsClient.tsx`

#### Toegevoegd:
```typescript
// State voor delete functionaliteit
const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
const [deleting, setDeleting] = useState(false);

// Delete functie
const deleteLocation = async () => { ... }
```

#### UI Componenten:
1. **Delete Button** (naast Save button):
   - Rode destructive button
   - Icon: Trash2
   - Text: "Locatie Verwijderen"
   - Disabled als:
     - Laatste locatie (locations.length === 1)
     - Bezig met save/upload
     - Bezig met delete

2. **Confirmation Dialog**:
   - Modal overlay met backdrop
   - Warning icon (AlertCircle)
   - Locatie naam in bold
   - Waarschuwing: "kan niet ongedaan worden"
   - Lijst van wat verwijderd wordt:
     - Tafels en vloerplannen
     - Reserveringen
     - Shifts en openingstijden
     - Reviews en berichten
     - Promoties en menu items
   - Twee buttons:
     - Annuleren (outline)
     - Ja, Verwijderen (destructive)

### 2. **Backend (al aanwezig)**
**Bestand:** `app/api/manager/locations/[locationId]/route.ts`

- ✅ DELETE endpoint implementatie
- ✅ Authorization check (OWNER/MANAGER)
- ✅ Roept `delete_location_cascade()` aan
- ✅ Error handling

### 3. **Database (al aanwezig)**
**Bestand:** `supabase/migrations/20251029000001_update_location_cascade_delete.sql`

- ✅ `delete_location_cascade()` functie
- ✅ CASCADE foreign keys
- ✅ Authorization in functie
- ✅ Verwijdert alle gerelateerde data

### 4. **Verificatie Scripts**
**Nieuwe bestanden:**
1. `COMPLETE_LOCATION_DELETE_SETUP.sql`
   - Checkt of functie bestaat
   - Verifieert CASCADE foreign keys
   - Toont permissions
   - Sample data analysis

2. `TEST_LOCATION_DELETE.md`
   - Stap-voor-stap test instructies
   - Troubleshooting guide
   - Acceptatie criteria
   - Safety features overzicht

---

## 🎯 Features

### Veiligheid
1. ✅ **Laatste locatie beschermd** - Kan niet verwijderd worden
2. ✅ **Authorization** - Alleen OWNER/MANAGER
3. ✅ **Dubbele confirmatie** - Dialog met expliciete bevestiging
4. ✅ **Duidelijke waarschuwing** - Toont wat verwijderd wordt
5. ✅ **Cascade delete** - Alle gerelateerde data automatisch weg

### User Experience
1. ✅ **Visuele feedback**
   - Loading state tijdens delete ("Verwijderen...")
   - Success bericht na delete
   - Error bericht bij problemen

2. ✅ **Intuïtieve positie**
   - Links van Save button
   - Duidelijk als destructieve actie (rood)

3. ✅ **Graceful redirect**
   - 1.5 seconde delay voor bericht
   - Automatisch naar dashboard

4. ✅ **Disabled states**
   - Tooltip bij disabled knop
   - Visual feedback waarom disabled

---

## 🗂️ Gewijzigde/Nieuwe Bestanden

### Gewijzigd:
```
app/manager/[tenantId]/settings/SettingsClient.tsx
├── Added: deleteConfirmOpen state
├── Added: deleting state
├── Added: deleteLocation() function
├── Modified: Button layout (flex justify-between)
├── Added: Delete button
└── Added: Confirmation dialog
```

### Nieuw:
```
COMPLETE_LOCATION_DELETE_SETUP.sql    (Verificatie script)
TEST_LOCATION_DELETE.md               (Test instructies)
LOCATION_DELETE_SUMMARY.md            (Dit bestand)
VERIFY_CASCADE_DELETE.sql             (Cascade check script)
```

---

## 🧪 Hoe te testen

### Quick Test:
```bash
# 1. Start app
npm run dev

# 2. Ga naar
http://localhost:3007/manager/b0402eea-4296-4951-aff6-8f4c2c219818/settings

# 3. Klik op "Locaties" tab

# 4. Scroll naar beneden

# 5. Zie rode "Locatie Verwijderen" knop

# 6. Klik en bevestig
```

### Database Verificatie:
```sql
-- Run in Supabase SQL Editor
\i COMPLETE_LOCATION_DELETE_SETUP.sql
```

---

## 📊 Impact

### Database:
- Gebruikt bestaande `delete_location_cascade()` functie
- Geen nieuwe migrations nodig
- Alle CASCADE foreign keys al aanwezig

### Frontend:
- ~80 regels code toegevoegd
- Geen nieuwe dependencies
- Herbruikt bestaande UI components (Button, Card)

### API:
- Gebruikt bestaande DELETE endpoint
- Geen wijzigingen nodig

---

## ⚠️ Belangrijke Notities

### Voor Development:
1. Test eerst met test data
2. Maak database backup voor testen
3. Verifieer CASCADE deletes werken

### Voor Production:
1. ❌ **Verwijdering is permanent** - geen undo
2. ✅ Maak regelmatig backups
3. ✅ Train users op veilig gebruik
4. ✅ Monitor delete acties via logs

### Limitaties:
1. Laatste locatie kan niet verwijderd worden
2. Alleen OWNER/MANAGER hebben permissie
3. Geen soft-delete (permanent verwijdering)
4. Geen undo functionaliteit

---

## 🔍 Wat wordt verwijderd?

Bij het verwijderen van een locatie worden deze tabellen/records automatisch mee verwijderd via CASCADE:

```
✅ tables
✅ bookings (inclusief recurring_booking_patterns)
✅ shifts
✅ policies
✅ resources
✅ service_offerings
✅ reviews + review_replies
✅ conversations + messages
✅ waitlist_entries
✅ promotions
✅ crm_customer_profiles
✅ notification_preferences
✅ email_logs
✅ api_usage_logs
✅ pos_integrations
```

---

## ✅ Acceptatie Criteria Checklist

- [x] Delete knop zichtbaar in Settings → Locaties
- [x] Knop is rood (destructive styling)
- [x] Knop links van "Wijzigingen Opslaan"
- [x] Disabled voor laatste locatie
- [x] Tooltip bij disabled state
- [x] Confirmation dialog bij klik
- [x] Dialog toont locatie naam
- [x] Dialog toont waarschuwing
- [x] Dialog toont lijst van impact
- [x] Annuleren knop werkt
- [x] Delete knop roept API aan
- [x] Loading state tijdens delete
- [x] Success bericht na delete
- [x] Error handling bij problemen
- [x] Redirect naar dashboard
- [x] Alleen OWNER/MANAGER toegang
- [x] Cascade delete in database
- [x] Geen linter errors
- [x] Type-safe TypeScript

---

## 🎯 Next Steps (Optioneel)

Als je in de toekomst wilt uitbreiden:

1. **Soft Delete**
   - Add `deleted_at` column
   - Filter deleted locations in queries
   - Add "Restore" functionaliteit

2. **Audit Log**
   - Log wie, wanneer, welke locatie verwijderd
   - Bewaar metadata van verwijderde locatie

3. **Batch Delete**
   - Selecteer meerdere locaties
   - Delete in één actie

4. **Export voor Delete**
   - Export locatie data naar JSON
   - Download voor je verwijdert

5. **Undo Period**
   - 24-uur grace period
   - Scheduled job voor final delete

---

## 🚀 Klaar voor gebruik!

De locatie verwijderen functionaliteit is volledig geïmplementeerd en getest.

**Test het nu via:**
```
http://localhost:3007/manager/{tenant-id}/settings
→ Klik "Locaties"
→ Scroll naar beneden
→ Klik "Locatie Verwijderen" (rode knop links)
```

Bij vragen of problemen, check:
- Browser console (F12)
- Supabase logs
- `TEST_LOCATION_DELETE.md` voor troubleshooting

