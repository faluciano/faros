import { client } from "./client";

async function run() {
  console.log("Searching for duplicates in the working database...");
  const result = await client.execute({
    sql: "SELECT id, name, latitude, longitude, image, height, source FROM lighthouses WHERE name LIKE '%Point Robinson%' OR name LIKE '%Cape Meares%'",
    args: []
  });
  console.log(JSON.stringify(result.rows, null, 2));
}

run().catch(console.error).finally(() => client.close());
