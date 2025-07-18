import { createContext } from 'react';

export interface UserContextType {
  isRegistered: boolean;
  isLoading: boolean;
  error: Error | null;
}

export const UserContext = createContext<UserContextType | undefined>(undefined);
