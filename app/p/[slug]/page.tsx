/**
 * Location Detail Page
 * 
 * /p/[slug]
 * 
 * Shows restaurant details with tabs:
 * - Overview
 * - Availability
 * - Menu
 * - Location
 */

import { getPublicLocation } from '@/lib/auth/tenant-dal';
import { notFound } from 'next/navigation';
import { LocationDetailClient } from './LocationDetailClient';
import { createClient } from '@/lib/supabase/server';

interface LocationPageProps {
  params: Promise<{ slug: string }>;
}

export default async function LocationPage({ params }: LocationPageProps) {
  const { slug } = await params;
  
  // Get location with all related data
  const location = await getPublicLocation(slug);
  
  if (!location) {
    notFound();
  }

  // Fetch menu data
  const supabase = await createClient();
  
  const { data: menuCategories } = await supabase
    .from('menu_categories')
    .select('*')
    .eq('location_id', location.id)
    .eq('is_active', true)
    .order('display_order');

  const { data: menuItems } = await supabase
    .from('menu_items')
    .select('*')
    .eq('location_id', location.id)
    .eq('is_available', true)
    .order('display_order');

  // Group items by category
  const menuData = (menuCategories || []).map(cat => ({
    ...cat,
    items: (menuItems || []).filter((item: any) => item.category_id === cat.id)
  }));
  
  return (
    <div className="min-h-screen bg-background">
      <LocationDetailClient location={location} menuData={menuData} />
    </div>
  );
}

// Generate metadata
export async function generateMetadata({ params }: LocationPageProps) {
  const { slug } = await params;
  const location = await getPublicLocation(slug);
  
  if (!location) {
    return {
      title: 'Restaurant niet gevonden',
    };
  }
  
  return {
    title: `${location.name} - Reserveer nu bij R4Y`,
    description: location.description || `Reserveer nu bij ${location.name}`,
  };
}

