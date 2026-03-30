package db

import (
	"database/sql"
	"lighthouse-backend/schemas"
	"os"
	"testing"

	_ "github.com/tursodatabase/go-libsql"
)

func TestDBImplGetLighthouses(t *testing.T) {
	// Setup a temporary test database
	testDBPath := "file:db_impl_test.db"
	defer os.Remove("db_impl_test.db")

	db_f, err := sql.Open("libsql", testDBPath)
	if err != nil {
		t.Fatalf("Failed to open test database: %v", err)
	}
	defer db_f.Close()

	// Manually create lighthouses table with new fields
	_, err = db_f.Exec(`CREATE TABLE lighthouses (
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
	)`)
	if err != nil {
		t.Fatalf("Failed to create lighthouses table: %v", err)
	}

	// Insert a test lighthouse
	lh := schemas.Lighthouse{
		ID:                   "1",
		Name:                 "Test LH",
		Country:              "USA",
		State:                "FL",
		Latitude:             25.0,
		Longitude:            -80.0,
		Image:                "img.jpg",
		Height:               45.5,
		YearBuilt:            1875,
		LightCharacteristics: "Fl W 5s",
		Description:          "A nice one.",
	}
	_, err = db_f.Exec(`INSERT INTO lighthouses 
		(id, name, country, state, latitude, longitude, image, height, year_built, light_characteristics, description)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		lh.ID, lh.Name, lh.Country, lh.State, lh.Latitude, lh.Longitude, lh.Image, lh.Height, lh.YearBuilt, lh.LightCharacteristics, lh.Description)
	if err != nil {
		t.Fatalf("Failed to insert test data: %v", err)
	}

	d := NewDB(db_f)
	lighthouses, err := d.GetLighthouses()
	if err != nil {
		t.Fatalf("Failed to get lighthouses: %v", err)
	}

	if len(lighthouses) != 1 {
		t.Fatalf("Expected 1 lighthouse, got %d", len(lighthouses))
	}

	l := lighthouses[0]
	if l.Height != 45.5 {
		t.Errorf("Expected height 45.5, got %f", l.Height)
	}
	if l.YearBuilt != 1875 {
		t.Errorf("Expected year built 1875, got %d", l.YearBuilt)
	}
}

func TestDBImplGetLighthousesSummary(t *testing.T) {
	testDBPath := "file:db_summary_test.db"
	defer os.Remove("db_summary_test.db")

	db_f, err := sql.Open("libsql", testDBPath)
	if err != nil {
		t.Fatalf("Failed to open test database: %v", err)
	}
	defer db_f.Close()

	_, err = db_f.Exec(`CREATE TABLE lighthouses (
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
	)`)
	
	_, err = db_f.Exec(`INSERT INTO lighthouses (id, name, latitude, longitude) VALUES (?, ?, ?, ?)`, "1", "LH 1", 10.0, 20.0)

	d := NewDB(db_f)
	summaries, err := d.GetLighthousesSummary()
	if err != nil {
		t.Fatalf("Failed to get summaries: %v", err)
	}

	if len(summaries) != 1 {
		t.Fatalf("Expected 1 summary, got %d", len(summaries))
	}

	s := summaries[0]
	if s.Name != "LH 1" || s.Latitude != 10.0 {
		t.Errorf("Incorrect summary data: %+v", s)
	}
}
