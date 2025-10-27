/**
 * R4Y Header Component
 * 
 * Consumer-facing header with R4Y branding
 * Mobile-first responsive design
 */

'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { User, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RotatingLogo, RotatingLogoMobile } from '@/components/rotating-logo';
import { NotificationBadge } from '@/components/NotificationBadge';
import { LanguageSelector } from '@/components/language/LanguageSelector';

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
  // Check if we're on a consumer page that will have bottom navigation
  const isConsumerPage = pathname === '/' || pathname === '/discover' || pathname === '/favorites';
  
  // Check if we're on homepage for transparent header
  const isHomepage = pathname === '/';

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
    <header className={cn(
      "z-50",
      isHomepage 
        ? "absolute top-0 left-0 right-0 bg-white border-b border-border" 
        : "sticky top-0 border-b border-border bg-card/95 backdrop-blur-sm"
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between h-14">
          {/* Left: Logo */}
          <div className="flex items-center gap-2">
            {/* Logo - already has Link inside RotatingLogoMobile */}
            <RotatingLogoMobile />
          </div>

          {/* Right: Language & Notification Icons */}
          <div className="flex items-center gap-1">
            <LanguageSelector />
            {userData && (
              <>
                {/* Notifications */}
                <NotificationBadge />
              </>
            )}
          </div>
        </div>


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
            <LanguageSelector />
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