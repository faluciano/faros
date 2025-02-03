import { Lighthouse } from "../types";

export const MARKER_COLORS = {
  UNVISITED: "#EF4444", // Red
  VISITED: "#10B981",   // Green
  FRIEND: "#6366F1",    // Indigo
} as const;

export const MAP_DEFAULTS = {
  CENTER: [39.8283, -98.5795] as [number, number],
  ZOOM: 4,
  NAVBAR_HEIGHT: 64, // 4rem
} as const;

export const getLighthouseMarkerColor = (lighthouse: Lighthouse, isFriendLighthouse: boolean = false) => {
  if (isFriendLighthouse) return MARKER_COLORS.FRIEND;
  return lighthouse.isVisited ? MARKER_COLORS.VISITED : MARKER_COLORS.UNVISITED;
}; 