# 🗑️ Test Locatie Verwijderen Functionaliteit

## ✅ Wat is geïmplementeerd

### 1. **Backend (Al aanwezig)**
- ✅ `DELETE /api/manager/locations/[locationId]` endpoint
- ✅ `delete_location_cascade()` SQL functie
- ✅ Cascade delete voor alle gerelateerde data
- ✅ Authorization check (alleen OWNER/MANAGER)

### 2. **Frontend (Nieuw toegevoegd)**
- ✅ "Locatie Verwijderen" knop in Settings
- ✅ Confirmation dialog met waarschuwingen
- ✅ Disabled voor laatste locatie
- ✅ Success/error berichten
- ✅ Automatische redirect naar dashboard

---

## 🧪 TEST STAPPEN

### Stap 1: Start de applicatie
```bash
npm run dev
```

### Stap 2: Navigeer naar Settings
```
http://localhost:3007/manager/b0402eea-4296-4951-aff6-8f4c2c219818/settings
```

### Stap 3: Ga naar Locaties tab
- Klik op **"Locaties"** in de linker navigatie
- Als je meerdere locaties hebt, selecteer er één

### Stap 4: Scroll naar beneden
- Je ziet onderaan twee buttons:
  - Links: **🗑️ Locatie Verwijderen** (rode knop)
  - Rechts: **💾 Wijzigingen Opslaan** (groene knop)

### Stap 5: Test de knop
1. **Als je 1 locatie hebt:**
   - ✅ Knop is **disabled** (grijs)
   - ✅ Hover toont: "Je kunt je laatste locatie niet verwijderen"

2. **Als je meerdere locaties hebt:**
   - ✅ Knop is **actief** (rood)
   - ✅ Klik op "Locatie Verwijderen"

### Stap 6: Bevestig verwijdering
- ✅ Dialog verschijnt met:
  - ⚠️ Locatie naam
  - ⚠️ Waarschuwing dat actie niet ongedaan kan
  - 📋 Lijst van wat verwijderd wordt:
    - Alle tafels en vloerplannen
    - Alle reserveringen
    - Alle shifts en openingstijden
    - Alle reviews en berichten
    - Alle promoties en menu items
  - Twee knoppen:
    - **Annuleren** (grijs)
    - **Ja, Verwijderen** (rood)

### Stap 7: Voltooi verwijdering
- Klik op **"Ja, Verwijderen"**
- ✅ Knop toont "Verwijderen..."
- ✅ Success bericht verschijnt
- ✅ Na 1.5 seconde redirect naar dashboard

---

## 🔍 VERIFICATIE IN DATABASE

Run dit SQL script om te verifiëren dat alles correct is geconfigureerd:

```sql
-- Run in Supabase SQL Editor
\i COMPLETE_LOCATION_DELETE_SETUP.sql
```

Dit checkt:
- ✅ `delete_location_cascade` functie bestaat
- ✅ CASCADE foreign keys zijn correct
- ✅ Permissions zijn correct
- ✅ Voorbeeld data

---

## 🛡️ VEILIGHEIDSFEATURES

### Automatische Bescherming
1. **Laatste locatie beschermen**
   - Je kunt je laatste locatie NIET verwijderen
   - Knop is automatisch disabled

2. **Authorization**
   - Alleen OWNER en MANAGER kunnen verwijderen
   - STAFF krijgt 403 Forbidden

3. **Confirmation Required**
   - Dubbele bevestiging vereist
   - Duidelijke waarschuwing

4. **Cascade Delete**
   - Alle gerelateerde data wordt automatisch verwijderd
   - Geen orphaned records

### Wat wordt verwijderd?
Bij het verwijderen van een locatie worden **ALLE** gerelateerde records verwijderd:

```
locations (1)
├── tables (N)
├── bookings (N)
├── shifts (N)
├── policies (N)
├── resources (N)
├── service_offerings (N)
├── reviews (N)
│   └── review_replies (N)
├── conversations (N)
│   └── messages (N)
├── waitlist_entries (N)
├── promotions (N)
├── crm_customer_profiles (N)
├── notification_preferences (N)
├── email_logs (N)
├── api_usage_logs (N)
└── pos_integrations (N)
```

