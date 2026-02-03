import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
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

const myProfileLink = document.getElementById("myProfileLink");

/* Wave modal */
const modal = document.getElementById("waveModal");
const backdrop = modal.querySelector(".modalBackdrop");
const waveText = document.getElementById("waveText");
const countEl = document.getElementById("count");
const sendBtn = document.getElementById("sendBtn");
const laterBtn = document.getElementById("laterBtn");

/* ===========================
   VIBE IMAGES (LOCAL with remote fallback)
=========================== */
const VIBE_IMAGES_LOCAL = {
  city:   "img/city.jpg",
  tech:   "img/tech.jpg",
  nature: "img/nature.jpg",
  fitness:"img/fitness.jpg",
  beach:  "img/beach.jpg",
  food:   "img/food.jpg"
};

const VIBE_IMAGES_REMOTE = {
  city:   "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?auto=format&fit=crop&w=2000&q=70",
  tech:   "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=2000&q=70",
  nature: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=2000&q=70",
  fitness:"https://images.unsplash.com/photo-1546483875-ad9014c88eba?auto=format&fit=crop&w=2000&q=70",
  beach:  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2000&q=70",
  food:   "https://images.unsplash.com/photo-1556912167-f556f1f39df8?auto=format&fit=crop&w=2000&q=70"
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

async function resolveVibeImage(theme){
  const local = VIBE_IMAGES_LOCAL[theme];
  const remote = VIBE_IMAGES_REMOTE[theme] || VIBE_IMAGES_REMOTE.city;
  if (!local) return remote;
  const ok = await imageLoads(local);
  return ok ? local : remote;
}

async function applyVibe(theme){
  const url = await resolveVibeImage(theme);
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
   PEOPLE (demo) + YOUR CARD
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

const PEOPLE_BY_VIBE = {
  city: [
    { name:"Sam", age:54, gender:"m", bio:"Out for a walk • city lights", km:0.3,  avatarId:61 },
    { name:"Jade", age:31, gender:"f", bio:"Coffee nearby • night stroll", km:1.2, avatarId:14 },
    { name:"Luke", age:38, gender:"m", bio:"Tradie • finishing a job", km:2.2, avatarId:93 },
    { name:"Michael", age:42, gender:"m", bio:"Taking it slow • skyline", km:3.4, avatarId:27 },
    { name:"Elena", age:27, gender:"f", bio:"Late snack • good chats", km:0.7, avatarId:45 }
  ],
  tech: [
    { name:"Sophie", age:29, gender:"f", bio:"Design + dev • headphones on", km:2.4, avatarId:16 },
    { name:"Nina",   age:32, gender:"f", bio:"Gaming night • chill co-op?", km:1.9, avatarId:48 },
    { name:"Omar",   age:41, gender:"m", bio:"Writing code • coffee fuel", km:3.7, avatarId:35 },
    { name:"Casey",  age:37, gender:"m", bio:"IT support • steady vibes", km:0.8, avatarId:25 },
    { name:"Ben",    age:55, gender:"m", bio:"Tech talk • no ego", km:4.6, avatarId:66 }
  ],
  nature: [
    { name:"Mia",  age:29, gender:"f", bio:"Forest air • quiet mind", km:0.6, avatarId:22 },
    { name:"Noah", age:36, gender:"m", bio:"Coastal walk • no rush", km:1.8, avatarId:11 },
    { name:"Kai",  age:33, gender:"m", bio:"Hiking • simple life", km:3.6, avatarId:39 },
    { name:"Lena", age:48, gender:"f", bio:"Bird sounds • calm day", km:2.9, avatarId:58 },
    { name:"Rose", age:57, gender:"f", bio:"Tea after a walk", km:4.1, avatarId:80 }
  ],
  fitness: [
    { name:"Chris", age:34, gender:"m", bio:"Runner • sunrise laps", km:0.9, avatarId:4 },
    { name:"Asha",  age:30, gender:"f", bio:"Runner • steady pace", km:1.6, avatarId:9 },
    { name:"Tahlia",age:28, gender:"f", bio:"Pilates • strong + calm", km:3.0, avatarId:33 },
    { name:"Ethan", age:44, gender:"m", bio:"Gym then smoothie", km:2.1, avatarId:52 },
    { name:"Mark",  age:58, gender:"m", bio:"Daily walk • feeling good", km:4.4, avatarId:88 }
  ],
  beach: [
    { name:"Ivy",   age:28, gender:"f", bio:"Sunset walk • salty air", km:0.8, avatarId:30 },
    { name:"Josh",  age:40, gender:"m", bio:"Beach run • no rush", km:1.4, avatarId:41 },
    { name:"Kira",  age:33, gender:"f", bio:"Ocean dip • brave today", km:2.6, avatarId:24 },
    { name:"Tom",   age:47, gender:"m", bio:"Fishing • chill vibes", km:3.2, avatarId:70 },
    { name:"Mara",  age:55, gender:"f", bio:"Coffee by the water", km:4.7, avatarId:12 }
  ],
  food: [
    { name:"May",   age:34, gender:"f", bio:"Testing a new recipe", km:0.9, avatarId:62 },
    { name:"Luca",  age:39, gender:"m", bio:"Cooking pasta • slow night", km:1.4, avatarId:21 },
    { name:"Elise", age:29, gender:"f", bio:"Baking bread • cozy", km:3.1, avatarId:18 },
    { name:"Jonah", age:47, gender:"m", bio:"Kitchen radio • soup on", km:2.6, avatarId:84 },
    { name:"Rita",  age:56, gender:"f", bio:"Sunday roast • good vibes", km:4.2, avatarId:7 }
  ]
};

function makePersonRow({name, sub, dist, photoSrc, onClickHref}){
  const li = document.createElement("li");

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "personBtn";
  btn.addEventListener("click", ()=>{
    if (onClickHref) window.location.href = onClickHref;
  });

  btn.innerHTML = `
    <div style="display:flex; gap:12px; align-items:center;">
      <div class="avatar" aria-hidden="true">
        ${photoSrc ? `<img class="avatarImg" src="${photoSrc}" alt="" loading="lazy"
          onerror="this.remove(); this.parentElement.classList.add('avatarFallback');">` : ``}
      </div>
      <div>
        <div class="pName">${escapeHtml(name)}</div>
        <div class="pSub">${escapeHtml(sub)}</div>
        <div class="pDist">${escapeHtml(dist)}</div>
      </div>
    </div>
  `;

  // If no photo, fallback styling
  if (!photoSrc){
    const a = btn.querySelector(".avatar");
    a.classList.add("avatarFallback");
  }

  li.appendChild(btn);
  return li;
}

function renderPeople(vibe, myProfile){
  usedAvatarKeys.clear();
  peopleList.innerHTML = "";

  // 1) YOUR CARD (first)
  if (myProfile){
    const name = myProfile.name || "You";
    const age = myProfile.age ? `, ${myProfile.age}` : "";
    const loc = myProfile.locationText || "Your location";
    const bio = myProfile.bio || "Tap to view your profile";
    const photo = myProfile.photoDataUrl || myProfile.photoUrl || null;

    const youRow = makePersonRow({
      name: `${name}${age}`,
      sub: bio,
      dist: loc,
      photoSrc: photo,
      onClickHref: `profile.html?uid=${encodeURIComponent(myProfile.uid)}`
    });

    peopleList.appendChild(youRow);
  } else {
    // If you haven't created a profile yet
    const youRow = makePersonRow({
      name: "Create your profile",
      sub: "One photo • a short bio • your vibe",
      dist: "Tap to start",
      photoSrc: null,
      onClickHref: "create.html"
    });
    peopleList.appendChild(youRow);
  }

  // 2) DEMO PEOPLE (below)
  const arr = (PEOPLE_BY_VIBE[vibe] || PEOPLE_BY_VIBE.city).slice(0, 5);

  arr.forEach(p=>{
    const url = uniqueAvatar(p.gender === "f" ? "f" : "m", p.avatarId);
    const row = makePersonRow({
      name: `${p.name}, ${p.age}`,
      sub: p.bio,
      dist: kmMin1(p.km),
      photoSrc: url,
      onClickHref: "" // later: open their profile
    });
    peopleList.appendChild(row);
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
   FIRESTORE: user doc
=========================== */
let myUid = null;

function userRef(uid){ return doc(db, "users", uid); }

async function ensureUserDoc(uid){
  const ref = userRef(uid);
  const snap = await getDoc(ref);
  if (!snap.exists()){
    await setDoc(ref, { createdAt: serverTimestamp(), lastSeen: serverTimestamp() }, { merge:true });
  } else {
    await setDoc(ref, { lastSeen: serverTimestamp() }, { merge:true });
  }
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
   VIBES WIRING
=========================== */
function wireVibeButtons(getMyProfile){
  vibeButtons.forEach(btn=>{
    btn.addEventListener("click", async ()=>{
      vibeButtons.forEach(b=>b.classList.remove("active"));
      btn.classList.add("active");

      const theme = btn.dataset.theme || "city";
      await applyVibe(theme);

      const myProfile = await getMyProfile();
      renderPeople(theme, myProfile);

      statusLine.textContent = "Ready.";
    }, { passive:true });
  });
}

/* ===========================
   PROMO
=========================== */
wirePromoCards();

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
statusLine.textContent = "Signing in…";
pillStatus.textContent = "Starting…";
startGeo();

signInAnonymously(auth).then(async (cred)=>{
  myUid = cred.user.uid;

  // Update the “Me” link so it always opens your profile
  if (myProfileLink) myProfileLink.href = `profile.html?uid=${encodeURIComponent(myUid)}`;

  await ensureUserDoc(myUid);

  // Load my profile (if exists)
  async function getMyProfile(){
    const snap = await getDoc(userRef(myUid));
    const u = snap.data() || {};
    if (!u.name && !u.bio && !u.photoUrl && !u.photoDataUrl) return null;
    return {
      uid: myUid,
      name: u.name || "You",
      age: u.age || "",
      locationText: u.locationText || "Your location",
      bio: u.bio || "",
      photoUrl: u.photoUrl || "",
      photoDataUrl: u.photoDataUrl || ""
    };
  }

  wireVibeButtons(getMyProfile);

  // Init vibe + people list
  const active = document.querySelector(".vibeBtn.active");
  const theme = active?.dataset?.theme || "city";
  await applyVibe(theme);
  renderPeople(theme, await getMyProfile());

  listenWaves();

  statusLine.textContent = "Live.";
  pillStatus.textContent = "Live";

  // Presence (light)
  setInterval(()=>{
    setDoc(userRef(myUid), {
      lastSeen: serverTimestamp(),
      lat: lastGeo?.lat ?? null,
      lng: lastGeo?.lng ?? null
    }, { merge:true }).catch(()=>{});
  }, 25_000);

}).catch((err)=>{
  console.error(err);
  statusLine.textContent = "Sign-in failed.";
  pillStatus.textContent = "Offline";
});
