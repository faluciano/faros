import React, { useEffect, useState } from "react";
import { Map, Marker } from "pigeon-maps";
import { osm } from "pigeon-maps/providers";
import { Lighthouse, User } from "../types";
import { useAuth } from "@clerk/clerk-react";
import LighthousePopover from "./LighthousePopover";

const dummyLighthouses = [
  {
    id: "1",
    latitude: 47.7511,
    longitude: -120.7401,
    name: "Dummy Lighthouse",
    image: "https://example.com/lighthouse.jpg",
    state: "Washington",
    country: "United States",
  },
];

const UserMap = () => {
  const [lighthouses, setLighthouses] = useState<Lighthouse[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const { getToken, isSignedIn } = useAuth();

  const fetchData = async () => {
    let baseUrl = "https://faros-backend.azurewebsites.net";
    if (process.env.NODE_ENV === "development") {
      baseUrl = "http://localhost:8080";
    }

    try {
      const token = await getToken();
      if (!token) return;

      // Fetch user data
      const userResponse = await fetch(`${baseUrl}/user`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!userResponse.ok) {
        throw new Error('Failed to fetch user data');
      }

      const userData = await userResponse.json();
      setUser(userData);

      // Fetch all lighthouses
      const lighthousesResponse = await fetch(`${baseUrl}/api/lighthouses`);
      if (!lighthousesResponse.ok) {
        throw new Error('Failed to fetch lighthouses');
      }
      const allLighthouses = await lighthousesResponse.json();

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
    } catch (error) {
      console.error('Error fetching data:', error);
      setLighthouses(dummyLighthouses);
    }
  };

  useEffect(() => {
    if (isSignedIn) {
      fetchData();
    } else {
      setLighthouses([]);
      setUser(null);
    }
  }, [isSignedIn, getToken]);

  const [selectedLighthouse, setSelectedLighthouse] = useState<Lighthouse | null>(null);
  const [popoverPosition, setPopoverPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);

  const handleMarkerClick = (
    lighthouse: Lighthouse,
    { event }: { event: React.MouseEvent }
  ) => {
    const { clientX, clientY } = event;
    setSelectedLighthouse(lighthouse);
    setPopoverPosition({ top: clientY, left: clientX });
  };

  const handleMapClick = () => {
    setSelectedLighthouse(null);
    setPopoverPosition(null);
  };

  const handleVisitChange = async (lighthouseId: string, isVisited: boolean) => {
    // Update optimistically
    setLighthouses(lighthouses.map(l => 
      l.id === lighthouseId ? { ...l, isVisited } : l
    ));

    // If the API call fails, revert the change
    try {
      await fetchData();
    } catch (error) {
      console.error('Error updating visit status:', error);
      // Revert the optimistic update
      setLighthouses(lighthouses.map(l => 
        l.id === lighthouseId ? { ...l, isVisited: !isVisited } : l
      ));
    }
  };

  return (
    <div onClick={handleMapClick} style={{ position: "relative" }}>
      {user && (
        <div className="absolute top-4 right-4 z-10 bg-white text-black p-4 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold">Welcome, {user.first_name}!</h3>
          <p className="text-sm text-gray-600 mt-1">
            Visited Lighthouses: {lighthouses.filter(l => l.isVisited).length}
          </p>
        </div>
      )}
      <Map
        height={window.innerHeight}
        provider={osm}
        defaultCenter={[39.8283, -98.5795]}
        zoom={4}
      >
        {lighthouses.map((lighthouse) => (
          <Marker
            key={lighthouse.id}
            anchor={[lighthouse.latitude, lighthouse.longitude]}
            color={lighthouse.isVisited ? "#10B981" : "#EF4444"}
            onClick={(markerEvent) => {
              markerEvent.event.stopPropagation();
              handleMarkerClick(lighthouse, markerEvent);
            }}
          />
        ))}
      </Map>
      {selectedLighthouse && popoverPosition && (
        <LighthousePopover
          lighthouse={selectedLighthouse}
          position={popoverPosition}
          onVisitChange={handleVisitChange}
          isAuthenticated={isSignedIn || false}
        />
      )}
    </div>
  );
};

export default UserMap;
