import type { Lighthouse, LighthouseMapData, User, UserMapState } from "../types";
import {
  getDetailShard,
  getDetailShardFile,
  LIGHTHOUSE_DATA_PATH,
  toMapData,
  type LighthouseDetailShard,
  type LighthouseIndex,
} from "./lighthouseData";

// The API is served by the same Worker as the app, under /api. The browser
// sends the session cookie on its own, so no token is handled here.
const API_BASE = "/api";

export const apiFetch = async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  });

  const responseText = await response.text();

  if (!response.ok) {
    let errorMessage = responseText;
    try {
      const payload = JSON.parse(responseText) as { message?: string };
      errorMessage = payload.message || responseText;
    } catch {
      // Not JSON; show the body as it is.
    }
    throw new ApiRequestError(response.status, errorMessage || `Request failed with status ${response.status}`);
  }

  return (responseText ? JSON.parse(responseText) : undefined) as T;
};

export class ApiRequestError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const jsonBody = (method: 'POST' | 'DELETE', body: unknown): RequestInit => ({
  method,
  body: JSON.stringify(body),
});

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

export const getUserMapState = () => apiFetch<UserMapState>('/user/map-state');

const lighthouseMutation = (endpoint: string, method: 'POST' | 'DELETE') =>
  (lighthouseId: string) => apiFetch<unknown>(endpoint, jsonBody(method, { lighthouseId }));

export const getVisitedLighthouses = async () =>
  getLighthousesByIDs((await getUserMapState()).visited_ids);
export const addVisitedLighthouse = lighthouseMutation('/user/lighthouses', 'POST');
export const removeVisitedLighthouse = lighthouseMutation('/user/lighthouses', 'DELETE');

export const getWishlist = async () =>
  getLighthousesByIDs((await getUserMapState()).wishlist_ids);
export const addToWishlist = lighthouseMutation('/user/wishlist', 'POST');
export const removeFromWishlist = lighthouseMutation('/user/wishlist', 'DELETE');

export const getFriends = () => apiFetch<User[]>('/user/friends');
export const getFriendRequests = () => apiFetch<User[]>('/user/friends/requests');
export const getOutgoingFriendRequests = () => apiFetch<User[]>('/user/friends/requests/outgoing');
export const searchUsers = (query: string) =>
  apiFetch<User[]>(`/users/search?query=${encodeURIComponent(query)}`);
export const sendFriendRequest = (friendId: string) =>
  apiFetch<unknown>('/user/friends/requests', jsonBody('POST', { friendId }));
export const acceptFriendRequest = (friendId: string) =>
  apiFetch<unknown>('/user/friends/requests/accept', jsonBody('POST', { friendId }));
export const removeFriend = (friendId: string) =>
  apiFetch<unknown>('/user/friends', jsonBody('DELETE', { friendId }));
// IDs of the lighthouses a friend has visited.
export const getFriendVisitedIDs = (friendId: string) =>
  apiFetch<string[]>(`/user/friends/lighthouses?friendId=${encodeURIComponent(friendId)}`);

export const getCurrentUser = () => apiFetch<User>('/auth/me');
export const signOut = () => apiFetch<unknown>('/auth/logout', { method: 'POST' });
