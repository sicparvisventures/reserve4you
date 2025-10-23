/**
 * General Staff PIN Login Page
 * Requires authentication - shows login prompt if not logged in
 * Use location-specific URLs for public staff login: /staff-login/[slug]
 */

import { getOptionalUser } from '@/lib/auth/dal';
import { PINLoginClient } from './PINLoginClient';
import { StaffLoginPrompt } from './StaffLoginPrompt';

export default async function StaffLoginPage() {
  // Check if user is authenticated
  const userData = await getOptionalUser();
  
  // If not authenticated, show login prompt
  if (!userData?.isAuth) {
    return <StaffLoginPrompt />;
  }
  
  // If authenticated, show PIN login
  return <PINLoginClient />;
}

