export interface Lighthouse {
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