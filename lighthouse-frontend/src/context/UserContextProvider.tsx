import { useEffect, ReactNode } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useApi } from '../hooks/useApi';
import { registerUser } from '../utils/api';
import { UserContext } from './UserContext';

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const { isSignedIn } = useAuth();
  const { data, isLoading, error, request: register } = useApi(registerUser);

  useEffect(() => {
    if (isSignedIn) {
      register();
    }
  }, [isSignedIn, register]);

  return (
    <UserContext.Provider value={{ isRegistered: !!data, isLoading, error }}>
      {children}
    </UserContext.Provider>
  );
};