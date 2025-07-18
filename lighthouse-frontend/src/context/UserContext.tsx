import { createContext, useContext, useEffect, ReactNode } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useApi } from '../hooks/useApi';
import { registerUser } from '../utils/api';

interface UserContextType {
  isRegistered: boolean;
  isLoading: boolean;
  error: Error | null;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

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

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}; 