package handlers

import (
	"bytes"
	"compress/gzip"
	"crypto/sha256"
	"encoding/json"
	"fmt"
	"lighthouse-backend/schemas"
	"lighthouse-backend/utils"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"
)

const lighthouseMapCacheTTL = 30 * time.Minute

type lighthouseMapPayload struct {
	raw        []byte
	compressed []byte
	etag       string
}

func (h *LighthouseHandler) WarmMapCache() error {
	_, err := h.getLighthouseMapPayload()
	return err
}

// GetLighthouseMap godoc
// @Summary     Get lighthouse map data
// @Description Get cached, compressed GeoJSON containing only lighthouse IDs and coordinates
// @Tags        lighthouses
// @Produce     json
// @Success     200 {object} schemas.LighthouseMapData
// @Success     304
// @Failure     500 {object} utils.APIError
// @Router      /api/lighthouses/map [get]
func (h *LighthouseHandler) GetLighthouseMap(w http.ResponseWriter, r *http.Request) {
	if h.db == nil {
		utils.WriteError(w, http.StatusInternalServerError, "database connection not available")
		return
	}

	payload, err := h.getLighthouseMapPayload()
	if err != nil {
		log.Printf("get lighthouse map payload: %v", err)
		utils.WriteError(w, http.StatusInternalServerError, "failed to retrieve lighthouse map data")
		return
	}

	w.Header().Set("Content-Type", "application/geo+json")
	w.Header().Set("Cache-Control", "public, max-age=300, stale-while-revalidate=86400")
	w.Header().Set("ETag", payload.etag)
	w.Header().Add("Vary", "Accept-Encoding")

	if r.Header.Get("If-None-Match") == payload.etag {
		w.WriteHeader(http.StatusNotModified)
		return
	}

	body := payload.raw
	if acceptsGzip(r.Header.Get("Accept-Encoding")) {
		w.Header().Set("Content-Encoding", "gzip")
		body = payload.compressed
	}

	if _, err := w.Write(body); err != nil {
		log.Printf("write lighthouse map payload: %v", err)
	}
}

func (h *LighthouseHandler) getLighthouseMapPayload() (lighthouseMapPayload, error) {
	h.mapCache.mu.Lock()
	defer h.mapCache.mu.Unlock()

	if len(h.mapCache.raw) > 0 && time.Now().Before(h.mapCache.expiresAt) {
		return lighthouseMapPayload{
			raw:        h.mapCache.raw,
			compressed: h.mapCache.compressed,
			etag:       h.mapCache.etag,
		}, nil
	}

	points, err := h.db.GetLighthouseMapPoints()
	if err != nil {
		return lighthouseMapPayload{}, err
	}

	data := schemas.LighthouseMapData{
		Type:     "FeatureCollection",
		Features: make([]schemas.LighthouseMapFeature, 0, len(points)),
	}
	for _, point := range points {
		data.Features = append(data.Features, schemas.LighthouseMapFeature{
			Type: "Feature",
			ID:   point.ID,
			Geometry: schemas.LighthouseMapGeometry{
				Type:        "Point",
				Coordinates: [2]float64{point.Longitude, point.Latitude},
			},
			Properties: schemas.LighthouseMapProperties{},
		})
	}

	raw, err := json.Marshal(data)
	if err != nil {
		return lighthouseMapPayload{}, fmt.Errorf("marshal lighthouse map data: %w", err)
	}

	var compressed bytes.Buffer
	writer, err := gzip.NewWriterLevel(&compressed, gzip.BestSpeed)
	if err != nil {
		return lighthouseMapPayload{}, fmt.Errorf("create lighthouse map compressor: %w", err)
	}
	if _, err := writer.Write(raw); err != nil {
		writer.Close()
		return lighthouseMapPayload{}, fmt.Errorf("compress lighthouse map data: %w", err)
	}
	if err := writer.Close(); err != nil {
		return lighthouseMapPayload{}, fmt.Errorf("finish lighthouse map compression: %w", err)
	}

	hash := sha256.Sum256(raw)
	etag := fmt.Sprintf(`W/"%x"`, hash[:16])

	h.mapCache.raw = raw
	h.mapCache.compressed = compressed.Bytes()
	h.mapCache.etag = etag
	h.mapCache.expiresAt = time.Now().Add(lighthouseMapCacheTTL)

	return lighthouseMapPayload{
		raw:        h.mapCache.raw,
		compressed: h.mapCache.compressed,
		etag:       h.mapCache.etag,
	}, nil
}

func acceptsGzip(header string) bool {
	for _, value := range strings.Split(header, ",") {
		parts := strings.Split(value, ";")
		if strings.TrimSpace(parts[0]) != "gzip" {
			continue
		}
		for _, parameter := range parts[1:] {
			name, value, found := strings.Cut(strings.TrimSpace(parameter), "=")
			if !found || name != "q" {
				continue
			}
			quality, err := strconv.ParseFloat(value, 64)
			if err == nil && quality == 0 {
				return false
			}
		}
		return true
	}
	return false
}
