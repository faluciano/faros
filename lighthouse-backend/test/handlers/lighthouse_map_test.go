package handlers_test

import (
	"compress/gzip"
	"encoding/json"
	"io"
	"lighthouse-backend/handlers"
	"lighthouse-backend/schemas"
	"lighthouse-backend/test/mocks"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestGetLighthouseMap(t *testing.T) {
	handler := handlers.NewLighthouseHandler(mocks.NewMockDB())
	request := httptest.NewRequest(http.MethodGet, "/api/lighthouses/map", nil)
	request.Header.Set("Accept-Encoding", "gzip")
	response := httptest.NewRecorder()

	handler.GetLighthouseMap(response, request)

	if response.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d", response.Code, http.StatusOK)
	}
	if response.Header().Get("Content-Encoding") != "gzip" {
		t.Fatalf("Content-Encoding = %q, want gzip", response.Header().Get("Content-Encoding"))
	}
	if response.Header().Get("Cache-Control") == "" || response.Header().Get("ETag") == "" {
		t.Fatal("map response is missing cache headers")
	}

	reader, err := gzip.NewReader(response.Body)
	if err != nil {
		t.Fatalf("gzip.NewReader() error = %v", err)
	}
	defer reader.Close()
	body, err := io.ReadAll(reader)
	if err != nil {
		t.Fatalf("read compressed response: %v", err)
	}

	var data schemas.LighthouseMapData
	if err := json.Unmarshal(body, &data); err != nil {
		t.Fatalf("decode map response: %v", err)
	}
	if data.Type != "FeatureCollection" || len(data.Features) != 3 {
		t.Fatalf("map data = %#v, want 3-feature collection", data)
	}
	if data.Features[0].Geometry.Type != "Point" {
		t.Fatalf("geometry type = %q, want Point", data.Features[0].Geometry.Type)
	}
	if data.Features[0].Properties.ID == "" {
		t.Fatal("map feature is missing its application ID property")
	}

	cachedRequest := httptest.NewRequest(http.MethodGet, "/api/lighthouses/map", nil)
	cachedRequest.Header.Set("If-None-Match", response.Header().Get("ETag"))
	cachedResponse := httptest.NewRecorder()
	handler.GetLighthouseMap(cachedResponse, cachedRequest)
	if cachedResponse.Code != http.StatusNotModified {
		t.Fatalf("cached status = %d, want %d", cachedResponse.Code, http.StatusNotModified)
	}
}
