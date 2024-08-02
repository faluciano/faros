package schemas

// Lighthouse struct
type Lighthouse struct {
	ID        string  `json:"id"`
	Name      string  `json:"name"`
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
	Image     string  `json:"image"`
	State     string  `json:"state"`
	Country   string  `json:"country"`
}
