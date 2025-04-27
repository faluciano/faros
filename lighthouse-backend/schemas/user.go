package schemas

// User represents a user in the system
// @Description A user with their basic information
type User struct {
	// @Description Unique identifier for the user
	ID string `json:"id"`
	// @Description User's first name
	FirstName string `json:"first_name"`
	// @Description User's last name
	LastName string `json:"last_name"`
	// @Description User's email address
	Email string `json:"email"`
}
