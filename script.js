// script.js (ES module) — FRESH, MOBILE-SAFE, NO-SILENT-HANG
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  collection,
  addDoc,
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

const vibeButtons = Array.from(document.querySelectorAll(".vibeBtn"));
const peopleList = document.getElementById("people");
const wavesFeed = document.getElementById("wavesFeed");

const waveBtn = document.getElementById("waveBtn");
const liveBtn = document.getElementById("liveBtn");
const chooseBtn = document.getElementById("chooseBtn");

const plansBtn = document.getElementById("plansBtn");
const plansModal = document.getElementById("plansModal");
const plansState = document.getElementById("plansState");
const closePlans = document.getElementById("closePlans");

const feedbackBtn = document.getElementById("feedbackBtn");
const feedbackModal = document.getElementById("feedbackModal");
const feedbackText = document.getElementById("feedbackText");
const fbCount = document.getElementById("fbCount");
const cancelFeedback = document.getElementById("cancelFeedback");
const submitFeedbackBtn = document.getElementById("submitFeedbackBtn");

const waveModal = document.getElementById("waveModal");
const waveText = document.getElementById("waveText");
const countEl = document.getElementById("count");
const sendBtn = document.getElementById("sendBtn");
const laterBtn = document.getElementById("laterBtn");

/* ===========================
   DEBUG (shows mobile errors)
=========================== */
window.addEventListener("error", (e) => {
  try { statusLine.textContent = "Error: " + (e.message || "unknown"); } catch {}
});
window.addEventListener("unhandledrejection", (e) => {
  try { statusLine.textContent = "Promise error: " + (e.reason?.message || e.reason || "unknown"); } catch {}
});

function withTimeout(promise, ms = 12000) {
  return Promise.race([
    promise,
    new Promise((_, rej) => setTimeout(() => rej(new Error("Timeout (auth/network blocked)")), ms))
  ]);
}

/* In-app browser detection (FB/IG/TikTok) */
function inAppBrowserHint(){
  const ua = navigator.userAgent || "";
  const isInApp =
    /FBAN|FBAV|Instagram|Line|TikTok|Snapchat/i.test(ua) ||
    (ua.includes("wv") && ua.includes("Android")); // Android webview
  if (isInApp){
    statusLine.textContent =
      "Tip: open this in Chrome/Safari (in-app browsers can block login/location).";
  }
}

/* ===========================
   VIBES (local images)
=========================== */
const VIBE_IMAGES_LOCAL = {
  city:   "img/city.jpg",
  tech:   "img/tech.jpg",
  nature: "img/nature.jpg",
  fitness:"img/fitness.jpg",
  beach:  "img/beach.jpg",
  food:   "img/food.jpg"
};

const THEMES = {
  city:   { bg1:"#2e3a3f", bg2:"#0b0f12", a1:"#6ee7b7", a2:"#7dd3fc" },
  tech:   { bg1:"#2a2240", bg2:"#070312", a1:"#c4b5fd", a2:"#a78bfa" },
  nature: { bg1:"#2f5a43", bg2:"#06130c", a1:"#86efac", a2:"#34d399" },
  fitness:{ bg1:"#2b2f3a", bg2:"#0a0c12", a1:"#fcd34d", a2:"#fb7185" },
  beach:  { bg1:"#1f3a4a", bg2:"#061018", a1:"#7dd3fc", a2:"#a5f3fc" },
  food:   { bg1:"#3a2f2a", bg2:"#120a07", a1:"#fdba74", a2:"#fb923c" }
};

function setTheme(key){
  const t = THEMES[key] || THEMES.city;
  const r = document.documentElement;
  r.style.setProperty("--bg1", t.bg1);
  r.style.setProperty("--bg2", t.bg2);
  r.style.setProperty("--accent1", t.a1);
  r.style.setProperty("--accent2", t.a2);
}

function imageLoads(src){
  return new Promise((resolve)=>{
    const img = new Image();
    img.onload = ()=> resolve(true);
    img.onerror = ()=> resolve(false);
    img.src = src;
  });
}

async function applyVibe(theme){
  const layer = document.querySelector(".bgVibe");
  const local = VIBE_IMAGES_LOCAL[theme] || VIBE_IMAGES_LOCAL.city;
  const ok = await imageLoads(local);
  if (layer) layer.style.backgroundImage = `url("${ok ? local : VIBE_IMAGES_LOCAL.city}")`;
  setTheme(theme);
}

