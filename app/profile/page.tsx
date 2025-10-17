import { verifySession, getUser } from '@/lib/auth/dal';
import { getConsumer, getConsumerBookings, getConsumerFavorites } from '@/lib/auth/tenant-dal';
import { ProfileClient } from './ProfileClient';

export default async function ProfilePage() {
  const session = await verifySession();
  const user = await getUser();
  const consumer = await getConsumer();
  const bookings = await getConsumerBookings();
  const favorites = await getConsumerFavorites();

  return (
    <ProfileClient
      user={user}
      consumer={consumer}
      bookings={bookings}
      favorites={favorites}
    />
  );
}

