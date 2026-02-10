// =====================
// CONFIG
// =====================
const SHEET_POS_ID = "1XIQMBR1XS2b3nKYCWpLpZnJiIILnph68i8kSJ1Qg6B8"; // Feuille1 pour positions SP/VICT
const SHEET_RED_ID = "1XIQMBR1XS2b3nKYCWpLpZnJiIILnph68i8kSJ1Qg6B8"; // Feuille2 pour points rouges
const SHEET_POS_NAME = "Feuille1";
const SHEET_RED_NAME = "Feuille2";
const DRIVE_FOLDER_ID = "1RfdqaabDnpa6z09zn7i3HeToidogNqus";
const webAppURL = "https://script.google.com/macros/s/AKfycbwbmWgucmIGTx0Yiw62vIYWXDtVj1iqJ24MK3oOu6UrE5pQ-BCbRQwI4GRZuVypWzPT/exe"; 

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
  blue:createIcon("blue"),
  green:createIcon("green"),
  red:createIcon("red")
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
// FETCH GOOGLE SHEET
// =====================
async function sendPosition(lat,lng,name,color,accuracy,photo=null,sheet=SHEET_POS_NAME){
  await fetch(webAppURL,{
    method:"POST",
    body:JSON.stringify({lat,lng,name,color,accuracy,photo,sheet})
  });
}

async function loadPositions(sheet=SHEET_POS_NAME){
  const r = await fetch(`${webAppURL}?sheet=${sheet}`);
  const data = await r.json();
  const markers = [];
  data.forEach(p=>{
    const draggable = p.color==='red' && isAdmin;
    const marker = L.marker([p.lat,p.lng],{icon:icons[p.color],draggable})
      .addTo(map)
      .bindPopup(()=>{
        let html = `${p.name}<br>± ${(p.accuracy/1000).toFixed(2)} km`;
        if(p.photo) html += `<br><img src="${p.photo}" width="100">`;
        if(isAdmin) html += `<br><button onclick="deleteMarker('${p.name}','${sheet}')">Supprimer</button>`;
        return html;
      });
    if(draggable){
      marker.on('dragend',e=>{
        const pos = e.target.getLatLng();
        sendPosition(pos.lat,pos.lng,p.name,p.color,p.accuracy,p.photo,sheet);
      });
    }
    markers.push(marker);
  });
  return markers;
}

// =====================
// GPS TRACKING
// =====================
function startTracking(){
  if(trackingTimer) clearInterval(trackingTimer);
  locateOnce();
  trackingTimer = setInterval(locateOnce,TRACK_INTERVAL);
}

function locateOnce(){
  map.locate({enableHighAccuracy:true,maximumAge:0,timeout:15000});
}

map.on("locationfound", e=>{
  if(!currentName || !currentColor) return;
  const acc = e.accuracy;
  if(acc>MAX_ACCURACY){
    warningBox.innerText = `❌ GPS trop imprécis (± ${(acc/1000).toFixed(2)} km)`;
    warningBox.style.display="block";
    return;
  }
  showGpsInfo(acc);
  if(!currentMarker){
    currentMarker=L.marker(e.latlng,{icon:icons[currentColor]})
      .addTo(map)
      .bindPopup(`${currentName}<br>± ${(acc/1000).toFixed(2)} km`)
      .openPopup();
  } else{
    currentMarker.setLatLng(e.latlng);
    currentMarker.setPopupContent(`${currentName}<br>± ${(acc/1000).toFixed(2)} km`);
  }
  sendPosition(e.latlng.lat,e.latlng.lng,currentName,currentColor,acc,SHEET_POS_NAME);
});

// =====================
// ROLES
// =====================
document.getElementById("btn-sp").onclick = ()=>{
  const name = prompt("Nom SP :");
  if(!name) return;
  currentName=name;
  currentColor="blue";
  startTracking();
  document.getElementById("role-popup").style.display="none";
};

document.getElementById("btn-vict").onclick = ()=>{
  currentName="VICT";
  currentColor="green";
  startTracking();
  document.getElementById("role-popup").style.display="none";
};

