const map = L.map('map').setView([46.8, 2.5], 6);

// Fond de carte OpenStreetMap (gratuit, sans clé)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap'
}).addTo(map);

// Géolocalisation utilisateur
map.locate({ setView: true, maxZoom: 15 });

map.on('locationfound', e => {
  L.marker(e.latlng)
    .addTo(map)
    .bindPopup("Votre position")
    .openPopup();
});

map.on('locationerror', () => {
  alert("Géolocalisation refusée");
});


/***************************/
//affichage des calques pour véhicules
const couches = {};

fetch('data/poids_lourds.geojson')
  .then(r => r.json())
  .then(data => {
    couches["Poids lourds"] = L.geoJSON(data, {
      style: { color: 'red' }
    }).addTo(map);
  });

fetch('data/vehicules_legers.geojson')
  .then(r => r.json())
  .then(data => {
    couches["Véhicules légers"] = L.geoJSON(data, {
      style: { color: 'green' }
    }).addTo(map);
  });

// Contrôle des calques
L.control.layers(null, couches).addTo(map);



/***************************/
//affichage des images et etoiles pour informations
fetch('data/etoiles.geojson')
  .then(r => r.json())
  .then(data => {
    const etoiles = L.geoJSON(data, {
      pointToLayer: (feature, latlng) => {
        return L.marker(latlng, {
          icon: L.icon({
            iconUrl: 'https://cdn-icons-png.flaticon.com/512/616/616490.png',
            iconSize: [24, 24]
          })
        });
      },
      onEachFeature: (feature, layer) => {
        layer.bindPopup(`
          <strong>${feature.properties.titre}</strong><br>
          ${feature.properties.description}<br>
          <img src="${feature.properties.image}" width="200">
        `);
      }
    }).addTo(map);

    couches["Notes"] = etoiles;
  });



  /***************************/
//pour le lien
  const params = new URLSearchParams(window.location.search);
const lat = params.get('lat');
const lng = params.get('lng');

if (lat && lng) {
  L.marker([lat, lng])
    .addTo(map)
    .bindPopup("Position partagée")
    .openPopup();
}
