import { useState, useEffect } from "react";
import { Map, Marker, Popup } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { Lighthouse, User } from "../../../types";
import { useAuth } from "../../../hooks/useAuth";
import LighthousePopoverContent from "../lighthouses/LighthousePopover";
import { useLighthouse } from "../../../hooks/useLighthouse";
import { fetchWithAuth } from "../../../utils/api";
import { getLighthouseMarkerColor, getMapTilerStyleUrl, MAP_DEFAULTS, FilterState, DEFAULT_FILTERS } from "../../../utils/map";
import MapPin from "./MapPin";
import { isWebGLSupported } from "../../../utils/webgl";
import PageState from "../../layout/PageState";

interface FriendState {
  isLoading: boolean;
  error: string | null;
  lighthouses: Lighthouse[] | null;
}

const UserMap = () => {
  const { lighthouses, setLighthouses, isLoading } = useLighthouse();
  const { isSignedIn, getToken } = useAuth();
  const [friends, setFriends] = useState<User[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<string | null>(null);
  const [friendState, setFriendState] = useState<FriendState>({
    isLoading: false,
    error: null,
    lighthouses: null
  });
  const [selectedLighthouse, setSelectedLighthouse] = useState<Lighthouse | null>(null);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [wishlistLighthouses, setWishlistLighthouses] = useState<Lighthouse[]>([]);
  const [isWishlistLoading, setIsWishlistLoading] = useState(false);

  // Fetch friends
  useEffect(() => {
    const fetchFriends = async () => {
      if (!isSignedIn) return;
      
      try {
        const token = getToken();
        if (!token) return;

        const data = await fetchWithAuth(token, '/user/friends');
        setFriends(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching friends:', error);
      }
    };

    fetchFriends();
  }, [isSignedIn, getToken]);

  // Fetch friend's lighthouses when selected
  useEffect(() => {
    const fetchFriendLighthouses = async () => {
      if (!selectedFriend || !isSignedIn) return;
      
      setFriendState(prev => ({ ...prev, isLoading: true, error: null }));
      try {
        const token = getToken();
        if (!token) return;

        const data = await fetchWithAuth(token, `/user/friends/lighthouses?friendId=${selectedFriend}`);
        const friend = friends.find(f => f.id === selectedFriend);
        
        if (!friend) {
          throw new Error('Friend not found');
        }

        // Ensure data is an array
        const lighthousesArray = Array.isArray(data) ? data : [];
        
        // Set friendly message for no lighthouses, but don't treat it as an error
        if (lighthousesArray.length === 0) {
          setFriendState({
            isLoading: false,
            error: `${friend.first_name} hasn't visited any lighthouses yet.`,
            lighthouses: []
          });
        } else {
          setFriendState({
            isLoading: false,
            error: null,
            lighthouses: lighthousesArray
          });
        }
      } catch (error) {
        console.error('Error fetching friend\'s lighthouses:', error);
        setFriendState(prev => ({
          ...prev,
          isLoading: false,
          error: 'Failed to load friend\'s lighthouses. Please try again.',
          lighthouses: null
        }));
      }
    };

    fetchFriendLighthouses();
  }, [selectedFriend, friends, isSignedIn, getToken]);

  // Fetch wishlist lighthouses
  useEffect(() => {
    const fetchWishlist = async () => {
      if (!isSignedIn) return;
      
      setIsWishlistLoading(true);
      try {
        const token = getToken();
        if (!token) return;

        const data = await fetchWithAuth(token, '/user/wishlist');
        setWishlistLighthouses(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching wishlist:', error);
      } finally {
        setIsWishlistLoading(false);
      }
    };

    fetchWishlist();
  }, [isSignedIn, getToken]);

  const handleMarkerClick = (lighthouse: Lighthouse) => {
    setSelectedLighthouse(lighthouse);
  };

  const handleMapClick = () => {
    setSelectedLighthouse(null);
  };

  const handleVisitChange = async (lighthouseId: string, isVisited: boolean) => {
    // Update optimistically
    setLighthouses(lighthouses.map(l => 
      l.id === lighthouseId ? { ...l, isVisited } : l
    ));

    try {
      const token = getToken();
      if (!token) return;

      const method = isVisited ? "POST" : "DELETE";
      await fetchWithAuth(token, '/user/lighthouses', {
        method,
        body: JSON.stringify({ lighthouseId })
      });
    } catch (error) {
      console.error('Error updating lighthouse status:', error);
      // Revert on failure
      setLighthouses(lighthouses.map(l => 
        l.id === lighthouseId ? { ...l, isVisited: !isVisited } : l
      ));
    }
  };

  const handleWishlistChange = async (lighthouseId: string, isInWishlist: boolean) => {
    // Update optimistically
    if (isInWishlist) {
      setWishlistLighthouses(prev => [...prev, lighthouses.find(l => l.id === lighthouseId)!]);
    } else {
      setWishlistLighthouses(prev => prev.filter(l => l.id !== lighthouseId));
    }
  };

  const isLighthouseInWishlist = (lighthouseId: string) => {
    return wishlistLighthouses.some(l => l.id === lighthouseId);
  };

  const getFilteredLighthouses = () => {
    return lighthouses?.filter(lighthouse => {
      if (filters.visited && lighthouse.isVisited) return true;
      if (filters.unvisited && !lighthouse.isVisited) return true;
      if (filters.wishlist && isLighthouseInWishlist(lighthouse.id)) return true;
      return false;
    }) || [];
  };

  if (isLoading || isWishlistLoading) {
    return <PageState title="Loading lighthouses..." />;
  }

  if (!isWebGLSupported()) {
    return (
      <PageState
        title="Map unavailable"
        message="Your browser or device does not support WebGL. Enable hardware acceleration or try a different device."
      />
    );
  }

  const selectedFriendName = friends.find(f => f.id === selectedFriend)?.first_name;

  return (
    <div className="relative h-[calc(100vh-4rem)]">
      {/* Filter Panel */}
      <div className="app-map-panel absolute left-3 top-3 z-10 w-40 sm:left-4 sm:top-4 sm:w-44">
        <h3 className="mb-3 font-bold text-faros-navy">Filters</h3>
        <div className="space-y-2">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={filters.visited}
              onChange={(e) => setFilters(prev => ({ ...prev, visited: e.target.checked }))}
              className="rounded accent-faros-teal focus:ring-faros-teal"
            />
            <span className="text-sm flex items-center">
              <span className="mr-2 inline-block h-3 w-3 rounded-full bg-faros-teal"></span>
              Visited
            </span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={filters.unvisited}
              onChange={(e) => setFilters(prev => ({ ...prev, unvisited: e.target.checked }))}
              className="rounded accent-faros-coral focus:ring-faros-coral"
            />
            <span className="text-sm flex items-center">
              <span className="mr-2 inline-block h-3 w-3 rounded-full bg-faros-coral"></span>
              Not Visited
            </span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={filters.wishlist}
              onChange={(e) => setFilters(prev => ({ ...prev, wishlist: e.target.checked }))}
              className="rounded accent-faros-amber focus:ring-faros-amber"
            />
            <span className="text-sm flex items-center">
              <span className="mr-2 inline-block h-3 w-3 rounded-full bg-faros-amber"></span>
              Wishlist
            </span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={filters.friends}
              onChange={(e) => setFilters(prev => ({ ...prev, friends: e.target.checked }))}
              className="rounded accent-sky-700 focus:ring-sky-700"
            />
            <span className="text-sm flex items-center">
              <span className="mr-2 inline-block h-3 w-3 rounded-full bg-sky-700"></span>
              Friend's Visited
            </span>
          </label>
        </div>
      </div>

      {/* Stats Panel */}
      <div className="app-map-panel absolute right-3 top-3 z-10 w-44 sm:right-4 sm:top-4 sm:w-64">
        <p className="mb-2 text-sm font-semibold text-faros-muted">
          Your Visited Lighthouses: {lighthouses?.filter(l => l.isVisited)?.length || 0}
        </p>
        {friends.length > 0 && (
          <div className="mt-4">
            <h3 className="mb-2 font-bold text-faros-navy">View a friend&apos;s log</h3>
            <select
              value={selectedFriend || ""}
              onChange={(e) => {
                setSelectedFriend(e.target.value || null);
                if (!e.target.value) {
                  setFriendState({ isLoading: false, error: null, lighthouses: null });
                }
              }}
              className="app-input !py-2"
            >
              <option value="">Select a friend</option>
              {friends.map((friend) => (
                <option key={friend.id} value={friend.id}>
                  {friend.first_name} {friend.last_name}
                </option>
              ))}
            </select>
            {friendState.isLoading && (
              <p className="mt-2 text-sm text-faros-muted">Loading friend&apos;s lighthouses...</p>
            )}
            {friendState.error && (
              <p className="mt-2 text-sm text-faros-muted">{friendState.error}</p>
            )}
            {selectedFriend && !friendState.isLoading && !friendState.error && friendState.lighthouses && (
              <p className="mt-2 text-sm text-faros-muted">
                {selectedFriendName}'s Visited Lighthouses: {friendState.lighthouses.length}
              </p>
            )}
          </div>
        )}
      </div>

      <Map
        mapStyle={getMapTilerStyleUrl()}
        initialViewState={{
          latitude: MAP_DEFAULTS.CENTER.latitude,
          longitude: MAP_DEFAULTS.CENTER.longitude,
          zoom: MAP_DEFAULTS.ZOOM,
        }}
        style={{ width: "100%", height: "100%" }}
        onClick={handleMapClick}
      >
        {/* Your lighthouses */}
        {getFilteredLighthouses().map((lighthouse) => (
          <Marker
            key={lighthouse.id}
            longitude={lighthouse.longitude}
            latitude={lighthouse.latitude}
          >
            <div
              onClick={(e) => {
                e.stopPropagation();
                handleMarkerClick(lighthouse);
              }}
              style={{ cursor: "pointer" }}
            >
              <MapPin color={getLighthouseMarkerColor(lighthouse, false, isLighthouseInWishlist(lighthouse.id))} />
            </div>
          </Marker>
        ))}

        {/* Friend's visited lighthouses */}
        {filters.friends && selectedFriend && friendState.lighthouses?.map((lighthouse) => (
          <Marker
            key={`friend-${lighthouse.id}`}
            longitude={lighthouse.longitude}
            latitude={lighthouse.latitude}
          >
            <div
              onClick={(e) => {
                e.stopPropagation();
                handleMarkerClick({ ...lighthouse, isVisited: true });
              }}
              style={{ cursor: "pointer" }}
            >
              <MapPin color={getLighthouseMarkerColor(lighthouse, true)} />
            </div>
          </Marker>
        ))}

        {selectedLighthouse && (
          <Popup
            longitude={selectedLighthouse.longitude}
            latitude={selectedLighthouse.latitude}
            anchor="bottom"
            onClose={() => setSelectedLighthouse(null)}
            closeButton={true}
            closeOnClick={false}
            maxWidth="300px"
          >
            <LighthousePopoverContent
              lighthouse={selectedLighthouse}
              onVisitChange={handleVisitChange}
              onWishlistChange={handleWishlistChange}
              isAuthenticated={isSignedIn || false}
              isInWishlist={isLighthouseInWishlist(selectedLighthouse.id)}
            />
          </Popup>
        )}
      </Map>
    </div>
  );
};

export default UserMap;
