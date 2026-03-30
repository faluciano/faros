import { useState, useMemo, useRef } from "react";
import { Map, Source, Layer, Popup, MapRef, CircleLayerSpecification, SymbolLayerSpecification, MapLayerMouseEvent } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { Lighthouse } from "../../../types";
import LighthousePopoverContent from "../lighthouses/LighthousePopover";
import { useLighthouse } from "../../../hooks/useLighthouse";
import { useAuth } from "../../../hooks/useAuth";
import { getMapTilerStyleUrl, MAP_DEFAULTS } from "../../../utils/map";
import { isWebGLSupported } from "../../../utils/webgl";
import { getLighthouseByID } from "../../../utils/api";
import { FeatureCollection, Point } from "geojson";
import { GeoJSONSource } from "maplibre-gl";

const clusterLayer: CircleLayerSpecification = {
  id: 'clusters',
  type: 'circle',
  source: 'lighthouses',
  filter: ['has', 'point_count'],
  paint: {
    'circle-color': ['step', ['get', 'point_count'], '#51bbd6', 100, '#f1f075', 750, '#f28cb1'],
    'circle-radius': ['step', ['get', 'point_count'], 20, 100, 30, 750, 40]
  }
};

const clusterCountLayer: SymbolLayerSpecification = {
  id: 'cluster-count',
  type: 'symbol',
  source: 'lighthouses',
  filter: ['has', 'point_count'],
  layout: {
    'text-field': '{point_count_abbreviated}',
    'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
    'text-size': 12
  }
};

const unclusteredPointLayer: CircleLayerSpecification = {
  id: 'unclustered-point',
  type: 'circle',
  source: 'lighthouses',
  filter: ['!', ['has', 'point_count']],
  paint: {
    'circle-color': ['case', ['get', 'isVisited'], '#10B981', '#EF4444'],
    'circle-radius': 6,
    'circle-stroke-width': 1,
    'circle-stroke-color': '#fff'
  }
};

const LighthouseMap = () => {
  const mapRef = useRef<MapRef>(null);
  const { lighthouses, refetchLighthouses } = useLighthouse();
  const { isSignedIn } = useAuth();
  const [selectedLighthouse, setSelectedLighthouse] = useState<Lighthouse | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  const geojson: FeatureCollection = useMemo(() => {
    return {
      type: 'FeatureCollection',
      features: lighthouses.map((l) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [l.longitude, l.latitude]
        },
        properties: {
          id: l.id,
          name: l.name,
          isVisited: l.isVisited || false
        }
      }))
    };
  }, [lighthouses]);

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

  const handleMapClick = async (event: MapLayerMouseEvent) => {
    const feature = event.features?.[0];
    if (feature && feature.layer.id === 'unclustered-point') {
      const id = feature.properties?.id;
      setIsLoadingDetails(true);
      try {
        const details = await getLighthouseByID(id);
        setSelectedLighthouse({
            ...details,
            isVisited: feature.properties?.isVisited
        });
      } catch (error) {
        console.error("Failed to fetch lighthouse details:", error);
      } finally {
        setIsLoadingDetails(false);
      }
    } else if (feature && feature.layer.id === 'clusters') {
        const clusterId = feature.properties?.cluster_id;
        const map = mapRef.current?.getMap();
        if (map) {
            const source = map.getSource('lighthouses') as GeoJSONSource;
            if (source) {
                source.getClusterExpansionZoom(clusterId).then((zoom) => {
                    map.easeTo({
                        center: (feature.geometry as Point).coordinates as [number, number],
                        zoom: zoom
                    });
                }).catch(err => {
                    console.error("Failed to get cluster expansion zoom:", err);
                });
            }
        }
    } else {
      setSelectedLighthouse(null);
    }
  };

  const handleVisitChange = () => {
    refetchLighthouses();
  };

  return (
    <div style={{ position: "relative", height: "calc(100vh - 4rem)" }}>
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
        interactiveLayerIds={['clusters', 'unclustered-point']}
      >
        <Source
          id="lighthouses"
          type="geojson"
          data={geojson}
          cluster={true}
          clusterMaxZoom={14}
          clusterRadius={50}
        >
          <Layer {...clusterLayer} />
          <Layer {...clusterCountLayer} />
          <Layer {...unclusteredPointLayer} />
        </Source>

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
        {isLoadingDetails && (
            <div className="absolute top-4 right-4 bg-white p-2 rounded shadow-md z-10">
                Loading details...
            </div>
        )}
      </Map>
    </div>
  );
};

export default LighthouseMap;