/* ===========================
   GEO (robust)
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
    (err)=>{
      // If user blocked it, we still allow app to run
      pillStatus.textContent = "Location off";
      console.warn("Geo error:", err);
    },
    { enableHighAccuracy:true, maximumAge:5000, timeout:10000 }
  );
}

/* ===========================
   DEMO PEOPLE + YOUR REAL PROFILE
=========================== */
function kmMin1(km){
  const safe = Math.max(1, km);
  if (safe === 1) return "within 1 km away";
  return `~${safe.toFixed(1)} km away`;
}

function escapeHtml(s){
  return String(s ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

/* Your profile (displayed as the example real profile) */
const MY_PROFILE = {
  name: "Tone",
  age: 57,
  locationLabel: "Kangaroo Island",
  bio: "Music, art, nature, animals, and life in general. Positive vibrations is my mantra — hoping to find someone who can pick up what I’m putting down.",
  // Optional: put ONE photo at /img/me.jpg
  photo: "img/me.jpg"
};

const PEOPLE_BY_VIBE = {
  city: [
    { name:"Sam", age:54, bio:"Out for a walk • city lights", km:0.3,  photo:"https://randomuser.me/api/portraits/men/61.jpg" },
    { name:"Jade", age:31, bio:"Coffee nearby • night stroll", km:1.2, photo:"https://randomuser.me/api/portraits/women/14.jpg" },
    { name:"Luke", age:38, bio:"Tradie • finishing a job", km:2.2, photo:"https://randomuser.me/api/portraits/men/93.jpg" }
  ],
  tech: [
    { name:"Sophie", age:29, bio:"Design + dev • headphones on", km:2.4, photo:"https://randomuser.me/api/portraits/women/16.jpg" },
    { name:"Omar", age:41, bio:"Writing code • coffee fuel", km:3.7, photo:"https://randomuser.me/api/portraits/men/35.jpg" },
    { name:"Nina", age:32, bio:"Gaming night • chill co-op?", km:1.9, photo:"https://randomuser.me/api/portraits/women/48.jpg" }
  ],
  nature: [
    { name:"Mia", age:29, bio:"Forest air • quiet mind", km:0.6, photo:"https://randomuser.me/api/portraits/women/22.jpg" },
    { name:"Noah", age:36, bio:"Coastal walk • no rush", km:1.8, photo:"https://randomuser.me/api/portraits/men/11.jpg" },
    { name:"Lena", age:48, bio:"Bird sounds • calm day", km:2.9, photo:"https://randomuser.me/api/portraits/women/58.jpg" }
  ],
  fitness: [
    { name:"Chris", age:34, bio:"Runner • sunrise laps", km:0.9, photo:"https://randomuser.me/api/portraits/men/4.jpg" },
    { name:"Asha", age:30, bio:"Runner • steady pace", km:1.6, photo:"https://randomuser.me/api/portraits/women/9.jpg" },
    { name:"Ethan", age:44, bio:"Gym then smoothie", km:2.1, photo:"https://randomuser.me/api/portraits/men/52.jpg" }
  ],
  beach: [
    { name:"Ivy", age:28, bio:"Sunset walk • salty air", km:0.8, photo:"https://randomuser.me/api/portraits/women/30.jpg" },
    { name:"Josh", age:40, bio:"Beach run • no rush", km:1.4, photo:"https://randomuser.me/api/portraits/men/41.jpg" },
    { name:"Mara", age:55, bio:"Coffee by the water", km:4.7, photo:"https://randomuser.me/api/portraits/women/12.jpg" }
  ],
  food: [
    { name:"May", age:34, bio:"Testing a new recipe", km:0.9, photo:"https://randomuser.me/api/portraits/women/62.jpg" },
    { name:"Luca", age:39, bio:"Cooking pasta • slow night", km:1.4, photo:"https://randomuser.me/api/portraits/men/21.jpg" },
    { name:"Elise", age:29, bio:"Baking bread • cozy", km:3.1, photo:"https://randomuser.me/api/portraits/women/18.jpg" }
  ]
};

async function renderPeople(vibe){
  peopleList.innerHTML = "";

  // Your profile first (as the real example)
  const myLi = document.createElement("li");
  myLi.className = "person";
  const myPhotoOk = await imageLoads(MY_PROFILE.photo);
  myLi.innerHTML = `
    <div class="avatar">
      <img src="${myPhotoOk ? MY_PROFILE.photo : "https://randomuser.me/api/portraits/men/86.jpg"}" alt="">
    </div>
    <div>
      <div class="pName">${escapeHtml(MY_PROFILE.name)}, ${MY_PROFILE.age}</div>
      <div class="pSub">${escapeHtml(MY_PROFILE.bio)}</div>
      <div class="pDist">${escapeHtml(MY_PROFILE.locationLabel)} • ${kmMin1(0.7)}</div>
    </div>
    <div class="rowActions">
      <button class="iconBtn" type="button" title="Call (coming soon)">📞</button>
      <button class="iconBtn" type="button" title="Video (coming soon)">🎥</button>
    </div>
  `;
  peopleList.appendChild(myLi);

  // Then demo people
  const arr = (PEOPLE_BY_VIBE[vibe] || PEOPLE_BY_VIBE.city);
  arr.forEach(p=>{
    const li = document.createElement("li");
    li.className = "person";
    li.innerHTML = `
      <div class="avatar"><img src="${p.photo}" alt=""></div>
      <div>
        <div class="pName">${escapeHtml(p.name)}, ${p.age}</div>
        <div class="pSub">${escapeHtml(p.bio)}</div>
        <div class="pDist">${kmMin1(p.km)}</div>
      </div>
      <div class="rowActions">
        <button class="iconBtn" type="button" title="Call (coming soon)">📞</button>
        <button class="iconBtn" type="button" title="Video (coming soon)">🎥</button>
      </div>
    `;
    peopleList.appendChild(li);
  });
}

/* ===========================
   MODALS
=========================== */
function openModal(m){ m.classList.remove("hidden"); m.setAttribute("aria-hidden","false"); }
function closeModal(m){ m.classList.add("hidden"); m.setAttribute("aria-hidden","true"); }

document.querySelectorAll(".modalBackdrop").forEach(bg=>{
  bg.addEventListener("click", ()=>{
    const k = bg.getAttribute("data-close");
    if (k === "wave") closeModal(waveModal);
    if (k === "plans") closeModal(plansModal);
    if (k === "feedback") closeModal(feedbackModal);
  });
});

laterBtn.addEventListener("click", ()=> closeModal(waveModal));
closePlans.addEventListener("click", ()=> closeModal(plansModal));
cancelFeedback.addEventListener("click", ()=> closeModal(feedbackModal));

waveText.addEventListener("input", ()=> countEl.textContent = String(waveText.value.length));
feedbackText.addEventListener("input", ()=> fbCount.textContent = String(feedbackText.value.length));

plansBtn.addEventListener("click", ()=> openModal(plansModal));
feedbackBtn.addEventListener("click", ()=>{
  closeModal(plansModal);
  feedbackText.value = "";
  fbCount.textContent = "0";
  openModal(feedbackModal);
});

/* ===========================
   FIRESTORE
=========================== */
let myUid = null;

function userRef(){ return doc(db, "users", myUid); }

async function ensureUser(){
  const snap = await getDoc(userRef());
  if (!snap.exists()){
    await setDoc(userRef(), {
      createdAt: serverTimestamp(),
      lastSeen: serverTimestamp(),
      profile: MY_PROFILE,
      trialExtraDays: 0
    }, { merge:true });
  } else {
    // Keep your public demo profile updated
    await setDoc(userRef(), {
      lastSeen: serverTimestamp(),
      profile: MY_PROFILE
    }, { merge:true });
  }
}

async function updatePresence(){
  if (!myUid) return;
  await setDoc(userRef(), {
    lastSeen: serverTimestamp(),
    lat: lastGeo?.lat ?? null,
    lng: lastGeo?.lng ?? null
  }, { merge:true });
}

/* Waves */
function listenWaves(){
  const qy = query(collection(db, "waves"), orderBy("createdAt","desc"), limit(12));
  onSnapshot(qy, (snap)=>{
    wavesFeed.innerHTML = "";
    snap.forEach(d=>{
      const w = d.data() || {};
      const li = document.createElement("li");
      li.className = "person";
      li.innerHTML = `
        <div class="avatar" aria-hidden="true"></div>
        <div>
          <div class="pName">${escapeHtml((w.theme || "near").toUpperCase())}</div>
          <div class="pSub">${escapeHtml(w.message || "")}</div>
          <div class="pDist">just now</div>
        </div>
      `;
      wavesFeed.appendChild(li);
    });
  });
}

/* Send wave */
sendBtn.addEventListener("click", async ()=>{
  const text = waveText.value.trim();
  if (!text) return;

  sendBtn.disabled = true;
  sendBtn.textContent = "Sending…";

  try{
    const theme = document.querySelector(".vibeBtn.active")?.dataset?.theme || "city";
    await addDoc(collection(db, "waves"), {
      uid: myUid,
      message: text,
      createdAt: serverTimestamp(),
      lat: lastGeo?.lat ?? null,
      lng: lastGeo?.lng ?? null,
      theme
    });

    waveText.value = "";
    countEl.textContent = "0";
    closeModal(waveModal);
  }catch(err){
    console.error(err);
    statusLine.textContent = "Couldn’t send wave: " + (err?.message || err);
  }finally{
    sendBtn.disabled = false;
    sendBtn.textContent = "Send";
  }
});

/* Feedback submit */
submitFeedbackBtn.addEventListener("click", async ()=>{
  const txt = feedbackText.value.trim();
  if (txt.length < 3) return;

  submitFeedbackBtn.disabled = true;
  submitFeedbackBtn.textContent = "Sending…";

  try{
    await setDoc(userRef(), {
      feedbackText: txt,
      feedbackSubmittedAt: serverTimestamp(),
      trialExtraDays: 7
    }, { merge:true });

    closeModal(feedbackModal);
    openModal(plansModal);
    plansState.textContent = "Feedback received ✅ Thank you. (+7 days added)";
  }catch(err){
    console.error(err);
    statusLine.textContent = "Feedback failed: " + (err?.message || err);
  }finally{
    submitFeedbackBtn.disabled = false;
    submitFeedbackBtn.textContent = "Submit";
  }
});

/* ===========================
   BUTTON WIRING
=========================== */
function wireVibes(){
  vibeButtons.forEach(btn=>{
    btn.addEventListener("click", async ()=>{
      vibeButtons.forEach(b=>b.classList.remove("active"));
      btn.classList.add("active");
      const theme = btn.dataset.theme || "city";
      await applyVibe(theme);
      await renderPeople(theme);
      statusLine.textContent = "Ready.";
    });
  });
}

waveBtn.addEventListener("click", ()=>{
  openModal(waveModal);
  waveText.focus({ preventScroll:true });
});

liveBtn.addEventListener("click", ()=>{
  document.getElementById("wavesFeed").scrollIntoView({ behavior:"smooth", block:"start" });
});

chooseBtn.addEventListener("click", ()=>{
  document.getElementById("people").scrollIntoView({ behavior:"smooth", block:"start" });
});

/* ===========================
   INIT
=========================== */
(async function init(){
  inAppBrowserHint();

  statusLine.textContent = "Signing in…";
  pillStatus.textContent = "Starting…";

  wireVibes();
  startGeo();

  try{
    const cred = await withTimeout(signInAnonymously(auth), 12000);
    myUid = cred.user.uid;

    await ensureUser();

    // Watch user doc (optional—gives us proof auth is working)
    onSnapshot(userRef(), () => {
      // no-op, just confirms connectivity
    });

    // Set initial vibe
    const theme = document.querySelector(".vibeBtn.active")?.dataset?.theme || "city";
    await applyVibe(theme);
    await renderPeople(theme);

    listenWaves();

    statusLine.textContent = "Ready.";
    // If geo updates, pill becomes "Up to date". Otherwise stays "Location off".
    if (!lastGeo) pillStatus.textContent = "Live";

    // Presence heartbeat
    setInterval(()=> updatePresence().catch(()=>{}), 25000);
  }catch(err){
    console.error(err);
    statusLine.textContent =
      "Sign-in failed: " + (err?.message || err) +
      " — If you opened this inside FB/IG/TikTok, open in Chrome/Safari.";
    pillStatus.textContent = "Offline";
  }
})();
