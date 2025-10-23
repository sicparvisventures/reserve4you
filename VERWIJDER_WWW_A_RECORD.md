# 🔧 VERWIJDER WWW A-RECORD - EXACTE STAPPEN

## ❌ PROBLEEM
Je hebt **TWEE** www records:
1. **A-record:** www → 217.21.190.139 (OUD - heeft voorrang!)
2. **CNAME:** www → 92337baae00872fb.vercel-dns-017.com (NIEUW - wordt genegeerd!)

DNS geeft voorrang aan A-records boven CNAME, daarom werkt het niet!

---

## ✅ OPLOSSING: Verwijder de oude WWW A-record

### STAP 1: Open Combell DNS
1. Ga naar: https://www.combell.com/nl/mycombell
2. Login
3. **Mijn producten** → **Domeinnamen**
4. Klik op **reserve4you.com**
5. Klik op tab **"DNS"**

### STAP 2: Ga naar A-records sectie
In het linkermenu, klik op: **"A-records"**

### STAP 3: Zoek de www A-record
Je ziet nu een tabel met A-records. 

Zoek de rij met:
```
Record: www.reserve4you.com
IP-adres: 217.21.190.139
```

**Let op:** Er kan ook een kortere versie staan zoals:
```
Record: www
IP-adres: 217.21.190.139
```

### STAP 4: Verwijder deze record
Aan de rechterkant van deze rij zie je een **drie-puntjes menu** `⋮` of `...`

1. Klik op de drie puntjes
2. Klik op **"Verwijderen"** of kies de prullenbak optie
3. Bevestig de verwijdering

### STAP 5: Verifieer dat alleen deze A-record overblijft
Na het verwijderen zou je ALLEEN moeten zien:

```
Record: reserve4you.com (of @)
IP-adres: 76.76.21.21
TTL: 3600
```

**GEEN www A-record meer!**

### STAP 6: Check CNAME-records (niet aanpassen!)
Klik in het linkermenu op: **"CNAME-records"**

Verifieer dat deze record er nog staat:
```
Record: www.reserve4you.com
Bestemming: 92337baae00872fb.vercel-dns-017.com
TTL: 3600
```

✅ **Laat deze staan!** Dit is correct.

---

## 🧪 TEST NA VERWIJDERING

### Wacht 5-10 minuten voor DNS propagatie

### Test in Terminal:
```bash
cd /Users/dietmar/Desktop/ray2
./TEST_WWW_DNS.sh
```

### Of handmatig:
```bash
dig www.reserve4you.com A +short
```

**Moet tonen:**
- ✅ `76.76.21.21` (Vercel IP)
- ❌ NIET `217.21.190.139` (oud Combell IP)

---

## 📋 FINALE DNS CONFIGURATIE

### A-records (slechts 1):
```
reserve4you.com → 76.76.21.21
```

### CNAME-records (4):
```
www.reserve4you.com → 92337baae00872fb.vercel-dns-017.com
autoconfig.reserve4you.com → autoconfig.mailprotect.be
autodiscover.reserve4you.com → autodiscover.mailprotect.be
mail.reserve4you.com → pop3.mailprotect.be
```

### MX-records (2):
```
reserve4you.com → mx.mailprotect.be (priority 10)
reserve4you.com → mx.backup.mailprotect.be (priority 50)
```

---

## ⏰ TIJDLIJN

1. **Nu:** Verwijder www A-record
2. **Direct-5 min:** DNS propagatie start
3. **5-10 min:** www.reserve4you.com wijst naar Vercel
4. **10-15 min:** Website volledig bereikbaar
5. **15-20 min:** HTTPS volledig werkend

---

## 🎯 VERWACHT RESULTAAT

Na DNS propagatie:
- ✅ https://reserve4you.com → Werkt!
- ✅ https://www.reserve4you.com → Werkt!
- ✅ Email blijft werken via MailProtect
- ✅ SSL certificaten actief (Vercel heeft ze al uitgegeven!)

---

## 💡 WAAROM DIT NODIG IS

DNS heeft een **prioriteits-volgorde**:
1. **A-record** (hoogste prioriteit)
2. **CNAME** (lagere prioriteit)

Als er BEIDE bestaan voor hetzelfde subdomain, wint de A-record ALTIJD.

Je hebt een nieuwe CNAME toegevoegd, maar de oude A-record staat er nog.
Daarom moet de oude A-record weg!

---

**SAMENVATTING:**
1. Open Combell DNS → A-records
2. Zoek: www → 217.21.190.139
3. Klik drie puntjes → Verwijderen
4. Wacht 10 minuten
5. Test met ./TEST_WWW_DNS.sh
6. ✅ Klaar!


