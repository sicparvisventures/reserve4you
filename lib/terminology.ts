/**
 * RESERVE4YOU MULTI-SECTOR TERMINOLOGY MAP
 * 
 * Complete terminology mapping for all 43 supported business sectors
 * This is the SINGLE SOURCE OF TRUTH for UI labels across the entire platform
 * 
 * SMART TERMINOLOGY MAPPING:
 * - No UI/UX changes needed
 * - Labels automatically adapt based on location.business_sector
 * - Supports Dutch articles for grammatical correctness
 */

import { BusinessSector, TerminologySet } from './types/terminology';

export const TERMINOLOGY_MAP: Record<BusinessSector, TerminologySet> = {
  // ============================================================================
  // HOSPITALITY (HORECA)
  // ============================================================================
  
  RESTAURANT: {
    booking: { singular: 'Reservering', plural: 'Reserveringen', verb: 'Reserveren', article: 'de' },
    resource: { singular: 'Tafel', plural: 'Tafels', article: 'de' },
    customer: { singular: 'Gast', plural: 'Gasten', article: 'de' },
    staff: { singular: 'Medewerker', plural: 'Personeel', article: 'de' },
    service: { singular: 'Gerecht', plural: 'Menu', article: 'het' },
    location: { singular: 'Restaurant', plural: 'Restaurants', article: 'het' }
  },
  
  CAFE: {
    booking: { singular: 'Reservering', plural: 'Reserveringen', verb: 'Reserveren', article: 'de' },
    resource: { singular: 'Tafel', plural: 'Tafels', article: 'de' },
    customer: { singular: 'Bezoeker', plural: 'Bezoekers', article: 'de' },
    staff: { singular: 'Medewerker', plural: 'Personeel', article: 'de' },
    service: { singular: 'Item', plural: 'Menu', article: 'het' },
    location: { singular: 'Café', plural: "Café's", article: 'het' }
  },
  
  BAR: {
    booking: { singular: 'Reservering', plural: 'Reserveringen', verb: 'Reserveren', article: 'de' },
    resource: { singular: 'Tafel', plural: 'Tafels', article: 'de' },
    customer: { singular: 'Gast', plural: 'Gasten', article: 'de' },
    staff: { singular: 'Barmedewerker', plural: 'Personeel', article: 'de' },
    service: { singular: 'Drankje', plural: 'Drankjes', article: 'het' },
    location: { singular: 'Bar', plural: 'Bars', article: 'de' }
  },
  
  // ============================================================================
  // BEAUTY & WELLNESS
  // ============================================================================
  
  BEAUTY_SALON: {
    booking: { singular: 'Afspraak', plural: 'Afspraken', verb: 'Boeken', article: 'de' },
    resource: { singular: 'Behandelkamer', plural: 'Behandelkamers', article: 'de' },
    customer: { singular: 'Klant', plural: 'Klanten', article: 'de' },
    staff: { singular: 'Schoonheidsspecialist', plural: 'Specialisten', article: 'de' },
    service: { singular: 'Behandeling', plural: 'Behandelingen', article: 'de' },
    location: { singular: 'Schoonheidssalon', plural: 'Schoonheidssalons', article: 'de' }
  },
  
  HAIR_SALON: {
    booking: { singular: 'Afspraak', plural: 'Afspraken', verb: 'Boeken', article: 'de' },
    resource: { singular: 'Stoel', plural: 'Stoelen', article: 'de' },
    customer: { singular: 'Klant', plural: 'Klanten', article: 'de' },
    staff: { singular: 'Kapper', plural: 'Kappers', article: 'de' },
    service: { singular: 'Behandeling', plural: 'Behandelingen', article: 'de' },
    location: { singular: 'Kapsalon', plural: 'Kapsalons', article: 'de' }
  },
  
  NAIL_STUDIO: {
    booking: { singular: 'Afspraak', plural: 'Afspraken', verb: 'Boeken', article: 'de' },
    resource: { singular: 'Nageltafel', plural: 'Nageltafels', article: 'de' },
    customer: { singular: 'Klant', plural: 'Klanten', article: 'de' },
    staff: { singular: 'Nagelstyliste', plural: 'Nagelstylisten', article: 'de' },
    service: { singular: 'Behandeling', plural: 'Behandelingen', article: 'de' },
    location: { singular: 'Nagelstudio', plural: "Nagelstudio's", article: 'de' }
  },
  
  SPA: {
    booking: { singular: 'Afspraak', plural: 'Afspraken', verb: 'Boeken', article: 'de' },
    resource: { singular: 'Behandelruimte', plural: 'Behandelruimtes', article: 'de' },
    customer: { singular: 'Gast', plural: 'Gasten', article: 'de' },
    staff: { singular: 'Therapeut', plural: 'Therapeuten', article: 'de' },
    service: { singular: 'Behandeling', plural: 'Behandelingen', article: 'de' },
    location: { singular: 'Spa', plural: "Spa's", article: 'de' }
  },
  
  MASSAGE_THERAPY: {
    booking: { singular: 'Afspraak', plural: 'Afspraken', verb: 'Boeken', article: 'de' },
    resource: { singular: 'Massageruimte', plural: 'Massageruimtes', article: 'de' },
    customer: { singular: 'Cliënt', plural: 'Cliënten', article: 'de' },
    staff: { singular: 'Masseur', plural: 'Masseurs', article: 'de' },
    service: { singular: 'Massage', plural: 'Massages', article: 'de' },
    location: { singular: 'Massagepraktijk', plural: 'Massagepraktijken', article: 'de' }
  },
  
  TANNING_SALON: {
    booking: { singular: 'Afspraak', plural: 'Afspraken', verb: 'Boeken', article: 'de' },
    resource: { singular: 'Zonnebank', plural: 'Zonnebanken', article: 'de' },
    customer: { singular: 'Klant', plural: 'Klanten', article: 'de' },
    staff: { singular: 'Medewerker', plural: 'Medewerkers', article: 'de' },
    service: { singular: 'Sessie', plural: 'Sessies', article: 'de' },
    location: { singular: 'Zonnestudio', plural: "Zonnestudio's", article: 'de' }
  },
  
  // ============================================================================
  // HEALTHCARE
  // ============================================================================
  
  MEDICAL_PRACTICE: {
    booking: { singular: 'Afspraak', plural: 'Afspraken', verb: 'Plannen', article: 'de' },
    resource: { singular: 'Spreekkamer', plural: 'Spreekkamers', article: 'de' },
    customer: { singular: 'Patiënt', plural: 'Patiënten', article: 'de' },
    staff: { singular: 'Arts', plural: 'Artsen', article: 'de' },
    service: { singular: 'Consultatie', plural: 'Consultaties', article: 'de' },
    location: { singular: 'Huisartsenpraktijk', plural: 'Huisartsenpraktijken', article: 'de' }
  },
  
  DENTIST: {
    booking: { singular: 'Afspraak', plural: 'Afspraken', verb: 'Plannen', article: 'de' },
    resource: { singular: 'Behandelstoel', plural: 'Behandelstoelen', article: 'de' },
    customer: { singular: 'Patiënt', plural: 'Patiënten', article: 'de' },
    staff: { singular: 'Tandarts', plural: 'Tandartsen', article: 'de' },
    service: { singular: 'Behandeling', plural: 'Behandelingen', article: 'de' },
    location: { singular: 'Tandartspraktijk', plural: 'Tandartspraktijken', article: 'de' }
  },
  
  PHYSIOTHERAPY: {
    booking: { singular: 'Afspraak', plural: 'Afspraken', verb: 'Plannen', article: 'de' },
    resource: { singular: 'Behandelruimte', plural: 'Behandelruimtes', article: 'de' },
    customer: { singular: 'Patiënt', plural: 'Patiënten', article: 'de' },
    staff: { singular: 'Fysiotherapeut', plural: 'Fysiotherapeuten', article: 'de' },
    service: { singular: 'Behandeling', plural: 'Behandelingen', article: 'de' },
    location: { singular: 'Fysiotherapiepraktijk', plural: 'Fysiotherapiepraktijken', article: 'de' }
  },
  
  PSYCHOLOGY: {
    booking: { singular: 'Sessie', plural: 'Sessies', verb: 'Plannen', article: 'de' },
    resource: { singular: 'Spreekkamer', plural: 'Spreekkamers', article: 'de' },
    customer: { singular: 'Cliënt', plural: 'Cliënten', article: 'de' },
    staff: { singular: 'Psycholoog', plural: 'Psychologen', article: 'de' },
    service: { singular: 'Sessie', plural: 'Sessies', article: 'de' },
    location: { singular: 'Psychologiepraktijk', plural: 'Psychologiepraktijken', article: 'de' }
  },
  
  VETERINARY: {
    booking: { singular: 'Afspraak', plural: 'Afspraken', verb: 'Plannen', article: 'de' },
    resource: { singular: 'Spreekkamer', plural: 'Spreekkamers', article: 'de' },
    customer: { singular: 'Eigenaar', plural: 'Eigenaren', article: 'de' },
    staff: { singular: 'Dierenarts', plural: 'Dierenartsen', article: 'de' },
    service: { singular: 'Behandeling', plural: 'Behandelingen', article: 'de' },
    location: { singular: 'Dierenkliniek', plural: 'Dierenklinieken', article: 'de' }
  },
  
  // ============================================================================
  // FITNESS & SPORTS
  // ============================================================================
  
  GYM: {
    booking: { singular: 'Sessie', plural: 'Sessies', verb: 'Inschrijven', article: 'de' },
    resource: { singular: 'Ruimte', plural: 'Ruimtes', article: 'de' },
    customer: { singular: 'Lid', plural: 'Leden', article: 'het' },
    staff: { singular: 'Trainer', plural: 'Trainers', article: 'de' },
    service: { singular: 'Training', plural: 'Trainingen', article: 'de' },
    location: { singular: 'Sportschool', plural: 'Sportscholen', article: 'de' }
  },
  
  YOGA_STUDIO: {
    booking: { singular: 'Les', plural: 'Lessen', verb: 'Inschrijven', article: 'de' },
    resource: { singular: 'Studio', plural: "Studio's", article: 'de' },
    customer: { singular: 'Deelnemer', plural: 'Deelnemers', article: 'de' },
    staff: { singular: 'Yogaleraar', plural: 'Yogaleraren', article: 'de' },
    service: { singular: 'Yogales', plural: 'Yogalessen', article: 'de' },
    location: { singular: 'Yogastudio', plural: "Yogastudio's", article: 'de' }
  },
  
  PERSONAL_TRAINING: {
    booking: { singular: 'Sessie', plural: 'Sessies', verb: 'Boeken', article: 'de' },
    resource: { singular: 'Ruimte', plural: 'Ruimtes', article: 'de' },
    customer: { singular: 'Cliënt', plural: 'Cliënten', article: 'de' },
    staff: { singular: 'Personal Trainer', plural: 'Personal Trainers', article: 'de' },
    service: { singular: 'Training', plural: 'Trainingen', article: 'de' },
    location: { singular: 'Studio', plural: "Studio's", article: 'de' }
  },
  
  DANCE_STUDIO: {
    booking: { singular: 'Les', plural: 'Lessen', verb: 'Inschrijven', article: 'de' },
    resource: { singular: 'Studio', plural: "Studio's", article: 'de' },
    customer: { singular: 'Danser', plural: 'Dansers', article: 'de' },
    staff: { singular: 'Dansleraar', plural: 'Dansleraren', article: 'de' },
    service: { singular: 'Dansles', plural: 'Danslessen', article: 'de' },
    location: { singular: 'Dansstudio', plural: "Dansstudio's", article: 'de' }
  },
  
  MARTIAL_ARTS: {
    booking: { singular: 'Les', plural: 'Lessen', verb: 'Inschrijven', article: 'de' },
    resource: { singular: 'Dojo', plural: "Dojo's", article: 'de' },
    customer: { singular: 'Leerling', plural: 'Leerlingen', article: 'de' },
    staff: { singular: 'Instructeur', plural: 'Instructeurs', article: 'de' },
    service: { singular: 'Training', plural: 'Trainingen', article: 'de' },
    location: { singular: 'Vechtsportschool', plural: 'Vechtsportscholen', article: 'de' }
  },
  
  // ============================================================================
  // PROFESSIONAL SERVICES
  // ============================================================================
  
  LEGAL: {
    booking: { singular: 'Afspraak', plural: 'Afspraken', verb: 'Plannen', article: 'de' },
    resource: { singular: 'Kantoorruimte', plural: 'Kantoorruimtes', article: 'de' },
    customer: { singular: 'Cliënt', plural: 'Cliënten', article: 'de' },
    staff: { singular: 'Advocaat', plural: 'Advocaten', article: 'de' },
    service: { singular: 'Consultatie', plural: 'Consultaties', article: 'de' },
    location: { singular: 'Advocatenkantoor', plural: 'Advocatenkantoren', article: 'het' }
  },
  
  ACCOUNTING: {
    booking: { singular: 'Afspraak', plural: 'Afspraken', verb: 'Plannen', article: 'de' },
    resource: { singular: 'Kantoorruimte', plural: 'Kantoorruimtes', article: 'de' },
    customer: { singular: 'Cliënt', plural: 'Cliënten', article: 'de' },
    staff: { singular: 'Accountant', plural: 'Accountants', article: 'de' },
    service: { singular: 'Consultatie', plural: 'Consultaties', article: 'de' },
    location: { singular: 'Accountantskantoor', plural: 'Accountantskantoren', article: 'het' }
  },
  
  CONSULTING: {
    booking: { singular: 'Afspraak', plural: 'Afspraken', verb: 'Boeken', article: 'de' },
    resource: { singular: 'Vergaderruimte', plural: 'Vergaderruimtes', article: 'de' },
    customer: { singular: 'Cliënt', plural: 'Cliënten', article: 'de' },
    staff: { singular: 'Consultant', plural: 'Consultants', article: 'de' },
    service: { singular: 'Adviesgesprek', plural: 'Adviesgesprekken', article: 'het' },
    location: { singular: 'Adviesbureau', plural: 'Adviesbureaus', article: 'het' }
  },
  
  FINANCIAL_ADVISORY: {
    booking: { singular: 'Afspraak', plural: 'Afspraken', verb: 'Plannen', article: 'de' },
    resource: { singular: 'Kantoorruimte', plural: 'Kantoorruimtes', article: 'de' },
    customer: { singular: 'Cliënt', plural: 'Cliënten', article: 'de' },
    staff: { singular: 'Adviseur', plural: 'Adviseurs', article: 'de' },
    service: { singular: 'Financieel Advies', plural: 'Financiële Adviezen', article: 'het' },
    location: { singular: 'Adviesbureau', plural: 'Adviesbureaus', article: 'het' }
  },
  
  // ============================================================================
  // EDUCATION
  // ============================================================================
  
  TUTORING: {
    booking: { singular: 'Les', plural: 'Lessen', verb: 'Boeken', article: 'de' },
    resource: { singular: 'Lesruimte', plural: 'Lesruimtes', article: 'de' },
    customer: { singular: 'Leerling', plural: 'Leerlingen', article: 'de' },
    staff: { singular: 'Docent', plural: 'Docenten', article: 'de' },
    service: { singular: 'Bijles', plural: 'Bijlessen', article: 'de' },
    location: { singular: 'Bijlescentrum', plural: 'Bijlescentra', article: 'het' }
  },
  
  MUSIC_LESSONS: {
    booking: { singular: 'Les', plural: 'Lessen', verb: 'Boeken', article: 'de' },
    resource: { singular: 'Lesruimte', plural: 'Lesruimtes', article: 'de' },
    customer: { singular: 'Leerling', plural: 'Leerlingen', article: 'de' },
    staff: { singular: 'Muziekdocent', plural: 'Muziekdocenten', article: 'de' },
    service: { singular: 'Muziekles', plural: 'Muzieklessen', article: 'de' },
    location: { singular: 'Muziekschool', plural: 'Muziekscholen', article: 'de' }
  },
  
  LANGUAGE_SCHOOL: {
    booking: { singular: 'Les', plural: 'Lessen', verb: 'Inschrijven', article: 'de' },
    resource: { singular: 'Klaslokaal', plural: 'Klaslokalen', article: 'het' },
    customer: { singular: 'Cursist', plural: 'Cursisten', article: 'de' },
    staff: { singular: 'Docent', plural: 'Docenten', article: 'de' },
    service: { singular: 'Taalles', plural: 'Taallessen', article: 'de' },
    location: { singular: 'Taalschool', plural: 'Taalscholen', article: 'de' }
  },
  
  DRIVING_SCHOOL: {
    booking: { singular: 'Rijles', plural: 'Rijlessen', verb: 'Boeken', article: 'de' },
    resource: { singular: 'Lesauto', plural: "Lesauto's", article: 'de' },
    customer: { singular: 'Leerling', plural: 'Leerlingen', article: 'de' },
    staff: { singular: 'Instructeur', plural: 'Instructeurs', article: 'de' },
    service: { singular: 'Rijles', plural: 'Rijlessen', article: 'de' },
    location: { singular: 'Rijschool', plural: 'Rijscholen', article: 'de' }
  },
  
  // ============================================================================
  // AUTOMOTIVE
  // ============================================================================
  
  CAR_REPAIR: {
    booking: { singular: 'Afspraak', plural: 'Afspraken', verb: 'Plannen', article: 'de' },
    resource: { singular: 'Werkplaats', plural: 'Werkplaatsen', article: 'de' },
    customer: { singular: 'Klant', plural: 'Klanten', article: 'de' },
    staff: { singular: 'Monteur', plural: 'Monteurs', article: 'de' },
    service: { singular: 'Reparatie', plural: 'Reparaties', article: 'de' },
    location: { singular: 'Garage', plural: 'Garages', article: 'de' }
  },
  
  CAR_WASH: {
    booking: { singular: 'Afspraak', plural: 'Afspraken', verb: 'Boeken', article: 'de' },
    resource: { singular: 'Wasstraat', plural: 'Wasstraten', article: 'de' },
    customer: { singular: 'Klant', plural: 'Klanten', article: 'de' },
    staff: { singular: 'Medewerker', plural: 'Medewerkers', article: 'de' },
    service: { singular: 'Wasbeurt', plural: 'Wasbeurten', article: 'de' },
    location: { singular: 'Wasstraat', plural: 'Wasstraten', article: 'de' }
  },
  
  CAR_RENTAL: {
    booking: { singular: 'Reservering', plural: 'Reserveringen', verb: 'Reserveren', article: 'de' },
    resource: { singular: 'Auto', plural: "Auto's", article: 'de' },
    customer: { singular: 'Huurder', plural: 'Huurders', article: 'de' },
    staff: { singular: 'Medewerker', plural: 'Medewerkers', article: 'de' },
    service: { singular: 'Verhuur', plural: 'Verhuurperiodes', article: 'de' },
    location: { singular: 'Autoverhuurbedrijf', plural: 'Autoverhuurbedrijven', article: 'het' }
  },
  
  // ============================================================================
  // HOME SERVICES
  // ============================================================================
  
  CLEANING: {
    booking: { singular: 'Afspraak', plural: 'Afspraken', verb: 'Boeken', article: 'de' },
    resource: { singular: 'Team', plural: 'Teams', article: 'het' },
    customer: { singular: 'Klant', plural: 'Klanten', article: 'de' },
    staff: { singular: 'Schoonmaker', plural: 'Schoonmakers', article: 'de' },
    service: { singular: 'Schoonmaakbeurt', plural: 'Schoonmaakbeurten', article: 'de' },
    location: { singular: 'Schoonmaakbedrijf', plural: 'Schoonmaakbedrijven', article: 'het' }
  },
  
  PLUMBING: {
    booking: { singular: 'Afspraak', plural: 'Afspraken', verb: 'Plannen', article: 'de' },
    resource: { singular: 'Monteur', plural: 'Monteurs', article: 'de' },
    customer: { singular: 'Klant', plural: 'Klanten', article: 'de' },
    staff: { singular: 'Loodgieter', plural: 'Loodgieters', article: 'de' },
    service: { singular: 'Reparatie', plural: 'Reparaties', article: 'de' },
    location: { singular: 'Loodgietersbedrijf', plural: 'Loodgietersbedrijven', article: 'het' }
  },
  
  ELECTRICIAN: {
    booking: { singular: 'Afspraak', plural: 'Afspraken', verb: 'Plannen', article: 'de' },
    resource: { singular: 'Monteur', plural: 'Monteurs', article: 'de' },
    customer: { singular: 'Klant', plural: 'Klanten', article: 'de' },
    staff: { singular: 'Elektricien', plural: 'Elektriciens', article: 'de' },
    service: { singular: 'Reparatie', plural: 'Reparaties', article: 'de' },
    location: { singular: 'Elektrotechnisch Bedrijf', plural: 'Elektrotechnische Bedrijven', article: 'het' }
  },
  
  GARDENING: {
    booking: { singular: 'Afspraak', plural: 'Afspraken', verb: 'Boeken', article: 'de' },
    resource: { singular: 'Team', plural: 'Teams', article: 'het' },
    customer: { singular: 'Klant', plural: 'Klanten', article: 'de' },
    staff: { singular: 'Hovenier', plural: 'Hoveniers', article: 'de' },
    service: { singular: 'Onderhoud', plural: 'Onderhoudsbeurt', article: 'het' },
    location: { singular: 'Hoveniersbedrijf', plural: 'Hoveniersbedrijven', article: 'het' }
  },
  
  // ============================================================================
  // ENTERTAINMENT & VENUES
  // ============================================================================
  
  EVENT_VENUE: {
    booking: { singular: 'Reservering', plural: 'Reserveringen', verb: 'Reserveren', article: 'de' },
    resource: { singular: 'Evenementruimte', plural: 'Evenementruimtes', article: 'de' },
    customer: { singular: 'Organisator', plural: 'Organisatoren', article: 'de' },
    staff: { singular: 'Eventmanager', plural: 'Eventmanagers', article: 'de' },
    service: { singular: 'Evenement', plural: 'Evenementen', article: 'het' },
    location: { singular: 'Evenementenlocatie', plural: 'Evenementenlocaties', article: 'de' }
  },
  
  PHOTO_STUDIO: {
    booking: { singular: 'Fotosessie', plural: 'Fotosessies', verb: 'Boeken', article: 'de' },
    resource: { singular: 'Studio', plural: "Studio's", article: 'de' },
    customer: { singular: 'Klant', plural: 'Klanten', article: 'de' },
    staff: { singular: 'Fotograaf', plural: 'Fotografen', article: 'de' },
    service: { singular: 'Fotoshoot', plural: 'Fotoshoots', article: 'de' },
    location: { singular: 'Fotostudio', plural: "Fotostudio's", article: 'de' }
  },
  
  ESCAPE_ROOM: {
    booking: { singular: 'Reservering', plural: 'Reserveringen', verb: 'Reserveren', article: 'de' },
    resource: { singular: 'Escape Room', plural: 'Escape Rooms', article: 'de' },
    customer: { singular: 'Speler', plural: 'Spelers', article: 'de' },
    staff: { singular: 'Gamemaster', plural: 'Gamemasters', article: 'de' },
    service: { singular: 'Spel', plural: 'Spellen', article: 'het' },
    location: { singular: 'Escape Room', plural: 'Escape Rooms', article: 'de' }
  },
  
  BOWLING: {
    booking: { singular: 'Reservering', plural: 'Reserveringen', verb: 'Reserveren', article: 'de' },
    resource: { singular: 'Baan', plural: 'Banen', article: 'de' },
    customer: { singular: 'Gast', plural: 'Gasten', article: 'de' },
    staff: { singular: 'Medewerker', plural: 'Medewerkers', article: 'de' },
    service: { singular: 'Spel', plural: 'Spellen', article: 'het' },
    location: { singular: 'Bowlingbaan', plural: 'Bowlingbanen', article: 'de' }
  },
  
  HOTEL: {
    booking: { singular: 'Reservering', plural: 'Reserveringen', verb: 'Reserveren', article: 'de' },
    resource: { singular: 'Kamer', plural: 'Kamers', article: 'de' },
    customer: { singular: 'Gast', plural: 'Gasten', article: 'de' },
    staff: { singular: 'Receptionist', plural: 'Receptionisten', article: 'de' },
    service: { singular: 'Verblijf', plural: 'Verblijven', article: 'het' },
    location: { singular: 'Hotel', plural: 'Hotels', article: 'het' }
  },
  
  VACATION_RENTAL: {
    booking: { singular: 'Reservering', plural: 'Reserveringen', verb: 'Reserveren', article: 'de' },
    resource: { singular: 'Vakantiewoning', plural: 'Vakantiewoningen', article: 'de' },
    customer: { singular: 'Huurder', plural: 'Huurders', article: 'de' },
    staff: { singular: 'Verhuurder', plural: 'Verhuurders', article: 'de' },
    service: { singular: 'Verblijf', plural: 'Verblijven', article: 'het' },
    location: { singular: 'Vakantiewoning', plural: 'Vakantiewoningen', article: 'de' }
  },
  
  COWORKING_SPACE: {
    booking: { singular: 'Reservering', plural: 'Reserveringen', verb: 'Reserveren', article: 'de' },
    resource: { singular: 'Werkplek', plural: 'Werkplekken', article: 'de' },
    customer: { singular: 'Lid', plural: 'Leden', article: 'het' },
    staff: { singular: 'Community Manager', plural: 'Community Managers', article: 'de' },
    service: { singular: 'Werkplek', plural: 'Werkplekken', article: 'de' },
    location: { singular: 'Coworking Space', plural: 'Coworking Spaces', article: 'de' }
  },
  
  MEETING_ROOM: {
    booking: { singular: 'Reservering', plural: 'Reserveringen', verb: 'Reserveren', article: 'de' },
    resource: { singular: 'Vergaderzaal', plural: 'Vergaderzalen', article: 'de' },
    customer: { singular: 'Organisator', plural: 'Organisatoren', article: 'de' },
    staff: { singular: 'Facilitair Medewerker', plural: 'Facilitair Medewerkers', article: 'de' },
    service: { singular: 'Vergadering', plural: 'Vergaderingen', article: 'de' },
    location: { singular: 'Vergadercentrum', plural: 'Vergadercentra', article: 'het' }
  },
  
  // ============================================================================
  // CATCH-ALL
  // ============================================================================
  
  OTHER: {
    booking: { singular: 'Boeking', plural: 'Boekingen', verb: 'Boeken', article: 'de' },
    resource: { singular: 'Resource', plural: 'Resources', article: 'de' },
    customer: { singular: 'Klant', plural: 'Klanten', article: 'de' },
    staff: { singular: 'Medewerker', plural: 'Medewerkers', article: 'de' },
    service: { singular: 'Service', plural: 'Services', article: 'de' },
    location: { singular: 'Locatie', plural: 'Locaties', article: 'de' }
  }
};

