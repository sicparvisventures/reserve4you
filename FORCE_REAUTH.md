# FORCE RE-AUTHENTICATION GUIDE

## 🔄 Wanneer Gebruiken

Als je de 403 error krijgt en de debug logs tonen dat `session.userId` niet overeenkomt met je membership `user_id`.

---

## 🛠️ STAPPEN

### **Methode 1: Via Browser (SNEL)**

1. **Open DevTools** (F12 of Cmd+Option+I)
2. **Application tab** → **Storage**
3. **Clear alle:**
   - Cookies
   - Local Storage
   - Session Storage
4. **Hard Refresh:** Cmd+Shift+R / Ctrl+Shift+F5
5. **Login opnieuw**
6. **Probeer onboarding**

---

### **Methode 2: Via App (CLEAN)**

1. **Ga naar:** `http://localhost:3007/auth/logout`
2. **Wacht tot je uitgelogd bent**
3. **Clear browser cache** (Cmd+Shift+Delete / Ctrl+Shift+Delete)
4. **Ga naar:** `http://localhost:3007/auth/login`
5. **Login met:** `dietmarkuh@gmail.com`
6. **Ga naar onboarding:** 
   ```
   http://localhost:3007/manager/onboarding?step=2&tenantId=b0402eea-4296-4951-aff6-8f4c2c219818
   ```

---

### **Methode 3: SQL Session Refresh (ADVANCED)**

Als methode 1 & 2 niet werken, check je auth sessions:

```sql
-- Check active sessions for your email
SELECT 
  s.id,
  s.user_id,
  s.created_at,
  s.updated_at,
  u.email
FROM auth.sessions s
JOIN auth.users u ON u.id = s.user_id
WHERE u.email = 'dietmarkuh@gmail.com'
ORDER BY s.updated_at DESC
LIMIT 5;
```

**Verwachte output:**
- Meest recente session moet `user_id = 3d360127-fa98-448f-9b2d-587b7834a4a8` hebben

**Als je MEERDERE user_ids ziet:**
- Je hebt meerdere accounts met hetzelfde email (probleem!)
- Of oude sessions zijn niet opgeschoond

**Cleanup (ALLEEN als nodig):**
```sql
-- Verwijder oude sessions (force logout alle devices)
DELETE FROM auth.sessions
WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE email = 'dietmarkuh@gmail.com'
);

-- Login daarna opnieuw via browser
```

---

## ✅ VERIFICATIE

Na re-authenticatie, check in browser console:

```javascript
// In browser DevTools console:
fetch('/api/auth/session')
  .then(r => r.json())
  .then(d => console.log('Session:', d));
```

**Verwachte output:**
```json
{
  "userId": "3d360127-fa98-448f-9b2d-587b7834a4a8",
  "email": "dietmarkuh@gmail.com"
}
```

**Als dit overeenkomt met de membership user_id → GEFIXT!**

---

## 🎯 TEST DE FIX

1. **Hard refresh** browser
2. **Ga naar onboarding Step 2**
3. **Vul locatie informatie in**
4. **Submit**

**In terminal zie je nu:**
```
🔍 DEBUG - Location POST:
  Session userId: 3d360127-fa98-448f-9b2d-587b7834a4a8  ✅
  Tenant ID: b0402eea-4296-4951-aff6-8f4c2c219818      ✅
  Has access? true                                      ✅
```

**In browser debug log:**
```
📡 Response status: 200 OK  ✅
✅ Location created: [uuid]
```

**SUCCESS! 🎉**

---

## 🚨 ALS HET NOG STEEDS NIET WERKT

Check deze dingen:

1. **Database migraties:**
   ```sql
   -- Check if business_sector column exists
   SELECT column_name, data_type 
   FROM information_schema.columns
   WHERE table_name = 'locations' 
   AND column_name = 'business_sector';
   ```

2. **RLS Policies:**
   ```sql
   -- Check memberships table policies
   SELECT * FROM pg_policies 
   WHERE tablename = 'memberships';
   ```

3. **Supabase Connection:**
   - Check if Supabase URL is correct in `.env.local`
   - Check if API keys are valid

4. **Next.js Server:**
   - Restart dev server (Ctrl+C, then `npm run dev`)
   - Check for any startup errors

---

**Laat me weten wat de debug logs tonen in de terminal!**

