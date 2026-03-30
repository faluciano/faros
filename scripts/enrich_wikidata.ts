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

async function fetchWikidata(wikidataId: string) {
  const apiUrl = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${wikidataId}&props=claims|labels|descriptions&languages=en&format=json&origin=*`;
  
  try {
    const response = await fetch(apiUrl, {
        headers: { 'User-Agent': 'FarosLighthouseBot/1.0 (https://github.com/faluciano/faros)' }
    });
    const data = await response.json() as any;
    const entity = data.entities[wikidataId];
    if (!entity) return null;

    const claims = entity.claims || {};

    // P571: Inception (Year)
    const inception = claims.P571?.[0]?.mainsnak?.datavalue?.value?.time;
    const year = inception ? parseInt(inception.match(/\+?(\d{4})/)?.[1] || "0") : 0;

    // P2048: Height
    const heightValue = claims.P2048?.[0]?.mainsnak?.datavalue?.value?.amount;
    const height = heightValue ? parseFloat(heightValue.replace("+", "")) : 0;

    // Description fallback
    const description = entity.descriptions?.en?.value || "";

    // P18: Image
    const imageName = claims.P18?.[0]?.mainsnak?.datavalue?.value;
    let imageUrl = null;
    let imageAuthor = "";
    let imageLicense = "";
    let imagePageUrl = "";

    if (imageName) {
      const commonsUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=File:${encodeURIComponent(imageName)}&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=800&format=json&origin=*`;
      const commonsRes = await fetch(commonsUrl, { headers: { 'User-Agent': 'FarosLighthouseBot/1.0 (https://github.com/faluciano/faros)' }});
      const commonsData = await commonsRes.json() as any;
      const pages = commonsData.query?.pages;
      if (pages) {
          const pageId = Object.keys(pages)[0];
          const imageInfo = pages[pageId]?.imageinfo?.[0];
          if (imageInfo) {
              imageUrl = imageInfo.thumburl || imageInfo.url;
              imagePageUrl = imageInfo.descriptionurl || "";
              
              const meta = imageInfo.extmetadata || {};
              // Attempt to parse out HTML from artist string
              let rawAuthor = meta.Artist?.value || "";
              rawAuthor = rawAuthor.replace(/<[^>]*>?/gm, '').trim(); 
              imageAuthor = rawAuthor;
              
              imageLicense = meta.LicenseShortName?.value || "";
          }
      }
    }

    return { year, height, description, imageUrl, imageAuthor, imageLicense, imagePageUrl };
  } catch (e) {
    return null;
  }
}

async function run() {
  console.log(`[${new Date().toISOString()}] Starting BATCHED Wikidata enrichment...`);
  const rawData = JSON.parse(readFileSync(dataPath, "utf-8"));
  const elements = rawData.elements;

  const wikidataMap = new Map<string, string>();
  for (const el of elements) {
    if (el.tags?.wikidata) {
      wikidataMap.set(String(el.id), el.tags.wikidata);
    }
  }

  const ids = Array.from(wikidataMap.keys());
  let pendingUpdates: any[] = [];
  const BATCH_SIZE = 25; 

  for (let i = 0; i < ids.length; i++) {
    const id = ids[i];
    const wikidataId = wikidataMap.get(id)!;

    // Check if we need to process this one
    const existing = await client.execute({
        sql: "SELECT year_built, height, description, image FROM lighthouses WHERE id = ? AND source != 'Wikidata'",
        args: [id]
    });

    if (existing.rows.length > 0) {
        const row = existing.rows[0];
        const hasPlaceholder = String(row.image).includes("via.placeholder.com");
        
        if (row.year_built === 0 || row.height === 0 || row.description === "" || hasPlaceholder) {
            const info = await fetchWikidata(wikidataId);
            if (info) {
                pendingUpdates.push({ id, ...info });
                console.log(`[Pending] ${id} (${wikidataId})`);
            }
            await new Promise(r => setTimeout(r, 400));
        }
    }

    // Execute batch update
    if (pendingUpdates.length >= BATCH_SIZE || (i === ids.length - 1 && pendingUpdates.length > 0)) {
        console.log(`[BATCH] Flushing ${pendingUpdates.length} updates to Turso...`);
        const statements = pendingUpdates.map(u => ({
            sql: `
                UPDATE lighthouses 
                SET 
                    year_built = CASE WHEN year_built = 0 THEN ? ELSE year_built END,
                    height = CASE WHEN height = 0 THEN ? ELSE height END,
                    description = CASE WHEN description = '' THEN ? ELSE description END,
                    image = CASE WHEN image LIKE '%via.placeholder.com%' AND ? IS NOT NULL THEN ? ELSE image END,
                    image_author = CASE WHEN image LIKE '%via.placeholder.com%' AND ? IS NOT NULL THEN ? ELSE image_author END,
                    image_license = CASE WHEN image LIKE '%via.placeholder.com%' AND ? IS NOT NULL THEN ? ELSE image_license END,
                    image_url = CASE WHEN image LIKE '%via.placeholder.com%' AND ? IS NOT NULL THEN ? ELSE image_url END,
                    source = 'Wikidata'
                WHERE id = ?
            `,
            args: [
                u.year, u.height, u.description, 
                u.imageUrl, u.imageUrl, 
                u.imageUrl, u.imageAuthor,
                u.imageUrl, u.imageLicense,
                u.imageUrl, u.imagePageUrl,
                u.id
            ]
        }));

        try {
            await client.batch(statements, "write");
            console.log(`[SUCCESS] Batch of ${pendingUpdates.length} committed.`);
        } catch (e: any) {
            console.error(`[ERROR] Batch failed: ${e.message}`);
        }
        pendingUpdates = [];
    }
    
    if (i > 0 && i % 100 === 0) {
        console.log(`Checked ${i}/${ids.length} candidates.`);
    }
  }

  console.log(`[${new Date().toISOString()}] Enrichment complete.`);
}

run().catch(console.error).finally(() => client.close());
