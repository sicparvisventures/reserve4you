import { ReactNode } from 'react';

/**
 * Custom layout for location-specific staff login
 * Hides the global header for a clean login experience
 */
export default function LocationStaffLoginLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}

