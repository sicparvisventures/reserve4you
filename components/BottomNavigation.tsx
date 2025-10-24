/**
 * Instagram-style Bottom Navigation
 * 
 * Floating bottom navigation bar for consumer pages
 * Clean, modern design with active state indicators
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Compass, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

export function BottomNavigation() {
  const pathname = usePathname();
  
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
        </div>
      </nav>
    </div>
  );
}

