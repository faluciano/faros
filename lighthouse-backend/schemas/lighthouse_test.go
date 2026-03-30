package schemas

import (
	"encoding/json"
	"testing"
)

func TestLighthouseSchema(t *testing.T) {
	l := Lighthouse{
		ID:                   "test-id",
		Name:                 "Test Lighthouse",
		Country:              "USA",
		State:                "Florida",
		Latitude:             25.0,
		Longitude:            -80.0,
		Image:                "test.jpg",
		Height:               45.5,
		YearBuilt:            1875,
		LightCharacteristics: "Fl W 5s",
		Description:          "A historic lighthouse.",
	}

	data, err := json.Marshal(l)
	if err != nil {
		t.Fatalf("Failed to marshal lighthouse: %v", err)
	}

	var m map[string]interface{}
	if err := json.Unmarshal(data, &m); err != nil {
		t.Fatalf("Failed to unmarshal lighthouse: %v", err)
	}

	expectedFields := []string{"height", "year_built", "light_characteristics", "description"}
	for _, field := range expectedFields {
		if _, ok := m[field]; !ok {
			t.Errorf("Field %s missing from JSON output", field)
		}
	}
}

func TestLighthouseSummarySchema(t *testing.T) {
	s := LighthouseSummary{
		ID:        "1",
		Name:      "LH 1",
		Latitude:  10.0,
		Longitude: 20.0,
	}

	data, err := json.Marshal(s)
	if err != nil {
		t.Fatalf("Failed to marshal summary: %v", err)
	}

	var m map[string]interface{}
	json.Unmarshal(data, &m)

	if _, ok := m["height"]; ok {
		t.Error("Summary should not contain height")
	}
}
