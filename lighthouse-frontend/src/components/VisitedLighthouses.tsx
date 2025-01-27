import { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { Lighthouse } from "../types";

const VisitedLighthouses = () => {
  const [visitedLighthouses, setVisitedLighthouses] = useState<Lighthouse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { getToken, isSignedIn } = useAuth();

  useEffect(() => {
    const fetchVisitedLighthouses = async () => {
      setIsLoading(true);
      try {
        const token = await getToken();
        if (!token) return;

        let baseUrl = "https://faros-backend.azurewebsites.net";
        if (process.env.NODE_ENV === "development") {
          baseUrl = "http://localhost:8080";
        }

        const response = await fetch(`${baseUrl}/user/lighthouses`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch visited lighthouses');
        }

        const data = await response.json();
        setVisitedLighthouses(data);
      } catch (error) {
        console.error('Error fetching visited lighthouses:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isSignedIn) {
      fetchVisitedLighthouses();
    }
  }, [isSignedIn, getToken]);

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

    const handleRemoveVisited = async (id: string) => {
        try {
            const token = await getToken();
            if (!token) return;

            let baseUrl = "https://faros-backend.azurewebsites.net";
            if (process.env.NODE_ENV === "development") {
                baseUrl = "http://localhost:8080";
            }

            const response = await fetch(`${baseUrl}/user/lighthouses`, {
                method: "DELETE",
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ lighthouseId: id })
            });

            if (!response.ok) {
                throw new Error('Failed to remove lighthouse from visited');
            }

            setVisitedLighthouses(visitedLighthouses.filter(lighthouse => lighthouse.id !== id));
        } catch (error) {
            console.error('Error removing lighthouse:', error);
        }
    }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">
          Your Visited Lighthouses ({visitedLighthouses.length})
        </h1>
        
        {visitedLighthouses.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-gray-600 text-center">
              You haven't visited any lighthouses yet. Start exploring the map to mark lighthouses as visited!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visitedLighthouses.map((lighthouse) => (
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
                  <div className="text-gray-600">
                    <p>{lighthouse.state}</p>
                    <p>{lighthouse.country}</p>
                  </div>
                  <button
                    onClick={() => handleRemoveVisited(lighthouse.id)}
                    className="mt-3 w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded transition-colors"
                  >
                    Remove from Visited
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VisitedLighthouses; 