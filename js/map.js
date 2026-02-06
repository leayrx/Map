// Carte centrée sur la France
const map = L.map('map').setView([46.6, 2.2], 5);

// OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
}).addTo(map);

// Icones
const blueIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const redIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// Markers
let personMarker = null;
let myPositionMarker = null;

// Géolocalisation pour point bleu
map.locate({ setView: false, maxZoom: 16 });
map.on('locationfound', e => {
    const name = document.getElementById('name-input').value || "Moi";
    if (myPositionMarker) map.removeLayer(myPositionMarker);

    myPositionMarker = L.marker(e.latlng, { icon: blueIcon }).addTo(map)
        .bindPopup(name).openPopup();
});

map.on('locationerror', e => {
    alert("Impossible de récupérer votre position.");
});

// Ajouter bonhomme rouge via formulaire
document.getElementById('add-marker').addEventListener('click', () => {
    const lat = parseFloat(document.getElementById('lat-input').value);
    const lng = parseFloat(document.getElementById('lng-input').value);

    if (isNaN(lat) || isNaN(lng)) { alert("Coordonnées invalides !"); return; }

    if (personMarker) map.removeLayer(personMarker);

    personMarker = L.marker([lat, lng], { icon: redIcon }).addTo(map)
        .bindPopup("Bonhomme rouge").openPopup();

    map.setView([lat, lng], 14);
});

// Ajouter bonhomme rouge par clic sur la carte
map.on('click', e => {
    if (personMarker) map.removeLayer(personMarker);

    personMarker = L.marker(e.latlng, { icon: redIcon }).addTo(map)
        .bindPopup("Bonhomme rouge").openPopup();

    document.getElementById('lat-input').value = e.latlng.lat.toFixed(6);
    document.getElementById('lng-input').value = e.latlng.lng.toFixed(6);
});
