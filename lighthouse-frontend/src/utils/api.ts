import type { Lighthouse, LighthouseMapData, UserMapState } from "../types";

const PRODUCTION_API_URL =
  "https://faros-backend.thankfulmoss-a3acc927.westus2.azurecontainerapps.io";

// VITE_API_URL wins when set (the Aspire AppHost sets it for local runs).
export const getBaseUrl = () => {
  const configured = import.meta.env.VITE_API_URL?.replace(/\/+$/, "");
  if (configured) {
    return configured;
  }
  return import.meta.env.DEV ? "http://localhost:8080" : PRODUCTION_API_URL;
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

  const responseText = await response.text();

  if (!response.ok) {
    let errorMessage = responseText;
    if (responseText) {
      try {
        const payload = JSON.parse(responseText) as { message?: string; error?: string };
        errorMessage = payload.message || payload.error || responseText;
      } catch {
        errorMessage = responseText;
      }
    }
    throw new Error(errorMessage || `HTTP error! status: ${response.status}`);
  }

  if (!responseText) {
    return undefined as T;
  }

  return JSON.parse(responseText) as T;
};

let lighthouseMapDataRequest: Promise<LighthouseMapData> | null = null;

// The map payload is the same for everyone, so one request serves the whole
// session. main.tsx starts it before React mounts; a failure clears the slot
// so the next caller retries.
export const getLighthouseMapData = (): Promise<LighthouseMapData> => {
  if (!lighthouseMapDataRequest) {
    const request = fetch(`${getBaseUrl()}/api/lighthouses/map`)
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to fetch lighthouse map data');
        }
        return response.json() as Promise<LighthouseMapData>;
      });
    request.catch(() => {
      if (lighthouseMapDataRequest === request) {
        lighthouseMapDataRequest = null;
      }
    });
    lighthouseMapDataRequest = request;
  }
  return lighthouseMapDataRequest;
};

const lighthouseDetailRequests = new Map<string, Promise<Lighthouse>>();
const lighthouseDetails = new Map<string, Lighthouse>();

// Details already fetched this session, available without waiting.
export const getCachedLighthouse = (id: string): Lighthouse | undefined =>
  lighthouseDetails.get(id);

// Concurrent and repeat calls for one lighthouse share a single request, so
// hovering a marker can start the fetch that the click then reuses.
export const getLighthouseByID = (id: string): Promise<Lighthouse> => {
  const existing = lighthouseDetailRequests.get(id);
  if (existing) {
    return existing;
  }

  const request = fetch(`${getBaseUrl()}/api/lighthouses/${encodeURIComponent(id)}`)
    .then(async (response) => {
      if (!response.ok) {
        throw new Error('Failed to fetch lighthouse details');
      }
      const lighthouse = await response.json() as Lighthouse;
      lighthouseDetails.set(id, lighthouse);
      return lighthouse;
    });
  request.catch(() => {
    lighthouseDetailRequests.delete(id);
  });
  lighthouseDetailRequests.set(id, request);
  return request;
};

export const getUserMapState = (token: string) =>
  fetchWithAuth<UserMapState>(token, '/user/map-state');

const lighthouseMutation = (endpoint: string, method: 'POST' | 'DELETE') =>
  (token: string, lighthouseId: string) =>
    fetchWithAuth<unknown>(token, endpoint, {
      method,
      body: JSON.stringify({ lighthouseId }),
    });

export const getVisitedLighthouses = (token: string) =>
  fetchWithAuth<Lighthouse[]>(token, '/user/lighthouses');
export const addVisitedLighthouse = lighthouseMutation('/user/lighthouses', 'POST');
export const removeVisitedLighthouse = lighthouseMutation('/user/lighthouses', 'DELETE');

export const getWishlist = (token: string) =>
  fetchWithAuth<Lighthouse[]>(token, '/user/wishlist');
export const addToWishlist = lighthouseMutation('/user/wishlist', 'POST');
export const removeFromWishlist = lighthouseMutation('/user/wishlist', 'DELETE');
