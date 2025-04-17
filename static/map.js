let activeInfoWindow = null; // Tracks the currently open InfoWindow

function initMap() {
    // Get artist name and locations from URL
    const urlParams = new URLSearchParams(window.location.search);
    const artistName = urlParams.get('artist');
    const locationsString = urlParams.get('locations');
    const relationsString = urlParams.get('relations');
    
    // Set the title
    document.getElementById('map-title').textContent = `${artistName} - Concert Locations`;
    
    // Parse locations and relations
    const locations = JSON.parse(decodeURIComponent(locationsString));
    const relations = JSON.parse(decodeURIComponent(relationsString));
    
    // Create a map with strict bounds and better styling
    const map = new google.maps.Map(document.getElementById("map"), {
        zoom: 2,
        center: { lat: 20, lng: 0 },
        restriction: {
            latLngBounds: {
                north: 85,
                south: -85,
                east: 180,
                west: -180
            },
            strictBounds: true
        },
        minZoom: 2,
        styles: [
            {
                "featureType": "administrative",
                "elementType": "labels.text.fill",
                "stylers": [
                    {
                        "color": "#444444"
                    }
                ]
            },
            {
                "featureType": "landscape",
                "elementType": "all",
                "stylers": [
                    {
                        "color": "#f2f2f2"
                    }
                ]
            },
            {
                "featureType": "poi",
                "elementType": "all",
                "stylers": [
                    {
                        "visibility": "off"
                    }
                ]
            },
            {
                "featureType": "road",
                "elementType": "all",
                "stylers": [
                    {
                        "saturation": -100
                    },
                    {
                        "lightness": 45
                    }
                ]
            },
            {
                "featureType": "road.highway",
                "elementType": "all",
                "stylers": [
                    {
                        "visibility": "simplified"
                    }
                ]
            },
            {
                "featureType": "road.arterial",
                "elementType": "labels.icon",
                "stylers": [
                    {
                        "visibility": "off"
                    }
                ]
            },
            {
                "featureType": "transit",
                "elementType": "all",
                "stylers": [
                    {
                        "visibility": "off"
                    }
                ]
            },
            {
                "featureType": "water",
                "elementType": "all",
                "stylers": [
                    {
                        "color": "#46bcec"
                    },
                    {
                        "visibility": "on"
                    }
                ]
            }
        ]
    });

    // Close InfoWindow when clicking anywhere on the map
    map.addListener('click', () => {
    if (activeInfoWindow) {
        activeInfoWindow.close();
        activeInfoWindow = null;
    }
    });

    // Create bounds to fit all markers
    const bounds = new google.maps.LatLngBounds();
    const markers = [];
    const infoWindows = [];
    
    // Custom marker icons
    const markerIcons = {
        default: {
            url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
            scaledSize: new google.maps.Size(32, 32)
        },
        highlighted: {
            url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
            scaledSize: new google.maps.Size(40, 40)
        }
    };
    
    // Function to create rich info window content
    const createInfoWindowContent = (artist, location, lat, lng) => {
        // Get the concert dates for this location
        const locationKey = Object.keys(relations).find(key => formatLocation(key) === location);
        const concertDates = locationKey ? relations[locationKey] : [];
        const date = concertDates.length > 0 ? concertDates[0] : 'No date available';
        
        return `
            <div class="info-window">
                <div class="info-header">
                    <h3>${artist}</h3>
                    <div class="concert-badge">Concert</div>
                </div>
                <div class="info-body">
                    <p><i class="fas fa-map-marker-alt"></i> <strong>Venue:</strong> ${location}</p>
                    <p><i class="fas fa-calendar-alt"></i> <strong>Date:</strong> ${date}</p>
                    <p><i class="fas fa-info-circle"></i> <strong>Details:</strong> Performing Live!</p>
                    <div class="coordinates">
                        <small>Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}</small>
                    </div>
                </div>
                <div class="info-footer">
                    <button class="directions-btn" onclick="window.open('https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}', '_blank')">
                        <i class="fas fa-route"></i> Get Directions
                    </button>
                    <button class="tickets-btn" onclick="window.open('https://www.ticketmaster.com/')">
                        <i class="fas fa-ticket-alt"></i> Get Tickets
                    </button>
                </div>
            </div>
        `;
    };
    
    // Geocode each location and add markers
    locations.forEach(location => {
        fetch(`/geocode?location=${encodeURIComponent(location)}`)
            .then(response => response.json())
            .then(data => {
                if (data.lat && data.lng) {
                    const position = { lat: data.lat, lng: data.lng };
                    bounds.extend(position);
                    
                    // Create marker
                    const marker = new google.maps.Marker({
                        position: position,
                        map: map,
                        title: location,
                        icon: markerIcons.default,
                        animation: google.maps.Animation.DROP
                    });
                    
                    // Create info window
                    const infoWindow = new google.maps.InfoWindow({
                        content: createInfoWindowContent(artistName, location, data.lat, data.lng)
                    });
                    
                    marker.addListener('click', () => {
                        // Close any previously open InfoWindow
                        if (activeInfoWindow) {
                            activeInfoWindow.close();
                        }
                    
                        // Open the new InfoWindow
                        infoWindow.open(map, marker);
                        activeInfoWindow = infoWindow; // Track the active window
                    
                        // Bounce animation
                        marker.setAnimation(google.maps.Animation.BOUNCE);
                        setTimeout(() => {
                            marker.setAnimation(null);
                        }, 1500);
                    });
                    
                    // Reset marker icon when info window closes
                    infoWindow.addListener('closeclick', () => {
                        marker.setIcon(markerIcons.default);
                        marker.setZIndex(0);
                    });
                    
                    markers.push(marker);
                    infoWindows.push(infoWindow);
                }
            })
            .catch(error => console.error('Error geocoding location:', location, error));
    });
    
    // Fit bounds after all markers are added (with a slight delay)
    setTimeout(() => {
        if (!bounds.isEmpty()) {
            map.fitBounds(bounds);
            
            // Prevent over-zooming
            const zoomListener = google.maps.event.addListener(map, 'bounds_changed', function() {
                if (this.getZoom() > 10) {
                    this.setZoom(10);
                }
                google.maps.event.removeListener(zoomListener);
            });
        }
    }, 2000);
    
    // Add clusterer for better marker management
    const markerCluster = new MarkerClusterer(map, markers, {
        imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m',
        gridSize: 60,
        maxZoom: 10,
        styles: [{
            textColor: 'white',
            url: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m1.png',
            height: 53,
            width: 53
        }]
    });
}

// Function to format location string
function formatLocation(location) {
    // Check if the location already contains a comma (already formatted)
    if (location.includes(',')) {
        return location;
    }
    
    const parts = location.split('-');
    if (parts.length < 2) {
        return location; // Return as is if no hyphen
    }
    
    const city = parts[0];
    const country = parts[1];
    
    // Format city: replace underscores with spaces and capitalize each word
    const formattedCity = city
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    
    // Format country: uppercase
    const formattedCountry = country
        .split('_')
        .join(' ')
        .toUpperCase();
    
    return `${formattedCity}, ${formattedCountry}`;
}

// Fallback in case Google Maps API doesn't call initMap
window.initMap = initMap;