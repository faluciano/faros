package schemas

// Lighthouse struct
type Lighthouse struct {
	Name        string `json:"name"`
	Coordinates string `json:"coordinates"`
	Stamped     bool   `json:"stamped"`
	Hours       string `json:"hours"`
	Image       string `json:"image"`
}
