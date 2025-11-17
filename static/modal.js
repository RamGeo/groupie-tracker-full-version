// Variable to store the click sound
let clickSound;

// to display the mp3 sounds
const artistSounds = {
    "Queen": "/static/mp3/Queen.mp3",
    "SOJA": "/static/mp3/SOJA.mp3",
    "Pink Floyd": "/static/mp3/Pink Floyd.mp3",
    "Scorpions": "/static/mp3/Scorpions.mp3",
    "XXXTentacion": "/static/mp3/xxxTentacion.mp3",
    "Mac Miller": "/static/mp3/Mac Miller.mp3",
    "Joyner Lucas": "/static/mp3/Joyner Lucas.mp3",
    "Kendrick Lamar": "/static/mp3/Kendrick Lamar.mp3",
    "ACDC": "/static/mp3/ACDC.mp3",
    "Pearl Jam": "/static/mp3/Pearl Jam.mp3",
    "Katy Perry": "/static/mp3/Katy Perry.mp3",
    "Rihanna": "/static/mp3/Rihanna.mp3",
    "Genesis": "/static/mp3/Genesis.mp3",
    "Phil Collins": "/static/mp3/Phil Collins.mp3",
    "Led Zeppelin": "/static/mp3/Led Zeppelin.mp3",
    "The Jimi Hendrix Experience": "/static/mp3/The Jimi Hendrix Experience.mp3",
    "Bee Gees": "/static/mp3/Bee Gees.mp3",
    "Deep Purple": "/static/mp3/Deep Purple.mp3",
    "Aerosmith": "/static/mp3/Aerosmith.mp3",
    "Dire Straits": "/static/mp3/Dire Straits.mp3",
    "Mamonas Assassinas": "/static/mp3/Mamonas Assassinas.mp3",
    "Thirty Seconds to Mars": "/static/mp3/Thirty Seconds to Mars.mp3",
    "Imagine Dragons": "/static/mp3/Imagine Dragons.mp3",
    "Juice Wrld": "/static/mp3/Juice Wrld.mp3",
    "Logic": "/static/mp3/Logic.mp3",
    "Alec Benjamin": "/static/mp3/Alec Benjamin.mp3",
    "Bobby McFerrins": "/static/mp3/Bobby McFerrins.mp3",
    "R3HAB": "/static/mp3/R3HAB.mp3",
    "Post Malone": "/static/mp3/Post Malone.mp3",
    "Travis Scott": "/static/mp3/Travis Scott.mp3",
    "J. Cole": "/static/mp3/J. Cole.mp3",
    "Nickelback": "/static/mp3/Nickelback.mp3",
    "Mobb Deep": "/static/mp3/Mobb Deep.mp3",
    "Guns N' Roses": "/static/mp3/Guns N' Roses.mp3",
    "NWA": "/static/mp3/NWA.mp3",
    "U2": "/static/mp3/U2.mp3",
    "Arctic Monkeys": "/static/mp3/Arctic Monkeys.mp3",
    "Fall Out Boy": "/static/mp3/Fall Out Boy.mp3",
    "Gorillaz": "/static/mp3/Gorillaz.mp3",
    "Eagles": "/static/mp3/Eagles.mp3",
    "Linkin Park": "/static/mp3/Linkin Park.mp3",
    "Red Hot Chili Peppers": "/static/mp3/Red Hot Chili Peppers.mp3",
    "Eminem": "/static/mp3/Eminem.mp3",
    "Green Day": "/static/mp3/Green Day.mp3",
    "Metallica": "/static/mp3/Metallica.mp3",
    "Coldplay": "/static/mp3/Coldplay.mp3",
    "Maroon 5": "/static/mp3/Maroon 5.mp3",
    "Twenty One Pilots": "/static/mp3/Twenty One Pilots.mp3",
    "The Rolling Stones": "/static/mp3/The Rolling Stones.mp3",
    "Muse": "/static/mp3/Muse.mp3",
    "Foo Fighters": "/static/mp3/Foo Fighters.mp3",
    "The Chainsmokers": "/static/mp3/The Chainsmokers.mp3",
};

// Preload Google Maps API - fetch key from backend
fetch('/api-key')
    .then(response => response.json())
    .then(data => {
        const gmapScript = document.createElement('script');
        gmapScript.src = `https://maps.googleapis.com/maps/api/js?key=${data.apiKey}&libraries=places`;
        gmapScript.async = true;
        gmapScript.defer = true;
        document.head.appendChild(gmapScript);

        // Track API loading state
        window.mapAPIReady = false;
        gmapScript.onload = function() {
            window.mapAPIReady = true;
        };
    })
    .catch(error => {
        console.error('Error loading Google Maps API key:', error);
    });

