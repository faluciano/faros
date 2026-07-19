import { useEffect, useState } from "react";
import { useAuth } from "../../../hooks/useAuth";
import { Lighthouse } from "../../../types";
import LighthouseList from "./LighthouseList";
import { useApi } from "../../../hooks/useApi";
import { useMutation } from "../../../hooks/useMutation";
import { getWishlist, removeFromWishlist } from "../../../utils/api";
import Error from "../../layout/Error";
import PageState from "../../layout/PageState";

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
    try {
      await removeWishlist(id);
      setLighthouses((current) => current.filter((lighthouse) => lighthouse.id !== id));
    } catch (removeError) {
      console.error("Failed to remove wishlist lighthouse:", removeError);
    }
  };

  if (!isSignedIn) {
    return <PageState title="Sign in to view your wishlist" />;
  }

  if (isLoading) {
    return <PageState title="Loading your wishlist..." />;
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