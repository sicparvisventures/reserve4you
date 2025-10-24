/**
 * General Staff PIN Login Page
 * PIN login only - email/password moved to separate page
 * Use location-specific URLs for public staff login: /staff-login/[slug]
 */

import { PINLoginClient } from './PINLoginClient';

export default async function StaffLoginPage() {
  return <PINLoginClient />;
}

