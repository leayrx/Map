// Initialiser la carte centrée sur la France
const map = L.map('map').setView([46.6, 2.2], 5);

// Ajouter OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
}).addTo(map);

// Icone bonhomme rouge pour position manuelle
const redIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// Icone casque de pompier pour position réelle
const helmetIcon = L.icon({
    iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/1/12/Firefighter_Helmet_icon.png',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
});

// Marker pour position manuelle
let personMarker = null;

// Marker pour position réelle
let myPositionMarker = null;

// Géolocalisation
map.locate({ setView: false, maxZoom: 16 });

map.on('locationfound', e => {
    if (myPositionMarker) map.removeLayer(myPositionMarker);

    myPositionMarker = L.marker(e.latlng, { icon: helmetIcon }).addTo(map)
        .bindPopup("Vous êtes ici (pompier)").openPopup();
});

map.on('locationerror', e => {
    alert("Impossible de récupérer votre position.");
});

// Formulaire : ajouter marker rouge
document.getElementById('add-marker').addEventListener('click', () => {
    const lat = parseFloat(document.getElementById('lat-input').value);
    const lng = parseFloat(document.getElementById('lng-input').value);

    if (isNaN(lat) || isNaN(lng)) { alert("Coordonnées invalides !"); return; }

    if (personMarker) map.removeLayer(personMarker);

    personMarker = L.marker([lat, lng], { icon: redIcon }).addTo(map)
        .bindPopup("Bonhomme rouge").openPopup();

    map.setView([lat, lng], 14); // zoom sur le bonhomme
});

// Clic sur la carte pour ajouter marker rouge
map.on('click', e => {
    if (personMarker) map.removeLayer(personMarker);

    personMarker = L.marker(e.latlng, { icon: redIcon }).addTo(map)
        .bindPopup("Bonhomme rouge").openPopup();

    document.getElementById('lat-input').value = e.latlng.lat.toFixed(6);
    document.getElementById('lng-input').value = e.latlng.lng.toFixed(6);
});
