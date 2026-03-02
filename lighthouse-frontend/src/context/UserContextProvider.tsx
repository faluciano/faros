import { ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';
import { UserContext } from './UserContext';

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const { isSignedIn, isLoading } = useAuth();

  return (
    <UserContext.Provider value={{ isRegistered: isSignedIn, isLoading, error: null }}>
      {children}
    </UserContext.Provider>
  );
};
