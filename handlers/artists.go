package handlers

import (
	"Groupie_Tracker/utils"
	"encoding/json"
	"html/template"
	"log"
	"net/http"
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

	// Use shared data service with caching
	artists, err := GetDataService().GetArtists()
	if err != nil {
		Handle500(w, r, err)
		return
	}

	// Render template
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
