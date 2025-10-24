/**
 * Staff Login Floating Button
 * Appears on homepage for quick staff access
 */

'use client';

import { Lock } from 'lucide-react';
import Link from 'next/link';

export function StaffLoginFloatingButton() {
  return (
    <Link
      href="/staff-login"
      className="fixed bottom-24 left-6 md:bottom-6 z-50 w-14 h-14 rounded-full bg-gray-900 hover:bg-gray-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center group"
      aria-label="Personeel login"
    >
      <Lock className="h-6 w-6 group-hover:scale-110 transition-transform" />
      
      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
        Personeel Login
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-2 h-2 bg-gray-900 rotate-45"></div>
      </div>
    </Link>
  );
}