// function is designed to open a modal (a popup or overlay) on a webpage and populate it with dynamic content based on the arguments passed to it
function openModal(name, image, members, firstAlbum, creationDate, relations, locations, dates) {
    const modal = document.getElementById("myModal");
    const modalTitle = document.getElementById("modal-title");
    const modalImage = document.getElementById("modal-image");
    
    modalTitle.textContent = name;
    modalImage.src = image;
    modal.style.display = "block";

        // Add view map button - only if it doesn't exist already
    let viewMapButton = document.querySelector('.view-map-button');
    if (!viewMapButton) {
    viewMapButton = document.createElement('button');
    viewMapButton.className = 'view-map-button home-button'; // Add home-button class for consistent styling
    viewMapButton.textContent = 'View Map';
    
    // Insert the button in the title container
    const titleContainer = document.querySelector('.modal-title-container');
    titleContainer.insertBefore(viewMapButton, modalTitle.nextSibling);
    }

    // Update click handler every time
    viewMapButton.onclick = function() {
    // Convert locations to JSON string for URL
    const locationsJson = JSON.stringify(locationsList);
    const relationsJson = JSON.stringify(relationsData);
    window.location.href = `/map?artist=${encodeURIComponent(name)}&locations=${encodeURIComponent(locationsJson)}&relations=${encodeURIComponent(relationsJson)}`;
    };

    // Set members list
    const membersList = document.getElementById("modal-members");
    membersList.innerHTML = members.split(", ").map(member => 
        `<div class="member-item">${member}</div>`
    ).join("");

    // Set album date
    document.getElementById("modal-first-album").textContent = firstAlbum;
    
    // Set creation date
    document.getElementById("modal-creation-date").textContent = creationDate;

    // Parse relations data for both locations and concert dates
    const relationsData = JSON.parse(relations);
    
    // Handle Locations
    const locationsList = Object.keys(relationsData).map(loc => formatLocation(loc));
    locationsList.sort();

    // This code is responsible for displaying a list of locations inside a modal or any container element on a webpage
    const locationsContainer = document.getElementById('modal-locations');
    locationsContainer.innerHTML = '';
    if (locationsList.length > 0) {
        locationsList.forEach(location => {
            const locationDiv = document.createElement('div');
            locationDiv.className = 'location-item';
            locationDiv.textContent = location;
            locationsContainer.appendChild(locationDiv);
        });
    }

    // Handle Concert Dates
    const tourDatesContainer = document.getElementById('modal-tour-dates');
    tourDatesContainer.innerHTML = '';
    
    if (Object.keys(relationsData).length > 0) {
        Object.entries(relationsData).forEach(([location, dates]) => {
            const formattedLocation = formatLocation(location);
            dates.forEach(date => {
                const dateDiv = document.createElement('div');
                dateDiv.className = 'tour-date';
                dateDiv.textContent = `${formattedLocation}: ${date}`;
                tourDatesContainer.appendChild(dateDiv);
            });
        });
    } else {
        tourDatesContainer.innerHTML = "<div class='tour-date'>No concert dates available</div>";
    }

    // Add console log to debug
    console.log("Dates received:", dates);

    // Handle Dates
    const datesContainer = document.getElementById('modal-dates');
    datesContainer.innerHTML = ''; // Clear existing content
    
    if (dates && dates.length > 0) {
        const datesArray = dates.split(',').filter(date => date.trim() !== '');
        
        if (datesArray.length > 0) {
            datesArray.forEach(date => {
                const dateDiv = document.createElement('div');
                dateDiv.className = 'date-item';
                // Remove asterisks from the date string
                dateDiv.textContent = date.trim().replace(/\*/g, '');
                datesContainer.appendChild(dateDiv);
            });
        } else {
            datesContainer.innerHTML = "<div class='date-item'>No dates available</div>";
        }
    } else {
        datesContainer.innerHTML = "<div class='date-item'>No dates available</div>";
    }

    // Close all accordions initially
    document.querySelectorAll('.accordion-content').forEach(content => {
        content.style.display = 'none';
        content.classList.remove('active');
    });

    // Add click handlers for accordion headers
    document.querySelectorAll('.accordion-header').forEach(header => {
        header.onclick = function() {
            const content = this.nextElementSibling;
            
            // Toggle display
            if (content.style.display === 'none') {
                // Hide all other accordion contents first
                document.querySelectorAll('.accordion-content').forEach(item => {
                    item.style.display = 'none';
                    item.classList.remove('active');
                });
                // Show this content
                content.style.display = 'block';
                content.classList.add('active');
            } else {
                content.style.display = 'none';
                content.classList.remove('active');
            }
        };
    });

    // Play sound
    const soundFile = artistSounds[name] || "/static/default-sound.mp3"; // Default sound if artist not found
    if (clickSound) {
        clickSound.pause();
        clickSound.currentTime = 0;
    }
    clickSound = new Audio(soundFile);
    clickSound.loop = true; // Loop the audio


    clickSound.play().then(() => {
        console.log('Sound started playing');
    }).catch(error => {
        console.error('Error playing sound:', error);
    });

    // Initialize accordion
    setTimeout(() => {
        initializeAccordion();
    }, 0);
}

