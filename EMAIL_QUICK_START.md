# 📧 Email System - Quick Start

## Setup in 5 Minutes

### Step 1: Run SQL Migration ⚡

```sql
-- Open in Supabase SQL Editor:
/supabase/migrations/20250124000013_email_system.sql
```

Click **Run** → Wait for success ✅

### Step 2: Configure Email Provider

#### Option A: Resend (Easiest)

1. Go to [resend.com](https://resend.com) → Sign up (FREE)
2. Create API Key → Copy it
3. Go to: `http://localhost:3007/manager/{tenantId}/settings`
4. Click **E-mail Communication** tab
5. Select **Resend**
6. Paste API key
7. Set From Email: `no-reply@yourdomain.com`
8. Set From Name: `Your Restaurant`
9. Click **Opslaan**

#### Option B: Combell SMTP

**Get Your Combell SMTP Settings:**
1. Login to Combell → My Combell → Email
2. Click your email → Configuration
3. Copy these:
   - **SMTP Host**: `smtp.combell.com` (or `mail.yourdomain.com`)
   - **Port**: `587` (or `465` for SSL)
   - **Username**: Your full email address
   - **Password**: Your email password

**In Reserve4You:**
1. Go to Settings → E-mail Communication
2. Select **SMTP**
3. Enter all SMTP details
4. Toggle SSL/TLS if using port 465
5. Click **Opslaan**

### Step 3: Create Templates

1. Click **Templates** tab
2. Click **Maak Default Templates**
3. Done! ✅ 5 templates created

### Step 4: Test Email

1. Enter your email address
2. Click **Test Email Verzenden**
3. Check your inbox 📧

---

## ✅ What You Get

**Auto-Emails:**
- ✅ Booking confirmation (instant)
- ✅ 24h reminder (auto-scheduled)
- ✅ 2h reminder (auto-scheduled)
- ✅ Cancellation confirmation
- ✅ Manager notifications

**Tracking:**
- ✅ Email sent
- ✅ Delivered
- ✅ Opened (pixel tracking)
- ✅ Failed/bounced

**Stats:**
- ✅ Total sent
- ✅ Open rate %
- ✅ Per-template breakdown
- ✅ 30-day overview

---

## 🎯 Quick Tips

**Edit Templates:**
Settings → E-mail Communication → Templates → Bewerken

**View Stats:**
Settings → E-mail Communication → Statistieken

**Available Variables:**
`{guest_name}`, `{date}`, `{time}`, `{party_size}`, `{location_name}`, `{location_address}`, `{location_phone}`

**Toggle Features:**
Enable/disable confirmations, reminders, manager notifications

---

## 📍 Combell SMTP Quick Reference

**Host Options:**
- `smtp.combell.com` (general)
- `mail.yourdomain.com` (if you have domain)

**Ports:**
- `587` - Use with STARTTLS (recommended)
- `465` - Use with SSL (enable SSL toggle)

**Username:**
- Your FULL email address
- Example: `info@restaurant.be`

**Password:**
- Your email account password
- Set in Combell control panel

---

## 🚨 Troubleshooting

**Test Email Fails?**
- Check API key (Resend)
- Check SMTP credentials (Combell)
- Verify From Email is valid
- Check spam folder

**Reminders Not Sending?**
- Enable "Booking Herinneringen" toggle
- Enable 24h/2h reminders
- Booking must be status 'confirmed'

**No Templates?**
- Click "Maak Default Templates"
- Or run SQL: `SELECT create_default_email_templates('tenant-id');`

---

## ✅ Done!

Your email system is ready. Bookings will automatically trigger confirmations and reminders!

For detailed docs, see `EMAIL_SYSTEM_COMPLETE.md`

