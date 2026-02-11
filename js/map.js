// =====================
// CONFIG
// =====================
const webAppURL = "https://script.google.com/macros/s/AKfycbxW8DagSknAsjkKpcnRk1JkaTTbc3I_3xoOBo4BNuowL9Vq8_x0qcMetYCxblnsxZMW/exec";
const MAX_ACCURACY = 10000; // 10 km
const TRACK_INTERVAL = 5000; // 5s

// =====================
// MAP INIT
// =====================
const map = L.map("map").setView([46.6, 2.2], 6);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap"
}).addTo(map);

// =====================
// ICONES
// =====================
function createIcon(color){
  return L.icon({
    iconUrl:`https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-${color}.png`,
    shadowUrl:"https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize:[25,41],
    iconAnchor:[12,41]
  });
}

const icons = {
  blue: createIcon("blue"),
  green: createIcon("green"),
  red: createIcon("red")
};

// =====================
// ETAT UTILISATEUR
// =====================
let currentName = null;
let currentColor = null;
let currentMarker = null;
let trackingTimer = null;
let isAdmin = false;

// =====================
// UI GPS
// =====================
const warningBox = document.getElementById("gps-warning");
function showGpsInfo(meters){
  const km = (meters/1000).toFixed(2);
  warningBox.innerText = `📡 Précision GPS : ± ${km} km`;
  warningBox.style.display = "block";
}

// =====================
// SEND POSITION
// =====================
async function sendPosition(lat, lng, name, color, accuracy, photo=null){
  await fetch(webAppURL, {
    method: "POST",
    body: JSON.stringify({lat, lng, name, color, accuracy, photo})
  });
}

// =====================
// LAYERS
// =====================
let gpxLayers = {};           // GPX
let sheetLayer = L.layerGroup().addTo(map); // markers Google Sheet

// =====================
// LOAD ALL POSITIONS
// =====================
async function loadPositions(){
  try {
    const r = await fetch(webAppURL);
    const data = await r.json();

    // On garde le SP/VICT actuel
    const savedCurrentMarker = currentMarker;

    // Supprimer seulement les anciens markers Sheet
    sheetLayer.clearLayers();

    data.forEach(p => {
      const draggable = (p.color === "red" && isAdmin);

      // Créer le marker
      const marker = L.marker([p.lat, p.lng], {icon: icons[p.color || "red"], draggable})
        .bindPopup(() => {
          let html = `${p.name}`;
          if(p.color === "blue" || p.color === "green") html += `<br>± ${(p.accuracy/1000).toFixed(2)} km`;
          else html += `<br>Lat: ${p.lat.toFixed(5)}, Lng: ${p.lng.toFixed(5)}`;
          if(p.photo) html += `<br><img src="${p.photo}" width="100">`;
          if(draggable || isAdmin) html += `<br><button onclick="deleteMarker('${p.name}')">Supprimer</button>`;
          return html;
        });

      if(draggable){
        marker.on('dragend', e => {
          const pos = e.target.getLatLng();
          sendPosition(pos.lat, pos.lng, p.name, p.color, p.accuracy, p.photo);
        });
      }

      // SP et VICT actuels ne sont jamais supprimés
      if(savedCurrentMarker && p.name === currentName){
        savedCurrentMarker.setLatLng([p.lat, p.lng]);
        savedCurrentMarker.setPopupContent(`${currentName}<br>± ${(p.accuracy/1000).toFixed(2)} km`);
      } else {
        sheetLayer.addLayer(marker);
      }
    });
  } catch(err){
    console.error("Erreur loadPositions:", err);
  }
}

// =====================
// GPS TRACKING
// =====================
function startTracking(){
  if(trackingTimer) clearInterval(trackingTimer);
  locateOnce();
  trackingTimer = setInterval(locateOnce, TRACK_INTERVAL);
}

function locateOnce(){
  map.locate({enableHighAccuracy:true, maximumAge:0, timeout:15000});
}

map.on("locationfound", e => {
  if(!currentName || !currentColor) return;

  const acc = e.accuracy;
  if(acc > MAX_ACCURACY){
    warningBox.innerText = `❌ GPS trop imprécis (± ${(acc/1000).toFixed(2)} km)`;
    warningBox.style.display = "block";
    return;
  }

  showGpsInfo(acc);

  if(!currentMarker){
    currentMarker = L.marker(e.latlng, {icon: icons[currentColor]}).addTo(map)
      .bindPopup(`${currentName}<br>± ${(acc/1000).toFixed(2)} km`)
      .openPopup();
  } else {
    currentMarker.setLatLng(e.latlng);
    currentMarker.setPopupContent(`${currentName}<br>± ${(acc/1000).toFixed(2)} km`);
  }

  sendPosition(e.latlng.lat, e.latlng.lng, currentName, currentColor, acc, null);
});

