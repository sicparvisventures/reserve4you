# 🔍 DEBUG ONBOARDING STAP 2

## Het Probleem
Je klikt op "Opslaan en doorgaan" maar er gebeurt niets. De pagina blijft gewoon staan.

## 🧪 STAP 1: Check Browser Console

1. Open `http://localhost:3007/manager/onboarding?step=2`
2. Druk op **F12** (of Cmd+Option+I op Mac) om Developer Tools te openen
3. Klik op het **Console** tabblad
4. Vul het formulier in
5. Klik op "Opslaan en doorgaan"
6. **KIJK NAAR DE CONSOLE** - Zie je rode errors?

### Mogelijke Errors:

**A. Validation Error**
```
ZodError: [
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "undefined",
    "path": ["phone"],
    "message": "Required"
  }
]
```
→ Een veld is verkeerd ingevuld

**B. API Error**
```
POST /api/manager/locations 500 (Internal Server Error)
Error: Failed to create location
```
→ Database probleem

**C. Network Error**
```
Failed to fetch
```
→ API route bestaat niet of is kapot

---

## 🧪 STAP 2: Check Network Tab

1. In Developer Tools, klik op **Network** tabblad
2. Vul formulier in en klik "Opslaan en doorgaan"
3. Zie je een request naar `/api/manager/locations`?
   - ✅ **JA** → Klik erop, wat is de Status Code?
     - `200` = Success (maar waarom gaat het niet naar volgende stap?)
     - `400` = Bad Request (validation error)
     - `403` = Forbidden (geen toegang)
     - `500` = Internal Server Error (database error)
   - ❌ **NEE** → Request wordt niet eens verstuurd (validation faalt in frontend)

---

## 🧪 STAP 3: Verify Database Columns

Run deze query in **Supabase SQL Editor**:

```sql
-- Check if all required columns exist
SELECT 
  column_name, 
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'locations'
AND column_name IN (
  'name', 'slug', 'address_json', 'phone', 'email', 
  'opening_hours_json', 'cuisine', 'price_range', 'description',
  'slot_minutes', 'buffer_minutes', 'tenant_id', 'is_public'
)
ORDER BY column_name;
```

**Expected Output (13 rows):**
```
address_json        | jsonb              | NO  |
buffer_minutes      | integer            | NO  | 15
cuisine             | character varying  | YES |
description         | text               | YES |
email               | character varying  | YES |
is_public           | boolean            | NO  | false
name                | character varying  | NO  |
opening_hours_json  | jsonb              | NO  | '{}'::jsonb
phone               | character varying  | YES |
price_range         | integer            | YES |
slot_minutes        | integer            | NO  | 90
slug                | character varying  | NO  |
tenant_id           | uuid               | NO  |
```

Als je **minder dan 13 rows** ziet, ontbreken er kolommen!

---

## 🧪 STAP 4: Test API Direct

Run dit in je **browser console** (F12 → Console tab):

```javascript
// First, get your tenant ID from the onboarding wizard state
// You should see it in the form data or console.log

const testData = {
  tenantId: "PASTE_YOUR_TENANT_ID_HERE", // Get this from browser storage or console
  name: "Test Restaurant",
  slug: "test-restaurant",
  address: {
    street: "Kalverstraat",
    number: "123",
    city: "Amsterdam",
    postalCode: "1012 NZ",
    country: "NL"
  },
  phone: "+31612345678",
  email: "test@test.nl",
  openingHours: [
    { dayOfWeek: 0, openTime: "00:00", closeTime: "00:00", isClosed: true },
    { dayOfWeek: 1, openTime: "11:00", closeTime: "22:00", isClosed: false },
    { dayOfWeek: 2, openTime: "11:00", closeTime: "22:00", isClosed: false },
    { dayOfWeek: 3, openTime: "11:00", closeTime: "22:00", isClosed: false },
    { dayOfWeek: 4, openTime: "11:00", closeTime: "22:00", isClosed: false },
    { dayOfWeek: 5, openTime: "11:00", closeTime: "22:00", isClosed: false },
    { dayOfWeek: 6, openTime: "12:00", closeTime: "23:00", isClosed: false },
  ],
  cuisine: "Italian",
  priceRange: "€€",
  description: "Een test restaurant",
  slotMinutes: 90,
  bufferMinutes: 15
};

// Make the API call
fetch('/api/manager/locations', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(testData)
})
.then(res => res.json())
.then(data => console.log('✅ SUCCESS:', data))
.catch(err => console.error('❌ ERROR:', err));
```

**Expected Output:**
- ✅ Success: `{ id: "...", name: "Test Restaurant", ... }`
- ❌ Error: Zie de foutmelding

---

## 🧪 STAP 5: Check Terminal/Server Logs

Kijk in je terminal waar `npm run dev` draait. Zie je errors zoals:

```
Error creating location: column "opening_hours_json" does not exist
```

of

```
new row violates row-level security policy for table "locations"
```

---

## 📊 **Quick Diagnostic Checklist**

Vul dit in nadat je bovenstaande stappen hebt gedaan:

```
☐ Browser Console checked → Error: _________________
☐ Network tab checked → Status: _________________
☐ Database columns verified → Missing: _________________
☐ API test in console → Result: _________________
☐ Server terminal logs → Error: _________________
```

---

## 🎯 **Common Issues & Fixes**

### Issue 1: "Column does not exist"
```
ERROR: column "opening_hours_json" does not exist
```
**Fix:** Run `20241017000006_fix_onboarding_columns.sql` again

### Issue 2: "Violates row-level security"
```
new row violates row-level security policy
```
**Fix:** Check if user is authenticated and has tenant access

### Issue 3: "Failed to fetch"
```
TypeError: Failed to fetch
```
**Fix:** Check if API route exists at `/app/api/manager/locations/route.ts`

### Issue 4: Nothing in console, nothing in network
**Fix:** Validation is failing in frontend before API call. Check form data in React DevTools.

---

## 🚀 **Next Steps**

**Nadat je de checks hebt gedaan:**

1. Deel met mij:
   - Console errors (screenshot of text)
   - Network tab status code
   - Database verification result
   - Server terminal errors

2. Dan kan ik exact zien wat het probleem is en de juiste fix maken!

---

**Doe deze checks en laat me weten wat je ziet!** 🔍

