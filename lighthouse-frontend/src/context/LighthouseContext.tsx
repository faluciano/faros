import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { Lighthouse } from '../types';

interface LighthouseContextType {
  lighthouses: Lighthouse[];
  setLighthouses: (lighthouses: Lighthouse[]) => void;
  isLoading: boolean;
  refetchLighthouses: () => Promise<void>;
}

const LighthouseContext = createContext<LighthouseContextType | undefined>(undefined);

export const LighthouseProvider = ({ children }: { children: ReactNode }) => {
  const [lighthouses, setLighthouses] = useState<Lighthouse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { getToken, isSignedIn } = useAuth();

  const fetchLighthouses = async () => {
    setIsLoading(true);
    try {
      let baseUrl = "https://faros-backend.azurewebsites.net";
      if (process.env.NODE_ENV === "development") {
        baseUrl = "http://localhost:8080";
      }

      // Fetch all lighthouses
      const lighthousesResponse = await fetch(`${baseUrl}/api/lighthouses`);
      if (!lighthousesResponse.ok) {
        throw new Error('Failed to fetch lighthouses');
      }
      const allLighthouses = await lighthousesResponse.json();

      if (isSignedIn) {
        const token = await getToken();
        if (!token) return;

        // Fetch visited lighthouses
        const visitedResponse = await fetch(`${baseUrl}/user/lighthouses`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        if (!visitedResponse.ok) {
          throw new Error('Failed to fetch visited lighthouses');
        }
        const visitedLighthouses = await visitedResponse.json();

        // Mark visited lighthouses
        const visitedIds = new Set(visitedLighthouses.map((l: Lighthouse) => l.id));
        const lighthousesWithVisited = allLighthouses.map((l: Lighthouse) => ({
          ...l,
          isVisited: visitedIds.has(l.id)
        }));

        setLighthouses(lighthousesWithVisited);
      } else {
        setLighthouses(allLighthouses);
      }
    } catch (error) {
      console.error('Error fetching lighthouses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLighthouses();
  }, [isSignedIn]);

  return (
    <LighthouseContext.Provider value={{ 
      lighthouses, 
      setLighthouses, 
      isLoading,
      refetchLighthouses: fetchLighthouses 
    }}>
      {children}
    </LighthouseContext.Provider>
  );
};

export const useLighthouse = () => {
  const context = useContext(LighthouseContext);
  if (context === undefined) {
    throw new Error('useLighthouse must be used within a LighthouseProvider');
  }
  return context;
}; 