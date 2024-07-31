import React, { useState } from "react";
import { Map, Marker } from "pigeon-maps";
import { osm } from "pigeon-maps/providers";

interface Lighthouse {
  id: number;
  latitude: number;
  longitude: number;
  name: string;
  image: string;
}

const LighthouseMap = ({ lighthouses }: { lighthouses: Array<Lighthouse> }) => {
  const [selectedLighthouse, setSelectedLighthouse] =
    useState<Lighthouse | null>(null);
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

  return (
    <div onClick={handleMapClick} style={{ position: "relative" }}>
      <Map
        height={window.innerHeight}
        provider={osm}
        defaultCenter={[47.6062, -122.3321]}
        zoom={9}
      >
        {lighthouses.map((lighthouse) => (
          <Marker
            key={lighthouse.id}
            anchor={[lighthouse.latitude, lighthouse.longitude]}
            onClick={(markerEvent) => {
              markerEvent.event.stopPropagation();
              handleMarkerClick(lighthouse, markerEvent);
            }}
          />
        ))}
      </Map>
      {selectedLighthouse && popoverPosition && (
        <div
          className="popover"
          style={{
            color: "black",
            position: "absolute",
            top: popoverPosition.top,
            left: popoverPosition.left,
            transform: "translate(-50%, -100%)",
            backgroundColor: "white",
            padding: "10px",
            border: "1px solid black",
            borderRadius: "5px",
            zIndex: 1000,
          }}
          onClick={(event) => event.stopPropagation()}
        >
          <h3>{selectedLighthouse.name}</h3>
          <img
            src={selectedLighthouse.image}
            alt={selectedLighthouse.name}
            width={100}
          />
        </div>
      )}
    </div>
  );
};

export default LighthouseMap;
