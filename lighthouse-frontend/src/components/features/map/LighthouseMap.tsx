import React, { useState, useRef, useEffect } from "react";
import { Map, Marker } from "pigeon-maps";
import { maptiler } from "pigeon-maps/providers";
import { Lighthouse } from "../../../types";
import LighthousePopover from "../lighthouses/LighthousePopover";
import { useLighthouse } from "../../../context/LighthouseContext";
import { useAuth } from "@clerk/clerk-react";

const maptilerProvider = maptiler(import.meta.env.VITE_MAPTILER_API_KEY!);

const LighthouseMap = () => {
  const { lighthouses, refetchLighthouses } = useLighthouse();
  const { isSignedIn } = useAuth();
  const [selectedLighthouse, setSelectedLighthouse] = useState<Lighthouse | null>(null);
  const [popoverAnchor, setPopoverAnchor] = useState<[number, number] | undefined>(undefined);
  const mapRef = useRef<any>(null);

  const handleMarkerClick = (lighthouse: Lighthouse, anchor: [number, number]) => {
    setSelectedLighthouse(lighthouse);
    setPopoverAnchor(anchor);
  };

  const handleMapClick = () => {
    setSelectedLighthouse(null);
    setPopoverAnchor(undefined);
  };

  const handleVisitChange = () => {
    refetchLighthouses();
  };

  const [height, setHeight] = useState(window.innerHeight);

  useEffect(() => {
    const handleResize = () => setHeight(window.innerHeight);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div style={{ position: "relative", height: 'calc(100vh - 4rem)' }}>
      <Map
        ref={mapRef}
        provider={maptilerProvider}
        defaultCenter={[39.8283, -98.5795]}
        defaultZoom={4}
        onClick={handleMapClick}
      >
        {lighthouses.map((lighthouse) => (
          <Marker
            key={lighthouse.id}
            anchor={[lighthouse.latitude, lighthouse.longitude]}
            color={lighthouse.isVisited ? "#10B981" : "#EF4444"}
            onClick={({ anchor }) => handleMarkerClick(lighthouse, anchor)}
          />
        ))}
        {selectedLighthouse && popoverAnchor && (
          <LighthousePopover
            lighthouse={selectedLighthouse}
            position={{ top: mapRef.current.latLngToPixel(popoverAnchor)[1], left: mapRef.current.latLngToPixel(popoverAnchor)[0] }}
            onVisitChange={handleVisitChange}
            isAuthenticated={!!isSignedIn}
          />
        )}
      </Map>
    </div>
  );
};

export default LighthouseMap;
