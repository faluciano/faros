import type { Lighthouse, LighthouseMapData, UserMapState } from "../types";
import {
  getDetailShard,
  getDetailShardFile,
  LIGHTHOUSE_DATA_PATH,
  toMapData,
  type LighthouseDetailShard,
  type LighthouseIndex,
} from "./lighthouseData";

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

const fetchLighthouseData = async <T>(file: string): Promise<T> => {
  const response = await fetch(`${LIGHTHOUSE_DATA_PATH}/${file}`);
  if (!response.ok) {
    throw new Error('Failed to load lighthouse data');
  }
  return response.json() as Promise<T>;
};

// Remembers one in-flight or finished load per key and forgets failures, so
// the next caller retries.
const createLoader = <K, T>(load: (key: K) => Promise<T>) => {
  const requests = new Map<K, Promise<T>>();
  return (key: K): Promise<T> => {
    const existing = requests.get(key);
    if (existing) {
      return existing;
    }
    const request = load(key);
    request.catch(() => {
      requests.delete(key);
    });
    requests.set(key, request);
    return request;
  };
};

const loadMapData = createLoader((file: string) =>
  fetchLighthouseData<LighthouseIndex>(file).then(toMapData));

// Every marker on the map. The payload is the same for everyone, so one
// request serves the whole session; main.tsx starts it before React mounts.
export const getLighthouseMapData = (): Promise<LighthouseMapData> =>
  loadMapData("index.json");

const lighthouseDetails = new Map<string, Lighthouse>();

const loadDetailShard = createLoader(async (shard: number) => {
  const lighthouses = await fetchLighthouseData<LighthouseDetailShard>(getDetailShardFile(shard));
  for (const lighthouse of Object.values(lighthouses)) {
    lighthouseDetails.set(lighthouse.id, lighthouse);
  }
  return lighthouses;
});

// Details already loaded this session, available without waiting.
export const getCachedLighthouse = (id: string): Lighthouse | undefined =>
  lighthouseDetails.get(id);

// Details live in static shard files, so hovering a marker can start the
// load that the click then reuses.
export const getLighthouseByID = async (id: string): Promise<Lighthouse> => {
  const lighthouse = (await loadDetailShard(getDetailShard(id)))[id];
  if (!lighthouse) {
    throw new Error('Lighthouse not found');
  }
  return lighthouse;
};

// Resolves IDs to full records in the order given, skipping IDs that are no
// longer in the dataset.
export const getLighthousesByIDs = async (ids: string[]): Promise<Lighthouse[]> => {
  const results = await Promise.all(
    ids.map((id) => getLighthouseByID(id).catch(() => null)),
  );
  return results.filter((lighthouse): lighthouse is Lighthouse => lighthouse !== null);
};

export const getUserMapState = (token: string) =>
  fetchWithAuth<UserMapState>(token, '/user/map-state');

const lighthouseMutation = (endpoint: string, method: 'POST' | 'DELETE') =>
  (token: string, lighthouseId: string) =>
    fetchWithAuth<unknown>(token, endpoint, {
      method,
      body: JSON.stringify({ lighthouseId }),
    });

export const getVisitedLighthouses = async (token: string) =>
  getLighthousesByIDs((await getUserMapState(token)).visited_ids);
export const addVisitedLighthouse = lighthouseMutation('/user/lighthouses', 'POST');
export const removeVisitedLighthouse = lighthouseMutation('/user/lighthouses', 'DELETE');

export const getWishlist = async (token: string) =>
  getLighthousesByIDs((await getUserMapState(token)).wishlist_ids);
export const addToWishlist = lighthouseMutation('/user/wishlist', 'POST');
export const removeFromWishlist = lighthouseMutation('/user/wishlist', 'DELETE');
