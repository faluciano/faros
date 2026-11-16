import { useMemo, useState } from "react";
import { MapPinIcon } from "@heroicons/react/24/outline";
import { getLighthouseImageCandidates } from "../../../utils/images";

interface LighthouseImageProps {
  image: string;
  name: string;
  className: string;
}

// Shows a right-sized lighthouse photo, stepping through fallbacks on error
// and ending on a local placeholder. The className sets the box size, so the
// layout does not shift while the photo loads.
const LighthouseImage = ({ image, name, className }: LighthouseImageProps) => {
  const candidates = useMemo(() => getLighthouseImageCandidates(image), [image]);
  const [failed, setFailed] = useState({ image, count: 0 });
  const failedCount = failed.image === image ? failed.count : 0;
  const source = candidates[failedCount];

  if (!source) {
    return (
      <div
        role="img"
        aria-label={`No photo of ${name} yet`}
        className={`${className} grid place-items-center bg-faros-mint text-faros-teal`}
      >
        <MapPinIcon className="h-8 w-8" aria-hidden="true" />
      </div>
    );
  }

  return (
    <img
      src={source}
      alt={name}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailed({ image, count: failedCount + 1 })}
      className={`${className} bg-faros-mint object-cover`}
    />
  );
};

export default LighthouseImage;
