package handlers

import (
	json "encoding/json/v2"
	"lighthouse-backend/interfaces"
	"lighthouse-backend/schemas"
	"lighthouse-backend/utils"
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
// @Description Get a list of all lighthouses, optionally filtered by country and/or state
// @Tags        lighthouses
// @Produce     json
// @Param       country query    string false "Filter by country name"
// @Param       state   query    string false "Filter by state name (can be combined with country)"
// @Success     200     {array}  schemas.Lighthouse
// @Failure     400     {object} map[string]string
// @Failure     500     {object} map[string]string
// @Router      /api/lighthouses [get]
func (h *LighthouseHandler) GetLighthouses(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	if h.db == nil {
		utils.WriteError(w, http.StatusInternalServerError, "database connection not available")
		return
	}

	query := r.URL.Query()
	country := query.Get("country")
	state := query.Get("state")

	var lighthousesFromdb []schemas.Lighthouse
	var err error

	switch {
	case country != "" && state != "":
		// Filter by both country and state
		lighthousesFromdb, err = h.db.GetLighthousesByCountryAndState(country, state)
	case country != "":
		// Filter by country only
		lighthousesFromdb, err = h.db.GetLighthousesByCountry(country)
	case state != "":
		// Filter by state only
		lighthousesFromdb, err = h.db.GetLighthousesByState(state)
	default:
		// No filters - return all lighthouses
		lighthousesFromdb, err = h.db.GetLighthouses()
	}

	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "Failed to retrieve lighthouses")
		return
	}

	json.MarshalWrite(w, lighthousesFromdb)
}