import { createClient } from "@libsql/client";
import { join } from "path";
import { readFileSync } from "fs";
import * as dotenv from "dotenv";

const envPath = join(process.cwd(), "lighthouse-backend", ".env");
dotenv.config({ path: envPath });

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
  console.error("Error: TURSO credentials not found");
  process.exit(1);
}

const client = createClient({ url, authToken });
const dataPath = join(process.cwd(), "scripts", "global_lighthouses.json");

async function run() {
  console.log(`[${new Date().toISOString()}] Loading raw dataset...`);
  const rawData = JSON.parse(readFileSync(dataPath, "utf-8"));
  const elements = rawData.elements;
  console.log(`Found ${elements.length} raw elements from OSM.`);

  // 1. Build a lookup map for Nodes (needed for calculating Way centroids)
  const nodeMap = new Map<number, { lat: number; lon: number }>();
  for (const el of elements) {
    if (el.type === "node") {
      nodeMap.set(el.id, { lat: el.lat, lon: el.lon });
    }
  }
  console.log(`Indexed ${nodeMap.size} nodes for coordinate lookup.`);

  // 2. Process all elements (Nodes, Ways, Relations)
  const processedLighthouses = [];
  
  for (const el of elements) {
    // Only process elements that are tagged as lighthouses
    if (!el.tags || el.tags.man_made !== "lighthouse") continue;

    const tags = el.tags;
    const id = String(el.id);
    
    // --- Naming Logic & Pruning ---
    let name = tags.name || tags["seamark:name"] || tags["official_name"];
    
    // Fallback naming
    if (!name) {
        name = tags.ref || tags["seamark:light:reference"];
    }

    // PRUNING: If still no name AND no wikidata/wikipedia AND height is small/missing, skip it.
    const isSignificant = tags.wikidata || tags.wikipedia || parseFloat(tags.height || "0") > 10;
    if (!name && !isSignificant) continue;

    // Default name if it IS significant but unnamed
    if (!name) name = "Unnamed Lighthouse";

    // --- Coordinate Calculation ---
    let lat: number = 0;
    let lon: number = 0;

    if (el.type === "node") {
      lat = el.lat;
      lon = el.lon;
    } else if (el.type === "way" && el.nodes) {
      // Calculate centroid of the way
      let sumLat = 0;
      let sumLon = 0;
      let validNodes = 0;
      for (const nodeId of el.nodes) {
        const coords = nodeMap.get(nodeId);
        if (coords) {
          sumLat += coords.lat;
          sumLon += coords.lon;
          validNodes++;
        }
      }
      if (validNodes > 0) {
        lat = sumLat / validNodes;
        lon = sumLon / validNodes;
      }
    } else if (el.type === "relation" && el.members) {
        // Simple fallback: use coordinates of the first node member
        for (const member of el.members) {
            if (member.type === "node") {
                const coords = nodeMap.get(member.ref);
                if (coords) {
                    lat = coords.lat;
                    lon = coords.lon;
                    break;
                }
            }
        }
    }

    if (lat === 0 || lon === 0) continue;

    // --- Metadata Mapping ---
    const getTag = (keys: string[]) => {
        for (const k of keys) { if (tags[k]) return tags[k]; }
        return null;
    };

    const height = parseFloat(getTag(["height", "height:tower", "seamark:light:height", "seamark:light:1:height"]) || "0");
    
    const yearStr = getTag(["start_date", "inception", "established", "opened", "built"]) || "0";
    const yearBuilt = parseInt(yearStr.match(/\d{4}/)?.[0] || "0");

    const lightParts = [
      tags["seamark:light:character"] || tags["seamark:light:1:character"],
      tags["seamark:light:colour"] || tags["seamark:light:1:colour"],
      tags["seamark:light:period"] ? `${tags["seamark:light:period"]}s` : null,
      tags["seamark:light:range"] ? `${tags["seamark:light:range"]}M` : null
    ].filter(Boolean);

    const description = getTag(["description", "note", "abstract", "history"]) || "";
    
    processedLighthouses.push({
      id,
      name,
      country: tags["addr:country"] || tags["iso_3166-1"] || "",
      state: tags["addr:state"] || tags["iso_3166-2"] || "",
      latitude: lat,
      longitude: lon,
      height: isNaN(height) ? 0 : height,
      year_built: yearBuilt,
      light_characteristics: lightParts.join(" ") || "",
      description: description,
      // Default image - we will handle "Image Safety" during INSERT
      image: `https://via.placeholder.com/800x600?text=${encodeURIComponent(name)}`
    });
  }

  console.log(`Prepared ${processedLighthouses.length} lighthouses for cloud import.`);

  // 3. Batched Cloud Import with Image Safety
  const BATCH_SIZE = 50;
  for (let i = 0; i < processedLighthouses.length; i += BATCH_SIZE) {
    const batch = processedLighthouses.slice(i, i + BATCH_SIZE);
    
    // IMAGE SAFETY LOGIC: 
    // Use an UPSERT that only updates the image if the current image is a placeholder.
    // In LibSQL/SQLite, we can use: 
    // INSERT INTO ... ON CONFLICT(id) DO UPDATE SET ... image = CASE WHEN excluded.image LIKE '%via.placeholder.com%' THEN lighthouses.image ELSE excluded.image END
    
    const statements = batch.map((l) => ({
      sql: `
        INSERT INTO lighthouses (id, name, country, state, latitude, longitude, image, height, year_built, light_characteristics, description)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          name = excluded.name,
          country = excluded.country,
          state = excluded.state,
          latitude = excluded.latitude,
          longitude = excluded.longitude,
          height = excluded.height,
          year_built = excluded.year_built,
          light_characteristics = excluded.light_characteristics,
          description = excluded.description,
          image = CASE 
            WHEN lighthouses.image NOT LIKE '%via.placeholder.com%' THEN lighthouses.image 
            ELSE excluded.image 
          END
      `,
      args: [l.id, l.name, l.country, l.state, l.latitude, l.longitude, l.image, l.height, l.year_built, l.light_characteristics, l.description]
    }));

    await client.batch(statements, "write");
    if (i % 500 === 0) {
        console.log(`Progress: ${i}/${processedLighthouses.length}...`);
    }
  }

  console.log(`[${new Date().toISOString()}] Successfully synchronized Turso cloud database!`);
  const finalCount = await client.execute("SELECT COUNT(*) as total FROM lighthouses");
  console.log(`Final lighthouse count in Turso: ${finalCount.rows[0].total}`);
}

run().catch(console.error).finally(() => client.close());
