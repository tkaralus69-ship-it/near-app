// script.js (ES module) — FULL (LOCKED / STABLE AVATARS / BEACH ADDED)
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

/* ===========================
   FIREBASE CONFIG (yours)
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

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

/* ===========================
   UI
=========================== */
const statusLine = document.getElementById("statusLine");
const pillStatus = document.getElementById("pillStatus");
const peopleList = document.getElementById("people");
const wavesFeed = document.getElementById("wavesFeed");

const vibeButtons = Array.from(document.querySelectorAll(".vibeBtn"));
const waveBtn = document.getElementById("waveBtn");

const modal = document.getElementById("waveModal");
const backdrop = modal.querySelector(".modalBackdrop");
const waveText = document.getElementById("waveText");
const countEl = document.getElementById("count");
const sendBtn = document.getElementById("sendBtn");
const laterBtn = document.getElementById("laterBtn");

/* ===========================
   VIBE IMAGES (LOCKED)
   (includes Beach)
=========================== */
const VIBE_IMAGES = {
  city:
    "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?auto=format&fit=crop&w=2000&q=70",
  nature:
    "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=2000&q=70",
  beach:
    "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=2000&q=70",
  fitness:
    "https://images.unsplash.com/photo-1546483875-ad9014c88eba?auto=format&fit=crop&w=2000&q=70",
  tech:
    "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=2000&q=70"
};

/* ===========================
   THEMES (accent palette)
=========================== */
const THEMES = {
  city:   { bg1:"#2e3a3f", bg2:"#0b0f12", a1:"#6ee7b7", a2:"#7dd3fc" },
  nature: { bg1:"#2f5a43", bg2:"#06130c", a1:"#86efac", a2:"#34d399" },
  beach:  { bg1:"#23414a", bg2:"#06131a", a1:"#7dd3fc", a2:"#a7f3d0" },
  fitness:{ bg1:"#2b2f3a", bg2:"#0a0c12", a1:"#fcd34d", a2:"#fb7185" },
  tech:   { bg1:"#2a2240", bg2:"#070312", a1:"#c4b5fd", a2:"#a78bfa" }
};

function setTheme(key){
  const t = THEMES[key] || THEMES.city;
  const r = document.documentElement;
  r.style.setProperty("--bg1", t.bg1);
  r.style.setProperty("--bg2", t.bg2);
  r.style.setProperty("--accent1", t.a1);
  r.style.setProperty("--accent2", t.a2);
}

function applyVibe(theme){
  const url = VIBE_IMAGES[theme] || VIBE_IMAGES.city;
  const layer = document.querySelector(".bgVibe");
  if (layer) layer.style.backgroundImage = `url("${url}")`;
  setTheme(theme);
}

