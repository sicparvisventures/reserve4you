/**
 * Server actions for discover page
 */

import { createClient } from '@/lib/supabase/server';

/**
 * Get all available cuisine types from the database
 */
export async function getAvailableCuisineTypes(): Promise<string[]> {
  try {
    const supabase = await createClient();
    
    // Query directly from locations table
    const { data, error } = await supabase
      .from('locations')
      .select('cuisine')
      .eq('is_public', true)
      .eq('is_active', true)
      .not('cuisine', 'is', null);
    
    if (error) {
      console.error('Error fetching cuisine types:', error);
      return [];
    }
    
    if (!data || data.length === 0) {
      return [];
    }
    
    // Get unique cuisine types, sorted alphabetically
    const cuisineTypes = [...new Set(data.map(loc => loc.cuisine).filter(Boolean))];
    return cuisineTypes.sort();
    
  } catch (error) {
    console.error('Error in getAvailableCuisineTypes:', error);
    return [];
  }
}

/**
 * Get filter statistics for discover page
 */
export async function getDiscoverFilterStats() {
  const supabase = await createClient();
  
  try {
    const { data: locations, error } = await supabase
      .from('locations')
      .select('cuisine, price_range, group_friendly, has_deals')
      .eq('is_public', true)
      .eq('is_active', true);
    
    if (error) {
      console.error('Error fetching filter stats:', error);
      return {
        cuisines: [],
        priceRanges: [1, 2, 3, 4],
        hasGroupFriendly: false,
        hasDeals: false,
      };
    }
    
    const cuisines = [...new Set(locations.map(loc => loc.cuisine).filter(Boolean))].sort();
    const priceRanges = [...new Set(locations.map(loc => loc.price_range).filter(Boolean))].sort();
    const hasGroupFriendly = locations.some(loc => loc.group_friendly);
    const hasDeals = locations.some(loc => loc.has_deals);
    
    return {
      cuisines,
      priceRanges,
      hasGroupFriendly,
      hasDeals,
      totalLocations: locations.length,
    };
  } catch (error) {
    console.error('Error in getDiscoverFilterStats:', error);
    return {
      cuisines: [],
      priceRanges: [1, 2, 3, 4],
      hasGroupFriendly: false,
      hasDeals: false,
      totalLocations: 0,
    };
  }
}

