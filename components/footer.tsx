/**
 * R4Y Footer Component
 * 
 * Clean footer with essential links
 * Mobile-first responsive design
 */

'use client';

import Link from 'next/link';
import { Instagram, Facebook, Twitter } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    'Voor gasten': [
      { href: '/', label: 'Ontdek restaurants' },
      { href: '/discover', label: 'Zoeken' },
      { href: '/favorites', label: 'Favorieten' },
      { href: '/sign-up', label: 'Account aanmaken' },
    ],
    'Voor restaurants': [
      { href: '/manager/onboarding?step=1', label: 'Restaurant toevoegen' },
      { href: '/manager', label: 'Manager dashboard' },
      { href: '/pricing', label: 'Prijzen' },
      { href: '/features', label: 'Functionaliteiten' },
    ],
    'Over R4Y': [
      { href: '/about', label: 'Over ons' },
      { href: '/contact', label: 'Contact' },
      { href: '/careers', label: 'Werken bij R4Y' },
      { href: '/press', label: 'Pers' },
    ],
    'Juridisch': [
      { href: '/privacy', label: 'Privacy' },
      { href: '/terms', label: 'Voorwaarden' },
      { href: '/cookies', label: 'Cookies' },
    ],
  };

  return (
    <footer className="border-t border-border bg-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category} className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground">{category}</h3>
              <ul className="space-y-3">
                {links.map((link, index) => (
                  <li key={`${link.href}-${index}`}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Social & Copyright */}
        <div className="pt-8 border-t border-border">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            {/* Logo & Tagline */}
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-lg font-bold text-primary-foreground">R</span>
              </div>
              <div>
                <div className="text-sm font-semibold text-foreground">Reserve4You</div>
                <div className="text-xs text-muted-foreground">Stop guessing Start booking</div>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-4">
              <Link
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Instagram className="h-5 w-5" />
              </Link>
              <Link
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Facebook className="h-5 w-5" />
              </Link>
              <Link
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Twitter className="h-5 w-5" />
              </Link>
            </div>

            {/* Copyright */}
            <p className="text-sm text-muted-foreground text-center md:text-right">
              © {currentYear} R4Y. Alle rechten voorbehouden.
            </p>
          </div>
        </div>

        {/* Google Translate Widget Container (hidden visually, used programmatically) */}
        <div id="google_translate_element" className="hidden"></div>
      </div>
    </footer>
  );
}
