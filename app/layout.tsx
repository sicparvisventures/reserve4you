import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Manrope } from 'next/font/google';
import { AuthProvider } from '@/lib/auth/auth-provider';
import { ConditionalHeader } from '@/components/conditional-header';
import { CookieBanner } from '@/components/ui/cookie-banner';
import { NewsletterPopup } from '@/components/ui/newsletter-popup';
import { AnalyticsWrapper } from '@/components/analytics-wrapper';
import { GoogleTranslateWidget } from '@/components/GoogleTranslateWidget';
import { getOptionalUser } from '@/lib/auth/dal';

export const metadata: Metadata = {
  title: 'Reserve4You - Stop guessing Start booking',
  description: 'Van diner tot trimmer, van dokter tot trainer – Reserve4You, jouw boekingspartner. Direct online boeken bij professionele bedrijven in heel België.',
  icons: {
    apple: '/apple-touch-icon.png',
  },
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
        {/* CRITICAL: Preload hero video FIRST with highest priority */}
        <link rel="preload" href="/hero-video.mp4" as="video" type="video/mp4" fetchPriority="high" />
        {/* Performance optimizations */}
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="//vercel.live" />
        <link rel="dns-prefetch" href="//translate.google.com" />
        <meta name="color-scheme" content="light" />
        {/* iOS App Icon - Optimized for iPhone */}
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="120x120" href="/apple-touch-icon.png" />
        {/* iOS Splash Screen */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Reserve4You" />
      </head>
      <body className={`min-h-[100dvh] bg-background ${manrope.className}`} suppressHydrationWarning={true}>
        {/* Hidden video preloader - starts loading immediately before React hydration */}
        <video
          preload="auto"
          muted
          playsInline
          loop
          autoPlay
          style={{ position: 'absolute', width: 0, height: 0, opacity: 0, pointerEvents: 'none', zIndex: -1 }}
          aria-hidden="true"
          fetchPriority="high"
        >
          <source src="/hero-video.mp4" type="video/mp4" />
        </video>
        <GoogleTranslateWidget />
        <AuthProvider initialDbUser={initialDbUser}>
          <ConditionalHeader />
          {children}
        </AuthProvider>
        <CookieBanner />
        <NewsletterPopup />
        <AnalyticsWrapper />
      </body>
    </html>
  );
}
