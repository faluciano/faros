import { Database } from "bun:sqlite";
import { join } from "path";

const dbPath = join(process.cwd(), "lighthouse-backend", "lighthouse.db");
console.log(`Using database at: ${dbPath}`);

const db = new Database(dbPath);

// Create table with new fields
db.run(`
  CREATE TABLE IF NOT EXISTS lighthouses (
    id TEXT PRIMARY KEY,
    name TEXT,
    country TEXT,
    state TEXT,
    latitude REAL,
    longitude REAL,
    image TEXT,
    height REAL,
    year_built INTEGER,
    light_characteristics TEXT,
    description TEXT
  )
`);

const sampleData = [
  {
    id: "1",
    name: "Ponce de Leon Inlet Light",
    country: "USA",
    state: "Florida",
    latitude: 29.0805,
    longitude: -80.9169,
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Ponce_Inlet_Lighthouse_2013.jpg/800px-Ponce_Inlet_Lighthouse_2013.jpg",
    height: 53.0,
    year_built: 1887,
    light_characteristics: "Fixed white",
    description: "The tallest lighthouse in Florida."
  },
  {
    id: "2",
    name: "Cape Hatteras Light",
    country: "USA",
    state: "North Carolina",
    latitude: 35.2508,
    longitude: -75.5286,
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Cape_Hatteras_Lighthouse_2015.jpg/800px-Cape_Hatteras_Lighthouse_2015.jpg",
    height: 60.0,
    year_built: 1870,
    light_characteristics: "Fl W 7.5s",
    description: "The tallest brick lighthouse in the United States."
  },
  {
    id: "3",
    name: "Split Rock Lighthouse",
    country: "USA",
    state: "Minnesota",
    latitude: 47.2003,
    longitude: -91.3668,
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Split_Rock_Lighthouse_2010.jpg/800px-Split_Rock_Lighthouse_2010.jpg",
    height: 16.5,
    year_built: 1910,
    light_characteristics: "Fl W 10s",
    description: "One of the most photographed lighthouses in the US."
  }
];

const insert = db.prepare(`
  INSERT OR REPLACE INTO lighthouses (id, name, country, state, latitude, longitude, image, height, year_built, light_characteristics, description)
  VALUES ($id, $name, $country, $state, $latitude, $longitude, $image, $height, $year_built, $light_characteristics, $description)
`);

db.transaction((data) => {
  for (const item of data) {
    insert.run({
      $id: item.id,
      $name: item.name,
      $country: item.country,
      $state: item.state,
      $latitude: item.latitude,
      $longitude: item.longitude,
      $image: item.image,
      $height: item.height,
      $year_built: item.year_built,
      $light_characteristics: item.light_characteristics,
      $description: item.description
    });
  }
})(sampleData);

console.log("Successfully populated lighthouse data!");

// Verify
const result = db.query("SELECT name, height, year_built FROM lighthouses").all();
console.log("Current lighthouses in DB:", JSON.stringify(result, null, 2));

db.close();
