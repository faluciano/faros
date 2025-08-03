import { useState, useEffect, ReactNode, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { Lighthouse } from '../types';
import { useApi } from '../hooks/useApi';
import { usePublicApi } from '../hooks/usePublicApi';
import { getLighthouses, getVisitedLighthouses } from '../utils/api';
import { LighthouseContext } from './LighthouseContext';

export const LighthouseProvider = ({ children }: { children: ReactNode }) => {
  const { isSignedIn } = useAuth();
  const [combinedLighthouses, setCombinedLighthouses] = useState<Lighthouse[]>([]);

  const { data: allLighthouses, isLoading: isLoadingAll, error: errorAll, request: fetchAllLighthouses } = usePublicApi<Lighthouse[]>(getLighthouses);
  const { data: visitedLighthouses, isLoading: isLoadingVisited, error: errorVisited, request: fetchVisitedLighthouses } = useApi<Lighthouse[]>(getVisitedLighthouses);

  useEffect(() => {
    fetchAllLighthouses();
    if (isSignedIn) {
      fetchVisitedLighthouses();
    }
  }, [isSignedIn, fetchAllLighthouses, fetchVisitedLighthouses]);

  useEffect(() => {
    if (allLighthouses) {
      if (isSignedIn && visitedLighthouses) {
        const visitedIds = new Set(visitedLighthouses.map((l: Lighthouse) => l.id));
        const lighthousesWithVisited = allLighthouses.map((l: Lighthouse) => ({
          ...l,
          isVisited: visitedIds.has(l.id)
        }));
        setCombinedLighthouses(lighthousesWithVisited);
      } else {
        setCombinedLighthouses(allLighthouses);
      }
    }
  }, [allLighthouses, visitedLighthouses, isSignedIn]);

  const refetchLighthouses = useCallback(() => {
    fetchAllLighthouses();
    if (isSignedIn) {
      fetchVisitedLighthouses();
    }
  }, [fetchAllLighthouses, fetchVisitedLighthouses, isSignedIn]);

  const isLoading = isLoadingAll || isLoadingVisited;
  const error = errorAll || errorVisited;

  return (
    <LighthouseContext.Provider value={{
      lighthouses: combinedLighthouses,
      setLighthouses: setCombinedLighthouses,
      isLoading,
      refetchLighthouses,
      error
    }}>
      {children}
    </LighthouseContext.Provider>
  );
};