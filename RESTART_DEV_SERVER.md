# 🔄 RESTART DEV SERVER - Instructies

## Probleem
```
Missing required error components, refreshing...
```

Dit is een **build error** - de server heeft de nieuwe code nog niet geladen.

---

## ✅ Oplossing (2 Minuten)

### Stap 1: Stop Server
```bash
# In je terminal waar npm run dev draait:
Druk: Ctrl+C

# Je zou moeten zien:
^C
# Server stopt
```

### Stap 2: Clean Build Cache
```bash
# Run dit in je terminal:
cd /Users/dietmar/Desktop/ray2
rm -rf .next/cache
```

### Stap 3: Restart Server
```bash
npm run dev
```

### Stap 4: Wacht Op Ready
```bash
# Je zou moeten zien:
▲ Next.js 15.0.3
- Local:        http://localhost:3007
- Network:      http://192.168.x.x:3007

✓ Ready in 3.2s
```

**Als je GEEN errors ziet → Server is klaar!** ✅

---

## 📊 Check: Is Build Error Weg?

### ✅ Goed (geen errors):
```
✓ Ready in 2.5s
○ Compiling / ...
✓ Compiled / in 1.2s
```

### ❌ Slecht (nog errors):
```
✗ Module not found: Can't resolve '@/lib/auth/...'
```

**Als je nog errors ziet:**
```bash
# Nuclear option:
rm -rf .next node_modules
npm install
npm run dev
```

---

## 🎯 Na Restart: Test

### Ga naar:
```
http://localhost:3007/manager
```

**Verwacht:**
- ✅ Laadt zonder "missing components" error
- ✅ Toont je tenants (of redirect naar onboarding)
- ✅ Geen rode errors

---

## 📋 Terminal Commands Samenvatting

```bash
# 1. Stop server
Ctrl+C

# 2. Clean cache (optioneel maar aangeraden)
rm -rf .next/cache

# 3. Restart
npm run dev

# 4. Wacht op "Ready in XXs"

# 5. Test in browser:
# http://localhost:3007/manager
```

---

## 🆘 Als Het Niet Werkt

### Scenario A: Build errors blijven
```bash
rm -rf .next
npm run dev
```

### Scenario B: Port 3007 already in use
```bash
# Kill process op port 3007:
lsof -ti:3007 | xargs kill -9

# Dan restart:
npm run dev
```

### Scenario C: Module not found errors
```bash
# Reinstall dependencies:
rm -rf node_modules .next
npm install
npm run dev
```

---

## ✅ Success Criteria

Server is klaar als je ziet:
- ✓ Ready in XXs
- Geen rode errors in terminal
- Browser laadt zonder "missing components"

**Dan kun je verder met SQL fixes!** 🚀

