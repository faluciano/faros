// Looks on Wikimedia Commons for photos of lighthouses that have none.
// Run from the repo root, after load_work_db.ts:
//
//   bun run scripts/find_photos.ts            search; safe to stop and restart
//   bun run scripts/find_photos.ts --apply    write what was found into the working database
//
// Then run repair_images.ts to add photo credits, and export_static.ts.
//
// A photo is accepted only if it was taken within SEARCH_RADIUS_M of the
// lighthouse and its title says it shows a lighthouse. That misses photos
// with unhelpful names, and where two lights stand close together it can
// pick the neighbour's photo, but it does not pick arbitrary nearby scenes.

import { existsSync, readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { client } from "./client";
import { titleSaysLighthouse } from "./photo_match";
import { WORK_DB_PATH } from "./workdb";

const API = "https://commons.wikimedia.org/w/api.php";
const USER_AGENT = "FarosLighthouseBot/1.0 (https://github.com/faluciano/faros)";
const SEARCH_RADIUS_M = 300;
const PAUSE_MS = 200;
const CONCURRENT_REQUESTS = 4;
const PHOTO_EXTENSIONS = /\.(jpe?g|png|webp)$/i;
const RESULTS_PATH = join(dirname(WORK_DB_PATH), "photo_search.json");

// Lighthouse ID -> Commons file name, or null when nothing suitable was found.
type Results = Record<string, string | null>;

const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const loadResults = (): Results => (existsSync(RESULTS_PATH) ? JSON.parse(readFileSync(RESULTS_PATH, "utf-8")) : {});

async function nearbyPhoto(latitude: number, longitude: number): Promise<string | null> {
  const url = `${API}?${new URLSearchParams({
    action: "query",
    list: "geosearch",
    gscoord: `${latitude}|${longitude}`,
    gsradius: String(SEARCH_RADIUS_M),
    gsnamespace: "6",
    gslimit: "50",
    format: "json",
    formatversion: "2",
  })}`;
  for (let attempt = 1; ; attempt += 1) {
    const response = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
    if (response.ok) {
      // Results come nearest first.
      const files: Array<{ title: string }> = (await response.json()).query?.geosearch ?? [];
      const match = files.find((file) => PHOTO_EXTENSIONS.test(file.title) && titleSaysLighthouse(file.title));
      return match ? match.title.replace(/^File:/, "") : null;
    }
    if (attempt === 5) {
      throw new Error(`Commons API returned ${response.status}`);
    }
    await pause(3000 * attempt);
  }
}

async function search() {
  const rows = (await client.execute(
    "SELECT id, latitude, longitude FROM lighthouses WHERE image LIKE '%via.placeholder.com%' ORDER BY id",
  )).rows;
  const results = loadResults();
  const todo = rows.filter((row) => !(String(row.id) in results));
  console.log(`${rows.length} lighthouses without a photo; ${todo.length} still to search.`);

  let found = Object.values(results).filter(Boolean).length;
  let done = 0;
  let next = 0;
  // A few requests at a time: each takes about a second, and one at a time
  // would need hours for the whole dataset.
  const worker = async () => {
    while (next < todo.length) {
      const row = todo[next];
      next += 1;
      const fileName = await nearbyPhoto(Number(row.latitude), Number(row.longitude));
      results[String(row.id)] = fileName;
      if (fileName) found += 1;
      done += 1;
      if (done % 100 === 0 || done === todo.length) {
        writeFileSync(RESULTS_PATH, JSON.stringify(results));
        console.log(`searched ${done}/${todo.length}, photos found so far: ${found}`);
      }
      await pause(PAUSE_MS);
    }
  };
  await Promise.all(Array.from({ length: CONCURRENT_REQUESTS }, worker));
}

async function apply() {
  const results = loadResults();
  let applied = 0;
  for (const [id, fileName] of Object.entries(results)) {
    if (!fileName) continue;
    const image = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(fileName)}?width=800`;
    const result = await client.execute({
      sql: "UPDATE lighthouses SET image = ? WHERE id = ? AND image LIKE '%via.placeholder.com%'",
      args: [image, id],
    });
    applied += result.rowsAffected;
  }
  console.log(`Applied ${applied} photos. Run repair_images.ts next to add their credits.`);
}

(process.argv.includes("--apply") ? apply() : search())
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => client.close());
