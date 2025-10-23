'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';

interface PreviewClientProps {
  widgetCode: string;
}

export function PreviewClient({ widgetCode }: PreviewClientProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonContainerRef = useRef<HTMLDivElement>(null);
  const initRef = useRef(false);
  const [activePreview, setActivePreview] = useState<'grid' | 'button'>('grid');

  useEffect(() => {
    // Prevent double initialization
    if (initRef.current) return;
    initRef.current = true;

    console.log('[Preview] Initializing widget:', widgetCode);

    // Initialize based on active preview
    if (activePreview === 'grid') {
      // Load grid widget
      if (containerRef.current) {
        containerRef.current.innerHTML = `<div data-r4y-widget="${widgetCode}"></div>`;
      }

      const script = document.createElement('script');
      script.src = '/widget-embed.js';
      script.async = true;
      
      script.onload = () => {
        console.log('[Preview] Grid widget loaded');
      };
      
      document.head.appendChild(script);
    } else {
      // Load button widget
      if (buttonContainerRef.current) {
        buttonContainerRef.current.innerHTML = `<div data-r4y-widget-button="${widgetCode}"></div>`;
      }

      const script = document.createElement('script');
      script.src = '/widget-button.js';
      script.async = true;
      
      script.onload = () => {
        console.log('[Preview] Button widget loaded');
      };
      
      document.head.appendChild(script);
    }
  }, [widgetCode, activePreview]);

  return (
    <div>
      {/* Toggle Buttons */}
      <div className="flex gap-2 mb-6 p-4 bg-muted/50 rounded-lg">
        <Button
          variant={activePreview === 'grid' ? 'default' : 'outline'}
          onClick={() => {
            setActivePreview('grid');
            initRef.current = false;
          }}
        >
          Standaard Widget (Full Grid)
        </Button>
        <Button
          variant={activePreview === 'button' ? 'default' : 'outline'}
          onClick={() => {
            setActivePreview('button');
            initRef.current = false;
          }}
        >
          Floating Button Widget
        </Button>
      </div>

      {/* Grid Widget */}
      {activePreview === 'grid' && (
        <div ref={containerRef} className="min-h-[400px]">
          {/* Grid widget will be injected here */}
        </div>
      )}

      {/* Button Widget */}
      {activePreview === 'button' && (
        <div className="min-h-[400px]">
          <div className="p-8 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border-2 border-dashed border-gray-300">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Floating Button Preview
              </h3>
              <p className="text-sm text-gray-600">
                Kijk rechtsonder op deze preview voor het floating button. 
                Klik erop om de modal met alle locaties te openen.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-lg shadow-sm">
              <h4 className="font-medium mb-4">Voorbeeld Website Content</h4>
              <p className="text-gray-600 mb-4">
                Dit is een voorbeeld van hoe de floating button eruitziet op een echte website. 
                Het knopje blijft altijd zichtbaar rechtsonder, zelfs bij scrollen.
              </p>
              <p className="text-gray-600">
                Klanten kunnen op elk moment op het knopje klikken om alle restaurant locaties te zien 
                en direct een reservering te maken.
              </p>
            </div>
          </div>
          
          {/* Button widget container */}
          <div ref={buttonContainerRef}>
            {/* Button will be injected here */}
          </div>
        </div>
      )}
    </div>
  );
}

