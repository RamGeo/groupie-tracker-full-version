package handlers

import (
	"Groupie_Tracker/models"
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
)

// HandleFilter handles filter requests
func HandleFilter(w http.ResponseWriter, r *http.Request) {
	// Parse filter parameters from the request
	creationDateMin, _ := strconv.Atoi(r.URL.Query().Get("creationDateMin"))
	creationDateMax, _ := strconv.Atoi(r.URL.Query().Get("creationDateMax"))
	firstAlbumMin, _ := strconv.Atoi(r.URL.Query().Get("firstAlbumMin"))
	firstAlbumMax, _ := strconv.Atoi(r.URL.Query().Get("firstAlbumMax"))
	members := r.URL.Query()["members"]
	locations := r.URL.Query()["locations"]

	// Use shared data service with caching
	artists, err := GetDataService().GetArtists()
	if err != nil {
		Handle500(w, r, err)
		return
	}

	// Filter artists based on criteria
	var filteredArtists []models.Artist
	for _, artist := range artists {
		// Filter by creation date
		if creationDateMin > 0 && artist.CreationDate < creationDateMin {
			continue
		}
		if creationDateMax > 0 && artist.CreationDate > creationDateMax {
			continue
		}

		// Filter by first album date
		firstAlbumYear := 0
		if len(artist.FirstAlbum) > 4 {
			firstAlbumYear, _ = strconv.Atoi(artist.FirstAlbum[len(artist.FirstAlbum)-4:])
		}
		if firstAlbumMin > 0 && firstAlbumYear < firstAlbumMin {
			continue
		}
		if firstAlbumMax > 0 && firstAlbumYear > firstAlbumMax {
			continue
		}

		// Filter by number of members
		if len(members) > 0 {
			memberMatch := false
			memberCount := len(artist.Members)
			for _, m := range members {
				// Check if filter is for number of members
				if strings.Contains(m, " member") {
					count, _ := strconv.Atoi(strings.Split(m, " ")[0])
					if count == memberCount {
						memberMatch = true
						break
					}
				} else {
					// Check if filter is for specific member
					for _, artistMember := range artist.Members {
						if artistMember == m {
							memberMatch = true
							break
						}
					}
					if memberMatch {
						break
					}
				}
			}
			if !memberMatch {
				continue
			}
		}

		// Filter by locations
		if len(locations) > 0 {
			locationMatch := false
			for _, loc := range artist.Locations {
				// Format location as "City, COUNTRY"
				formattedLocation := formatLocation(loc)

				for _, filterLoc := range locations {
					if formattedLocation == filterLoc {
						locationMatch = true
						break
					}
				}
				if locationMatch {
					break
				}
			}
			if !locationMatch {
				continue
			}
		}

		// Artist passed all filters
		filteredArtists = append(filteredArtists, artist)
	}

	// Return filtered artists as JSON
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(filteredArtists)
}
