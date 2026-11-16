import { useEffect, useMemo, useState, type ReactNode } from 'react';
import type { LighthouseMapData } from '../types';
import { getLighthouseMapData } from '../utils/api';
import { LighthouseContext } from './LighthouseContext';

export const LighthouseProvider = ({ children }: { children: ReactNode }) => {
  const [mapData, setMapData] = useState<LighthouseMapData | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    getLighthouseMapData()
      .then((data) => {
        if (!cancelled) {
          setMapData(data);
        }
      })
      .catch((loadError: unknown) => {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError : new Error(String(loadError)));
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(
    () => ({
      mapData,
      isLoading: !mapData && !error,
      error,
    }),
    [mapData, error],
  );

  return (
    <LighthouseContext.Provider value={value}>
      {children}
    </LighthouseContext.Provider>
  );
};
