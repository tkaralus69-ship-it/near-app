/* =========================
   STATE
========================= */
const list = document.getElementById("list");
const count = document.getElementById("count");
const sheet = document.getElementById("profileSheet");

let myUid = null;
let myLocation = null;

let profile = JSON.parse(localStorage.getItem("nearProfile") || "{}");

/* =========================
   DISTANCE HELPERS
========================= */
function toRad(v) {
  return (v * Math.PI) / 180;
}

function distanceKm(a, b) {
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lng - a.lng);

  const x =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(a.lat)) *
      Math.cos(toRad(b.lat)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

function distanceLabel(km) {
  if (km < 0.5) return "Very near";
  if (km < 2) return "Nearby";
  return "A little further";
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
   PROFILE SHEET
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
   RENDER LIST (WITH DISTANCE)
========================= */
function refresh(snap) {
  list.innerHTML = "";
  renderMe();

  let visible = 0;

  if (!snap || !myLocation) return;

  snap.forEach(d => {
    if (d.id === myUid) return;

    const u = d.data();
    if (!u.lat) return;

    const km = distanceKm(myLocation, u);
    const label = distanceLabel(km);

    visible++;

    const c = document.createElement("div");
    c.className = "card";
    c.innerHTML = `
      <div class="avatar"></div>
      <div class="info">
        <div class="name">${u.name || "Someone"} ${u.age || ""}</div>
        <div class="distance">${label}</div>
        <div class="now">${u.now || ""}</div>
      </div>
    `;

    list.appendChild(c);
  });

  count.textContent = visible
    ? `${visible} people near you`
    : "No one near you right now";
}
