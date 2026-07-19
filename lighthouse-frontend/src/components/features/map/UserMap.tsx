import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Layer,
  Map,
  Popup,
  Source,
  type MapLayerMouseEvent,
  type MapRef,
} from "react-map-gl/maplibre";
import type { FeatureCollection, Point } from "geojson";
import type { GeoJSONSource } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type {
  Lighthouse,
  LighthouseMapData,
  LighthouseMapProperties,
  User,
} from "../../../types";
import { useAuth } from "../../../hooks/useAuth";
import { useLighthouse } from "../../../hooks/useLighthouse";
import {
  fetchWithAuth,
  getLighthouseByID,
  getUserMapState,
} from "../../../utils/api";
import {
  DEFAULT_FILTERS,
  type FilterState,
  getMapTilerStyleUrl,
  MAP_DEFAULTS,
} from "../../../utils/map";
import { isWebGLSupported } from "../../../utils/webgl";
import PageState from "../../layout/PageState";
import LighthousePopoverContent from "../lighthouses/LighthousePopover";
import {
  clusterCountLayer,
  clusterLayer,
  lighthouseHitLayer,
  friendClusterCountLayer,
  friendClusterLayer,
  friendHitLayer,
  friendPointLayer,
  FRIEND_SOURCE_ID,
  lighthousePointLayer,
  LIGHTHOUSE_SOURCE_ID,
} from "./layers";

interface FriendState {
  isLoading: boolean;
  error: string | null;
  lighthouses: Lighthouse[] | null;
}

const emptyFriendState: FriendState = {
  isLoading: false,
  error: null,
  lighthouses: null,
};

