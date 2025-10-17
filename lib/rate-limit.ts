import type { NextRequest } from 'next/server';
import { config } from '@/lib/config';

// Simple in-memory rate limiting store
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Cleanup expired entries from the rate limit store
 * Called on each rate limit check (Edge Runtime compatible)
 */
function cleanupExpiredEntries() {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetTime: number;
  limit: number;
}

/**
 * Check if an IP address is within rate limits
 */
export function checkRateLimit(ip: string): RateLimitResult {
  // Cleanup expired entries (Edge Runtime compatible)
  cleanupExpiredEntries();
  
  if (!config.rateLimit.enabled) {
    return { 
      success: true, 
      remaining: config.rateLimit.apiRequestsPerMinute,
      resetTime: Date.now() + config.rateLimit.windowMs,
      limit: config.rateLimit.apiRequestsPerMinute
    };
  }

  const now = Date.now();
  const key = `rate_limit:${ip}`;
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetTime) {
    // Create new entry
    const resetTime = now + config.rateLimit.windowMs;
    rateLimitStore.set(key, { count: 1, resetTime });
    return { 
      success: true, 
      remaining: config.rateLimit.apiRequestsPerMinute - 1,
      resetTime,
      limit: config.rateLimit.apiRequestsPerMinute
    };
  }

  // Increment existing entry
  entry.count++;
  const remaining = Math.max(0, config.rateLimit.apiRequestsPerMinute - entry.count);
  const success = entry.count <= config.rateLimit.apiRequestsPerMinute;

  return { 
    success, 
    remaining,
    resetTime: entry.resetTime,
    limit: config.rateLimit.apiRequestsPerMinute
  };
}

/**
 * Extract IP address from Next.js request, handling proxies
 */
export function getIpFromRequest(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  return forwarded?.split(',')[0] || realIp || 'unknown';
} 