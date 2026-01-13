// =====================================================
// NEAR — PHASE 2 (GPS + Presence + Privacy + Persistence)
// =====================================================

const statusEl   = document.getElementById("status");
const peopleList = document.getElementById("peopleList");
const nearCount  = document.getElementById("nearCount");

const vibeChips  = document.getElementById("vibeChips");
const waveBtn    = document.getElementById("waveBtn");
const waveBar    = document.getElementById("waveBar");

const gateOverlay= document.getElementById("gateOverlay");
const gateInput  = document.getElementById("gateInput");
const counterEl  = document.getElementById("counter");
const sendBtn    = document.getElementById("sendBtn");
const laterBtn   = document.getElementById("laterBtn");

// -----------------------------
// Settings (locked)
// -----------------------------
const PRIVACY_MIN_KM = 1;       // show at least 1km
const MAX_PEOPLE     = 5;       // your current vibe
const MIN_MSG_CHARS  = 25;      // "minimum protects intention"

// -----------------------------
// Storage keys (local for Phase 2)
// -----------------------------
const LS_THEME   = "near_theme";
const LS_BLOCKED = "near_blocked_ids";
const LS_MESSAGES= "near_messages"; // [{toId, msg, ts}]

// -----------------------------
// State
// -----------------------------
let myPos = null;               // {lat, lon}
let people = [];                // rendered people objects
let selectedId = null;          // who you're waving to

// -----------------------------
// Helpers
// -----------------------------
function clamp(n, a, b){ return Math.max(a, Math.min(b, n)); }
function nowTs(){ return Date.now(); }

function loadJSON(key, fallback){
  try{
    const raw = localStorage.getItem(key);
    if(!raw) return fallback;
    return JSON.parse(raw);
  }catch{ return fallback; }
}
function saveJSON(key, value){
  localStorage.setItem(key, JSON.stringify(value));
}

function setStatus(msg){
  statusEl.textContent = msg || "";
}

function setTheme(theme){
  document.body.setAttribute("data-theme", theme);
  // Update active chip
  [...vibeChips.querySelectorAll(".chip")].forEach(btn=>{
    btn.classList.toggle("is-active", btn.dataset.theme === theme);
  });
  saveJSON(LS_THEME, theme);
}

// Haversine distance (km)
function distanceKm(aLat, aLon, bLat, bLon){
  const R = 6371;
  const dLat = (bLat - aLat) * Math.PI/180;
  const dLon = (bLon - aLon) * Math.PI/180;
  const lat1 = aLat * Math.PI/180;
  const lat2 = bLat * Math.PI/180;
  const x = Math.sin(dLat/2)**2 + Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLon/2)**2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

// Privacy display: minimum 1km
function formatDistance(km){
  const shown = Math.max(PRIVACY_MIN_KM, km);
  if (shown < 10) return `~${shown.toFixed(1)} km away`;
  return `~${Math.round(shown)} km away`;
}

// Presence label
function presenceLabel(lastActiveTs){
  const mins = Math.round((nowTs() - lastActiveTs) / 60000);
  if (mins <= 5) return "Active now";
  if (mins < 60) return `Active ${mins}m ago`;
  const hrs = Math.round(mins/60);
  if (hrs < 24) return `Active ${hrs}h ago`;
  const days = Math.round(hrs/24);
  return `Active ${days}d ago`;
}

