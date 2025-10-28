/**
 * Server actions for favorites functionality
 */

'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * Get favorite location IDs for the current user
 * Used to check which locations are favorited
 */
export async function getFavoriteLocationIds(): Promise<string[]> {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return [];
    }

    // Get consumer record
    const { data: consumer, error: consumerError } = await supabase
      .from('consumers')
      .select('id')
      .eq('auth_user_id', user.id)
      .single();

    if (consumerError || !consumer) {
      return [];
    }

    // Get favorite location IDs
    const { data: favorites, error: favoritesError } = await supabase
      .from('favorites')
      .select('location_id')
      .eq('consumer_id', consumer.id);

    if (favoritesError) {
      console.error('Error fetching favorite location IDs:', favoritesError);
      return [];
    }

    return favorites?.map(f => f.location_id) || [];
  } catch (error) {
    console.error('Error in getFavoriteLocationIds:', error);
    return [];
  }
}

/**
 * Check if a specific location is favorited by the current user
 */
export async function isLocationFavorited(locationId: string): Promise<boolean> {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return false;
    }

    // Get consumer record
    const { data: consumer, error: consumerError } = await supabase
      .from('consumers')
      .select('id')
      .eq('auth_user_id', user.id)
      .single();

    if (consumerError || !consumer) {
      return false;
    }

    // Check if favorite exists
    const { data: favorite, error: favoriteError } = await supabase
      .from('favorites')
      .select('id')
      .eq('consumer_id', consumer.id)
      .eq('location_id', locationId)
      .single();

    if (favoriteError) {
      return false;
    }

    return !!favorite;
  } catch (error) {
    console.error('Error in isLocationFavorited:', error);
    return false;
  }
}

