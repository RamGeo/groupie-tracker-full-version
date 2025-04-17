package main

import (
	"Groupie_Tracker/handlers"
	"log"
	"net/http"
	"encoding/json"
	"os"
)

func main() {
	// 🔑
	os.Setenv("GOOGLE_MAPS_API_KEY", "AIzaSyAe5uJA4VuyOdMJuKfClFlIV0yuGvF-Lc4") 

	// Create a new ServeMux
	mux := http.NewServeMux()

	// Handle favicon request
	mux.HandleFunc("/favicon.ico", handlers.HandleFavicon)

	// Main handler
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/" {
			handlers.Handle404(w, r)
			return
		}
		handlers.HandleArtists(w, r)
	})

	// Serve about us page
	mux.HandleFunc("/aboutus", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, "templates/aboutus.html")
	})

	//Search Bar
	mux.HandleFunc("/search", handlers.HandleSearch)

	//Filter
	mux.HandleFunc("/filter", handlers.HandleFilter)

	// Map handler
	mux.HandleFunc("/map", handlers.HandleMap)

	// Geocode handler
	mux.HandleFunc("/geocode", func(w http.ResponseWriter, r *http.Request) {
	location := r.URL.Query().Get("location")
	lat, lng, err := handlers.GeocodeLocation(location)
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
	})

	// Handle 404 error
	mux.HandleFunc("/404", handlers.Handle404)

	// Serve static files
	mux.Handle("/static/", http.StripPrefix("/static/", http.FileServer(http.Dir("static"))))

	// Start the server with mux as the handler
	log.Println("Server started at http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", mux)) // Pass mux here
}
