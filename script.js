/* =========================
   NEAR – CORE LOGIC
   Distance · Expiry · Hello
========================= */

/* =========================
   CONFIG
========================= */
const PRESENCE_EXPIRY_MINUTES = 30;
const EARTH_RADIUS_KM = 6371;

/* =========================
   DOM
========================= */
const list = document.getElementById("list");
const count = document.getElementById("count");

/* =========================
   STATE
========================= */
let myUid = null;
let myLat = null;
let myLng = null;

let profile = JSON.parse(localStorage.getItem("nearProfile") || "{}");
let wavedTo = JSON.parse(localStorage.getItem("nearWaves") || "[]");

/* =========================
   UTILS
========================= */
function toRad(v) {
  return (v * Math.PI) / 180;
}

function distanceKm(lat1, lon1, lat2, lon2) {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;

  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(km) {
  if (km < 1) return `${Math.round(km * 1000)} m away`;
  return `${km.toFixed(1)} km away`;
}

function isExpired(updatedAt) {
  const ageMs = Date.now() - updatedAt;
  return ageMs > PRESENCE_EXPIRY_MINUTES * 60 * 1000;
}

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
    myLat = pos.coords.latitude;
    myLng = pos.coords.longitude;

    updatePresence();
  });

  listen();
});

/* =========================
   UPDATE PRESENCE
========================= */
function updatePresence() {
  if (!myUid || myLat === null) return;

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
  onSnapshot(collection(db, "users"), snap => {
    render(snap);
  });
}

/* =========================
   RENDER
========================= */
function render(snap) {
  list.innerHTML = "";
  let visible = 0;

  snap.forEach(docSnap => {
    if (docSnap.id === myUid) return;

    const u = docSnap.data();
    if (!u.lat || !u.updatedAt) return;
    if (isExpired(u.updatedAt)) return;

    const km = distanceKm(myLat, myLng, u.lat, u.lng);
    if (km > 5) return; // 5km radius

    visible++;

    const waved = wavedTo.includes(docSnap.id);

    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <div class="avatar"></div>
      <div class="info">
        <div class="name">${u.name || "Someone"} ${u.age || ""}</div>
        <div class="distance">${formatDistance(km)}</div>
        <div class="now">${u.now || ""}</div>
        ${
          waved
            ? `<div class="sent">Sent · If it’s meant, you’ll hear back</div>`
            : `<button class="wave">Say hello</button>`
        }
      </div>
    `;

    if (!waved) {
      card.querySelector(".wave").onclick = () =>
        sendWave(docSnap.id);
    }

    list.appendChild(card);
  });

  count.textContent = visible
    ? `${visible} people near you`
    : "No one near you right now";
}

/* =========================
   HELLO / WAVE
========================= */
function sendWave(targetUid) {
  if (wavedTo.includes(targetUid)) return;

  wavedTo.push(targetUid);
  localStorage.setItem("nearWaves", JSON.stringify(wavedTo));

  // Optional: store wave in Firestore later
  // setDoc(doc(db, "waves", `${myUid}_${targetUid}`), { at: Date.now() });

  refreshUI();
}

function refreshUI() {
  // soft re-render without reload
  onSnapshot(collection(db, "users"), snap => {
    render(snap);
  });
                             }
