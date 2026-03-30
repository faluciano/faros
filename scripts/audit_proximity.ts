import { createClient } from "@libsql/client";
import { join } from "path";
import * as dotenv from "dotenv";

const envPath = join(process.cwd(), "lighthouse-backend", ".env");
dotenv.config({ path: envPath });

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

const client = createClient({ url, authToken });

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371e3;
    const phi1 = lat1 * Math.PI/180;
    const phi2 = lat2 * Math.PI/180;
    const deltaPhi = (lat2-lat1) * Math.PI/180;
    const deltaLambda = (lon2-lon1) * Math.PI/180;
    const a = Math.sin(deltaPhi/2) * Math.sin(deltaPhi/2) + Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda/2) * Math.sin(deltaLambda/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

async function run() {
    console.log("Analyzing potential false positives in current database...");
    const result = await client.execute("SELECT id, name, latitude, longitude FROM lighthouses");
    const lighthouses = result.rows as any[];

    let suspiciousCount = 0;
    for (let i = 0; i < lighthouses.length; i++) {
        for (let j = i + 1; j < lighthouses.length; j++) {
            const l1 = lighthouses[i];
            const l2 = lighthouses[j];
            const dist = calculateDistance(l1.latitude, l1.longitude, l2.latitude, l2.longitude);
            
            // Check for lighthouses within 100m that HAVE different names (suspicious)
            if (dist < 100) {
                const name1 = l1.name.toLowerCase();
                const name2 = l2.name.toLowerCase();
                
                // If names are very different, they might be different houses
                const word1 = name1.split(" ")[0];
                const word2 = name2.split(" ")[0];
                
                if (word1 !== word2 && !name1.includes(word2) && !name2.includes(word1)) {
                    console.log(`[Suspicious Proximity] "${l1.name}" vs "${l2.name}" (${dist.toFixed(1)}m)`);
                    suspiciousCount++;
                }
            }
        }
    }
    console.log(`Found ${suspiciousCount} suspicious pairs within 100m.`);
}

run().catch(console.error).finally(() => client.close());
