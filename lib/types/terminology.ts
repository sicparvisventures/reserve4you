/**
 * RESERVE4YOU MULTI-SECTOR TERMINOLOGY SYSTEM
 * 
 * Type definitions for the smart terminology mapping system
 * This enables "configuration over customization" - changing UI labels
 * based on business sector without any UI/UX code changes
 */

/**
 * All supported business sectors (43 total)
 * Must match database ENUM: business_sector
 */
export type BusinessSector = 
  // Hospitality (Horeca)
  | 'RESTAURANT'
  | 'CAFE'
  | 'BAR'
  
  // Beauty & Wellness
  | 'BEAUTY_SALON'
  | 'HAIR_SALON'
  | 'NAIL_STUDIO'
  | 'SPA'
  | 'MASSAGE_THERAPY'
  | 'TANNING_SALON'
  
  // Healthcare
  | 'MEDICAL_PRACTICE'
  | 'DENTIST'
  | 'PHYSIOTHERAPY'
  | 'PSYCHOLOGY'
  | 'VETERINARY'
  
  // Fitness & Sports
  | 'GYM'
  | 'YOGA_STUDIO'
  | 'PERSONAL_TRAINING'
  | 'DANCE_STUDIO'
  | 'MARTIAL_ARTS'
  
  // Professional Services
  | 'LEGAL'
  | 'ACCOUNTING'
  | 'CONSULTING'
  | 'FINANCIAL_ADVISORY'
  
  // Education
  | 'TUTORING'
  | 'MUSIC_LESSONS'
  | 'LANGUAGE_SCHOOL'
  | 'DRIVING_SCHOOL'
  
  // Automotive
  | 'CAR_REPAIR'
  | 'CAR_WASH'
  | 'CAR_RENTAL'
  
  // Home Services
  | 'CLEANING'
  | 'PLUMBING'
  | 'ELECTRICIAN'
  | 'GARDENING'
  
  // Entertainment & Hospitality
  | 'EVENT_VENUE'
  | 'PHOTO_STUDIO'
  | 'ESCAPE_ROOM'
  | 'BOWLING'
  | 'HOTEL'
  | 'VACATION_RENTAL'
  | 'COWORKING_SPACE'
  | 'MEETING_ROOM'
  
  // Catch-all
  | 'OTHER';

/**
 * Resource types (6 types)
 * Must match database ENUM: resource_type
 */
export type ResourceType =
  | 'TABLE'      // Restaurant tables, cafe seats
  | 'ROOM'       // Spa rooms, meeting rooms, hotel rooms
  | 'STAFF'      // Hairdressers, doctors, personal trainers
  | 'EQUIPMENT'  // Gym equipment, photography gear
  | 'VEHICLE'    // Rental cars, driving school cars
  | 'SPACE';     // Event spaces, coworking desks

/**
 * A set of terms for a specific concept
 * Includes singular/plural forms, verb, and Dutch article
 */
export interface TermSet {
  singular: string;    // "Reservering", "Afspraak", "Sessie"
  plural: string;      // "Reserveringen", "Afspraken", "Sessies"
  verb?: string;       // "Reserveren", "Boeken", "Plannen"
  article?: 'de' | 'het';  // Dutch articles for grammatical correctness
}

/**
 * Complete terminology set for a business sector
 * This replaces hardcoded UI labels with sector-specific terminology
 */
export interface TerminologySet {
  // Core concepts
  booking: TermSet;    // "Reservering" vs "Afspraak" vs "Sessie"
  resource: TermSet;   // "Tafel" vs "Behandelkamer" vs "Spreekkamer"
  customer: TermSet;   // "Gast" vs "Klant" vs "Patiënt"
  staff: TermSet;      // "Medewerker" vs "Arts" vs "Trainer"
  service: TermSet;    // "Gerecht" vs "Behandeling" vs "Consultatie"
  location: TermSet;   // "Restaurant" vs "Salon" vs "Praktijk"
}

/**
 * Extended location interface with multi-sector fields
 */
export interface Location {
  id: string;
  name: string;
  business_sector: BusinessSector;
  sector_config: SectorConfig;
  // ... other location fields
}

/**
 * Sector-specific configuration stored in JSONB
 * Flexible metadata for sector-specific features
 */
export interface SectorConfig {
  // Booking behavior
  default_duration_minutes?: number;      // 120 for restaurant, 60 for salon, 30 for doctor
  requires_service_selection?: boolean;   // True for salons, false for restaurants
  allows_recurring_bookings?: boolean;    // True for fitness, false for restaurants
  requires_intake_form?: boolean;         // True for medical, false for restaurants
  
  // Resource configuration
  primary_resource_type?: ResourceType;   // TABLE for restaurant, STAFF for salon
  allows_multi_resource_booking?: boolean; // True for events (multiple rooms)
  
  // Service catalog
  has_service_catalog?: boolean;          // True for salons, false for simple restaurants
  service_categories?: string[];          // ["Facial", "Massage"] or ["Lunch", "Dinner"]
  
  // Staff management
  requires_staff_assignment?: boolean;    // True for salons/medical, false for restaurants
  staff_can_have_multiple_bookings?: boolean; // False for personal services
  
  // Customer preferences
  captures_allergies?: boolean;           // True for restaurants/medical
  captures_preferences?: boolean;         // True for beauty/wellness
  
  // Billing & deposits
  requires_deposit?: boolean;
  deposit_percentage?: number;
  
  // Custom fields (sector-specific)
  custom_fields?: Record<string, any>;
}

/**
 * Helper type for resource metadata
 */
export interface ResourceMetadata {
  // Common across all sectors
  floor_level?: number;
  accessibility?: 'wheelchair' | 'none';
  
  // Resource-specific (stored in JSONB)
  // Tables: { shape: 'round' | 'square', is_outdoor: boolean }
  // Rooms: { has_window: boolean, has_shower: boolean }
  // Staff: { specialization: string[], languages: string[] }
  // Equipment: { brand: string, model: string }
  // Vehicles: { license_plate: string, fuel_type: string }
  [key: string]: any;
}

/**
 * Service offering metadata
 */
export interface ServiceMetadata {
  // Common fields
  preparation_time_minutes?: number;
  cleanup_time_minutes?: number;
  
  // Service-specific (stored in JSONB)
  // Beauty: { product_used: string, skin_type: string[] }
  // Medical: { requires_prescription: boolean, diagnosis_codes: string[] }
  // Fitness: { intensity_level: 1-5, equipment_needed: string[] }
  [key: string]: any;
}