// =====================
// ADMIN
// =====================
document.getElementById("btn-login").onclick = ()=>{ document.getElementById("login-popup").style.display="block"; };
document.getElementById("login-cancel").onclick = ()=>{ document.getElementById("login-popup").style.display="none"; };
document.getElementById("btn-admin").onclick = ()=>{ document.getElementById("login-popup").style.display="block"; };

document.getElementById("login-btn").onclick = ()=>{
  const id=document.getElementById("login-id").value;
  const pass=document.getElementById("login-pass").value;
  if(id==="SPALS" && pass==="ALS1924"){
    isAdmin=true;
    document.getElementById("login-popup").style.display="none";
    document.getElementById("red-popup").style.display="block";
    loadPositions(SHEET_RED_NAME); // recharge avec possibilité drag
    loadPositions(SHEET_POS_NAME); // recharge SP/VICT
  } else document.getElementById("login-error").style.display="block";
};

// =====================
// POINT ROUGE
// =====================
async function fileToBase64(file){
  return new Promise((res,rej)=>{
    const reader=new FileReader();
    reader.onload=()=>res(reader.result);
    reader.onerror=e=>rej(e);
    reader.readAsDataURL(file);
  });
}

document.getElementById("red-add-btn").onclick = async ()=>{
  const lat=parseFloat(document.getElementById("red-lat").value);
  const lng=parseFloat(document.getElementById("red-lng").value);
  const title=document.getElementById("red-title").value;
  const photoFile=document.getElementById("red-photo").files[0];
  if(isNaN(lat)||isNaN(lng)||!title){ alert("Champs invalides"); return; }

  let photoData=null;
  if(photoFile) photoData = await fileToBase64(photoFile);

  sendPosition(lat,lng,title,'red',0,photoData,SHEET_RED_NAME);
  alert("Point rouge ajouté !");
  loadPositions(SHEET_RED_NAME);
};

document.getElementById("red-close-btn").onclick = ()=>{ document.getElementById("red-popup").style.display="none"; };

// POINT ROUGE MANUEL
document.getElementById("add-red-marker").onclick = ()=>{
  const lat=parseFloat(document.getElementById("lat-input").value);
  const lng=parseFloat(document.getElementById("lng-input").value);
  const name=document.getElementById("red-name").value;
  if(isNaN(lat)||isNaN(lng)||!name){ alert("Champs invalides"); return; }
  L.marker([lat,lng],{icon:icons.red}).addTo(map).bindPopup(name);
  sendPosition(lat,lng,name,"red",0,null,SHEET_RED_NAME);
};

// =====================
// GPX MULTI-CALQUES
// =====================
const gpxLayers={};
const selector=document.getElementById("layer");
selector.addEventListener("change",()=>{
  const selected=Array.from(selector.selectedOptions).map(o=>o.value);
  Object.keys(gpxLayers).forEach(k=>{
    if(!selected.includes(k)) map.removeLayer(gpxLayers[k]);
  });
  selected.forEach(name=>{
    if(name==='BALISE'){
      loadPositions(SHEET_RED_NAME);
    } else if(!gpxLayers[name]){
      gpxLayers[name]=new L.GPX(`gpx/${name}.gpx`,{
        async:true,
        polyline_options:{color:getColor(name),weight:4,opacity:0.7}
      }).addTo(map);
    } else map.addLayer(gpxLayers[name]);
  });
});

function getColor(name){
  const colors={PIETON:"orange",VLI:"blue",VLTT:"green",VSAV:"red",CTU:"purple",FPT:"black",CCF:"brown"};
  return colors[name]||"gray";
}

// =====================
// SUPPRESSION MARKER
// =====================
window.deleteMarker=async function(name,sheet){
  if(!isAdmin) return alert("Seul Admin peut supprimer");
  if(!confirm(`Supprimer "${name}" ?`)) return;
  const r=await fetch(`${webAppURL}?name=${encodeURIComponent(name)}&sheet=${sheet}`,{method:"DELETE"});
  const text=await r.text();
  if(text==="OK"){ alert("Supprimé !"); loadPositions(sheet); }
  else alert("Introuvable");
};
