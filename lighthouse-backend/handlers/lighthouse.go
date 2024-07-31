package handlers

import (
	"encoding/json"
	"lighthouse-backend/schemas"
	"net/http"
)

var lighthouses = []schemas.Lighthouse{
	{
		ID:        0,
		Name:      "Westpoint Lighthouse",
		Latitude:  47.6620,
		Longitude: -122.4357,
		Image:     "https://www.seattleandsound.com/wp-content/uploads/2019/01/westpointlighthouse.jpg",
	},
	{
		ID:        1,
		Name:      "Point Robinson Lighthouse",
		Latitude:  47.3881,
		Longitude: -122.3750,
		Image:     "https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/Point_Robinson_Lighthouse.JPG/280px-Point_Robinson_Lighthouse.JPG",
	},
	{
		ID:        2,
		Name:      "Mukilteo Lighthouse",
		Latitude:  47.9488,
		Longitude: -122.3063,
		Image:     "https://www.seattleandsound.com/wp-content/uploads/2019/01/mukilteolighthouse.jpg",
	},
}

func GetLighthouses(w http.ResponseWriter, r *http.Request) {
	json.NewEncoder(w).Encode(lighthouses)
}
