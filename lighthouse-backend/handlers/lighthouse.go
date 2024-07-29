package handlers

import (
	"encoding/json"
	"lighthouse-backend/schemas"
	"net/http"
)

var lighthouses = []schemas.Lighthouse{
	{Name: "Lighthouse 1", Coordinates: "37.7749,-122.4194", Stamped: true, Hours: "9 AM - 5 PM", Image: "image1.jpg"},
	{Name: "Lighthouse 2", Coordinates: "37.8199,-122.4783", Stamped: false, Hours: "10 AM - 6 PM", Image: "image2.jpg"},
}

func GetLighthouses(w http.ResponseWriter, r *http.Request) {
	json.NewEncoder(w).Encode(lighthouses)
}
