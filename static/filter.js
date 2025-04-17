document.addEventListener('DOMContentLoaded', function() {
    // Cache DOM elements
    const creationDateMin = document.getElementById('creation-date-min');
    const creationDateMax = document.getElementById('creation-date-max');
    const creationDateMinValue = document.getElementById('creation-date-min-value');
    const creationDateMaxValue = document.getElementById('creation-date-max-value');
    
    const firstAlbumMin = document.getElementById('first-album-min');
    const firstAlbumMax = document.getElementById('first-album-max');
    const firstAlbumMinValue = document.getElementById('first-album-min-value');
    const firstAlbumMaxValue = document.getElementById('first-album-max-value');
    
    const membersFilter = document.getElementById('members-filter');
    const locationsFilter = document.getElementById('locations-filter');
    const resetFiltersBtn = document.getElementById('reset-filters');
    
    const dataItems = document.querySelectorAll('.data-item');
    
    // Accordion elements
    const filterToggleButton = document.querySelector('.filter-toggle-button');
    const filterSection = document.querySelector('.filter-section');
    
    // Initialize accordion
    initializeFilterAccordion();
    
    // Initialize filter data
    let filterData = {
        creationDateMin: 1950,
        creationDateMax: 2023,
        firstAlbumMin: 1950,
        firstAlbumMax: 2023,
        members: [],
        locations: []
    };
    
    // Initialize filter options
    let filterOptions = {
        members: new Set(),
        locations: new Set()
    };
    
    // Function to initialize the filter accordion
    function initializeFilterAccordion() {
        if (filterToggleButton) {
            filterToggleButton.addEventListener('click', function() {
                // Toggle active class on the button
                this.classList.toggle('active');
                
                // Toggle collapsed class on the filter section
                filterSection.classList.toggle('collapsed');
            });
        }
    }
    
    // Extract unique members and locations from data items
    function extractFilterOptions() {
        dataItems.forEach(item => {
            // Extract members - only add member count, not individual members
            const members = item.getAttribute('data-members').split(', ');
            
            // Extract number of members
            const memberCount = members.length.toString();
            filterOptions.members.add(memberCount + (memberCount === '1' ? ' member' : ' members'));
            
            // Extract locations
            const locations = item.getAttribute('data-locations').split(', ');
            locations.forEach(location => {
                // Format location as "City, COUNTRY"
                const parts = location.split('-');
                if (parts.length > 1) {
                    const city = parts[0].split('_')
                        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                        .join(' ');
                    // Remove underscores from country and keep it uppercase
                    const country = parts[1].replace(/_/g, ' ').toUpperCase();
                    const formattedLocation = `${city}, ${country}`;
                    filterOptions.locations.add(formattedLocation);
                } else {
                    filterOptions.locations.add(location.trim());
                }
            });
            
            // Extract creation date range
            const creationDate = parseInt(item.getAttribute('data-creation-date'));
            if (creationDate < filterData.creationDateMin) {
                filterData.creationDateMin = creationDate;
                creationDateMin.min = creationDate;
                creationDateMin.value = creationDate;
                creationDateMinValue.textContent = creationDate;
            }
            if (creationDate > filterData.creationDateMax) {
                filterData.creationDateMax = creationDate;
                creationDateMax.max = creationDate;
                creationDateMax.value = creationDate;
                creationDateMaxValue.textContent = creationDate;
            }
            
            // Extract first album date range
            const firstAlbumDate = parseInt(item.getAttribute('data-first-album').split('-')[2]);
            if (firstAlbumDate < filterData.firstAlbumMin) {
                filterData.firstAlbumMin = firstAlbumDate;
                firstAlbumMin.min = firstAlbumDate;
                firstAlbumMin.value = firstAlbumDate;
                firstAlbumMinValue.textContent = firstAlbumDate;
            }
            if (firstAlbumDate > filterData.firstAlbumMax) {
                filterData.firstAlbumMax = firstAlbumDate;
                firstAlbumMax.max = firstAlbumDate;
                firstAlbumMax.value = firstAlbumDate;
                firstAlbumMaxValue.textContent = firstAlbumDate;
            }
        });
        
        // Update range inputs with extracted values
        creationDateMin.min = filterData.creationDateMin;
        creationDateMin.max = filterData.creationDateMax;
        creationDateMax.min = filterData.creationDateMin;
        creationDateMax.max = filterData.creationDateMax;
        
        firstAlbumMin.min = filterData.firstAlbumMin;
        firstAlbumMin.max = filterData.firstAlbumMax;
        firstAlbumMax.min = filterData.firstAlbumMin;
        firstAlbumMax.max = filterData.firstAlbumMax;
        
        // Populate checkbox filters
        populateCheckboxFilter(membersFilter, Array.from(filterOptions.members).sort((a, b) => {
            // Sort by number of members
            const numA = parseInt(a);
            const numB = parseInt(b);
            if (!isNaN(numA) && !isNaN(numB)) {
                return numA - numB;
            }
            return a.localeCompare(b);
        }));
        
        populateCheckboxFilter(locationsFilter, Array.from(filterOptions.locations).sort());
    }
    
    // Populate checkbox filter with options
    function populateCheckboxFilter(container, options) {
        container.innerHTML = '';
        options.forEach(option => {
            const id = option.replace(/\s+/g, '-').toLowerCase();
            const checkboxItem = document.createElement('div');
            checkboxItem.className = 'checkbox-item';
            
            checkboxItem.innerHTML = `
                <input type="checkbox" id="${id}" value="${option}">
                <label for="${id}">${option}</label>
            `;
            
            container.appendChild(checkboxItem);
            
            // Add event listener to checkbox
            const checkbox = checkboxItem.querySelector('input[type="checkbox"]');
            checkbox.addEventListener('change', applyFilters);
        });
    }
    
    // Apply all filters
    function applyFilters() {
        // Get current filter values
        const creationMin = parseInt(creationDateMin.value);
        const creationMax = parseInt(creationDateMax.value);
        const albumMin = parseInt(firstAlbumMin.value);
        const albumMax = parseInt(firstAlbumMax.value);
        
        // Get selected members
        const selectedMembers = Array.from(membersFilter.querySelectorAll('input[type="checkbox"]:checked'))
            .map(checkbox => checkbox.value);
        
        // Get selected locations
        const selectedLocations = Array.from(locationsFilter.querySelectorAll('input[type="checkbox"]:checked'))
            .map(checkbox => checkbox.value);
        
        // Client-side filtering for immediate feedback
        clientSideFiltering(creationMin, creationMax, albumMin, albumMax, selectedMembers, selectedLocations);
        
        // Debounced server-side filtering for more accurate results
        debouncedServerFilter(creationMin, creationMax, albumMin, albumMax, selectedMembers, selectedLocations);
    }
    
    // Client-side filtering for immediate feedback
    function clientSideFiltering(creationMin, creationMax, albumMin, albumMax, selectedMembers, selectedLocations) {
        dataItems.forEach(item => {
            const creationDate = parseInt(item.getAttribute('data-creation-date'));
            const firstAlbumDate = parseInt(item.getAttribute('data-first-album').split('-')[2]);
            const members = item.getAttribute('data-members').split(', ');
            const memberCount = members.length.toString() + (members.length === 1 ? ' member' : ' members');
            const locations = item.getAttribute('data-locations').split(', ');
            
            // Format locations as "City, COUNTRY"
            const formattedLocations = locations.map(location => {
                const parts = location.split('-');
                if (parts.length > 1) {
                    const city = parts[0].split('_')
                        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                        .join(' ');
                    // Remove underscores from country and keep it uppercase
                    const country = parts[1].replace(/_/g, ' ').toUpperCase();
                    return `${city}, ${country}`;
                }
                return location.trim();
            });
            
            // Check if item passes all filters
            const passesCreationDate = creationDate >= creationMin && creationDate <= creationMax;
            const passesFirstAlbum = firstAlbumDate >= albumMin && firstAlbumDate <= albumMax;
            
            // Check if item passes member filter
            let passesMemberFilter = true;
            if (selectedMembers.length > 0) {
                passesMemberFilter = selectedMembers.some(selected => {
                    return selected === memberCount;
                });
            }
            
            // Check if item passes location filter
            let passesLocationFilter = true;
            if (selectedLocations.length > 0) {
                passesLocationFilter = selectedLocations.some(selected => {
                    return formattedLocations.includes(selected);
                });
            }
            
            // Show or hide item based on filter results
            if (passesCreationDate && passesFirstAlbum && passesMemberFilter && passesLocationFilter) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });
    }
    
    // Debounce function to limit API calls
    function debounce(func, wait) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }
    
    // Debounced server-side filtering
    const debouncedServerFilter = debounce(function(creationMin, creationMax, albumMin, albumMax, selectedMembers, selectedLocations) {
        // Build query string for API call
        let queryParams = new URLSearchParams();
        queryParams.append('creationDateMin', creationMin);
        queryParams.append('creationDateMax', creationMax);
        queryParams.append('firstAlbumMin', albumMin);
        queryParams.append('firstAlbumMax', albumMax);
        
        selectedMembers.forEach(member => {
            queryParams.append('members', member);
        });
        
        selectedLocations.forEach(location => {
            queryParams.append('locations', location);
        });
        
        // Make API call to backend
        fetch(`/filter?${queryParams.toString()}`)
            .then(response => response.json())
            .then(data => {
                // Update UI with filtered data
                updateUIWithFilteredData(data);
            })
            .catch(error => {
                console.error('Error fetching filtered data:', error);
            });
    }, 500);
    
    // Update UI with filtered data from server
    function updateUIWithFilteredData(filteredArtists) {
        // Get all artist IDs from filtered results
        const filteredIds = new Set(filteredArtists.map(artist => artist.id));
        
        // Show/hide artists based on filtered results
        dataItems.forEach(item => {
            const artistName = item.querySelector('h3').textContent;
            const matchingArtist = filteredArtists.find(artist => artist.name === artistName);
            
            if (matchingArtist) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });
    }
    
    // Update range slider values
    function updateRangeValue(slider, valueElement) {
        valueElement.textContent = slider.value;
        applyFilters();
    }
    
    // Reset all filters
    function resetFilters() {
        // Reset creation date range
        creationDateMin.value = filterData.creationDateMin;
        creationDateMax.value = filterData.creationDateMax;
        creationDateMinValue.textContent = filterData.creationDateMin;
        creationDateMaxValue.textContent = filterData.creationDateMax;
        
        // Reset first album date range
        firstAlbumMin.value = filterData.firstAlbumMin;
        firstAlbumMax.value = filterData.firstAlbumMax;
        firstAlbumMinValue.textContent = filterData.firstAlbumMin;
        firstAlbumMaxValue.textContent = filterData.firstAlbumMax;
        
        // Uncheck all checkboxes
        membersFilter.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.checked = false;
        });
        
        locationsFilter.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.checked = false;
        });
        
        // Show all items
        dataItems.forEach(item => {
            item.style.display = 'block';
        });
    }
    
    // Event listeners for range sliders
    creationDateMin.addEventListener('input', () => {
        if (parseInt(creationDateMin.value) > parseInt(creationDateMax.value)) {
            creationDateMin.value = creationDateMax.value;
        }
        updateRangeValue(creationDateMin, creationDateMinValue);
    });
    
    creationDateMax.addEventListener('input', () => {
        if (parseInt(creationDateMax.value) < parseInt(creationDateMin.value)) {
            creationDateMax.value = creationDateMin.value;
        }
        updateRangeValue(creationDateMax, creationDateMaxValue);
    });
    
    firstAlbumMin.addEventListener('input', () => {
        if (parseInt(firstAlbumMin.value) > parseInt(firstAlbumMax.value)) {
            firstAlbumMin.value = firstAlbumMax.value;
        }
        updateRangeValue(firstAlbumMin, firstAlbumMinValue);
    });
    
    firstAlbumMax.addEventListener('input', () => {
        if (parseInt(firstAlbumMax.value) < parseInt(firstAlbumMin.value)) {
            firstAlbumMax.value = firstAlbumMin.value;
        }
        updateRangeValue(firstAlbumMax, firstAlbumMaxValue);
    });
    
    // Event listener for reset button
    resetFiltersBtn.addEventListener('click', resetFilters);
    
    // Initialize filters
    extractFilterOptions();
}); 