import { createClient } from "@libsql/client";
import { join } from "path";
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

async function run() {
  console.log("--- Turso Cloud Data Audit ---");
  
  const stats = await client.execute(`
    SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN image NOT LIKE '%via.placeholder.com%' THEN 1 END) as real_images,
        COUNT(CASE WHEN year_built > 0 THEN 1 END) as with_year,
        COUNT(CASE WHEN height > 0 THEN 1 END) as with_height,
        COUNT(CASE WHEN description != '' THEN 1 END) as with_desc,
        COUNT(CASE WHEN source = 'Wikidata' THEN 1 END) as wikidata_source
    FROM lighthouses
  `);
  
  const row = stats.rows[0];
  console.log(`Total Lighthouses: ${row.total}`);
  console.log(`Real Images:       ${row.real_images} (${((Number(row.real_images)/Number(row.total))*100).toFixed(1)}%)`);
  console.log(`Year Built:        ${row.with_year} (${((Number(row.with_year)/Number(row.total))*100).toFixed(1)}%)`);
  console.log(`Physical Height:   ${row.with_height} (${((Number(row.with_height)/Number(row.total))*100).toFixed(1)}%)`);
  console.log(`Descriptions:      ${row.with_desc} (${((Number(row.with_desc)/Number(row.total))*100).toFixed(1)}%)`);
}

run().catch(console.error).finally(() => client.close());
