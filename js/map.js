// ==== Carte centrée sur France ====
const map = L.map('map').setView([46.6, 2.2], 5);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors',
}).addTo(map);

// ==== Icônes ====
const blueIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25,41], iconAnchor: [12,41], popupAnchor:[1,-34], shadowSize:[41,41]
});

const greenIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25,41], iconAnchor: [12,41], popupAnchor:[1,-34], shadowSize:[41,41]
});

const redIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25,41], iconAnchor: [12,41], popupAnchor:[1,-34], shadowSize:[41,41]
});

// ==== URL Apps Script ====
const webAppURL = "https://script.google.com/macros/s/AKfycbytuq2_QeqdgaueYOIcg9TxhL_ydSYEzMNnqIUcEiDS9jYwN6r-aIGN_q4cBky4vTCP/exec"; // remplace par ton lien production

const allMarkers = [];

// ==== Récupérer tous les points existants ====
fetch(webAppURL)
  .then(res => res.json())
  .then(data => {
    data.forEach(point => {
      let icon = redIcon;
      if(point.color==="blue") icon=blueIcon;
      else if(point.color==="green") icon=greenIcon;

      const marker = L.marker([parseFloat(point.lat), parseFloat(point.lng)], {icon})
        .addTo(map)
        .bindPopup(point.name);
      allMarkers.push(marker);
    });
  });

// ==== Envoyer position à Google Sheet ====
function sendPosition(lat,lng,name,color){
  fetch(webAppURL, {
    method:"POST",
    body: JSON.stringify({lat,lng,name,color})
  })
  .then(res => res.text())
  .then(t => console.log("Réponse Apps Script :", t))
  .catch(err => console.error("Erreur Apps Script :", err));
}

// ==== Gestion popup rôle ====
document.getElementById('btn-sp').addEventListener('click', () => {
  let name = "";
  while(!name){
    name = prompt("Entrez votre nom pour le point bleu :");
    if(!name) alert("Nom obligatoire !");
  }

  map.locate({setView:true, maxZoom:14});
  map.on('locationfound', e => {
    const marker = L.marker(e.latlng, {icon: blueIcon})
      .addTo(map).bindPopup(name).openPopup();
    allMarkers.push(marker);
    sendPosition(e.latlng.lat, e.latlng.lng, name, "blue");
  });
  map.on('locationerror', e => {
    alert("Impossible de récupérer votre position, point au centre de la France.");
    const latlng = [46.6,2.2];
    const marker = L.marker(latlng,{icon:blueIcon}).addTo(map).bindPopup(name).openPopup();
    allMarkers.push(marker);
    sendPosition(latlng[0], latlng[1], name, "blue");
  });

  document.getElementById('role-popup').style.display='none';
});

document.getElementById('btn-vict').addEventListener('click', () => {
  const name = "VICT";

  map.locate({setView:true, maxZoom:14});
  map.on('locationfound', e => {
    const marker = L.marker(e.latlng, {icon: greenIcon})
      .addTo(map).bindPopup(name).openPopup();
    allMarkers.push(marker);
    sendPosition(e.latlng.lat, e.latlng.lng, name, "green");
  });
  map.on('locationerror', e => {
    alert("Impossible de récupérer votre position, point au centre de la France.");
    const latlng = [46.6,2.2];
    const marker = L.marker(latlng,{icon:greenIcon}).addTo(map).bindPopup(name).openPopup();
    allMarkers.push(marker);
    sendPosition(latlng[0], latlng[1], name, "green");
  });

  document.getElementById('role-popup').style.display='none';
});

// ==== Ajouter bonhomme rouge via formulaire ====
document.getElementById('add-red-marker').addEventListener('click', () => {
  const lat = parseFloat(document.getElementById('lat-input').value);
  const lng = parseFloat(document.getElementById('lng-input').value);
  const name = document.getElementById('red-name').value || "Bonhomme rouge";

  if(isNaN(lat) || isNaN(lng)){ alert("Coordonnées invalides !"); return; }

  const marker = L.marker([lat,lng], {icon: redIcon}).addTo(map).bindPopup(name).openPopup();
  allMarkers.push(marker);

  map.setView([lat,lng], 14);
});

// ==== Ajouter point rouge en cliquant sur la carte ====
map.on('click', e => {
  const name = prompt("Nom du point rouge :", "Bonhomme rouge");
  if(!name) return;

  const marker = L.marker(e.latlng, {icon: redIcon}).addTo(map).bindPopup(name).openPopup();
  allMarkers.push(marker);

  document.getElementById('lat-input').value = e.latlng.lat.toFixed(6);
  document.getElementById('lng-input').value = e.latlng.lng.toFixed(6);
});
