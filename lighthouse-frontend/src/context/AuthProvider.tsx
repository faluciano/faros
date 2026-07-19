import { useState, useEffect, useCallback, ReactNode } from 'react';
import { User } from '../types';
import { AuthContext } from './AuthContext';
import { getBaseUrl } from '../utils/api';
import { createPasskeyAccount, signInWithPasskey } from '../utils/passkeys';

const TOKEN_KEY = 'token';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    if (!storedToken) {
      setIsLoading(false);
      return;
    }

    const validateToken = async () => {
      try {
        const response = await fetch(`${getBaseUrl()}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${storedToken}`,
          },
        });

        if (!response.ok) {
          localStorage.removeItem(TOKEN_KEY);
          setToken(null);
          setUser(null);
          return;
        }

        const data = await response.json();
        setToken(storedToken);
        setUser(data);
      } catch {
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    validateToken();
  }, []);

  const login = useCallback(async () => {
    const data = await signInWithPasskey();
    localStorage.setItem(TOKEN_KEY, data.token);
    setToken(data.token);
    setUser(data.user);
  }, []);

  const register = useCallback(async (email: string, firstName: string, lastName: string) => {
    const data = await createPasskeyAccount({ email, firstName, lastName });
    localStorage.setItem(TOKEN_KEY, data.token);
    setToken(data.token);
    setUser(data.user);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const getToken = useCallback(() => token, [token]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isSignedIn: !!token && !!user,
        isLoading,
        login,
        register,
        logout,
        getToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
