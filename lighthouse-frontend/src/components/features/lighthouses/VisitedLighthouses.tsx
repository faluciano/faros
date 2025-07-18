import { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { Lighthouse } from "../../../types";
import LighthouseList from "./LighthouseList";
import { useApi } from "../../../hooks/useApi";
import { getVisitedLighthouses, removeVisitedLighthouse } from "../../../utils/api";
import Error from "../../layout/Error";

const VisitedLighthouses = () => {
  const { isSignedIn } = useAuth();
  const { data, isLoading, error, request: fetchVisited } = useApi<Lighthouse[]>(getVisitedLighthouses);
  const { request: removeVisited } = useApi(removeVisitedLighthouse);
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
    await removeVisited(id);
    setLighthouses(lighthouses.filter(lighthouse => lighthouse.id !== id));
  };

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-4">
            Please sign in to view your visited lighthouses
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
            Loading your visited lighthouses...
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
      onRemove={handleRemoveVisited}
      title="Your Visited Lighthouses"
      emptyMessage="You haven't visited any lighthouses yet. Start exploring the map to mark lighthouses as visited!"
    />
  );
};

export default VisitedLighthouses; 