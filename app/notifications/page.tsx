import { verifySession } from '@/lib/auth/dal';
import { createServiceClient } from '@/lib/supabase/server';
import { NotificationsClient } from './NotificationsClient';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Notificaties - Reserve4You',
  description: 'Bekijk je notificaties en updates',
};

export const dynamic = 'force-dynamic';

export default async function NotificationsPage() {
  const session = await verifySession();
  const supabase = await createServiceClient();

  // Get consumer ID
  const { data: consumer } = await supabase
    .from('consumers')
    .select('id')
    .eq('auth_user_id', session.userId)
    .single();

  // Fetch notifications with related data
  const { data: notifications, error } = await supabase
    .from('notifications')
    .select(`
      *
    `)
    .eq('user_id', session.userId)
    .eq('archived', false)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Error fetching notifications:', error);
  }

  return (
    <NotificationsClient
      initialNotifications={notifications || []}
      currentUserId={consumer?.id || ''}
    />
  );
}

