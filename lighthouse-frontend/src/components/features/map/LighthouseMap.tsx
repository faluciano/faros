import { useRef, useState } from "react";
import {
  Layer,
  Map,
  Popup,
  Source,
  type MapLayerMouseEvent,
  type MapRef,
} from "react-map-gl/maplibre";
import type { Point } from "geojson";
import type { GeoJSONSource } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Lighthouse } from "../../../types";
import { useLighthouse } from "../../../hooks/useLighthouse";
import { getLighthouseByID } from "../../../utils/api";
import { getMapTilerStyleUrl, MAP_DEFAULTS } from "../../../utils/map";
import { isWebGLSupported } from "../../../utils/webgl";
import PageState from "../../layout/PageState";
import LighthousePopoverContent from "../lighthouses/LighthousePopover";
import {
  clusterCountLayer,
  clusterLayer,
  lighthousePointLayer,
  LIGHTHOUSE_SOURCE_ID,
} from "./layers";

const noopVisitChange = () => undefined;

const LighthouseMap = () => {
  const mapRef = useRef<MapRef>(null);
  const detailRequestIDRef = useRef(0);
  const { mapData, isLoading, error } = useLighthouse();
  const [selectedLighthouse, setSelectedLighthouse] = useState<Lighthouse | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  if (!isWebGLSupported()) {
    return (
      <PageState
        title="Map unavailable"
        message="Your browser or device does not support WebGL. Enable hardware acceleration or try a different device."
      />
    );
  }
  if (error) {
    return <PageState title="Unable to load the lighthouse map" message={error.message} tone="error" />;
  }
  if (isLoading || !mapData) {
    return <PageState title="Loading lighthouse map..." />;
  }

  const handleMapClick = async (event: MapLayerMouseEvent) => {
    const feature = event.features?.[0];
    if (!feature) {
      detailRequestIDRef.current += 1;
      setIsLoadingDetails(false);
      setSelectedLighthouse(null);
      return;
    }

    if (feature.layer.id === lighthousePointLayer.id) {
      const id = String(feature.id ?? "");
      if (!id) {
        return;
      }
      const requestID = detailRequestIDRef.current + 1;
      detailRequestIDRef.current = requestID;
      setIsLoadingDetails(true);
      try {
        const details = await getLighthouseByID(id);
        if (detailRequestIDRef.current === requestID) {
          setSelectedLighthouse(details);
        }
      } catch (detailError) {
        console.error("Failed to fetch lighthouse details:", detailError);
      } finally {
        if (detailRequestIDRef.current === requestID) {
          setIsLoadingDetails(false);
        }
      }
      return;
    }

    if (feature.layer.id === clusterLayer.id) {
      detailRequestIDRef.current += 1;
      setIsLoadingDetails(false);
      setSelectedLighthouse(null);
      const map = mapRef.current?.getMap();
      const source = map?.getSource(LIGHTHOUSE_SOURCE_ID) as GeoJSONSource | undefined;
      const clusterID = Number(feature.properties?.cluster_id);
      if (!map || !source || !Number.isFinite(clusterID)) {
        return;
      }

      try {
        const zoom = await source.getClusterExpansionZoom(clusterID);
        map.easeTo({
          center: (feature.geometry as Point).coordinates as [number, number],
          zoom,
        });
      } catch (clusterError) {
        console.error("Failed to expand lighthouse cluster:", clusterError);
      }
    }
  };

  return (
    <div className="relative h-[calc(100vh-4rem)]">
      <Map
        ref={mapRef}
        mapStyle={getMapTilerStyleUrl()}
        initialViewState={{
          latitude: MAP_DEFAULTS.CENTER.latitude,
          longitude: MAP_DEFAULTS.CENTER.longitude,
          zoom: MAP_DEFAULTS.ZOOM,
        }}
        style={{ width: "100%", height: "100%" }}
        onClick={handleMapClick}
        interactiveLayerIds={[clusterLayer.id, lighthousePointLayer.id]}
      >
        <Source
          id={LIGHTHOUSE_SOURCE_ID}
          type="geojson"
          data={mapData}
          cluster
          clusterMaxZoom={14}
          clusterRadius={50}
        >
          <Layer {...clusterLayer} />
          <Layer {...clusterCountLayer} />
          <Layer {...lighthousePointLayer} />
        </Source>

        {selectedLighthouse ? (
          <Popup
            longitude={selectedLighthouse.longitude}
            latitude={selectedLighthouse.latitude}
            anchor="bottom"
            onClose={() => {
              detailRequestIDRef.current += 1;
              setIsLoadingDetails(false);
              setSelectedLighthouse(null);
            }}
            closeButton
            closeOnClick={false}
            maxWidth="300px"
          >
            <LighthousePopoverContent
              lighthouse={selectedLighthouse}
              onVisitChange={noopVisitChange}
              isAuthenticated={false}
            />
          </Popup>
        ) : null}
      </Map>

      {isLoadingDetails ? (
        <div className="app-map-panel absolute bottom-4 right-4 z-10 text-sm font-semibold">
          Loading lighthouse details...
        </div>
      ) : null}
    </div>
  );
};

export default LighthouseMap;
