// Wikimedia only serves thumbnails at fixed widths; 500px covers the 300px
// popup and the list cards on high-density screens at a fraction of the
// original file size.
const THUMBNAIL_WIDTH = 500;
const THUMBNAIL_EXTENSIONS = /\.(jpe?g|png|gif|webp)$/i;
const ORIGINAL_UPLOAD_PATH = /^\/wikipedia\/commons\/([0-9a-f])\/(\1[0-9a-f])\/([^/]+)$/;

// Returns the URLs to try in order for a stored lighthouse image: a right-sized
// thumbnail first where one can be derived, then the stored URL. An empty list
// means there is no real photo and the caller should draw its placeholder.
export const getLighthouseImageCandidates = (image: string): string[] => {
  if (!image) {
    return [];
  }

  let url: URL;
  try {
    url = new URL(image);
  } catch {
    return [];
  }
  if (url.protocol !== "https:") {
    return [];
  }
  // Seed data points unphotographed lighthouses at a third-party placeholder
  // service; draw the placeholder locally instead of calling it.
  if (url.hostname === "via.placeholder.com") {
    return [];
  }

  if (url.hostname === "commons.wikimedia.org" && url.pathname.includes("/Special:FilePath/")) {
    const thumbnail = new URL(url);
    thumbnail.searchParams.set("width", String(THUMBNAIL_WIDTH));
    return [thumbnail.toString(), image];
  }

  if (url.hostname === "upload.wikimedia.org") {
    const match = ORIGINAL_UPLOAD_PATH.exec(url.pathname);
    if (match && THUMBNAIL_EXTENSIONS.test(match[3])) {
      const [, first, second, file] = match;
      // Originals narrower than the thumbnail width have no such thumbnail,
      // so the stored URL stays as the fallback.
      return [
        `https://upload.wikimedia.org/wikipedia/commons/thumb/${first}/${second}/${file}/${THUMBNAIL_WIDTH}px-${file}`,
        image,
      ];
    }
  }

  return [image];
};

// Only link out to http(s) pages; stored attribution URLs come from imported data.
export const getSafeExternalUrl = (value: string): string | null => {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
};
