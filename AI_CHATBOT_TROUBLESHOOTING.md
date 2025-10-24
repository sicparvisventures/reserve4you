# 🐛 AI CHATBOT TROUBLESHOOTING

## ❌ VEEL VOORKOMENDE ERRORS & FIXES

### Error 1: "functions in index predicate must be marked IMMUTABLE"

**Oorzaak**: PostgreSQL staat geen `CURRENT_DATE` in index WHERE clauses toe

**Fix**: Run deze SQL in Supabase:
```sql
/Users/dietmar/Desktop/ray2/supabase/migrations/20250124000003_fix_indexes.sql
```

**Of handmatig**:
```sql
DROP INDEX IF EXISTS idx_bookings_tenant_date;
CREATE INDEX idx_bookings_tenant_date ON bookings(location_id, booking_date);
```

---

### Error 2: "AI response failed" (Frontend)

**Mogelijke oorzaken**:

#### A. OpenAI API Key niet geconfigureerd
```bash
# Check .env.local
cat .env.local | grep OPENAI

# Moet zijn:
OPENAI_API_KEY=sk-proj-...
```

**Fix**:
```bash
nano .env.local
# Voeg toe: OPENAI_API_KEY=sk-proj-your-key-here
# Save: CTRL+X → Y → Enter
pnpm dev  # Restart
```

#### B. Ongeldige API Key
**Symptomen**: 401 error in console

**Fix**:
1. Ga naar https://platform.openai.com/api-keys
2. Revoke oude key
3. Create new key
4. Update .env.local
5. Restart server

#### C. Insufficient Quota
**Symptomen**: "insufficient_quota" in logs

**Fix**:
1. Ga naar https://platform.openai.com/account/billing
2. Add payment method
3. Add credits ($5 minimum)
4. Wait 5 minutes
5. Try again

#### D. Model Not Found
**Symptomen**: "model_not_found" error

**Fix**: Change model in `/app/api/ai/chat/route.ts`:
```typescript
model: 'gpt-3.5-turbo',  // Instead of gpt-4-turbo-preview
```

#### E. Database Connection Error
**Symptomen**: Error in analyticsData

**Fix**:
1. Check Supabase connection
2. Verify RLS policies
3. Check membership exists
4. Run SQL migrations

---

### Error 3: "Cannot find module 'openai'"

**Oorzaak**: Package niet geïnstalleerd

**Fix**:
```bash
pnpm add openai
pnpm dev
```

---

### Error 4: Chatbot button niet zichtbaar

**Oorzaak**: Component niet gerenderd

**Fix**:
1. Hard refresh: CMD+SHIFT+R (Mac) / CTRL+SHIFT+R (Windows)
2. Check console voor errors
3. Verify import in dashboard page:
```typescript
import { AIChatbot } from '@/components/ai/AIChatbot';
```

---

### Error 5: "Unauthorized" (401)

**Oorzaak**: Geen membership in tenant

**Fix**: Verify user is member:
```sql
SELECT * FROM memberships 
WHERE user_id = 'your-user-id' 
AND tenant_id = 'your-tenant-id';
```

---

### Error 6: Slow responses (>10 seconds)

**Oorzaak**: Large context of slow API

**Fixes**:
1. Reduce conversation history (in AIChatbot.tsx):
```typescript
conversationHistory: messages.slice(-5)  // Last 5 instead of 10
```

2. Switch to faster model:
```typescript
model: 'gpt-3.5-turbo',  // Much faster
```

3. Reduce max_tokens:
```typescript
max_tokens: 500,  // Instead of 1000
```

---

## 🔍 DEBUG CHECKLIST

### Frontend Debug
```typescript
// In components/ai/AIChatbot.tsx
console.log('Sending message:', messageToSend);
console.log('TenantId:', tenantId);
console.log('Response:', data);
```

### Backend Debug
```typescript
// In app/api/ai/chat/route.ts
console.log('[AI Chat] Request received:', { message, tenantId });
console.log('[AI Chat] Analytics data:', analyticsData);
console.log('[AI Chat] OpenAI response:', aiResponse);
```

### Check Browser Console
```
F12 → Console tab
Look for errors in red
```

### Check Server Logs
```bash
# Terminal waar pnpm dev draait
# Kijk naar output
```

### Check Network Tab
```
F12 → Network tab
Filter: /api/ai/chat
Check status code, response
```

---

## ✅ WORKING SETUP VERIFICATION

Run deze checks:

### 1. Package Installed
```bash
grep "openai" package.json
# Should show: "openai": "^6.6.0"
```

### 2. Environment Variable
```bash
grep OPENAI_API_KEY .env.local
# Should show: OPENAI_API_KEY=sk-proj-...
```

### 3. SQL Functions Exist
```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name LIKE 'get_ai_%';

-- Should return 5 functions:
-- get_ai_booking_analytics
-- get_ai_guest_insights
-- get_ai_revenue_analysis
-- get_ai_trend_analysis
-- get_ai_recommendations
```

### 4. OpenAI API Key Valid
```bash
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY" | jq '.data[0].id'
# Should return: "gpt-4" or model name
```

### 5. Component Rendered
```
Open dashboard → F12 → Elements tab
Search for: "AI Assistent"
Should find the floating button
```

---

## 🚨 EMERGENCY FIX

Als NIETS werkt, start from scratch:

```bash
# 1. Clean install
rm -rf node_modules
rm pnpm-lock.yaml
pnpm install

# 2. Add OpenAI
pnpm add openai

# 3. Verify .env.local
cat .env.local

# 4. Restart
pnpm dev

# 5. Hard refresh browser
CMD+SHIFT+R
```

---

## 📞 STILL STUCK?

Check deze in volgorde:

1. ✅ OpenAI package installed? → `pnpm add openai`
2. ✅ API key in .env.local? → Add it
3. ✅ API key valid? → Create new one
4. ✅ OpenAI billing active? → Add payment method
5. ✅ SQL functions created? → Run migrations
6. ✅ Indexes fixed? → Run fix_indexes.sql
7. ✅ Server restarted? → `pnpm dev`
8. ✅ Browser refreshed? → CMD+SHIFT+R

If all checked and still not working:
- Check browser console for specific error
- Check server logs for detailed error
- Verify Supabase connection works
- Test OpenAI API with curl

---

## 💡 TIPS

**Cost Saving**:
- Use gpt-3.5-turbo voor simple queries
- Limit conversation history
- Set reasonable max_tokens

**Performance**:
- Cache frequent queries
- Use database functions instead of raw data
- Implement rate limiting

**Monitoring**:
- Check OpenAI usage dashboard daily
- Set up cost alerts
- Monitor error rates

---

**Updated**: 24 Oktober 2025  
**Version**: 1.1  
**Status**: Troubleshooting Guide

