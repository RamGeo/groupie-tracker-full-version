package handlers

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"net/url"
	"strings"
	"os"
)

// Cache variables
var geocodeCache = make(map[string]struct {
	lat float64
	lng float64
})

type GeocodeResponse struct {
	Results []struct {
		Geometry struct {
			Location struct {
				Lat float64 `json:"lat"`
				Lng float64 `json:"lng"`
			} `json:"location"`
		} `json:"geometry"`
	} `json:"results"`
}

// Function to handle map requests
func HandleMap(w http.ResponseWriter, r *http.Request) {
    // Validate parameters
    if r.URL.Query().Get("artist") == "" || r.URL.Query().Get("locations") == "" {
        http.Error(w, "Missing artist or locations parameters", http.StatusBadRequest)
        return
    }

	
    // Add cache-control headers here
    w.Header().Set("Cache-Control", "no-cache, no-store, must-revalidate")
    w.Header().Set("Pragma", "no-cache")
    w.Header().Set("Expires", "0")


	http.ServeFile(w, r, "templates/map.html")
}

// GeocodeLocation is exported (starts with capital letter)
func GeocodeLocation(location string) (float64, float64, error) {
	// Check cache first
	if cached, exists := geocodeCache[location]; exists {
		return cached.lat, cached.lng, nil
	}

	apiKey := os.Getenv("GOOGLE_MAPS_API_KEY")
	if apiKey == "" {
    return 0, 0, fmt.Errorf("Google Maps API key not configured")
}
	baseURL := "https://maps.googleapis.com/maps/api/geocode/json"

	// Format the location for geocoding
	formattedLoc := formatLocationForGeocoding(location)

	// Create request URL
	requestURL := fmt.Sprintf("%s?address=%s&key=%s", baseURL, url.QueryEscape(formattedLoc), apiKey)

	// Make the request
	resp, err := http.Get(requestURL)
	if err != nil {
		return 0, 0, err
	}
	defer resp.Body.Close()

	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return 0, 0, err
	}

	var geocodeResp GeocodeResponse
	if err := json.Unmarshal(body, &geocodeResp); err != nil {
		return 0, 0, err
	}

	if len(geocodeResp.Results) == 0 {
		return 0, 0, fmt.Errorf("no results found for location: %s", location)
	}

	lat := geocodeResp.Results[0].Geometry.Location.Lat
	lng := geocodeResp.Results[0].Geometry.Location.Lng

	// Store in cache before returning
	geocodeCache[location] = struct {
		lat float64
		lng float64
	}{lat, lng}

	return lat, lng, nil
}

// Locations formatting for the map
func formatLocationForGeocoding(location string) string {
	// Remove asterisks and underscores
	cleanLoc := strings.ReplaceAll(location, "*", "")
	cleanLoc = strings.ReplaceAll(cleanLoc, "_", " ")
	
	// Split city and country if exists
	parts := strings.Split(cleanLoc, "-")
	if len(parts) > 1 {
		return fmt.Sprintf("%s,%s", strings.TrimSpace(parts[0]), strings.TrimSpace(parts[1]))
	}
	return cleanLoc
}