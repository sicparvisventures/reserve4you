# 📧 Email Communication System - Reserve4You

## Complete Implementation Guide

Het volledige Email Communication systeem is nu geïmplementeerd met templates, automatisering, tracking en zowel Resend als SMTP (Combell) ondersteuning.

---

## 📋 What's Included

### 1. Email Providers

**Resend (Aanbevolen):**
- Modern email API
- Built-in tracking
- High deliverability
- Easy setup met API key
- 3,000 emails/maand gratis

**SMTP (Combell):**
- Gebruik je eigen mailserver
- Volledige controle
- Eigen domein
- Fallback optie

### 2. Email Templates

**5 Default Templates:**
- `booking_confirmation` - Reservering bevestiging
- `booking_reminder_24h` - Herinnering 24 uur voor
- `booking_reminder_2h` - Herinnering 2 uur voor
- `booking_cancelled` - Annulering bevestiging
- `manager_new_booking` - Alert voor manager

**Template Systeem:**
- HTML + Plain text versies
- Variable substitution: `{guest_name}`, `{date}`, `{time}`, etc.
- Per-template activatie
- Multi-language support (NL default)
- Visual editor in settings

### 3. Email Automation

**Auto-Triggers:**
- Booking confirmation op nieuwe reservering
- 24h reminder scheduling
- 2h reminder scheduling
- Manager notifications
- Cancellation confirmations

**Reminder Queue:**
- Automatic scheduling
- Time-based triggers
- Status tracking
- Retry logic

### 4. Delivery Tracking

**Tracking Features:**
- Email sent status
- Delivery confirmation
- Open tracking (pixel)
- Click tracking (links)
- Bounce detection
- Failed delivery handling

**Statistieken:**
- Total emails sent
- Delivery rate
- Open rate
- Failed emails
- Per-template breakdown
- 30-day overview

### 5. Configuration UI

**Settings Tab (`/manager/{tenantId}/settings`):**
- Provider selection (Resend/SMTP)
- API key configuration
- SMTP credentials (Combell)
- From address & name
- Reply-to address
- Feature toggles
- Test email function

**Template Editor:**
- Edit subject line
- Edit HTML content
- Edit plain text fallback
- Variable hints
- Active/inactive toggle
- Preview functionality

---

## 🚀 Installation Steps

### Step 1: Run SQL Migration

1. Open Supabase Dashboard → SQL Editor
2. Run `/supabase/migrations/20250124000013_email_system.sql`
3. Wait for success ✅

**What it creates:**
- 4 tables: `email_templates`, `email_delivery_log`, `email_settings`, `email_reminder_queue`
- 7 SQL functions for email operations
- 1 trigger for auto-scheduling reminders
- 6 indexes for performance
- RLS policies

### Step 2: Install Dependencies

Already installed ✅:
```bash
pnpm add resend nodemailer @react-email/components @react-email/render
pnpm add -D @types/nodemailer
```

### Step 3: Configure Email Provider

#### Option A: Resend (Recommended)

