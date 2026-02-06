// Initialiser la carte centrée sur Allassac
const map = L.map('map').setView([45.25844, 1.477168], 13);

// Ajouter OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors',
}).addTo(map);

// Marker “bonhomme”
let personMarker = null;

// Formulaire : ajouter marker
document.getElementById('add-marker').addEventListener('click', () => {
  const lat = parseFloat(document.getElementById('lat-input').value);
  const lng = parseFloat(document.getElementById('lng-input').value);

  if (isNaN(lat) || isNaN(lng)) {
    alert("Coordonnées invalides !");
    return;
  }

  // Supprimer l'ancien marker si existant
  if (personMarker) map.removeLayer(personMarker);

  // Ajouter nouveau marker “bonhomme”
  personMarker = L.marker([lat, lng]).addTo(map)
    .bindPopup("Bonhomme").openPopup();

  map.setView([lat, lng], 14);
});

// Clic sur la carte pour placer le marker “bonhomme”
map.on('click', e => {
  if (personMarker) map.removeLayer(personMarker);

  personMarker = L.marker(e.latlng).addTo(map)
    .bindPopup("Bonhomme").openPopup();

  document.getElementById('lat-input').value = e.latlng.lat.toFixed(6);
  document.getElementById('lng-input').value = e.latlng.lng.toFixed(6);
});
