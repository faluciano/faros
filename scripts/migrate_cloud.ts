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
  
  const execSafe = async (sql: string, successMsg: string) => {
      try {
          await client.execute(sql);
          console.log(successMsg);
      } catch(e: any) {
          if(e.message.includes('duplicate column name')) {
              console.log(`${successMsg} (Already exists)`);
          } else {
              console.error(`Error executing: ${sql}`, e.message);
          }
      }
  };

  await execSafe("ALTER TABLE lighthouses ADD COLUMN source TEXT DEFAULT 'OpenStreetMap'", "Added 'source' column.");
  await execSafe("CREATE INDEX IF NOT EXISTS idx_lighthouses_lat_long ON lighthouses(latitude, longitude)", "Created spatial index.");
  await execSafe("CREATE INDEX IF NOT EXISTS idx_lighthouses_source ON lighthouses(source)", "Created source index.");

  await execSafe("ALTER TABLE lighthouses ADD COLUMN image_author TEXT DEFAULT ''", "Added 'image_author' column.");
  await execSafe("ALTER TABLE lighthouses ADD COLUMN image_license TEXT DEFAULT ''", "Added 'image_license' column.");
  await execSafe("ALTER TABLE lighthouses ADD COLUMN image_url TEXT DEFAULT ''", "Added 'image_url' column.");

  console.log("Migration complete.");
}

run().catch(e => console.error("Migration failed:", e.message)).finally(() => client.close());
