import { Database } from "bun:sqlite";
import { join } from "path";
import { readFileSync } from "fs";

const dbPath = join(process.cwd(), "lighthouse-backend", "lighthouse.db");
const dataPath = join(process.cwd(), "scripts", "global_lighthouses.json");

console.log(`Using database at: ${dbPath}`);
console.log(`Loading data from: ${dataPath}`);

const db = new Database(dbPath);

// Ensure table exists with all fields
db.run(`
  CREATE TABLE IF NOT EXISTS lighthouses (
    id TEXT PRIMARY KEY,
    name TEXT,
    country TEXT,
    state TEXT,
    latitude REAL,
    longitude REAL,
    image TEXT,
    height REAL,
    year_built INTEGER,
    light_characteristics TEXT,
    description TEXT
  )
`);

const rawData = JSON.parse(readFileSync(dataPath, "utf-8"));
const elements = rawData.elements;

console.log(`Found ${elements.length} raw elements from OSM.`);

const insert = db.prepare(`
  INSERT OR REPLACE INTO lighthouses (id, name, country, state, latitude, longitude, image, height, year_built, light_characteristics, description)
  VALUES ($id, $name, $country, $state, $latitude, $longitude, $image, $height, $year_built, $light_characteristics, $description)
`);

let count = 0;

db.transaction(() => {
  for (const el of elements) {
    if (el.type !== "node" || !el.tags) continue; // Simplify to nodes for now

    const tags = el.tags;
    
    // Mapping logic
    const id = String(el.id);
    const name = tags.name || tags["seamark:name"] || `Lighthouse ${id}`;
    const country = tags["addr:country"] || "";
    const state = tags["addr:state"] || "";
    const lat = el.lat;
    const lon = el.lon;
    
    // Attempt to get height (physical height or focal height)
    const height = parseFloat(tags.height || tags["seamark:light:height"] || "0");
    
    // Attempt to get year built
    const yearBuiltStr = tags.start_date || tags.inception || "0";
    const yearBuilt = parseInt(yearBuiltStr.match(/\d{4}/)?.[0] || "0");

    // Construct light characteristics string
    const lightParts = [
      tags["seamark:light:character"],
      tags["seamark:light:colour"],
      tags["seamark:light:period"] ? `${tags["seamark:light:period"]}s` : null,
      tags["seamark:light:range"] ? `${tags["seamark:light:range"]}M` : null
    ].filter(Boolean);
    const lightChars = lightParts.join(" ") || "";

    const description = tags.description || tags.note || "";
    
    // Use a placeholder image if not present (real image sourcing would require another API)
    const image = tags.image || tags.wikimedia_commons || `https://via.placeholder.com/800x600?text=${encodeURIComponent(name)}`;

    insert.run({
      $id: id,
      $name: name,
      $country: country,
      $state: state,
      $latitude: lat,
      $longitude: lon,
      $image: image,
      $height: isNaN(height) ? 0 : height,
      $year_built: yearBuilt,
      $light_characteristics: lightChars,
      $description: description
    });
    count++;
  }
})();

console.log(`Successfully populated ${count} lighthouses!`);

// Final verification
const dbCount = db.query("SELECT COUNT(*) as total FROM lighthouses").get() as { total: number };
console.log(`Total lighthouses in database: ${dbCount.total}`);

db.close();
