/* =========================
   CONFIG
========================= */
const MAX_DISTANCE_KM = 5;
const EXPIRY_LIMIT = 15 * 60 * 1000; // 15 minutes

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
let myLocation = null;
let profile = JSON.parse(localStorage.getItem("nearProfile") || "{}");

/* =========================
   HELPERS
========================= */
function distanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function distanceLabel(km) {
  if (km < 0.05) return "Very near";
  if (km < 0.3) return "Nearby";
  if (km < 1) return "Close";
  return `${km.toFixed(1)} km away`;
}

function isExpired(updatedAt) {
  return Date.now() - updatedAt > EXPIRY_LIMIT;
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

/* =========================
   AUTH + GEO
========================= */
signInAnonymously(auth).then(cred => {
  myUid = cred.user.uid;

  navigator.geolocation.watchPosition(pos => {
    myLocation = {
      lat: pos.coords.latitude,
      lng: pos.coords.longitude
    };
    updateFirestore(myLocation.lat, myLocation.lng);
  });

  listen();
});

/* =========================
   FIRESTORE UPDATE
========================= */
function updateFirestore(lat, lng) {
  setDoc(
    doc(db, "users", myUid),
    {
      ...profile,
      lat,
      lng,
      updatedAt: Date.now()
    },
    { merge: true }
  );
}

/* =========================
   LISTEN
========================= */
function listen() {
  onSnapshot(collection(db, "users"), snap => {
    refresh(snap);
  });
}

/* =========================
   RENDER LIST
========================= */
function refresh(snap) {
  list.innerHTML = "";
  renderMe();

  let visible = 0;
  if (!snap || !myLocation) return;

  snap.forEach(d => {
    if (d.id === myUid) return;

    const u = d.data();
    if (!u.lat || !u.updatedAt) return;
    if (isExpired(u.updatedAt)) return;

    const km = distanceKm(
      myLocation.lat,
      myLocation.lng,
      u.lat,
      u.lng
    );

    if (km > MAX_DISTANCE_KM) return;

    visible++;

    const c = document.createElement("div");
    c.className = "card";
    c.innerHTML = `
      <div class="avatar"></div>
      <div class="info">
        <div class="name">${u.name || "Someone"} ${u.age || ""}</div>
        <div class="distance">${distanceLabel(km)}</div>
        <div class="now">${u.now || ""}</div>
      </div>
    `;

    list.appendChild(c);
  });

  count.textContent = visible
    ? `${visible} people near you`
    : "No one near you right now";
}
