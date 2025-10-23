# 🎯 ASSIGN DOMAIN IN VERCEL - STAP-VOOR-STAP

## ⚠️ BELANGRIJK: DOE DIT EERST!

### STAP 0: Update A-record naar nieuw IP

**Ga naar Combell DNS eerst!**

1. https://www.combell.com/nl/mycombell
2. Mijn producten → Domeinnamen → reserve4you.com
3. DNS tab → **A-records**
4. **Bewerk** de reserve4you.com record
5. Wijzig IP: `76.76.21.21` → `216.198.7.91`
6. Klik **Opslaan**
7. **Wacht 5-10 minuten**

**Test daarna:**
```bash
dig reserve4you.com A +short
```

Moet tonen: `216.198.7.91` ✅

---

## STAP 1: ASSIGN DOMAIN VIA DEPLOYMENT MENU

### Optie A: Via deployment menu (wat je zag in screenshot)

1. Ga naar: https://vercel.com/sicparvisventures/reserve4you/deployments
2. Je ziet je huidige deployment: **GVWbQXN57** (Production, Current, Ready)
3. Klik op de **drie puntjes** `⋮` rechts bij deze deployment
4. In het menu zie je: **"Assign Domain"**
5. Klik op **"Assign Domain"**

### Wat er gebeurt:

Een popup verschijnt met:
```
┌─────────────────────────────────────┐
│ Assign Domain to Deployment         │
│                                     │
│ Domain:                             │
│ ┌─────────────────────────────────┐ │
│ │ reserve4you.com                 │ │
│ └─────────────────────────────────┘ │
│                                     │
│        [Cancel]  [Assign Domain]    │
└─────────────────────────────────────┘
```

6. Typ in het veld: **`reserve4you.com`**
7. Klik **"Assign Domain"**

---

## STAP 2: ASSIGN DOMAIN VIA SETTINGS (ALTERNATIEF)

Als de bovenstaande methode niet werkt:

### Via Settings → Domains:

1. Ga naar: https://vercel.com/sicparvisventures/reserve4you/settings/domains
2. Klik op **"Add Domain"** (boven rechts)
3. Voer in: `reserve4you.com`
4. Klik **"Add"**
5. Vercel checkt DNS configuratie
6. Als DNS correct is: ✅ Domain wordt toegevoegd
7. Als DNS niet correct is: ❌ Error → Update DNS eerst!

---

## 🔧 ALS "ASSIGN DOMAIN" NIET LUKT

### Foutmelding: "Domain is already added"

Dit betekent dat het domein al in je project zit, maar niet gekoppeld is aan de deployment.

**Oplossing:**

1. Ga naar **Settings** → **Domains**
2. Bij `reserve4you.com`: klik **"Edit"**
3. Check of het domein op **"Production"** staat
4. Check of **"Branch"** op `main` staat
5. Klik **"Save"**

### Foutmelding: "DNS not configured correctly"

Dit betekent dat je A-record nog niet naar `216.198.7.91` wijst.

**Oplossing:**

1. Update A-record in Combell (zie STAP 0)
2. Wacht 10 minuten voor DNS propagatie
3. Probeer opnieuw

### Foutmelding: "Invalid domain"

**Oplossing:**

1. Check spelling: `reserve4you.com` (zonder www)
2. Probeer ook: `www.reserve4you.com`
3. Zorg dat domein eigendom is geclaimd

---

## STAP 3: VERIFIEER DOMAIN ASSIGNMENT

### Check in Vercel:

1. Ga naar **Settings** → **Domains**
2. Je zou moeten zien:

```
Domain                      Status              Branch
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
reserve4you.com             ✅ Valid             main (Production)
www.reserve4you.com         ✅ Valid             main (Production)
reserve4you.vercel.app      ✅ Valid             main (Production)
```

---

## STAP 4: TEST DE WEBSITE

### Na domain assignment + DNS update:

**Wacht 5-10 minuten**, dan test:

```bash
# Check DNS
dig reserve4you.com A +short
# Moet tonen: 216.198.7.91

# Test website
curl -I https://reserve4you.com
# Moet tonen: HTTP/2 200
```

**In browser:**
```
https://reserve4you.com → Je app! ✅
https://www.reserve4you.com → Redirect → Je app! ✅
```

---

## 🎯 VOLLEDIGE WORKFLOW

### Juiste volgorde:

1. ✅ **Combell DNS:** Wijzig A-record naar 216.198.7.91
2. ⏳ **Wacht:** 5-10 minuten voor DNS propagatie
3. ✅ **Vercel:** Klik "Refresh" bij domains (Settings → Domains)
4. ✅ **Vercel:** Domain wordt automatisch assigned aan Production
5. ⏳ **Wacht:** 5 minuten voor SSL activatie
6. 🎉 **Test:** https://reserve4you.com werkt!

---

## 💡 WAAROM "ASSIGN DOMAIN" NODIG IS

**Assign Domain** koppelt een specifieke deployment aan een domain.

- **Production domains** → automatisch gekoppeld aan laatste main branch deployment
- **Preview domains** → gekoppeld aan specifieke branch/PR
- **Custom assignment** → handmatig koppelen aan specifieke deployment

Als je domein al in Settings → Domains staat en op "Production" staat, dan is "Assign Domain" **niet nodig** - het gebeurt automatisch!

---

## 🆘 TROUBLESHOOTING

### Probleem: "Assign Domain" knop is disabled/grijs

**Oorzaak:** Domain is al assigned aan een andere deployment

**Oplossing:**
1. Settings → Domains → Check welke deployment het domein heeft
2. Promote de juiste deployment naar Production
3. Of: verwijder domain en voeg opnieuw toe

### Probleem: Domain blijft op oude deployment

**Oplossing:**
1. Ga naar Deployments
2. Vind de deployment die je wilt (bijv. GVWbQXN57)
3. Klik drie puntjes → **"Promote to Production"**
4. Domain wordt nu automatisch gekoppeld aan deze deployment

### Probleem: Website toont nog steeds oude versie

**Oorzaak:** Browser cache of Vercel edge cache

**Oplossing:**
```bash
# Clear cache
# Safari: Option + Command + E
# Chrome: Cmd + Shift + R

# Of test in incognito/private window
```

---

## 📋 CHECKLIST

Vink af wat je hebt gedaan:

- [ ] Combell DNS: A-record wijzigen naar 216.198.7.91
- [ ] Wacht 10 minuten voor DNS propagatie
- [ ] Vercel: Settings → Domains → Klik "Refresh"
- [ ] Check: reserve4you.com status = "Valid"
- [ ] Check: www.reserve4you.com status = "Valid"
- [ ] Test: dig reserve4you.com → toont 216.198.7.91
- [ ] Test: https://reserve4you.com → werkt
- [ ] Test: https://www.reserve4you.com → redirect werkt

---

## 🎉 SUCCESS!

Als alle checkboxes ✅ zijn:

**Je website is live op:**
- https://reserve4you.com 🚀
- https://www.reserve4you.com 🚀

**Email blijft werken via:**
- MailProtect (MX records intact)

**SSL certificaten:**
- Automatisch uitgegeven door Vercel/Let's Encrypt
- Auto-renewal elke 90 dagen

---

**VOLGENDE STAP:** 
1. Update A-record naar 216.198.7.91 in Combell
2. Wacht 10 minuten
3. Refresh in Vercel
4. Done! 🎉

