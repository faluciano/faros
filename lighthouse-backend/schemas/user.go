package schemas

type User struct {
	ID                 string   `json:"id"`
	Username           string   `json:"username"`
	VisitedLightHouses []string `json:"visitedLightHouses"`
}
