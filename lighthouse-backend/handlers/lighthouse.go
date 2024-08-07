package handlers

import (
	"encoding/json"
	"lighthouse-backend/db"
	"net/http"
)

func GetLighthouses(w http.ResponseWriter, r *http.Request) {

	if r.URL.Query().Get("country") != "" {
		country := r.URL.Query().Get("country")
		lighthousesFromdb, err := db.GetLighthousesByCountry(country)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		json.NewEncoder(w).Encode(lighthousesFromdb)
		return
	}

	if r.URL.Query().Get("state") != "" {
		state := r.URL.Query().Get("state")
		lighthousesFromdb, err := db.GetLighthousesByState(state)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		json.NewEncoder(w).Encode(lighthousesFromdb)
		return
	}

	lighthousesFromdb, err := db.GetLighthouses()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(lighthousesFromdb)
}
