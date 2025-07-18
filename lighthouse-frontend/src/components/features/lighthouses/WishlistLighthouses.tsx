import { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { Lighthouse } from "../../../types";
import LighthouseList from "./LighthouseList";
import { useApi } from "../../../hooks/useApi";
import { useMutation } from "../../../hooks/useMutation";
import { getWishlist, removeFromWishlist } from "../../../utils/api";
import Error from "../../layout/Error";

const WishlistLighthouses = () => {
  const { isSignedIn } = useAuth();
  const { data, isLoading, error, request: fetchWishlist } = useApi<Lighthouse[]>(getWishlist);
  const { mutate: removeWishlist } = useMutation(removeFromWishlist);
  const [lighthouses, setLighthouses] = useState<Lighthouse[]>([]);

  useEffect(() => {
    if (isSignedIn) {
      fetchWishlist();
    }
  }, [isSignedIn, fetchWishlist]);

  useEffect(() => {
    if (data) {
      setLighthouses(data);
    }
  }, [data]);

  const handleRemoveFromWishlist = async (id: string) => {
    await removeWishlist(id);
    setLighthouses(lighthouses.filter(lighthouse => lighthouse.id !== id));
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

  if (error) {
    return <Error message={error.message} />;
  }

  return (
    <LighthouseList
      lighthouses={lighthouses || []}
      onRemove={handleRemoveFromWishlist}
      title="Your Wishlist"
      emptyMessage="Your wishlist is empty. Start exploring the map to add lighthouses to your wishlist!"
    />
  );
};

export default WishlistLighthouses; 