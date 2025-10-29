# 🔍 CHECK SERVER LOGS

De 500 error betekent een **server-side probleem**. De exacte error staat in de terminal waar je dev server draait.

## 📋 Stappen:

### Stap 1: Vind je Terminal venster
Zoek het Terminal venster waar je `pnpm dev` hebt gedraaid (waar je de dev server hebt gestart).

### Stap 2: Scroll naar beneden
In die terminal zie je waarschijnlijk rode errors zoals:
```
Error creating consumer: ...
Error adding favorite: ...
```

### Stap 3: Kopieer de VOLLEDIGE error
Kopieer alles wat er staat na je laatste hartje klik.

### Stap 4: Deel met mij
Plak de error hier zodat ik kan zien wat het exacte probleem is.

---

## 🧪 Alternatief: Verifieer Setup

Voer eerst uit: **`VERIFY_ALL_SETUP.sql`** in Supabase SQL Editor

Dit checkt of alle 3 scripts correct zijn uitgevoerd:
- ✅ Script 1: Notifications
- ✅ Script 2: RLS Policies  
- ✅ Script 3: Auto-create consumer

Als één van deze **❌** is, dan moet je dat script opnieuw uitvoeren.

---

## 🎯 Meest Waarschijnlijke Problemen:

1. **Script 2 niet uitgevoerd** → Geen RLS policies → 500 error
2. **Consumer record probleem** → Check VERIFY_ALL_SETUP.sql
3. **RLS policy probleem** → Voer SIMPLE_FIX_TRY_THIS.sql opnieuw uit

---

## ⚡ Quick Test:

Open je browser console (F12) en run:
```javascript
fetch('/api/favorites', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    locationId: 'ANY_LOCATION_ID_HERE',
    action: 'add'
  })
}).then(r => r.json()).then(console.log)
```

Dit toont meer details in de console.