1. Sign up at [resend.com](https://resend.com)
2. Get API key from [resend.com/api-keys](https://resend.com/api-keys)
3. Go to Settings → E-mail Communication
4. Select "Resend"
5. Enter API key
6. Set From Email: `no-reply@yourdomain.com`
7. Set From Name: Your restaurant name
8. Click Save

#### Option B: SMTP (Combell)

**Je Combell IMAP/SMTP gegevens:**

1. Log in to Combell control panel
2. Go to Email → Email accounts
3. Find your email → Configuration
4. Get these details:
   - **SMTP Host**: Usually `smtp.combell.com` or `mail.yourdomain.com`
   - **SMTP Port**: 587 (TLS) or 465 (SSL)
   - **Username**: Your email address
   - **Password**: Email password
   - **Secure**: Enable for SSL/TLS

5. In Reserve4You Settings → E-mail Communication:
   - Select "SMTP"
   - Enter SMTP Host
   - Enter Port (587 or 465)
   - Enter Username (full email)
   - Enter Password
   - Toggle "SSL/TLS Secure" if using port 465
   - Set From Email (same as username)
   - Set From Name
   - Click Save

### Step 4: Create Default Templates

1. Go to Settings → E-mail Communication
2. Click "Templates" tab
3. If no templates exist, click "Maak Default Templates"
4. 5 templates will be created automatically

### Step 5: Test Email

1. Go to Settings → E-mail Communication
2. Enter your test email address
3. Click "Test Email Verzenden"
4. Check your inbox ✅

---

## 📍 How to Use

### Automatic Emails

**Booking Confirmation:**
- Automatically sent when booking status = 'confirmed'
- Guest receives confirmation with all details

**24h Reminder:**
- Automatically scheduled 24 hours before booking
- Sent at scheduled time
- Reminder of tomorrow's reservation

**2h Reminder:**
- Automatically scheduled 2 hours before booking
- Sent at scheduled time
- Final reminder with address

**Cancellation:**
- Sent when booking status changes to 'cancelled'
- Confirmation to guest

**Manager Notification:**
- Sent to manager when new booking created
- Contains all booking details

### Manual Email Sending

Use API endpoint:
```typescript
fetch('/api/email/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tenantId: 'tenant-uuid',
    bookingId: 'booking-uuid', // optional
    consumerId: 'consumer-uuid', // optional
    recipientEmail: 'guest@email.com',
    recipientName: 'Guest Name',
    templateType: 'booking_confirmation',
    variables: {
      guest_name: 'John Doe',
      date: '25 oktober 2025',
      time: '19:00',
      party_size: '4',
      location_name: 'Restaurant Name',
      location_address: 'Street 1, City',
      location_phone: '+31 6 12345678',
    },
  }),
});
```

### Edit Templates

1. Settings → E-mail Communication → Templates tab
2. Click "Bewerken" on any template
3. Edit Subject (use variables: `{guest_name}`, `{date}`, etc.)
4. Edit HTML content
5. Edit Plain text version
6. Toggle Active/Inactive
7. Click "Opslaan"

**Available Variables:**
- `{guest_name}` - Guest name
- `{date}` - Booking date
- `{time}` - Booking time
- `{party_size}` - Number of guests
- `{location_name}` - Restaurant name
- `{location_address}` - Full address
- `{location_phone}` - Phone number
- `{guest_email}` - Guest email
- `{guest_phone}` - Guest phone

### View Statistics

1. Settings → E-mail Communication → Statistieken tab
2. See 30-day overview:
   - Total sent
   - Delivered
   - Opened
   - Failed
   - Open rate %
   - Per template breakdown

---

## 🔧 Technical Details

### Database Tables

1. **email_templates**
   - Stores email templates
   - HTML + text versions
   - Variable definitions
   - Active/inactive status
   - Multi-language support

2. **email_delivery_log**
   - Logs all email sends
   - Tracks delivery status
   - Records opens/clicks
   - Error messages
   - Retry counts

3. **email_settings**
   - Per-tenant configuration
   - Provider credentials
   - Feature flags
   - Reminder settings

4. **email_reminder_queue**
   - Scheduled reminders
   - Time-based triggers
   - Status tracking
   - Links to bookings

### SQL Functions

1. **create_default_email_templates(tenant_id)**
   - Creates 5 default templates
   - NL language
   - Ready to use

2. **queue_email(...)**
   - Queues email for sending
   - Creates delivery log entry
   - Returns log ID

3. **mark_email_sent(log_id, message_id)**
   - Marks email as sent
   - Records provider message ID

4. **track_email_open(log_id)**
   - Tracks email open event
   - Updates opened_at timestamp

5. **schedule_booking_reminders(booking_id)**
   - Schedules 24h reminder
   - Schedules 2h reminder
   - Checks settings first

6. **get_pending_reminders()**
   - Gets reminders to send now
   - Returns booking details
   - Limits to 100 at a time

7. **get_email_stats(tenant_id, days)**
   - Calculates statistics
   - Open rates
   - Template breakdown

### Tracking Pixel

**Email Open Tracking:**
- 1x1 transparent GIF embedded in emails
- URL: `/api/email/track/[logId]`
- Auto-tracks when email opened
- Updates `opened_at` timestamp
- Calculates open rate

### Triggers

**Auto-Schedule Reminders:**
- Fires on booking INSERT/UPDATE
- When status = 'confirmed'
- Schedules reminders automatically
- Checks email settings first

---

## 🎨 Design & Branding

### Email Templates

**HTML Structure:**
```html
<html>
<body>
  <h1>Bedankt voor uw reservering!</h1>
  <p>Beste {guest_name},</p>
  <p>Uw reservering is bevestigd voor <strong>{date}</strong> om <strong>{time}</strong>.</p>
  <p><strong>Details:</strong></p>
  <ul>
    <li>Locatie: {location_name}</li>
    <li>Aantal personen: {party_size}</li>
    <li>Datum: {date}</li>
    <li>Tijd: {time}</li>
  </ul>
  <p>We kijken ernaar uit u te verwelkomen!</p>
  <p>Met vriendelijke groet,<br>{location_name}</p>
</body>
</html>
```

**Branding Tips:**
- Add your logo: `<img src="https://yourdomain.com/logo.png" alt="Logo" />`
- Use brand colors in styles
- Add social media links
- Include cancellation policy
- Add contact information

### UI Components

**Settings Page:**
- Clean tabs layout
- Provider selection cards
- Form inputs for credentials
- Toggle switches for features
- Test email function
- Statistics dashboard

**Template Editor:**
- Modal overlay
- HTML editor with syntax highlighting
- Plain text editor
- Variable hints
- Active/inactive toggle
- Save button

---

## 📊 Email Delivery Best Practices

### Improve Deliverability

1. **Use Your Own Domain**
   - Configure Resend with your domain
   - Add SPF, DKIM, DMARC records
   - Verify domain ownership

2. **Combell SMTP Setup**
   - Use authenticated SMTP
   - Enable TLS/SSL
   - Use port 587 or 465
   - Whitelist IP if needed

3. **Content Guidelines**
   - Avoid spam trigger words
   - Include unsubscribe link
   - Use plain text version
   - Keep HTML simple
   - Test before sending

4. **Sender Reputation**
   - Warm up new domains
   - Monitor bounce rates
   - Clean invalid emails
   - Handle unsubscribes

### Monitor Performance

**Key Metrics:**
- Open rate > 20% = Good
- Bounce rate < 2% = Good
- Failed rate < 1% = Good

**If Issues:**
- Check SMTP credentials
- Verify API key
- Test with personal email
- Check spam folder
- Review error logs

---

## 🚨 Troubleshooting

### Emails Not Sending

**Check:**
1. Email settings configured?
2. Provider credentials correct?
3. API key valid (Resend)?
4. SMTP credentials correct (Combell)?
5. From email address valid?
6. Test email works?

**Resend Issues:**
- Verify API key at resend.com/api-keys
- Check domain verification
- Review API limits (3,000/month free)

**SMTP Issues:**
- Verify host/port (587 or 465)
- Check username = full email address
- Verify password
- Enable SSL/TLS if port 465
- Check Combell control panel settings

### Reminders Not Scheduled

**Check:**
1. Email settings exist?
2. Reminder features enabled?
3. Booking status = 'confirmed'?
4. Booking time > now?
5. Trigger active?

**Debug:**
```sql
-- Check email_reminder_queue
SELECT * FROM email_reminder_queue 
WHERE booking_id = 'your-booking-id';

-- Check email_settings
SELECT * FROM email_settings 
WHERE tenant_id = 'your-tenant-id';
```

### Templates Not Found

**Fix:**
```sql
-- Create default templates
SELECT create_default_email_templates('your-tenant-id');
```

### Tracking Not Working

**Check:**
- Pixel URL correct?
- Function `track_email_open` exists?
- Log ID valid?

---

## 🔐 Security & Privacy

**Data Protection:**
- Passwords encrypted in database
- API keys encrypted
- TLS/SSL connections
- RLS policies active

**GDPR Compliance:**
- Email addresses from consented bookings
- Unsubscribe functionality recommended
- Data retention policies
- Privacy policy disclosure

---

## 📈 Future Enhancements

**Planned Features:**
- Visual email builder (drag & drop)
- A/B testing templates
- Scheduled campaigns
- SMS integration
- WhatsApp notifications
- Multi-language auto-detection
- Advanced analytics dashboard
- Unsubscribe management
- Email list segmentation

---

## ✅ Success Checklist

- [x] SQL migration run
- [x] Dependencies installed
- [x] Email provider configured (Resend or SMTP)
- [x] From address set
- [x] Default templates created
- [x] Test email sent successfully
- [x] Booking confirmation works
- [x] Reminders scheduled automatically
- [x] Tracking pixel working
- [x] Statistics visible

---

## 📞 Support

### Combell SMTP Info

**Waar vind je je IMAP/SMTP gegevens:**

1. Log in: [combell.com](https://www.combell.com)
2. My Combell → Email
3. Klik op je email account
4. Configuratie → Handmatige configuratie
5. Zie SMTP instellingen:
   - **Uitgaande server (SMTP)**: smtp.combell.com of mail.yourdomain.com
   - **Poort**: 587 (STARTTLS) of 465 (SSL)
   - **Gebruikersnaam**: Je volledige email adres
   - **Wachtwoord**: Je email wachtwoord
   - **Beveiliging**: STARTTLS of SSL/TLS

**Combell Support:**
- Telefoon: 09 218 79 79
- Email: support@combell.com
- Live chat op website

### Resend Info

**Setup:**
1. [resend.com](https://resend.com)
2. Sign up (free tier: 3,000 emails/month)
3. API Keys → Create API Key
4. Copy key (starts with `re_...`)
5. Paste in Reserve4You settings

**Resend Support:**
- Docs: [resend.com/docs](https://resend.com/docs)
- Status: [status.resend.com](https://status.resend.com)

---

**System Version:** 1.0.0
**Last Updated:** October 24, 2025
**Status:** ✅ Production Ready

