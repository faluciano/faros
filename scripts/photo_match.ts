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
