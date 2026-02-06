// Initialiser la carte centrée sur Paris
const map = L.map('map').setView([48.8566, 2.3522], 13);

// Ajouter OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
}).addTo(map);

// Marker rouge type Leaflet pour "bonhomme"
const redIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// Marker de destination “bonhomme rouge”
let personMarker = null;

// Marker de position réelle
let myPositionMarker = null;

// Récupérer la position de l'utilisateur
map.locate({ setView: true, maxZoom: 16 });

map.on('locationfound', e => {
    if (myPositionMarker) map.removeLayer(myPositionMarker);

    myPositionMarker = L.marker(e.latlng).addTo(map)
        .bindPopup("Vous êtes ici").openPopup();
});

map.on('locationerror', e => {
    alert("Impossible de récupérer votre position.");
});

// Formulaire : ajouter marker rouge
document.getElementById('add-marker').addEventListener('click', () => {
    const lat = parseFloat(document.getElementById('lat-input').value);
    const lng = parseFloat(document.getElementById('lng-input').value);

    if (isNaN(lat) || isNaN(lng)) {
        alert("Coordonnées invalides !");
        return;
    }

    if (personMarker) map.removeLayer(personMarker);

    personMarker = L.marker([lat, lng], { icon: redIcon }).addTo(map)
        .bindPopup("Bonhomme").openPopup();

    map.setView([lat, lng], 14);
});

// Clic sur la carte pour ajouter marker rouge
map.on('click', e => {
    if (personMarker) map.removeLayer(personMarker);

    personMarker = L.marker(e.latlng, { icon: redIcon }).addTo(map)
        .bindPopup("Bonhomme").openPopup();

    document.getElementById('lat-input').value = e.latlng.lat.toFixed(6);
    document.getElementById('lng-input').value = e.latlng.lng.toFixed(6);
});
