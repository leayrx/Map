// Initialiser la carte centrée sur Paris
const map = L.map('map').setView([48.8566, 2.3522], 13);

// Ajouter OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors',
}).addTo(map);

// Géolocalisation de l'utilisateur
map.locate({ setView: true, maxZoom: 16, enableHighAccuracy: true });

map.on('locationfound', e => {
  L.marker(e.latlng)
    .addTo(map)
    .bindPopup("Votre position")
    .openPopup();

  L.circle(e.latlng, {
    radius: e.accuracy,
    color: 'blue',
    fillOpacity: 0.1
  }).addTo(map);
});

map.on('locationerror', e => {
  console.log("Impossible de récupérer la position : ", e.message);
});

// Marker de destination
let destinationMarker = null;

// Formulaire : ajouter marker
document.getElementById('add-marker').addEventListener('click', () => {
  const lat = parseFloat(document.getElementById('lat-input').value);
  const lng = parseFloat(document.getElementById('lng-input').value);

  if (isNaN(lat) || isNaN(lng)) {
    alert("Coordonnées invalides !");
    return;
  }

  // Supprimer l'ancien marker si existant
  if (destinationMarker) map.removeLayer(destinationMarker);

  // Ajouter nouveau marker
  destinationMarker = L.marker([lat, lng]).addTo(map)
    .bindPopup("Destination").openPopup();

  map.setView([lat, lng], 14);
});

// Clic sur la carte pour ajouter marker
map.on('click', e => {
  if (destinationMarker) map.removeLayer(destinationMarker);

  destinationMarker = L.marker(e.latlng).addTo(map)
    .bindPopup("Destination").openPopup();

  document.getElementById('lat-input').value = e.latlng.lat.toFixed(6);
  document.getElementById('lng-input').value = e.latlng.lng.toFixed(6);
});
