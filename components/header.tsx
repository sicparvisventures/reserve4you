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
import { Menu, X, User, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RotatingLogo, RotatingLogoMobile } from '@/components/rotating-logo';
import { NotificationBadge } from '@/components/NotificationBadge';

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

  // Check if we're on a consumer page that will have bottom navigation
  const isConsumerPage = pathname === '/' || pathname === '/discover' || pathname === '/favorites';

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/discover', label: 'Ontdek' },
    { href: '/favorites', label: 'Favorieten' },
  ];

  // Get first tenant ID for manager link (if user has tenants)
  const firstTenantId = userData?.dbUser?.memberships?.[0]?.tenant_id;
  const managerDashboardUrl = firstTenantId 
    ? `/manager/${firstTenantId}/dashboard`
    : '/manager';

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between h-14">
          {/* Left: Logo + Hamburger Menu */}
          <div className="flex items-center gap-2">
            {/* Logo - already has Link inside RotatingLogoMobile */}
            <RotatingLogoMobile />
            
            {/* Hamburger Menu */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="h-9 w-9"
              aria-label="Menu"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>

          {/* Right: Action Icons */}
          <div className="flex items-center gap-1">
            {userData ? (
              <>
                {/* Notifications */}
                <NotificationBadge />
                
                {/* Profile */}
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="h-9 w-9 rounded-full hover:bg-primary/10"
                  asChild
                >
                  <Link href="/profile" aria-label="Profiel">
                    <User className="h-5 w-5" />
                  </Link>
                </Button>
                
                {/* Manager Dashboard */}
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="h-9 w-9 rounded-full hover:bg-primary/10"
                  asChild
                >
                  <Link href={managerDashboardUrl} aria-label="Manager Dashboard">
                    <Building2 className="h-5 w-5 text-primary" />
                  </Link>
                </Button>
              </>
            ) : (
              <>
                {/* Sign In */}
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="h-9 w-9 rounded-full hover:bg-primary/10"
                  asChild
                >
                  <Link href="/sign-in" aria-label="Inloggen">
                    <User className="h-5 w-5" />
                  </Link>
                </Button>
                
                {/* Manager Portal (Not logged in) */}
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="h-9 w-9 rounded-full hover:bg-primary/10"
                  asChild
                >
                  <Link href="/manager" aria-label="Manager Portal">
                    <Building2 className="h-5 w-5 text-primary" />
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-card">
            <nav className="py-4 space-y-1">
              {/* Only show nav links if not on consumer pages with bottom navigation */}
              {!isConsumerPage && navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'block px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                    pathname === link.href
                      ? 'text-foreground bg-muted'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  )}
                >
                  {link.label}
                </Link>
              ))}
              
              {/* Mobile Menu Actions */}
              {!userData && (
                <>
                  {!isConsumerPage && <div className="h-px bg-border my-2" />}
                  <Link
                    href="/sign-up"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-3 rounded-lg text-sm font-medium text-foreground bg-primary/10 hover:bg-primary/20 transition-colors"
                  >
                    Aanmelden
                  </Link>
                  <Link
                    href="/sign-in"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                  >
                    Inloggen
                  </Link>
                </>
              )}
            </nav>
          </div>
        )}

        <div className="hidden md:flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2 shrink-0">
            <RotatingLogo />
          </div>

          {/* Desktop Navigation - Hide on consumer pages with bottom navigation */}
          {!isConsumerPage && (
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
          )}

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-2">
            {userData ? (
              <>
                <NotificationBadge />
                <Button variant="outline" size="sm" asChild>
                  <Link href="/profile">
                    <User className="h-4 w-4 mr-2" />
                    Profiel
                  </Link>
                </Button>
                <div className="h-6 w-px bg-border mx-1" />
                <Button variant="outline" size="sm" asChild className="gradient-bg text-white border-0">
                  <Link href={managerDashboardUrl}>Manager Portal</Link>
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