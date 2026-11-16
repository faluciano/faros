// Repairs photo data that is already in the dataset, without searching for
// new photos. Run from the repo root between load_work_db.ts and export_static.ts:
//
//   bun run scripts/repair_images.ts
//
// 1. "File:Name.jpg" references become Wikimedia Commons image URLs.
// 2. "Category:Name" references become the first photo in that Commons category.
// 3. Images that are not a photo of the lighthouse go back to "no photo":
//    documents, maps and icons, and photos an earlier automatic search picked
//    only because they were taken nearby.
// 4. Every Commons photo gets its author, licence and source page filled in,
//    which the licences require us to show. Photos that no longer exist on
//    Commons also go back to "no photo".

import { client } from "./client";
import { titleMatchesLighthouse } from "./photo_match";

const API = "https://commons.wikimedia.org/w/api.php";
const USER_AGENT = "FarosLighthouseBot/1.0 (https://github.com/faluciano/faros)";
const TITLES_PER_REQUEST = 50;
const PAUSE_MS = 250;
const PHOTO_EXTENSIONS = /\.(jpe?g|png|webp|tiff?)$/i;

const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const filePathUrl = (fileName: string) =>
  `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(fileName)}?width=800`;
const placeholderUrl = (name: string) =>
  `https://via.placeholder.com/800x600?text=${encodeURIComponent(name)}&checked=true`;
// Commons treats underscores and spaces alike and capitalises the first letter.
const canonical = (fileName: string) => {
  const spaced = fileName.replace(/_/g, " ").trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
};
const stripHtml = (value: string) => value.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();

async function api(params: Record<string, string>): Promise<any> {
  const url = `${API}?${new URLSearchParams({ format: "json", formatversion: "2", ...params })}`;
  for (let attempt = 1; ; attempt += 1) {
    const response = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
    if (response.ok) {
      return response.json();
    }
    if (attempt === 4) {
      throw new Error(`Commons API returned ${response.status}`);
    }
    await pause(2000 * attempt);
  }
}

// The Commons file name a stored image URL points at, or null if it is not a
// Commons image.
function commonsFileName(image: string): string | null {
  let url: URL;
  try {
    url = new URL(image);
  } catch {
    return null;
  }
  if (url.hostname === "commons.wikimedia.org") {
    const match = /\/(?:Special:FilePath\/|wiki\/File:)(.+)$/.exec(url.pathname);
    return match ? decodeURIComponent(match[1]) : null;
  }
  if (url.hostname === "upload.wikimedia.org") {
    const thumb = /^\/wikipedia\/commons\/thumb\/[0-9a-f]\/[0-9a-f]{2}\/([^/]+)\//.exec(url.pathname);
    const original = /^\/wikipedia\/commons\/[0-9a-f]\/[0-9a-f]{2}\/([^/]+)$/.exec(url.pathname);
    const name = thumb?.[1] ?? original?.[1];
    return name ? decodeURIComponent(name) : null;
  }
  return null;
}

async function firstPhotoInCategory(category: string): Promise<string | null> {
  const data = await api({
    action: "query",
    list: "categorymembers",
    cmtitle: category,
    cmtype: "file",
    cmlimit: "20",
  });
  const files: Array<{ title: string }> = data.query?.categorymembers ?? [];
  const photo = files.find((file) => PHOTO_EXTENSIONS.test(file.title));
  return photo ? photo.title.replace(/^File:/, "") : null;
}

interface Credit {
  author: string;
  license: string;
  pageUrl: string;
}

// Looks up credits for many files at once. Files missing from the result do
// not exist on Commons.
async function fetchCredits(fileNames: string[]): Promise<Map<string, Credit>> {
  const credits = new Map<string, Credit>();
  for (let start = 0; start < fileNames.length; start += TITLES_PER_REQUEST) {
    const batch = fileNames.slice(start, start + TITLES_PER_REQUEST);
    const data = await api({
      action: "query",
      titles: batch.map((name) => `File:${name}`).join("|"),
      prop: "imageinfo",
      iiprop: "extmetadata|url",
      iiextmetadatafilter: "Artist|LicenseShortName",
      redirects: "1",
    });

    // Map what the API calls each file back to what we asked for.
    const asked = new Map<string, string>();
    for (const name of batch) asked.set(`File:${canonical(name)}`, canonical(name));
    for (const step of [...(data.query?.normalized ?? []), ...(data.query?.redirects ?? [])]) {
      const original = asked.get(step.from);
      if (original) asked.set(step.to, original);
    }

    for (const page of data.query?.pages ?? []) {
      const info = page.imageinfo?.[0];
      const original = asked.get(page.title);
      if (!info || !original) continue;
      credits.set(original, {
        author: stripHtml(info.extmetadata?.Artist?.value ?? "").slice(0, 200),
        license: stripHtml(info.extmetadata?.LicenseShortName?.value ?? ""),
        pageUrl: info.descriptionurl ?? "",
      });
    }
    process.stdout.write(`\r  credits: ${Math.min(start + TITLES_PER_REQUEST, fileNames.length)}/${fileNames.length}`);
    await pause(PAUSE_MS);
  }
  process.stdout.write("\n");
  return credits;
}

