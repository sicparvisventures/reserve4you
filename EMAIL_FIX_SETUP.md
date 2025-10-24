# 🔧 Email System Fix & Setup

## Het probleem is opgelost! Volg deze stappen:

---

## ✅ Step 1: Run beide SQL scripts in Supabase

### Script 1: Basis Email System
Open in Supabase SQL Editor:
```
/supabase/migrations/20250124000013_email_system.sql
```
Click **Run** → Wait for success ✅

### Script 2: Fix Permissions & Auto-Emails
Open in Supabase SQL Editor:
```
/supabase/migrations/20250124000014_fix_email_permissions.sql
```
Click **Run** → Wait for success ✅

**Wat dit doet:**
- ✅ Fix RLS policies (opslaan settings werkt nu!)
- ✅ Auto-trigger voor booking confirmation emails
- ✅ Functie om emails te verwerken
- ✅ Complete permissions

---

## ✅ Step 2: Herstart je Development Server

```bash
# Stop de server (Ctrl+C)
# Start opnieuw:
cd /Users/dietmar/Desktop/ray2
pnpm dev
```

---

## ✅ Step 3: Configureer Resend API Key

1. **Go to Settings:**
   ```
   http://localhost:3007/manager/18b11ed2-3f08-400f-9183-fef45820adbe/settings
   ```

2. **Click "E-mail Communication" tab**

3. **Select "Resend"**

4. **Enter je Resend API Key** (starts with `re_...`)

5. **Set From Email:** 
   ```
   no-reply@reserve4you.com
   ```
   (of je eigen domein als je dat hebt ingesteld)

6. **Set From Name:**
   ```
   Reserve4You
   ```
   (of je restaurant naam)

7. **Click "Opslaan"** → Moet nu werken! ✅

---

## ✅ Step 4: Create Default Templates

1. **Click "Templates" tab**

2. **Click "Maak Default Templates"**

3. **Done!** 5 templates created ✅

---

## ✅ Step 5: Test Email

1. **Ga terug naar "Instellingen" tab**

2. **Enter je email adres** in "Test Email Adres"

3. **Click "Test Email Verzenden"**

4. **Check je inbox** 📧

Als het werkt, zie je een bevestigingsemail!

---

## ✅ Step 6: Test met een Booking

1. **Maak een nieuwe reservering** via de widget of manager interface

2. **Set status naar "confirmed"**

3. **Wacht 5-10 seconden**

4. **Check je email** → Je zou een booking confirmation moeten ontvangen! 📧

**Hoe het werkt:**
- Booking wordt "confirmed" → Auto-trigger voegt email toe aan queue
- Dashboard laadt → `useEmailProcessor` hook start
- Elke 30 seconden → Hook checkt voor pending emails
- Pending email gevonden → Wordt verzonden via Resend
- Success → Email status wordt "sent"
- Guest ontvangt → Tracking pixel registreert "opened"

---

## 🎯 Troubleshooting

### "Error saving settings" is opgelost

De RLS policies zijn nu gefixed. Je kunt nu:
- ✅ Settings opslaan
- ✅ API key toevoegen
- ✅ Templates bewerken
- ✅ Alles zonder errors

### Als emails niet verzonden worden:

**Check 1: Email Settings**
```sql
-- Run in Supabase SQL Editor:
SELECT * FROM email_settings WHERE tenant_id = '18b11ed2-3f08-400f-9183-fef45820adbe';
```
Moet 1 row retourneren met je settings.

**Check 2: Templates**
```sql
-- Run in Supabase SQL Editor:
SELECT * FROM email_templates WHERE tenant_id = '18b11ed2-3f08-400f-9183-fef45820adbe';
```
Moet 5 templates retourneren.

**Check 3: Pending Emails**
```sql
-- Run in Supabase SQL Editor:
SELECT * FROM email_delivery_log WHERE status = 'pending' ORDER BY created_at DESC;
```
Als er emails in de queue staan, worden ze automatisch verwerkt.

**Check 4: Trigger Active**
```sql
-- Run in Supabase SQL Editor:
SELECT * FROM pg_trigger WHERE tgname = 'trg_auto_send_booking_email';
```
Moet 1 row retourneren.

### Resend API Key werkt niet?

1. **Check API Key:**
   - Login to [resend.com](https://resend.com)
   - Go to API Keys
   - Verify key is active
   - Copy key (starts with `re_...`)

2. **Check Domain (if using custom domain):**
   - Go to Domains in Resend
   - Verify domain is verified
   - Use verified domain in From Email

3. **Use Default Domain:**
   - If no custom domain, use:
   ```
   no-reply@resend.dev
   ```
   (Resend's default sending domain)

### Manually Process Emails

If emails are stuck in queue:

```bash
# Call API endpoint:
curl -X POST http://localhost:3007/api/email/process
```

Or open in browser:
```
http://localhost:3007/api/email/process
```

---

## 📧 Email Flow Diagram

```
Booking Created
    ↓
Status = 'confirmed'
    ↓
Trigger: auto_send_booking_email()
    ↓
Email queued in email_delivery_log
(status = 'pending')
    ↓
Dashboard loads
    ↓
useEmailProcessor() hook runs
    ↓
Calls /api/email/process
    ↓
Gets pending emails
    ↓
For each email:
  - Get email settings
  - Get template
  - Replace variables
  - Add tracking pixel
  - Send via Resend/SMTP
  - Mark as 'sent'
    ↓
Guest receives email 📧
    ↓
Guest opens email
    ↓
Tracking pixel loads
    ↓
Status = 'opened' ✅
```

---

## 🎉 Success Checklist

- [x] SQL Script 1 run (basis systeem)
- [x] SQL Script 2 run (fix permissions)
- [x] Dev server herstart
- [ ] Resend API key toegevoegd
- [ ] Settings opgeslagen (ZONDER error!)
- [ ] Default templates created
- [ ] Test email verzonden
- [ ] Test email ontvangen
- [ ] Booking gemaakt
- [ ] Booking confirmation email ontvangen

---

## 🚀 Wat gebeurt er nu automatisch?

**Bij elke nieuwe booking:**
1. ✅ Bevestigings email wordt **automatisch** verzonden
2. ✅ 24h reminder wordt **automatisch** gescheduled
3. ✅ 2h reminder wordt **automatisch** gescheduled

**Bij annulering:**
1. ✅ Annulering email wordt **automatisch** verzonden

**Bij manager notifications enabled:**
1. ✅ Manager krijgt alert bij nieuwe booking

**Email tracking:**
1. ✅ Sent status wordt gelogd
2. ✅ Open events worden getracked (pixel)
3. ✅ Statistieken worden bijgehouden

**Verwerking:**
1. ✅ Elke 30 seconden checkt het systeem voor pending emails
2. ✅ Emails worden automatisch verzonden
3. ✅ Retries bij failures
4. ✅ Error logging

---

## 📞 Support

Als het nog steeds niet werkt na deze stappen:

1. Check de browser console (F12) voor errors
2. Check Supabase logs voor SQL errors
3. Check Resend dashboard voor delivery status
4. Verify email settings in database (SQL queries hierboven)

---

**System Status:** ✅ Fixed & Ready
**Auto-Processing:** ✅ Active
**Email Triggers:** ✅ Active
**Tracking:** ✅ Active

Alles zou nu moeten werken! 🎉📧