---

## 🐛 TROUBLESHOOTING

### Probleem: Knop niet zichtbaar
**Oplossing:**
- Refresh de pagina (Cmd+Shift+R)
- Check of je in de "Locaties" tab bent
- Scroll helemaal naar beneden

### Probleem: Knop is grijs
**Mogelijk:**
1. Je hebt maar 1 locatie (dit is normaal gedrag)
2. Je bent niet OWNER of MANAGER
3. Er wordt al een save/delete actie uitgevoerd

### Probleem: 403 Forbidden error
**Oplossing:**
- Check of je OWNER of MANAGER rol hebt:
```sql
SELECT m.role, t.name as tenant_name
FROM memberships m
JOIN tenants t ON t.id = m.tenant_id
WHERE m.user_id = 'jouw-user-id'
AND m.tenant_id = 'jouw-tenant-id';
```

### Probleem: Delete faalt
**Check:**
1. Database functie bestaat:
```sql
SELECT proname FROM pg_proc 
WHERE proname = 'delete_location_cascade';
```

2. Migrations zijn gerund:
```sql
SELECT * FROM supabase_migrations.schema_migrations
WHERE version = '20251029000001';
```

---

## 📊 TEST SCENARIO'S

### Scenario 1: Happy Path (2+ locaties)
1. ✅ Ga naar Settings → Locaties
2. ✅ Selecteer een locatie (niet je enige!)
3. ✅ Klik "Locatie Verwijderen"
4. ✅ Bevestig in dialog
5. ✅ Zie success bericht
6. ✅ Redirect naar dashboard
7. ✅ Locatie is weg uit lijst

### Scenario 2: Bescherming laatste locatie
1. ✅ Ga naar Settings → Locaties
2. ✅ Als je 1 locatie hebt
3. ✅ Knop is disabled
4. ✅ Hover toont waarschuwing

### Scenario 3: Annuleren
1. ✅ Klik "Locatie Verwijderen"
2. ✅ Dialog opent
3. ✅ Klik "Annuleren"
4. ✅ Dialog sluit, niets verwijderd

### Scenario 4: Geen permissie
1. ✅ Login als STAFF user
2. ✅ Probeer DELETE via API
3. ✅ Krijgt 403 Forbidden

---

## 🎯 ACCEPTATIE CRITERIA

- [x] Delete knop is zichtbaar in Settings → Locaties
- [x] Knop is links van "Wijzigingen Opslaan"
- [x] Knop is disabled voor laatste locatie
- [x] Confirmation dialog verschijnt bij klik
- [x] Dialog toont duidelijke waarschuwing
- [x] Dialog toont lijst van wat verwijderd wordt
- [x] Annuleren werkt correct
- [x] Delete werkt en toont success bericht
- [x] Redirect naar dashboard na delete
- [x] Alleen OWNER/MANAGER kan verwijderen
- [x] Alle gerelateerde data wordt verwijderd (cascade)
- [x] Geen linter errors

---

## 📝 NOTITIES

### Als je een locatie wilt herstellen
❌ **Dit is NIET mogelijk!** 
- Verwijdering is permanent
- Maak regelmatig database backups
- Test eerst met een test locatie

### Database Backup (aanbevolen voor je test)
```bash
# Maak een backup VOOR je test
pg_dump -h your-supabase-host -U postgres your-database > backup_before_delete_test.sql
```

### Voor Productie
Voordat je dit naar productie pusht:
1. ✅ Test grondig in development
2. ✅ Maak database backup
3. ✅ Test met verschillende user rollen
4. ✅ Test met locaties die veel data hebben
5. ✅ Communiceer naar users dat verwijdering permanent is

---

## 🚀 KLAAR VOOR GEBRUIK

De locatie verwijder functionaliteit is nu volledig werkend! 

Test het via:
```
http://localhost:3007/manager/{jouw-tenant-id}/settings
```

Bij problemen, check de console (F12) en Supabase logs.

