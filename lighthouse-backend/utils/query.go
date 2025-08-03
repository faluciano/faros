package utils

import (
	"net/http"
	"strconv"
	"strings"
)

// GetStringParam retrieves a string query parameter with a default value
func GetStringParam(r *http.Request, key string, defaultValue string) string {
	if value := r.URL.Query().Get(key); value != "" {
		return strings.TrimSpace(value)
	}
	return defaultValue
}

// GetIntParam retrieves an integer query parameter with a default value
func GetIntParam(r *http.Request, key string, defaultValue int) (int, error) {
	if value := r.URL.Query().Get(key); value != "" {
		return strconv.Atoi(strings.TrimSpace(value))
	}
	return defaultValue, nil
}

// GetBoolParam retrieves a boolean query parameter with a default value
func GetBoolParam(r *http.Request, key string, defaultValue bool) bool {
	if value := r.URL.Query().Get(key); value != "" {
		switch strings.ToLower(strings.TrimSpace(value)) {
		case "true", "1", "yes", "on":
			return true
		case "false", "0", "no", "off":
			return false
		}
	}
	return defaultValue
}

// ValidateRequiredParams checks if all required query parameters are present
func ValidateRequiredParams(r *http.Request, requiredParams []string) []string {
	var missing []string
	query := r.URL.Query()

	for _, param := range requiredParams {
		if value := query.Get(param); value == "" {
			missing = append(missing, param)
		}
	}

	return missing
}

// ValidateMaxLength validates that query parameters don't exceed maximum length
func ValidateMaxLength(r *http.Request, params map[string]int) map[string]string {
	errors := make(map[string]string)
	query := r.URL.Query()

	for param, maxLen := range params {
		if value := query.Get(param); value != "" && len(value) > maxLen {
			errors[param] = "exceeds maximum length of " + strconv.Itoa(maxLen)
		}
	}

	return errors
}
