import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { Tab } from '@headlessui/react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { User } from '../../../types';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function Friends() {
  const { getToken, isSignedIn } = useAuth();
  const [friends, setFriends] = useState<User[]>([]);
  const [pendingRequests, setPendingRequests] = useState<User[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<User[]>([]);
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getBaseUrl = () => {
    let baseUrl = "https://faros-backend.azurewebsites.net";
    if (process.env.NODE_ENV === "development") {
      baseUrl = "http://localhost:8080";
    }
    return baseUrl;
  };

  const fetchFriends = useCallback(async () => {
    if (!isSignedIn) return;
    
    try {
      const token = await getToken();
      if (!token) return;

      const response = await fetch(`${getBaseUrl()}/user/friends`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch friends');
      const data = await response.json();
      setFriends(data || []);
    } catch (err) {
      setError('Failed to load friends');
      console.error(err);
      setFriends([]);
    }
  }, [getToken, isSignedIn]);

  const fetchPendingRequests = useCallback(async () => {
    if (!isSignedIn) return;
    
    try {
      const token = await getToken();
      if (!token) return;

      const response = await fetch(`${getBaseUrl()}/user/friends/requests`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch friend requests');
      const data = await response.json();
      setPendingRequests(data || []);
    } catch (err) {
      setError('Failed to load friend requests');
      console.error(err);
      setPendingRequests([]);
    }
  }, [getToken, isSignedIn]);

  const fetchOutgoingRequests = useCallback(async () => {
    if (!isSignedIn) return;
    
    try {
      const token = await getToken();
      if (!token) return;

      const response = await fetch(`${getBaseUrl()}/user/friends/requests/outgoing`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch outgoing friend requests');
      const data = await response.json();
      setOutgoingRequests(data || []);
    } catch (err) {
      setError('Failed to load outgoing friend requests');
      console.error(err);
      setOutgoingRequests([]);
    }
  }, [getToken, isSignedIn]);

  const searchUsers = useCallback(async (query: string) => {
    if (!query.trim() || !isSignedIn) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    setError(null);
    
    try {
      const token = await getToken();
      if (!token) {
        setIsSearching(false);
        return;
      }

      const response = await fetch(`${getBaseUrl()}/users/search?query=${encodeURIComponent(query.trim())}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to search users');
      }

      const data = await response.json();
      
      // Filter out users that are already friends, have pending requests, or outgoing requests
      const currentFriendIds = new Set(friends.map(f => f.id));
      const pendingRequestIds = new Set(pendingRequests.map(p => p.id));
      const outgoingRequestIds = new Set(outgoingRequests.map(p => p.id));
      
      const filteredResults = (data || []).filter((user: User) => 
        !currentFriendIds.has(user.id) && 
        !pendingRequestIds.has(user.id) &&
        !outgoingRequestIds.has(user.id)
      );
      
      setSearchResults(filteredResults);
    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to search users. Please try again.');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [getToken, isSignedIn, friends, pendingRequests, outgoingRequests]);

  const sendFriendRequest = async (friendId: string) => {
    if (!isSignedIn) return;
    
    try {
      const token = await getToken();
      if (!token) return;

      const response = await fetch(`${getBaseUrl()}/user/friends/requests`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ friendId }),
      });
      if (!response.ok) throw new Error('Failed to send friend request');

      // Remove user from search results
      setSearchResults(searchResults.filter(user => user.id !== friendId));
      
      // Add to outgoing requests
      const userToAdd = searchResults.find(user => user.id === friendId);
      if (userToAdd) {
        setOutgoingRequests([...outgoingRequests, userToAdd]);
      }
    } catch (err) {
      setError('Failed to send friend request');
      console.error(err);
    }
  };

  const acceptFriendRequest = async (friendId: string) => {
    if (!isSignedIn) return;
    
    try {
      const token = await getToken();
      if (!token) return;

      const response = await fetch(`${getBaseUrl()}/user/friends/requests/accept`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ friendId }),
      });
      if (!response.ok) throw new Error('Failed to accept friend request');
      
      // Refresh both lists
      await fetchPendingRequests();
      await fetchFriends();
    } catch (err) {
      setError('Failed to accept friend request');
      console.error(err);
    }
  };

  const removeFriend = async (friendId: string) => {
    if (!isSignedIn) return;
    
    try {
      const token = await getToken();
      if (!token) return;

      const response = await fetch(`${getBaseUrl()}/user/friends`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ friendId }),
      });
      if (!response.ok) throw new Error('Failed to remove friend');
      
      // Update all relevant lists
      setFriends(friends.filter(friend => friend.id !== friendId));
      setPendingRequests(pendingRequests.filter(request => request.id !== friendId));
      setOutgoingRequests(outgoingRequests.filter(request => request.id !== friendId));
    } catch (err) {
      setError('Failed to remove friend');
      console.error(err);
    }
  };

  useEffect(() => {
    if (isSignedIn) {
      setIsLoading(true);
      Promise.all([fetchFriends(), fetchPendingRequests(), fetchOutgoingRequests()])
        .finally(() => setIsLoading(false));
    }
  }, [isSignedIn, fetchFriends, fetchPendingRequests, fetchOutgoingRequests]);

  // Update debounce effect
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const timeoutId = setTimeout(() => {
      searchUsers(searchQuery);
    }, 500); // Increased debounce time for better performance

    return () => {
      clearTimeout(timeoutId);
      setIsSearching(false);
    };
  }, [searchQuery, friends, pendingRequests, outgoingRequests, searchUsers]); // Added dependencies to update results when lists change

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-4">
            Please sign in to view your friends
          </h2>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-4">
            Loading...
          </h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          {error && (
            <div className="mb-4 p-4 text-red-700 bg-red-100 rounded-lg">
              {error}
            </div>
          )}

          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (!e.target.value.trim()) {
                    setSearchResults([]);
                    setIsSearching(false);
                  }
                }}
                placeholder="Search users by name or email..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900"
              />
            </div>

            {/* Search Results */}
            {searchQuery.trim() && (
              <div className="mt-4">
                <h3 className="text-lg font-semibold mb-2">Search Results</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {isSearching ? (
                    <p className="text-gray-500 col-span-full text-center">Searching...</p>
                  ) : searchResults && searchResults.length > 0 ? (
                    searchResults.map((user) => (
                      <div
                        key={user.id}
                        className="bg-white p-4 rounded-lg shadow border"
                      >
                        <h3 className="text-lg font-semibold">
                          {user.first_name} {user.last_name}
                        </h3>
                        <p className="text-gray-600 text-sm">{user.email}</p>
                        <button
                          onClick={() => sendFriendRequest(user.id)}
                          className="mt-2 w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
                        >
                          Send Friend Request
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 col-span-full text-center">
                      {searchQuery.trim() ? 'No users found' : 'Type to search for users'}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          <Tab.Group>
            <Tab.List className="flex space-x-1 rounded-xl bg-blue-900/20 p-1">
              <Tab
                className={({ selected }) =>
                  classNames(
                    'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                    'ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2',
                    selected
                      ? 'bg-white text-blue-700 shadow'
                      : 'text-gray-700 hover:bg-white/[0.12] hover:text-blue-900'
                  )
                }
              >
                Friends ({friends?.length || 0})
              </Tab>
              <Tab
                className={({ selected }) =>
                  classNames(
                    'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                    'ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2',
                    selected
                      ? 'bg-white text-blue-700 shadow'
                      : 'text-gray-700 hover:bg-white/[0.12] hover:text-blue-900'
                  )
                }
              >
                Pending Requests ({pendingRequests?.length || 0})
              </Tab>
              <Tab
                className={({ selected }) =>
                  classNames(
                    'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                    'ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2',
                    selected
                      ? 'bg-white text-blue-700 shadow'
                      : 'text-gray-700 hover:bg-white/[0.12] hover:text-blue-900'
                  )
                }
              >
                Outgoing Requests ({outgoingRequests?.length || 0})
              </Tab>
            </Tab.List>
            <Tab.Panels className="mt-4">
              <Tab.Panel>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {friends && friends.length > 0 ? (
                    friends.map((friend) => (
                      <div
                        key={friend.id}
                        className="bg-white p-4 rounded-lg shadow border"
                      >
                        <h3 className="text-lg font-semibold">
                          {friend.first_name} {friend.last_name}
                        </h3>
                        <p className="text-gray-600 text-sm">{friend.email}</p>
                        <button
                          onClick={() => removeFriend(friend.id)}
                          className="mt-2 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
                        >
                          Remove Friend
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 col-span-full text-center py-4">
                      You don't have any friends yet.
                    </p>
                  )}
                </div>
              </Tab.Panel>
              <Tab.Panel>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pendingRequests && pendingRequests.length > 0 ? (
                    pendingRequests.map((request) => (
                      <div
                        key={request.id}
                        className="bg-white p-4 rounded-lg shadow border"
                      >
                        <h3 className="text-lg font-semibold">
                          {request.first_name} {request.last_name}
                        </h3>
                        <p className="text-gray-600 text-sm">{request.email}</p>
                        <div className="mt-2 space-x-2">
                          <button
                            onClick={() => acceptFriendRequest(request.id)}
                            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => removeFriend(request.id)}
                            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
                          >
                            Decline
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 col-span-full text-center py-4">
                      No pending friend requests.
                    </p>
                  )}
                </div>
              </Tab.Panel>
              <Tab.Panel>
                <div className="space-y-4">
                  {outgoingRequests && outgoingRequests.length > 0 ? (
                    outgoingRequests.map((request) => (
                      <div
                        key={request.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">
                            {request.first_name} {request.last_name}
                          </h3>
                          <p className="text-sm text-gray-500">{request.email}</p>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => removeFriend(request.id)}
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          >
                            Cancel Request
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-4">
                      No outgoing friend requests.
                    </p>
                  )}
                </div>
              </Tab.Panel>
            </Tab.Panels>
          </Tab.Group>
        </div>
      </div>
    </div>
  );
}