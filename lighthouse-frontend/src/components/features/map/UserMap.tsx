import React, { useState, useEffect } from "react";
import { Map, Marker } from "pigeon-maps";
import { maptiler } from "pigeon-maps/providers";
import { Lighthouse, User } from "../../../types";
import { useAuth } from "@clerk/clerk-react";
import LighthousePopover from "../lighthouses/LighthousePopover";
import { useLighthouse } from "../../../hooks/useLighthouse";
import { fetchWithAuth } from "../../../utils/api";
import { getLighthouseMarkerColor, MAP_DEFAULTS, FilterState, DEFAULT_FILTERS } from "../../../utils/map";

const maptilerProvider = maptiler(import.meta.env.VITE_MAPTILER_API_KEY!);

interface MarkerClickEvent {
  event: React.MouseEvent;
}

interface FriendState {
  isLoading: boolean;
  error: string | null;
  lighthouses: Lighthouse[] | null;
}

interface PopoverState {
  lighthouse: Lighthouse | null;
  position: { top: number; left: number; } | null;
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
  const [popover, setPopover] = useState<PopoverState>({
    lighthouse: null,
    position: null
  });
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [wishlistLighthouses, setWishlistLighthouses] = useState<Lighthouse[]>([]);
  const [isWishlistLoading, setIsWishlistLoading] = useState(false);

  // Fetch friends
  useEffect(() => {
    const fetchFriends = async () => {
      if (!isSignedIn) return;
      
      try {
        const token = await getToken();
        if (!token) return;

        const data = await fetchWithAuth(token, '/user/friends');
        setFriends(data);
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
        const token = await getToken();
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
        const token = await getToken();
        if (!token) return;

        const data = await fetchWithAuth(token, '/user/wishlist');
        setWishlistLighthouses(data);
      } catch (error) {
        console.error('Error fetching wishlist:', error);
      } finally {
        setIsWishlistLoading(false);
      }
    };

    fetchWishlist();
  }, [isSignedIn, getToken]);

  const handleMarkerClick = (
    lighthouse: Lighthouse,
    { event }: MarkerClickEvent
  ) => {
    const { clientX, clientY } = event;
    setPopover({
      lighthouse,
      position: { top: clientY, left: clientX }
    });
  };

  const handleMapClick = () => {
    setPopover({ lighthouse: null, position: null });
  };

  const handleVisitChange = async (lighthouseId: string, isVisited: boolean) => {
    // Update optimistically
    setLighthouses(lighthouses.map(l => 
      l.id === lighthouseId ? { ...l, isVisited } : l
    ));

    try {
      const token = await getToken();
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
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-gray-800">Loading lighthouses...</h2>
        </div>
      </div>
    );
  }

  const selectedFriendName = friends.find(f => f.id === selectedFriend)?.first_name;

