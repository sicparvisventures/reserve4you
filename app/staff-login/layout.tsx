import { ReactNode } from 'react';

/**
 * Custom layout for staff login page
 * Hides the global header for a clean, focused login experience
 */
export default function StaffLoginLayout({
  children,
}: {
  children: ReactNode;
}) {
  // No header, just render children directly
  return <>{children}</>;
}

