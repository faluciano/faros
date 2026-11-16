// Builds the working database from the published lighthouse files, replacing
// any existing one. Run from the repo root:
//
//   bun run scripts/load_work_db.ts
//
// The files under lighthouse-frontend/public/data/lighthouses are the source
// of truth. Load them here, run whichever scripts change the data, then write
// the result back with export_static.ts.

import { mkdirSync, readdirSync, readFileSync, rmSync } from "fs";
import { dirname, join } from "path";
import { openWorkDB, WORK_DB_PATH } from "./workdb";
import type { LighthouseDetailShard } from "../lighthouse-frontend/src/utils/lighthouseData";

const detailsDirectory = join(process.cwd(), "lighthouse-frontend", "public", "data", "lighthouses", "details");
const BATCH_SIZE = 200;

mkdirSync(dirname(WORK_DB_PATH), { recursive: true });
rmSync(WORK_DB_PATH, { force: true });
const client = openWorkDB();

async function run() {
  await client.batch([
    `CREATE TABLE lighthouses (
      id TEXT PRIMARY KEY,
      name TEXT,
      country TEXT,
      state TEXT,
      latitude REAL,
      longitude REAL,
      image TEXT,
      height REAL DEFAULT 0,
      year_built INTEGER DEFAULT 0,
      light_characteristics TEXT DEFAULT '',
      description TEXT DEFAULT '',
      source TEXT DEFAULT 'OpenStreetMap',
      image_author TEXT DEFAULT '',
      image_license TEXT DEFAULT '',
      image_url TEXT DEFAULT ''
    )`,
    "CREATE INDEX idx_lighthouses_lat_long ON lighthouses(latitude, longitude)",
    "CREATE INDEX idx_lighthouses_source ON lighthouses(source)",
  ], "write");

  const lighthouses = readdirSync(detailsDirectory)
    .filter((file) => file.endsWith(".json"))
    .flatMap((file) =>
      Object.values(JSON.parse(readFileSync(join(detailsDirectory, file), "utf-8")) as LighthouseDetailShard));

  for (let start = 0; start < lighthouses.length; start += BATCH_SIZE) {
    await client.batch(lighthouses.slice(start, start + BATCH_SIZE).map((l) => ({
      sql: `INSERT INTO lighthouses (id, name, country, state, latitude, longitude, image, height, year_built,
              light_characteristics, description, source, image_author, image_license, image_url)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [l.id, l.name, l.country, l.state, l.latitude, l.longitude, l.image, l.height, l.year_built,
        l.light_characteristics, l.description, l.source, l.image_author, l.image_license, l.image_url],
    })), "write");
  }

  console.log(`Loaded ${lighthouses.length} lighthouses into ${WORK_DB_PATH}`);
}

run()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => client.close());
