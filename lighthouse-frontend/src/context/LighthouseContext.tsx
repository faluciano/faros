import { createContext } from 'react';
import type { LighthouseMapData } from '../types';

export interface LighthouseContextType {
  mapData: LighthouseMapData | null;
  isLoading: boolean;
  error: Error | null;
}

export const LighthouseContext = createContext<LighthouseContextType | undefined>(undefined);
