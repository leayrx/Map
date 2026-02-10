// =====================
// CONFIG
// =====================
const webAppURL = "https://script.google.com/macros/s/AKfycbzUmfZO6F3CwozIjT1C7abyyjvrbDnplnr5VaRQrtxZHrfpr2OgXb4hiAVhxcI0NPu5/exec"; 
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
function sendPosition(lat, lng, name, color, accuracy) {
  fetch(webAppURL, {
    method: "POST",
    body: JSON.stringify({ lat, lng, name, color, accuracy })
  });
}

function loadPositions() {
  fetch(webAppURL)
    .then(r => r.json())
    .then(data => {
      data.forEach(p => {
        L.marker([p.lat, p.lng], { icon: icons[p.color] })
          .addTo(map)
          .bindPopup(`${p.name}<br>± ${(p.accuracy / 1000).toFixed(2)} km`);
      });
    });
}

loadPositions();

// =====================
// TRACKING GPS
// =====================
function startTracking() {
  if (trackingTimer) clearInterval(trackingTimer);
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
  if (!currentName || !currentColor) return;

  const acc = e.accuracy;

  // ❌ AU-DELÀ DE 10 KM → BLOQUÉ
  if (acc > MAX_ACCURACY) {
    warningBox.innerText = `❌ GPS trop imprécis (± ${(acc / 1000).toFixed(2)} km)`;
    warningBox.style.display = "block";
    return;
  }

  // ℹ️ INFO PRÉCISION
  showGpsInfo(acc);

  // 📍 Marker
  if (!currentMarker) {
    currentMarker = L.marker(e.latlng, { icon: icons[currentColor] })
      .addTo(map)
      .bindPopup(() => `${currentName}<br>± ${(acc / 1000).toFixed(2)} km`)
      .openPopup();
  } else {
    currentMarker.setLatLng(e.latlng);
    currentMarker.setPopupContent(`${currentName}<br>± ${(acc / 1000).toFixed(2)} km`);
  }

  // 📡 Envoi
  sendPosition(e.latlng.lat, e.latlng.lng, currentName, currentColor, acc);
});

// =====================
// ROLES
// =====================
document.getElementById("btn-sp").onclick = () => {
  const name = prompt("Nom SP :");
  if (!name) return;

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
// POINT ROUGE MANUEL
// =====================
document.getElementById("add-red-marker").onclick = () => {
  const lat = parseFloat(document.getElementById("lat-input").value);
  const lng = parseFloat(document.getElementById("lng-input").value);
  const name = document.getElementById("red-name").value;

  if (isNaN(lat) || isNaN(lng) || !name) {
    alert("Champs invalides");
    return;
  }

  L.marker([lat, lng], { icon: icons.red })
    .addTo(map)
    .bindPopup(name);

  sendPosition(lat, lng, name, "red", 0);
};

// =====================
// GPX MULTI-CALQUES
// =====================
const gpxLayers = {};
const selector = document.getElementById("layer");

selector.addEventListener("change", () => {
  const selected = Array.from(selector.selectedOptions).map(o => o.value);

  Object.keys(gpxLayers).forEach(k => {
    if (!selected.includes(k)) map.removeLayer(gpxLayers[k]);
  });

  selected.forEach(name => {
    if (!gpxLayers[name]) {
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

function getColor(name) {
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
