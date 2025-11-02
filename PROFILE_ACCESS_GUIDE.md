# Profiel Pagina Toegang - Guide

## Hoe kom je op `/profile/[consumerId]`?

### 1. Via Reviews (Automatisch Geïmplementeerd)
- Ga naar een restaurant/locatie pagina
- Bekijk de reviews
- Klik op de naam van een reviewer
- Je wordt doorgestuurd naar `/profile/[consumerId]`

### 2. Via Activity Feed (Na Implementatie Phase 1.9)
- Bekijk de activity feed
- Klik op een gebruikersnaam bij een activiteit
- Je wordt doorgestuurd naar hun profiel

### 3. Via Messages (Na Implementatie)
- Open een conversatie
- Klik op de naam van de andere gebruiker
- Je wordt doorgestuurd naar hun profiel

### 4. Direct via URL (Voor Testen)
Als je een consumer ID hebt, kun je direct naar:
```
/profile/[consumer-id-here]
```

**Hoe krijg je een consumer ID?**
1. Ga naar `/profile` (eigen profiel)
2. Open browser DevTools → Network tab
3. Zoek naar API calls naar `/api/social/profile`
4. In de response vind je je `consumer.id`
5. Gebruik die ID in de URL: `/profile/[jouw-consumer-id]`

### 5. Via Database Query (Voor Testen)
```sql
-- Get a consumer ID
SELECT id, name, email 
FROM consumers 
WHERE auth_user_id IS NOT NULL 
LIMIT 5;
```

Gebruik een van deze IDs in de URL.

## Componenten Geïmplementeerd

### ✅ UserLink Component
- Link naar gebruikersprofiel
- Optioneel avatar display
- Verschillende varianten (link, button, text)

### ✅ FollowUnfollowButton Component
- Follow/unfollow functionaliteit
- Loading states
- Success feedback
- Real-time state updates

### ✅ UserCard Component
- Gebruikerskaart met info
- Avatar, naam, bio, stats
- Follow button geïntegreerd

### ✅ Reviews Display Updates
- Reviewernamen zijn nu klikbaar
- Link naar profiel pagina
- Hover states

## Testen

1. **Test eigen profiel:**
   - Log in
   - Ga naar `/profile/[jouw-consumer-id]`
   - Je zou je eigen profiel moeten zien

2. **Test publiek profiel:**
   - Log in
   - Ga naar een restaurant met reviews
   - Klik op een reviewer naam
   - Je zou hun profiel moeten zien

3. **Test follow functionaliteit:**
   - Ga naar iemand anders profiel
   - Klik op "Volgen"
   - Check dat button verandert naar "Ontvolgen"
   - Check dat followers count wordt bijgewerkt

4. **Test privacy:**
   - Maak een profiel private (`is_profile_public = false`)
   - Probeer als andere gebruiker te bekijken
   - Je zou 404 moeten krijgen (tenzij je volgt)

## Volgende Stappen

- Phase 1.9: Activity Feed Display - Profielen linken in activity feed
- Phase 1.10: Credits Display - Credits tonen in profiel

