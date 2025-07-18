import { createContext, Dispatch, SetStateAction } from 'react';
import { Lighthouse } from '../types';

export interface LighthouseContextType {
  lighthouses: Lighthouse[];
  setLighthouses: Dispatch<SetStateAction<Lighthouse[]>>;
  isLoading: boolean;
  refetchLighthouses: () => void;
  error: Error | null;
}

export const LighthouseContext = createContext<LighthouseContextType | undefined>(undefined);
