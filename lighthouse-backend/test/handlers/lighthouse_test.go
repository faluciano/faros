package handlers_test

import (
	"encoding/json"
	"lighthouse-backend/handlers"
	"lighthouse-backend/models"
	"lighthouse-backend/test/mocks"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestGetLighthouses(t *testing.T) {
	// Create mock DB and handler
	mockDB := mocks.NewMockDB()
	handler := handlers.NewLighthouseHandler(mockDB)

	tests := []struct {
		name           string
		queryParams    map[string]string
		expectedStatus int
		expectedCount  int
	}{
		{
			name:           "Get all lighthouses",
			queryParams:    map[string]string{},
			expectedStatus: http.StatusOK,
			expectedCount:  3,
		},
		{
			name:           "Get lighthouses by country",
			queryParams:    map[string]string{"country": "USA"},
			expectedStatus: http.StatusOK,
			expectedCount:  2,
		},
		{
			name:           "Get lighthouses by state",
			queryParams:    map[string]string{"state": "California"},
			expectedStatus: http.StatusOK,
			expectedCount:  1,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Create request with query parameters
			req, err := http.NewRequest("GET", "/api/lighthouses", nil)
			if err != nil {
				t.Fatal(err)
			}

			// Add query parameters
			q := req.URL.Query()
			for key, value := range tt.queryParams {
				q.Add(key, value)
			}
			req.URL.RawQuery = q.Encode()

			// Create response recorder
			rr := httptest.NewRecorder()

			// Serve the request
			handler.GetLighthouses(rr, req)

			// Check status code
			if status := rr.Code; status != tt.expectedStatus {
				t.Errorf("handler returned wrong status code: got %v want %v",
					status, tt.expectedStatus)
			}

			// Check response format and count
			if tt.expectedStatus == http.StatusOK {
				var response []models.Lighthouse
				if err := json.NewDecoder(rr.Body).Decode(&response); err != nil {
					t.Errorf("handler returned invalid JSON: %v", err)
				}
				if len(response) != tt.expectedCount {
					t.Errorf("handler returned wrong number of lighthouses: got %v want %v",
						len(response), tt.expectedCount)
				}
			}
		})
	}
}

func TestGetLighthousesErrorHandling(t *testing.T) {
	// Create handler with nil DB to simulate error
	handler := handlers.NewLighthouseHandler(nil)

	req, err := http.NewRequest("GET", "/api/lighthouses", nil)
	if err != nil {
		t.Fatal(err)
	}

	rr := httptest.NewRecorder()
	handler.GetLighthouses(rr, req)

	if status := rr.Code; status != http.StatusInternalServerError {
		t.Errorf("handler returned wrong status code: got %v want %v",
			status, http.StatusInternalServerError)
	}
}
