package schemas

// Lighthouse represents a lighthouse location
// @Description A lighthouse with its geographical information and metadata
type Lighthouse struct {
	// @Description Unique identifier for the lighthouse
	ID string `json:"id"`
	// @Description Name of the lighthouse
	Name string `json:"name"`
	// @Description Latitude coordinate of the lighthouse
	Latitude float64 `json:"latitude"`
	// @Description Longitude coordinate of the lighthouse
	Longitude float64 `json:"longitude"`
	// @Description URL to the lighthouse image
	Image string `json:"image"`
	// @Description State or province where the lighthouse is located
	State string `json:"state"`
	// @Description Country where the lighthouse is located
	Country string `json:"country"`
	// @Description Height of the lighthouse in meters
	Height float64 `json:"height"`
	// @Description Year the lighthouse was built
	YearBuilt int `json:"year_built"`
	// @Description Characteristics of the lighthouse's light
	LightCharacteristics string `json:"light_characteristics"`
	// @Description Brief historical description of the lighthouse
	Description string `json:"description"`
}

// LighthouseSummary represents a lightweight lighthouse for map markers
// @Description A minimal lighthouse object for high-performance map rendering
type LighthouseSummary struct {
	ID        string  `json:"id"`
	Name      string  `json:"name"`
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
	Image     string  `json:"image"`
	State     string  `json:"state"`
	Country   string  `json:"country"`
}
