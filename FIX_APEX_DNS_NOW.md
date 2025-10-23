# 🔧 FIX APEX DNS - NU DOEN!

## ❌ PROBLEEM
```
reserve4you.com → 217.21.190.139 (FOUT!)
```

## ✅ OPLOSSING

### STAP 1: Login Combell
1. Ga naar: https://www.combell.com/nl/mycombell
2. Login
3. Mijn producten → Domeinnamen
4. Klik op **reserve4you.com**
5. Klik op tab **"DNS"**

### STAP 2: Zoek de A-record voor @ (apex/root)

Je ziet iets zoals:

```
Naam:  @ (of leeg/root)
Type:  A
Waarde: 217.21.190.139  ← DIT IS FOUT!
TTL:    3600
```

### STAP 3: Wijzig het IP-adres

1. Klik op **"Bewerken"** (potlood-icoon) bij deze record
2. Verander `217.21.190.139` naar:
   ```
   76.76.21.21
   ```
3. Klik **"Opslaan"**

### STAP 4: Verifieer

Na opslaan moet je hebben:

```
@ (root)   A    76.76.21.21  ✅
www        A    76.76.21.21  ✅
```

### STAP 5: Test DNS (wacht 5-10 minuten)

```bash
cd /Users/dietmar/Desktop/ray2
./CHECK_DNS_RESERVE4YOU.sh
```

Moet tonen:
```
Apex domain: 76.76.21.21  ✅
WWW subdomain: 76.76.21.21  ✅
```

### STAP 6: Test website

Na DNS propagatie (10-15 minuten):
```
https://reserve4you.com  → Werkt! ✅
https://www.reserve4you.com  → Werkt! ✅
```

---

## 🎯 DAT IS ALLES!

Vercel heeft al SSL certificaten uitgegeven.
Email blijft gewoon werken via MailProtect.
Enige probleem: apex A-record wijst naar verkeerd IP.

**Fix dat en alles werkt!** 🚀


