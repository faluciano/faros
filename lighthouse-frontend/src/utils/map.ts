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

export const getMapTilerStyleUrl = () =>
  `https://api.maptiler.com/maps/streets-v2/style.json?key=${import.meta.env.VITE_MAPTILER_API_KEY}`;
