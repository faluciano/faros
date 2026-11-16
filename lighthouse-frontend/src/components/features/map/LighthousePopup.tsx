import { Popup } from "react-map-gl/maplibre";
import type { LighthouseSelection } from "../../../hooks/useLighthouseSelection";
import LighthousePopoverContent from "../lighthouses/LighthousePopover";

interface LighthousePopupProps {
  selection: LighthouseSelection;
  onClose: () => void;
  isAuthenticated: boolean;
  isVisited?: boolean;
  isInWishlist?: boolean;
  onVisitChange?: (lighthouseId: string, isVisited: boolean) => void;
  onWishlistChange?: (lighthouseId: string, isInWishlist: boolean) => void;
}

// Opens as soon as a marker is selected and shows a placeholder until the
// lighthouse details arrive.
const LighthousePopup = ({
  selection,
  onClose,
  isAuthenticated,
  isVisited = false,
  isInWishlist = false,
  onVisitChange,
  onWishlistChange,
}: LighthousePopupProps) => (
  <Popup
    longitude={selection.longitude}
    latitude={selection.latitude}
    anchor="bottom"
    onClose={onClose}
    closeButton
    closeOnClick={false}
    maxWidth="300px"
  >
    {selection.details ? (
      <LighthousePopoverContent
        key={selection.id}
        lighthouse={{ ...selection.details, isVisited }}
        onVisitChange={onVisitChange}
        onWishlistChange={onWishlistChange}
        isAuthenticated={isAuthenticated}
        isInWishlist={isInWishlist}
      />
    ) : selection.hasError ? (
      <p className="w-[260px] py-2 text-sm text-faros-muted">
        Couldn&apos;t load this lighthouse. Close this and try again.
      </p>
    ) : (
      <div className="flex w-[260px] animate-pulse flex-col gap-3" role="status" aria-label="Loading lighthouse details">
        <div className="h-7 w-2/3 rounded bg-faros-line" />
        <div className="h-32 w-full rounded-xl bg-faros-mint" />
        <div className="h-4 w-1/2 rounded bg-faros-line" />
      </div>
    )}
  </Popup>
);

export default LighthousePopup;
