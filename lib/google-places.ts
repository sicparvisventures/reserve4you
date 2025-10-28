/**
 * Google Places API Integration
 * 
 * Provides utilities to search and fetch business data from Google Places API
 */

export interface GooglePlaceAutocomplete {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
  types: string[];
}

export interface GooglePlaceDetails {
  place_id: string;
  name: string;
  formatted_address: string;
  address_components: Array<{
    long_name: string;
    short_name: string;
    types: string[];
  }>;
  formatted_phone_number?: string;
  international_phone_number?: string;
  website?: string;
  opening_hours?: {
    open_now: boolean;
    periods: Array<{
      open: { day: number; time: string };
      close: { day: number; time: string };
    }>;
    weekday_text: string[];
  };
  rating?: number;
  user_ratings_total?: number;
  photos?: Array<{
    photo_reference: string;
    height: number;
    width: number;
  }>;
  business_status: string;
  types: string[];
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  url?: string;
  utc_offset_minutes?: number;
  price_level?: number;
}

export interface LocationFromGoogle {
  name: string;
  address_line1: string;
  city: string;
  postal_code: string;
  country: string;
  phone?: string;
  email?: string;
  website?: string;
  description?: string;
  cuisine_type?: string;
  business_sector?: string;
  price_range?: number;
  latitude?: number;
  longitude?: number;
  opening_hours?: any;
  google_place_id: string;
  google_data: GooglePlaceDetails;
}

/**
 * Map Google Place types to business sectors
 */
export function mapGoogleTypesToBusinessSector(types: string[]): string {
  const typeMapping: Record<string, string> = {
    // Horeca
    'restaurant': 'RESTAURANT',
    'cafe': 'CAFE',
    'bar': 'BAR',
    'night_club': 'BAR',
    'meal_takeaway': 'RESTAURANT',
    'meal_delivery': 'RESTAURANT',
    
    // Beauty & Wellness
    'beauty_salon': 'BEAUTY_SALON',
    'hair_care': 'HAIR_SALON',
    'spa': 'SPA',
    'nail_salon': 'NAIL_STUDIO',
    
    // Health
    'doctor': 'MEDICAL_PRACTICE',
    'dentist': 'DENTIST',
    'physiotherapist': 'PHYSIOTHERAPY',
    'hospital': 'MEDICAL_PRACTICE',
    'veterinary_care': 'VETERINARY',
    
    // Fitness
    'gym': 'GYM',
    
    // Professional Services
    'lawyer': 'LEGAL',
    'accounting': 'ACCOUNTING',
    
    // Automotive
    'car_repair': 'CAR_REPAIR',
    'car_wash': 'CAR_WASH',
    'car_rental': 'CAR_RENTAL',
    
    // Entertainment
    'hotel': 'HOTEL',
    'lodging': 'VACATION_RENTAL',
    'event_venue': 'EVENT_VENUE',
    
    // Home Services
    'plumber': 'PLUMBING',
    'electrician': 'ELECTRICIAN',
  };

  // Find first matching type
  for (const type of types) {
    if (typeMapping[type]) {
      return typeMapping[type];
    }
  }

  return 'OTHER';
}

/**
 * Map Google price level (0-4) to our price range (1-3)
 */
export function mapGooglePriceLevel(priceLevel?: number): number {
  if (!priceLevel) return 2; // Default to medium
  
  if (priceLevel <= 1) return 1; // $ or Free
  if (priceLevel === 2) return 2; // $$
  return 3; // $$$ or $$$$
}

/**
 * Extract cuisine type from Google Place categories
 */
export function extractCuisineType(types: string[], name: string): string | undefined {
  const cuisineTypes = [
    'italian', 'french', 'japanese', 'chinese', 'indian', 'mexican',
    'thai', 'greek', 'spanish', 'american', 'mediterranean', 'vietnamese',
    'korean', 'turkish', 'lebanese', 'belgian', 'moroccan'
  ];

  // Check if any cuisine type is in the types array
  for (const type of types) {
    const lowerType = type.toLowerCase();
    for (const cuisine of cuisineTypes) {
      if (lowerType.includes(cuisine)) {
        return cuisine.charAt(0).toUpperCase() + cuisine.slice(1);
      }
    }
  }

  // Check if cuisine is in the name
  const lowerName = name.toLowerCase();
  for (const cuisine of cuisineTypes) {
    if (lowerName.includes(cuisine)) {
      return cuisine.charAt(0).toUpperCase() + cuisine.slice(1);
    }
  }

  return undefined;
}

/**
 * Extract address components
 */
export function extractAddressComponents(addressComponents: GooglePlaceDetails['address_components']) {
  const result = {
    street_number: '',
    route: '',
    city: '',
    postal_code: '',
    country: '',
  };

  for (const component of addressComponents) {
    if (component.types.includes('street_number')) {
      result.street_number = component.long_name;
    }
    if (component.types.includes('route')) {
      result.route = component.long_name;
    }
    if (component.types.includes('locality')) {
      result.city = component.long_name;
    }
    if (component.types.includes('postal_code')) {
      result.postal_code = component.long_name;
    }
    if (component.types.includes('country')) {
      result.country = component.short_name;
    }
  }

  return result;
}

/**
 * Convert Google Place Details to Location data
 */
export function convertGooglePlaceToLocation(place: GooglePlaceDetails): LocationFromGoogle {
  const addressParts = extractAddressComponents(place.address_components);
  const address = `${addressParts.street_number} ${addressParts.route}`.trim() || place.formatted_address;

  return {
    name: place.name,
    address_line1: address,
    city: addressParts.city,
    postal_code: addressParts.postal_code,
    country: addressParts.country || 'BE',
    phone: place.formatted_phone_number || place.international_phone_number,
    website: place.website,
    business_sector: mapGoogleTypesToBusinessSector(place.types),
    cuisine_type: extractCuisineType(place.types, place.name),
    price_range: mapGooglePriceLevel(place.price_level),
    latitude: place.geometry?.location?.lat,
    longitude: place.geometry?.location?.lng,
    google_place_id: place.place_id,
    google_data: place,
  };
}

