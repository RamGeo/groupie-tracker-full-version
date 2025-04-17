package handlers

import (
	"Groupie_Tracker/models"
	"Groupie_Tracker/utils"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"
	"sync"
)

// Handle Search Request
var cachedArtists []models.Artist
var cacheMutex sync.Mutex

func HandleSearch(w http.ResponseWriter, r *http.Request) {
	searchTerm := r.URL.Query().Get("query")

	if searchTerm == "" {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode([]interface{}{})
		return
	}

	cacheMutex.Lock()
	if cachedArtists == nil {
		// Fetch artists data if not cached
		err := utils.FetchData("https://groupietrackers.herokuapp.com/api/artists", &cachedArtists)
		if err != nil {
			Handle500(w, r, err)
			cacheMutex.Unlock()
			return
		}
	}
	cacheMutex.Unlock()

	var wg sync.WaitGroup
	var mu sync.Mutex
	var prefixArtistSuggestions, partialArtistSuggestions []map[string]string
	var memberSuggestions, locationSuggestions, firstAlbumSuggestions, creationDateSuggestions, concertDateSuggestions, concertLocationSuggestions []map[string]string
	searchTermLower := strings.ToLower(searchTerm)

	for _, artist := range cachedArtists {
		wg.Add(1)
		go func(artist models.Artist) {
			defer wg.Done()

			// Fetch locations for the artist
			var locations models.Location
			err := utils.FetchData(artist.LocationsURL, &locations)
			if err != nil {
				log.Printf("Error fetching locations for artist %s: %v", artist.Name, err)
				return
			}

			// Fetch concert dates for the artist
			var dates models.Date
			err = utils.FetchData(artist.DatesURL, &dates)
			if err != nil {
				log.Printf("Error fetching dates for artist %s: %v", artist.Name, err)
				return
			}

			artistNameLower := strings.ToLower(artist.Name)

			// Check artist name for prefix matches
			if strings.HasPrefix(artistNameLower, searchTermLower) {
				mu.Lock()
				prefixArtistSuggestions = append(prefixArtistSuggestions, map[string]string{
					"label": artist.Name,
					"type":  "Artist",
				})
				mu.Unlock()
			} else if strings.Contains(artistNameLower, searchTermLower) {
				mu.Lock()
				partialArtistSuggestions = append(partialArtistSuggestions, map[string]string{
					"label": artist.Name,
					"type":  "Artist",
				})
				mu.Unlock()
			}

			// Check members
			for _, member := range artist.Members {
				if strings.Contains(strings.ToLower(member), searchTermLower) {
					mu.Lock()
					memberSuggestions = append(memberSuggestions, map[string]string{
						"label": artist.Name,
						"type":  "Member: " + member,
					})
					mu.Unlock()
				}
			}

			// Check creation date
			creationDate := strconv.Itoa(artist.CreationDate)
			if strings.Contains(creationDate, searchTermLower) {
				mu.Lock()
				creationDateSuggestions = append(creationDateSuggestions, map[string]string{
					"label": artist.Name,
					"type":  "Created in " + creationDate,
				})
				mu.Unlock()
			}

			// Check first album date
			if strings.Contains(strings.ToLower(artist.FirstAlbum), searchTermLower) {
				mu.Lock()
				firstAlbumSuggestions = append(firstAlbumSuggestions, map[string]string{
					"label": artist.Name,
					"type":  "First Album: " + artist.FirstAlbum,
				})
				mu.Unlock()
			}

			// Check locations
			for _, location := range locations.Locations {
				if strings.Contains(strings.ToLower(location), searchTermLower) {
					mu.Lock()
					locationSuggestions = append(locationSuggestions, map[string]string{
						"label": artist.Name,
						"type":  "Location: " + formatLocation(location),
					})
					mu.Unlock()
				}
			}

			// Check concert dates
			for _, date := range dates.Dates {
				if strings.Contains(strings.ToLower(date), searchTermLower) {
					mu.Lock()
					concertDateSuggestions = append(concertDateSuggestions, map[string]string{
						"label": artist.Name,
						"type":  "Concert Date: " + date,
					})
					mu.Unlock()
				}
			}

			// Check concert locations (e.g., "Greece")
			for _, location := range locations.Locations {
				if strings.Contains(strings.ToLower(location), searchTermLower) {
					mu.Lock()
					concertLocationSuggestions = append(concertLocationSuggestions, map[string]string{
						"label": artist.Name,
						"type":  "Concert Location: " + formatLocation(location),
					})
					mu.Unlock()
				}
			}
		}(artist)
	}

	// Wait for all goroutines to finish
	wg.Wait()

	// Combine all suggestions in the desired order
	suggestions := append(prefixArtistSuggestions, partialArtistSuggestions...)
	suggestions = append(suggestions, memberSuggestions...)
	suggestions = append(suggestions, locationSuggestions...)
	suggestions = append(suggestions, firstAlbumSuggestions...)
	suggestions = append(suggestions, creationDateSuggestions...)
	suggestions = append(suggestions, concertDateSuggestions...)
	suggestions = append(suggestions, concertLocationSuggestions...) // Concert locations have the lowest priority

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(suggestions)
}

// Helper function to format location (capitalize cities and countries)
func formatLocation(location string) string {
	// Replace underscores with spaces
	formattedLocation := strings.ReplaceAll(location, "_", " ")

	// Remove asterisks
	formattedLocation = strings.ReplaceAll(formattedLocation, "*", "")

	// Split into parts (city and country)
	parts := strings.Split(formattedLocation, "-")

	if len(parts) < 2 {
		// If there's no hyphen, just return the formatted location
		return strings.Title(strings.ToLower(formattedLocation))
	}

	city := parts[0]
	country := parts[1]

	// Capitalize each word in the city
	cityWords := strings.Split(city, " ")
	for j, word := range cityWords {
		// Capitalize the first letter of each word
		cityWords[j] = strings.Title(strings.ToLower(word))
	}
	formattedCity := strings.Join(cityWords, " ")

	// Make country uppercase and remove any remaining underscores
	formattedCountry := strings.ToUpper(strings.ReplaceAll(country, "_", " "))

	// Format as "City, COUNTRY"
	return fmt.Sprintf("%s, %s", formattedCity, formattedCountry)
}

// Helper function to check if any member exactly matches the search term
func containsExactMember(members []string, searchTerm string) bool {
	for _, member := range members {
		if strings.EqualFold(member, searchTerm) {
			return true
		}
	}
	return false
}
