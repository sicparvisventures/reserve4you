# Deprecated SQL Files

## ❌ GEBRUIK DEZE NIET

De volgende bestanden zijn **deprecated** en vervangen door betere oplossingen:

### 1. `DASHBOARD_INSIGHTS_QUERIES.sql`

**Probleem:**
- Error: "column tenant_id does not exist"
- Verkeerde schema assumptions

**Vervangen door:** `AUTO_DASHBOARD_QUERIES.sql`

---

### 2. `DASHBOARD_INSIGHTS_QUERIES_FIXED.sql`

**Probleem:**
- Vereist handmatige replacement van `[YOUR_TENANT_ID]`
- Error: "invalid input syntax for type uuid" als je vergeet te vervangen
- Omslachtig en foutgevoelig

**Vervangen door:** `AUTO_DASHBOARD_QUERIES.sql`

---

### 3. `READY_TO_USE_QUERIES.sql`

**Probleem:**
- Toont data van ALLE tenants (niet gefilterd)
- Vereist handmatige WHERE clause toevoegen
- Privacy/security risk

**Vervangen door:** `AUTO_DASHBOARD_QUERIES.sql`

---

### 4. `GET_MY_TENANT_ID.sql`

**Status:** Geïntegreerd in `AUTO_TENANT_DETECTION.sql`

**Gebruik nu:** `AUTO_TENANT_DETECTION.sql` (bevat dezelfde functionaliteit + meer)

---

## ✅ GEBRUIK DEZE WEL

| File | Wat | Waarom |
|------|-----|--------|
| `AUTO_TENANT_DETECTION.sql` | Installatie script | Maakt helper functions |
| `AUTO_DASHBOARD_QUERIES.sql` | Queries | Automatisch gefilterd, klaar om te gebruiken |
| `INSTALL_AUTO_QUERIES.md` | Guide | Uitgebreide installatie instructies |
| `START_HIER_AUTO_SQL.md` | Quick Start | Snelle start voor ongeduldig mensen 😄 |

---

## 🔄 Migration Path

Als je de oude files al gebruikt:

### Van DASHBOARD_INSIGHTS_QUERIES_FIXED.sql

**Voor:**
```sql
SELECT ...
FROM locations l
WHERE l.tenant_id = '[YOUR_TENANT_ID]'
```

**Na:**
```sql
SELECT ...
FROM locations l
WHERE l.tenant_id = get_my_tenant_id()
```

### Van READY_TO_USE_QUERIES.sql

**Voor:**
```sql
-- Toont ALLE tenants
SELECT t.name, COUNT(l.id)
FROM tenants t
LEFT JOIN locations l ON l.tenant_id = t.id
GROUP BY t.name
```

**Na:**
```sql
-- Toont alleen MIJN tenant
SELECT t.name, COUNT(l.id)
FROM tenants t
LEFT JOIN locations l ON l.tenant_id = t.id
WHERE t.id = get_my_tenant_id()
GROUP BY t.name
```

---

## 🗑️ Cleanup (Optioneel)

Je kunt deze bestanden verwijderen:

```bash
# In terminal
cd /Users/dietmar/Desktop/ray2

# Backup maken (optioneel)
mkdir deprecated_sql_backup
mv DASHBOARD_INSIGHTS_QUERIES.sql deprecated_sql_backup/
mv DASHBOARD_INSIGHTS_QUERIES_FIXED.sql deprecated_sql_backup/
mv READY_TO_USE_QUERIES.sql deprecated_sql_backup/
mv GET_MY_TENANT_ID.sql deprecated_sql_backup/
```

Of gewoon negeren. Ze doen geen kwaad, maar gebruik ze niet meer.

---

## 📊 Feature Comparison

| Feature | Old Files | New Files |
|---------|-----------|-----------|
| Auto tenant detection | ❌ | ✅ |
| Requires manual edit | ✅ | ❌ |
| Works for team members | ❌ | ✅ |
| Security (RLS compatible) | ⚠️ | ✅ |
| Easy to use | ❌ | ✅ |
| Shows all tenants | ⚠️ Yes | ❌ No |
| Error-prone | ✅ | ❌ |

---

**Bottom line:** Gebruik `AUTO_TENANT_DETECTION.sql` + `AUTO_DASHBOARD_QUERIES.sql`. De rest mag je vergeten.

