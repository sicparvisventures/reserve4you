/**
 * Instagram-style Bottom Navigation
 * 
 * Floating bottom navigation bar for consumer pages
 * Clean, modern design with active state indicators
 * Includes "Meer" menu with additional options
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Compass, Heart, Menu, User, Building2, LogIn, UserPlus, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect, useRef } from 'react';

interface BottomNavigationProps {
  userData?: {
    isAuth: boolean;
    userId: string;
    email: string | undefined;
    user: any;
    dbUser: any;
  } | null;
}

export function BottomNavigation({ userData }: BottomNavigationProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  // Get first tenant ID for manager link (if user has tenants)
  const firstTenantId = userData?.dbUser?.memberships?.[0]?.tenant_id;
  const managerDashboardUrl = firstTenantId 
    ? `/manager/${firstTenantId}/dashboard`
    : '/manager';
  
  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);
  
  const navItems = [
    { 
      href: '/', 
      label: 'Home', 
      icon: Home,
      isActive: pathname === '/'
    },
    { 
      href: '/discover', 
      label: 'Ontdek', 
      icon: Compass,
      isActive: pathname === '/discover'
    },
    { 
      href: '/favorites', 
      label: 'Favorieten', 
      icon: Heart,
      isActive: pathname === '/favorites'
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 px-3 pb-3 sm:px-4 sm:pb-4">
      <nav className="max-w-md mx-auto bg-background border-2 border-border rounded-2xl shadow-2xl">
        <div className="flex items-stretch justify-around">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-1 flex-col items-center justify-center gap-1.5 py-3.5 px-3 transition-all duration-200 relative min-h-[4.5rem]',
                  item.isActive 
                    ? 'text-primary' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50 active:bg-muted'
                )}
              >
                {/* Active indicator - thin line at top */}
                {item.isActive && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-1 bg-primary rounded-b-full" />
                )}
                
                {/* Icon */}
                <Icon 
                  className={cn(
                    'h-6 w-6 sm:h-7 sm:w-7 transition-all duration-200',
                    item.isActive && 'scale-110'
                  )} 
                  fill={item.isActive ? 'currentColor' : 'none'}
                  strokeWidth={item.isActive ? 0 : 2}
                />
                
                {/* Label */}
                <span 
                  className={cn(
                    'text-[0.7rem] sm:text-xs font-medium transition-all duration-200 tracking-tight',
                    item.isActive && 'font-semibold'
                  )}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
          
          {/* Meer Menu Item */}
          <div className="relative flex flex-1" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className={cn(
                'flex flex-1 flex-col items-center justify-center gap-1.5 py-3.5 px-3 transition-all duration-200 relative min-h-[4.5rem]',
                menuOpen
                  ? 'text-primary' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50 active:bg-muted'
              )}
            >
              {/* Active indicator when menu is open */}
              {menuOpen && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-1 bg-primary rounded-b-full" />
              )}
              
              {/* Icon */}
              <Menu 
                className={cn(
                  'h-6 w-6 sm:h-7 sm:w-7 transition-all duration-200',
                  menuOpen && 'scale-110'
                )} 
              />
              
              {/* Label */}
              <span 
                className={cn(
                  'text-[0.7rem] sm:text-xs font-medium transition-all duration-200 tracking-tight',
                  menuOpen && 'font-semibold'
                )}
              >
                Meer
              </span>
            </button>
            
            {/* Dropdown Menu */}
            {menuOpen && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-background border-2 border-border rounded-xl shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-2 duration-200">
                <div className="py-2">
                  {userData ? (
                    <>
                      {/* Profile Link */}
                      <Link
                        href="/profile"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
                      >
                        <User className="h-5 w-5" />
                        <span>Profiel</span>
                      </Link>
                      
                      <div className="h-px bg-border my-2" />
                      
                      {/* Manager Portal Link */}
                      <Link
                        href={managerDashboardUrl}
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-primary hover:bg-primary/10 transition-colors"
                      >
                        <Building2 className="h-5 w-5" />
                        <span>Manager Portal</span>
                      </Link>
                      
                      {/* Staff Login Link */}
                      <Link
                        href="/staff-login"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                      >
                        <Lock className="h-5 w-5" />
                        <span>Personeel Login</span>
                      </Link>
                    </>
                  ) : (
                    <>
                      {/* Sign Up Link */}
                      <Link
                        href="/sign-up"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-foreground bg-primary/10 hover:bg-primary/20 transition-colors"
                      >
                        <UserPlus className="h-5 w-5" />
                        <span>Aanmelden</span>
                      </Link>
                      
                      {/* Sign In Link */}
                      <Link
                        href="/sign-in"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                      >
                        <LogIn className="h-5 w-5" />
                        <span>Inloggen</span>
                      </Link>
                      
                      <div className="h-px bg-border my-2" />
                      
                      {/* Manager Portal Link (Not Logged In) */}
                      <Link
                        href="/manager"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-primary hover:bg-primary/10 transition-colors"
                      >
                        <Building2 className="h-5 w-5" />
                        <span>Manager Portal</span>
                      </Link>
                      
                      {/* Staff Login Link */}
                      <Link
                        href="/staff-login"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                      >
                        <Lock className="h-5 w-5" />
                        <span>Personeel Login</span>
                      </Link>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>
    </div>
  );
}
