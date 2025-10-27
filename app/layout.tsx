import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Manrope } from 'next/font/google';
import { AuthProvider } from '@/lib/auth/auth-provider';
import { ConditionalHeader } from '@/components/conditional-header';
import { CookieBanner } from '@/components/ui/cookie-banner';
import { AnalyticsWrapper } from '@/components/analytics-wrapper';
import { GoogleTranslateWidget } from '@/components/GoogleTranslateWidget';
import { getOptionalUser } from '@/lib/auth/dal';

export const metadata: Metadata = {
  title: 'Reserve4You - Stop guessing Start booking',
  description: 'Ontdek en reserveer bij de beste restaurants in België. Direct online reserveren bij jouw favoriete restaurant.'
};

export const viewport: Viewport = {
  maximumScale: 1,
  themeColor: '#FF5A5F', // R4Y Brand Red
};

const manrope = Manrope({ 
  subsets: ['latin'],
  display: 'swap', // Improve font loading performance
  preload: true,
});

export default async function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  // Get initial user data server-side to avoid redundant API calls
  const userData = await getOptionalUser();
  const initialDbUser = userData?.dbUser || null;

  return (
    <html lang="en">
      <head>
        {/* Performance optimizations */}
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="//vercel.live" />
        <link rel="dns-prefetch" href="//translate.google.com" />
        <meta name="color-scheme" content="light" />
      </head>
      <body className={`min-h-[100dvh] bg-background ${manrope.className}`} suppressHydrationWarning={true}>
        <GoogleTranslateWidget />
        <AuthProvider initialDbUser={initialDbUser}>
          <ConditionalHeader />
          {children}
        </AuthProvider>
        <CookieBanner />
        <AnalyticsWrapper />
      </body>
    </html>
  );
}
