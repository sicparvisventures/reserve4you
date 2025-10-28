'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function MobileRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Check if the device is mobile (screen width <= 768px)
    const isMobile = window.innerWidth <= 768;

    if (isMobile) {
      // Redirect to /discover after 1 second
      const timer = setTimeout(() => {
        router.push('/discover');
      }, 1000);

      // Cleanup timer if component unmounts
      return () => clearTimeout(timer);
    }
  }, [router]);

  // This component doesn't render anything
  return null;
}

