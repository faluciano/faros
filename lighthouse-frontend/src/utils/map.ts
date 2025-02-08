import { Lighthouse } from "../types";

export const MARKER_COLORS = {
  UNVISITED: "#EF4444", // Red
  VISITED: "#10B981",   // Green
  FRIEND: "#6366F1",    // Indigo
  WISHLIST: "#F59E0B",  // Amber
} as const;

export const MAP_DEFAULTS = {
  CENTER: [39.8283, -98.5795] as [number, number],
  ZOOM: 4,
  NAVBAR_HEIGHT: 64, // 4rem
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

export const getLighthouseMarkerColor = (
  lighthouse: Lighthouse, 
  isFriendLighthouse: boolean = false,
  isWishlist: boolean = false
) => {
  if (isFriendLighthouse) return MARKER_COLORS.FRIEND;
  if (isWishlist) return MARKER_COLORS.WISHLIST;
  return lighthouse.isVisited ? MARKER_COLORS.VISITED : MARKER_COLORS.UNVISITED;
}; 