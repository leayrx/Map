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
    body: JSON.stringify({lat,lng,name,color,accuracy,photo})
  });
}

// =====================
// LOAD ALL POSITIONS
// =====================
async function loadPositions(){
  const r = await fetch(webAppURL);
  const data = await r.json();

  // Supprimer tous les markers sauf SP/VICT actuel
  map.eachLayer(layer => {
    if(layer instanceof L.Marker && layer !== currentMarker) map.removeLayer(layer);
  });

  data.forEach(p => {
    const draggable = (p.color === "red" && isAdmin);
    const marker = L.marker([p.lat, p.lng], {icon: icons[p.color || "red"], draggable})
      .addTo(map)
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
  });
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
    currentMarker = L.marker(e.latlng, {icon: icons[currentColor]})
      .addTo(map)
      .bindPopup(`${currentName}<br>± ${(acc/1000).toFixed(2)} km`)
      .openPopup();
  } else{
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
// FERMER POPUP RED
// =====================
document.getElementById("red-close-btn").onclick = () => {
  document.getElementById("red-popup").style.display = "none";
};

// =====================
// AJOUT POINT ROUGE (ADMIN)
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

    // ajouter directement le marker
    const marker = L.marker([lat, lng], {icon: icons.red, draggable: true})
      .addTo(map)
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

// =====================
// SUPPRESSION MARKER
// =====================
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
// AFFICHAGE CALQUES
// =====================
// Layer groups pour chaque type
const vehicleLayers = {
  PIETON: L.layerGroup().addTo(map),
  VLI: L.layerGroup().addTo(map),
  VLTT: L.layerGroup().addTo(map),
  VSAV: L.layerGroup().addTo(map),
  CTU: L.layerGroup().addTo(map),
  FPT: L.layerGroup().addTo(map),
  CCF: L.layerGroup().addTo(map),
  BALISE: L.layerGroup().addTo(map)
};

// Quand on charge les positions
data.forEach(p => {
  if(p.type && vehicleLayers[p.type]){
    const marker = L.marker([p.lat, p.lng], {icon: icons.red}).bindPopup(p.name);
    vehicleLayers[p.type].addLayer(marker);
  }
});

// Filtrer selon le select
document.getElementById("layer").addEventListener("change", () => {
  const selected = Array.from(document.getElementById("layer").selectedOptions).map(opt=>opt.value);
  Object.keys(vehicleLayers).forEach(type => {
    if(selected.includes(type)){
      vehicleLayers[type].addTo(map);
    } else {
      map.removeLayer(vehicleLayers[type]);
    }
  });
});


// =====================
// INITIAL LOAD
// =====================
loadPositions();
