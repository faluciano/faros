import { useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { User } from '../types';
import { AuthContext } from './AuthContext';
import { getCurrentUser, signOut } from '../utils/api';
import { createPasskeyAccount, signInWithPasskey } from '../utils/passkeys';

// The session is an httpOnly cookie the page cannot read, so "who is signed
// in" is whatever the API says.
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getCurrentUser()
      .then((currentUser) => {
        if (!cancelled) {
          setUser(currentUser);
        }
      })
      .catch(() => {
        // Not signed in, or the API is unreachable; either way show the public app.
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async () => {
    setUser(await signInWithPasskey());
  }, []);

  const register = useCallback(async (email: string, firstName: string, lastName: string) => {
    setUser(await createPasskeyAccount({ email, firstName, lastName }));
  }, []);

  const logout = useCallback(async () => {
    try {
      await signOut();
    } finally {
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({ user, isSignedIn: user !== null, isLoading, login, register, logout }),
    [user, isLoading, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
