// script.js — FULL fresh: 6 vibes + People + clickable profiles + Waves (Firebase)

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  onSnapshot,
  getDoc,
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
   UI refs
=========================== */
const statusLine = document.getElementById("statusLine");
const pillStatus = document.getElementById("pillStatus");
const vibePill = document.getElementById("vibePill");
const bannerWrap = document.getElementById("bannerWrap");

const peopleList = document.getElementById("people");
const wavesFeed = document.getElementById("wavesFeed");

const vibeButtons = Array.from(document.querySelectorAll(".vibeBtn"));
const waveBtn = document.getElementById("waveBtn");
const manageBtn = document.getElementById("manageBtn");

const waveModal = document.getElementById("waveModal");
const waveBackdrop = waveModal.querySelector(".modalBackdrop");
const waveText = document.getElementById("waveText");
const countEl = document.getElementById("count");
const sendBtn = document.getElementById("sendBtn");
const laterBtn = document.getElementById("laterBtn");
const closeWave = document.getElementById("closeWave");

const infoModal = document.getElementById("infoModal");

/* ===========================
   Theme + Vibes
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
  const url = VIBE_IMAGES_LOCAL[theme] || VIBE_IMAGES_LOCAL.city;
  const ok = await imageLoads(url);
  const layer = document.querySelector(".bgVibe");
  if (layer) layer.style.backgroundImage = `url("${ok ? url : VIBE_IMAGES_LOCAL.city}")`;
  setTheme(theme);
}

/* ===========================
   Promo jumps
=========================== */
function wirePromoCards(){
  document.querySelectorAll(".promoCard[data-jump]").forEach((card)=>{
    card.addEventListener("click", ()=>{
      const id = card.getAttribute("data-jump");
      const el = document.getElementById(id);
      if (!el) return;

      if (id === "waveBtn"){
        el.scrollIntoView({ behavior:"smooth", block:"center" });
        setTimeout(()=> el.click(), 180);
        return;
      }

      el.scrollIntoView({ behavior:"smooth", block:"start" });
    });
  });
}

/* ===========================
   People
=========================== */
function kmMin1(km){
  const safe = Math.max(1, km);
  if (safe === 1) return "within 1 km away";
  return `~${safe.toFixed(1)} km away`;
}

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

const MY_PROFILE = {
  name: "Tone",
  age: 57,
  gender: "m",
  bioLine: "Positive vibrations. Music • art • nature",
  bioFull: "Music, art, nature, animals, and life in general. Positive vibrations is my mantra — hoping to find someone who can pick up what I’m putting down.",
  loc: "Kangaroo Island",
  km: 1,
  photo: "img/beach.jpg"
};

const PEOPLE_BY_VIBE = {
  city: [
    { name:"Sam", age:54, gender:"m", bio:"Out for a walk • city lights", km:0.3,  avatarId:61 },
    { name:"Jade", age:31, gender:"f", bio:"Coffee nearby • night stroll", km:1.2, avatarId:14 },
    { name:"Luke", age:38, gender:"m", bio:"Tradie • finishing a job", km:2.2, avatarId:93 },
    { name:"Elena", age:27, gender:"f", bio:"Late snack • good chats", km:0.7, avatarId:45 }
  ],
  tech: [
    { name:"Sophie", age:29, gender:"f", bio:"Design + dev • headphones on", km:2.4, avatarId:16 },
    { name:"Nina",   age:32, gender:"f", bio:"Gaming night • chill co-op?", km:1.9, avatarId:48 },
    { name:"Omar",   age:41, gender:"m", bio:"Writing code • coffee fuel", km:3.7, avatarId:35 },
    { name:"Casey",  age:37, gender:"m", bio:"IT support • steady vibes", km:0.8, avatarId:25 }
  ],
  nature: [
    { name:"Mia",  age:29, gender:"f", bio:"Forest air • quiet mind", km:0.6, avatarId:22 },
    { name:"Noah", age:36, gender:"m", bio:"Coastal walk • no rush", km:1.8, avatarId:11 },
    { name:"Lena", age:48, gender:"f", bio:"Bird sounds • calm day", km:2.9, avatarId:58 },
    { name:"Kai",  age:33, gender:"m", bio:"Hiking • simple life", km:3.6, avatarId:39 }
  ],
  fitness: [
    { name:"Chris", age:34, gender:"m", bio:"Runner • sunrise laps", km:0.9, avatarId:4 },
    { name:"Asha",  age:30, gender:"f", bio:"Runner • steady pace", km:1.6, avatarId:9 },
    { name:"Tahlia",age:28, gender:"f", bio:"Pilates • strong + calm", km:3.0, avatarId:33 },
    { name:"Ethan", age:44, gender:"m", bio:"Gym then smoothie", km:2.1, avatarId:52 }
  ],
  beach: [
    { name:"Ivy",   age:28, gender:"f", bio:"Sunset walk • salty air", km:0.8, avatarId:30 },
    { name:"Josh",  age:40, gender:"m", bio:"Beach run • no rush", km:1.4, avatarId:41 },
    { name:"Kira",  age:33, gender:"f", bio:"Ocean dip • brave today", km:2.6, avatarId:24 },
    { name:"Tom",   age:47, gender:"m", bio:"Fishing • chill vibes", km:3.2, avatarId:70 }
  ],
  food: [
    { name:"May",   age:34, gender:"f", bio:"Testing a new recipe", km:0.9, avatarId:62 },
    { name:"Luca",  age:39, gender:"m", bio:"Cooking pasta • slow night", km:1.4, avatarId:21 },
    { name:"Elise", age:29, gender:"f", bio:"Baking bread • cozy", km:3.1, avatarId:18 },
    { name:"Jonah", age:47, gender:"m", bio:"Kitchen radio • soup on", km:2.6, avatarId:84 }
  ]
};

