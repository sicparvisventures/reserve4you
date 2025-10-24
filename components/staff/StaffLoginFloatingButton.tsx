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
      className="hidden"
      aria-label="Personeel login"
    >
      <Lock className="h-6 w-6" />
    </Link>
  );
}

