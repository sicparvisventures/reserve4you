# 🔍 TEST DEBUG API

Ik heb een debug API endpoint gemaakt die **alle details** logt.

## 🧪 Test het:

### Stap 1: Open Browser Console
1. Ga naar `http://localhost:3007`
2. Druk F12 (open Developer Tools)
3. Ga naar **Console** tab

### Stap 2: Run dit in de console:

```javascript
// Test met debug endpoint
fetch('/api/favorites/debug', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    locationId: 'test-location-id',
    action: 'add'
  })
})
  .then(r => r.json())
  .then(data => {
    console.log('=== DEBUG RESPONSE ===');
    console.log(JSON.stringify(data, null, 2));
  })
  .catch(err => {
    console.error('=== FETCH ERROR ===');
    console.error(err);
  });
```

### Stap 3: Bekijk de output

Je ziet nu een **gedetailleerde debug response** met:
- ✅ Welke stap faalde
- ✅ Exacte error code
- ✅ Error message
- ✅ User ID
- ✅ Consumer ID
- ✅ Alle details

### Stap 4: Kopieer de output

Kopieer de VOLLEDIGE output en deel met mij.

---

## 🎯 Wat dit Debug Endpoint doet:

Het logt elk van deze stappen:
1. Creating Supabase client
2. Getting authenticated user
3. Parsing request body
4. Getting consumer record
5. Creating consumer if needed
6. Adding/removing favorite

Als één van deze stappen faalt, zie je **exact waar en waarom**.

---

## 🔧 Alternatief: Gebruik een echte location ID

Als je een echte location wilt testen, gebruik dit:

```javascript
// Get a real location ID first
fetch('/api/debug/locations')
  .then(r => r.json())
  .then(data => console.log('Locations:', data));
```

Of, als je een location ID hebt, gebruik die in plaats van 'test-location-id'.

---

## 📊 Verwachte Output:

Als **alles werkt**, zie je:
```json
{
  "success": true,
  "message": "Favorite added",
  "debugInfo": {
    "step": "adding_favorite",
    "userId": "...",
    "consumerId": "...",
    "insertSuccess": true
  }
}
```

Als **het faalt**, zie je:
```json
{
  "error": "...",
  "debugInfo": {
    "step": "...",
    "insertError": {
      "code": "...",
      "message": "EXACTE ERROR HIER"
    }
  }
}
```

Probeer het en deel de output! 🔍

