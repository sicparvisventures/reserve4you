# Booking Invitation Email Setup - Complete Guide

## ✅ Wat is er geïmplementeerd?

Wanneer je een reservering maakt en vrienden uitnodigt in de booking popup, ontvangen die vrienden nu automatisch een professionele uitnodigingsemail.

---

## 📧 Email Flow

1. **Gebruiker maakt reservering** via `ReserveBookingModal`
2. **Gebruiker selecteert vrienden** via `InviteFriendsSelect` component
3. **Bij klikken op "Reserveren"**:
   - Booking wordt aangemaakt
   - `booking_companions` records worden aangemaakt
   - **Automatisch email verstuurd** naar alle uitgenodigde vrienden

---

## 🔧 Technische Details

### 1. API Route: `/api/bookings/invite-friends`

**Aangepast:**
- Haalt booking details op (datum, tijd, restaurant, aantal personen)
- Haalt vriend details op (naam, email)
- Genereert professionele HTML email
- Verstuurt email via `/api/email/send-booking-invitation`

**Bestand:** `app/api/bookings/invite-friends/route.ts`

### 2. Email API Route: `/api/email/send-booking-invitation`

**Nieuw:**
- Verstuurt booking invitation emails
- Gebruikt EmailService (Resend of SMTP)
- Ondersteunt tenant-specifieke email settings

**Bestand:** `app/api/email/send-booking-invitation/route.ts`

### 3. Email Template

**Nieuw:**
- Professionele Reserve4You branded email
- Toont reserveringsdetails (restaurant, datum, tijd, aantal personen)
- Link naar booking pagina
- Volledig responsive

**Bestand:** `supabase/email-templates/booking-invitation.html`

---

## 📝 Email Inhoud

De email bevat:
- **Persoonlijke begroeting** met naam van vriend
- **Uitnodiging van** naam van degene die uitnodigt
- **Reserveringsdetails**:
  - Restaurant naam
  - Datum (formatted in Nederlands)
  - Tijd
  - Aantal personen
- **CTA Button** "Bekijk Reservering"
- **Link naar booking pagina** (`/bookings/{bookingId}`)

---

## 🚀 Setup Instructies

### Stap 1: Email Settings (Optioneel)

Als je tenant-specifieke email settings wilt gebruiken:

1. Configureer email settings in database via `email_settings` tabel
2. Of gebruik environment variables:
   - `EMAIL_PROVIDER` (resend of smtp)
   - `EMAIL_FROM`
   - `EMAIL_FROM_NAME`
   - `RESEND_API_KEY` (voor Resend)
   - `SMTP_HOST`, `SMTP_PORT`, etc. (voor SMTP)

### Stap 2: Environment Variables

Zorg dat deze zijn ingesteld:
```env
NEXT_PUBLIC_URL=http://localhost:3007  # of je productie URL
```

### Stap 3: Testen

1. **Maak een reservering** op localhost:3007
2. **Selecteer vrienden** in de booking popup
3. **Klik op "Reserveren"**
4. **Check email inbox** van uitgenodigde vrienden

---

## 📧 Email Voorbeeld

```
Subject: [Naam] heeft je uitgenodigd voor een reservering bij [Restaurant]

Hallo [Vriend Naam]!

[Uitnodiger Naam] heeft je uitgenodigd voor een reservering bij [Restaurant Naam]. 
Samen eten maakt het nog leuker!

📅 Reserveringsdetails
Restaurant: [Naam]
Datum: [Datum]
Tijd: [Tijd]
Aantal personen: [Aantal]

[Bekijk Reservering Button]
```

---

## 🐛 Troubleshooting

### Emails worden niet verstuurd?

1. **Check logs** in console voor error messages
2. **Check email settings** - zijn ze correct geconfigureerd?
3. **Check email provider** - werkt Resend/SMTP?
4. **Check friend emails** - hebben vrienden een email adres in hun profiel?

### Email wordt verstuurd maar niet ontvangen?

1. **Check spam folder**
2. **Check email provider logs** (Resend dashboard of SMTP logs)
3. **Verify email address** is correct

### Booking URL werkt niet?

1. **Check `NEXT_PUBLIC_URL`** environment variable
2. **Verify booking ID** is correct
3. **Check booking bestaat** in database

---

## 📁 Bestanden

### Aangepast:
- `app/api/bookings/invite-friends/route.ts` - Email versturen toegevoegd

### Nieuw:
- `app/api/email/send-booking-invitation/route.ts` - Email API endpoint
- `supabase/email-templates/booking-invitation.html` - Email template

---

## ✅ Features

- ✅ Automatisch email versturen bij uitnodiging
- ✅ Professionele Reserve4You branding
- ✅ Volledige reserveringsdetails
- ✅ Link naar booking pagina
- ✅ Responsive email design
- ✅ Error handling (email falen blokkeert booking niet)
- ✅ Ondersteunt tenant-specifieke email settings
- ✅ Fallback naar system email settings

---

## 🎯 Volgende Stappen

1. ✅ Test de flow op localhost:3007
2. ✅ Configureer email settings voor productie
3. ✅ Test met echte vrienden
4. ✅ Monitor email delivery

---

**Klaar!** De booking invitation email flow is nu volledig geïmplementeerd. 🎉

