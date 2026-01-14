// script.js (FULL, CLEAN, ONE FILE)
// Vibes: City, Nature (Beach/Forest), Sport, Tech
// Firebase: users + waves
// Privacy: distances shown as minimum 1 km

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import {
  getFirestore,
  doc, setDoc, serverTimestamp,
  collection, addDoc,
  onSnapshot, query, orderBy, limit
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

/* ===========================
   FIREBASE CONFIG (PASTE YOURS)
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
   UI
   =========================== */
const statusLine = document.getElementById("statusLine");
const pillStatus = document.getElementById("pillStatus");

const peopleList = document.getElementById("people");
const wavesFeed = document.getElementById("wavesFeed");

const promoCards = Array.from(document.querySelectorAll(".promoCard[data-jump]"));

const vibeBtns = Array.from(document.querySelectorAll(".vibeBtn"));
const natureSubsWrap = document.getElementById("natureSubs");
const subBtns = Array.from(document.querySelectorAll(".subBtn"));

const waveBtn = document.getElementById("waveBtn");
const waveModal = document.getElementById("waveModal");
const waveText = document.getElementById("waveText");
const countEl = document.getElementById("count");
const sendBtn = document.getElementById("sendBtn");
const laterBtn = document.getElementById("laterBtn");

/* ===========================
   VIBE BACKGROUNDS (CLEAR + PRO)
   =========================== */
const VIBE_IMAGES = {
  city:  "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?auto=format&fit=crop&w=1800&q=70",
  // Nature uses beach/forest images via sub-vibe
  beach: "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1800&q=70",
  forest:"https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1800&q=70",
  sport: "https://images.unsplash.com/photo-1521412644187-c49fa049e84d?auto=format&fit=crop&w=1800&q=70",
  tech:  "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1800&q=70"
};

const THEMES = {
  city:  { bg1:"#2e3a3f", bg2:"#0b0f12", a1:"#6ee7b7", a2:"#7dd3fc" },
  nature:{ bg1:"#2f5a43", bg2:"#06130c", a1:"#86efac", a2:"#34d399" },
  sport: { bg1:"#2b2f3a", bg2:"#0a0c12", a1:"#fcd34d", a2:"#fb7185" },
  tech:  { bg1:"#2a2238", bg2:"#07040c", a1:"#c4b5fd", a2:"#60a5fa" }
};

let currentVibe = "city";     // city | nature | sport | tech
let natureSub = "beach";      // beach | forest

function setCssTheme(vibeKey){
  const t = THEMES[vibeKey] || THEMES.city;
  const r = document.documentElement;
  r.style.setProperty("--bg1", t.bg1);
  r.style.setProperty("--bg2", t.bg2);
  r.style.setProperty("--accent1", t.a1);
  r.style.setProperty("--accent2", t.a2);
}

function applyVibeVisual(){
  const bg = document.querySelector(".bgVibe");
  const key = (currentVibe === "nature") ? natureSub : currentVibe;
  const url = VIBE_IMAGES[key] || VIBE_IMAGES.city;

  if (bg) bg.style.backgroundImage = `url("${url}")`;

  // Promo cards use the same image as a subtle tile overlay
  document.documentElement.style.setProperty("--promoImage", `url("${url}")`);
  document.querySelectorAll(".promoCard").forEach(card=>{
    card.style.setProperty("--promoImage", `url("${url}")`);
  });
}

/* ===========================
   PROMO CARDS SCROLL/JUMP
   =========================== */
function wirePromoCards(){
  promoCards.forEach(card=>{
    card.addEventListener("click", ()=>{
      const id = card.getAttribute("data-jump");
      const el = document.getElementById(id);
      if (!el) return;

      if (id === "waveBtn"){
        el.scrollIntoView({ behavior:"smooth", block:"center" });
        setTimeout(()=> el.click(), 250);
        return;
      }
      el.scrollIntoView({ behavior:"smooth", block:"start" });
    }, { passive:true });
  });
}

/* ===========================
   VIBE SELECTION
   =========================== */
function showNatureSubs(show){
  natureSubsWrap.classList.toggle("hidden", !show);
}

function setActive(btns, activeBtn){
  btns.forEach(b=>b.classList.remove("active"));
  if (activeBtn) activeBtn.classList.add("active");
}

function setVibe(vibe){
  currentVibe = vibe;

  showNatureSubs(vibe === "nature");

  // ensure a nature sub is set
  if (vibe === "nature" && !["beach","forest"].includes(natureSub)){
    natureSub = "beach";
  }

  setCssTheme(vibe);
  applyVibeVisual();
  renderPeople();
}

function setNatureSub(sub){
  natureSub = sub;
  applyVibeVisual();
  renderPeople();
}

function wireVibes(){
  vibeBtns.forEach(btn=>{
    btn.addEventListener("click", ()=>{
      setActive(vibeBtns, btn);
      setVibe(btn.dataset.theme || "city");
    }, { passive:true });
  });

  subBtns.forEach(btn=>{
    btn.addEventListener("click", ()=>{
      setActive(subBtns, btn);
      setNatureSub(btn.dataset.sub || "beach");
    }, { passive:true });
  });

  // init
  const activeMain = document.querySelector(".vibeBtn.active");
  currentVibe = activeMain?.dataset?.theme || "city";
  showNatureSubs(currentVibe === "nature");
  setCssTheme(currentVibe);
  applyVibeVisual();
}

/* ===========================
   PEOPLE (DEMO, VIBE-FRIENDLY)
   =========================== */
function kmMin1(km){
  if (!Number.isFinite(km)) return "within 1 km away";
  const safe = Math.max(1, km);
  if (safe === 1) return "within 1 km away";
  return `~${safe.toFixed(1)} km away`;
}

const PEOPLE_BY_VIBE = {
  city: [
    { name:"Sam", age:54, bio:"Night walk. Calm mind.", km:0.4 },
    { name:"Jade", age:31, bio:"Coffee • lights • slow chats", km:1.2 },
    { name:"Michael", age:42, bio:"Just out • no rush", km:2.7 },
    { name:"Elena", age:27, bio:"City breeze • good energy", km:0.8 },
    { name:"David", age:61, bio:"Local • grounded • real", km:4.9 }
  ],
  beach: [
    { name:"Tahlia", age:33, bio:"Salt air • reset", km:0.6 },
    { name:"Ben", age:40, bio:"Sunset walk • no pressure", km:1.8 },
    { name:"Nina", age:28, bio:"Beach coffee • quiet smiles", km:3.1 },
    { name:"Rob", age:57, bio:"Ocean fixes everything", km:2.2 },
    { name:"Kylie", age:46, bio:"Chillin • finding my pace", km:4.2 }
  ],
  forest: [
    { name:"Luca", age:29, bio:"Bush walk • breathing again", km:0.7 },
    { name:"Mia", age:38, bio:"Trees > noise", km:1.4 },
    { name:"Grant", age:52, bio:"Camp coffee • simple life", km:2.9 },
    { name:"Sasha", age:26, bio:"Nature brain • gentle chat", km:3.6 },
    { name:"Helen", age:60, bio:"Fresh air • fresh start", km:4.7 }
  ],
  sport: [
    { name:"Chris", age:34, bio:"Run club • sunrise", km:0.9 },
    { name:"Asha", age:30, bio:"Yoga • stretch • smile", km:1.6 },
    { name:"Tom", age:45, bio:"Bike ride • steady", km:3.0 },
    { name:"Renee", age:39, bio:"Beach swim • brave day", km:2.1 },
    { name:"Mark", age:58, bio:"Walks • talk • easy", km:4.4 }
  ],
  tech: [
    { name:"Alex", age:32, bio:"Building stuff • staying real", km:0.8 },
    { name:"Priya", age:29, bio:"Quiet mind • big ideas", km:1.7 },
    { name:"Jordan", age:41, bio:"Games • music • calm", km:2.6 },
    { name:"Casey", age:36, bio:"AI curious • human first", km:3.3 },
    { name:"Lee", age:55, bio:"Old school • new tools", km:4.1 }
  ]
};

function currentPeople(){
  if (currentVibe === "nature"){
    return PEOPLE_BY_VIBE[natureSub] || PEOPLE_BY_VIBE.beach;
  }
  return PEOPLE_BY_VIBE[currentVibe] || PEOPLE_BY_VIBE.city;
}

function renderPeople(){
  const arr = currentPeople();
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

/* ===========================
   WAVE MODAL
   =========================== */
function openModal(){
  waveModal.classList.remove("hidden");
  waveModal.setAttribute("aria-hidden","false");
  waveText.focus({ preventScroll:true });
}
function closeModal(){
  waveModal.classList.add("hidden");
  waveModal.setAttribute("aria-hidden","true");
  waveText.value = "";
  countEl.textContent = "0";
  sendBtn.disabled = false;
  sendBtn.textContent = "Send";
}

waveText.addEventListener("input", ()=>{
  countEl.textContent = String(waveText.value.length);
});

waveBtn.addEventListener("click", openModal, { passive:true });

laterBtn.addEventListener("click", closeModal);
waveModal.addEventListener("click", (e)=>{
  if (e.target?.dataset?.close) closeModal();
});

/* ===========================
   GEO + USER DOC
   =========================== */
let lastGeo = null;
let myUid = null;

function startGeo(){
  if (!("geolocation" in navigator)){
    pillStatus.textContent = "No GPS";
    return;
  }

  navigator.geolocation.watchPosition(
    (pos)=>{
      lastGeo = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      pillStatus.textContent = "Up to date";
      // update user doc occasionally
      if (myUid) upsertUserDoc();
    },
    ()=>{
      pillStatus.textContent = "Location off";
    },
    { enableHighAccuracy:true, maximumAge:5000, timeout:10000 }
  );
}

async function upsertUserDoc(){
  const ref = doc(db, "users", myUid);
  const payload = {
    lastSeen: serverTimestamp(),
    vibe: currentVibe,
    vibeSub: currentVibe === "nature" ? natureSub : null
  };
  if (lastGeo){
    payload.lat = lastGeo.lat;
    payload.lng = lastGeo.lng;
  }
  await setDoc(ref, payload, { merge:true });
}

/* ===========================
   SEND WAVE (writes to /waves)
   =========================== */
sendBtn.addEventListener("click", async ()=>{
  const text = waveText.value.trim();
  if (!text) return;

  sendBtn.disabled = true;
  sendBtn.textContent = "Sending…";

  try{
    const u = auth.currentUser;
    if (!u) throw new Error("Not signed in");

    const themeKey = (currentVibe === "nature") ? natureSub : currentVibe;

    await addDoc(collection(db, "waves"), {
      uid: u.uid,
      message: text,
      createdAt: serverTimestamp(),
      lat: lastGeo?.lat ?? null,
      lng: lastGeo?.lng ?? null,
      theme: themeKey
    });

    closeModal();
  }catch(err){
    console.error(err);
    statusLine.textContent = "Could not send. Try again.";
    sendBtn.disabled = false;
    sendBtn.textContent = "Send";
  }
});

/* ===========================
   LIVE WAVES FEED
   =========================== */
function wireLiveWaves(){
  const qWaves = query(collection(db, "waves"), orderBy("createdAt","desc"), limit(12));
  onSnapshot(qWaves, (snap)=>{
    wavesFeed.innerHTML = "";

    if (snap.empty){
      const li = document.createElement("li");
      li.innerHTML = `
        <div class="avatar" aria-hidden="true"></div>
        <div>
          <div class="pName">No waves yet</div>
          <div class="pSub">Be the first. Keep it kind.</div>
        </div>
      `;
      wavesFeed.appendChild(li);
      return;
    }

    snap.forEach(docSnap=>{
      const w = docSnap.data();
      const li = document.createElement("li");
      li.innerHTML = `
        <div class="avatar" aria-hidden="true"></div>
        <div>
          <div class="pName">${(w.theme || "city").toUpperCase()}</div>
          <div class="pSub">${escapeHtml(w.message || "")}</div>
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
   AUTH INIT
   =========================== */
statusLine.textContent = "Signing in…";

signInAnonymously(auth).catch(err=>{
  console.error(err);
  statusLine.textContent = "Sign-in failed.";
});

onAuthStateChanged(auth, async (user)=>{
  if (!user) return;
  myUid = user.uid;

  statusLine.textContent = "Live.";
  pillStatus.textContent = "Starting…";

  startGeo();
  await upsertUserDoc();
  wireLiveWaves();
});

/* ===========================
   BOOT
   =========================== */
document.addEventListener("DOMContentLoaded", ()=>{
  wirePromoCards();
  wireVibes();
  renderPeople();
});
