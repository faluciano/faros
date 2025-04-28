package models

// Lighthouse represents a lighthouse in the database
type Lighthouse struct {
	ID        string  `json:"id"`
	Name      string  `json:"name"`
	Country   string  `json:"country"`
	State     string  `json:"state"`
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
}
