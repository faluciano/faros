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

export interface LighthouseSummary {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  image: string;
  state: string;
  country: string;
  isVisited?: boolean;
}

export interface LighthouseMapProperties {
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
  email: string;
}