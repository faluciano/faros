package handlers

import (
	"encoding/json"
	"lighthouse-backend/db"
	"net/http"
)

func GetLighthouses(w http.ResponseWriter, r *http.Request) {
	lighthousesFromdb, err := db.GetLighthouses()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(lighthousesFromdb)
}
