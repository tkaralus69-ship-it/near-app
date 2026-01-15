// script.js (ES module) — FULL (SHIP)
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
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

/* Me button */
const meBtn = document.getElementById("meBtn");
const meBtnImg = document.getElementById("meBtnImg");
const meBtnFallback = document.getElementById("meBtnFallback");

/* Wave modal */
const waveModal = document.getElementById("waveModal");
const waveBackdrop = document.getElementById("waveBackdrop");
const waveText = document.getElementById("waveText");
const countEl = document.getElementById("count");
const sendBtn = document.getElementById("sendBtn");
const laterBtn = document.getElementById("laterBtn");

/* Profile modal */
const profileModal = document.getElementById("profileModal");
const profileBackdrop = document.getElementById("profileBackdrop");
const profileCloseBtn = document.getElementById("profileCloseBtn");
const profileWaveBtn = document.getElementById("profileWaveBtn");
const profileAvatarImg = document.getElementById("profileAvatarImg");
const profileAvatarFallback = document.getElementById("profileAvatarFallback");
const profileNameEl = document.getElementById("profileName");
const profileBioEl = document.getElementById("profileBio");
const profileDistEl = document.getElementById("profileDist");

/* My Profile modal */
const meModal = document.getElementById("meModal");
const meBackdrop = document.getElementById("meBackdrop");
const meCloseBtn = document.getElementById("meCloseBtn");
const meSaveBtn = document.getElementById("meSaveBtn");
const meSavedHint = document.getElementById("meSavedHint");
const meName = document.getElementById("meName");
const meAge = document.getElementById("meAge");
const meBio = document.getElementById("meBio");
const meVibe = document.getElementById("meVibe");

/* ===========================
   VIBE IMAGES (10 tiles vibe locked)
   - each vibe has two images (we rotate between them)
=========================== */
const VIBE_IMAGES = {
  city: [
    // your picks (2 & 5 vibe)
    "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=2200&q=70",
    "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?auto=format&fit=crop&w=2200&q=70"
  ],
  nature: [
    // 4 & 6 camping / green
    "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=2200&q=70",
    "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=2200&q=70"
  ],
  beach: [
    // 6
    "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=2200&q=70",
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2200&q=70"
  ],
  fitness: [
    // add 2 running + yoga room
    "https://images.unsplash.com/photo-1554284126-aa88f22d8b74?auto=format&fit=crop&w=2200&q=70",
    "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=2200&q=70"
  ],
  tech: [
    // 1 & 5 + tech girl
    "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=2200&q=70",
    "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=2200&q=70"
  ]
};

/* ===========================
   THEMES (accent palette)
=========================== */
const THEMES = {
  city:   { bg1:"#2e3a3f", bg2:"#0b0f12", a1:"#6ee7b7", a2:"#7dd3fc" },
  nature: { bg1:"#2f5a43", bg2:"#06130c", a1:"#86efac", a2:"#34d399" },
  beach:  { bg1:"#2b6b73", bg2:"#08161b", a1:"#fcd34d", a2:"#f59e0b" },
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
  const imgs = VIBE_IMAGES[theme] || VIBE_IMAGES.city;
  const url = imgs[0];
  const layer = document.querySelector(".bgVibe");
  if (layer) layer.style.backgroundImage = `url("${url}")`;
  setTheme(theme);
}

