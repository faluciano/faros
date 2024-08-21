package schemas

type User struct {
	ID                 string   `json:"id"`
	Username           string   `json:"username"`
	VisitedLightHouses []string `json:"visitedLightHouses"`
	StampedLightHouses []string `json:"stampedLightHouses"`
	Friends            []string `json:"friends"`
	SavedLightHouses   []string `json:"savedLightHouses"`
}
