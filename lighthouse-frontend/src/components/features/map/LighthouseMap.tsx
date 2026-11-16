import { useRef } from "react";
import { Layer, Map, Source, type MapRef } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { useLighthouse } from "../../../hooks/useLighthouse";
import { useLighthouseSelection } from "../../../hooks/useLighthouseSelection";
import { MAP_DEFAULTS, MAP_STYLE_URL } from "../../../utils/map";
import { isWebGLSupported } from "../../../utils/webgl";
import PageState from "../../layout/PageState";
import LighthousePopup from "./LighthousePopup";
import {
  clusterCountLayer,
  clusterLayer,
  lighthouseHitLayer,
  lighthousePointLayer,
  LIGHTHOUSE_SOURCE_ID,
} from "./layers";

const POINT_LAYER_IDS = [lighthousePointLayer.id, lighthouseHitLayer.id];
const CLUSTER_SOURCES = { [clusterLayer.id]: LIGHTHOUSE_SOURCE_ID };
const INTERACTIVE_LAYER_IDS = [clusterLayer.id, ...POINT_LAYER_IDS];

const LighthouseMap = () => {
  const mapRef = useRef<MapRef>(null);
  const { mapData, isLoading, error } = useLighthouse();
  const { selection, clearSelection, handleMapClick, handleMouseMove, cursor } =
    useLighthouseSelection(mapRef, {
      pointLayerIDs: POINT_LAYER_IDS,
      clusterSources: CLUSTER_SOURCES,
    });

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

  return (
    <div className="relative h-[calc(100vh-4rem)]">
      <Map
        ref={mapRef}
        mapStyle={MAP_STYLE_URL}
        initialViewState={{
          latitude: MAP_DEFAULTS.CENTER.latitude,
          longitude: MAP_DEFAULTS.CENTER.longitude,
          zoom: MAP_DEFAULTS.ZOOM,
        }}
        style={{ width: "100%", height: "100%" }}
        onClick={handleMapClick}
        onMouseMove={handleMouseMove}
        cursor={cursor}
        interactiveLayerIds={INTERACTIVE_LAYER_IDS}
      >
        <Source
          id={LIGHTHOUSE_SOURCE_ID}
          type="geojson"
          data={mapData}
          cluster
          clusterMaxZoom={14}
          clusterRadius={50}
          promoteId="id"
        >
          <Layer {...clusterLayer} />
          <Layer {...clusterCountLayer} />
          <Layer {...lighthousePointLayer} />
          <Layer {...lighthouseHitLayer} />
        </Source>

        {selection ? (
          <LighthousePopup
            selection={selection}
            onClose={clearSelection}
            isAuthenticated={false}
          />
        ) : null}
      </Map>
    </div>
  );
};

export default LighthouseMap;
