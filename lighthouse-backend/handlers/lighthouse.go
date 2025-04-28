package handlers

import (
	"encoding/json"
	"lighthouse-backend/interfaces"
	"net/http"
)

// LighthouseHandler handles lighthouse-related requests
type LighthouseHandler struct {
	db interfaces.DBInterface
}

// NewLighthouseHandler creates a new LighthouseHandler
func NewLighthouseHandler(db interfaces.DBInterface) *LighthouseHandler {
	return &LighthouseHandler{db: db}
}

// @Summary     Get all lighthouses
// @Description Get a list of all lighthouses, optionally filtered by country or state
// @Tags        lighthouses
// @Produce     json
// @Param       country query    string false "Filter by country"
// @Param       state   query    string false "Filter by state"
// @Success     200     {array}  schemas.Lighthouse
// @Failure     500     {object} map[string]string
// @Router      /api/lighthouses [get]
func (h *LighthouseHandler) GetLighthouses(w http.ResponseWriter, r *http.Request) {
	if h.db == nil {
		http.Error(w, "database connection not available", http.StatusInternalServerError)
		return
	}

	if r.URL.Query().Get("country") != "" {
		country := r.URL.Query().Get("country")
		lighthousesFromdb, err := h.db.GetLighthousesByCountry(country)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		json.NewEncoder(w).Encode(lighthousesFromdb)
		return
	}

	if r.URL.Query().Get("state") != "" {
		state := r.URL.Query().Get("state")
		lighthousesFromdb, err := h.db.GetLighthousesByState(state)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		json.NewEncoder(w).Encode(lighthousesFromdb)
		return
	}

	lighthousesFromdb, err := h.db.GetLighthouses()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(lighthousesFromdb)
}
