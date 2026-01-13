// Near v1 — Live Screen + Near Moments
// ✅ Anonymous auth + Firestore
// ✅ People Near list (privacy: min 1 km display)
// ✅ Near Moments (crossed paths / close by earlier / also here now / noticed you)
// ✅ Mutual "Yes, discreetly" unlocks ONE message (max 250)

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  serverTimestamp,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

/* =========================
   0) 🔥 PASTE YOUR FIREBASE CONFIG HERE
   ========================= */
const firebaseConfig = {
  apiKey: "PASTE_ME",
  authDomain: "PASTE_ME",
  projectId: "PASTE_ME",
  storageBucket: "PASTE_ME",
  messagingSenderId: "PASTE_ME",
  appId: "PASTE_ME"
};

// ---- App init
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

/* =========================
   1) UI refs
   ========================= */
const appEl = document.getElementById("app");
const statusPill = document.getElementById("statusPill");
const nearCountEl = document.getElementById("nearCount");

const vibeBtns = Array.from(document.querySelectorAll(".vibeBtn"));
const dots = Array.from(document.querySelectorAll(".dot"));

const peopleListEl = document.getElementById("peopleList");

const momentsCard = document.getElementById("momentsCard");
const momentTitleEl = document.getElementById("momentTitle");
const momentSubtitleEl = document.getElementById("momentSubtitle");
const momentPeopleEl = document.getElementById("momentPeople");
const dismissMomentBtn = document.getElementById("dismissMoment");
const btnYesDiscreet = document.getElementById("btnYesDiscreet");
const btnNoThanks = document.getElementById("btnNoThanks");

const waveBtn = document.getElementById("waveBtn");

const modalBackdrop = document.getElementById("modalBackdrop");
const messageModal = document.getElementById("messageModal");
const messageInput = document.getElementById("messageInput");
const charCount = document.getElementById("charCount");
const sendBtn = document.getElementById("sendBtn");
const maybeLaterBtn = document.getElementById("maybeLaterBtn");
const modalFinePrint = document.getElementById("modalFinePrint");

/* =========================
   2) Constants (tweakable)
   ========================= */
const PEOPLE_RADIUS_KM = 5;          // fetch + compute within 5km (MVP)
const DISPLAY_MIN_KM = 1;            // privacy: never show below 1km
const ALSO_HERE_NOW_MIN = 0;         // still display as min 1 km (privacy)
const NOW_WINDOW_MIN = 35;           // "Also here now"
const NOTICED_WINDOW_MIN = 20;       // "Noticed you"
const CLOSE_BY_WINDOW_MIN = 4 * 60;  // "Close by earlier" = last 4h
const CROSSED_PATHS_WINDOW_MIN = 24 * 60; // last 24h

const GEO_CELL_SIZE = 0.0045; // approx ~500m in degrees (rough; good for MVP)
const MIN_MESSAGE_CHARS = 20; // "Minimum protects intention."

/* =========================
   3) State
   ========================= */
let uid = null;
let myPos = null;       // {lat,lng}
let myTheme = "city";
let myProfile = {
  name: "You",
  age: null,
  status: "Just here",
  theme: "city"
};

let nearbyUsers = [];   // [{uid,name,age,status,lat,lng,updatedAtMs,theme}]
let activeMoment = null; // {type, people:[user], eventId, subtitle}
let activeWaveEventId = null; // when mutual recognition exists

/* =========================
   4) Helpers
   ========================= */
function clamp(n, a, b){ return Math.max(a, Math.min(b, n)); }

function haversineKm(a, b){
  const R = 6371;
  const dLat = (b.lat - a.lat) * Math.PI/180;
  const dLng = (b.lng - a.lng) * Math.PI/180;
  const lat1 = a.lat * Math.PI/180;
  const lat2 = b.lat * Math.PI/180;
  const x =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1) * Math.cos(lat2) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1-x));
  return R * c;
}

