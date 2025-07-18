import { useContext } from 'react';
import { LighthouseContext, LighthouseContextType } from '../context/LighthouseContext';

export const useLighthouse = (): LighthouseContextType => {
  const context = useContext(LighthouseContext);
  if (context === undefined) {
    throw new Error('useLighthouse must be used within a LighthouseProvider');
  }
  return context;
};