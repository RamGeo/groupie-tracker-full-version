package handlers

import (
	"Groupie_Tracker/models"
	"Groupie_Tracker/utils"
	"encoding/json"
	"html/template"
	"log"
	"net/http"
	"sync"
)

// Convert data to JSON string
func toJSON(data interface{}) (string, error) {
	bytes, err := json.Marshal(data)
	if err != nil {
		return "", err
	}
	return string(bytes), nil
}

// Rendering Templates
var templates *template.Template
var templateErr error

func init() {
	templates, templateErr = template.New("").Funcs(template.FuncMap{
		"join": utils.JoinStrings,
		"json": toJSON,
	}).ParseFiles("templates/index.html")

	if templateErr != nil {
		log.Printf("Error parsing templates: %v", templateErr)
	}
}

// Handling error 404 - Page Not Found
func Handle404(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.Header().Set("X-Error-Message", "Page not found")
	w.WriteHeader(http.StatusNotFound)

	http.ServeFile(w, r, "templates/404.html")
}

// Handling error 500 - Internal Server Error
func Handle500(w http.ResponseWriter, r *http.Request, err error) {
	if r.URL.Path == "/favicon.ico" {
		HandleFavicon(w, r)
		return
	}

	// Set headers and serve the error page
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.Header().Set("X-Error-Message", err.Error())
	w.WriteHeader(http.StatusInternalServerError)

	http.ServeFile(w, r, "templates/500.html")
}

func HandleArtists(w http.ResponseWriter, r *http.Request) {
	if templateErr != nil {
		Handle500(w, r, templateErr)
		return
	}

	// Fetch artists data
	var artists []models.Artist
	err := utils.FetchData("https://groupietrackers.herokuapp.com/api/artists", &artists)
	if err != nil {
		Handle500(w, r, err)
		return
	}

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
				fetchErr = err
				mu.Unlock()
				return
			}

			// Fetch dates
			if err := utils.FetchData(artists[i].DatesURL, &dates); err != nil {
				mu.Lock()
				fetchErr = err
				mu.Unlock()
				return
			}

			// Fetch relations
			if err := utils.FetchData(artists[i].RelationURL, &relations); err != nil {
				mu.Lock()
				fetchErr = err
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
	//It is used to wait for all concurrent goroutines to finish before continuing
	wg.Wait()
	//This checks if any error occurred while fetching the data for the artists
	if fetchErr != nil {
		Handle500(w, r, fetchErr)
		return
	}
	//Renders the index.html template and writes the result to the HTTP response.
	err = templates.ExecuteTemplate(w, "index.html", artists)
	if err != nil {
		Handle500(w, r, err)
	}
}

// Handling favicon.ico not found
func HandleFavicon(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/plain; charset=utf-8")
	w.Header().Set("X-Error-Message", "Favicon not found")
	w.WriteHeader(http.StatusNotFound)
	w.Write([]byte("404 Favicon not found"))
}