function displayDistance(km){
  // privacy: never show < 1km
  if (km < DISPLAY_MIN_KM) return "within 1 km away";
  if (km < 1.5) return "~1.2 km away";
  if (km < 2.5) return "~2.1 km away";
  if (km < 3.5) return "~3.4 km away";
  if (km < 5.0) return "~4.9 km away";
  return `~${km.toFixed(1)} km away`;
}

function timeAgoLabel(updatedAtMs){
  const mins = Math.max(0, Math.round((Date.now() - updatedAtMs)/60000));
  if (mins <= 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins/60);
  if (hrs === 1) return "1 hour ago";
  return `${hrs} hours ago`;
}

function geoCell(lat, lng){
  // coarse bucket (privacy-friendly)
  const latC = Math.floor(lat / GEO_CELL_SIZE);
  const lngC = Math.floor(lng / GEO_CELL_SIZE);
  return `${latC}:${lngC}`;
}

function dayBucket(tsMs){
  const d = new Date(tsMs);
  return `${d.getUTCFullYear()}-${d.getUTCMonth()+1}-${d.getUTCDate()}`;
}

function eventIdForPair(aUid, bUid, cell, bucket){
  // stable ID per pair+cell+time bucket (prevents spam)
  const [x,y] = [aUid,bUid].sort();
  return `${bucket}_${cell}_${x}_${y}`;
}

function setTheme(theme){
  myTheme = theme;
  myProfile.theme = theme;

  appEl.classList.remove("theme-city","theme-beach","theme-forest","theme-space");
  appEl.classList.add(`theme-${theme}`);

  vibeBtns.forEach(btn=>{
    const is = btn.dataset.theme === theme;
    btn.classList.toggle("active", is);
    btn.setAttribute("aria-selected", is ? "true" : "false");
  });

  dots.forEach(dot=>{
    dot.classList.toggle("active", dot.dataset.dot === theme);
  });
}

function setStatus(text){
  statusPill.textContent = text;
}

function showModal(show){
  modalBackdrop.hidden = !show;
  messageModal.hidden = !show;
  if (show){
    messageInput.focus();
  } else {
    messageInput.value = "";
    charCount.textContent = "0 / 250";
    modalFinePrint.textContent = "This only sends if recognition is mutual.";
  }
}

