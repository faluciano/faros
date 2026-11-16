import type { Lighthouse } from "../../../types";
import { getLighthouseImageCandidates, getSafeExternalUrl } from "../../../utils/images";

// The author, licence and source link for a lighthouse's photo. Most photos
// are Creative Commons licensed, which requires showing all three wherever
// the photo appears. Renders nothing when there is no photo to credit.
const PhotoCredit = ({ lighthouse }: { lighthouse: Lighthouse }) => {
  const hasPhoto = getLighthouseImageCandidates(lighthouse.image).length > 0;
  const credit = [lighthouse.image_author, lighthouse.image_license].filter(Boolean).join(", ");
  const pageUrl = getSafeExternalUrl(lighthouse.image_url);
  if (!hasPhoto || (!credit && !pageUrl)) {
    return null;
  }

  return (
    <p className="break-words">
      Photo{credit ? `: ${credit}` : ""}
      {pageUrl ? (
        <>
          {" · "}
          <a href={pageUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-faros-teal underline">
            source
          </a>
        </>
      ) : null}
    </p>
  );
};

export default PhotoCredit;
