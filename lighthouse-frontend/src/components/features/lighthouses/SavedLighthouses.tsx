import { useEffect, useState } from "react";
import { useAuth } from "../../../hooks/useAuth";
import { Lighthouse } from "../../../types";
import LighthouseList from "./LighthouseList";
import { useApi } from "../../../hooks/useApi";
import { useMutation } from "../../../hooks/useMutation";
import {
  getVisitedLighthouses,
  getWishlist,
  removeFromWishlist,
  removeVisitedLighthouse,
} from "../../../utils/api";
import Error from "../../layout/Error";
import PageState from "../../layout/PageState";

const COLLECTIONS = {
  visited: {
    load: getVisitedLighthouses,
    remove: removeVisitedLighthouse,
    title: "Your Visited Lighthouses",
    signedOutTitle: "Sign in to view your lighthouse log",
    loadingTitle: "Loading your lighthouse log...",
    emptyMessage: "You haven't visited any lighthouses yet. Start exploring the map to mark lighthouses as visited!",
  },
  wishlist: {
    load: getWishlist,
    remove: removeFromWishlist,
    title: "Your Wishlist",
    signedOutTitle: "Sign in to view your wishlist",
    loadingTitle: "Loading your wishlist...",
    emptyMessage: "Your wishlist is empty. Start exploring the map to add lighthouses to your wishlist!",
  },
} as const;

// The visited log and the wishlist are the same page over different endpoints.
const SavedLighthouses = ({ collection }: { collection: keyof typeof COLLECTIONS }) => {
  const config = COLLECTIONS[collection];
  const { isSignedIn } = useAuth();
  const { data, isLoading, error, request: load } = useApi<Lighthouse[]>(config.load);
  const { mutate: remove } = useMutation(config.remove);
  const [lighthouses, setLighthouses] = useState<Lighthouse[]>([]);

  useEffect(() => {
    if (isSignedIn) {
      load();
    }
  }, [isSignedIn, load]);

  useEffect(() => {
    if (data) {
      setLighthouses(data);
    }
  }, [data]);

  const handleRemove = async (id: string) => {
    try {
      await remove(id);
      setLighthouses((current) => current.filter((lighthouse) => lighthouse.id !== id));
    } catch (removeError) {
      console.error(`Failed to remove ${collection} lighthouse:`, removeError);
    }
  };

  if (!isSignedIn) {
    return <PageState title={config.signedOutTitle} />;
  }
  if (isLoading) {
    return <PageState title={config.loadingTitle} />;
  }
  if (error) {
    return <Error message={error.message} />;
  }

  return (
    <LighthouseList
      lighthouses={lighthouses}
      onRemove={handleRemove}
      title={config.title}
      emptyMessage={config.emptyMessage}
    />
  );
};

export default SavedLighthouses;
