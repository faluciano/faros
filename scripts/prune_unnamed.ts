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
  console.log("Pruning unnamed lighthouses from Turso cloud...");
  
  // Using a more inclusive pattern for unnamed entries
  const result = await client.execute("DELETE FROM lighthouses WHERE name LIKE 'Lighthouse %' OR name GLOB 'Lighthouse [0-9]*'");
  
  console.log(`Successfully pruned lighthouses. Rows affected: ${result.rowsAffected}`);
  
  const count = await client.execute("SELECT COUNT(*) as total FROM lighthouses");
  console.log(`Current lighthouse count in Turso: ${count.rows[0].total}`);
}

run().catch(console.error).finally(() => client.close());
