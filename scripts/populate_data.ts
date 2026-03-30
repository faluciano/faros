import { createClient } from "@libsql/client";
import { join } from "path";
import { readFileSync } from "fs";
import * as dotenv from "dotenv";

// Load env from backend
const envPath = join(process.cwd(), "lighthouse-backend", ".env");
dotenv.config({ path: envPath });

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
  console.error("Error: TURSO_DATABASE_URL or TURSO_AUTH_TOKEN not found in backend/.env");
  process.exit(1);
}

console.log(`Connecting to Turso: ${url}`);

const client = createClient({
  url: url,
  authToken: authToken,
});

const dataPath = join(process.cwd(), "scripts", "global_lighthouses.json");
console.log(`Loading data from: ${dataPath}`);

async function run() {
  // Ensure table exists with all fields
  await client.execute(`
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

  const lighthouses = elements
    .filter((el: any) => el.type === "node" && el.tags)
    .map((el: any) => {
      const tags = el.tags;
      const id = String(el.id);
      const name = tags.name || tags["seamark:name"] || tags["official_name"] || `Lighthouse ${id}`;
      const country = tags["addr:country"] || tags["iso_3166-1"] || "";
      const state = tags["addr:state"] || tags["iso_3166-2"] || "";
      
      let height = parseFloat(tags.height || tags["height:tower"] || "0");
      if (height === 0) {
          height = parseFloat(tags["seamark:light:height"] || tags["seamark:light:1:height"] || "0");
      }
      
      const yearBuiltStr = tags.start_date || tags.inception || tags["established"] || "0";
      const yearBuilt = parseInt(yearBuiltStr.match(/\d{4}/)?.[0] || "0");

      const getTag = (base: string) => tags[base] || tags[`${base}:1`] || tags[base.replace("light:", "light:1:")];
      const lightParts = [
        getTag("seamark:light:character"),
        getTag("seamark:light:colour"),
        getTag("seamark:light:period") ? `${getTag("seamark:light:period")}s` : null,
        getTag("seamark:light:range") ? `${getTag("seamark:light:range")}M` : null
      ].filter(Boolean);
      
      return {
        id,
        name,
        country,
        state,
        latitude: el.lat,
        longitude: el.lon,
        image: tags.image || tags.wikimedia_commons || `https://via.placeholder.com/800x600?text=${encodeURIComponent(name)}`,
        height: isNaN(height) ? 0 : height,
        year_built: yearBuilt,
        light_characteristics: lightParts.join(" ") || "",
        description: tags.description || tags.note || tags.abstract || ""
      };
    });

  console.log(`Prepared ${lighthouses.length} lighthouses for import.`);

  const BATCH_SIZE = 50; // Turso transactions have limits, using smaller batches for safety
  for (let i = 0; i < lighthouses.length; i += BATCH_SIZE) {
    const batch = lighthouses.slice(i, i + BATCH_SIZE);
    
    const statements = batch.map((l) => ({
      sql: `INSERT OR REPLACE INTO lighthouses (id, name, country, state, latitude, longitude, image, height, year_built, light_characteristics, description)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [l.id, l.name, l.country, l.state, l.latitude, l.longitude, l.image, l.height, l.year_built, l.light_characteristics, l.description]
    }));

    await client.batch(statements, "write");
    console.log(`Imported ${i + batch.length}/${lighthouses.length}...`);
  }

  console.log("Successfully populated Turso cloud database!");

  const result = await client.execute("SELECT COUNT(*) as total FROM lighthouses");
  console.log(`Total lighthouses in Turso: ${result.rows[0].total}`);
}

run().catch(console.error).finally(() => client.close());
