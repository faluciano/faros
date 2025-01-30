import { Lighthouse } from "../../../types";
import { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";

const LighthouseCard = ({ lighthouse }: { lighthouse: Lighthouse }) => {
    const [isVisited, setIsVisited] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { getToken } = useAuth();

    const handleVisit = async () => {
        setIsLoading(true);
        try {
            const token = await getToken();
            if (!token) return;

            let baseUrl = "https://faros-backend.azurewebsites.net";
            if (process.env.NODE_ENV === "development") {
                baseUrl = "http://localhost:8080";
            }

            const response = await fetch(`${baseUrl}/user/lighthouses`, {
                method: "POST",
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ lighthouseId: lighthouse.id })
            });

            if (!response.ok) {
                throw new Error('Failed to mark lighthouse as visited');
            }

            setIsVisited(true);
        } catch (error) {
            console.error('Error marking lighthouse as visited:', error);
            setIsVisited(false);
        } finally {
            setIsLoading(false);
        }
    }

    const handleUnvisit = async () => {
        setIsLoading(true);
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
                body: JSON.stringify({ lighthouseId: lighthouse.id })
            });

            if (!response.ok) {
                throw new Error('Failed to unmark lighthouse as visited');
            }

            setIsVisited(false);
        } catch (error) {
            console.error('Error unmarking lighthouse as visited:', error);
            setIsVisited(true);
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        const fetchVisitedLighthouses = async () => {
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
                setIsVisited(data.some((l: Lighthouse) => l.id === lighthouse.id));
            } catch (error) {
                console.error('Error fetching visited lighthouses:', error);
            }
        };

        fetchVisitedLighthouses();
    }, [lighthouse.id, getToken]);

    return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div 
                className="h-48 bg-cover bg-center" 
                style={{ backgroundImage: `url(${lighthouse.image})` }}
            />
            <div className="p-4">
                <h2 className="text-xl font-semibold text-gray-900">{lighthouse.name}</h2>
                <p className="text-gray-600">{lighthouse.state}, {lighthouse.country}</p>
                <div className="mt-4">
                    <button
                        onClick={isVisited ? handleUnvisit : handleVisit}
                        disabled={isLoading}
                        className={`w-full py-2 px-4 rounded-md text-white font-medium transition-colors ${
                            isVisited 
                                ? 'bg-red-500 hover:bg-red-600' 
                                : 'bg-green-500 hover:bg-green-600'
                        } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {isLoading 
                            ? "Loading..." 
                            : isVisited 
                                ? "Remove from Visited" 
                                : "Mark as Visited"
                        }
                    </button>
                </div>
            </div>
        </div>
    );
}

export default LighthouseCard;