export const MAP_DEFAULTS = {
  CENTER: { latitude: 39.8283, longitude: -98.5795 },
  ZOOM: 4,
} as const;

export interface FilterState {
  visited: boolean;
  unvisited: boolean;
  wishlist: boolean;
  friends: boolean;
}

export const DEFAULT_FILTERS: FilterState = {
  visited: true,
  unvisited: true,
  wishlist: true,
  friends: true,
};

// OpenFreeMap serves OpenStreetMap vector tiles without an API key. Any
// MapLibre style URL works here if the provider ever needs to change.
export const MAP_STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";
