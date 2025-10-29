# 📱 Berichten Systeem - Gebruikershandleiding

## 🎯 Wat is het?

Een volledig iMessage-achtig berichtensysteem waar gebruikers:
- ✉️ Berichten naar elkaar kunnen sturen
- 📍 Favoriete locaties kunnen delen
- 💬 Real-time updates ontvangen
- 🎨 Genieten van een professionele, moderne UI

## 🚀 Installatie

### Stap 1: Run de SQL Migratie

Open je Supabase SQL Editor en run:

```sql
\ir SETUP_BERICHTEN_SYSTEEM.sql
```

OF kopieer en plak de inhoud van:
`supabase/migrations/20250127000005_messages_system.sql`

### Stap 2: Installeer dependencies (indien nodig)

```bash
npm install @radix-ui/react-scroll-area
```

### Stap 3: Klaar! 🎉

Ga naar `/notifications` in je app en klik op het "Berichten" tabblad.

## 📖 Hoe te gebruiken

### Een nieuw gesprek starten

1. Ga naar `/notifications`
2. Klik op het **"Berichten"** tabblad
3. Klik op de **"+ Nieuw"** knop
4. Voer het email adres in van de ontvanger (moet een bestaande gebruiker zijn)
5. Druk op **Enter** of klik op **"Start"**
6. Begin met typen!

### Een bericht sturen

1. Selecteer een gesprek uit de lijst
2. Typ je bericht in het tekstveld onderaan
3. Druk op **Enter** of klik op het **vliegtuig icoon** (blauwe knop)

### Een locatie delen

1. Open een gesprek
2. Klik op het **📍 locatie icoon** naast het tekstveld
3. Er verschijnt een lijst met je favoriete locaties
4. Klik op een locatie om te delen
5. De locatie wordt direct verstuurd als een mooie kaart!

### Berichten lezen

- Ongelezen gesprekken hebben een **blauwe badge** met het aantal ongelezen berichten
- Je eigen berichten zijn **blauw** (rechts uitgelijnd)
- Berichten van anderen zijn **grijs** (links uitgelijnd)
- Berichten worden automatisch als gelezen gemarkeerd wanneer je het gesprek opent

## 🎨 Features

### iMessage-achtige UI

- **Bubble design**: Mooie ronde tekstballonnen
- **Kleurcodering**: Blauw voor eigen berichten, grijs voor anderen
- **Smooth animaties**: Professionele hover effecten en transitions
- **Mobile responsive**: Werkt perfect op telefoon, tablet en desktop

### Locatie Delen

- **Visuele kaarten**: Locaties worden getoond met foto en info
- **Ratings**: Zie direct de beoordeling van een locatie
- **Klikbaar**: Tik op een gedeelde locatie om de volledige details te zien
- **Favorieten integratie**: Deel alleen je favoriete locaties

### Real-time Updates

- **Instant delivery**: Berichten verschijnen direct bij de ontvanger
- **Live typing**: Zie meteen wanneer nieuwe berichten binnenkomen
- **Notificaties**: Ontvang een melding bij nieuwe berichten

## 🔧 Technische Details

### Database Schema

Het systeem gebruikt 4 hoofdtabellen:

1. **conversations**: Gesprekken tussen gebruikers
2. **conversation_participants**: Wie zit in welk gesprek (many-to-many)
3. **messages**: Alle berichten (tekst, locaties, systeem berichten)
4. **message_reads**: Gelezen status per gebruiker per bericht

### API Endpoints

- `GET /api/messages` - Lijst van gesprekken of berichten
- `POST /api/messages` - Verstuur een nieuw bericht
- `POST /api/messages/[conversationId]/read` - Markeer als gelezen

### Beveiliging (RLS)

- Gebruikers kunnen alleen hun eigen gesprekken zien
- Berichten kunnen alleen gelezen worden door deelnemers
- Alle acties zijn beveiligd met Row Level Security policies

### Real-time Subscriptions

Het systeem gebruikt Supabase Realtime voor:
- Live message updates
- Nieuwe gesprekken
- Gelezen statussen

## 🐛 Troubleshooting

### "Ontvanger niet gevonden"

**Probleem**: Het email adres bestaat niet in het systeem.

**Oplossing**: Zorg dat de gebruiker een account heeft en ingelogd is geweest (dit creëert automatisch een consumer record).

### Locaties worden niet getoond

**Probleem**: Je hebt geen favoriete locaties.

**Oplossing**: 
1. Ga naar de home pagina
2. Zoek interessante locaties
3. Klik op het ⭐ icoon om toe te voegen aan favorieten
4. Ga terug naar Berichten en probeer opnieuw

### Berichten verschijnen niet real-time

**Probleem**: Real-time subscriptions werken niet.

**Oplossing**:
1. Check je Supabase Realtime instellingen
2. Ververs de pagina
3. Check de browser console voor errors

### "Consumer not found" error

**Probleem**: Je consumer record bestaat niet.

**Oplossing**: Run deze SQL query:

```sql
-- Check of auto_create_consumer trigger bestaat
SELECT * FROM pg_trigger WHERE tgname = 'create_consumer_on_signup';

-- Handmatig consumer aanmaken voor je account
INSERT INTO consumers (auth_user_id, email, created_at, updated_at)
SELECT 
  auth.uid(),
  (SELECT email FROM auth.users WHERE id = auth.uid()),
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM consumers WHERE auth_user_id = auth.uid()
);
```

## 💡 Tips & Tricks

### Tip 1: Keyboard Shortcuts
- **Enter**: Verstuur bericht
- **Shift + Enter**: Nieuwe regel in bericht

### Tip 2: Emoji's
Je kunt gewoon emoji's typen in berichten! 🎉 👍 🚀

### Tip 3: Gesprekken archiveren
*(Coming soon)*

### Tip 4: Groepsgesprekken
*(Coming soon)*

## 📱 Mobile App

Het systeem is volledig responsive:
- **Mobile**: Volledige functionaliteit op telefoon
- **Tablet**: Optimale ervaring
- **Desktop**: Split-screen view met gesprekken lijst en berichten

## 🔐 Privacy

- Berichten zijn alleen zichtbaar voor deelnemers
- Geen berichten worden gedeeld met derden
- Alle communicatie is beveiligd
- RLS policies zorgen voor data isolatie

## 🎯 Roadmap

Toekomstige features:
- [ ] Groepsgesprekken (meer dan 2 personen)
- [ ] Bestand uploads (foto's, documenten)
- [ ] Berichten verwijderen
- [ ] Berichten bewerken
- [ ] Typing indicators ("... is aan het typen")
- [ ] Push notificaties
- [ ] Geluid bij nieuwe berichten
- [ ] Emoji reactions op berichten
- [ ] Gesprekken zoeken
- [ ] Gesprekken archiveren

## 🆘 Hulp Nodig?

Als je problemen hebt:

1. Check de browser console voor errors
2. Bekijk de Supabase logs
3. Check of alle SQL migrations correct zijn uitgevoerd
4. Verifieer dat RLS policies actief zijn

## 🎊 Klaar!

Je berichten systeem is nu volledig operationeel! Veel plezier met berichten sturen en locaties delen! 🚀

---

**Gemaakt met ❤️ voor Reserve4You**

