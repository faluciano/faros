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

async function fetchWithTimeout(url: string, options: any = {}, timeout = 10000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: { 
        'User-Agent': 'FarosLighthouseBot/1.0 (https://github.com/faluciano/faros)',
        ...options.headers 
      }
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

async function getGeosearchedImage(lat: number, lon: number): Promise<{url: string, author: string, license: string, pageUrl: string} | null> {
  const geoUrl = `https://commons.wikimedia.org/w/api.php?action=query&list=geosearch&gscoord=${lat}|${lon}&gsradius=1000&gsnamespace=6&format=json&origin=*`;

  try {
    const geoResponse = await fetchWithTimeout(geoUrl);
    const geoData = await geoResponse.json();
    
    if (geoData.query && geoData.query.geosearch && geoData.query.geosearch.length > 0) {
      const firstFile = geoData.query.geosearch[0];
      const pageId = firstFile.pageid;
      
      const infoUrl = `https://commons.wikimedia.org/w/api.php?action=query&pageids=${pageId}&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=800&format=json&origin=*`;
      const infoResponse = await fetchWithTimeout(infoUrl);
      const infoData = await infoResponse.json();
      
      if (infoData.query && infoData.query.pages && infoData.query.pages[pageId]) {
        const imageInfo = infoData.query.pages[pageId].imageinfo;
        if (imageInfo && imageInfo.length > 0) {
            const url = imageInfo[0].thumburl || imageInfo[0].url;
            const pageUrl = imageInfo[0].descriptionurl || "";
            const meta = imageInfo[0].extmetadata || {};
            
            let rawAuthor = meta.Artist?.value || "";
            rawAuthor = rawAuthor.replace(/<[^>]*>?/gm, '').trim(); 
            
            const license = meta.LicenseShortName?.value || "";
            
            return { url, author: rawAuthor, license, pageUrl };
        }
      }
    }
  } catch (error) {
    console.error(`[TIMEOUT/ERROR] geosearch at ${lat},${lon}:`, error);
  }
  return null;
}

async function run() {
  console.log(`[${new Date().toISOString()}] Starting ROBUST image sourcing background worker...`);
  
  // To prevent massive memory usage and connection hangs, we'll process in chunks of 100
  // and re-query the database for the next chunk.
  
  let totalProcessed = 0;
  let totalUpdated = 0;

  while (true) {
    // Fetch a small chunk of lighthouses needing images
    const result = await client.execute("SELECT id, name, latitude, longitude FROM lighthouses WHERE image LIKE '%via.placeholder.com%' LIMIT 100");
    const lighthouses = result.rows;

    if (lighthouses.length === 0) {
      console.log("No more lighthouses need images. Worker finished.");
      break;
    }

    console.log(`[CHUNK] Processing batch of ${lighthouses.length} lighthouses. (Total updated so far: ${totalUpdated})`);

    for (const row of lighthouses) {
      const id = row.id as string;
      const name = row.name as string;
      const lat = row.latitude as number;
      const lon = row.longitude as number;
      
      try {
          const imgData = await getGeosearchedImage(lat, lon);
          
          if (imgData) {
            await client.execute({
              sql: "UPDATE lighthouses SET image = ?, image_author = ?, image_license = ?, image_url = ? WHERE id = ?",
              args: [imgData.url, imgData.author, imgData.license, imgData.pageUrl, id]
            });
            totalUpdated++;
            console.log(`✅ Updated: ${name}`);
          } else {
            // Update the placeholder URL to mark it as checked
            await client.execute({
              sql: "UPDATE lighthouses SET image = ? WHERE id = ?",
              args: [`https://via.placeholder.com/800x600?text=${encodeURIComponent(name)}&checked=true`, id]
            });
            console.log(`❌ No image: ${name}`);
          }
      } catch (e) {
          console.error(`Failed to process ${name}:`, e);
      }
      totalProcessed++;
      
      // Throttle to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Brief rest between chunks
    console.log(`[REST] Chunk complete. Resting for 2 seconds...`);
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log(`[${new Date().toISOString()}] Background worker finished.`);
  console.log(`Final Summary: ${totalUpdated} updated out of ${totalProcessed} checked.`);
}

run().catch(console.error).finally(() => client.close());
