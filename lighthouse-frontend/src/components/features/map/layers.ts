import type {
  CircleLayerSpecification,
  SymbolLayerSpecification,
} from "maplibre-gl";

export const LIGHTHOUSE_SOURCE_ID = "lighthouses";
export const FRIEND_SOURCE_ID = "friend-lighthouses";

export const clusterLayer: CircleLayerSpecification = {
  id: "clusters",
  type: "circle",
  source: LIGHTHOUSE_SOURCE_ID,
  filter: ["has", "point_count"],
  paint: {
    "circle-color": ["step", ["get", "point_count"], "#52636A", 100, "#344A53", 750, "#1E343D"],
    "circle-radius": ["step", ["get", "point_count"], 20, 100, 30, 750, 40],
    "circle-stroke-width": 2,
    "circle-stroke-color": "rgba(255, 255, 255, 0.85)",
  },
};

export const clusterCountLayer: SymbolLayerSpecification = {
  id: "cluster-count",
  type: "symbol",
  source: LIGHTHOUSE_SOURCE_ID,
  filter: ["has", "point_count"],
  layout: {
    "text-field": "{point_count_abbreviated}",
    "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
    "text-size": 12,
  },
  paint: {
    "text-color": "#FFFFFF",
    "text-halo-color": "rgba(12, 45, 54, 0.35)",
    "text-halo-width": 1,
  },
};

export const lighthousePointLayer: CircleLayerSpecification = {
  id: "unclustered-point",
  type: "circle",
  source: LIGHTHOUSE_SOURCE_ID,
  filter: ["!", ["has", "point_count"]],
  paint: {
    "circle-color": [
      "case",
      ["boolean", ["get", "isVisited"], false],
      "#0F766E",
      ["boolean", ["get", "isWishlist"], false],
      "#D49A3A",
      "#C95B54",
    ],
    "circle-radius": 6,
    "circle-stroke-width": 1,
    "circle-stroke-color": "#fff",
  },
};

export const lighthouseHitLayer: CircleLayerSpecification = {
  id: "unclustered-point-hit-area",
  type: "circle",
  source: LIGHTHOUSE_SOURCE_ID,
  filter: ["!", ["has", "point_count"]],
  paint: {
    "circle-color": "#000",
    "circle-opacity": 0.01,
    "circle-radius": 16,
    "circle-stroke-width": 0,
  },
};

export const friendClusterLayer: CircleLayerSpecification = {
  id: "friend-clusters",
  type: "circle",
  source: FRIEND_SOURCE_ID,
  filter: ["has", "point_count"],
  paint: {
    "circle-color": "#0369A1",
    "circle-radius": ["step", ["get", "point_count"], 18, 50, 25, 250, 34],
    "circle-stroke-width": 2,
    "circle-stroke-color": "#fff",
  },
};

export const friendClusterCountLayer: SymbolLayerSpecification = {
  id: "friend-cluster-count",
  type: "symbol",
  source: FRIEND_SOURCE_ID,
  filter: ["has", "point_count"],
  layout: {
    "text-field": "{point_count_abbreviated}",
    "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
    "text-size": 12,
  },
};

export const friendPointLayer: CircleLayerSpecification = {
  id: "friend-point",
  type: "circle",
  source: FRIEND_SOURCE_ID,
  filter: ["!", ["has", "point_count"]],
  paint: {
    "circle-color": "#0369A1",
    "circle-radius": 6,
    "circle-stroke-width": 1,
    "circle-stroke-color": "#fff",
  },
};

export const friendHitLayer: CircleLayerSpecification = {
  id: "friend-point-hit-area",
  type: "circle",
  source: FRIEND_SOURCE_ID,
  filter: ["!", ["has", "point_count"]],
  paint: {
    "circle-color": "#000",
    "circle-opacity": 0.01,
    "circle-radius": 16,
    "circle-stroke-width": 0,
  },
};
