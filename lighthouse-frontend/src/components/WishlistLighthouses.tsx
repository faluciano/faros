import { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { Lighthouse } from "../types";

const WishlistLighthouses = () => {
  const [wishlistLighthouses, setWishlistLighthouses] = useState<Lighthouse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { getToken, isSignedIn } = useAuth();

  useEffect(() => {
    const fetchWishlistLighthouses = async () => {
      setIsLoading(true);
      try {
        const token = await getToken();
        if (!token) return;

        let baseUrl = "https://faros-backend.azurewebsites.net";
        if (process.env.NODE_ENV === "development") {
          baseUrl = "http://localhost:8080";
        }

        const response = await fetch(`${baseUrl}/user/wishlist`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch wishlist lighthouses');
        }

        const data = await response.json();
        setWishlistLighthouses(data);
      } catch (error) {
        console.error('Error fetching wishlist lighthouses:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isSignedIn) {
      fetchWishlistLighthouses();
    }
  }, [isSignedIn, getToken]);

  const handleRemoveFromWishlist = async (lighthouseId: string) => {
    try {
      const token = await getToken();
      if (!token) return;

      let baseUrl = "https://faros-backend.azurewebsites.net";
      if (process.env.NODE_ENV === "development") {
        baseUrl = "http://localhost:8080";
      }

      const response = await fetch(`${baseUrl}/user/wishlist`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ lighthouseId })
      });

      if (!response.ok) {
        throw new Error('Failed to remove from wishlist');
      }

      setWishlistLighthouses(wishlistLighthouses.filter(l => l.id !== lighthouseId));
    } catch (error) {
      console.error('Error removing from wishlist:', error);
    }
  };

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-4">
            Please sign in to view your wishlist
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
            Loading your wishlist...
          </h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">
          Your Wishlist
        </h1>
        
        {(!wishlistLighthouses || wishlistLighthouses.length === 0) ? (
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-gray-600 text-center">
              Your wishlist is empty. Start exploring the map to add lighthouses to your wishlist!
            </p>
          </div>
        ) : (
          <>
            <p className="text-gray-600 text-center">
              {wishlistLighthouses.length} {wishlistLighthouses.length === 1 ? 'lighthouse' : 'lighthouses'} in your wishlist
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {wishlistLighthouses.map((lighthouse) => (
                <div
                    key={lighthouse.id}
                    className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                >
                    <img
                    src={lighthouse.image}
                    alt={lighthouse.name}
                    className="w-full h-48 object-cover"
                    />
                        <div className="p-4">
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">
                            {lighthouse.name}
                        </h3>
                        <div className="text-gray-600 mb-4">
                            <p>{lighthouse.state}</p>
                            <p>{lighthouse.country}</p>
                        </div>
                            <button
                                onClick={() => handleRemoveFromWishlist(lighthouse.id)}
                                className="w-full bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded transition-colors"
                            >
                                Remove from Wishlist
                            </button>
                        </div>
                    </div>
                    ))}
                </div>
          </>
        )}
      </div>
    </div>
  );
};

export default WishlistLighthouses; 