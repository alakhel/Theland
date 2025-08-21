const locations = {
    "Germany": [
        {name : "Hamburg", id: 3, geo: {lat: 53.57132, lng: 9.95367}},
        {name : "Berlin", id: 12, geo: {lat: 52.5069704, lng: 13.2846517}},
        {name : "Frankfurt am Main", id: 33, geo: {lat: 50.121301, lng: 8.5665248}},
        {name : "München", id: 26, geo: {lat: 48.155004, lng: 11.4717967}},
        {name : "Köln", id: 19, geo: {lat: 50.95779, lng: 6.8972834}},
        {name : "Stuttgart", id: 18, geo: {lat: 48.779301, lng: 9.1071762}}
    ],
    "Denmark": [
        {name : "Kopenhagen", id: 52, geo: {lat: 55.6713108, lng: 12.5588047}}
    ],
    "France": [
        {name : "Paris", id: 48, geo: {lat: 48.8589101, lng: 2.3120407}}
    ],
    "Italy": [
        {name : "Mailand", id: 20, geo: {lat: 45.4627887, lng: 9.142713}},
        {name : "Rom", id: 31, geo: {lat: 41.9101776, lng: 12.4659587}},
        {name : "Turin", id: 44, geo: {lat: 45.073544, lng: 7.6405873}}
    ],
    "Netherlands": [
        {name : "Amsterdam", id: 5, geo: {lat: 52.3547498, lng: 4.8339214}}
    ],
    "Austria": [
        {name : "Wien", id: 7, geo: {lat: 48.220778, lng: 16.3100209}}
    ],
    "Spain": [
        {name : "Madrid", id: 36, geo: {lat: 40.4380638, lng: -3.7495758}}
    ],
    "Hungary": [
        {name : "Budapest", id: 55, geo: {lat: 47.4813081, lng: 19.0602639}}
    ]
}
const idToCity = {};
Object.keys(locations).forEach(country => locations[country].forEach(city => idToCity[city.id] = city));

document.querySelectorAll("#countries li").forEach(li => {
    li.onclick = () => {
        updateCities(li.innerText);
        document.querySelectorAll("#countries li.selected").forEach(li => li.classList.remove("selected"));
        li.classList.add("selected");
    }
});
registerCityClickListeners();
function registerCityClickListeners() {
    document.querySelectorAll("#cities li").forEach(li => {
        li.onclick = () => {
            changeLocation(li.dataset.id);
        }
    });
}

function updateCities(country) {
    ul = document.getElementById("cities");
    ul.innerHTML = "";
    locations[country].forEach(city => {
        ul.insertAdjacentHTML("beforeend", `<li data-id="${city.id}">${city.name}</li>`)
    });
    registerCityClickListeners();
}
function changeLocation(id) {
    let city = idToCity[id];
    map.setView([city.geo.lat, city.geo.lng], 13);
}

var map = L.map('map').setView([48.8589101, 2.3120407], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

let markers = {};
let userPosition = null;
 addChargersToMap(map)

// 1. Get user position
navigator.geolocation.getCurrentPosition(pos => {
    userPosition = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude
    };
    console.log("📍 User position:", userPosition);
}, err => {
    console.warn("⚠️ Could not get position:", err);
});

function getUserPosition() {
    return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
    });
}

// 2. Function to fetch cycling distance from OpenRouteService
async function getBikeDistance(from, to) {
    console.log("calculating from ", from)
    const apiKey = "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjUyYWZmYjE5Yzk5MTRhNTZiMzY2MDJlZGJjMzMwZWI1IiwiaCI6Im11cm11cjY0In0="; // register at https://openrouteservice.org/
    const url = `https://api.openrouteservice.org/v2/directions/cycling-regular?api_key=${apiKey}&start=${from.lng},${from.lat}&end=${to.lng},${to.lat}`;
    
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const meters = data.features[0].properties.summary.distance;
    return (meters / 1000).toFixed(1); // km with 1 decimal
}

// Helper to get user position as a Promise
function getUserPosition() {
    return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
    });
}

async function calculateBikeDistance(geoCoords) {
    try {
        // wait for userPosition first
        const position = await getUserPosition();
        const userPosition = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
        };

        // now call your function
        const distance = await getBikeDistance(userPosition, {
            lat: geoCoords.latitude,
            lng: geoCoords.longitude
        });

        // update HTML
console.log(distance)
        return distance

    } catch (err) {
        console.error("Error getting user position or distance:", err);
    }
}


