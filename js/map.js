// Initialiser la carte centrée sur Paris
const map = L.map('map').setView([48.8566, 2.3522], 13);

// Ajouter OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors',
}).addTo(map);

// Définir l'icône "bonhomme" en SVG
const personIcon = L.icon({
    iconUrl: 'data:image/svg+xml;base64,' + btoa(`
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32">
            <circle cx="16" cy="8" r="4" fill="orange"/>
            <rect x="14" y="12" width="4" height="12" fill="orange"/>
            <line x1="14" y1="16" x2="8" y2="24" stroke="orange" stroke-width="2"/>
            <line x1="18" y1="16" x2="24" y2="24" stroke="orange" stroke-width="2"/>
            <line x1="14" y1="24" x2="10" y2="32" stroke="orange" stroke-width="2"/>
            <line x1="18" y1="24" x2="22" y2="32" stroke="orange" stroke-width="2"/>
        </svg>
    `),
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
});

// Marker "bonhomme"
let personMarker = null;

// Formulaire : ajouter marker
document.getElementById('add-marker').addEventListener('click', () => {
    const lat = parseFloat(document.getElementById('lat-input').value);
    const lng = parseFloat(document.getElementById('lng-input').value);

    if (isNaN(lat) || isNaN(lng)) {
        alert("Coordonnées invalides !");
        return;
    }

    if (personMarker) map.removeLayer(personMarker);

    // Ajouter le marker avec icône "bonhomme"
    personMarker = L.marker([lat, lng], { icon: personIcon }).addTo(map)
        .bindPopup("Bonhomme").openPopup();

    map.setView([lat, lng], 14);
});

// Clic sur la carte pour placer marker "bonhomme"
map.on('click', e => {
    if (personMarker) map.removeLayer(personMarker);

    personMarker = L.marker(e.latlng, { icon: personIcon }).addTo(map)
        .bindPopup("Bonhomme").openPopup();

    document.getElementById('lat-input').value = e.latlng.lat.toFixed(6);
    document.getElementById('lng-input').value = e.latlng.lng.toFixed(6);
});
