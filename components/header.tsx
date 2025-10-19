/**
 * R4Y Header Component
 * 
 * Consumer-facing header with R4Y branding
 * Mobile-first responsive design with hamburger menu
 */

'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Menu, X, Search, Heart, User, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RotatingLogo, RotatingLogoMobile } from '@/components/rotating-logo';
import { CardNav } from '@/components/card-nav/CardNav';

interface HeaderProps {
  userData: {
    isAuth: boolean;
    userId: string;
    email: string | undefined;
    user: any;
    dbUser: any;
  } | null;
  pathname?: string;
}

export function Header({ userData, pathname }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/discover', label: 'Ontdek' },
    { href: '/favorites', label: 'Favorieten' },
  ];

  // CardNav items with routing to current structure - Reserve4You branding
  const cardNavItems = [
    {
      label: "Verkennen",
      bgColor: "#FFFFFF",
      textColor: "#111111",
      links: [
        { label: "Home", href: "/", ariaLabel: "Ga naar Home" },
        { label: "Ontdek Restaurants", href: "/discover", ariaLabel: "Ontdek restaurants" }
      ]
    },
    {
      label: "Jouw Account", 
      bgColor: "#FAFAFC",
      textColor: "#111111",
      links: userData ? [
        { label: "Favorieten", href: "/favorites", ariaLabel: "Bekijk je favorieten" },
        { label: "Profiel", href: "/profile", ariaLabel: "Ga naar je profiel" }
      ] : [
        { label: "Aanmelden", href: "/sign-up", ariaLabel: "Meld je aan" },
        { label: "Inloggen", href: "/sign-in", ariaLabel: "Log in" }
      ]
    },
    {
      label: "Voor Restaurants",
      bgColor: "#FF5A5F", 
      textColor: "#FFFFFF",
      links: [
        { label: "Manager Portal", href: "/manager", ariaLabel: "Ga naar Manager Portal" },
        { label: "Start Gratis", href: "/manager", ariaLabel: "Start gratis" }
      ]
    }
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* CardNav for animated menu */}
        <div className="md:hidden">
          <CardNav
            logo={<RotatingLogoMobile />}
            logoAlt="Reserve4You Logo"
            items={cardNavItems}
            baseColor="#FFFFFF"
            menuColor="#111111"
            buttonBgColor="#FF5A5F"
            buttonTextColor="#FFFFFF"
            ctaHref={userData ? "/profile" : "/sign-up"}
            ctaLabel={userData ? "Profiel" : "Aanmelden"}
            ease="power3.out"
          />
        </div>

        <div className="hidden md:flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2 shrink-0">
            <RotatingLogo />
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  pathname === link.href
                    ? 'text-foreground bg-muted'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/search">
                <Search className="h-5 w-5" />
              </Link>
            </Button>
            
            {userData ? (
              <>
                <Button variant="ghost" size="icon" asChild>
                  <Link href="/favorites">
                    <Heart className="h-5 w-5" />
                  </Link>
                </Button>
                <Button variant="ghost" size="icon" asChild>
                  <Link href="/notifications">
                    <Bell className="h-5 w-5" />
                  </Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/profile">
                    <User className="h-4 w-4 mr-2" />
                    Profiel
                  </Link>
                </Button>
                <div className="h-6 w-px bg-border mx-1" />
                <Button variant="outline" size="sm" asChild className="gradient-bg text-white border-0">
                  <Link href="/manager">Manager Portal</Link>
                </Button>
              </>
            ) : (
              <>
                <Button size="sm" asChild>
                  <Link href="/sign-up">Aanmelden</Link>
                </Button>
                <div className="h-6 w-px bg-border mx-1" />
                <Button variant="outline" size="sm" asChild className="border-primary text-primary hover:bg-primary/10">
                  <Link href="/manager">Manager Portal</Link>
                </Button>
              </>
            )}
          </div>

        </div>
      </div>
    </header>
  );
} 