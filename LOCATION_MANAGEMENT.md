# VESTIGING BEHEER - DASHBOARD GUIDE

## WAT IS ER GEÏMPLEMENTEERD:

### 1. NIEUWE VESTIGING TOEVOEGEN
- Button in dashboard header: "Nieuwe Vestiging"
- Start onboarding vanaf stap 2 (Locatie info)
- Stap 1 (Bedrijf) wordt automatisch overgeslagen
- Progress bar toont alleen stappen 2-8
- Na voltooien: terug naar dashboard

### 2. VESTIGING VERWIJDEREN
- Delete button per vestiging (alleen voor OWNER/MANAGER)
- Cascade delete verwijdert ALLES:
  - Alle tafels
  - Alle shifts  
  - Alle reserveringen
  - Alle policies
  - POS integraties
  - Favorites
- Laatste vestiging kan niet verwijderd worden
- Confirmation dialog voor veiligheid

### 3. DASHBOARD ZONDER VESTIGINGEN
- Friendly empty state
- Direct link naar "Eerste Vestiging Toevoegen"
- Geen redirect naar onboarding

---

## DATABASE SETUP:

### RUN MIGRATION:

Open **Supabase SQL Editor** en run:

```sql
-- File: /supabase/migrations/20241017000010_location_cascade_delete.sql
```

**Expected output:**
```
Location Cascade Delete Function Created

Usage:
  SELECT delete_location_cascade(
    'location-id-here'::uuid,
    'user-id-here'::uuid
  );

Security:
  - Only tenant OWNER or MANAGER can delete
  - Deletes ALL associated data
  - Cannot be undone
```

---

## GEBRUIK:

### NIEUWE VESTIGING TOEVOEGEN:

#### Via Dashboard:
1. Ga naar: `http://localhost:3007/manager/[tenantId]/dashboard`
2. Klik "Nieuwe Vestiging" button (rechts boven)
3. Doorloop onboarding stap 2-8:
   - Stap 2: Locatie info
   - Stap 3: Tafels & Shifts
   - Stap 4: Policies
   - Stap 5: Betaalinstellingen (skip)
   - Stap 6: Abonnement (alleen als niet actief)
   - Stap 7: Integraties (skip)
   - Stap 8: Publiceren
4. Klik "Publiceer Restaurant"
5. Terug naar dashboard met nieuwe vestiging

#### Direct URL:
```
http://localhost:3007/manager/onboarding?step=2&tenantId=[TENANT-ID]
```

### VESTIGING VERWIJDEREN:

1. Ga naar dashboard
2. Zie je vestigingen lijst onder header
3. Klik Trash icon bij de vestiging
4. Bevestig in dialog
5. Vestiging wordt verwijderd

**Let op:**
- Laatste vestiging kan niet verwijderd worden
- Verwijder eerst het hele bedrijf via `/manager`
- Delete button is alleen zichtbaar voor OWNER en MANAGER

---

## UI FEATURES:

### Dashboard Header:
```
┌─────────────────────────────────────────────────┐
│ [Bedrijfsnaam]                                  │
│ OWNER • GROWTH                                  │
│                                                  │
│ [+ Nieuwe Vestiging]  [⚙ Instellingen]        │
└─────────────────────────────────────────────────┘
```

### Vestigingen Cards:
```
┌──────────────────────────────────┐
│ [Store Icon] Restaurant Name      │
│              Gepubliceerd          │
│ ─────────────────────────────────│
│ restaurant-name      [🗑️ Delete] │
└──────────────────────────────────┘
```

**Features:**
- Click op card selecteert vestiging
- Selected state: border-2 border-primary
- Slug wordt getoond
- Status: "Gepubliceerd" of "Concept"
- Delete button rechts (alleen voor OWNER/MANAGER)
- Disabled delete als laatste vestiging

### Empty State:
```
┌────────────────────────────────────┐
│                                    │
│        [Store Icon (groot)]        │
│                                    │
│       Geen vestigingen             │
│                                    │
│   Je hebt nog geen vestigingen     │
│   toegevoegd...                    │
│                                    │
│  [+ Eerste Vestiging Toevoegen]   │
│                                    │
└────────────────────────────────────┘
```

---

## ONBOARDING FLOW:

### Nieuwe Bedrijf (Start vanaf stap 1):
```
http://localhost:3007/manager/onboarding?step=1
```

**Progress bar:**
```
[1] Bedrijf → [2] Locatie → [3] Tafels → ... → [8] Publiceren
```

### Nieuwe Vestiging (Start vanaf stap 2):
```
http://localhost:3007/manager/onboarding?step=2&tenantId=[TENANT-ID]
```

**Progress bar:**
```
[2] Locatie → [3] Tafels → [4] Policies → ... → [8] Publiceren
```

**Verschillen:**
- Stap 1 wordt overgeslagen
- tenantId wordt meegestuurd in URL
- Titel: "Nieuwe Vestiging Toevoegen"
- "Opslaan & later verder" gaat terug naar dashboard
- Na stap 8: terug naar dashboard

---

## API ENDPOINTS:

### Delete Location:
```typescript
DELETE /api/manager/locations/[locationId]

Response:
{
  "success": true,
  "message": "Location deleted successfully"
}

Errors:
- 404: Location not found
- 403: Only tenant owners and managers can delete locations
- 500: Failed to delete location
```

