// =====================
// CONFIG
// =====================
const webAppURL = "https://script.google.com/macros/s/AKfycbxW8DagSknAsjkKpcnRk1JkaTTbc3I_3xoOBo4BNuowL9Vq8_x0qcMetYCxblnsxZMW/exec"; // remplacer par ton URL de webapp
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
// SEND POSITION (POST JSON)
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

  // Supprimer anciens markers (sauf celui du SP/VICT en cours)
  map.eachLayer(layer => {
    if(layer instanceof L.Marker && layer !== currentMarker) map.removeLayer(layer);
  });

  data.forEach(p => {
    const draggable = (p.color === "red" && isAdmin);
    const marker = L.marker([p.lat, p.lng], {icon: icons[p.color || "red"], draggable})
                    .addTo(map)
                    .bindPopup(() => {
                      let html = `${p.name}<br>± ${(p.accuracy/1000).toFixed(2)} km`;
                      if(p.photo) html += `<br><img src="${p.photo}" width="100">`;
                      if(draggable) html += `<br><button onclick="deleteMarker('${p.name}')">Supprimer</button>`;
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

  // Photo = null pour SP/VICT
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
const adminIndicator = document.getElementById("admin-indicator");

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
// POINT ROUGE AVEC PHOTO
// =====================
async function fileToBase64(file){
  return new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload = () => res(reader.result);
    reader.onerror = e => rej(e);
    reader.readAsDataURL(file);
  });
}

document.getElementById("red-add-btn").onclick = async () => {
  const lat = parseFloat(document.getElementById("red-lat").value);
  const lng = parseFloat(document.getElementById("red-lng").value);
  const title = document.getElementById("red-title").value;
  const photoFile = document.getElementById("red-photo").files[0];

  if(isNaN(lat) || isNaN(lng) || !title){
    alert("Champs invalides");
    return;
  }

  let photoData = null;
  if(photoFile) photoData = await fileToBase64(photoFile);

  await sendPosition(lat, lng, title, "red", 0, photoData);
  alert("Point rouge ajouté !");
  loadPositions();
};

document.getElementById("red-close-btn").onclick = () => {
  document.getElementById("red-popup").style.display="none";
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
// INITIAL LOAD
// =====================
loadPositions();
