// The database every script in this folder works on: a local SQLite file
// built from the published lighthouse data by load_work_db.ts. It is a
// scratch copy, not a source of truth, and is not committed.
import { existsSync } from "fs";
import { openWorkDB, WORK_DB_PATH } from "./workdb";

if (!existsSync(WORK_DB_PATH)) {
  console.error("No working database yet. Run this first, from the repo root:\n\n  bun run scripts/load_work_db.ts\n");
  process.exit(1);
}

export const client = openWorkDB();
