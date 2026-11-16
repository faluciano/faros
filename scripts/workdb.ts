// Where the scripts' scratch database lives, and how to open it.
import { createClient } from "@libsql/client";
import { join } from "path";

export const WORK_DB_PATH = join(process.cwd(), "scripts", ".work", "lighthouses.db");

export const openWorkDB = () => createClient({ url: `file:${WORK_DB_PATH}` });
