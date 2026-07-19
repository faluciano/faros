import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { Tab } from '@headlessui/react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { User } from '../../../types';
import { getBaseUrl } from '../../../utils/api';
import PageState from '../../layout/PageState';

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

  const fetchFriends = useCallback(async () => {
    if (!isSignedIn) return;
    
    try {
      const token = getToken();
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
  }, [isSignedIn, getToken]);

  const fetchPendingRequests = useCallback(async () => {
    if (!isSignedIn) return;
    
    try {
      const token = getToken();
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
  }, [isSignedIn, getToken]);

  const fetchOutgoingRequests = useCallback(async () => {
    if (!isSignedIn) return;
    
    try {
      const token = getToken();
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
  }, [isSignedIn, getToken]);

  const searchUsers = useCallback(async (query: string) => {
    if (!query.trim() || query.trim().length < 2 || !isSignedIn) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    setError(null);
    
    try {
      const token = getToken();
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
  }, [isSignedIn, getToken, friends, pendingRequests, outgoingRequests]);

  const sendFriendRequest = async (friendId: string) => {
    if (!isSignedIn) return;
    
    try {
      const token = getToken();
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
      const token = getToken();
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
      const token = getToken();
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
    return <PageState title="Sign in to view your friends" />;
  }

  if (isLoading) {
    return <PageState title="Loading your community..." />;
  }

  return (
    <main className="app-page">
      <div className="app-shell">
        <section className="app-card p-6 sm:p-8">
          <div className="mb-7">
            <p className="app-eyebrow">Community</p>
            <h1 className="app-heading mt-2">Friends and requests</h1>
            <p className="app-copy mt-2">
              Find other lighthouse explorers and share the places you have visited.
            </p>
          </div>

          {error && (
            <div className="app-alert-error mb-5">
              {error}
            </div>
          )}

          <div className="app-panel mb-7 p-5">
            <label htmlFor="friend-search" className="app-label">
              Find people
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                <MagnifyingGlassIcon className="h-5 w-5 text-faros-muted" aria-hidden="true" />
              </div>
              <input
                id="friend-search"
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
                className="app-input pl-10"
              />
            </div>

            {searchQuery.trim() && (
              <div className="mt-5">
                <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-faros-muted">
                  Search results
                </h2>
                <div className="mt-3 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {isSearching ? (
                    <p className="app-copy col-span-full text-center">Searching...</p>
                  ) : searchResults && searchResults.length > 0 ? (
                    searchResults.map((user) => (
                      <article
                        key={user.id}
                        className="rounded-xl border border-faros-line bg-white p-4"
                      >
                        <h3 className="font-bold text-faros-navy">
                          {user.first_name} {user.last_name}
                        </h3>
                        <p className="mt-1 text-sm text-faros-muted">{user.email}</p>
                        <button
                          type="button"
                          onClick={() => sendFriendRequest(user.id)}
                          className="app-button-primary mt-4 w-full !py-2.5"
                        >
                          Send request
                        </button>
                      </article>
                    ))
                  ) : (
                    <p className="app-copy col-span-full text-center">
                      {searchQuery.trim() ? 'No users found' : 'Type to search for users'}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          <Tab.Group>
            <Tab.List className="app-segmented grid gap-1 sm:grid-cols-3">
              <Tab
                className={({ selected }) =>
                  classNames(
                    'app-segment w-full focus:outline-none focus:ring-2 focus:ring-faros-teal focus:ring-offset-2',
                    selected ? 'app-segment-active' : ''
                  )
                }
              >
                Friends ({friends?.length || 0})
              </Tab>
              <Tab
                className={({ selected }) =>
                  classNames(
                    'app-segment w-full focus:outline-none focus:ring-2 focus:ring-faros-teal focus:ring-offset-2',
                    selected ? 'app-segment-active' : ''
                  )
                }
              >
                Pending Requests ({pendingRequests?.length || 0})
              </Tab>
              <Tab
                className={({ selected }) =>
                  classNames(
                    'app-segment w-full focus:outline-none focus:ring-2 focus:ring-faros-teal focus:ring-offset-2',
                    selected ? 'app-segment-active' : ''
                  )
                }
              >
                Outgoing Requests ({outgoingRequests?.length || 0})
              </Tab>
            </Tab.List>
            <Tab.Panels className="mt-6">
              <Tab.Panel>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {friends && friends.length > 0 ? (
                    friends.map((friend) => (
                      <article
                        key={friend.id}
                        className="app-panel bg-white p-5"
                      >
                        <h3 className="text-lg font-bold text-faros-navy">
                          {friend.first_name} {friend.last_name}
                        </h3>
                        <p className="mt-1 text-sm text-faros-muted">{friend.email}</p>
                        <button
                          type="button"
                          onClick={() => removeFriend(friend.id)}
                          className="app-button-danger mt-4 w-full !py-2.5"
                        >
                          Remove friend
                        </button>
                      </article>
                    ))
                  ) : (
                    <p className="app-copy col-span-full py-8 text-center">
                      You don&apos;t have any friends yet.
                    </p>
                  )}
                </div>
              </Tab.Panel>
              <Tab.Panel>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {pendingRequests && pendingRequests.length > 0 ? (
                    pendingRequests.map((request) => (
                      <article
                        key={request.id}
                        className="app-panel bg-white p-5"
                      >
                        <h3 className="text-lg font-bold text-faros-navy">
                          {request.first_name} {request.last_name}
                        </h3>
                        <p className="mt-1 text-sm text-faros-muted">{request.email}</p>
                        <div className="mt-4 flex gap-2">
                          <button
                            type="button"
                            onClick={() => acceptFriendRequest(request.id)}
                            className="app-button-primary flex-1 !py-2.5"
                          >
                            Accept
                          </button>
                          <button
                            type="button"
                            onClick={() => removeFriend(request.id)}
                            className="app-button-danger flex-1 !py-2.5"
                          >
                            Decline
                          </button>
                        </div>
                      </article>
                    ))
                  ) : (
                    <p className="app-copy col-span-full py-8 text-center">
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
                        className="app-panel flex flex-col gap-4 bg-white p-5 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <h3 className="text-lg font-bold text-faros-navy">
                            {request.first_name} {request.last_name}
                          </h3>
                          <p className="mt-1 text-sm text-faros-muted">{request.email}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFriend(request.id)}
                          className="app-button-danger !py-2.5"
                        >
                          Cancel request
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="app-copy py-8 text-center">
                      No outgoing friend requests.
                    </p>
                  )}
                </div>
              </Tab.Panel>
            </Tab.Panels>
          </Tab.Group>
        </section>
      </div>
    </main>
  );
}