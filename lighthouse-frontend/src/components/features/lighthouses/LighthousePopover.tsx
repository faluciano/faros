import { Lighthouse } from "../../../types";
import { useState } from "react";
import { useMutation } from "../../../hooks/useMutation";
import { addVisitedLighthouse, removeVisitedLighthouse, addToWishlist, removeFromWishlist } from "../../../utils/api";

interface PopoverContentProps {
  lighthouse: Lighthouse;
  onVisitChange: (lighthouseId: string, isVisited: boolean) => void;
  onWishlistChange?: (lighthouseId: string, isInWishlist: boolean) => void;
  isAuthenticated: boolean;
  isInWishlist?: boolean;
}

const LighthousePopoverContent = ({
  lighthouse,
  onVisitChange,
  onWishlistChange,
  isAuthenticated,
  isInWishlist: initialIsInWishlist = false
}: PopoverContentProps) => {
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
    <div className="flex flex-col gap-3">
      <h3 className="font-display text-2xl font-semibold text-faros-navy">{lighthouse.name}</h3>
      <img
        src={lighthouse.image}
        alt={lighthouse.name}
        className="h-32 w-full rounded-xl object-cover"
      />
      <div className="text-sm text-faros-muted">
        <p>{lighthouse.state}, {lighthouse.country}</p>
        <div className="mt-2 grid grid-cols-2 gap-x-4 border-t border-faros-line pt-2">
            {lighthouse.height > 0 && <p><span className="font-semibold text-faros-ink">Height:</span> {lighthouse.height}m</p>}
            {lighthouse.year_built > 0 && <p><span className="font-semibold text-faros-ink">Built:</span> {lighthouse.year_built}</p>}
        </div>
        {lighthouse.light_characteristics && (
            <p className="mt-1">
                <span className="font-semibold text-faros-ink">Light:</span> {lighthouse.light_characteristics}
            </p>
        )}
        {lighthouse.description && (
            <p className="mt-2 italic text-faros-ink">
                {lighthouse.description}
            </p>
        )}
        
        <div className="mt-3 border-t border-faros-line pt-2 text-xs text-faros-muted/80">
            <p>Data Source: {lighthouse.source}</p>
            {lighthouse.image_author && (
                <p>
                    Image © {lighthouse.image_author}
                    {lighthouse.image_license ? ` (${lighthouse.image_license})` : ''}
                    {lighthouse.image_url && (
                        <a href={lighthouse.image_url} target="_blank" rel="noopener noreferrer" className="ml-1 font-semibold text-faros-teal underline">
                            [Original]
                        </a>
                    )}
                </p>
            )}
        </div>
      </div>
      {isAuthenticated && (
        <div className="flex flex-col gap-2">
          <button
            onClick={handleVisitToggle}
            disabled={isLoading}
            className={`app-button w-full
              ${optimisticIsVisited
                ? "bg-faros-coral text-white hover:bg-red-700 focus:ring-faros-coral"
                : "bg-faros-teal text-white hover:bg-faros-teal-dark focus:ring-faros-teal"}
              ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {isLoading ? "Loading..." : optimisticIsVisited ? "Remove from Visited" : "Mark as Visited"}
          </button>
          {!optimisticIsVisited && (
            <button
              onClick={handleWishlistToggle}
              disabled={isWishlistLoading}
              className={`app-button w-full ${
                isInWishlist
                  ? "bg-faros-coral text-white hover:bg-red-700 focus:ring-faros-coral"
                  : "bg-faros-amber text-faros-navy hover:bg-amber-300 focus:ring-faros-amber"
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
  );
};

export default LighthousePopoverContent;