// -----------------------------
// Phase 2: generate demo people around you (until Firestore)
// -----------------------------
function seededRand(seed){
  // simple deterministic pseudo-rand [0,1)
  let t = seed + 0x6D2B79F5;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function makeDemoPeople(pos){
  const blocked = new Set(loadJSON(LS_BLOCKED, []));
  const names = [
    {n:"Sam", a:54, s:"Out for a walk"},
    {n:"Jade", a:31, s:"Coffee nearby"},
    {n:"Michael", a:42, s:"Taking it slow"},
    {n:"Elena", a:27, s:"Sunshine mode"},
    {n:"David", a:61, s:"Just cruising"},
    {n:"Priya", a:36, s:"Fresh air"},
    {n:"Mason", a:29, s:"Chasing calm"},
  ];

  const baseSeed = Math.floor((pos.lat*1000)+(pos.lon*1000));

  const generated = [];
  for(let i=0; i<MAX_PEOPLE; i++){
    const entry = names[i % names.length];
    const r1 = seededRand(baseSeed + i*11);
    const r2 = seededRand(baseSeed + i*29);

    // Spread within ~0.5km–8km in random directions
    const dKm = 0.5 + (r1 * 7.5);
    const bearing = r2 * 2*Math.PI;

    // Rough conversion: 1 deg lat ~111km
    const dLat = (dKm / 111) * Math.cos(bearing);
    const dLon = (dKm / (111 * Math.cos(pos.lat*Math.PI/180))) * Math.sin(bearing);

    const lat = pos.lat + dLat;
    const lon = pos.lon + dLon;

    const id = `${entry.n.toLowerCase()}_${entry.a}_${i}`;
    if(blocked.has(id)) continue;

    // Active within last 0–2 days
    const r3 = seededRand(baseSeed + i*47);
    const minutesAgo = Math.floor(r3 * 60 * 36); // up to 36h
    const lastActive = nowTs() - minutesAgo*60000;

    const km = distanceKm(pos.lat, pos.lon, lat, lon);

    generated.push({
      id,
      name: entry.n,
      age: entry.a,
      status: entry.s,
      lat, lon,
      km,
      lastActive
    });
  }

  return generated.slice(0, MAX_PEOPLE);
}

// -----------------------------
// Render
// -----------------------------
function renderPeople(){
  peopleList.innerHTML = "";
  selectedId = null;
  waveBtn.disabled = true;
  waveBtn.textContent = "Wave 👋";

  if(!people.length){
    nearCount.textContent = "No one near right now. Check again soon.";
    return;
  }

  nearCount.textContent = `${people.length} people near you`;

  for(const p of people){
    const row = document.createElement("div");
    row.className = "person";
    row.dataset.id = p.id;

    row.innerHTML = `
      <div class="avatar" aria-hidden="true"></div>
      <div class="meta">
        <div class="name">${escapeHtml(p.name)}, ${p.age}</div>
        <div class="blurb">${escapeHtml(p.status)}</div>
        <div class="presence">${presenceLabel(p.lastActive)}</div>
        <div class="distance">${formatDistance(p.km)}</div>
      </div>
      <div class="actions">
        <button class="smallbtn" data-act="decline">Decline</button>
        <button class="smallbtn danger" data-act="block">Block</button>
      </div>
    `;

    // select on tap (not on action buttons)
    row.addEventListener("click", (e)=>{
      const act = e.target?.dataset?.act;
      if(act) return; // handled below
      selectPerson(p.id);
    });

    row.querySelector('[data-act="decline"]').addEventListener("click", (e)=>{
      e.stopPropagation();
      declinePerson(p.id);
    });
    row.querySelector('[data-act="block"]').addEventListener("click", (e)=>{
      e.stopPropagation();
      blockPerson(p.id);
    });

    peopleList.appendChild(row);
  }
}

function selectPerson(id){
  selectedId = id;
  [...peopleList.querySelectorAll(".person")].forEach(el=>{
    el.classList.toggle("is-selected", el.dataset.id === id);
  });
  waveBtn.disabled = false;
  waveBtn.textContent = "Wave 👋";
}

function declinePerson(id){
  people = people.filter(p => p.id !== id);
  renderPeople();
  setStatus("Declined.");
  setTimeout(()=>setStatus(""), 900);
}

function blockPerson(id){
  const blocked = loadJSON(LS_BLOCKED, []);
  if(!blocked.includes(id)) blocked.push(id);
  saveJSON(LS_BLOCKED, blocked);

  people = people.filter(p => p.id !== id);
  renderPeople();
  setStatus("Blocked.");
  setTimeout(()=>setStatus(""), 900);
}

function escapeHtml(str){
  return String(str)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

// -----------------------------
// Gate
// -----------------------------
function openGate(){
  if(!selectedId) return;

  gateOverlay.classList.remove("hidden");
  gateOverlay.setAttribute("aria-hidden","false");
  gateInput.value = "";
  counterEl.textContent = "0";
  sendBtn.disabled = true;

  requestAnimationFrame(()=> gateInput.focus());
}

function closeGate(){
  gateOverlay.classList.add("hidden");
  gateOverlay.setAttribute("aria-hidden","true");
}

function canSend(msg){
  return msg.trim().length >= MIN_MSG_CHARS;
}

gateInput.addEventListener("input", ()=>{
  const val = gateInput.value;
  counterEl.textContent = String(val.length);
  sendBtn.disabled = !canSend(val);
});

sendBtn.addEventListener("click", ()=>{
  const msg = gateInput.value.trim();
  if(!selectedId || !canSend(msg)) return;

  const out = loadJSON(LS_MESSAGES, []);
  out.push({ toId: selectedId, msg, ts: nowTs() });
  saveJSON(LS_MESSAGES, out);

  // Phase 2 placeholder: visible result
  setStatus("Message sent.");
  waveBtn.textContent = "Waved 👋";
  waveBtn.disabled = true;

  console.log("SENT:", { to: selectedId, msg });

  closeGate();
  setTimeout(()=>setStatus(""), 1200);
});

laterBtn.addEventListener("click", ()=>{
  setStatus("Maybe later.");
  closeGate();
  setTimeout(()=>setStatus(""), 900);
});

gateOverlay.addEventListener("click", (e)=>{
  if(e.target === gateOverlay) closeGate();
});

// -----------------------------
// Theme selection
// -----------------------------
vibeChips.addEventListener("click", (e)=>{
  const btn = e.target.closest(".chip");
  if(!btn) return;
  setTheme(btn.dataset.theme);
});

// -----------------------------
// Wave
// -----------------------------
waveBtn.addEventListener("click", ()=>{
  openGate();
});

// -----------------------------
// GPS
// -----------------------------
function getLocationOnce(){
  return new Promise((resolve, reject)=>{
    if(!navigator.geolocation){
      reject(new Error("Geolocation not supported."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos)=> resolve({
        lat: pos.coords.latitude,
        lon: pos.coords.longitude
      }),
      (err)=> reject(err),
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 10000
      }
    );
  });
}

async function init(){
  // Theme restore
  const savedTheme = loadJSON(LS_THEME, "city");
  setTheme(savedTheme);

  try{
    setStatus("Getting your location…");
    myPos = await getLocationOnce();
    setStatus("Finding people…");

    // Phase 2: demo generation around you
    people = makeDemoPeople(myPos);
    renderPeople();

    setStatus(""); // clean
  }catch(err){
    console.error(err);
    setStatus("Location needed to find people near you. Allow permission & refresh.");
    nearCount.textContent = "Location permission required.";
    people = [];
    renderPeople();
  }
}

init();
