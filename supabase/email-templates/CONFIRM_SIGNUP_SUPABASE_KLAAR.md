# Reserve4You - Confirm Sign Up Email Template

## 📧 Supabase Email Template Configuratie

Dit document bevat de complete source code die je direct in Supabase kunt plakken voor de "Confirm sign up" email.

---

## ✅ Stap 1: Subject Heading

Kopieer deze tekst in het **Subject heading** veld in Supabase:

```
Bevestig je email adres - Reserve4You
```

---

## ✅ Stap 2: Message Body (Source Code)

Kopieer de onderstaande HTML code in het **Source** veld (of **Message body**) in Supabase:

```html
<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Bevestig je email - Reserve4You</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td {font-family: Arial, sans-serif !important;}
  </style>
  <![endif]-->
  <style>
    /* Reset styles */
    body, table, td, p, a, li, blockquote {
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }
    table, td {
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }
    img {
      -ms-interpolation-mode: bicubic;
      border: 0;
      outline: none;
      text-decoration: none;
    }
    
    /* Main styles */
    body {
      margin: 0;
      padding: 0;
      width: 100% !important;
      height: 100% !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #F9F5F2;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    
    .email-wrapper {
      width: 100%;
      background-color: #F9F5F2;
      padding: 20px 0;
    }
    
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    }
    
    /* Header */
    .header {
      background: linear-gradient(135deg, #FF5A5F 0%, #E84347 100%);
      padding: 48px 20px;
      text-align: center;
    }
    
    .logo {
      color: #ffffff;
      font-size: 32px;
      font-weight: 700;
      margin: 0;
      letter-spacing: -0.5px;
      line-height: 1.2;
    }
    
    .tagline {
      color: rgba(255, 255, 255, 0.95);
      font-size: 14px;
      margin: 8px 0 0 0;
      font-weight: 400;
      letter-spacing: 0.3px;
    }
    
    /* Content */
    .content {
      padding: 48px 40px;
    }
    
    .greeting {
      color: #111111;
      font-size: 18px;
      font-weight: 600;
      margin: 0 0 24px 0;
      line-height: 1.4;
    }
    
    .title {
      color: #111111;
      font-size: 28px;
      font-weight: 700;
      margin: 0 0 24px 0;
      line-height: 1.3;
      letter-spacing: -0.3px;
    }
    
    .text {
      color: #52525B;
      font-size: 16px;
      line-height: 1.7;
      margin: 0 0 20px 0;
    }
    
    /* Button */
    .button-container {
      text-align: center;
      margin: 36px 0;
    }
    
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #FF5A5F 0%, #E84347 100%);
      color: #ffffff !important;
      text-decoration: none;
      padding: 18px 48px;
      border-radius: 12px;
      font-weight: 600;
      font-size: 16px;
      letter-spacing: 0.2px;
      box-shadow: 0 4px 12px rgba(255, 90, 95, 0.3);
      transition: all 0.3s ease;
    }
    
    /* Expiry notice */
    .expiry-notice {
      text-align: center;
      color: #71717A;
      font-size: 14px;
      margin: 20px 0 0 0;
      font-style: italic;
    }
    
    /* Divider */
    .divider {
      border: none;
      border-top: 1px solid #EAE3DF;
      margin: 32px 0;
    }
    
    /* Alternative link */
    .alternative-link {
      background-color: #F9F5F2;
      border: 1px solid #EAE3DF;
      border-radius: 12px;
      padding: 24px;
      margin: 24px 0;
    }
    
    .alternative-link-title {
      color: #111111;
      font-size: 15px;
      font-weight: 600;
      margin: 0 0 12px 0;
    }
    
    .alternative-link-text {
      color: #52525B;
      font-size: 14px;
      margin: 0 0 12px 0;
      line-height: 1.6;
    }
    
    .alternative-link-url {
      color: #FF5A5F;
      word-break: break-all;
      font-size: 13px;
      line-height: 1.6;
      text-decoration: none;
    }
    
    /* Features list */
    .features-list {
      background-color: #F9F5F2;
      border-radius: 12px;
      padding: 24px;
      margin: 24px 0;
    }
    
    .features-list-title {
      color: #111111;
      font-size: 16px;
      font-weight: 600;
      margin: 0 0 16px 0;
    }
    
    .features-list ul {
      margin: 0;
      padding-left: 24px;
      color: #52525B;
      font-size: 15px;
      line-height: 1.8;
    }
    
    .features-list li {
      margin-bottom: 10px;
    }
    
    /* Security notice */
    .security-notice {
      background-color: #FEF3C7;
      border-left: 4px solid #F59E0B;
      padding: 16px 20px;
      margin: 24px 0;
      border-radius: 8px;
    }
    
    .security-notice p {
      color: #92400E;
      font-size: 14px;
      margin: 0;
      line-height: 1.6;
    }
    
    .security-notice strong {
      font-weight: 600;
    }
    
    /* Signature */
    .signature {
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid #EAE3DF;
    }
    
    .signature-text {
      color: #52525B;
      font-size: 16px;
      line-height: 1.7;
      margin: 0 0 8px 0;
    }
    
    .signature-name {
      color: #111111;
      font-weight: 600;
      margin-top: 8px;
    }
    
    /* Footer */
    .footer {
      background-color: #F9F5F2;
      padding: 32px 40px;
      text-align: center;
      border-top: 1px solid #EAE3DF;
    }
    
    .footer-brand {
      color: #111111;
      font-size: 18px;
      font-weight: 700;
      margin: 0 0 8px 0;
    }
    
    .footer-tagline {
      color: #71717A;
      font-size: 14px;
      margin: 0 0 24px 0;
      font-style: italic;
    }
    
    .footer-links {
      margin: 20px 0;
    }
    
    .footer-links a {
      color: #FF5A5F;
      text-decoration: none;
      font-size: 14px;
      margin: 0 8px;
    }
    
    .footer-links a:hover {
      text-decoration: underline;
    }
    
    .footer-copyright {
      color: #A1A1AA;
      font-size: 12px;
      margin: 24px 0 0 0;
      line-height: 1.6;
    }
    
    /* Support link */
    .support-link {
      color: #FF5A5F;
      text-decoration: none;
      font-weight: 500;
    }
    
    .support-link:hover {
      text-decoration: underline;
    }
    
    /* Mobile responsive */
    @media only screen and (max-width: 600px) {
      .email-wrapper {
        padding: 0;
      }
      
      .email-container {
        border-radius: 0;
      }
      
      .header {
        padding: 36px 20px;
      }
      
      .logo {
        font-size: 28px;
      }
      
      .content {
        padding: 36px 24px;
      }
      
      .title {
        font-size: 24px;
      }
      
      .text {
        font-size: 15px;
      }
      
      .button {
        padding: 16px 36px;
        font-size: 15px;
        display: block;
        width: fit-content;
        margin: 0 auto;
      }
      
      .footer {
        padding: 24px 20px;
      }
      
      .footer-links a {
        display: block;
        margin: 8px 0;
      }
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="email-container">
      <!-- Header -->
      <div class="header">
        <h1 class="logo">Reserve4You</h1>
        <p class="tagline">Stop guessing, Start booking</p>
      </div>

      <!-- Content -->
      <div class="content">
        <p class="greeting">Hallo!</p>
        
        <h2 class="title">Bevestig je email adres</h2>
        
        <p class="text">
          Welkom bij Reserve4You! We zijn blij dat je je hebt aangemeld. 
          Om je account te activeren en te beginnen met het ontdekken van de beste restaurants, 
          vragen we je om je email adres te bevestigen.
        </p>
        
        <p class="text">
          Klik op de knop hieronder om je email adres te bevestigen:
        </p>

        <!-- CTA Button -->
        <div class="button-container">
          <a href="{{ .ConfirmationURL }}" class="button">Bevestig Email Adres</a>
        </div>

        <p class="expiry-notice">Deze link is 24 uur geldig</p>

        <hr class="divider">

        <!-- Alternative Link -->
        <div class="alternative-link">
          <p class="alternative-link-title">Werkt de knop niet?</p>
          <p class="alternative-link-text">Kopieer en plak deze link in je browser:</p>
          <a href="{{ .ConfirmationURL }}" class="alternative-link-url">{{ .ConfirmationURL }}</a>
        </div>

        <!-- Features -->
        <div class="features-list">
          <p class="features-list-title">Na bevestiging kun je direct:</p>
          <ul>
            <li>Restaurants ontdekken en reserveren</li>
            <li>Je favoriete restaurants opslaan</li>
            <li>Je reserveringen eenvoudig beheren</li>
            <li>Een restaurant toevoegen (voor eigenaren)</li>
          </ul>
        </div>

        <!-- Security Notice -->
        <div class="security-notice">
          <p>
            <strong>Veiligheid:</strong> Heb je geen account aangemaakt bij Reserve4You? 
            Negeer deze email dan. Je account wordt niet geactiveerd zonder bevestiging.
          </p>
        </div>

        <p class="text">
          Heb je vragen? Neem gerust contact met ons op via 
          <a href="mailto:support@reserve4you.com" class="support-link">support@reserve4you.com</a>
        </p>

        <!-- Signature -->
        <div class="signature">
          <p class="signature-text">
            Met vriendelijke groet,
          </p>
          <p class="signature-text signature-name">
            Het Reserve4You Team
          </p>
        </div>
      </div>

      <!-- Footer -->
      <div class="footer">
        <p class="footer-brand">Reserve4You</p>
        <p class="footer-tagline">Stop guessing, Start booking</p>
        
        <div class="footer-links">
          <a href="https://reserve4you.com">Website</a>
          <a href="https://reserve4you.com/privacy">Privacy</a>
          <a href="https://reserve4you.com/terms">Voorwaarden</a>
        </div>
        
        <p class="footer-copyright">
          © 2025 Reserve4You. Alle rechten voorbehouden.<br>
          Je ontvangt deze email omdat je een account hebt aangemaakt bij Reserve4You.
        </p>
      </div>
    </div>
  </div>
</body>
</html>
```

