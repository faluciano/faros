import { useEffect, useMemo, type ReactNode } from 'react';
import { usePublicApi } from '../hooks/usePublicApi';
import { getLighthouseMapData } from '../utils/api';
import { LighthouseContext } from './LighthouseContext';

export const LighthouseProvider = ({ children }: { children: ReactNode }) => {
  const {
    data: mapData,
    isLoading,
    error,
    request: fetchMapData,
  } = usePublicApi(getLighthouseMapData);

  useEffect(() => {
    fetchMapData();
  }, [fetchMapData]);

  const value = useMemo(
    () => ({
      mapData,
      isLoading,
      error,
    }),
    [mapData, isLoading, error],
  );

  return (
    <LighthouseContext.Provider value={value}>
      {children}
    </LighthouseContext.Provider>
  );
};