const UserMap = () => {
  const mapRef = useRef<MapRef>(null);
  const detailRequestIDRef = useRef(0);
  const visitedOverridesRef = useRef<globalThis.Map<string, boolean>>(new globalThis.Map());
  const wishlistOverridesRef = useRef<globalThis.Map<string, boolean>>(new globalThis.Map());
  const { mapData, isLoading, error } = useLighthouse();
  const { isSignedIn, getToken } = useAuth();
  const [visitedIDs, setVisitedIDs] = useState<Set<string>>(() => new Set());
  const [wishlistIDs, setWishlistIDs] = useState<Set<string>>(() => new Set());
  const [isMapStateLoading, setIsMapStateLoading] = useState(false);
  const [friends, setFriends] = useState<User[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<string | null>(null);
  const [friendState, setFriendState] = useState<FriendState>(emptyFriendState);
  const [selectedLighthouse, setSelectedLighthouse] = useState<Lighthouse | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);

  useEffect(() => {
    if (!isSignedIn) {
      return;
    }
    const token = getToken();
    if (!token) {
      return;
    }

    let cancelled = false;
    visitedOverridesRef.current.clear();
    wishlistOverridesRef.current.clear();
    setVisitedIDs(new Set());
    setWishlistIDs(new Set());
    setIsMapStateLoading(true);

    getUserMapState(token)
      .then((state) => {
        if (cancelled) {
          return;
        }
        const visited = new Set(state.visited_ids);
        const wishlist = new Set(state.wishlist_ids);
        for (const [id, isVisited] of visitedOverridesRef.current) {
          if (isVisited) {
            visited.add(id);
          } else {
            visited.delete(id);
          }
        }
        for (const [id, isWishlist] of wishlistOverridesRef.current) {
          if (isWishlist) {
            wishlist.add(id);
          } else {
            wishlist.delete(id);
          }
        }
        setVisitedIDs(visited);
        setWishlistIDs(wishlist);
      })
      .catch((mapStateError: unknown) => {
        if (!cancelled) {
          console.error("Failed to load user map state:", mapStateError);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsMapStateLoading(false);
        }
      });

    fetchWithAuth<User[]>(token, "/user/friends")
      .then((loadedFriends) => {
        if (!cancelled) {
          setFriends(loadedFriends);
        }
      })
      .catch((friendsError: unknown) => {
        if (!cancelled) {
          console.error("Failed to load friends:", friendsError);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isSignedIn, getToken]);

  useEffect(() => {
    if (!selectedFriend || !isSignedIn) {
      setFriendState(emptyFriendState);
      return;
    }
    const token = getToken();
    if (!token) {
      return;
    }

    let cancelled = false;
    const loadFriendLighthouses = async () => {
      setFriendState({ isLoading: true, error: null, lighthouses: null });
      try {
        const lighthouses = await fetchWithAuth<Lighthouse[]>(
          token,
          `/user/friends/lighthouses?friendId=${selectedFriend}`,
        );
        if (!cancelled) {
          setFriendState({
            isLoading: false,
            error: lighthouses.length === 0
              ? `${friends.find((friend) => friend.id === selectedFriend)?.first_name ?? "This friend"} hasn't visited any lighthouses yet.`
              : null,
            lighthouses,
          });
        }
      } catch (friendError) {
        if (!cancelled) {
          console.error("Failed to load friend's lighthouses:", friendError);
          setFriendState({
            isLoading: false,
            error: "Failed to load this friend's lighthouses.",
            lighthouses: null,
          });
        }
      }
    };

    loadFriendLighthouses();
    return () => {
      cancelled = true;
    };
  }, [selectedFriend, friends, isSignedIn, getToken]);

  const visibleMapData = useMemo<LighthouseMapData | null>(() => {
    if (!mapData) {
      return null;
    }

    const features: LighthouseMapData["features"] = [];
    for (const feature of mapData.features) {
      const id = String(feature.id ?? "");
      if (!id) {
        continue;
      }
      const isVisited = visitedIDs.has(id);
      const isWishlist = wishlistIDs.has(id);
      const isVisible =
        (filters.visited && isVisited) ||
        (filters.unvisited && !isVisited) ||
        (filters.wishlist && isWishlist);

      if (isVisible) {
        features.push({
          ...feature,
          properties: {
            ...feature.properties,
            isVisited,
            isWishlist,
          },
        });
      }
    }

    return {
      ...mapData,
      features,
    };
  }, [mapData, visitedIDs, wishlistIDs, filters]);

  const friendMapData = useMemo<
    FeatureCollection<Point, LighthouseMapProperties>
  >(() => ({
    type: "FeatureCollection",
    features: filters.friends && selectedFriend && friendState.lighthouses
      ? friendState.lighthouses.map((lighthouse) => ({
          type: "Feature",
          id: lighthouse.id,
          geometry: {
            type: "Point",
            coordinates: [lighthouse.longitude, lighthouse.latitude],
          },
          properties: {
            id: lighthouse.id,
            isFriend: true,
          },
        }))
      : [],
  }), [filters.friends, selectedFriend, friendState.lighthouses]);

  const handleVisitChange = useCallback((lighthouseID: string, isVisited: boolean) => {
    visitedOverridesRef.current.set(lighthouseID, isVisited);
    setVisitedIDs((current) => {
      const next = new Set(current);
      if (isVisited) {
        next.add(lighthouseID);
      } else {
        next.delete(lighthouseID);
      }
      return next;
    });
    if (isVisited) {
      wishlistOverridesRef.current.set(lighthouseID, false);
      setWishlistIDs((current) => {
        const next = new Set(current);
        next.delete(lighthouseID);
        return next;
      });
    }
  }, []);

  const handleWishlistChange = useCallback((lighthouseID: string, isWishlist: boolean) => {
    wishlistOverridesRef.current.set(lighthouseID, isWishlist);
    setWishlistIDs((current) => {
      const next = new Set(current);
      if (isWishlist) {
        next.add(lighthouseID);
      } else {
        next.delete(lighthouseID);
      }
      return next;
    });
  }, []);

  const expandCluster = async (
    sourceID: string,
    clusterID: number,
    coordinates: [number, number],
  ) => {
    const map = mapRef.current?.getMap();
    const source = map?.getSource(sourceID) as GeoJSONSource | undefined;
    if (!map || !source || !Number.isFinite(clusterID)) {
      return;
    }
    try {
      const zoom = await source.getClusterExpansionZoom(clusterID);
      map.easeTo({ center: coordinates, zoom });
    } catch (clusterError) {
      console.error("Failed to expand lighthouse cluster:", clusterError);
    }
  };

  const handleMapClick = async (event: MapLayerMouseEvent) => {
    const feature = event.features?.[0];
    if (!feature) {
      detailRequestIDRef.current += 1;
      setIsLoadingDetails(false);
      setSelectedLighthouse(null);
      return;
    }

    if (feature.layer.id === clusterLayer.id || feature.layer.id === friendClusterLayer.id) {
      detailRequestIDRef.current += 1;
      setIsLoadingDetails(false);
      setSelectedLighthouse(null);
      await expandCluster(
        feature.layer.id === friendClusterLayer.id ? FRIEND_SOURCE_ID : LIGHTHOUSE_SOURCE_ID,
        Number(feature.properties?.cluster_id),
        (feature.geometry as Point).coordinates as [number, number],
      );
      return;
    }

    if (
      feature.layer.id === lighthousePointLayer.id ||
      feature.layer.id === lighthouseHitLayer.id ||
      feature.layer.id === friendPointLayer.id ||
      feature.layer.id === friendHitLayer.id
    ) {
      const id = String(feature.properties?.id ?? feature.id ?? "");
      if (!id) {
        return;
      }
      const requestID = detailRequestIDRef.current + 1;
      detailRequestIDRef.current = requestID;
      setIsLoadingDetails(true);
      try {
        const details = await getLighthouseByID(id);
        if (detailRequestIDRef.current === requestID) {
          setSelectedLighthouse({
            ...details,
            isVisited: visitedIDs.has(id),
          });
        }
      } catch (detailError) {
        console.error("Failed to fetch lighthouse details:", detailError);
      } finally {
        if (detailRequestIDRef.current === requestID) {
          setIsLoadingDetails(false);
        }
      }
    }
  };

  if (!isWebGLSupported()) {
    return (
      <PageState
        title="Map unavailable"
        message="Your browser or device does not support WebGL. Enable hardware acceleration or try a different device."
      />
    );
  }
  if (error) {
    return <PageState title="Unable to load the lighthouse map" message={error.message} tone="error" />;
  }
  if (isLoading || !visibleMapData) {
    return <PageState title="Loading lighthouse map..." />;
  }

  const selectedFriendName = friends.find((friend) => friend.id === selectedFriend)?.first_name;

  return (
    <div className="relative h-[calc(100vh-4rem)]">
      <div className="app-map-panel absolute left-3 top-3 z-10 w-40 sm:left-4 sm:top-4 sm:w-44">
        <h3 className="mb-3 font-bold text-faros-navy">Filters</h3>
        <div className="space-y-2">
          {([
            ["visited", "Visited", "bg-faros-teal", "accent-faros-teal"],
            ["unvisited", "Not visited", "bg-faros-coral", "accent-faros-coral"],
            ["wishlist", "Wishlist", "bg-faros-amber", "accent-faros-amber"],
            ["friends", "Friend's visited", "bg-sky-700", "accent-sky-700"],
          ] as const).map(([key, label, color, accent]) => (
            <label key={key} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={filters[key]}
                onChange={(event) =>
                  setFilters((current) => ({ ...current, [key]: event.target.checked }))
                }
                className={`rounded ${accent}`}
              />
              <span className="flex items-center text-sm">
                <span className={`mr-2 inline-block h-3 w-3 rounded-full ${color}`} />
                {label}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="app-map-panel absolute right-3 top-3 z-10 w-44 sm:right-4 sm:top-4 sm:w-64">
        <p className="mb-2 text-sm font-semibold text-faros-muted">
          Your visited lighthouses: {visitedIDs.size}
        </p>
        {isMapStateLoading ? (
          <p className="text-xs text-faros-muted">Syncing your map...</p>
        ) : null}
        {friends.length > 0 ? (
          <div className="mt-4">
            <h3 className="mb-2 font-bold text-faros-navy">View a friend&apos;s log</h3>
            <select
              value={selectedFriend ?? ""}
              onChange={(event) => setSelectedFriend(event.target.value || null)}
              className="app-input !py-2"
            >
              <option value="">Select a friend</option>
              {friends.map((friend) => (
                <option key={friend.id} value={friend.id}>
                  {friend.first_name} {friend.last_name}
                </option>
              ))}
            </select>
            {friendState.isLoading ? (
              <p className="mt-2 text-sm text-faros-muted">Loading friend&apos;s lighthouses...</p>
            ) : null}
            {friendState.error ? (
              <p className="mt-2 text-sm text-faros-muted">{friendState.error}</p>
            ) : null}
            {selectedFriend && friendState.lighthouses && !friendState.error ? (
              <p className="mt-2 text-sm text-faros-muted">
                {selectedFriendName}&apos;s visited lighthouses: {friendState.lighthouses.length}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      <Map
        ref={mapRef}
        mapStyle={getMapTilerStyleUrl()}
        initialViewState={{
          latitude: MAP_DEFAULTS.CENTER.latitude,
          longitude: MAP_DEFAULTS.CENTER.longitude,
          zoom: MAP_DEFAULTS.ZOOM,
        }}
        style={{ width: "100%", height: "100%" }}
        onClick={handleMapClick}
        interactiveLayerIds={[
          clusterLayer.id,
          lighthousePointLayer.id,
          lighthouseHitLayer.id,
          friendClusterLayer.id,
          friendPointLayer.id,
          friendHitLayer.id,
        ]}
      >
        <Source
          id={LIGHTHOUSE_SOURCE_ID}
          type="geojson"
          data={visibleMapData}
          cluster
          clusterMaxZoom={14}
          clusterRadius={50}
          promoteId="id"
        >
          <Layer {...clusterLayer} />
          <Layer {...clusterCountLayer} />
          <Layer {...lighthousePointLayer} />
          <Layer {...lighthouseHitLayer} />
        </Source>

        <Source
          id={FRIEND_SOURCE_ID}
          type="geojson"
          data={friendMapData}
          cluster
          clusterMaxZoom={14}
          clusterRadius={45}
          promoteId="id"
        >
          <Layer {...friendClusterLayer} />
          <Layer {...friendClusterCountLayer} />
          <Layer {...friendPointLayer} />
          <Layer {...friendHitLayer} />
        </Source>

        {selectedLighthouse ? (
          <Popup
            longitude={selectedLighthouse.longitude}
            latitude={selectedLighthouse.latitude}
            anchor="bottom"
            onClose={() => {
              detailRequestIDRef.current += 1;
              setIsLoadingDetails(false);
              setSelectedLighthouse(null);
            }}
            closeButton
            closeOnClick={false}
            maxWidth="300px"
          >
            <LighthousePopoverContent
              lighthouse={selectedLighthouse}
              onVisitChange={handleVisitChange}
              onWishlistChange={handleWishlistChange}
              isAuthenticated={isSignedIn}
              isInWishlist={wishlistIDs.has(selectedLighthouse.id)}
            />
          </Popup>
        ) : null}
      </Map>

      {isLoadingDetails ? (
        <div className="app-map-panel absolute bottom-4 right-4 z-10 text-sm font-semibold">
          Loading lighthouse details...
        </div>
      ) : null}
    </div>
  );
};

export default UserMap;
