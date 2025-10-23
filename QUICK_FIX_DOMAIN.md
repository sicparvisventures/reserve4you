# ⚡ QUICK FIX - DOMEIN WERKEND MAKEN

## 🚨 HET PROBLEEM

DNS wijst nog naar het **OUDE** Vercel IP:
```
reserve4you.com → 76.76.21.21 ❌ (oud)
```

Moet zijn:
```
reserve4you.com → 216.198.7.91 ✅ (nieuw)
```

---

## ✅ OPLOSSING IN 3 STAPPEN

### STAP 1: UPDATE A-RECORD IN COMBELL (5 minuten)

**Ga naar:**
1. https://www.combell.com/nl/mycombell
2. Login
3. **Mijn producten** → **Domeinnamen**
4. Klik **reserve4you.com**
5. Klik tab **"DNS"**
6. Linkermenu: klik **"A-records"**

**Bewerk de record:**
7. Je ziet: `reserve4you.com → 76.76.21.21`
8. Klik op **drie puntjes** `⋮` rechts
9. Klik **"Bewerken"**
10. Wijzig IP naar: **`216.198.7.91`**
11. Klik **"Opslaan"**

✅ **Klaar met Combell!**

---

### STAP 2: WACHT 10 MINUTEN

DNS moet propageren. Wacht 10 minuten.

**Test in terminal:**
```bash
dig reserve4you.com A +short
```

Als het `216.198.7.91` toont → **klaar voor stap 3!**

---

### STAP 3: REFRESH IN VERCEL (2 minuten)

**Ga naar:**
1. https://vercel.com/sicparvisventures/reserve4you/settings/domains

**Refresh beide domains:**
2. Bij `reserve4you.com`: klik **"Refresh"**
3. Bij `www.reserve4you.com`: klik **"Refresh"**

**Check status:**
4. Beide domains moeten nu **✅ Valid Configuration** tonen
5. Oranje waarschuwing moet weg zijn

✅ **Klaar!**

---

## 🎉 TEST JE WEBSITE

**Wacht nog 5 minuten**, dan:

```
https://reserve4you.com → Je app werkt! ✅
https://www.reserve4you.com → Redirect werkt! ✅
```

---

## 💡 OVER "ASSIGN DOMAIN"

Je zag in de deployment een optie "Assign Domain". Dat is **NIET nodig** als:

1. ✅ Je domein staat al in Settings → Domains
2. ✅ Domain is ingesteld op "Production"
3. ✅ DNS is correct geconfigureerd

Vercel koppelt automatisch je Production domain aan de laatste deployment op de `main` branch.

**"Assign Domain" gebruik je alleen als:**
- Je een specifieke oude deployment wilt tonen
- Je een preview deployment wilt koppelen aan een domein
- Je handmatig een deployment wilt promoten

**Voor normale productie: niet nodig!** ✨

---

## 🔧 ALS HET NOG NIET WERKT NA STAP 3

### Optie: Promote huidige deployment

Als je zeker wilt zijn dat de juiste deployment wordt gebruikt:

1. Ga naar: https://vercel.com/sicparvisventures/reserve4you/deployments
2. Je ziet **GVWbQXN57** (Current, Ready) bovenaan
3. Klik **drie puntjes** `⋮` rechts
4. Klik **"Promote to Production"**
5. Bevestig

Dit forceert Vercel om deze deployment aan je domains te koppelen.

---

## 📋 SAMENVATTING

**Probleem:**
- A-record wijst naar oud IP (76.76.21.21)
- Vercel verwacht nieuw IP (216.198.7.91)

**Oplossing:**
1. Combell: Wijzig A-record → 216.198.7.91
2. Wacht 10 minuten
3. Vercel: Klik "Refresh"
4. ✅ Werkt!

**"Assign Domain" nodig?**
Nee, gebeurt automatisch voor Production domains!

---

**START NU MET STAP 1!** 🚀

