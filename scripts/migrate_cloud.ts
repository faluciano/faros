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
  console.log("Applying migrations to Turso cloud...");
  
  await client.execute("ALTER TABLE lighthouses ADD COLUMN source TEXT DEFAULT 'OpenStreetMap'");
  console.log("Added 'source' column.");

  await client.execute("CREATE INDEX IF NOT EXISTS idx_lighthouses_lat_long ON lighthouses(latitude, longitude)");
  console.log("Created spatial index.");

  await client.execute("CREATE INDEX IF NOT EXISTS idx_lighthouses_source ON lighthouses(source)");
  console.log("Created source index.");

  console.log("Migration complete.");
}

run().catch(e => console.error("Migration failed:", e.message)).finally(() => client.close());
