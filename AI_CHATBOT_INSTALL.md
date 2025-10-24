# 🚀 AI CHATBOT - QUICK INSTALL GUIDE

## ⚡ 3 STAPPEN INSTALLATIE

### STAP 1: Install OpenAI Package

```bash
cd /Users/dietmar/Desktop/ray2
pnpm add openai
```

### STAP 2: Environment Variable

⚠️ **SECURITY WAARSCHUWING**: De API key die je deelde is gecompromitteerd!

**Actie vereist**:
1. Ga naar https://platform.openai.com/api-keys
2. Revoke/Delete key die eindigt op: `...B_3gA`
3. Create new key: "Reserve4You Production"
4. Kopieer nieuwe key

**Toevoegen aan .env.local**:
```bash
# Open/create .env.local
nano .env.local

# Voeg toe (onderaan):
OPENAI_API_KEY=sk-proj-JOUW_NIEUWE_KEY_HIER
```

**Save & Exit**: CTRL+X → Y → Enter

### STAP 3: Run SQL Migration

1. Open Supabase SQL Editor
2. Ga naar: https://app.supabase.com/project/[jouw-project]/sql/new
3. Kopieer complete inhoud van: `/supabase/migrations/20250124000001_ai_analytics_functions.sql`
4. Paste in SQL Editor
5. Klik "RUN"
6. Wait voor success message

### STAP 4: Restart Server

```bash
# Stop huidige server (CTRL+C)
pnpm dev
```

## ✅ KLAAR!

Test nu op: `http://localhost:3007/manager/[tenantId]/dashboard`

Klik rechtsonder op de floating chatbot button! 💬

---

## 🐛 TROUBLESHOOT

**Error: Cannot find module 'openai'**
→ Run: `pnpm add openai`

**Error: OPENAI_API_KEY not found**
→ Check `.env.local` exists en key is toegevoegd

**Chatbot button niet zichtbaar**
→ Verify component import in dashboard page

**AI responds: "tijdelijk niet beschikbaar"**
→ Check OpenAI API key validity
→ Check OpenAI billing active

---

## 📝 NA INSTALLATIE

1. Test chatbot met voorbeeldvragen
2. Check OpenAI usage dashboard
3. Monitor costs
4. Train team op AI features

**Veel succes!** 🎉

