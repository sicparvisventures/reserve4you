# 🔄 UPDATE NAAR NIEUW VERCEL IP-ADRES

## 🎯 VERCEL HEEFT HUN IP GEWIJZIGD!

**Oude IP:** 76.76.21.21
**Nieuwe IP:** 216.198.7.91 ← **GEBRUIK DEZE!**

Vercel zegt:
> "As part of a planned IP range expansion, you may notice new records above. 
> The old records of cname.vercel-dns.com and 76.76.21.21 will continue to 
> work but we recommend you use the new ones."

---

## ✅ STAPPEN OM TE FIXEN:

### STAP 1: Open Combell DNS

1. Ga naar: https://www.combell.com/nl/mycombell
2. Login
3. **Mijn producten** → **Domeinnamen**
4. Klik op **reserve4you.com**
5. Klik op tab **"DNS"**

### STAP 2: Ga naar A-records

In het linkermenu: klik **"A-records"**

### STAP 3: Bewerk de apex A-record

Je ziet nu:
```
Record: reserve4you.com (of @)
IP-adres: 76.76.21.21
TTL: 3600
```

**Wijzig deze:**

1. Klik op **drie puntjes** `⋮` of **"Bewerken"** rechts bij deze record
2. Wijzig het IP-adres:
   - **Van:** `76.76.21.21`
   - **Naar:** `216.198.7.91`
3. TTL laten op `3600`
4. Klik **"Opslaan"**

### STAP 4: Verifieer

Na opslaan zou je moeten hebben:

**A-records (1 record):**
```
reserve4you.com → 216.198.7.91 ✅
```

**CNAME-records (blijven hetzelfde):**
```
www.reserve4you.com → 92337baae00872fb.vercel-dns-017.com ✅
autoconfig.reserve4you.com → autoconfig.mailprotect.be ✅
autodiscover.reserve4you.com → autodiscover.mailprotect.be ✅
mail.reserve4you.com → pop3.mailprotect.be ✅
```

---

## ⏰ WACHT OP DNS PROPAGATIE

### Direct na opslaan (5-10 minuten):

Test DNS:
```bash
dig reserve4you.com A +short
```

Moet tonen: **216.198.7.91** (niet meer 76.76.21.21)

---

## 🔄 REFRESH VERCEL

### Na DNS propagatie (10 minuten):

1. Ga naar: https://vercel.com/dietmarkuh-6243s-projects/reserve4you/settings/domains
2. Bij `reserve4you.com`: klik **"Refresh"**
3. Oranje waarschuwing "DNS Change Recommended" zou moeten verdwijnen
4. Status wordt: ✅ **"Valid Configuration"**

---

## 🧪 TEST DE WEBSITE

### Na Vercel refresh (15-20 minuten totaal):

**Browser test:**
```
https://reserve4you.com → Werkt! ✅
https://www.reserve4you.com → Werkt! ✅
```

**Terminal test:**
```bash
curl -I https://reserve4you.com
```

Zou moeten tonen:
```
HTTP/2 200
server: Vercel
```

---

## 📋 FINALE DNS CONFIGURATIE

### A-record (apex):
```
@ (reserve4you.com) → A → 216.198.7.91
```

### CNAME-records (subdomains):
```
www → CNAME → 92337baae00872fb.vercel-dns-017.com
autoconfig → CNAME → autoconfig.mailprotect.be
autodiscover → CNAME → autodiscover.mailprotect.be
mail → CNAME → pop3.mailprotect.be
```

### MX-records (email):
```
@ → MX → mx.mailprotect.be (priority 10)
@ → MX → mx.backup.mailprotect.be (priority 50)
```

---

## 💡 WAAROM DIT NODIG IS

Vercel heeft een **"planned IP range expansion"** gedaan. 

**Oude setup (werkt nog, maar deprecated):**
- IP: 76.76.21.21
- CNAME: cname.vercel-dns.com

**Nieuwe setup (aanbevolen):**
- IP: 216.198.7.91
- CNAME: {unique-hash}.vercel-dns-017.com

Het oude IP blijft werken, maar Vercel raadt aan om het nieuwe IP te gebruiken voor betere performance en toekomstige compatibiliteit.

---

## 🎯 SAMENVATTING

**Probleem:**
Je gebruikt het oude Vercel IP (76.76.21.21), maar Vercel wil dat je het nieuwe IP gebruikt (216.198.7.91).

**Oplossing:**
1. Combell DNS → A-records
2. Wijzig 76.76.21.21 → 216.198.7.91
3. Wacht 10 minuten
4. Klik "Refresh" in Vercel
5. ✅ Klaar!

---

## ⏱️ TIJDLIJN

1. **Nu:** Wijzig A-record naar 216.198.7.91
2. **5-10 min:** DNS propagatie
3. **10 min:** Klik "Refresh" in Vercel
4. **15 min:** Vercel activeert domain
5. **20 min:** Website volledig bereikbaar! 🚀

---

**VOLGENDE STAP:** Wijzig de A-record nu naar 216.198.7.91!

