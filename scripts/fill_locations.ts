// Sets every lighthouse's country and region from its coordinates.
// Run from the repo root, after load_work_db.ts:
//
//   bun run scripts/fill_locations.ts
//
// It works offline against Natural Earth's public-domain boundary files,
// which it downloads into scripts/.work/ the first time. A lighthouse inside
// a region's boundary takes that region. One just outside every boundary, as
// lights on rocks and breakwaters are, takes the nearest region within
// MAX_OFFSHORE_KM. Anything further out is left blank.

import { existsSync, readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { client } from "./client";
import { WORK_DB_PATH } from "./workdb";

const SOURCE = "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson";
const REGIONS_FILE = "ne_10m_admin_1_states_provinces.geojson";
const COUNTRIES_FILE = "ne_10m_admin_0_countries.geojson";
const MAX_OFFSHORE_KM = 100;
const KM_PER_DEGREE = 111.32;

// Shorter everyday names for a few countries Natural Earth names formally.
const COUNTRY_NAMES: Record<string, string> = {
  "United States of America": "United States",
  "United Republic of Tanzania": "Tanzania",
  "Republic of Serbia": "Serbia",
  "The Bahamas": "Bahamas",
  "Republic of the Congo": "Congo",
  "Democratic Republic of the Congo": "DR Congo",
  "Federated States of Micronesia": "Micronesia",
};

type Ring = number[][];
interface Area {
  country: string;
  region: string;
  // Outer ring first, then holes.
  rings: Ring[];
  box: [minLon: number, minLat: number, maxLon: number, maxLat: number];
}

async function boundaryFile(name: string): Promise<any> {
  const path = join(dirname(WORK_DB_PATH), name);
  if (!existsSync(path)) {
    console.log(`Downloading ${name}...`);
    const response = await fetch(`${SOURCE}/${name}`);
    if (!response.ok) throw new Error(`Could not download ${name}: ${response.status}`);
    writeFileSync(path, await response.text());
  }
  return JSON.parse(readFileSync(path, "utf-8"));
}

function toAreas(collection: any, describe: (properties: any) => { country: string; region: string }): Area[] {
  const areas: Area[] = [];
  for (const feature of collection.features) {
    if (!feature.geometry) continue;
    const { country, region } = describe(feature.properties);
    const polygons: Ring[][] = feature.geometry.type === "Polygon" ? [feature.geometry.coordinates] : feature.geometry.coordinates;
    for (const rings of polygons) {
      let minLon = Infinity, minLat = Infinity, maxLon = -Infinity, maxLat = -Infinity;
      for (const [lon, lat] of rings[0]) {
        if (lon < minLon) minLon = lon;
        if (lon > maxLon) maxLon = lon;
        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;
      }
      areas.push({ country: COUNTRY_NAMES[country] ?? country, region, rings, box: [minLon, minLat, maxLon, maxLat] });
    }
  }
  return areas;
}

const inRing = (lon: number, lat: number, ring: Ring): boolean => {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if ((yi > lat) !== (yj > lat) && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
};

const contains = (area: Area, lon: number, lat: number): boolean =>
  lon >= area.box[0] && lon <= area.box[2] && lat >= area.box[1] && lat <= area.box[3] &&
  inRing(lon, lat, area.rings[0]) && !area.rings.slice(1).some((hole) => inRing(lon, lat, hole));

// Distance in km from a point to an area's outline. Treats the neighbourhood
// as flat, which is accurate enough over the distances that matter here.
function distanceKm(area: Area, lon: number, lat: number): number {
  const scale = Math.cos((lat * Math.PI) / 180);
  let best = Infinity;
  const ring = area.rings[0];
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const ax = (ring[j][0] - lon) * scale, ay = ring[j][1] - lat;
    const bx = (ring[i][0] - lon) * scale, by = ring[i][1] - lat;
    const dx = bx - ax, dy = by - ay;
    const lengthSquared = dx * dx + dy * dy;
    const t = lengthSquared === 0 ? 0 : Math.max(0, Math.min(1, -(ax * dx + ay * dy) / lengthSquared));
    const px = ax + t * dx, py = ay + t * dy;
    const distance = px * px + py * py;
    if (distance < best) best = distance;
  }
  return Math.sqrt(best) * KM_PER_DEGREE;
}

function locate(areas: Area[], lon: number, lat: number): Area | null {
  const inside = areas.find((area) => contains(area, lon, lat));
  if (inside) return inside;

  const reach = MAX_OFFSHORE_KM / KM_PER_DEGREE;
  const lonReach = reach / Math.max(0.1, Math.cos((lat * Math.PI) / 180));
  let nearest: Area | null = null;
  let nearestKm = MAX_OFFSHORE_KM;
  for (const area of areas) {
    if (lon < area.box[0] - lonReach || lon > area.box[2] + lonReach || lat < area.box[1] - reach || lat > area.box[3] + reach) continue;
    const km = distanceKm(area, lon, lat);
    if (km < nearestKm) {
      nearestKm = km;
      nearest = area;
    }
  }
  return nearest;
}

async function run() {
  const regions = toAreas(await boundaryFile(REGIONS_FILE), (p) => ({ country: p.admin, region: p.name_en || p.name || "" }));
  const countries = toAreas(await boundaryFile(COUNTRIES_FILE), (p) => ({ country: p.ADMIN, region: "" }));

  const rows = (await client.execute("SELECT id, latitude, longitude FROM lighthouses")).rows;
  const counts = { region: 0, countryOnly: 0, none: 0 };
  const updates = [];
  for (const row of rows) {
    const lon = Number(row.longitude), lat = Number(row.latitude);
    const match = locate(regions, lon, lat) ?? locate(countries, lon, lat);
    if (!match) counts.none += 1;
    else if (match.region) counts.region += 1;
    else counts.countryOnly += 1;
    // A light with no match keeps whatever location it already had.
    if (match) {
      updates.push({ sql: "UPDATE lighthouses SET country = ?, state = ? WHERE id = ?", args: [match.country, match.region, row.id] });
    }
  }
  for (let start = 0; start < updates.length; start += 500) {
    await client.batch(updates.slice(start, start + 500), "write");
  }
  console.log(`Located ${counts.region} with country and region, ${counts.countryOnly} with country only; ${counts.none} too far from land to place.`);
}

run()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => client.close());
