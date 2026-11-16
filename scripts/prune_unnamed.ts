import { client } from "./client";

async function run() {
  console.log("Pruning unnamed lighthouses from the working database...");
  
  // Using a more inclusive pattern for unnamed entries
  const result = await client.execute("DELETE FROM lighthouses WHERE name LIKE 'Lighthouse %' OR name GLOB 'Lighthouse [0-9]*'");
  
  console.log(`Successfully pruned lighthouses. Rows affected: ${result.rowsAffected}`);
  
  const count = await client.execute("SELECT COUNT(*) as total FROM lighthouses");
  console.log(`Current lighthouse count in the working database: ${count.rows[0].total}`);
}

run().catch(console.error).finally(() => client.close());
