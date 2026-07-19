import { Lighthouse } from "../types";

export const MARKER_COLORS = {
  UNVISITED: "#C95B54",
  VISITED: "#0F766E",
  FRIEND: "#0369A1",
  WISHLIST: "#D49A3A",
} as const;

export const MAP_DEFAULTS = {
  CENTER: { latitude: 39.8283, longitude: -98.5795 },
  ZOOM: 4,
} as const;

export type FilterType = 'all' | 'visited' | 'unvisited' | 'wishlist' | 'friends';

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

export const getLighthouseMarkerColor = (
  lighthouse: Lighthouse, 
  isFriendLighthouse: boolean = false,
  isWishlist: boolean = false
) => {
  if (isFriendLighthouse) return MARKER_COLORS.FRIEND;
  if (isWishlist) return MARKER_COLORS.WISHLIST;
  return lighthouse.isVisited ? MARKER_COLORS.VISITED : MARKER_COLORS.UNVISITED;
};
