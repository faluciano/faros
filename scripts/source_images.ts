import { createClient } from "@libsql/client";
import { join } from "path";
import * as dotenv from "dotenv";

// Load env from backend
const envPath = join(process.cwd(), "lighthouse-backend", ".env");
dotenv.config({ path: envPath });

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
  console.error("Error: TURSO_DATABASE_URL or TURSO_AUTH_TOKEN not found");
  process.exit(1);
}

const client = createClient({ url, authToken });

async function getGeosearchedImage(lat: number, lon: number): Promise<string | null> {
  // 1. Find files near coordinates
  const geoUrl = `https://commons.wikimedia.org/w/api.php?action=query&list=geosearch&gscoord=${lat}|${lon}&gsradius=500&gsnamespace=6&format=json&origin=*`;

  try {
    const geoResponse = await fetch(geoUrl, {
        headers: { 'User-Agent': 'FarosLighthouseBot/1.0 (https://github.com/faluciano/faros)' }
    });
    const geoData = await geoResponse.json();
    
    if (geoData.query && geoData.query.geosearch && geoData.query.geosearch.length > 0) {
      const firstFile = geoData.query.geosearch[0];
      const pageId = firstFile.pageid;
      
      // 2. Get image URL for this page
      const infoUrl = `https://commons.wikimedia.org/w/api.php?action=query&pageids=${pageId}&prop=imageinfo&iiprop=url&iiurlwidth=800&format=json&origin=*`;
      const infoResponse = await fetch(infoUrl);
      const infoData = await infoResponse.json();
      
      if (infoData.query && infoData.query.pages) {
        const imageInfo = infoData.query.pages[pageId].imageinfo;
        if (imageInfo && imageInfo.length > 0) {
          return imageInfo[0].thumburl || imageInfo[0].url;
        }
      }
    }
  } catch (error) {
    console.error(`Error geosearching at ${lat},${lon}:`, error);
  }
  return null;
}

async function run() {
  console.log("Fetching lighthouses with placeholders for Geosearch...");
  const result = await client.execute("SELECT id, name, latitude, longitude FROM lighthouses WHERE image LIKE '%via.placeholder.com%' LIMIT 50");
  const lighthouses = result.rows;

  console.log(`Processing ${lighthouses.length} lighthouses via Geosearch...`);

  let updatedCount = 0;
  for (const row of lighthouses) {
    const id = row.id as string;
    const name = row.name as string;
    const lat = row.latitude as number;
    const lon = row.longitude as number;
    
    console.log(`Geosearching for: ${name} (${lat}, ${lon})...`);
    const imageUrl = await getGeosearchedImage(lat, lon);
    
    if (imageUrl) {
      await client.execute({
        sql: "UPDATE lighthouses SET image = ? WHERE id = ?",
        args: [imageUrl, id]
      });
      console.log(`✅ Updated ${name}`);
      updatedCount++;
    } else {
      console.log(`❌ No image found for ${name}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  console.log(`Finished Geosearch batch. Updated ${updatedCount} lighthouses.`);
}

run().catch(console.error).finally(() => client.close());
