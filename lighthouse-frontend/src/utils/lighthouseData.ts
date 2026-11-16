import type { Lighthouse, LighthouseMapData } from "../types";

// Lighthouse data is published as static files under /data/lighthouses,
// written by scripts/export_static.ts:
//
//   index.json          every lighthouse as [id, longitude, latitude]
//   details/<nn>.json   full records, split into DETAIL_SHARD_COUNT files
//
// The export script imports the names and shard function from this file, so
// the reader and the writer cannot drift apart.

export const LIGHTHOUSE_DATA_PATH = "/data/lighthouses";
export const DETAIL_SHARD_COUNT = 256;

export type LighthouseIndexPoint = [id: string, longitude: number, latitude: number];

export interface LighthouseIndex {
  points: LighthouseIndexPoint[];
}

export type LighthouseDetailShard = Record<string, Lighthouse>;

// FNV-1a over the ID's UTF-16 code units. IDs are ASCII, and any ID format
// spreads evenly, so shards stay a few KB each.
export const getDetailShard = (id: string): number => {
  let hash = 0x811c9dc5;
  for (let index = 0; index < id.length; index += 1) {
    hash ^= id.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0) % DETAIL_SHARD_COUNT;
};

export const getDetailShardFile = (shard: number): string =>
  `details/${shard.toString(16).padStart(2, "0")}.json`;

export const toMapData = (index: LighthouseIndex): LighthouseMapData => ({
  type: "FeatureCollection",
  features: index.points.map(([id, longitude, latitude]) => ({
    type: "Feature",
    id,
    geometry: { type: "Point", coordinates: [longitude, latitude] },
    properties: { id },
  })),
});
