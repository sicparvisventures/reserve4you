'use client';

import { useEffect, useState, useRef } from 'react';
import { MapPin } from 'lucide-react';
import { ReserveBookingModal } from '@/components/booking/ReserveBookingModal';

interface Location {
  id: string;
  name: string;
  slug: string;
  latitude: string | null;
  longitude: string | null;
  address_line1?: string;
  city?: string;
  cuisine?: string; // Database column name
  cuisine_type?: string; // Alias for compatibility
  price_range?: number;
  hero_image_url?: string;
}

interface DiscoverMapProps {
  locations: Location[];
  userLocation?: { lat: number; lng: number } | null;
  className?: string;
}

export function DiscoverMap({ locations, userLocation, className = '' }: DiscoverMapProps) {
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const mapRef = useRef<any>(null);
  const mapInstanceRef = useRef<any>(null);

  // Only render map on client side (Leaflet requires window object)
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || !mapRef.current) return;

    // Dynamically import Leaflet only on client side
    let map: any;
    let markers: any[] = [];

    const initMap = async () => {
      const L = (await import('leaflet')).default;
      // CSS is loaded via next.config or global styles

      // Fix for default marker icons in Next.js
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      // Determine initial center
      let center: [number, number] = [50.8503, 4.3517]; // Default: Brussels
      let zoom = 8;

      if (userLocation) {
        center = [userLocation.lat, userLocation.lng];
        zoom = 12;
      } else if (locations.length > 0 && locations[0].latitude && locations[0].longitude) {
        center = [parseFloat(locations[0].latitude), parseFloat(locations[0].longitude)];
        zoom = 10;
      }

      // Create map
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }

      map = L.map(mapRef.current, {
        center,
        zoom,
        zoomControl: true,
        scrollWheelZoom: true,
        dragging: true,
        touchZoom: true,
      });

      mapInstanceRef.current = map;

      // Add tile layer with Reserve4You styling
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        maxZoom: 19,
      }).addTo(map);

      // Add user location marker if available
      if (userLocation) {
        const userIcon = L.divIcon({
          className: 'custom-user-marker',
          html: `
            <div style="
              width: 20px;
              height: 20px;
              background: #0066FF;
              border: 3px solid white;
              border-radius: 50%;
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            "></div>
          `,
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        });

        L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
          .addTo(map)
          .bindPopup('<div style="text-align: center; font-weight: 600;">Uw locatie</div>');
      }

      // Add restaurant markers
      const validLocations = locations.filter(loc => loc.latitude && loc.longitude);
      
      validLocations.forEach((location) => {
        const lat = parseFloat(location.latitude!);
        const lng = parseFloat(location.longitude!);

        // Custom marker icon with Reserve4You branding
        const customIcon = L.divIcon({
          className: 'custom-restaurant-marker',
          html: `
            <div style="
              width: 36px;
              height: 36px;
              background: linear-gradient(135deg, #FF5A5F 0%, #FF385C 100%);
              border: 3px solid white;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 4px 12px rgba(255, 90, 95, 0.4);
              cursor: pointer;
              transition: all 0.2s ease;
            " class="marker-inner">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
            </div>
          `,
          iconSize: [36, 36],
          iconAnchor: [18, 18],
          popupAnchor: [0, -18],
        });

        const marker = L.marker([lat, lng], { icon: customIcon }).addTo(map);

        // Popup content
        const cuisineDisplay = location.cuisine || location.cuisine_type;
        const priceSymbol = location.price_range ? '€'.repeat(location.price_range) : '';
        const popupContent = `
          <div style="min-width: 200px; padding: 4px;">
            <h3 style="font-size: 16px; font-weight: 700; margin: 0 0 8px 0; color: #1a1a1a;">
              ${location.name}
            </h3>
            <div style="display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px;">
              ${location.city ? `<p style="font-size: 13px; color: #666; margin: 0; display: flex; align-items: center; gap: 6px;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
                ${location.city}
              </p>` : ''}
              ${cuisineDisplay ? `<p style="font-size: 13px; color: #666; margin: 0;">${cuisineDisplay}</p>` : ''}
              ${priceSymbol ? `<p style="font-size: 13px; font-weight: 600; color: #FF5A5F; margin: 0;">${priceSymbol}</p>` : ''}
            </div>
            <button 
              onclick="window.openReservation_${location.id.replace(/-/g, '_')}"
              style="
                width: 100%;
                padding: 10px 16px;
                background: linear-gradient(135deg, #FF5A5F 0%, #FF385C 100%);
                color: white;
                border: none;
                border-radius: 8px;
                font-weight: 600;
                font-size: 14px;
                cursor: pointer;
                transition: all 0.2s;
                box-shadow: 0 2px 8px rgba(255, 90, 95, 0.3);
              "
              onmouseover="this.style.opacity='0.9'; this.style.transform='translateY(-1px)'; this.style.boxShadow='0 4px 12px rgba(255, 90, 95, 0.4)'"
              onmouseout="this.style.opacity='1'; this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 8px rgba(255, 90, 95, 0.3)'"
            >
              Reserveren
            </button>
          </div>
        `;

        marker.bindPopup(popupContent, {
          maxWidth: 300,
          className: 'custom-popup',
        });

        // Add global function to handle reservation button click
        (window as any)[`openReservation_${location.id.replace(/-/g, '_')}`] = () => {
          setSelectedLocation(location);
          setIsBookingModalOpen(true);
          map.closePopup();
        };

        // Hover effect
        marker.on('mouseover', function(this: any) {
          const markerEl = this.getElement();
          if (markerEl) {
            const innerDiv = markerEl.querySelector('.marker-inner') as HTMLElement;
            if (innerDiv) {
              innerDiv.style.transform = 'scale(1.15)';
              innerDiv.style.boxShadow = '0 6px 20px rgba(255, 90, 95, 0.5)';
            }
          }
        });

        marker.on('mouseout', function(this: any) {
          const markerEl = this.getElement();
          if (markerEl) {
            const innerDiv = markerEl.querySelector('.marker-inner') as HTMLElement;
            if (innerDiv) {
              innerDiv.style.transform = 'scale(1)';
              innerDiv.style.boxShadow = '0 4px 12px rgba(255, 90, 95, 0.4)';
            }
          }
        });

        markers.push(marker);
      });

      // Fit bounds to show all markers
      if (markers.length > 1) {
        const group = L.featureGroup(markers);
        map.fitBounds(group.getBounds().pad(0.1));
      } else if (markers.length === 1 && !userLocation) {
        // If only one marker and no user location, center on it
        const firstLocation = validLocations[0];
        map.setView([parseFloat(firstLocation.latitude!), parseFloat(firstLocation.longitude!)], 13);
      }
    };

    initMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isClient, locations, userLocation]);

  if (!isClient) {
    return (
      <div className={`${className} flex items-center justify-center bg-muted/30`}>
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full mb-3">
            <MapPin className="w-6 h-6 text-primary" />
          </div>
          <p className="text-sm text-muted-foreground">Kaart laden...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div 
        ref={mapRef} 
        className={`${className} rounded-2xl overflow-hidden border border-border shadow-lg`}
        style={{ minHeight: '400px', height: '100%', width: '100%' }}
      />
      
      {/* Booking Modal */}
      {selectedLocation && (
        <ReserveBookingModal
          open={isBookingModalOpen}
          onOpenChange={setIsBookingModalOpen}
          location={{
            id: selectedLocation.id,
            name: selectedLocation.name,
            address_line1: selectedLocation.address_line1,
            city: selectedLocation.city,
          }}
        />
      )}

      {/* Custom CSS for popup styling */}
      <style jsx global>{`
        .leaflet-popup-content-wrapper {
          border-radius: 12px !important;
          padding: 0 !important;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12) !important;
        }
        .leaflet-popup-content {
          margin: 16px !important;
        }
        .leaflet-popup-tip {
          box-shadow: 0 3px 14px rgba(0, 0, 0, 0.1) !important;
        }
        .custom-popup .leaflet-popup-close-button {
          font-size: 24px !important;
          padding: 8px 12px !important;
          color: #666 !important;
        }
        .custom-popup .leaflet-popup-close-button:hover {
          color: #1a1a1a !important;
        }
      `}</style>
    </>
  );
}

