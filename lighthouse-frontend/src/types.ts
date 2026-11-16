import type { FeatureCollection, Point } from "geojson";

export interface Lighthouse {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  image: string;
  state: string;
  country: string;
  height: number;
  year_built: number;
  light_characteristics: string;
  description: string;
  source: string;
  image_author: string;
  image_license: string;
  image_url: string;
  isVisited?: boolean;
}

export interface LighthouseMapProperties {
  id: string;
  isVisited?: boolean;
  isWishlist?: boolean;
  isFriend?: boolean;
}

export type LighthouseMapData = FeatureCollection<Point, LighthouseMapProperties>;

export interface UserMapState {
  visited_ids: string[];
  wishlist_ids: string[];
}

export interface User {
  id: string;
  first_name: string;
  last_name: string;
  // Only present for yourself, your friends, and people who sent you a request.
  email?: string;
}