import { Lighthouse } from "../types";
import { useAuth } from "@clerk/clerk-react";
import { useState } from "react";

interface PopoverProps {
  lighthouse: Lighthouse;
  position: { top: number; left: number };
  onVisitChange: (lighthouseId: string, isVisited: boolean) => void;
  isAuthenticated: boolean;
}

const LighthousePopover = ({ lighthouse, position, onVisitChange, isAuthenticated }: PopoverProps) => {
  const { getToken } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [optimisticIsVisited, setOptimisticIsVisited] = useState(lighthouse.isVisited);

  const handleVisitToggle = async () => {
    if (!isAuthenticated) return;
    
    // Optimistically update the UI
    const newVisitedState = !optimisticIsVisited;
    setOptimisticIsVisited(newVisitedState);
    setIsLoading(true);

    try {
      const token = await getToken();
      let url = "https://faros-backend.azurewebsites.net/user/lighthouses";
      if (process.env.NODE_ENV === "development") {
        url = "http://localhost:8080/user/lighthouses";
      }

      const method = lighthouse.isVisited ? "DELETE" : "POST";
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ lighthouseId: lighthouse.id })
      });

      if (!response.ok) {
        // Revert optimistic update if request fails
        setOptimisticIsVisited(!newVisitedState);
        throw new Error('Failed to update visit status');
      }

      onVisitChange(lighthouse.id, newVisitedState);
    } catch (error) {
      console.error('Error updating visit status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="popover"
      style={{
        position: "absolute",
        top: position.top,
        left: position.left,
        transform: "translate(-50%, -100%)",
        backgroundColor: "white",
        padding: "16px",
        borderRadius: "8px",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        zIndex: 1000,
        minWidth: "200px",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex flex-col gap-3">
        <h3 className="text-xl font-bold">{lighthouse.name}</h3>
        <img
          src={lighthouse.image}
          alt={lighthouse.name}
          className="w-full h-32 object-cover rounded-md"
        />
        <div className="text-sm text-gray-600">
          <p>{lighthouse.state}</p>
          <p>{lighthouse.country}</p>
        </div>
        {isAuthenticated && (
          <button
            onClick={handleVisitToggle}
            disabled={isLoading}
            className={`mt-2 px-4 py-2 rounded-md text-white font-medium transition-colors ${
              optimisticIsVisited
                ? "bg-red-500 hover:bg-red-600"
                : "bg-green-500 hover:bg-green-600"
            } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {isLoading
              ? "Loading..."
              : optimisticIsVisited
              ? "Mark as Unvisited"
              : "Mark as Visited"}
          </button>
        )}
      </div>
    </div>
  );
};

export default LighthousePopover; 