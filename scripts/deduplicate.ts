import { createClient } from "@libsql/client";
import { join } from "path";
import * as dotenv from "dotenv";

const envPath = join(process.cwd(), "lighthouse-backend", ".env");
dotenv.config({ path: envPath });

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

const client = createClient({ url, authToken });

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371e3; // meters
    const phi1 = lat1 * Math.PI/180;
    const phi2 = lat2 * Math.PI/180;
    const deltaPhi = (lat2-lat1) * Math.PI/180;
    const deltaLambda = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(deltaPhi/2) * Math.sin(deltaPhi/2) +
              Math.cos(phi1) * Math.cos(phi2) *
              Math.sin(deltaLambda/2) * Math.sin(deltaLambda/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
}

async function run() {
    console.log("Fetching all lighthouses for spatial deduplication...");
    const result = await client.execute("SELECT id, name, latitude, longitude, image, height, year_built, description, source FROM lighthouses");
    const lighthouses = result.rows as any[];
    console.log(`Analyzing ${lighthouses.length} entries...`);

    const toDelete: string[] = [];
    const processed = new Set<string>();

    for (let i = 0; i < lighthouses.length; i++) {
        const l1 = lighthouses[i];
        if (processed.has(l1.id)) continue;

        for (let j = i + 1; j < lighthouses.length; j++) {
            const l2 = lighthouses[j];
            if (processed.has(l2.id)) continue;

            const dist = calculateDistance(l1.latitude, l1.longitude, l2.latitude, l2.longitude);
            
            if (dist < 50) {
                console.log(`[Duplicate] "${l1.name}" and "${l2.name}" (Dist: ${dist.toFixed(1)}m)`);
                
                let keep = l1;
                let remove = l2;

                const l1HasImage = !l1.image.includes("via.placeholder.com");
                const l2HasImage = !l2.image.includes("via.placeholder.com");

                // Priority: Wikidata > OSMLighthouse > placeholder
                if (l2.source === 'Wikidata' && l1.source !== 'Wikidata') {
                    keep = l2; remove = l1;
                } else if (l2HasImage && !l1HasImage) {
                    keep = l2; remove = l1;
                }

                // 1. Merge metadata into 'keep'
                const updates: any = {};
                if (keep.height === 0 && remove.height > 0) updates.height = remove.height;
                if (keep.year_built === 0 && remove.year_built > 0) updates.year_built = remove.year_built;
                if (keep.description === "" && remove.description !== "") updates.description = remove.description;
                if (keep.image.includes("via.placeholder.com") && l2HasImage) updates.image = remove.image;

                if (Object.keys(updates).length > 0) {
                    const sets = Object.keys(updates).map(k => `${k} = ?`).join(", ");
                    const args = [...Object.values(updates), keep.id];
                    await client.execute({ sql: `UPDATE lighthouses SET ${sets} WHERE id = ?`, args });
                }

                // 2. Re-parent user associations (FK SAFETY)
                // Use INSERT OR IGNORE to move associations to the 'keep' ID, then we can delete 'remove'
                await client.execute({
                    sql: "UPDATE OR IGNORE user_visited_lighthouse SET lighthouse_id = ? WHERE lighthouse_id = ?",
                    args: [keep.id, remove.id]
                });
                await client.execute({
                    sql: "UPDATE OR IGNORE user_wishlist_lighthouse SET lighthouse_id = ? WHERE lighthouse_id = ?",
                    args: [keep.id, remove.id]
                });
                
                // Clean up any remaining associations that couldn't be moved due to duplicates
                await client.execute({ sql: "DELETE FROM user_visited_lighthouse WHERE lighthouse_id = ?", args: [remove.id] });
                await client.execute({ sql: "DELETE FROM user_wishlist_lighthouse WHERE lighthouse_id = ?", args: [remove.id] });

                toDelete.push(remove.id);
                processed.add(remove.id);
            }
        }
        processed.add(l1.id);
    }

    console.log(`Identified ${toDelete.length} duplicates to remove.`);

    if (toDelete.length > 0) {
        const BATCH_SIZE = 50;
        for (let i = 0; i < toDelete.length; i += BATCH_SIZE) {
            const batch = toDelete.slice(i, i + BATCH_SIZE);
            const sql = `DELETE FROM lighthouses WHERE id IN (${batch.map(() => "?").join(",")})`;
            await client.execute({ sql, args: batch });
            console.log(`Deleted batch ${i + batch.length}/${toDelete.length}`);
        }
    }

    console.log("Deduplication complete.");
}

run().catch(console.error).finally(() => client.close());
