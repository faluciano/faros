import { createContext } from 'react';
import { User } from '../types';

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isSignedIn: boolean;
  isLoading: boolean;
  login: () => Promise<void>;
  register: (email: string, firstName: string, lastName: string) => Promise<void>;
  logout: () => void;
  getToken: () => string | null;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
