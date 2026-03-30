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

export interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}