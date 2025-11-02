# Hoe Vrienden Toevoegen - Guide

## Manieren om Vrienden (Gebruikers) toe te voegen

### 1. Via "Vind Vrienden" Pagina (Nieuw!)

**Route:** `/friends`

**Toegang:**
- Via bottom navigation: Klik op "Meer" menu → "Vind Vrienden"
- Direct via URL: `/friends`

**Features:**
- **Tab 1: Ontdekken**
  - Zoek naar gebruikers op naam
  - Zie alle publieke gebruikers die je nog niet volgt
  - Follow button op elke gebruikerskaart
  - Real-time search met debounce
  
- **Tab 2: Gevolgd**
  - Zie alle gebruikers die je volgt
  - Unfollow functionaliteit
  - Klik op kaart om naar profiel te gaan

**Hoe te gebruiken:**
1. Ga naar `/friends`
2. Typ een naam in de zoekbalk (optioneel)
3. Klik op "Volgen" bij een gebruiker
4. Ze worden toegevoegd aan je "Gevolgd" lijst

### 2. Via Reviews

**Waar:** Restaurant/locatie pagina

**Hoe:**
1. Ga naar een restaurant pagina
2. Scroll naar reviews sectie
3. Klik op de naam van een reviewer
4. Je gaat naar hun profiel pagina
5. Klik op "Volgen" button

### 3. Via Activity Feed

**Waar:** `/feed` pagina

**Hoe:**
1. Ga naar de activity feed
2. Zie activiteiten van gebruikers
3. Klik op een gebruikersnaam of avatar
4. Je gaat naar hun profiel pagina
5. Klik op "Volgen" button

### 4. Via Publiek Profiel

**Waar:** `/profile/[consumerId]`

**Hoe:**
1. Ga naar iemand anders profiel (via link of direct URL)
2. Zie hun profiel header
3. Klik op "Volgen" button
4. Button verandert naar "Ontvolgen"

## Privacy Instellingen

Gebruikers kunnen hun profiel instellen als:
- **Publiek** (`is_profile_public = true`): Iedereen kan het profiel bekijken
- **Privé** (`is_profile_public = false`): Alleen volgers kunnen het profiel bekijken

**Voor gebruikers in discover:**
- Alleen gebruikers met `is_profile_public = true` EN `show_in_discover = true` worden getoond
- Je eigen profiel wordt niet getoond in discover
- Gebruikers die je al volgt worden standaard uitgesloten

## Wat gebeurt er na volgen?

- De gebruiker verschijnt in je "Gevolgd" lijst (`/friends` tab "Gevolgd")
- Je ziet hun activiteiten in je activity feed (`/feed`)
- Je kunt hun profiel bekijken (ook als privé)
- Je kunt ze uitnodigen voor bookings
- Ze krijgen een notificatie (indien ingeschakeld)

## Tips

- Gebruik de zoekfunctie in `/friends` om specifieke gebruikers te vinden
- Bekijk reviews van restaurants die je interessant vindt - volg de reviewers!
- Check de activity feed regelmatig - volg gebruikers met interessante activiteiten
- Gebruikers die je volgt worden automatisch uitgesloten van de discover lijst

