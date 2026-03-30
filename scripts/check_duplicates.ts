import { createClient } from "@libsql/client";
import { join } from "path";
import * as dotenv from "dotenv";

const envPath = join(process.cwd(), "lighthouse-backend", ".env");
dotenv.config({ path: envPath });

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

const client = createClient({ url, authToken });

async function run() {
  console.log("Searching for duplicates in Turso...");
  const result = await client.execute({
    sql: "SELECT id, name, latitude, longitude, image, height, source FROM lighthouses WHERE name LIKE '%Point Robinson%' OR name LIKE '%Cape Meares%'",
    args: []
  });
  console.log(JSON.stringify(result.rows, null, 2));
}

run().catch(console.error).finally(() => client.close());