function openProfile(p){
  const url =
    `./profile.html?name=${encodeURIComponent(p.name)}` +
    `&age=${encodeURIComponent(p.age)}` +
    `&loc=${encodeURIComponent(p.loc || "Near you")}` +
    `&bio=${encodeURIComponent(p.bioFull || p.bio || "")}` +
    `&photo=${encodeURIComponent(p.photo || p.avatar || "")}` +
    `&km=${encodeURIComponent(p.km ?? "")}`;
  location.href = url;
}

function renderPeople(vibe){
  usedAvatarKeys.clear();
  const arr = (PEOPLE_BY_VIBE[vibe] || PEOPLE_BY_VIBE.city);

  peopleList.innerHTML = "";

  // YOU first (same style, clickable)
  const meLi = document.createElement("li");
  meLi.className = "person";
  meLi.style.cursor = "pointer";

  meLi.innerHTML = `
    <div class="avatar" aria-hidden="true">
      <img class="avatarImg" src="${MY_PROFILE.photo}" alt="" loading="lazy"
        onerror="this.remove(); this.parentElement.classList.add('avatarFallback');">
    </div>
    <div>
      <div class="pName">${escapeHtml(MY_PROFILE.name)}, ${escapeHtml(MY_PROFILE.age)}</div>
      <div class="pSub">${escapeHtml(MY_PROFILE.bioLine)}</div>
      <div class="pDist">${escapeHtml(MY_PROFILE.loc)} • ${kmMin1(MY_PROFILE.km)}</div>
    </div>
  `;
  meLi.addEventListener("click", ()=>{
    openProfile({
      name: MY_PROFILE.name,
      age: MY_PROFILE.age,
      loc: MY_PROFILE.loc,
      bioFull: MY_PROFILE.bioFull,
      photo: MY_PROFILE.photo,
      km: MY_PROFILE.km
    });
  });
  peopleList.appendChild(meLi);

  // Others (all clickable)
  arr.forEach((p)=>{
    const li = document.createElement("li");
    li.className = "person";
    li.style.cursor = "pointer";

    const avatar = uniqueAvatar(p.gender === "f" ? "f" : "m", p.avatarId);

    li.innerHTML = `
      <div class="avatar" aria-hidden="true">
        <img class="avatarImg" src="${avatar}" alt="" loading="lazy"
          onerror="this.remove(); this.parentElement.classList.add('avatarFallback');">
      </div>
      <div>
        <div class="pName">${escapeHtml(p.name)}, ${escapeHtml(p.age)}</div>
        <div class="pSub">${escapeHtml(p.bio)}</div>
        <div class="pDist">${kmMin1(p.km)}</div>
      </div>
    `;

    li.addEventListener("click", ()=>{
      openProfile({
        name: p.name,
        age: p.age,
        loc: "Near you",
        bioFull: p.bio,
        photo: avatar,
        km: p.km
      });
    });

    peopleList.appendChild(li);
  });
}

/* ===========================
   Geo
=========================== */
let lastGeo = null;

