/* =========================
   CONFIG
========================= */
const PRESENCE_TTL_MINUTES = 30;      // auto-expiry
const MAX_DISTANCE_KM = 5;            // Near radius
const TEXT_GATE_MIN = 250;            // characters before chat unlock

/* =========================
   DOM
========================= */
const list = document.getElementById("list");
const count = document.getElementById("count");
const sheet = document.getElementById("profileSheet");

/* =========================
   STATE
========================= */
let myUid = null;
let myLat = null;
let myLng = null;
let profile = JSON.parse(localStorage.getItem("nearProfile") || "{}");

/* =========================
   UTILITIES
========================= */
function toRad(v) {
  return (v * Math.PI) / 180;
}

function distanceKm(aLat, aLng, bLat, bLng) {
  const R = 6371;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) *
      Math.cos(toRad(bLat)) *
      Math.sin(dLng / 2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function expired(ts) {
  return Date.now() - ts > PRESENCE_TTL_MINUTES * 60000;
}

/* =========================
   RENDER SELF
========================= */
function renderMe() {
  const c = document.createElement("div");
  c.className = "card me";
  c.innerHTML = `
    <div class="avatar"></div>
    <div class="info">
      <div class="name">${profile.name || "You"} ${profile.age || ""}</div>
      <div class="now">${profile.now || "Tap to add presence"}</div>
      <div class="distance">Visible for ${PRESENCE_TTL_MINUTES} min</div>
    </div>
  `;
  c.oncontextmenu = e => {
    e.preventDefault();
    openProfile();
  };
  list.appendChild(c);
}

/* =========================
   PROFILE
========================= */
function openProfile() {
  sheet.classList.add("open");
  pName.value = profile.name || "";
  pAge.value = profile.age || "";
  pNow.value = profile.now || "";
}

window.saveProfile = () => {
  profile = {
    name: pName.value.trim(),
    age: pAge.value.trim(),
    now: pNow.value.trim()
  };
  localStorage.setItem("nearProfile", JSON.stringify(profile));
  sheet.classList.remove("open");
  if (myUid) updateFirestore();
  refresh();
};

/* =========================
   FIREBASE
========================= */
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  onSnapshot,
  collection
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "YOUR_KEY",
  authDomain: "YOUR_DOMAIN",
  projectId: "YOUR_ID",
  appId: "YOUR_APP"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

signInAnonymously(auth).then(cred => {
  myUid = cred.user.uid;
  navigator.geolocation.watchPosition(pos => {
    myLat = pos.coords.latitude;
    myLng = pos.coords.longitude;
    updateFirestore();
  });
  listen();
});

/* =========================
   FIRESTORE UPDATE
========================= */
function updateFirestore() {
  if (!myLat || !myLng) return;
  setDoc(
    doc(db, "users", myUid),
    {
      ...profile,
      lat: myLat,
      lng: myLng,
      updatedAt: Date.now()
    },
    { merge: true }
  );
}

/* =========================
   LISTEN
========================= */
function listen() {
  onSnapshot(collection(db, "users"), snap => refresh(snap));
}

/* =========================
   RENDER LIST
========================= */
function refresh(snap) {
  list.innerHTML = "";
  renderMe();

  let visible = 0;
  if (!snap || !myLat) return;

  snap.forEach(d => {
    if (d.id === myUid) return;

    const u = d.data();
    if (!u.lat || expired(u.updatedAt)) return;

    const km = distanceKm(myLat, myLng, u.lat, u.lng);
    if (km > MAX_DISTANCE_KM) return;

    visible++;

    const c = document.createElement("div");
    c.className = "card";
    c.innerHTML = `
      <div class="avatar"></div>
      <div class="info">
        <div class="name">${u.name || "Someone"} ${u.age || ""}</div>
        <div class="now">${u.now || ""}</div>
        <div class="distance">${km.toFixed(2)} km away</div>
        <button class="wave">👋 Wave</button>
      </div>
    `;

    c.querySelector(".wave").onclick = () => openWave(u);
    list.appendChild(c);
  });

  count.textContent = visible
    ? `${visible} people near you`
    : "No one near you right now";
}

/* =========================
   WAVE + TEXT GATE
========================= */
function openWave(user) {
  const msg = prompt(
    `Send a wave to ${user.name || "them"}.\n\nWrite at least ${TEXT_GATE_MIN} characters.\nThis unlocks chat.`
  );

  if (!msg) return;

  if (msg.length < TEXT_GATE_MIN) {
    alert(`Please write at least ${TEXT_GATE_MIN} characters.`);
    return;
  }

  alert("Wave sent ✨\nChat unlocked if they respond.");
}
