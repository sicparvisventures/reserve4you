# 🔥 EMERGENCY RESTART INSTRUCTIES

## Het Probleem

Je ziet: **"missing required error components, refreshing..."**

Dit is een **Next.js build cache error** - de server gebruikt nog steeds de oude foutieve build.

---

## ✅ De Oplossing: Complete Cache Clear

### STAP 1: Stop Dev Server

Ga naar je terminal waar `npm run dev` draait:

```bash
# Druk:
Ctrl+C

# Wacht tot je de prompt ziet (%)
```

---

### STAP 2: Clear ALL Caches

**Automatisch (MAKKELIJK):**

```bash
./HARD_RESTART_NOW.sh
```

**Of Handmatig:**

```bash
# Verwijder Next.js build cache
rm -rf .next

# (Optioneel) Verwijder node cache
rm -rf node_modules/.cache
```

---

### STAP 3: Start Fresh

```bash
npm run dev
```

**Wacht op:**
```
✓ Compiled successfully
○ Local: http://localhost:3007
```

**ALS je ERRORS ziet:**
- Kopieer de RODE error text
- Stuur naar mij

**ALS je "✓ Compiled successfully" ziet:**
- Ga door naar stap 4!

---

### STAP 4: Clear Browser Cache

In je browser op `localhost:3007`:

- **Mac**: `Cmd+Shift+R`
- **Windows/Linux**: `Ctrl+Shift+R`

Of open een **Incognito venster**:
- **Mac**: `Cmd+Shift+N`
- **Windows**: `Ctrl+Shift+N`

---

## ✅ Verwacht Resultaat

Na deze stappen:

1. ✅ **Geen** "missing components" error
2. ✅ Je ziet je **dashboard** of **login screen**
3. ✅ **Onboarding werkt**
4. ✅ **Kan locatie aanmaken** (geen 403)

---

## 🧪 Test Na Restart

### Test 1: Basis Check
```
URL: http://localhost:3007/manager

Verwacht:
✅ Dashboard laadt
✅ Geen error messages
✅ Ziet je eigen tenant
```

### Test 2: Onboarding Check
```
URL: http://localhost:3007/manager/onboarding?step=2&tenantId=26f3cec9-c530-4a79-8082-ddf4ecb176d3

Verwacht:
✅ Onboarding laadt
✅ Kan locatie invoeren
✅ Kan opslaan (geen 403)
```

### Test 3: Database Check
```
URL: http://localhost:3007/manager

Als je ingelogd bent:
✅ Ziet je eigen tenant naam
✅ Niet de tenant van andere user
✅ Kan naar settings
```

---

## ❌ Als Het NOG STEEDS Niet Werkt

### Check 1: Is de Server Echt Gestopt?

```bash
# Kijk of er nog Next.js processen draaien:
ps aux | grep "next dev"

# Als je iets ziet, kill het:
pkill -f "next dev"
```

### Check 2: Port 3007 Vrij?

```bash
# Kijk wat er op port 3007 draait:
lsof -i :3007

# Als er iets draait dat niet npm is, kill het:
kill -9 [PID]
```

### Check 3: Kopieer Error

Als je in de terminal een RODE error ziet:
1. Kopieer de HELE error
2. Stuur naar mij
3. Ik fix het dan verder

---

## 🎯 Quick Commands

**Complete restart in één keer:**

```bash
# Stop alles, clear cache, start fresh
pkill -f "next dev" && sleep 2 && rm -rf .next && npm run dev
```

**Check of het werkt:**

```bash
# Als je dit ziet in de terminal output:
✓ Compiled successfully  ← GOED!
✗ Failed to compile       ← SLECHT - stuur error

# In browser:
Dashboard werkt          ← GOED!
Missing components       ← SLECHT - hard refresh (Cmd+Shift+R)
```

---

## 📊 Waarom Dit Nodig Is

| Issue | Oorzaak | Oplossing |
|-------|---------|-----------|
| "missing components" | Next.js cached oude broken build | `rm -rf .next` |
| Import errors blijven | Browser cached oude JS | Hard refresh (Cmd+Shift+R) |
| 403 errors | Database membership issue | SQL al gefixed ✅ |
| Server blijft crashen | Oud process draait nog | `pkill -f "next dev"` |

---

## ✅ Checklist

- [ ] Dev server gestopt (Ctrl+C)
- [ ] Geen processes meer (`ps aux | grep next`)
- [ ] Cache verwijderd (`rm -rf .next`)
- [ ] Server opnieuw gestart (`npm run dev`)
- [ ] Ziet "✓ Compiled successfully"
- [ ] Browser cache gecleared (Cmd+Shift+R)
- [ ] localhost:3007 opent zonder errors
- [ ] Dashboard/onboarding werkt

**Als alle checks ✅ zijn = KLAAR!**

---

## 🆘 Laatste Redmiddel

Als NIETS werkt:

```bash
# Nuclear option - clean install
pkill -f "next dev"
rm -rf .next
rm -rf node_modules/.cache
npm install
npm run dev
```

Dit duurt 2-3 minuten maar lost 99% van cache issues op.

---

## 🎉 Success!

Als je dit ziet:
- ✓ Compiled successfully
- Dashboard werkt
- Onboarding werkt
- Geen error messages

**DAN IS ALLES GEFIXT!** 🚀

SQL is correct ✅
Code is correct ✅
Server is correct ✅
Cache is schoon ✅

**Ready for production!**