async function run() {
  const rows = (await client.execute("SELECT id, name, image, image_author, image_license, image_url FROM lighthouses")).rows;
  const counts = { files: 0, categories: 0, emptyCategories: 0, pages: 0, notPhotos: 0, unrelated: 0, credited: 0, missing: 0 };
  const reset = (row: (typeof rows)[number]) => {
    row.image = placeholderUrl(String(row.name));
    return client.execute({
      sql: "UPDATE lighthouses SET image = ?, image_author = '', image_license = '', image_url = '' WHERE id = ?",
      args: [row.image, row.id],
    });
  };

  // 1 and 2: turn File: and Category: references into image URLs.
  for (const row of rows) {
    const image = String(row.image ?? "");
    let fileName: string | null = null;
    if (/^File:/i.test(image)) {
      fileName = image.replace(/^File:/i, "");
      counts.files += 1;
    } else if (/^Category:/i.test(image)) {
      fileName = await firstPhotoInCategory(image);
      await pause(PAUSE_MS);
      if (fileName) counts.categories += 1;
      else counts.emptyCategories += 1;
    } else {
      continue;
    }
    row.image = fileName ? filePathUrl(fileName) : placeholderUrl(String(row.name));
    await client.execute({ sql: "UPDATE lighthouses SET image = ? WHERE id = ?", args: [row.image, row.id] });
  }
  console.log(`  File: references converted: ${counts.files}`);
  console.log(`  Category: references resolved: ${counts.categories} (no photo in category: ${counts.emptyCategories})`);

  // 3: drop images that are not a photo of the lighthouse.
  for (const row of rows) {
    const image = String(row.image ?? "");
    if (!image.includes("wikimedia.org")) continue;
    const fileName = commonsFileName(image);

    if (!fileName || !PHOTO_EXTENSIONS.test(fileName)) {
      counts.notPhotos += 1;
      await reset(row);
    } else if (image.includes("/wiki/File:")) {
      // A link to the photo's page rather than to the photo.
      counts.pages += 1;
      row.image = filePathUrl(fileName);
      await client.execute({ sql: "UPDATE lighthouses SET image = ? WHERE id = ?", args: [row.image, row.id] });
    } else if (image.includes("/commons/thumb/") && !titleMatchesLighthouse(fileName, String(row.name))) {
      // Thumbnail URLs were only ever written by the automatic nearby-photo search.
      counts.unrelated += 1;
      await reset(row);
    }
  }
  console.log(`  page links turned into photo links: ${counts.pages}`);
  console.log(`  documents, maps and icons removed: ${counts.notPhotos}`);
  console.log(`  unrelated nearby photos removed: ${counts.unrelated}`);

  // 4: credits for every Commons photo.
  const byFile = new Map<string, typeof rows>();
  for (const row of rows) {
    const fileName = commonsFileName(String(row.image ?? ""));
    if (!fileName) continue;
    const key = canonical(fileName);
    byFile.set(key, [...(byFile.get(key) ?? []), row]);
  }
  const credits = await fetchCredits([...byFile.keys()]);

  for (const [fileName, lighthouses] of byFile) {
    const credit = credits.get(fileName);
    for (const row of lighthouses) {
      if (!credit) {
        counts.missing += 1;
        await reset(row);
        continue;
      }
      counts.credited += 1;
      await client.execute({
        sql: "UPDATE lighthouses SET image_author = ?, image_license = ?, image_url = ? WHERE id = ?",
        args: [credit.author, credit.license, credit.pageUrl, row.id],
      });
    }
  }
  console.log(`  photos credited: ${counts.credited}`);
  console.log(`  photos no longer on Commons, reset to no photo: ${counts.missing}`);
}

run()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => client.close());
