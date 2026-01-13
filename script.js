// script.js (ES module) — Near "Live Waves" screen

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  serverTimestamp,
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  limit
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

/* ===========================
   1) FIREBASE CONFIG (USE YOUR REAL ONE)
   =========================== */
const firebaseConfig = {
  apiKey: "AIzaSyA2ApGkST41s9U53GQIatv4FL8aCPVzeAM",
  authDomain: "near-c7681.firebaseapp.com",
  projectId: "near-c7681",
  storageBucket: "near-c7681.firebasestorage.app",
  messagingSenderId: "316318833624",
  appId: "1:316318833624:web:480beb2c1909e23d1cf0ad",
  measurementId: "G-98XYEKXLLT"
};
/* =========================== */

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

/* ===========================
   UI HOOKS (must exist in HTML)
   =========================== */
const statusLine = document.getElementById("statusLine");     // e.g. "Signing in..."
const pillStatus  = document.getElementById("pillStatus");    // e.g. "Live" / "Location off"
const peopleList  = document.getElementById("people");        // optional demo list
const vibeButtons = Array.from(document.querySelectorAll(".vibeBtn"));

const waveBtn  = document.getElementById("waveBtn");          // open modal
const modal    = document.getElementById("modal");            // overlay
const waveText = document.getElementById("waveText");         // textarea
const count    = document.getElementById("count");            // counter
const sendBtn  = document.getElementById("sendBtn");          // send wave
const laterBtn = document.getElementById("laterBtn");         // close modal

// NEW: Live feed container (add this in HTML: <div id="liveFeed"></div>)
const liveFeed = document.getElementById("liveFeed");

/* ===========================
   THEMES (4 only)
   =========================== */
const THEMES = {
  city:  { bg1:"#2e3a3f", bg2:"#0b0f12", a1:"#6ee7b7", a2:"#7dd3fc" },
  beach: { bg1:"#2b6b73", bg2:"#08161b", a1:"#fcd34d", a2:"#f59e0b" },
  forest:{ bg1:"#2f5a43", bg2:"#06130c", a1:"#86efac", a2:"#34d399" },
  space: { bg1:"#3a2f5a", bg2:"#05030a", a1:"#c4b5fd", a2:"#a78bfa" }
};

function setTheme(key){
  const t = THEMES[key] || THEMES.city;
  const r = document.documentElement;
  r.style.setProperty("--bg1", t.bg1);
  r.style.setProperty("--bg2", t.bg2);
  r.style.setProperty("--accent1", t.a1);
  r.style.setProperty("--accent2", t.a2);
}

vibeButtons.forEach(btn=>{
  btn.addEventListener("click", ()=>{
    vibeButtons.forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    setTheme(btn.dataset.theme);
  }, { passive:true });
});
setTheme("city");

/* ===========================
   DEMO PEOPLE (optional)
   =========================== */
function kmMin1(km){
  if (!Number.isFinite(km)) return "within 1 km away";
  const safe = Math.max(1, km);
  return safe === 1 ? "within 1 km away" : `~${safe.toFixed(1)} km away`;
}
const DEMO_PEOPLE = [
  { name:"Sam", age:54, bio:"Out for a walk", km:0.3 },
  { name:"Jade", age:31, bio:"Coffee nearby", km:1.2 },
  { name:"Michael", age:42, bio:"Taking it slow", km:3.4 },
  { name:"Elena", age:27, bio:"Beach breeze", km:0.7 },
  { name:"David", age:61, bio:"Just chillin", km:4.9 },
];

function renderPeople(arr){
  if (!peopleList) return;
  peopleList.innerHTML = "";
  arr.slice(0,5).forEach(p=>{
    const li = document.createElement("li");
    li.innerHTML = `
      <div class="avatar" aria-hidden="true"></div>
      <div>
        <div class="pName">${p.name}, ${p.age}</div>
        <div class="pSub">${p.bio}</div>
        <div class="pDist">${kmMin1(p.km)}</div>
      </div>
    `;
    peopleList.appendChild(li);
  });
}
renderPeople(DEMO_PEOPLE);

/* ===========================
   LOCATION (foreground only)
   =========================== */
let lastGeo = null;
let geoWatchId = null;

function startGeo(){
  if (!("geolocation" in navigator)) {
    pillStatus && (pillStatus.textContent = "No GPS");
    return;
  }
  geoWatchId = navigator.geolocation.watchPosition(
    (pos)=>{
      lastGeo = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      pillStatus && (pillStatus.textContent = "Live");
      // update your user doc in the background when signed in
      const u = auth.currentUser;
      if (u) ensureUserDoc(u.uid).catch(()=>{});
    },
    ()=>{
      pillStatus && (pillStatus.textContent = "Location off");
    },
    { enableHighAccuracy:true, maximumAge:5000, timeout:10000 }
  );
}

