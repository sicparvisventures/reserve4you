/**
 * Staff Email Login Page (Separate from PIN login)
 * Only accessible via direct URL
 */

import VenueUserEmailLogin from '@/components/manager/VenueUserEmailLogin';

export default async function StaffEmailLoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/10 flex items-center justify-center p-4">
      <VenueUserEmailLogin />
    </div>
  );
}

