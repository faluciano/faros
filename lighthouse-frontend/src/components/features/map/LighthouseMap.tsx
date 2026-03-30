import { useState } from "react";
import { Map, Marker, Popup } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { Lighthouse } from "../../../types";
import LighthousePopoverContent from "../lighthouses/LighthousePopover";
import { useLighthouse } from "../../../hooks/useLighthouse";
import { useAuth } from "../../../hooks/useAuth";
import { getMapTilerStyleUrl, MAP_DEFAULTS } from "../../../utils/map";
import MapPin from "./MapPin";
import { isWebGLSupported } from "../../../utils/webgl";

const LighthouseMap = () => {
  const { lighthouses, refetchLighthouses } = useLighthouse();
  const { isSignedIn } = useAuth();
  const [selectedLighthouse, setSelectedLighthouse] = useState<Lighthouse | null>(null);

  if (!isWebGLSupported()) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)] bg-gray-50">
        <div className="text-center p-6 bg-white rounded-lg shadow-md max-w-md">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Map Unavailable</h2>
          <p className="text-gray-600">
            Your browser or device does not support WebGL, which is required to display the interactive map. 
            Please try enabling hardware acceleration in your browser settings or use a different device.
          </p>
        </div>
      </div>
    );
  }

  const handleMarkerClick = (lighthouse: Lighthouse) => {
    setSelectedLighthouse(lighthouse);
  };

  const handleMapClick = () => {
    setSelectedLighthouse(null);
  };

  const handleVisitChange = () => {
    refetchLighthouses();
  };

  return (
    <div style={{ position: "relative", height: "calc(100vh - 4rem)" }}>
      <Map
        mapStyle={getMapTilerStyleUrl()}
        initialViewState={{
          latitude: MAP_DEFAULTS.CENTER.latitude,
          longitude: MAP_DEFAULTS.CENTER.longitude,
          zoom: MAP_DEFAULTS.ZOOM,
        }}
        style={{ width: "100%", height: "100%" }}
        onClick={handleMapClick}
      >
        {lighthouses.map((lighthouse) => (
          <Marker
            key={lighthouse.id}
            longitude={lighthouse.longitude}
            latitude={lighthouse.latitude}
          >
            <div
              onClick={(e) => {
                e.stopPropagation();
                handleMarkerClick(lighthouse);
              }}
              style={{ cursor: "pointer" }}
            >
              <MapPin color={lighthouse.isVisited ? "#10B981" : "#EF4444"} />
            </div>
          </Marker>
        ))}
        {selectedLighthouse && (
          <Popup
            longitude={selectedLighthouse.longitude}
            latitude={selectedLighthouse.latitude}
            anchor="bottom"
            onClose={() => setSelectedLighthouse(null)}
            closeButton={true}
            closeOnClick={false}
            maxWidth="300px"
          >
            <LighthousePopoverContent
              lighthouse={selectedLighthouse}
              onVisitChange={handleVisitChange}
              isAuthenticated={!!isSignedIn}
            />
          </Popup>
        )}
      </Map>
    </div>
  );
};

export default LighthouseMap;
