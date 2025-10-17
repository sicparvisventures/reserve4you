import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { verifySession } from '@/lib/auth/dal';

export default async function ManagerLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Verify user is authenticated
  const session = await verifySession();
  
  if (!session) {
    redirect('/sign-in?redirect=manager');
  }

  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  );
}

