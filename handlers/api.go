package handlers

import (
	"encoding/json"
	"net/http"
	"os"
)

// HandleGeocode handles geocoding requests
func HandleGeocode(w http.ResponseWriter, r *http.Request) {
	location := r.URL.Query().Get("location")
	if location == "" {
		http.Error(w, "Missing location parameter", http.StatusBadRequest)
		return
	}

	lat, lng, err := GeocodeLocation(location)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	response := map[string]float64{
		"lat": lat,
		"lng": lng,
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// HandleAPIKey returns the Google Maps API key for JavaScript
func HandleAPIKey(w http.ResponseWriter, r *http.Request) {
	apiKey := os.Getenv("GOOGLE_MAPS_API_KEY")
	if apiKey == "" {
		http.Error(w, "Google Maps API key not configured", http.StatusInternalServerError)
		return
	}
	response := map[string]string{
		"apiKey": apiKey,
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