/**
 * Get terminology for a specific business sector
 * Defaults to RESTAURANT if sector is undefined or not found
 * 
 * @param sector - The business sector enum value
 * @returns Complete terminology set for that sector
 */
export function getTerminology(sector?: BusinessSector | null): TerminologySet {
  if (!sector || !(sector in TERMINOLOGY_MAP)) {
    return TERMINOLOGY_MAP.RESTAURANT; // Safe fallback
  }
  return TERMINOLOGY_MAP[sector];
}

/**
 * Get all available sectors with their display names
 * Useful for onboarding sector selection dropdown
 * 
 * @returns Array of {value, label} objects for UI
 */
export function getAllSectors(): Array<{ value: BusinessSector; label: string }> {
  return (Object.keys(TERMINOLOGY_MAP) as BusinessSector[]).map(sector => ({
    value: sector,
    label: TERMINOLOGY_MAP[sector].location.singular
  }));
}

/**
 * Get sectors grouped by category
 * Useful for organized sector selection UI
 */
export function getSectorsByCategory() {
  return {
    'Horeca': ['RESTAURANT', 'CAFE', 'BAR'] as BusinessSector[],
    'Beauty & Wellness': ['BEAUTY_SALON', 'HAIR_SALON', 'NAIL_STUDIO', 'SPA', 'MASSAGE_THERAPY', 'TANNING_SALON'] as BusinessSector[],
    'Gezondheidszorg': ['MEDICAL_PRACTICE', 'DENTIST', 'PHYSIOTHERAPY', 'PSYCHOLOGY', 'VETERINARY'] as BusinessSector[],
    'Fitness & Sport': ['GYM', 'YOGA_STUDIO', 'PERSONAL_TRAINING', 'DANCE_STUDIO', 'MARTIAL_ARTS'] as BusinessSector[],
    'Professionele Diensten': ['LEGAL', 'ACCOUNTING', 'CONSULTING', 'FINANCIAL_ADVISORY'] as BusinessSector[],
    'Educatie': ['TUTORING', 'MUSIC_LESSONS', 'LANGUAGE_SCHOOL', 'DRIVING_SCHOOL'] as BusinessSector[],
    'Automotive': ['CAR_REPAIR', 'CAR_WASH', 'CAR_RENTAL'] as BusinessSector[],
    'Thuisdiensten': ['CLEANING', 'PLUMBING', 'ELECTRICIAN', 'GARDENING'] as BusinessSector[],
    'Entertainment & Venues': ['EVENT_VENUE', 'PHOTO_STUDIO', 'ESCAPE_ROOM', 'BOWLING', 'HOTEL', 'VACATION_RENTAL', 'COWORKING_SPACE', 'MEETING_ROOM'] as BusinessSector[],
    'Overig': ['OTHER'] as BusinessSector[]
  };
}

