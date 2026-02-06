// Carte centrée sur la France
const map = L.map('map').setView([46.6, 2.2], 5);

// OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
}).addTo(map);

// Icone vert
const greenIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// Ajouter marker vert TOTO (position fixe pour test)
const latVICTIME = 48.8566; // Exemple : Paris
const lngVICTIME = 2.3522;

L.marker([latVICTIME, lngVICTIME], { icon: greenIcon })
  .addTo(map)
  .bindPopup("VICTIME")
  .openPopup();
