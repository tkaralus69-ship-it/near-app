// script.js (ES module) — FULL
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
   VIBE BACKGROUNDS (locked)
   Swap URLs anytime later
=========================== */
const VIBE_IMAGES = {
  city:
    "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?auto=format&fit=crop&w=2000&q=70",
  tech:
    "https://images.unsplash.com/photo-1518779578993-ec3579fee39f?auto=format&fit=crop&w=2000&q=70",
  nature:
    "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=2000&q=70",
  fitness:
    "https://images.unsplash.com/photo-1546483875-ad9014c88eba?auto=format&fit=crop&w=2000&q=70"
};

/* ===========================
   THEMES (accent palette)
=========================== */
const THEMES = {
  city:   { bg1:"#2e3a3f", bg2:"#0b0f12", a1:"#6ee7b7", a2:"#7dd3fc" },
  tech:   { bg1:"#2a2240", bg2:"#070312", a1:"#c4b5fd", a2:"#a78bfa" },
  nature: { bg1:"#2f5a43", bg2:"#06130c", a1:"#86efac", a2:"#34d399" },
  fitness:{ bg1:"#2b2f3a", bg2:"#0a0c12", a1:"#fcd34d", a2:"#fb7185" }
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

  // promo cards share the same vibe image
  document.querySelectorAll(".promoCard").forEach((card) => {
    card.style.setProperty("--promoImage", `url("${url}")`);
  });

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
   PEOPLE + AVATARS (locked)
   Demographic range + vibe-swaps
=========================== */
const AVATARS = {
  city: [
    "https://images.unsplash.com/photo-1520975958225-2f9b9c33cdb0?auto=format&fit=crop&w=300&q=70",
    "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=70",
    "https://images.unsplash.com/photo-1528892952291-009c663ce843?auto=format&fit=crop&w=300&q=70",
    "https://images.unsplash.com/photo-1552374196-c4e7ffc6e126?auto=format&fit=crop&w=300&q=70",
    "https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?auto=format&fit=crop&w=300&q=70"
  ],
  tech: [
    "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=300&q=70",
    "https://images.unsplash.com/photo-1524503033411-f7a2fe8c7c47?auto=format&fit=crop&w=300&q=70",
    "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=300&q=70",
    "https://images.unsplash.com/photo-1552058544-f2b08422138a?auto=format&fit=crop&w=300&q=70",
    "https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=300&q=70"
  ],
  nature: [
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=70",
    "https://images.unsplash.com/photo-1557053910-d9eadeed1c58?auto=format&fit=crop&w=300&q=70",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=70",
    "https://images.unsplash.com/photo-1548142813-c348350df52b?auto=format&fit=crop&w=300&q=70",
    "https://images.unsplash.com/photo-1542206395-9feb3edaa68d?auto=format&fit=crop&w=300&q=70"
  ],
  fitness: [
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=300&q=70",
    "https://images.unsplash.com/photo-1552374196-1f3f3a3b27aa?auto=format&fit=crop&w=300&q=70",
    "https://images.unsplash.com/photo-1541534401786-2077eed87a72?auto=format&fit=crop&w=300&q=70",
    "https://images.unsplash.com/photo-1544005316-04ce0f8a2f3b?auto=format&fit=crop&w=300&q=70",
    "https://images.unsplash.com/photo-1552374196-c4e7ffc6e126?auto=format&fit=crop&w=300&q=70"
  ]
};

function kmMin1(km){
  const safe = Math.max(1, km);
  if (safe === 1) return "within 1 km away";
  return `~${safe.toFixed(1)} km away`;
}

const PEOPLE_BY_VIBE = {
  city: [
    { name:"Sam", age:54, bio:"Out for a walk • city lights", km:0.3 },
    { name:"Jade", age:31, bio:"Coffee nearby • night stroll", km:1.2 },
    { name:"Michael", age:42, bio:"Taking it slow • skyline", km:3.4 },
    { name:"Elena", age:27, bio:"Late snack • good chats", km:0.7 },
    { name:"David", age:61, bio:"Just chillin • music on", km:4.9 }
  ],
  tech: [
    { name:"Ava", age:26, bio:"Laptop open • building things", km:0.8 },
    { name:"Nina", age:32, bio:"Gaming night • chill co-op?", km:1.9 },
    { name:"Omar", age:41, bio:"Writing code • coffee fuel", km:3.7 },
    { name:"Sophie", age:29, bio:"Design + dev • headphones on", km:2.4 },
    { name:"Ben", age:55, bio:"Tech talk • no ego", km:4.6 }
  ],
  nature: [
    { name:"Mia", age:29, bio:"Forest air • quiet mind", km:0.6 },
    { name:"Noah", age:36, bio:"Coastal walk • no rush", km:1.8 },
    { name:"Lena", age:48, bio:"Bird sounds • calm day", km:2.9 },
    { name:"Kai", age:33, bio:"Hiking • simple life", km:3.6 },
    { name:"Rose", age:57, bio:"Tea after a walk", km:4.1 }
  ],
  fitness: [
    { name:"Chris", age:34, bio:"Runner • sunrise laps", km:0.9 },
    { name:"Asha", age:30, bio:"Runner • steady pace", km:1.6 },
    { name:"Tom", age:45, bio:"Gym + coffee after", km:3.0 },
    { name:"Renee", age:39, bio:"Yoga • breathe • balance", km:2.1 },
    { name:"Mark", age:58, bio:"Daily walk • feeling good", km:4.4 }
  ]
};

/* 5-line shuffle */
function shuffle(arr){
  return arr
    .map(v => ({ v, r: Math.random() }))
    .sort((a,b) => a.r - b.r)
    .map(x => x.v);
}

function renderPeople(vibe){
  const arr = shuffle(PEOPLE_BY_VIBE[vibe] || PEOPLE_BY_VIBE.city);
  const pics = AVATARS[vibe] || AVATARS.city;

  peopleList.innerHTML = "";
  arr.slice(0,5).forEach((p, idx)=>{
    const li = document.createElement("li");
    const img = pics[idx % pics.length];
    li.innerHTML = `
      <div class="avatar" aria-hidden="true">
        <img src="${img}" alt="">
      </div>
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

    const theme = document.querySelector(".vibeBtn.active")?.dataset?.theme || "city";

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
        <div class="avatar" aria-hidden="true"></div>
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

      statusLine.textContent = "Live.";
    }, { passive:true });
  });

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
pillStatus.textContent = "Starting…";

startGeo();

signInAnonymously(auth).then(async (cred)=>{
  myUid = cred.user.uid;
  statusLine.textContent = "Live.";
  await ensureUserDoc(myUid);
  listenWaves();
}).catch((err)=>{
  console.error(err);
  statusLine.textContent = "Sign-in failed.";
  pillStatus.textContent = "Offline";
});

// keep presence fresh
setInterval(()=>{
  if (!myUid) return;
  ensureUserDoc(myUid).catch(()=>{});
}, 25_000);