// stop GPS when leaving page (nice + privacy)
window.addEventListener("pagehide", ()=>{
  if (geoWatchId !== null && "geolocation" in navigator) {
    navigator.geolocation.clearWatch(geoWatchId);
  }
}, { passive:true });

/* ===========================
   USER DOC
   =========================== */
async function ensureUserDoc(uid){
  const ref = doc(db, "users", uid);
  const payload = {
    lastSeen: serverTimestamp(),
    name: "User"
  };
  if (lastGeo) { payload.lat = lastGeo.lat; payload.lng = lastGeo.lng; }
  await setDoc(ref, payload, { merge:true });
}

/* ===========================
   MODAL (wave composer)
   =========================== */
function openModal(){
  modal?.classList.remove("hidden");
  modal?.setAttribute("aria-hidden","false");
  waveText?.focus({ preventScroll:true });
}
function closeModal(){
  modal?.classList.add("hidden");
  modal?.setAttribute("aria-hidden","true");
  if (waveText) waveText.value = "";
  if (count) count.textContent = "0";
  if (sendBtn){
    sendBtn.disabled = false;
    sendBtn.textContent = "Send";
  }
}

waveText?.addEventListener("input", ()=>{
  if (count) count.textContent = String(waveText.value.length);
});

waveBtn?.addEventListener("click", openModal);
laterBtn?.addEventListener("click", closeModal);
modal?.addEventListener("click", (e)=>{
  if (e.target === modal) closeModal(); // tap backdrop
});

/* ===========================
   LIVE FEED (realtime waves)
   =========================== */
function safeTime(ts){
  try{
    if (!ts) return "";
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleString();
  }catch{
    return "";
  }
}

function renderLiveWaves(docs){
  if (!liveFeed) return;
  if (docs.length === 0){
    liveFeed.innerHTML = `<div class="emptyLive">No waves yet. Be the first 👋</div>`;
    return;
  }

  liveFeed.innerHTML = docs.map(docSnap=>{
    const w = docSnap.data();
    const msg = (w.message || "").toString();
    const theme = (w.theme || "city").toString();
    const when = safeTime(w.createdAt);
    return `
      <div class="liveCard" data-theme="${theme}">
        <div class="liveTop">
          <div class="liveBadge">LIVE</div>
          <div class="liveMeta">${when}</div>
        </div>
        <div class="liveMsg">${escapeHtml(msg)}</div>
        <div class="liveSub">Theme: ${escapeHtml(theme)} • Privacy: min 1km</div>
      </div>
    `;
  }).join("");
}

// minimal HTML escape
function escapeHtml(str){
  return str.replace(/[&<>"']/g, (m)=>({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[m]));
}

function startLiveFeed(){
  // latest 20 waves, realtime
  const q = query(collection(db, "waves"), orderBy("createdAt", "desc"), limit(20));
  onSnapshot(q, (snap)=>{
    renderLiveWaves(snap.docs);
  }, (err)=>{
    console.error("Live feed error:", err);
    if (statusLine) statusLine.textContent = "Live feed error";
  });
}

/* ===========================
   SEND WAVE
   =========================== */
sendBtn?.addEventListener("click", async ()=>{
  const text = (waveText?.value || "").trim();
  if (!text) return;

  const u = auth.currentUser;
  if (!u){
    alert("Not signed in");
    return;
  }

  sendBtn.disabled = true;
  sendBtn.textContent = "Sending…";

  try{
    await addDoc(collection(db, "waves"), {
      uid: u.uid,
      message: text,
      createdAt: serverTimestamp(),
      lat: lastGeo?.lat ?? null,
      lng: lastGeo?.lng ?? null,
      theme: vibeButtons.find(b=>b.classList.contains("active"))?.dataset.theme || "city"
    });
    closeModal();
  }catch(err){
    console.error("Send wave error:", err);
    alert("Send failed — check console");
    sendBtn.disabled = false;
    sendBtn.textContent = "Send";
  }
});

/* ===========================
   AUTH BOOT
   =========================== */
function setStatus(text){
  if (statusLine) statusLine.textContent = text;
}

async function boot(){
  setStatus("Signing in…");
  pillStatus && (pillStatus.textContent = "Starting…");

  startGeo();

  try{
    await signInAnonymously(auth);
  }catch(err){
    console.error("Auth failed:", err);
    const msg = String(err?.message || err);
    alert("Auth failed: " + msg);
    setStatus("Sign-in failed");
    pillStatus && (pillStatus.textContent = "Offline");
    return;
  }

  onAuthStateChanged(auth, async (user)=>{
    if (!user){
      setStatus("Not signed in");
      return;
    }
    setStatus("Live");
    pillStatus && (pillStatus.textContent = "Live");
    try{
      await ensureUserDoc(user.uid);
    }catch(err){
      console.error("User doc error:", err);
    }
    startLiveFeed();
  });
}

boot();
