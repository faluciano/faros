import React, { useEffect, useState } from "react";
import { Map, Marker } from "pigeon-maps";
import { osm } from "pigeon-maps/providers";
import { Lighthouse } from "../types";

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

  useEffect(() => {
    let url = "https://faros-backend.azurewebsites.net/api/user/{id}";
    if (process.env.NODE_ENV === "development") {
      url = "http://localhost:8080/api/user/{id}";
    }

    fetch(url)
      .then((response) => response.json())
      .then((data) => setLighthouses(data))
      .catch(() => setLighthouses(dummyLighthouses));
  }, []);
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
        defaultCenter={[39.8283, -98.5795]}
        zoom={4}
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

export default UserMap;
