'use client';

import { usePathname } from 'next/navigation';
import { Header } from '@/components/header';
import { useAuth } from '@/lib/auth/auth-provider';

export function ConditionalHeader() {
  const pathname = usePathname();
  const { user, dbUser, loading } = useAuth();
  
  // Don't show consumer header on:
  // - Login/signup pages
  // - Manager portal routes (all routes starting with /manager)
  // - Staff login page (PIN login for venue staff)
  const hideHeader = 
    pathname === '/sign-in' || 
    pathname === '/sign-up' ||
    pathname === '/staff-login' ||
    pathname.startsWith('/manager');
  
  if (hideHeader) {
    return null;
  }
  
  // Show loading state while auth is being determined
  if (loading) {
    return (
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl bg-primary/50 animate-pulse" />
              <div className="h-5 w-12 bg-muted animate-pulse rounded" />
            </div>
            <div className="flex items-center gap-2">
              <div className="h-9 w-24 bg-muted animate-pulse rounded-lg" />
            </div>
          </div>
        </div>
      </header>
    );
  }
  
  // Prepare user data in the format expected by Header
  const userData = user && dbUser ? {
    isAuth: true,
    userId: user.id,
    email: user.email,
    user: user,
    dbUser: dbUser
  } : null;
  
  return <Header userData={userData} pathname={pathname} />;
} 