  return (
    <div onClick={handleMapClick} className="relative h-[calc(100vh-4rem)]">
      {/* Filter Panel */}
      <div className="absolute top-4 left-4 z-10 bg-white text-black p-4 rounded-lg shadow-md">
        <h3 className="font-medium text-gray-800 mb-3">Filters</h3>
        <div className="space-y-2">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={filters.visited}
              onChange={(e) => setFilters(prev => ({ ...prev, visited: e.target.checked }))}
              className="rounded text-green-500 focus:ring-green-500"
            />
            <span className="text-sm flex items-center">
              <span className="w-3 h-3 rounded-full bg-[#10B981] inline-block mr-2"></span>
              Visited
            </span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={filters.unvisited}
              onChange={(e) => setFilters(prev => ({ ...prev, unvisited: e.target.checked }))}
              className="rounded text-red-500 focus:ring-red-500"
            />
            <span className="text-sm flex items-center">
              <span className="w-3 h-3 rounded-full bg-[#EF4444] inline-block mr-2"></span>
              Not Visited
            </span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={filters.wishlist}
              onChange={(e) => setFilters(prev => ({ ...prev, wishlist: e.target.checked }))}
              className="rounded text-amber-500 focus:ring-amber-500"
            />
            <span className="text-sm flex items-center">
              <span className="w-3 h-3 rounded-full bg-[#F59E0B] inline-block mr-2"></span>
              Wishlist
            </span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={filters.friends}
              onChange={(e) => setFilters(prev => ({ ...prev, friends: e.target.checked }))}
              className="rounded text-indigo-500 focus:ring-indigo-500"
            />
            <span className="text-sm flex items-center">
              <span className="w-3 h-3 rounded-full bg-[#6366F1] inline-block mr-2"></span>
              Friend's Visited
            </span>
          </label>
        </div>
      </div>

      {/* Stats Panel */}
      <div className="absolute top-4 right-4 z-10 bg-white text-black p-4 rounded-lg shadow-md">
        <p className="text-sm text-gray-600 mb-2">
          Your Visited Lighthouses: {lighthouses?.filter(l => l.isVisited)?.length || 0}
        </p>
        {friends.length > 0 && (
          <div className="mt-4">
            <h3 className="font-medium text-gray-800 mb-2">View Friend's Lighthouses:</h3>
            <select
              value={selectedFriend || ""}
              onChange={(e) => {
                setSelectedFriend(e.target.value || null);
                if (!e.target.value) {
                  setFriendState({ isLoading: false, error: null, lighthouses: null });
                }
              }}
              className="w-full p-2 border rounded-md"
            >
              <option value="">Select a friend</option>
              {friends.map((friend) => (
                <option key={friend.id} value={friend.id}>
                  {friend.first_name} {friend.last_name}
                </option>
              ))}
            </select>
            {friendState.isLoading && (
              <p className="mt-2 text-sm text-gray-600">Loading friend's lighthouses...</p>
            )}
            {friendState.error && (
              <p className="mt-2 text-sm text-gray-600">{friendState.error}</p>
            )}
            {selectedFriend && !friendState.isLoading && !friendState.error && friendState.lighthouses && (
              <p className="mt-2 text-sm text-gray-600">
                {selectedFriendName}'s Visited Lighthouses: {friendState.lighthouses.length}
              </p>
            )}
          </div>
        )}
      </div>

      <Map
        height={window.innerHeight - MAP_DEFAULTS.NAVBAR_HEIGHT}
        width={window.innerWidth}
        provider={maptilerProvider}
        defaultCenter={MAP_DEFAULTS.CENTER}
        zoom={MAP_DEFAULTS.ZOOM}
      >
        {/* Your lighthouses */}
        {getFilteredLighthouses().map((lighthouse) => (
          <Marker
            key={lighthouse.id}
            anchor={[lighthouse.latitude, lighthouse.longitude]}
            color={getLighthouseMarkerColor(lighthouse, false, isLighthouseInWishlist(lighthouse.id))}
            onClick={(markerEvent) => {
              markerEvent.event.stopPropagation();
              handleMarkerClick(lighthouse, markerEvent);
            }}
          />
        ))}

        {/* Friend's visited lighthouses */}
        {filters.friends && selectedFriend && friendState.lighthouses?.map((lighthouse) => (
          <Marker
            key={`friend-${lighthouse.id}`}
            anchor={[lighthouse.latitude, lighthouse.longitude]}
            color={getLighthouseMarkerColor(lighthouse, true)}
            onClick={(markerEvent) => {
              markerEvent.event.stopPropagation();
              handleMarkerClick({ ...lighthouse, isVisited: true }, markerEvent);
            }}
          />
        ))}
      </Map>

      {popover.lighthouse && popover.position && (
        <LighthousePopover
          lighthouse={popover.lighthouse}
          position={popover.position}
          onVisitChange={handleVisitChange}
          onWishlistChange={handleWishlistChange}
          isAuthenticated={isSignedIn || false}
          isInWishlist={isLighthouseInWishlist(popover.lighthouse.id)}
        />
      )}
    </div>
  );
};

export default UserMap;
