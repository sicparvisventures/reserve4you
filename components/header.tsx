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

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="sm:hidden">
              <RotatingLogoMobile />
            </div>
            <div className="hidden sm:block">
              <RotatingLogo />
            </div>
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

          {/* Mobile Actions */}
          <div className="flex md:hidden items-center gap-2">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/search">
                <Search className="h-5 w-5" />
              </Link>
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <nav className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                    pathname === link.href
                      ? 'text-foreground bg-muted'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  )}
                >
                  {link.label}
                </Link>
              ))}
              
              <div className="h-px bg-border my-2" />
              
              {userData ? (
                <>
                  <Link
                    href="/favorites"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 flex items-center gap-3"
                  >
                    <Heart className="h-4 w-4" />
                    Favorieten
                  </Link>
                  <Link
                    href="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 flex items-center gap-3"
                  >
                    <User className="h-4 w-4" />
                    Profiel
                  </Link>
                  
                  <div className="h-px bg-border my-2" />
                  
                  <Link
                    href="/manager"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Button className="w-full gradient-bg text-white">Manager Portal</Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/sign-up"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Button className="w-full">Aanmelden</Button>
                  </Link>
                  
                  <div className="h-px bg-border my-2" />
                  
                  <Link
                    href="/manager"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Button variant="outline" className="w-full border-primary text-primary">
                      Manager Portal
                    </Button>
                  </Link>
                </>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
} 