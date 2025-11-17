package handlers

import (
	"Groupie_Tracker/models"
	"Groupie_Tracker/utils"
	"sync"
	"time"
)

// DataService provides cached access to artist data
type DataService struct {
	artists     []models.Artist
	artistsMu   sync.RWMutex
	lastFetch   time.Time
	cacheExpiry time.Duration
}

var dataService *DataService
var dataServiceOnce sync.Once

// GetDataService returns the singleton data service instance
func GetDataService() *DataService {
	dataServiceOnce.Do(func() {
		dataService = &DataService{
			cacheExpiry: 5 * time.Minute, // Cache for 5 minutes
		}
	})
	return dataService
}

// GetArtists returns cached artists or fetches if cache is expired
func (ds *DataService) GetArtists() ([]models.Artist, error) {
	ds.artistsMu.RLock()
	needsRefresh := ds.artists == nil || time.Since(ds.lastFetch) > ds.cacheExpiry
	ds.artistsMu.RUnlock()

	if needsRefresh {
		return ds.refreshArtists()
	}

	ds.artistsMu.RLock()
	defer ds.artistsMu.RUnlock()
	// Return a copy to prevent external modifications
	result := make([]models.Artist, len(ds.artists))
	copy(result, ds.artists)
	return result, nil
}

// refreshArtists fetches and caches all artist data
func (ds *DataService) refreshArtists() ([]models.Artist, error) {
	ds.artistsMu.Lock()
	defer ds.artistsMu.Unlock()

	// Double-check after acquiring write lock
	if ds.artists != nil && time.Since(ds.lastFetch) <= ds.cacheExpiry {
		result := make([]models.Artist, len(ds.artists))
		copy(result, ds.artists)
		return result, nil
	}

	// Fetch artists list
	var artists []models.Artist
	if err := utils.FetchData("https://groupietrackers.herokuapp.com/api/artists", &artists); err != nil {
		return nil, err
	}

	// Fetch additional data for each artist concurrently
	var wg sync.WaitGroup
	var mu sync.Mutex
	var fetchErr error

	for i := range artists {
		wg.Add(1)
		go func(i int) {
			defer wg.Done()

			var locations models.Location
			var dates models.Date
			var relations models.Relation

			// Fetch locations
			if err := utils.FetchData(artists[i].LocationsURL, &locations); err != nil {
				mu.Lock()
				if fetchErr == nil {
					fetchErr = err
				}
				mu.Unlock()
				return
			}

			// Fetch dates
			if err := utils.FetchData(artists[i].DatesURL, &dates); err != nil {
				mu.Lock()
				if fetchErr == nil {
					fetchErr = err
				}
				mu.Unlock()
				return
			}

			// Fetch relations
			if err := utils.FetchData(artists[i].RelationURL, &relations); err != nil {
				mu.Lock()
				if fetchErr == nil {
					fetchErr = err
				}
				mu.Unlock()
				return
			}

			// Store the fetched data
			mu.Lock()
			artists[i].Locations = locations.Locations
			artists[i].Dates = dates.Dates
			artists[i].Relations = relations
			mu.Unlock()
		}(i)
	}

	wg.Wait()
	if fetchErr != nil {
		return nil, fetchErr
	}

	// Update cache
	ds.artists = artists
	ds.lastFetch = time.Now()

	// Return a copy
	result := make([]models.Artist, len(artists))
	copy(result, artists)
	return result, nil
}

// GetArtistsBasic returns only basic artist info (without fetching locations/dates/relations)
func (ds *DataService) GetArtistsBasic() ([]models.Artist, error) {
	ds.artistsMu.RLock()
	needsRefresh := ds.artists == nil || time.Since(ds.lastFetch) > ds.cacheExpiry
	ds.artistsMu.RUnlock()

	if needsRefresh {
		ds.artistsMu.Lock()
		defer ds.artistsMu.Unlock()

		// Double-check
		if ds.artists != nil && time.Since(ds.lastFetch) <= ds.cacheExpiry {
			result := make([]models.Artist, len(ds.artists))
			copy(result, ds.artists)
			return result, nil
		}

		var artists []models.Artist
		if err := utils.FetchData("https://groupietrackers.herokuapp.com/api/artists", &artists); err != nil {
			return nil, err
		}
		ds.artists = artists
		ds.lastFetch = time.Now()
	}

	ds.artistsMu.RLock()
	defer ds.artistsMu.RUnlock()
	result := make([]models.Artist, len(ds.artists))
	copy(result, ds.artists)
	return result, nil
}