// 3. Extended marker function
async function addVehicleMarker(vehicle, initial = false) {
    if(vehicle.fuellevel > 20) return true;
console.log(vehicle)
    let geoCoords = vehicle.geoCoordinate;
    if (geoCoords !== undefined) {
        const icon = L.divIcon({
            iconAnchor: [0, 24],
            labelAnchor: [-6, 0],
            popupAnchor: [0, -36],
            html: `<span class="marker ${vehicle.fuellevel <= 20 ? "lowbattery" : "goodbattery"} ${initial ? "available" : "new"}"><i class="fas fa-car"></i></span>`
        });
        
        let fuelIcon = vehicle.fuelType === "ELECTRIC" ? '<i class="fas fa-bolt"></i>' : '<i class="fas fa-gas-pump"></i>';
        
    // Create marker
let marker = L.marker([geoCoords.latitude, geoCoords.longitude])
    .addTo(map)
    .setIcon(icon);

// Default popup content (loading state)
let popupHtml = `
    <div class="popup-car">
        <div><img width="150" height="150" src="${vehicle.imageUrl}"></div>
        <div class="popup-car-details">
            <div>${vehicle.plate}</div>
            <div>${vehicle.address.split(",")[0]}</div>
            <div>
                <span>${vehicle.fuellevel}%</span> ${fuelIcon}
            </div>
            <div class="bike-distance">Calculating...</div>
        </div>
    </div>
`;

marker.bindPopup(popupHtml);

// Store marker
markers[vehicle.id] = marker;

// Now fetch distance and update popup dynamically
calculateBikeDistance(geoCoords).then(distance => {
    // Update the popup’s .bike-distance element directly
    const popupElement = marker.getPopup().getElement();
    if (popupElement) {
        popupElement.querySelector(".bike-distance").textContent = `${distance} km`;
    } else {
        // If popup not yet opened, update the content string
        let updatedHtml = popupHtml.replace("Calculating...", `${distance} km`);
        marker.setPopupContent(updatedHtml);
    }
});


 


            
        
    }
}

async function addChargersToMap(map) {
    console.log('adding to map')

    const chargers = await fetchNearbyType2Chargers();
        console.log("DATA", chargers)

     chargers.forEach(charger => {
      const { lat, lon, address } = charger;

      const marker = L.marker([lat, lon]).addTo(map);

      marker.bindPopup(`
        <b>Charging Station</b><br>
        ${address}<br>
      `);
    });

}
function removeVehicleMarker(id) {
    let marker = markers[id];
    if (marker !== undefined) {
        //marker.removeFrom(map);
        //delete markers.id;
        const icon = L.divIcon({
            iconAnchor: [0, 24],
            labelAnchor: [-6, 0],
            popupAnchor: [0, -36],
            html: `<span class="marker unavailable"><i class="fas fa-car"></i></span>`
        });
        marker.setIcon(icon);
    }
}

ws = new WebSocket("wss://theland-4fc4df753e00.herokuapp.com");


ws.onopen = () => {
  console.log("✅ WebSocket connected");
  ws.send("Hello from client!");
}
ws.onmessage = event => {
    json = JSON.parse(event.data);
    if (Array.isArray(json)) {
        // initial list
        json.forEach(v => addVehicleMarker(v, true));
    } else if ("VEHICLE_LIST_UPDATE" === json.eventType) {
        json.addedVehicles.forEach(addVehicleMarker);
        json.removedVehicles.forEach(removeVehicleMarker);
    }
};


// Rayon de recherche en km
const RADIUS_KM = 1.5;

// Fonction pour calculer la distance entre deux points lat/lon (Haversine formula)
function getDistanceKm(lat1, lon1, lat2, lon2) {
    const R = 6371; // rayon Terre en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) ** 2 +
              Math.cos(lat1 * Math.PI / 180) *
              Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

async function fetchNearbyType2Chargers() {
    const API_URL = "https://opendata.paris.fr/api/records/1.0/search/?dataset=belib-points-de-recharge-pour-vehicules-electriques-disponibilite-temps-reel&rows=1000";

    const response = await fetch(API_URL);
    const data = await response.json();

    const nearbyChargers = data.records
        .filter(record => record.fields.statut_pdc === "Disponible")
        .map(record => {
            if (!record.geometry) return null;
            return {
                id: record.recordid,
                status: record.fields.statut_pdc,
                address: record.fields.adresse_station,
                lat: record.geometry.coordinates[1], // careful: GeoJSON order is [lon, lat]
                lon: record.geometry.coordinates[0],
            };
        })
        .filter(Boolean);

    return nearbyChargers;
}