/* rotate background image every time you click same vibe */
let vibeImageIndex = {
  city: 0, nature: 0, beach: 0, fitness: 0, tech: 0
};
function cycleVibeImage(theme){
  const imgs = VIBE_IMAGES[theme] || VIBE_IMAGES.city;
  vibeImageIndex[theme] = (vibeImageIndex[theme] + 1) % imgs.length;
  const url = imgs[vibeImageIndex[theme]];
  const layer = document.querySelector(".bgVibe");
  if (layer) layer.style.backgroundImage = `url("${url}")`;
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
=========================== */
function kmMin1(km){
  const safe = Math.max(1, km);
  if (safe === 1) return "within 1 km away";
  return `~${safe.toFixed(1)} km away`;
}

/* deterministic avatars (gender matched, stable, no dupes per render) */
const usedAvatarKeys = new Set();
function avatarUrl(gender, id){
  const g = gender === "f" ? "women" : "men";
  const safeId = Math.max(0, Math.min(99, Number(id || 0)));
  return `https://randomuser.me/api/portraits/${g}/${safeId}.jpg`;
}
function uniqueAvatar(gender, preferredId){
  let id = Number(preferredId || 0) % 100;
  for (let tries = 0; tries < 120; tries++){
    const key = `${gender}:${id}`;
    if (!usedAvatarKeys.has(key)){
      usedAvatarKeys.add(key);
      return avatarUrl(gender, id);
    }
    id = (id + 7) % 100;
  }
  return avatarUrl(gender, preferredId || 0);
}

const PEOPLE_BY_VIBE = {
  city: [
    { name:"Sam", age:54, gender:"m", bio:"Out for a walk • city lights", km:0.3,  avatarId:61 },
    { name:"Jade", age:31, gender:"f", bio:"Coffee nearby • night stroll", km:1.2, avatarId:14 },
    { name:"Luke", age:38, gender:"m", bio:"Tradie • finishing a job", km:2.2, avatarId:93 },
    { name:"Elena", age:27, gender:"f", bio:"Late snack • good chats", km:0.7, avatarId:45 },
    { name:"David", age:61, gender:"m", bio:"Just chillin • music on", km:4.9, avatarId:73 }
  ],
  nature: [
    { name:"Mia",  age:29, gender:"f", bio:"Forest air • quiet mind", km:0.6, avatarId:22 },
    { name:"Noah", age:36, gender:"m", bio:"Coastal walk • no rush", km:1.8, avatarId:11 },
    { name:"Lena", age:48, gender:"f", bio:"Bird sounds • calm day", km:2.9, avatarId:58 },
    { name:"Kai",  age:33, gender:"m", bio:"Hiking • simple life", km:3.6, avatarId:39 },
    { name:"Rose", age:57, gender:"f", bio:"Tea after a walk", km:4.1, avatarId:80 }
  ],
  beach: [
    { name:"Tara", age:28, gender:"f", bio:"Beach walk • salty air", km:0.7, avatarId:33 },
    { name:"Benji",age:35, gender:"m", bio:"Sunset chats • no rush", km:1.7, avatarId:19 },
    { name:"Amir", age:44, gender:"m", bio:"Ocean swim • calm energy", km:3.2, avatarId:51 },
    { name:"Kira", age:40, gender:"f", bio:"Coffee after the coast", km:2.4, avatarId:67 },
    { name:"Rob",  age:59, gender:"m", bio:"Morning stroll • simple", km:4.5, avatarId:90 }
  ],
  fitness: [
    { name:"Chris", age:34, gender:"m", bio:"Runner • sunrise laps", km:0.9, avatarId:4 },
    { name:"Asha",  age:30, gender:"f", bio:"Runner • steady pace", km:1.6, avatarId:9 },
    { name:"Tahlia",age:28, gender:"f", bio:"Yoga • strong + calm", km:3.0, avatarId:31 },
    { name:"Ethan", age:44, gender:"m", bio:"Gym then smoothie", km:2.1, avatarId:52 },
    { name:"Mark",  age:58, gender:"m", bio:"Daily walk • feeling good", km:4.4, avatarId:88 }
  ],
  tech: [
    { name:"Sophie", age:29, gender:"f", bio:"Design + dev • headphones on", km:2.4, avatarId:16 },
    { name:"Nina",   age:32, gender:"f", bio:"Gaming night • chill co-op?", km:1.9, avatarId:48 },
    { name:"Ben",    age:55, gender:"m", bio:"Tech talk • no ego", km:4.6, avatarId:66 },
    { name:"Omar",   age:41, gender:"m", bio:"Writing code • coffee fuel", km:3.7, avatarId:35 },
    { name:"Ava",    age:26, gender:"f", bio:"Laptop open • building things", km:0.8, avatarId:12 }
  ]
};

function renderPeople(vibe){
  usedAvatarKeys.clear();
  const arr = (PEOPLE_BY_VIBE[vibe] || PEOPLE_BY_VIBE.city).slice(0,5);

  peopleList.innerHTML = "";
  arr.forEach((p, idx)=>{
    const li = document.createElement("li");
    li.dataset.vibe = vibe;
    li.dataset.index = String(idx);

    const url = uniqueAvatar(p.gender === "f" ? "f" : "m", p.avatarId);

    li.innerHTML = `
      <div class="avatar" aria-hidden="true">
        <img class="avatarImg" src="${url}" alt="" loading="lazy">
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
   PROFILE VIEW (demo person)
=========================== */
let currentProfile = null;

function openProfile(person){
  currentProfile = person;

  // Name / bio / dist
  profileNameEl.textContent = `${person.name}, ${person.age}`;
  profileBioEl.textContent = person.bio;
  profileDistEl.textContent = kmMin1(person.km);

  // Avatar
  profileAvatarFallback.textContent = (person.name || "N").slice(0,1).toUpperCase();

  // Use same avatar generation as list for consistency:
  const url = avatarUrl(person.gender === "f" ? "women" : "men", person.avatarId);
  profileAvatarImg.src = url;

  profileModal.classList.remove("hidden");
  profileModal.setAttribute("aria-hidden","false");
}

function closeProfile(){
  profileModal.classList.add("hidden");
  profileModal.setAttribute("aria-hidden","true");
  currentProfile = null;
}

profileBackdrop.addEventListener("click", closeProfile);
profileCloseBtn.addEventListener("click", closeProfile);
profileWaveBtn.addEventListener("click", ()=>{
  // open wave modal from profile
  closeProfile();
  openWaveModal();
});

/* Click a person card => profile view */
peopleList.addEventListener("click", (e)=>{
  const li = e.target.closest("li");
  if (!li) return;

  const vibe = li.dataset.vibe || "city";
  const idx = Number(li.dataset.index || 0);
  const arr = PEOPLE_BY_VIBE[vibe] || PEOPLE_BY_VIBE.city;
  const person = arr[idx];
  if (!person) return;
  openProfile(person);
});

/* ===========================
   WAVE MODAL
=========================== */
function openWaveModal(){
  waveModal.classList.remove("hidden");
  waveModal.setAttribute("aria-hidden","false");
  waveText.focus({ preventScroll:true });
}
function closeWaveModal(){
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
waveBtn.addEventListener("click", openWaveModal);
laterBtn.addEventListener("click", closeWaveModal);
waveBackdrop.addEventListener("click", closeWaveModal);

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
   MY PROFILE (Firestore)
=========================== */
let myUid = null;

const DEFAULT_ME = {
  name: "Me",
  age: "",
  bio: "Here. Real. Near.",
  vibe: "city",
  avatarKey: "me"
};

function setMeButtonAvatar(seedText){
  // stable randomuser portrait id from seed
  const n = hashTo0_99(seedText || "near");
  const url = `https://randomuser.me/api/portraits/men/${n}.jpg`;

  meBtnImg.onload = () => {
    meBtnImg.style.display = "block";
    meBtnFallback.style.display = "none";
  };
  meBtnImg.onerror = () => {
    meBtnImg.style.display = "none";
    meBtnFallback.style.display = "grid";
  };
  meBtnImg.src = url;
}

function hashTo0_99(s){
  let h = 2166136261;
  for (let i=0;i<s.length;i++){
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h) % 100;
}

async function loadMyProfile(){
  if (!myUid) return DEFAULT_ME;

  const ref = doc(db, "users", myUid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return DEFAULT_ME;

  const d = snap.data() || {};
  return {
    name: typeof d.name === "string" ? d.name : DEFAULT_ME.name,
    age: Number.isFinite(d.age) ? d.age : (d.age || ""),
    bio: typeof d.bio === "string" ? d.bio : DEFAULT_ME.bio,
    vibe: typeof d.vibe === "string" ? d.vibe : DEFAULT_ME.vibe
  };
}

async function saveMyProfile(payload){
  if (!myUid) return;
  const ref = doc(db, "users", myUid);
  await setDoc(ref, {
    name: payload.name,
    age: payload.age,
    bio: payload.bio,
    vibe: payload.vibe,
    lastSeen: serverTimestamp(),
    lat: lastGeo?.lat ?? null,
    lng: lastGeo?.lng ?? null
  }, { merge:true });
}

function openMeModal(){
  meModal.classList.remove("hidden");
  meModal.setAttribute("aria-hidden","false");
  meSavedHint.textContent = "";
}

function closeMeModal(){
  meModal.classList.add("hidden");
  meModal.setAttribute("aria-hidden","true");
}

meBtn.addEventListener("click", async ()=>{
  openMeModal();
  const p = await loadMyProfile();

  meName.value = p.name || "";
  meAge.value = p.age || "";
  meBio.value = p.bio || "";
  meVibe.value = p.vibe || "city";
});

meBackdrop.addEventListener("click", closeMeModal);
meCloseBtn.addEventListener("click", closeMeModal);

meSaveBtn.addEventListener("click", async ()=>{
  const name = (meName.value || "").trim().slice(0,40) || "Me";
  const ageNum = Number(meAge.value);
  const age = Number.isFinite(ageNum) ? Math.max(18, Math.min(99, ageNum)) : "";
  const bio = (meBio.value || "").trim().slice(0,120) || "Here. Real. Near.";
  const vibe = meVibe.value || "city";

  meSaveBtn.disabled = true;
  meSaveBtn.textContent = "Saving…";

  try{
    await saveMyProfile({ name, age, bio, vibe });
    meSavedHint.textContent = "Saved ✅";

    // update Me button avatar + optionally switch vibe
    setMeButtonAvatar(`${name}:${myUid}`);
  }catch(err){
    console.error(err);
    meSavedHint.textContent = "Couldn’t save. Try again.";
  }finally{
    meSaveBtn.disabled = false;
    meSaveBtn.textContent = "Save";
  }
});

/* ===========================
   AUTH + USER DOC presence
=========================== */
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

    closeWaveModal();
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
        <div class="avatar avatarFallback" aria-hidden="true">NEAR</div>
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
      const theme = btn.dataset.theme || "city";

      // If you tap same vibe again, cycle its image
      const isAlreadyActive = btn.classList.contains("active");

      vibeButtons.forEach(b=>b.classList.remove("active"));
      btn.classList.add("active");

      if (isAlreadyActive) cycleVibeImage(theme);
      else applyVibe(theme);

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
pillStatus.textContent = "Starting…";
startGeo();

signInAnonymously(auth).then(async (cred)=>{
  myUid = cred.user.uid;
  statusLine.textContent = "Live.";
  await ensureUserDoc(myUid);

  // set Me avatar
  const myProfile = await loadMyProfile();
  setMeButtonAvatar(`${myProfile.name}:${myUid}`);

  listenWaves();
}).catch((err)=>{
  console.error(err);
  statusLine.textContent = "Sign-in failed.";
  pillStatus.textContent = "Offline";
});

// keep presence fresh (no spam)
setInterval(()=>{
  if (!myUid) return;
  ensureUserDoc(myUid).catch(()=>{});
}, 25_000);
