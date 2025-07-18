import { Lighthouse } from "../../../types";
import { useState } from "react";
import { useMutation } from "../../../hooks/useMutation";
import { addVisitedLighthouse, removeVisitedLighthouse, addToWishlist, removeFromWishlist } from "../../../utils/api";

interface PopoverProps {
  lighthouse: Lighthouse;
  position: { top: number; left: number };
  onVisitChange: (lighthouseId: string, isVisited: boolean) => void;
  onWishlistChange?: (lighthouseId: string, isInWishlist: boolean) => void;
  isAuthenticated: boolean;
  isInWishlist?: boolean;
}

const LighthousePopover = ({
  lighthouse,
  position,
  onVisitChange,
  onWishlistChange,
  isAuthenticated,
  isInWishlist: initialIsInWishlist = false
}: PopoverProps) => {
  const [optimisticIsVisited, setOptimisticIsVisited] = useState(lighthouse.isVisited);
  const [isInWishlist, setIsInWishlist] = useState(initialIsInWishlist);

  const { isLoading: isVisiting, mutate: addVisited } = useMutation(addVisitedLighthouse);
  const { isLoading: isUnvisiting, mutate: removeVisited } = useMutation(removeVisitedLighthouse);
  const { isLoading: isAddingToWishlist, mutate: addWishlist } = useMutation(addToWishlist);
  const { isLoading: isRemovingFromWishlist, mutate: removeWishlist } = useMutation(removeFromWishlist);

  const handleVisitToggle = async () => {
    if (!isAuthenticated) return;
    
    const newVisitedState = !optimisticIsVisited;
    setOptimisticIsVisited(newVisitedState);

    try {
      if (newVisitedState) {
        await addVisited(lighthouse.id);
      } else {
        await removeVisited(lighthouse.id);
      }
      onVisitChange(lighthouse.id, newVisitedState);
    } catch (error) {
      setOptimisticIsVisited(!newVisitedState);
      console.error('Error updating visit status:', error);
    }
  };

  const handleWishlistToggle = async () => {
    if (!isAuthenticated) return;
    
    const newWishlistState = !isInWishlist;
    setIsInWishlist(newWishlistState);
    onWishlistChange?.(lighthouse.id, newWishlistState);

    try {
      if (newWishlistState) {
        await addWishlist(lighthouse.id);
      } else {
        await removeWishlist(lighthouse.id);
      }
    } catch (error) {
      setIsInWishlist(!newWishlistState);
      onWishlistChange?.(lighthouse.id, !newWishlistState);
      console.error('Error updating wishlist status:', error);
    }
  };

  const isLoading = isVisiting || isUnvisiting;
  const isWishlistLoading = isAddingToWishlist || isRemovingFromWishlist;

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
        <h3 className="text-xl text-gray-900 font-bold">{lighthouse.name}</h3>
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
          <div className="flex flex-col gap-2">
            <button
              onClick={handleVisitToggle}
              disabled={isLoading}
              className={`px-4 py-2 rounded-md text-white font-medium transition-colors
                ${optimisticIsVisited
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-green-500 hover:bg-green-600"}
                ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {isLoading ? "Loading..." : optimisticIsVisited ? "Remove from Visited" : "Mark as Visited"}
            </button>
            {!optimisticIsVisited && (
              <button
                onClick={handleWishlistToggle}
                disabled={isWishlistLoading}
                className={`px-4 py-2 rounded-md text-white font-medium transition-colors ${
                  isInWishlist
                    ? "bg-red-500 hover:bg-red-600"
                    : "bg-blue-500 hover:bg-blue-600"
                } ${isWishlistLoading ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {isWishlistLoading
                  ? "Loading..."
                  : isInWishlist
                  ? "Remove from Wishlist"
                  : "Add to Wishlist"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LighthousePopover; 