import rateLimit from 'express-rate-limit';

const isDev = process.env.NODE_ENV !== 'production';

/**
 * Global API rate limiter.
 * - Skipped in development so local testing is never blocked.
 * - In production: 500 requests per 15-minute window per IP.
 *   A typical dashboard page fires ~10-15 API calls; this comfortably
 *   supports opening many tabs without false-positives.
 */
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDev ? 0 : 500,      // 0 = unlimited in dev
  skip: () => isDev,         // belt-and-suspenders: skip handler as well
  message: {
    message: 'Too many requests from this IP. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Auth-specific rate limiter (login / forgot-password / reset-password).
 * - Skipped in development.
 * - In production: 20 attempts per 15-minute window per IP.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 0 : 20,
  skip: () => isDev,
  message: {
    message: 'Too many security-sensitive attempts. Please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
