import React, { useEffect } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { setTokenGetter, api } from '../api';

/**
 * AuthProvider — sits inside ClerkProvider.
 * 1. Feeds the Clerk getToken function into api.js
 * 2. Syncs the user profile to the backend on sign-in
 */
export const AuthProvider = ({ children }) => {
  const { getToken, isSignedIn } = useAuth();
  const { user } = useUser();

  // Wire up token getter for api.js
  useEffect(() => {
    if (getToken) {
      setTokenGetter(getToken);
    }
  }, [getToken]);

  // Sync user to backend when they sign in
  useEffect(() => {
    if (isSignedIn && user) {
      api.syncUser(
        user.primaryEmailAddress?.emailAddress || '',
        user.fullName || user.firstName || 'Navigator',
        user.imageUrl || ''
      ).catch(() => { /* silent — backend might not be up yet */ });
    }
  }, [isSignedIn, user]);

  return <>{children}</>;
};