---

## DATABASE CASCADE:

### Delete Volgorde:
```
1. Bookings (references location + tables)
2. Favorites (references location)
3. Policies (references location)
4. Shifts (references location)
5. Tables (references location)
6. POS integrations (references location)
7. Location (root)
```

### Manual SQL Delete:
```sql
-- Delete specific location:
SELECT delete_location_cascade(
  'location-id-here'::uuid,
  'your-user-id-here'::uuid
);

-- View all locations:
SELECT 
  l.id,
  l.name,
  l.slug,
  l.is_public,
  t.name as tenant_name,
  (SELECT COUNT(*) FROM tables WHERE location_id = l.id) as tables,
  (SELECT COUNT(*) FROM bookings WHERE location_id = l.id) as bookings
FROM locations l
JOIN tenants t ON l.tenant_id = t.id
ORDER BY l.created_at DESC;
```

---

## SECURITY:

### Authorization:
```typescript
// Only OWNER or MANAGER can delete
checkTenantRole(userId, tenantId, ['OWNER', 'MANAGER'])
```

### Protection:
- Last location cannot be deleted via UI
- Confirmation dialog prevents accidents
- SECURITY DEFINER function with auth checks
- Cascade delete in transaction (atomic)

---

## CHECKLIST:

### Voor Nieuwe Vestiging:
```
☐ 1. Run migration: 20241017000010_location_cascade_delete.sql
☐ 2. Ga naar dashboard
☐ 3. Klik "Nieuwe Vestiging"
☐ 4. Vul locatie info in (stap 2)
☐ 5. Configureer tafels (stap 3)
☐ 6. Configureer shifts (stap 3)
☐ 7. Policies (stap 4, optioneel)
☐ 8. Skip betaal & integraties (stap 5-7)
☐ 9. Publiceer (stap 8)
☐ 10. Check dashboard: nieuwe vestiging zichtbaar
☐ 11. Check homepage: vestiging zichtbaar
```

### Voor Delete:
```
☐ 1. Ga naar dashboard
☐ 2. Check je hebt > 1 vestiging
☐ 3. Klik trash icon bij vestiging
☐ 4. Bevestig dialog
☐ 5. Verify vestiging is verwijderd
☐ 6. Verify homepage: vestiging niet meer zichtbaar
```

---

## TROUBLESHOOTING:

### "Nieuwe Vestiging button doet niets"
- Check: tenantId in URL correct?
- Check: onboarding flow werkt?
- Try direct URL: `/manager/onboarding?step=2&tenantId=[ID]`

### "Kan vestiging niet verwijderen"
- Check: je bent OWNER of MANAGER?
- Check: je hebt meer dan 1 vestiging?
- Last location: delete hele tenant via `/manager`

### "Delete button niet zichtbaar"
- Check je role: alleen OWNER/MANAGER
- Check: delete button staat rechts onderin card

### "Progress bar klopt niet"
- Als tenantId in URL: stap 1 wordt overgeslagen
- Progress bar telt vanaf stap 2
- Dit is correct gedrag voor nieuwe vestiging

---

## TESTING SCENARIO:

### Complete Flow Test:

```bash
# 1. Maak tenant + eerste vestiging
http://localhost:3007/manager/onboarding?step=1
# → Doorloop alle stappen

# 2. Ga naar dashboard
http://localhost:3007/manager/[tenant-id]/dashboard
# → Zie je eerste vestiging

# 3. Voeg tweede vestiging toe
# → Klik "Nieuwe Vestiging"
# → Doorloop stap 2-8
# → Terug in dashboard

# 4. Check dashboard
# → Zie 2 vestigingen
# → Kan schakelen tussen vestigingen
# → Kan beide verwijderen (delete button zichtbaar)

# 5. Verwijder één vestiging
# → Klik trash icon
# → Bevestig
# → Vestiging verdwijnt

# 6. Check laatste vestiging
# → Delete button is disabled
# → Tooltip: "Laatste vestiging kan niet verwijderd worden"

# 7. Delete hele tenant
http://localhost:3007/manager
# → Klik "Verwijder" op tenant
# → Beide overgebleven vestigingen worden ook verwijderd
```

---

## BESTANDENOVERZICHT:

### Frontend:
- `/app/manager/[tenantId]/dashboard/DashboardClient.tsx` - UI met delete + empty state
- `/app/manager/[tenantId]/dashboard/page.tsx` - Server component
- `/app/manager/onboarding/OnboardingWizard.tsx` - tenantId support

### API:
- `/app/api/manager/locations/[locationId]/route.ts` - DELETE endpoint

### Database:
- `/supabase/migrations/20241017000010_location_cascade_delete.sql` - Cascade function

---

## READY!

Alle functionaliteit is klaar:
- Nieuwe vestiging toevoegen: via dashboard
- Vestiging verwijderen: per vestiging
- Empty state: friendly message
- Security: alleen OWNER/MANAGER
- Clean UI: R4Y thema, geen emoji's

**Test het nu!**

1. Run migration: `20241017000010_location_cascade_delete.sql`
2. Ga naar dashboard
3. Test "Nieuwe Vestiging" flow
4. Test delete functionaliteit
5. Check empty state

**Succes!**

