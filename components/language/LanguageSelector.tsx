'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Globe, Check } from 'lucide-react';

type Language = 'en' | 'nl' | 'fr';

interface LanguageOption {
  code: Language;
  name: string;
  nativeName: string;
  googleCode: string;
}

const languages: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English', googleCode: '' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', googleCode: 'nl' },
  { code: 'fr', name: 'French', nativeName: 'Français', googleCode: 'fr' },
];

declare global {
  interface Window {
    google: any;
  }
}

export function LanguageSelector() {
  const [currentLanguage, setCurrentLanguage] = useState<Language>('nl');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Load saved language from localStorage or default to NL (original)
    const saved = localStorage.getItem('r4y-language') as Language;
    if (saved && ['en', 'nl', 'fr'].includes(saved)) {
      setCurrentLanguage(saved);
      // Apply on mount if not default
      if (saved !== 'nl') {
        setTimeout(() => applyLanguage(saved), 500);
      }
    } else {
      setCurrentLanguage('nl');
      localStorage.setItem('r4y-language', 'nl');
    }
  }, []);

  const getCookie = (name: string): string | null => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
    return null;
  };

  const setCookie = (name: string, value: string, days: number = 365) => {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
  };

  const deleteCookie = (name: string) => {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
  };

  const applyLanguage = (lang: Language) => {
    console.log('🌍 Applying language:', lang);
    
    // Update document language
    document.documentElement.lang = lang;
    
    // Google Translate uses cookies for language selection
    const langConfig = languages.find(l => l.code === lang);
    if (!langConfig) return;
    
    if (lang === 'nl') {
      // Reset to original Dutch - need to clear ALL translation cookies
      // Try multiple methods to ensure cookie is cleared
      const domains = ['', 'localhost', window.location.hostname];
      const paths = ['/', window.location.pathname];
      
      domains.forEach(domain => {
        paths.forEach(path => {
          document.cookie = `googtrans=;domain=${domain};path=${path};expires=Thu, 01 Jan 1970 00:00:00 UTC;`;
          document.cookie = `googtrans=/nl/nl;domain=${domain};path=${path};max-age=0;`;
        });
      });
      
      // Also try without domain
      document.cookie = 'googtrans=;path=/;expires=Thu, 01 Jan 1970 00:00:00 UTC;';
      document.cookie = 'googtrans=/nl/nl;path=/;max-age=0;';
      
      console.log('✅ Reset to Nederlands (original) - cookies cleared');
      console.log('Current cookies:', document.cookie);
    } else {
      // Translate from Dutch to selected language
      const cookieValue = `/nl/${lang}`;
      setCookie('googtrans', cookieValue);
      console.log(`✅ Set translation: Nederlands → ${lang === 'en' ? 'English' : 'Français'}`);
      console.log('Cookie set to:', cookieValue);
    }
  };

  const handleLanguageChange = (lang: Language) => {
    console.log('🔄 Language switch requested:', lang);
    
    // Prevent multiple clicks
    if (currentLanguage === lang) {
      console.log('⚠️ Already on this language');
      return;
    }
    
    setCurrentLanguage(lang);
    localStorage.setItem('r4y-language', lang);
    
    // Apply language change
    applyLanguage(lang);
    
    // Show loading state briefly then reload
    console.log('🔃 Reloading page...');
    setTimeout(() => {
      window.location.href = window.location.pathname + window.location.search;
    }, 100);
  };

  if (!mounted) {
    return (
      <Button variant="ghost" size="sm" className="gap-2">
        <Globe className="h-4 w-4" />
        <span className="hidden sm:inline">NL</span>
      </Button>
    );
  }

  const currentLang = languages.find(l => l.code === currentLanguage) || languages[1];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="gap-2 hover:bg-accent transition-colors notranslate"
        >
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline font-medium notranslate" translate="no">
            {currentLang.code.toUpperCase()}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 notranslate" translate="no">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className="flex items-center justify-between cursor-pointer notranslate"
          >
            <div className="flex flex-col">
              <span className="font-medium notranslate" translate="no">{lang.nativeName}</span>
              <span className="text-xs text-muted-foreground notranslate" translate="no">{lang.name}</span>
            </div>
            {currentLanguage === lang.code && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