function escapeHtml(s){
  return (s||"").replace(/[&<>"']/g, m => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[m]));
}

/* =========================
   5) UI render
   ========================= */
function renderPeople(){
  if (!myPos){
    peopleListEl.innerHTML = `<div class="cardHint">Allow location to see people near you.</div>`;
    return;
  }

  // show at most 12 for clean UI
  const list = nearbyUsers.slice(0, 12);

  nearCountEl.textContent = `${nearbyUsers.length} people near you`;

  if (list.length === 0){
    peopleListEl.innerHTML = `<div class="cardHint">No one near yet. Invite a tester and try again.</div>`;
    return;
  }

  peopleListEl.innerHTML = list.map(u=>{
    const km = haversineKm(myPos, {lat:u.lat, lng:u.lng});
    return `
      <div class="personRow" data-uid="${u.uid}">
        <div class="avatar" aria-hidden="true"></div>
        <div class="personMain">
          <div class="personName">${escapeHtml(u.name)}, ${escapeHtml(String(u.age || ""))}</div>
          <div class="personStatus">${escapeHtml(u.status || "Here now")}</div>
          <div class="personDistance">${escapeHtml(displayDistance(km))}</div>
        </div>
      </div>
    `;
  }).join("");
}

function renderMoment(moment){
  if (!moment){
    momentsCard.hidden = true;
    activeMoment = null;
    return;
  }

  momentsCard.hidden = false;
  momentTitleEl.textContent = moment.title;
  momentSubtitleEl.textContent = moment.subtitle;

  momentPeopleEl.innerHTML = moment.people.map(u=>{
    const km = haversineKm(myPos, {lat:u.lat, lng:u.lng});
    return `
      <div class="momentCard">
        <div class="momentName">${escapeHtml(u.name)}, ${escapeHtml(String(u.age || ""))}</div>
        <div class="momentMeta">${escapeHtml(u.status || "Here")}</div>
        <div class="momentDistance">${escapeHtml(displayDistance(km))}</div>
      </div>
    `;
  }).join("");

  // if multiple people (also here now), keep buttons but use first person as target for opt-in
  btnYesDiscreet.disabled = false;
  btnNoThanks.disabled = false;
}

/* =========================
   6) Near Moments detection (client MVP)
   ========================= */
function computeMoments(){
  if (!myPos) return null;

  // candidates within radius
  const candidates = nearbyUsers
    .map(u=>{
      const km = haversineKm(myPos, {lat:u.lat, lng:u.lng});
      const minsAgo = (Date.now() - u.updatedAtMs) / 60000;
      const cell = geoCell(u.lat, u.lng);
      return {...u, km, minsAgo, cell};
    })
    .filter(u => u.km <= PEOPLE_RADIUS_KM)
    .sort((a,b)=> a.km - b.km);

  if (candidates.length === 0) return null;

  // priority:
  // 1) Noticed you (very recent + close)
  const noticed = candidates.find(u => u.minsAgo <= NOTICED_WINDOW_MIN && u.km <= 2.0);
  if (noticed){
    const bucket = dayBucket(Date.now());
    const eid = eventIdForPair(uid, noticed.uid, noticed.cell, bucket);
    return {
      type: "noticed",
      title: "Noticed you",
      subtitle: `${timeAgoLabel(noticed.updatedAtMs)} • Nearby`,
      people: [noticed],
      eventId: eid
    };
  }

  // 2) Also here now (several recent)
  const alsoNow = candidates.filter(u => u.minsAgo <= NOW_WINDOW_MIN).slice(0, 4);
  if (alsoNow.length >= 2){
    const bucket = dayBucket(Date.now());
    const eid = eventIdForPair(uid, alsoNow[0].uid, alsoNow[0].cell, bucket);
    return {
      type: "also_now",
      title: "Also here now",
      subtitle: `Each within a mile. Seen where you are now.`,
      people: alsoNow,
      eventId: eid
    };
  }

  // 3) Close by earlier (today)
  const closeEarlier = candidates.find(u => u.minsAgo <= CLOSE_BY_WINDOW_MIN);
  if (closeEarlier){
    const bucket = dayBucket(Date.now());
    const eid = eventIdForPair(uid, closeEarlier.uid, closeEarlier.cell, bucket);
    return {
      type: "close_earlier",
      title: "Close by earlier",
      subtitle: `${timeAgoLabel(closeEarlier.updatedAtMs)} • Same area`,
      people: [closeEarlier],
      eventId: eid
    };
  }

  // 4) Crossed paths (last 24h, same cell bucket)
  const crossed = candidates.find(u => u.minsAgo <= CROSSED_PATHS_WINDOW_MIN);
  if (crossed){
    const bucket = dayBucket(Date.now());
    const eid = eventIdForPair(uid, crossed.uid, crossed.cell, bucket);
    return {
      type: "crossed_paths",
      title: "You crossed paths",
      subtitle: `Earlier today • Same place, same time`,
      people: [crossed],
      eventId: eid
    };
  }

  return null;
}

/* =========================
   7) Firestore: presence + waves (mutual recognition)
   ========================= */
async function upsertMyPresence(){
  if (!uid || !myPos) return;

  const ref = doc(db, "users", uid);
  await setDoc(ref, {
    uid,
    name: myProfile.name || "You",
    age: myProfile.age || 35,
    status: myProfile.status || "Here now",
    theme: myTheme,
    lat: myPos.lat,
    lng: myPos.lng,
    cell: geoCell(myPos.lat, myPos.lng),
    updatedAt: serverTimestamp()
  }, { merge: true });
}

async function fetchNearbyUsers(){
  if (!uid || !myPos) return;

  // MVP strategy: pull the most recently updated users and filter client-side.
  // Works perfectly for a small Adelaide tester pool.
  const qUsers = query(
    collection(db, "users"),
    orderBy("updatedAt", "desc"),
    limit(60)
  );

  const snap = await getDocs(qUsers);

  const out = [];
  snap.forEach(d=>{
    const u = d.data();
    if (!u || u.uid === uid) return;
    if (typeof u.lat !== "number" || typeof u.lng !== "number") return;

    // updatedAt may be Firestore Timestamp
    let updatedAtMs = Date.now();
    if (u.updatedAt && typeof u.updatedAt.toMillis === "function"){
      updatedAtMs = u.updatedAt.toMillis();
    }

    const km = haversineKm(myPos, {lat:u.lat, lng:u.lng});
    if (km > PEOPLE_RADIUS_KM) return;

    out.push({
      uid: u.uid,
      name: u.name || "Someone",
      age: u.age || "",
      status: u.status || "Here now",
      theme: u.theme || "city",
      lat: u.lat,
      lng: u.lng,
      updatedAtMs
    });
  });

  nearbyUsers = out;
  renderPeople();

  const moment = computeMoments();
  activeMoment = moment;
  renderMoment(moment);

  // Update status
  setStatus("Up to date");
}

async function waveRespond(eventId, otherUid, answerYes){
  // waves/{eventId}
  const ref = doc(db, "waves", eventId);
  const existing = await getDoc(ref);

  const payloadBase = {
    eventId,
    a: uid,
    b: otherUid,
    updatedAt: serverTimestamp(),
    createdAt: existing.exists() ? undefined : serverTimestamp()
  };

  // store discreet choices
  const field = (uid < otherUid) ? "aYes" : "bYes";
  const update = {
    ...payloadBase,
    [field]: !!answerYes
  };

  await setDoc(ref, update, { merge: true });

  return ref;
}

function listenForMutual(eventId, otherUid){
  // live listen to wave doc to know when mutual is true
  const ref = doc(db, "waves", eventId);
  return onSnapshot(ref, (snap)=>{
    if (!snap.exists()) return;
    const d = snap.data();
    const aYes = !!d.aYes;
    const bYes = !!d.bYes;
    const mutual = aYes && bYes;

    if (mutual){
      activeWaveEventId = eventId;
      modalFinePrint.textContent = "Recognition is mutual. One message only.";
      // allow send
      sendBtn.disabled = false;
    }
  });
}

async function sendOneMessage(eventId, text){
  const ref = doc(db, "waves", eventId);

  // enforce: each user can send only once
  const snap = await getDoc(ref);
  if (!snap.exists()){
    throw new Error("Wave not found.");
  }
  const d = snap.data();

  const myField = (uid < d.b) ? "aMsg" : "bMsg";
  if (d[myField]){
    throw new Error("You already sent your one message.");
  }

  const patch = {};
  patch[myField] = {
    text,
    sentAt: serverTimestamp()
  };

  await setDoc(ref, patch, { merge: true });
}

/* =========================
   8) Geolocation
   ========================= */
function startLocation(){
  if (!("geolocation" in navigator)){
    setStatus("Location unavailable");
    return;
  }

  setStatus("Finding…");

  navigator.geolocation.watchPosition(async (pos)=>{
    myPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
    setStatus("Updating…");

    // Update presence, then refresh nearby
    await upsertMyPresence();
    await fetchNearbyUsers();

  }, (err)=>{
    console.error(err);
    setStatus("Location blocked");
    peopleListEl.innerHTML = `<div class="cardHint">Please allow location to use Near.</div>`;
  }, {
    enableHighAccuracy: true,
    maximumAge: 5000,
    timeout: 15000
  });
}

/* =========================
   9) Events
   ========================= */
vibeBtns.forEach(btn=>{
  btn.addEventListener("click", async ()=>{
    setTheme(btn.dataset.theme);
    await upsertMyPresence();
  });
});

dismissMomentBtn.addEventListener("click", ()=>{
  renderMoment(null);
});

btnNoThanks.addEventListener("click", async ()=>{
  // simply hide moment for now (MVP)
  renderMoment(null);
});

btnYesDiscreet.addEventListener("click", async ()=>{
  if (!activeMoment || !activeMoment.people?.length) return;

  const target = activeMoment.people[0];
  const eventId = activeMoment.eventId;

  setStatus("Sent discreet wave…");

  // record our yes
  const ref = await waveRespond(eventId, target.uid, true);

  // open modal immediately BUT sending only works after mutual
  activeWaveEventId = null;
  showModal(true);
  sendBtn.disabled = true;
  modalFinePrint.textContent = "Waiting for mutual recognition…";

  // listen for mutual
  const unsub = listenForMutual(eventId, target.uid);

  // stop listening after 3 minutes (MVP)
  setTimeout(()=>{ try{unsub();}catch{} }, 180000);

  setStatus("Up to date");
});

waveBtn.addEventListener("click", ()=>{
  // Wave button opens message modal if mutual exists OR if you want to write then wait
  showModal(true);
  sendBtn.disabled = !activeWaveEventId; // only allow if mutual already
  modalFinePrint.textContent = activeWaveEventId
    ? "Recognition is mutual. One message only."
    : "This only sends if recognition is mutual.";
});

modalBackdrop.addEventListener("click", ()=>{
  showModal(false);
});

maybeLaterBtn.addEventListener("click", ()=>{
  showModal(false);
});

messageInput.addEventListener("input", ()=>{
  charCount.textContent = `${messageInput.value.length} / 250`;
});

sendBtn.addEventListener("click", async ()=>{
  const text = (messageInput.value || "").trim();

  if (text.length < MIN_MESSAGE_CHARS){
    modalFinePrint.textContent = `Minimum ${MIN_MESSAGE_CHARS} characters protects intention.`;
    return;
  }

  if (!activeWaveEventId){
    modalFinePrint.textContent = "Not mutual yet — waiting.";
    return;
  }

  try{
    sendBtn.disabled = true;
    await sendOneMessage(activeWaveEventId, text);
    modalFinePrint.textContent = "Sent. One message. Real.";
    setTimeout(()=> showModal(false), 900);
  }catch(e){
    console.error(e);
    modalFinePrint.textContent = e.message || "Couldn’t send.";
    sendBtn.disabled = false;
  }
});

/* =========================
   10) Boot
   ========================= */
setTheme("city");
setStatus("Signing in…");

signInAnonymously(auth).catch(console.error);

onAuthStateChanged(auth, async (user)=>{
  if (!user) return;
  uid = user.uid;

  // Create a default profile for MVP (later you'll have onboarding)
  const meRef = doc(db, "users", uid);
  const meSnap = await getDoc(meRef);

  if (!meSnap.exists()){
    await setDoc(meRef, {
      uid,
      name: "You",
      age: 35,
      status: "Here now",
      theme: myTheme,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge:true });
  } else {
    const d = meSnap.data();
    myProfile.name = d.name || "You";
    myProfile.age = d.age || 35;
    myProfile.status = d.status || "Here now";
    myTheme = d.theme || "city";
    setTheme(myTheme);
  }

  setStatus("Ready");
  startLocation();

  // quick refresh loop (keeps moments alive even if watchPosition is quiet)
  setInterval(async ()=>{
    if (!uid || !myPos) return;
    await upsertMyPresence();
    await fetchNearbyUsers();
  }, 20000);
});
