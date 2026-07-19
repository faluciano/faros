import { useEffect, useState } from "react";
import { useAuth } from "../../../hooks/useAuth";
import { Lighthouse } from "../../../types";
import LighthouseList from "./LighthouseList";
import { useApi } from "../../../hooks/useApi";
import { useMutation } from "../../../hooks/useMutation";
import { getVisitedLighthouses, removeVisitedLighthouse } from "../../../utils/api";
import Error from "../../layout/Error";
import PageState from "../../layout/PageState";

const VisitedLighthouses = () => {
  const { isSignedIn } = useAuth();
  const { data, isLoading, error, request: fetchVisited } = useApi<Lighthouse[]>(getVisitedLighthouses);
  const { mutate: removeVisited } = useMutation(removeVisitedLighthouse);
  const [lighthouses, setLighthouses] = useState<Lighthouse[]>([]);

  useEffect(() => {
    if (isSignedIn) {
      fetchVisited();
    }
  }, [isSignedIn, fetchVisited]);

  useEffect(() => {
    if (data) {
      setLighthouses(data);
    }
  }, [data]);

  const handleRemoveVisited = async (id: string) => {
    try {
      await removeVisited(id);
      setLighthouses((current) => current.filter((lighthouse) => lighthouse.id !== id));
    } catch (removeError) {
      console.error("Failed to remove visited lighthouse:", removeError);
    }
  };

  if (!isSignedIn) {
    return <PageState title="Sign in to view your lighthouse log" />;
  }

  if (isLoading) {
    return <PageState title="Loading your lighthouse log..." />;
  }

  if (error) {
    return <Error message={error.message} />;
  }

  return (
    <LighthouseList
      lighthouses={lighthouses || []}
      onRemove={handleRemoveVisited}
      title="Your Visited Lighthouses"
      emptyMessage="You haven't visited any lighthouses yet. Start exploring the map to mark lighthouses as visited!"
    />
  );
};

export default VisitedLighthouses; 