package handlers

import (
	"database/sql"
	"encoding/json"
	"lighthouse-backend/db"
	"net/http"
)

var DB *sql.DB

// @Summary     Get all lighthouses
// @Description Get a list of all lighthouses, optionally filtered by country or state
// @Tags        lighthouses
// @Produce     json
// @Param       country query    string false "Filter by country"
// @Param       state   query    string false "Filter by state"
// @Success     200     {array}  schemas.Lighthouse
// @Failure     500     {object} map[string]string
// @Router      /api/lighthouses [get]
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