/* ===========================
   PROMO JUMPS
=========================== */
function wirePromoCards() {
  document.querySelectorAll(".promoCard[data-jump]").forEach((card) => {
    card.addEventListener("click", () => {
      const id = card.getAttribute("data-jump");
      const el = document.getElementById(id);
      if (!el) return;

      if (id === "waveBtn") {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        setTimeout(() => el.click(), 200);
        return;
      }
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}

/* ===========================
   PEOPLE (demo)
   FIXED: avatars are stable and NEVER change on click.
=========================== */
function kmMin1(km){
  const safe = Math.max(1, km);
  if (safe === 1) return "within 1 km away";
  return `~${safe.toFixed(1)} km away`;
}

function stableAvatar(gender, id){
  const g = gender === "f" ? "women" : "men";
  const safeId = Math.max(0, Math.min(99, Number(id || 0)));
  // Stable URL for that person forever.
  return `https://randomuser.me/api/portraits/${g}/${safeId}.jpg`;
}

// LOCKED people sets (5 shown per vibe)
const PEOPLE_BY_VIBE = {
  city: [
    { name:"Sam", age:54, gender:"m", bio:"Out for a walk • city lights", km:0.3,  avatarId:61 },
    { name:"Jade", age:31, gender:"f", bio:"Coffee nearby • night stroll", km:1.2, avatarId:14 },
    { name:"Luke", age:38, gender:"m", bio:"Tradie • finishing a job", km:2.2, avatarId:93 },
    { name:"Michael", age:42, gender:"m", bio:"Taking it slow • skyline", km:3.4, avatarId:27 },
    { name:"Elena", age:27, gender:"f", bio:"Late snack • good chats", km:0.7, avatarId:45 }
  ],
  nature: [
    { name:"Mia",  age:29, gender:"f", bio:"Forest air • quiet mind", km:0.6, avatarId:22 },
    { name:"Noah", age:36, gender:"m", bio:"Coastal walk • no rush", km:1.8, avatarId:11 },
    { name:"Lena", age:48, gender:"f", bio:"Bird sounds • calm day", km:2.9, avatarId:58 },
    { name:"Kai",  age:33, gender:"m", bio:"Hiking • simple life", km:3.6, avatarId:39 },
    { name:"Rose", age:57, gender:"f", bio:"Tea after a walk", km:4.1, avatarId:80 }
  ],
  beach: [
    { name:"Tara",  age:28, gender:"f", bio:"Beach walk • salty air", km:0.6, avatarId:8 },
    { name:"Benji", age:35, gender:"m", bio:"Sunset chats • no rush", km:1.7, avatarId:31 },
    { name:"Amir",  age:44, gender:"m", bio:"Ocean swim • calm energy", km:3.2, avatarId:19 },
    { name:"Kira",  age:40, gender:"f", bio:"Coffee after the coast", km:2.4, avatarId:55 },
    { name:"Elle",  age:33, gender:"f", bio:"Night sky • beach fire", km:4.8, avatarId:72 }
  ],
  fitness: [
    { name:"Chris",  age:34, gender:"m", bio:"Runner • sunrise laps", km:0.9, avatarId:4 },
    { name:"Asha",   age:30, gender:"f", bio:"Runner • steady pace", km:1.6, avatarId:9 },
    { name:"Tahlia", age:28, gender:"f", bio:"Pilates • strong + calm", km:3.0, avatarId:33 },
    { name:"Ethan",  age:44, gender:"m", bio:"Gym then smoothie", km:2.1, avatarId:52 },
    { name:"Mark",   age:58, gender:"m", bio:"Daily walk • feeling good", km:4.4, avatarId:88 }
  ],
  tech: [
    { name:"Sophie", age:29, gender:"f", bio:"Design + dev • headphones on", km:2.4, avatarId:16 },
    { name:"Ben",    age:55, gender:"m", bio:"Tech talk • no ego", km:4.6, avatarId:66 },
    { name:"Nina",   age:32, gender:"f", bio:"Gaming night • chill co-op?", km:1.9, avatarId:48 },
    { name:"Omar",   age:41, gender:"m", bio:"Writing code • coffee fuel", km:3.7, avatarId:35 },
    { name:"Casey",  age:37, gender:"m", bio:"IT support • steady vibes", km:0.8, avatarId:25 }
  ]
};

function renderPeople(vibe){
  const arr = (PEOPLE_BY_VIBE[vibe] || PEOPLE_BY_VIBE.city).slice(0,5);
  peopleList.innerHTML = "";

  arr.forEach((p)=>{
    const li = document.createElement("li");
    li.dataset.person = `${vibe}:${p.name}:${p.avatarId}`; // stable identity

    const url = stableAvatar(p.gender === "f" ? "f" : "m", p.avatarId);

    li.innerHTML = `
      <div class="avatar" aria-hidden="true">
        <img class="avatarImg" src="${url}" alt="" loading="lazy"
          onerror="this.remove(); this.parentElement.classList.add('avatarFallback');">
      </div>
      <div>
        <div class="pName">${p.name}, ${p.age}</div>
        <div class="pSub">${p.bio}</div>
        <div class="pDist">${kmMin1(p.km)}</div>
      </div>
    `;

    // IMPORTANT: No click handler that changes anything.
    peopleList.appendChild(li);
  });
}

/* ===========================
   WAVE MODAL
=========================== */
function openModal(){
  modal.classList.remove("hidden");
  modal.setAttribute("aria-hidden","false");
  waveText.focus({ preventScroll:true });
}
function closeModal(){
  modal.classList.add("hidden");
  modal.setAttribute("aria-hidden","true");
  waveText.value = "";
  countEl.textContent = "0";
  sendBtn.disabled = false;
  sendBtn.textContent = "Send";
}

waveText.addEventListener("input", ()=>{
  countEl.textContent = String(waveText.value.length);
});
waveBtn.addEventListener("click", openModal);
laterBtn.addEventListener("click", closeModal);
backdrop.addEventListener("click", closeModal);

/* ===========================
   GEO (optional)
=========================== */
let lastGeo = null;
function startGeo(){
  if (!("geolocation" in navigator)) {
    pillStatus.textContent = "No location";
    return;
  }
  navigator.geolocation.watchPosition(
    (pos)=>{
      lastGeo = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      pillStatus.textContent = "Up to date";
    },
    ()=>{
      pillStatus.textContent = "Location off";
    },
    { enableHighAccuracy:true, maximumAge:5000, timeout:10000 }
  );
}

/* ===========================
   AUTH + USER DOC
=========================== */
let myUid = null;

async function ensureUserDoc(uid){
  const ref = doc(db, "users", uid);
  const payload = { lastSeen: serverTimestamp() };
  if (lastGeo) { payload.lat = lastGeo.lat; payload.lng = lastGeo.lng; }
  await setDoc(ref, payload, { merge:true });
}

/* ===========================
   WAVES: SEND + LIVE FEED
=========================== */
sendBtn.addEventListener("click", async ()=>{
  const text = waveText.value.trim();
  if (!text) return;

  sendBtn.disabled = true;
  sendBtn.textContent = "Sending…";

  try{
    const u = auth.currentUser;
    if (!u) throw new Error("Not signed in");

    const theme =
      document.querySelector(".vibeBtn.active")?.dataset?.theme || "city";

    await addDoc(collection(db, "waves"), {
      uid: u.uid,
      message: text,
      createdAt: serverTimestamp(),
      lat: lastGeo?.lat ?? null,
      lng: lastGeo?.lng ?? null,
      theme
    });

    closeModal();
  }catch(err){
    console.error(err);
    sendBtn.disabled = false;
    sendBtn.textContent = "Send";
    statusLine.textContent = "Couldn’t send. Try again.";
  }
});

function listenWaves(){
  const qy = query(collection(db, "waves"), orderBy("createdAt","desc"), limit(12));
  onSnapshot(qy, (snap)=>{
    wavesFeed.innerHTML = "";
    snap.forEach(d=>{
      const w = d.data();
      const li = document.createElement("li");
      li.innerHTML = `
        <div class="avatar avatarFallback" aria-hidden="true"></div>
        <div>
          <div class="pName">${(w.theme || "near").toUpperCase()}</div>
          <div class="pSub">${escapeHtml(w.message || "")}</div>
          <div class="pDist">just now</div>
        </div>
      `;
      wavesFeed.appendChild(li);
    });
  });
}

function escapeHtml(s){
  return String(s)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

/* ===========================
   VIBES WIRING
=========================== */
function wireVibeButtons(){
  vibeButtons.forEach(btn=>{
    btn.addEventListener("click", ()=>{
      vibeButtons.forEach(b=>b.classList.remove("active"));
      btn.classList.add("active");

      const theme = btn.dataset.theme || "city";
      applyVibe(theme);
      renderPeople(theme);

      statusLine.textContent = "Ready.";
    }, { passive:true });
  });

  // init
  const active = document.querySelector(".vibeBtn.active");
  const theme = active?.dataset?.theme || "city";
  applyVibe(theme);
  renderPeople(theme);
}

/* ===========================
   INIT
=========================== */
wirePromoCards();
wireVibeButtons();

statusLine.textContent = "Signing in…";
pillStatus.textContent = "
