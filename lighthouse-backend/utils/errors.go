package utils

import (
	"encoding/json"
	"net/http"
)

// APIError represents a standard API error response.
type APIError struct {
	Status  int    `json:"status"`
	Message string `json:"message"`
}

// WriteError sends a standardized JSON error response.
func WriteError(w http.ResponseWriter, status int, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(APIError{Status: status, Message: message})
}
