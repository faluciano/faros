// Writes the lighthouse dataset as static files for the frontend to serve.
// Run from the repo root after any import or enrichment script:
//
//   bun run scripts/export_static.ts
//
// It only reads from the working database. Commit the files it writes.

import { mkdirSync, rmSync, writeFileSync } from "fs";
import { join } from "path";
import { client } from "./client";
import {
  DETAIL_SHARD_COUNT,
  getDetailShard,
  getDetailShardFile,
  type LighthouseDetailShard,
  type LighthouseIndex,
} from "../lighthouse-frontend/src/utils/lighthouseData";
import type { Lighthouse } from "../lighthouse-frontend/src/types";

const outputDirectory = join(process.cwd(), "lighthouse-frontend", "public", "data", "lighthouses");
// About one metre; more digits only add bytes.
const COORDINATE_DECIMALS = 5;

const text = (value: unknown): string => (value == null ? "" : String(value));
const number = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};
const round = (value: number): number => Number(value.toFixed(COORDINATE_DECIMALS));

async function run() {
  const result = await client.execute(`
    SELECT id, name, country, state, latitude, longitude, image, height, year_built,
           light_characteristics, description, source, image_author, image_license, image_url
    FROM lighthouses
    ORDER BY id
  `);

  const index: LighthouseIndex = { points: [] };
  const shards: LighthouseDetailShard[] = Array.from({ length: DETAIL_SHARD_COUNT }, () => ({}));
  let skipped = 0;

  for (const row of result.rows) {
    const id = text(row.id);
    const latitude = number(row.latitude);
    const longitude = number(row.longitude);
    if (!id || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
      skipped += 1;
      continue;
    }

    const lighthouse: Lighthouse = {
      id,
      name: text(row.name),
      latitude: round(latitude),
      longitude: round(longitude),
      image: text(row.image),
      state: text(row.state),
      country: text(row.country),
      height: number(row.height),
      year_built: number(row.year_built),
      light_characteristics: text(row.light_characteristics),
      description: text(row.description),
      source: text(row.source),
      image_author: text(row.image_author),
      image_license: text(row.image_license),
      image_url: text(row.image_url),
    };
    index.points.push([id, lighthouse.longitude, lighthouse.latitude]);
    shards[getDetailShard(id)][id] = lighthouse;
  }

  rmSync(outputDirectory, { recursive: true, force: true });
  mkdirSync(join(outputDirectory, "details"), { recursive: true });
  writeFileSync(join(outputDirectory, "index.json"), JSON.stringify(index));
  shards.forEach((shard, shardNumber) => {
    writeFileSync(join(outputDirectory, getDetailShardFile(shardNumber)), JSON.stringify(shard));
  });

  const sizes = shards.map((shard) => Object.keys(shard).length);
  console.log(`Exported ${index.points.length} lighthouses (${skipped} skipped for bad IDs or coordinates).`);
  console.log(`Detail shards hold ${Math.min(...sizes)} to ${Math.max(...sizes)} lighthouses each.`);
}

run()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => client.close());
