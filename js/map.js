// Carte centrée sur France
const map = L.map('map').setView([46.6, 2.2], 5);

// OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
}).addTo(map);

// Icons
const blueIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const greenIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
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

// Variables markers
let userMarker = null;
let personMarker = null;

// Afficher popup de choix rôle au chargement
window.onload = function() {
    setTimeout(() => {
        if(confirm("Cliquez OK pour SP (bleu), Annuler pour VICT (vert)")) {
            let role = confirm("Vous êtes SP ?") ? "SP" : "VICT";
            if(role === "VICT") {
                // Marker vert VICT
                const lat = 46.6;  // Exemple : centre France
                const lng = 2.2;
                userMarker = L.marker([lat, lng], { icon: greenIcon })
                    .addTo(map)
                    .bindPopup("VICT").openPopup();
            } else {
                // SP : demander nom et géolocalisation
                let name = "";
                while(!name) {
                    name = prompt("Entrez votre nom pour le point bleu :");
                    if(!name) alert("Nom obligatoire !");
                }
                // Géolocalisation
                map.locate({ setView: true, maxZoom: 14 });
                map.on('locationfound', e => {
                    if(userMarker) map.removeLayer(userMarker);
                    userMarker = L.marker(e.latlng, { icon: blueIcon })
                        .addTo(map)
                        .bindPopup(name)
                        .openPopup();
                });
                map.on('locationerror', e => {
                    alert("Impossible de récupérer votre position, point au centre de la France.");
                    const lat = 46.6;
                    const lng = 2.2;
                    userMarker = L.marker([lat, lng], { icon: blueIcon })
                        .addTo(map)
                        .bindPopup(name)
                        .openPopup();
                });
            }
        }
    }, 100); // léger délai pour chargement complet
};

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

// Ajouter bonhomme rouge par clic
map.on('click', e => {
    if (personMarker) map.removeLayer(personMarker);

    personMarker = L.marker(e.latlng, { icon: redIcon }).addTo(map)
        .bindPopup("Bonhomme rouge").openPopup();

    document.getElementById('lat-input').value = e.latlng.lat.toFixed(6);
    document.getElementById('lng-input').value = e.latlng.lng.toFixed(6);
});