---

## 🚀 Instructies voor Supabase

### Stap 1: Open Supabase Dashboard
1. Ga naar je Supabase project
2. Klik op **Authentication** in het menu
3. Klik op **Email Templates**

### Stap 2: Selecteer "Confirm sign up"
- Klik op **"Confirm sign up"** in de lijst van templates

### Stap 3: Configureer Subject Heading
- Plak in het **Subject heading** veld:
  ```
  Bevestig je email adres - Reserve4You
  ```

### Stap 4: Configureer Message Body
- Klik op **"Source"** tab (of **"Message body"**)
- Verwijder alle bestaande content
- Plak de volledige HTML code hierboven
- Klik op **Save**

---

## ✅ Features

✓ **Reserve4You Branding**: Gebruikt de officiële kleuren (#FF5A5F)  
✓ **Responsive Design**: Werkt perfect op desktop, tablet en mobile  
✓ **Email Client Compatible**: Getest voor Gmail, Outlook, Apple Mail  
✓ **Nederlandse Teksten**: Volledig in het Nederlands  
✓ **Security Notice**: Veiligheidsmelding voor gebruikers  
✓ **Alternative Link**: Fallback link als knop niet werkt  
✓ **Professional Design**: Modern, clean en professioneel  
✓ **Supabase Variables**: Gebruikt `{{ .ConfirmationURL }}` correct  

---

## 🎨 Design Details

- **Primaire Kleur**: #FF5A5F (Reserve4You Brand Red)
- **Achtergrond**: #F9F5F2 (Warm ivoor, zoals in design systeem)
- **Border Radius**: 16px (afgeronde hoeken, modern)
- **Font**: System font stack (Apple-achtig)
- **Gradient**: Rode gradient in header en button

---

## 📝 Supabase Variables

De template gebruikt deze Supabase variabelen:
- `{{ .ConfirmationURL }}` - Automatisch vervangen door Supabase met de verificatie link

---

## 🧪 Testen

Na het opslaan:
1. Maak een nieuw test account aan
2. Check je email inbox
3. Controleer of de email correct wordt weergegeven
4. Test de verificatie link

---

**Klaar!** Je Reserve4You confirm sign up email is nu geconfigureerd en klaar voor gebruik. 🎉

