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
		description TEXT,
		source TEXT DEFAULT 'OpenStreetMap',
		image_author TEXT DEFAULT '',
		image_license TEXT DEFAULT '',
		image_url TEXT DEFAULT ''
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
		Source:               "Wikidata",
		ImageAuthor:          "Photographer",
		ImageLicense:         "CC-BY-SA",
		ImageURL:             "https://example.com/lh1",
	}
	_, err = db_f.Exec(`INSERT INTO lighthouses 
		(id, name, country, state, latitude, longitude, image, height, year_built, light_characteristics, description, source, image_author, image_license, image_url)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		lh.ID, lh.Name, lh.Country, lh.State, lh.Latitude, lh.Longitude, lh.Image, lh.Height, lh.YearBuilt, lh.LightCharacteristics, lh.Description, lh.Source, lh.ImageAuthor, lh.ImageLicense, lh.ImageURL)
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
	if l.Source != "Wikidata" {
		t.Errorf("Expected source 'Wikidata', got '%s'", l.Source)
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
		description TEXT,
		source TEXT DEFAULT 'OpenStreetMap',
		image_author TEXT DEFAULT '',
		image_license TEXT DEFAULT '',
		image_url TEXT DEFAULT ''
	)`)

	_, err = db_f.Exec(`INSERT INTO lighthouses (id, name, latitude, longitude, image, state, country) VALUES (?, ?, ?, ?, ?, ?, ?)`, "1", "LH 1", 10.0, 20.0, "img.jpg", "FL", "USA")

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

func TestDBImplGetLighthouseMapPoints(t *testing.T) {
	testDBPath := "file:db_map_points_test.db"
	defer os.Remove("db_map_points_test.db")

	dbFile, err := sql.Open("libsql", testDBPath)
	if err != nil {
		t.Fatalf("Failed to open test database: %v", err)
	}
	defer dbFile.Close()

	if _, err := dbFile.Exec(`CREATE TABLE lighthouses (
		id TEXT PRIMARY KEY,
		latitude REAL,
		longitude REAL
	)`); err != nil {
		t.Fatalf("Failed to create lighthouses table: %v", err)
	}
	if _, err := dbFile.Exec(
		`INSERT INTO lighthouses (id, latitude, longitude) VALUES (?, ?, ?)`,
		"map-1",
		12.5,
		-45.25,
	); err != nil {
		t.Fatalf("Failed to insert map point: %v", err)
	}

	points, err := NewDB(dbFile).GetLighthouseMapPoints()
	if err != nil {
		t.Fatalf("GetLighthouseMapPoints() error = %v", err)
	}
	if len(points) != 1 || points[0].ID != "map-1" {
		t.Fatalf("map points = %#v, want map-1", points)
	}
}

func TestDBImplGetUserMapState(t *testing.T) {
	testDBPath := "file:db_map_state_test.db"
	defer os.Remove("db_map_state_test.db")

	dbFile, err := sql.Open("libsql", testDBPath)
	if err != nil {
		t.Fatalf("Failed to open test database: %v", err)
	}
	defer dbFile.Close()

	statements := []string{
		`CREATE TABLE user_visited_lighthouse (user_id TEXT, lighthouse_id TEXT)`,
		`CREATE TABLE user_wishlist_lighthouse (user_id TEXT, lighthouse_id TEXT)`,
		`INSERT INTO user_visited_lighthouse (user_id, lighthouse_id) VALUES ('user-1', 'visited-1')`,
		`INSERT INTO user_wishlist_lighthouse (user_id, lighthouse_id) VALUES ('user-1', 'wishlist-1')`,
	}
	for _, statement := range statements {
		if _, err := dbFile.Exec(statement); err != nil {
			t.Fatalf("prepare map state: %v", err)
		}
	}

	state, err := NewDB(dbFile).GetUserMapState("user-1")
	if err != nil {
		t.Fatalf("GetUserMapState() error = %v", err)
	}
	if len(state.VisitedIDs) != 1 || state.VisitedIDs[0] != "visited-1" {
		t.Fatalf("visited IDs = %#v, want visited-1", state.VisitedIDs)
	}
	if len(state.WishlistIDs) != 1 || state.WishlistIDs[0] != "wishlist-1" {
		t.Fatalf("wishlist IDs = %#v, want wishlist-1", state.WishlistIDs)
	}
}
