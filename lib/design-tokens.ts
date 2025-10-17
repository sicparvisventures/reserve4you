/**
 * R4Y Design Tokens
 * 
 * Centralized design system constants for R4Y platform.
 * Based on Apple-like minimalism with consistent spacing and colors.
 */

export const colors = {
  // Core brand colors
  background: '#F7F7F9',
  card: '#FFFFFF',
  text: '#111111',
  border: '#E7E7EC',
  accent: '#FF5A5F',
  
  // Semantic colors
  success: '#18C964',
  warning: '#FFB020',
  error: '#E11D48',
  info: '#3B82F6',
  
  // Grays
  gray: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#E7E7EC',
    300: '#D4D4D8',
    400: '#A1A1AA',
    500: '#71717A',
    600: '#52525B',
    700: '#3F3F46',
    800: '#27272A',
    900: '#18181B',
  },
} as const;

export const spacing = {
  // 8pt grid system
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  '2xl': '48px',
  '3xl': '64px',
} as const;

export const borderRadius = {
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '20px',
  '2xl': '24px',
  full: '9999px',
} as const;

export const shadows = {
  sm: '0 1px 2px rgba(0, 0, 0, 0.04)',
  md: '0 2px 8px rgba(0, 0, 0, 0.04)',
  lg: '0 4px 12px rgba(0, 0, 0, 0.08)',
  xl: '0 8px 24px rgba(0, 0, 0, 0.12)',
} as const;

export const transitions = {
  fast: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
  medium: '250ms cubic-bezier(0.4, 0, 0.2, 1)',
  slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
} as const;

export const typography = {
  fontFamily: {
    base: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  fontSize: {
    xs: '12px',
    sm: '14px',
    base: '16px',
    lg: '18px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '32px',
    '4xl': '48px',
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// Billing tiers
export const BILLING_TIERS = {
  START: {
    name: 'Start',
    price: 49,
    maxLocations: 1,
    maxBookingsPerMonth: 200,
    features: [
      'Basis reserveringssysteem',
      'Kalender overzicht',
      'Email notificaties',
      'Basis support',
    ],
  },
  PRO: {
    name: 'Pro',
    price: 99,
    maxLocations: 3,
    maxBookingsPerMonth: 1000,
    features: [
      'Alles van Start',
      'Aanbetalingen',
      'Wachtlijst',
      'Team members (3)',
      'SMS notificaties',
      'Prioriteit support',
    ],
  },
  PLUS: {
    name: 'Plus',
    price: 199,
    maxLocations: 999,
    maxBookingsPerMonth: 999999,
    features: [
      'Alles van Pro',
      'Onbeperkte locaties',
      'Onbeperkte boekingen',
      'POS integratie',
      'Custom branding',
      'API toegang',
      'Dedicated support',
    ],
  },
} as const;

// UI Constants
export const UI = {
  headerHeight: '64px',
  sidebarWidth: '256px',
  maxContentWidth: '1280px',
  touchTargetMin: '44px',
} as const;

// Animation easing functions
export const easing = {
  easeOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
} as const;

// Export all as single design system object
export const designSystem = {
  colors,
  spacing,
  borderRadius,
  shadows,
  transitions,
  typography,
  breakpoints,
  UI,
  easing,
  BILLING_TIERS,
} as const;

export type DesignSystem = typeof designSystem;
export type BillingTier = keyof typeof BILLING_TIERS;

