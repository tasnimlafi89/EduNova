import { clerkMiddleware, requireAuth, getAuth } from '@clerk/express';

/**
 * Clerk middleware — verifies the JWT on every request.
 * Adds `req.auth` with { userId, sessionId, ... }.
 * Non-authenticated requests still pass but req.auth.userId is null.
 */
export const clerkAuth = clerkMiddleware();

/**
 * Strict guard — returns 401 if user is not signed in.
 * Use on routes that MUST have an authenticated user.
 */
export const requireSignedIn = requireAuth();

/**
 * Extract the Clerk userId from the request.
 * Returns null if not authenticated.
 */
export function getClerkUserId(req) {
  const auth = getAuth(req);
  return auth?.userId || null;
}
