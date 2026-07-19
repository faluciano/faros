package schemas

type LighthouseMapPoint struct {
	ID        string
	Latitude  float64
	Longitude float64
}

type LighthouseMapProperties struct{}

type LighthouseMapGeometry struct {
	Type        string     `json:"type"`
	Coordinates [2]float64 `json:"coordinates"`
}

type LighthouseMapFeature struct {
	Type       string                  `json:"type"`
	ID         string                  `json:"id"`
	Geometry   LighthouseMapGeometry   `json:"geometry"`
	Properties LighthouseMapProperties `json:"properties"`
}

type LighthouseMapData struct {
	Type     string                 `json:"type"`
	Features []LighthouseMapFeature `json:"features"`
}

type UserMapState struct {
	VisitedIDs  []string `json:"visited_ids"`
	WishlistIDs []string `json:"wishlist_ids"`
}