// The function takes a location string like "new_york-usa", formats the city part by capitalizing the first letter of each word (and separating them by spaces)
// Formats the country part by converting all letters to uppercase
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

// The function standardizes country names by capitalizing the words and handling specific cases for "USA" and "UK", converting them to their preferred abbreviations
function formatCountry(country) {
    const formattedCountry = capitalizeWords(country);
    const countryLower = formattedCountry.toLowerCase();
    
    if (countryLower === "usa" || countryLower === "u_s_a") {
        return "USA";
    } 
    if (countryLower === "uk" || countryLower === "u_k") {
        return "UK";
    }
    
    return formattedCountry;
}

function capitalizeWords(str) {
    // Remove underscores, split into words, and capitalize each word
    return str.replace(/_/g, ' ').split(' ').map(word => capitalize(word)).join(' ');
}

function capitalize(word) {
    // Capitalize the first letter of the word and make the rest lowercase
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

// Close modal function
function closeModal() {
    const modal = document.getElementById("myModal");
    modal.style.display = "none";
    
    // Close all accordion sections when modal is closed
    document.querySelectorAll('.accordion-content').forEach(content => {
        content.style.display = 'none';
        content.classList.remove('active');
    });
    
    // Stop the sound when the modal is closed
    if (clickSound) {
        clickSound.pause();
        clickSound.currentTime = 0;
    }
}

// Event listeners for closing the modal
document.addEventListener("DOMContentLoaded", function() {
    // Close modal when clicking the "X"
    const closeButton = document.getElementById("close-modal");
    if (closeButton) {
        closeButton.addEventListener("click", closeModal);
    }

    // Close modal when clicking outside of it
    window.onclick = function(event) {
        const modal = document.getElementById("myModal");
        if (event.target === modal) {
            closeModal();
        }
    };
});

// Toggle the display of tour dates when the header is clicked
document.getElementById("toggle-tour-dates").addEventListener("click", function() {
    const tourDatesList = document.getElementById("modal-tour-dates");
    if (tourDatesList.style.display === "none") {
        tourDatesList.style.display = "block";
    } else {
        tourDatesList.style.display = "none";
    }
});

// Selects all elements with the class accordion-header and clones each of these header elements and replaces the original headers with the clones
function initializeAccordion() {
    const accordionHeaders = document.querySelectorAll('.accordion-header');
    
    // First, remove all existing event listeners by cloning and replacing elements
    accordionHeaders.forEach(header => {
        const newHeader = header.cloneNode(true);
        header.parentNode.replaceChild(newHeader, header);
    });

    // Then add new event listeners
    document.querySelectorAll('.accordion-header').forEach(header => {
        header.addEventListener('click', function() {
            const content = this.nextElementSibling;
            
            // Toggle display
            if (content.style.display === 'none') {
                // Hide all other accordion contents first
                document.querySelectorAll('.accordion-content').forEach(item => {
                    item.style.display = 'none';
                    item.classList.remove('active');
                });
                // Show this content
                content.style.display = 'block';
                content.classList.add('active');
            } else {
                content.style.display = 'none';
                content.classList.remove('active');
            }
        });
    });
}

// Update accordion click handler
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('accordion-header')) {
        const content = e.target.nextElementSibling;
        
        // If it's in the left side (members), toggle normally
        if (e.target.closest('.modal-left')) {
            content.classList.toggle('active');
        }
        // If it's in the right side, keep it open
        else {
            content.classList.add('active');
        }
    }
});