// =====================
// ROLES SP / VICT
// =====================
document.getElementById("btn-sp").onclick = () => {
  const name = prompt("Nom SP :");
  if(!name) return;
  currentName = name;
  currentColor = "blue";
  startTracking();
  document.getElementById("role-popup").style.display="none";
};

document.getElementById("btn-vict").onclick = () => {
  currentName = "VICT";
  currentColor = "green";
  startTracking();
  document.getElementById("role-popup").style.display="none";
};

// =====================
// ADMIN LOGIN
// =====================
const adminIndicator = document.getElementById("admin-status");

document.getElementById("btn-admin").onclick = () => {
  if(isAdmin){
    isAdmin = false;
    adminIndicator.style.display="none";
    document.getElementById("red-popup").style.display="none";
    alert("Déconnecté du mode Admin");
    loadPositions();
    return;
  }
  document.getElementById("login-popup").style.display="block";
};

document.getElementById("login-cancel").onclick = () => {
  document.getElementById("login-popup").style.display="none";
};

document.getElementById("login-btn").onclick = () => {
  const id = document.getElementById("login-id").value;
  const pass = document.getElementById("login-pass").value;

  if(id === "SPALS" && pass === "ALS1924"){
    isAdmin = true;
    document.getElementById("login-popup").style.display="none";
    document.getElementById("red-popup").style.display="block";
    adminIndicator.style.display="block";
    alert("Connexion Admin réussie");
    loadPositions();
  } else {
    document.getElementById("login-error").style.display="block";
  }
};

// =====================
// AJOUT / SUPPRESSION POINT ROUGE (ADMIN)
// =====================
document.getElementById("red-add-btn").onclick = async (e) => {
  e.preventDefault();

  const lat = parseFloat(document.getElementById("red-lat").value);
  const lng = parseFloat(document.getElementById("red-lng").value);
  const name = document.getElementById("red-title").value;

  if(isNaN(lat) || isNaN(lng) || !name){
    alert("Veuillez entrer un nom et des coordonnées valides !");
    return;
  }

  try {
    await sendPosition(lat, lng, name, "red", 0, null);

    const marker = L.marker([lat, lng], {icon: icons.red, draggable: true})
      .addTo(sheetLayer)
      .bindPopup(`${name}<br>Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}
                  <br><button onclick="deleteMarker('${name}')">Supprimer</button>`);

    marker.on('dragend', async (ev) => {
      const pos = ev.target.getLatLng();
      await sendPosition(pos.lat, pos.lng, name, "red", 0, null);
    });

    alert("Point rouge ajouté !");
    document.getElementById("red-lat").value = "";
    document.getElementById("red-lng").value = "";
    document.getElementById("red-title").value = "";

    await loadPositions();

  } catch(err){
    console.error(err);
    alert("Erreur lors de l'ajout du point rouge !");
  }
};

window.deleteMarker = async function(name){
  if(!isAdmin) return alert("Seul Admin peut supprimer");
  if(!confirm(`Supprimer "${name}" ?`)) return;
  const r = await fetch(`${webAppURL}?name=${encodeURIComponent(name)}`, {method: "DELETE"});
  const text = await r.text();
  if(text === "OK"){
    alert("Supprimé !");
    loadPositions();
  } else alert("Introuvable");
};

// =====================
// AFFICHAGE CALQUES GPX
// =====================
const selector = document.getElementById("layer");

selector.addEventListener("change", function() {
  const selectedOptions = Array.from(this.selectedOptions).map(opt => opt.value);

  // Masquer tous les calques existants qui ne sont pas sélectionnés
  Object.keys(gpxLayers).forEach(key => {
    if(!selectedOptions.includes(key)){
      map.removeLayer(gpxLayers[key]);
    }
  });

  // Charger ou ré-afficher les calques sélectionnés
  selectedOptions.forEach(name => {
    if(!gpxLayers[name]) {
      const gpx = new L.GPX(`gpx/${name}.gpx`, {
        async: true,
        polyline_options: { color: getColorForGPX(name), weight: 4, opacity: 0.7 }
      }).on('loaded', function(e){
        // ne pas re-centrer la carte à chaque calque
      }).addTo(map);
      gpxLayers[name] = gpx;
    } else {
      map.addLayer(gpxLayers[name]);
    }
  });
});

function getColorForGPX(name){
  const colors = {
    Pieton: "#007bff",  // bleu vif
    VLI: "#28a745",     // vert vif
    VLTT: "#fd7e14",    // orange vif
    VSAV: "#dc3545",    // rouge vif
    CTU: "#6f42c1",     // violet vif
    FPT: "#ffc107",     // jaune vif
    CCF: "#e83e8c"      // rose vif
  };
  return colors[name] || "#343a40"; // gris foncé si non défini

}

// =====================
// INITIAL LOAD
// =====================
loadPositions();
