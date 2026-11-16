import { useCallback, useRef, useState, type RefObject } from "react";
import type { MapLayerMouseEvent, MapRef } from "react-map-gl/maplibre";
import type { Point } from "geojson";
import type { GeoJSONSource } from "maplibre-gl";
import type { Lighthouse } from "../types";
import { getCachedLighthouse, getLighthouseByID } from "../utils/api";

export interface LighthouseSelection {
  id: string;
  longitude: number;
  latitude: number;
  // null while the details request is in flight.
  details: Lighthouse | null;
  hasError: boolean;
}

interface SelectionLayers {
  // Layer ID of each clickable point layer.
  pointLayerIDs: readonly string[];
  // Cluster layer ID -> the source that owns it.
  clusterSources: Readonly<Record<string, string>>;
}

// Shared click and hover behaviour for the lighthouse maps. A marker click
// opens the popup at once from the marker's own coordinates and fills in the
// details when they arrive; hovering a marker starts that request early.
export const useLighthouseSelection = (
  mapRef: RefObject<MapRef>,
  { pointLayerIDs, clusterSources }: SelectionLayers,
) => {
  const [selection, setSelection] = useState<LighthouseSelection | null>(null);
  const [isHoveringFeature, setIsHoveringFeature] = useState(false);
  const requestIDRef = useRef(0);

  const clearSelection = useCallback(() => {
    requestIDRef.current += 1;
    setSelection(null);
  }, []);

  const handleMapClick = useCallback(async (event: MapLayerMouseEvent) => {
    const feature = event.features?.[0];
    if (!feature) {
      clearSelection();
      return;
    }
    const coordinates = (feature.geometry as Point).coordinates as [number, number];

    const clusterSourceID = clusterSources[feature.layer.id];
    if (clusterSourceID) {
      clearSelection();
      const map = mapRef.current?.getMap();
      const source = map?.getSource(clusterSourceID) as GeoJSONSource | undefined;
      const clusterID = Number(feature.properties?.cluster_id);
      if (!map || !source || !Number.isFinite(clusterID)) {
        return;
      }
      try {
        const zoom = await source.getClusterExpansionZoom(clusterID);
        map.easeTo({ center: coordinates, zoom });
      } catch (clusterError) {
        console.error("Failed to expand lighthouse cluster:", clusterError);
      }
      return;
    }

    if (!pointLayerIDs.includes(feature.layer.id)) {
      return;
    }
    const id = String(feature.properties?.id ?? feature.id ?? "");
    if (!id) {
      return;
    }

    const requestID = requestIDRef.current + 1;
    requestIDRef.current = requestID;
    const cached = getCachedLighthouse(id) ?? null;
    setSelection({
      id,
      longitude: coordinates[0],
      latitude: coordinates[1],
      details: cached,
      hasError: false,
    });
    if (cached) {
      return;
    }

    try {
      const details = await getLighthouseByID(id);
      if (requestIDRef.current === requestID) {
        setSelection((current) => (current?.id === id ? { ...current, details } : current));
      }
    } catch (detailError) {
      console.error("Failed to fetch lighthouse details:", detailError);
      if (requestIDRef.current === requestID) {
        setSelection((current) => (current?.id === id ? { ...current, hasError: true } : current));
      }
    }
  }, [mapRef, pointLayerIDs, clusterSources, clearSelection]);

  const handleMouseMove = useCallback((event: MapLayerMouseEvent) => {
    const feature = event.features?.[0];
    setIsHoveringFeature(Boolean(feature));
    if (!feature || !pointLayerIDs.includes(feature.layer.id)) {
      return;
    }
    const id = String(feature.properties?.id ?? feature.id ?? "");
    if (id) {
      // Deduplicated by the API layer; errors surface on click instead.
      getLighthouseByID(id).catch(() => undefined);
    }
  }, [pointLayerIDs]);

  return {
    selection,
    clearSelection,
    handleMapClick,
    handleMouseMove,
    cursor: isHoveringFeature ? "pointer" : undefined,
  };
};
