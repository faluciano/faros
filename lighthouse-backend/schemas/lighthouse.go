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
}
