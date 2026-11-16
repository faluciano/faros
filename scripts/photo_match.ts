// Decides whether a Wikimedia Commons file is plausibly a photo of a given
// lighthouse, going only by the file's title. Used to reject photos that
// were merely taken nearby.

// "Lighthouse" and close relatives in the languages the dataset covers.
const LIGHTHOUSE_WORDS = /light|beacon|phare|fanal|faro|farol|leucht|feuer|turm|fyr|t[åa]rn|vuurtoren|baken|majak|маяк|latarnia|far[_ ]|灯台|燈塔|fener|tuletorn|tulepaak|majakka|loisto|bák|vit[ai]|svjetionik|pharos|φάρος|torre|tower/i;

// Words too common in lighthouse names to identify one.
const GENERIC_NAME_WORDS = new Set([
  "light", "lighthouse", "phare", "faro", "point", "island", "head", "north", "south", "east", "west",
  "range", "rear", "front", "harbor", "harbour", "port", "cape", "rock", "upper", "lower",
]);

const normalise = (value: string): string =>
  value.toLowerCase().normalize("NFKD").replace(/[^\p{L}\p{N} ]/gu, " ");

export function titleMatchesLighthouse(fileTitle: string, lighthouseName: string): boolean {
  const title = fileTitle.replace(/_/g, " ");
  if (LIGHTHOUSE_WORDS.test(title)) {
    return true;
  }
  const normalisedTitle = normalise(title);
  return normalise(lighthouseName)
    .split(/\s+/)
    .some((word) => word.length > 3 && !GENERIC_NAME_WORDS.has(word) && normalisedTitle.includes(word));
}

// Stricter test for choosing a new photo: the title itself has to say
// "lighthouse" (or name the kind of light), in one of the dataset's languages.
// A bare "light" is not enough, since it also turns up in "daylight" or
// "lightning".
const SAYS_LIGHTHOUSE = /light ?house|light ?station|\blight\b|\bbeacon\b|phare|\bfaro\b|farol|leuchtturm|leuchtfeuer|leuchtbake|\bfyr\b|fyrt[åa]rn|fyren|vuurtoren|lichtopstand|маяк|majak|latarnia|灯台|燈塔|등대|deniz feneri|\bfeneri\b|tuletorn|tulepaak|majakka|\bloisto\b|svjetionik|svetilnik|φάρος|\bfar de\b|\bbák[aā]\b|\bviti\b/i;

// "View from the lighthouse" is a photo taken at it, not of it.
const VIEW_FROM = /\b(view|views|looking|vue|blick|aussicht|vista|utsikt|udsigt|uitzicht|widok|вид)\b.{0,40}\b(from|depuis|du|de la|vom|von|desde|dal|dalla|fra|från|vanaf|z|с|со)\b/i;

export function titleSaysLighthouse(fileTitle: string): boolean {
  const title = fileTitle.replace(/_/g, " ");
  return SAYS_LIGHTHOUSE.test(title) && !VIEW_FROM.test(title);
}