function startGeo(){
  if (!("geolocation" in navigator)){
    pillStatus.textContent = "No location";
    vibePill.textContent = "Location off";
    return;
  }

  navigator.geolocation.watchPosition(
    (pos)=>{
      lastGeo = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      pillStatus.textContent = "Live";
      vibePill.textContent = "Up to date";
    },
    ()=>{
      pillStatus.textContent = "Location off";
      vibePill.textContent = "Location off";
    },
    { enableHighAccuracy:true, maximumAge:5000, timeout:10000 }
  );
}

/* ===========================
   Waves (Firestore)
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

waveText.addEventListener("input", ()=>{ countEl.textContent = String(waveText.value.length); });
laterBtn.addEventListener("click", closeWaveModal);
closeWave.addEventListener("click", closeWaveModal);
waveBackdrop.addEventListener("click", closeWaveModal);

waveBtn.addEventListener("click", openWaveModal);

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
      theme,
      createdAt: serverTimestamp(),
      lat: lastGeo?.lat ?? null,
      lng: lastGeo?.lng ?? null
    });

    closeWaveModal();
  }catch(e){
    console.error(e);
    sendBtn.disabled = false;
    sendBtn.textContent = "Send";
    statusLine.textContent = "Couldn’t send. Try again.";
  }
});

function listenWaves(){
  const qy = query(collection(db, "waves"), orderBy("createdAt","desc"), limit(12));
  onSnapshot(qy, (snap)=>{
    wavesFeed.innerHTML = "";
    snap.forEach((d)=>{
      const w = d.data() || {};
      const li = document.createElement("li");
      li.className = "person";
      li.innerHTML = `
        <div class="avatar avatarFallback" aria-hidden="true"></div>
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

/* ===========================
   User presence (simple)
=========================== */
let myUid = null;

function userRef(uid){ return doc(db, "users", uid); }

async function ensureUser(uid){
  const ref = userRef(uid);
  const snap = await getDoc(ref);
  if (!snap.exists()){
    await setDoc(ref, { createdAt: serverTimestamp(), lastSeen: serverTimestamp() }, { merge:true });
  }
}

/* ===========================
   Vibe wiring
=========================== */
function wireVibeButtons(){
  vibeButtons.forEach((btn)=>{
    btn.addEventListener("click", async ()=>{
      vibeButtons.forEach(b=>b.classList.remove("active"));
      btn.classList.add("active");

      const theme = btn.dataset.theme || "city";
      await applyVibe(theme);
      renderPeople(theme);

      statusLine.textContent = "Ready.";
    }, { passive:true });
  });
}

/* ===========================
   Info modal
=========================== */
function openInfo(){
  infoModal.classList.remove("hidden");
  infoModal.setAttribute("aria-hidden","false");
}
function closeInfo(){
  infoModal.classList.add("hidden");
  infoModal.setAttribute("aria-hidden","true");
}
manageBtn.addEventListener("click", openInfo);
infoModal.querySelectorAll("[data-close='info']").forEach((el)=>{
  el.addEventListener("click", closeInfo);
});

/* ===========================
   Helpers
=========================== */
function escapeHtml(s){
  return String(s)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

/* ===========================
   INIT
=========================== */
wirePromoCards();
wireVibeButtons();

bannerWrap.innerHTML = `
  <div class="banner">
    <div class="bannerTitle">Experimental build</div>
    <div class="bannerSub">Tap any profile card to view it. Waves are short and kind.</div>
  </div>
`;

statusLine.textContent = "Signing in…";
pillStatus.textContent = "Starting…";
startGeo();

signInAnonymously(auth)
  .then(async (cred)=>{
    myUid = cred.user.uid;

    await ensureUser(myUid);

    // live presence ping
    setInterval(()=>{
      setDoc(userRef(myUid), {
        lastSeen: serverTimestamp(),
        lat: lastGeo?.lat ?? null,
        lng: lastGeo?.lng ?? null
      }, { merge:true }).catch(()=>{});
    }, 25_000);

    // initial vibe
    const theme = document.querySelector(".vibeBtn.active")?.dataset?.theme || "city";
    await applyVibe(theme);
    renderPeople(theme);

    listenWaves();

    statusLine.textContent = "Ready.";
    pillStatus.textContent = "Live";
  })
  .catch((err)=>{
    console.error(err);
    statusLine.textContent = "Sign-in failed.";
    pillStatus.textContent = "Offline";
  });
