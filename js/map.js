// =====================
// CONFIG
// =====================
const webAppURL = "https://script.google.com/macros/s/AKfycbwbmWgucmIGTx0Yiw62vIYWXDtVj1iqJ24MK3oOu6UrE5pQ-BCbRQwI4GRZuVypWzPT/exec"; 
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
let isAdmin = false;

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

function loadPositions() {
  fetch(webAppURL)
    .then(r => r.json())
    .then(data => {
      // Supprimer les markers existants
      if(window.allMarkers){
        window.allMarkers.forEach(m => map.removeLayer(m));
      }
      window.allMarkers = [];

      data.forEach(p => {
        const marker = L.marker([p.lat, p.lng], { 
          icon: icons[p.color], 
          draggable: (p.color === 'red' && isAdmin) || ((p.color === 'blue' || p.color === 'green') && isAdmin)
        }).addTo(map)
        .bindPopup(() => {
          let html = `${p.name}<br>± ${(p.accuracy/1000).toFixed(2)} km`;
          if(p.photo) html += `<br><img src="${p.photo}" width="100">`;
          if(isAdmin){
            html += `<br><button onclick="deleteMarker('${p.name}')">Supprimer</button>`;
          }
          return html;
        });
        
        // Sauvegarde du marker pour suppression future
        window.allMarkers.push(marker);

        if(marker.options.draggable){
          marker.on('dragend', e => {
            const pos = e.target.getLatLng();
            sendPosition(pos.lat, pos.lng, p.name, p.color, p.accuracy, p.photo);
          });
        }
      });
    });
}

loadPositions();

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
      .bindPopup(() => `${currentName}<br>± ${(acc/1000).toFixed(2)} km`)
      .openPopup();
  } else {
    currentMarker.setLatLng(e.latlng);
    currentMarker.setPopupContent(`${currentName}<br>± ${(acc/1000).toFixed(2)} km`);
  }

  sendPosition(e.latlng.lat, e.latlng.lng, currentName, currentColor, acc);
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
  document.getElementById("role-popup").style.display = "none";
};

document.getElementById("btn-vict").onclick = () => {
  currentName = "VICT";
  currentColor = "green";
  startTracking();
  document.getElementById("role-popup").style.display = "none";
};

// =====================
// BOUTON ADMIN EN BAS DROITE
// =====================
const adminBtn = document.createElement("button");
adminBtn.innerText = "Admin";
adminBtn.style.position = "absolute";
adminBtn.style.bottom = "10px";
adminBtn.style.right = "10px";
adminBtn.style.zIndex = 4000;
adminBtn.style.padding = "8px";
adminBtn.style.background = "#f39c12";
adminBtn.style.border = "none";
adminBtn.style.borderRadius = "5px";
adminBtn.style.color = "white";
adminBtn.style.cursor = "pointer";
document.body.appendChild(adminBtn);

adminBtn.onclick = () => {
  const password = prompt("Mot de passe Admin :");
  if(password === "ALS1924"){
    isAdmin = true;
    alert("Admin connecté !");
    loadPositions();
  } else {
    alert("Mot de passe incorrect");
  }
};

// =====================
// SUPPRESSION SP / VICT OU POINT ROUGE
// =====================
window.deleteMarker = function(name){
  if(!isAdmin) return alert("Seul Admin peut supprimer un point");
  if(!confirm(`Supprimer ${name} ?`)) return;

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

// =====================
// FORMULAIRE POINT ROUGE
// =====================
document.getElementById("add-red-marker").onclick = () => {
  const lat = parseFloat(document.getElementById("lat-input").value);
  const lng = parseFloat(document.getElementById("lng-input").value);
  const name = document.getElementById("red-name").value;

  if(isNaN(lat) || isNaN(lng) || !name){
    alert("Champs invalides");
    return;
  }

  L.marker([lat, lng], { icon: icons.red })
    .addTo(map)
    .bindPopup(name);

  sendPosition(lat, lng, name, "red", 0);
};

// =====================
// GPX + BALISE
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
      loadPositions(); // recharge tous les points rouges
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
