import React, { useEffect, useState } from "react";
import { Map, Marker } from "pigeon-maps";
import { osm } from "pigeon-maps/providers";
import { Lighthouse } from "../types";
import { useAuth } from "@clerk/clerk-react";

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
  const { getToken } = useAuth();
  

  useEffect(() => {
    const fetchData = async () => {
      let url = "https://faros-backend.azurewebsites.net/user";
      if (process.env.NODE_ENV === "development") {
        url = "http://localhost:8080/user";
      }

      try {
        const token = await getToken();
        
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch');
        }

        const data = await response.json();
        setLighthouses(data);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLighthouses(dummyLighthouses);
      }
    };

    fetchData();
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
