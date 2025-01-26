import React, { useState } from "react";
import { Map, Marker } from "pigeon-maps";
import { osm } from "pigeon-maps/providers";
import { Lighthouse } from "../types";
import { useAuth } from "@clerk/clerk-react";
import LighthousePopover from "./LighthousePopover";
import { useLighthouse } from "../context/LighthouseContext";

const UserMap = () => {
  const { lighthouses, setLighthouses, isLoading } = useLighthouse();
  const { getToken, isSignedIn } = useAuth();

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
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-gray-800">Loading lighthouses...</h2>
        </div>
      </div>
    );
  }

  return (
    <div onClick={handleMapClick} style={{ position: "relative" }}>
      <div className="absolute top-4 right-4 z-10 bg-white text-black p-4 rounded-lg shadow-md">
        <p className="text-sm text-gray-600">
          Visited Lighthouses: {lighthouses.filter(l => l.isVisited).length}
        </p>
      </div>
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
