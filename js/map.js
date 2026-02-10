// =====================
// CONFIG
// =====================
const webAppURL = "https://script.google.com/macros/s/AKfycbxCdYDAYFV9VHsnXYfF2-Y8rwbKFxmwzKwsnSOeiqmWnI9S5-NsLNFNPnGwMxxlj0nF/exec"; 
const MAX_ACCURACY = 10000; // 10 km
const TRACK_INTERVAL = 5000; // 5s

// =====================
// MAP
// =====================
const map = L.map("map").setView([46.6, 2.2], 6);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap"
}).addTo(map);

// =====================
// ICONES
// =====================
function createIcon(color) {
  return L.icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-${color}.png`,
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41]
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
let isSPALS = false;

// =====================
// UI GPS
// =====================
const warningBox = document.getElementById("gps-warning");
function showGpsInfo(meters) {
  const km = (meters / 1000).toFixed(2);
  warningBox.innerText = `📡 Précision GPS : ± ${km} km`;
  warningBox.style.display = "block";
}

// =====================
// GOOGLE SHEET
// =====================
function sendPosition(lat, lng, name, color, accuracy, photo=null) {
  fetch(webAppURL, {
    method: "POST",
    body: JSON.stringify({ lat, lng, name, color, accuracy, photo })
  });
}

async function loadPositions() {
  const res = await fetch(webAppURL);
  const data = await res.json();
  data.forEach(p => {
    const marker = L.marker([p.lat, p.lng], { 
      icon: icons[p.color], 
      draggable: p.color === 'red' && isSPALS 
    }).addTo(map);

    marker.bindPopup(() => {
      let html = `${p.name}<br>± ${(p.accuracy / 1000).toFixed(2)} km`;
      if(p.photo) html += `<br><img src="${p.photo}" width="100">`;
      if(isSPALS && p.color === 'red') html += `<br><button onclick="deleteMarker('${p.name}')">Supprimer</button>`;
      return html;
    });

    if(p.color === 'red' && isSPALS){
      marker.on('dragend', e => {
        const pos = e.target.getLatLng();
        sendPosition(pos.lat, pos.lng, p.name, p.color, p.accuracy, p.photo);
      });
    }
  });
}

// =====================
// TRACKING GPS
// =====================
function startTracking() {
  if(trackingTimer) clearInterval(trackingTimer);
  locateOnce();
  trackingTimer = setInterval(locateOnce, TRACK_INTERVAL);
}

function locateOnce() {
  map.locate({
    enableHighAccuracy: true,
    maximumAge: 0,
    timeout: 15000
  });
}

// =====================
// LOGIQUE GPS
// =====================
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
    currentMarker = L.marker(e.latlng, { icon: icons[currentColor] })
      .addTo(map)
      .bindPopup(`${currentName}<br>± ${(acc/1000).toFixed(2)} km`)
      .openPopup();
  } else {
    currentMarker.setLatLng(e.latlng);
    currentMarker.setPopupContent(`${currentName}<br>± ${(acc/1000).toFixed(2)} km`);
  }

  sendPosition(e.latlng.lat, e.latlng.lng, currentName, currentColor, acc);
});

// =====================
// ROLES
// =====================
document.getElementById("btn-sp").onclick = () => {
  const name = prompt("Nom SP :");
  if(!name) return;
  currentName = name;
  currentColor = "blue";
  startTracking();
  document.getElementById("role-popup").style.display = "none";
};

document.getElementById("btn-vict").onclick = () => {
  currentName = "VICT";
  currentColor = "green";
  startTracking();
  document.getElementById("role-popup").style.display = "none";
};

// =====================
// ADMIN BUTTON pour afficher LOGIN SPALS
// =====================
document.getElementById("btn-admin").onclick = () => {
  document.getElementById("login-popup").style.display = "block";
};

document.getElementById("login-cancel").onclick = () => {
  document.getElementById("login-popup").style.display = "none";
};

document.getElementById("login-btn").onclick = () => {
  const id = document.getElementById("login-id").value;
  const pass = document.getElementById("login-pass").value;
  if(id === "SPALS" && pass === "ALS1924"){
    isSPALS = true;
    document.getElementById("login-popup").style.display = "none";
    document.getElementById("red-popup").style.display = "block";
    loadPositions(); // recharge avec possibilité drag
  } else {
    document.getElementById("login-error").style.display = "block";
  }
};

// =====================
// AJOUT POINT ROUGE
// =====================
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
  if(photoFile){
    photoData = await fileToBase64(photoFile);
  }

  const marker = L.marker([lat,lng], { icon: icons.red, draggable: true })
    .addTo(map);

  marker.bindPopup(() => {
    let html = `${title}`;
    if(photoData) html += `<br><img src="${photoData}" width="100">`;
    if(isSPALS) html += `<br><button onclick="deleteMarker('${title}')">Supprimer</button>`;
    return html;
  });

  marker.on('dragend', e => {
    const pos = e.target.getLatLng();
    sendPosition(pos.lat, pos.lng, title, 'red', 0, photoData);
  });

  sendPosition(lat, lng, title, 'red', 0, photoData);
  alert("Point rouge ajouté !");
};

document.getElementById("red-close-btn").onclick = () => {
  document.getElementById("red-popup").style.display = "none";
};

// =====================
// POINT ROUGE MANUEL
// =====================
document.getElementById("add-red-marker").onclick = () => {
  const lat = parseFloat(document.getElementById("lat-input").value);
  const lng = parseFloat(document.getElementById("lng-input").value);
  const name = document.getElementById("red-name").value;

  if(isNaN(lat) || isNaN(lng) || !name){
    alert("Champs invalides");
    return;
  }

  const marker = L.marker([lat, lng], { icon: icons.red }).addTo(map);
  marker.bindPopup(name);

  sendPosition(lat, lng, name, "red", 0);
};

// =====================
// GPX MULTI-CALQUES + BALISE
// =====================
const gpxLayers = {};
const selector = document.getElementById("layer");

selector.addEventListener("change", () => {
  const selected = Array.from(selector.selectedOptions).map(o => o.value);

  Object.keys(gpxLayers).forEach(k => {
    if(!selected.includes(k)) map.removeLayer(gpxLayers[k]);
  });

  selected.forEach(name => {
    if(name === 'BALISE'){
      loadPositions(); // recharge tous les points rouges visibles
    } else if(!gpxLayers[name]){
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

// =====================
// UTILITAIRES
// =====================
function fileToBase64(file){
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
    reader.readAsDataURL(file);
  });
}

window.deleteMarker = function(name){
  if(!isSPALS) return alert("Seul SPALS peut supprimer un point");
  if(!confirm(`Supprimer la balise "${name}" ?`)) return;

  fetch(`${webAppURL}?name=${encodeURIComponent(name)}`, { method: "DELETE" })
    .then(r => r.text())
    .then(res => {
      if(res === "OK"){
        alert("Point supprimé !");
        loadPositions(); // recharge carte
      } else {
        alert("Point introuvable");
      }
    });
};

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
