'use client';

import { useEffect } from 'react';
import Script from 'next/script';

declare global {
  interface Window {
    googleTranslateElementInit: () => void;
    google: any;
  }
}

export function GoogleTranslateWidget() {
  useEffect(() => {
    // Initialize Google Translate
    window.googleTranslateElementInit = function() {
      console.log('Google Translate initializing...');
      
      if (window.google && window.google.translate) {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: 'nl',  // Original language is Dutch
            includedLanguages: 'en,nl,fr',
            layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
            autoDisplay: false,
          },
          'google_translate_element'
        );
        
        console.log('Google Translate initialized successfully');
      }
    };
  }, []);

  return (
    <>
      <Script
        src="//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
        strategy="lazyOnload"
        onLoad={() => console.log('Google Translate script loaded')}
        onError={(e) => console.error('Google Translate script failed to load:', e)}
      />
      <style jsx global>{`
        /* Hide Google Translate banner */
        .goog-te-banner-frame {
          display: none !important;
        }
        
        .skiptranslate {
          display: none !important;
        }
        
        /* Remove top padding from body */
        body {
          top: 0 !important;
          position: static !important;
        }
        
        /* Hide the translate element completely */
        #google_translate_element {
          display: none !important;
          visibility: hidden !important;
        }
        
        /* Hide all Google Translate UI */
        .goog-te-combo,
        .goog-te-gadget,
        .goog-te-menu-value,
        .goog-te-gadget-simple,
        .goog-logo-link {
          display: none !important;
        }
        
        /* Remove iframe styling issues */
        .goog-te-banner-frame.skiptranslate {
          display: none !important;
        }
        
        iframe.goog-te-menu-frame {
          display: none !important;
        }
        
        /* Keep translated content visible */
        font[style*="vertical-align"] {
          vertical-align: baseline !important;
        }
        
        /* Protect language selector from translation */
        .notranslate,
        [translate="no"] {
          /* Force Google Translate to skip these elements */
        }
        
        /* Ensure no weird spacing from Google Translate */
        body > .skiptranslate {
          display: none !important;
        }
        
        /* Fix any layout shifts from translation */
        html.translated-ltr,
        html.translated-rtl {
          margin-top: 0 !important;
        }
        
        body.translated-ltr,
        body.translated-rtl {
          top: 0 !important;
          margin-top: 0 !important;
        }
      `}</style>
    </>
  );
}

