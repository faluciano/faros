import type {
  Lighthouse,
  LighthouseMapData,
  LighthouseSummary,
  UserMapState,
} from "../types";

export const getBaseUrl = () => {
  return import.meta.env.DEV
    ? "http://localhost:8080"
    : "https://faros-backend.thankfulmoss-a3acc927.westus2.azurecontainerapps.io";
};

export const fetchWithAuth = async <T>(
  token: string,
  endpoint: string,
  options: RequestInit = {},
): Promise<T> => {
  const response = await fetch(`${getBaseUrl()}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = errorText;
    if (errorText) {
      try {
        const payload = JSON.parse(errorText) as { message?: string; error?: string };
        errorMessage = payload.message || payload.error || errorText;
      } catch {
        errorMessage = errorText;
      }
    }
    throw new Error(errorMessage || `HTTP error! status: ${response.status}`);
  }

  return response.json() as Promise<T>;
};

export const getLighthouses = async (): Promise<Lighthouse[]> => {
  const response = await fetch(`${getBaseUrl()}/api/lighthouses`);
  if (!response.ok) {
    throw new Error('Failed to fetch lighthouses');
  }
  return response.json() as Promise<Lighthouse[]>;
};

export const getLighthousesSummary = async (): Promise<LighthouseSummary[]> => {
  const response = await fetch(`${getBaseUrl()}/api/lighthouses?summary=true`);
  if (!response.ok) {
    throw new Error('Failed to fetch lighthouse summaries');
  }
  return response.json() as Promise<LighthouseSummary[]>;
};

let lighthouseMapDataRequest: Promise<LighthouseMapData> | null = null;

export const getLighthouseMapData = (): Promise<LighthouseMapData> => {
  if (!lighthouseMapDataRequest) {
    lighthouseMapDataRequest = fetch(`${getBaseUrl()}/api/lighthouses/map`)
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to fetch lighthouse map data');
        }
        return response.json() as Promise<LighthouseMapData>;
      })
      .finally(() => {
        lighthouseMapDataRequest = null;
      });
  }
  return lighthouseMapDataRequest;
};

export const getLighthouseByID = async (id: string): Promise<Lighthouse> => {
  const response = await fetch(`${getBaseUrl()}/api/lighthouses/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch lighthouse details');
  }
  return response.json() as Promise<Lighthouse>;
};

export const getUserMapState = (token: string) =>
  fetchWithAuth<UserMapState>(token, '/user/map-state');

export const getVisitedLighthouses = (token: string) =>
  fetchWithAuth<Lighthouse[]>(token, '/user/lighthouses');
export const addVisitedLighthouse = (token: string, lighthouseId: string) =>
  fetchWithAuth<unknown>(token, '/user/lighthouses', {
    method: 'POST',
    body: JSON.stringify({ lighthouseId }),
  });
export const removeVisitedLighthouse = (token: string, lighthouseId: string) =>
  fetchWithAuth<unknown>(token, '/user/lighthouses', {
    method: 'DELETE',
    body: JSON.stringify({ lighthouseId }),
  });

export const getWishlist = (token: string) =>
  fetchWithAuth<Lighthouse[]>(token, '/user/wishlist');
export const addToWishlist = (token: string, lighthouseId: string) =>
  fetchWithAuth<unknown>(token, '/user/wishlist', {
    method: 'POST',
    body: JSON.stringify({ lighthouseId }),
  });
export const removeFromWishlist = (token: string, lighthouseId: string) =>
  fetchWithAuth<unknown>(token, '/user/wishlist', {
    method: 'DELETE',
    body: JSON.stringify({ lighthouseId }),
  });
