// =====================
// CONFIG
// =====================
const webAppURL = "https://script.google.com/macros/s/AKfycbytuq2_QeqdgaueYOIcg9TxhL_ydSYEzMNnqIUcEiDS9jYwN6r-aIGN_q4cBky4vTCP/exec"; // remplace par ton lien production

// Carte centrée France
const map = L.map("map").setView([46.6, 2.2], 6);

// Fond OSM
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap"
}).addTo(map);

// =====================
// ICONES
// =====================
const blueIcon = L.icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25,41],
  iconAnchor: [12,41]
});

const greenIcon = L.icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25,41],
  iconAnchor: [12,41]
});

const redIcon = L.icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25,41],
  iconAnchor: [12,41]
});

// =====================
// GOOGLE SHEET
// =====================
function sendPosition(lat, lng, name, color) {
  fetch(webAppURL, {
    method: "POST",
    body: JSON.stringify({ lat, lng, name, color })
  });
}

function loadPositions() {
  fetch(webAppURL)
    .then(r => r.json())
    .then(data => {
      data.forEach(p => {
        const icon =
          p.color === "blue" ? blueIcon :
          p.color === "green" ? greenIcon :
          redIcon;

        L.marker([p.lat, p.lng], { icon })
          .addTo(map)
          .bindPopup(p.name);
      });
    });
}

loadPositions();

// =====================
// ROLE SP / VICT
// =====================
document.getElementById("btn-sp").onclick = () => {
  let name = prompt("Nom SP :");
  if(!name) return;

  map.locate();
  map.once("locationfound", e => {
    L.marker(e.latlng, { icon: blueIcon }).addTo(map).bindPopup(name).openPopup();
    sendPosition(e.latlng.lat, e.latlng.lng, name, "blue");
  });

  document.getElementById("role-popup").style.display = "none";
};

document.getElementById("btn-vict").onclick = () => {
  map.locate();
  map.once("locationfound", e => {
    L.marker(e.latlng, { icon: greenIcon }).addTo(map).bindPopup("VICT").openPopup();
    sendPosition(e.latlng.lat, e.latlng.lng, "VICT", "green");
  });

  document.getElementById("role-popup").style.display = "none";
};

// =====================
// POINT ROUGE MANUEL
// =====================
document.getElementById("add-red-marker").onclick = () => {
  const lat = parseFloat(lat-input.value);
  const lng = parseFloat(lng-input.value);
  const name = red-name.value;

  if(isNaN(lat) || isNaN(lng) || !name){
    alert("Champs invalides");
    return;
  }

  L.marker([lat,lng], { icon: redIcon }).addTo(map).bindPopup(name);
  sendPosition(lat,lng,name,"red");
};

// =====================
// GPX MULTI-CALQUES
// =====================
const gpxLayers = {};
const selector = document.getElementById("layer");

selector.addEventListener("change", () => {
  const selected = Array.from(selector.selectedOptions).map(o => o.value);

  Object.keys(gpxLayers).forEach(k => {
    if(!selected.includes(k)) map.removeLayer(gpxLayers[k]);
  });

  selected.forEach(name => {
    if(!gpxLayers[name]){
      gpxLayers[name] = new L.GPX(`gpx/${name}.gpx`, {
        async: true,
        polyline_options: {
          color: getColor(name),
          weight: 4,
          opacity: 0.7
        }
      }).addTo(map);
    } else {
      map.addLayer(gpxLayers[name]);
    }
  });
});

function getColor(name){
  const colors = {
    PIETON: "orange",
    VLI: "blue",
    VLTT: "green",
    VSAV: "red",
    CTU: "purple",
    FPT: "black",
    CCF: "brown"
  };
  return colors[name] || "gray";
}

