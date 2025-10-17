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
  
  return (
    <div className="min-h-screen bg-background">
      <LocationDetailClient location={location} />
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

