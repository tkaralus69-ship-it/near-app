/* =========================
   CONFIG
========================= */
const TEXT_GATE = 250;          // characters each
const EXPIRE_MINUTES = 20;      // presence expiry
const EARTH_RADIUS_KM = 6371;

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
let myCoords = null;
let profile = JSON.parse(localStorage.getItem("nearProfile") || "{}");

/* =========================
   UTILS
========================= */
function distanceKm(lat1, lon1, lat2, lon2) {
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat/2)**2 +
    Math.cos(lat1*Math.PI/180) *
    Math.cos(lat2*Math.PI/180) *
    Math.sin(dLon/2)**2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function expired(ts) {
  return Date.now() - ts > EXPIRE_MINUTES * 60 * 1000;
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
  c.onclick = openProfile;
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
  if (myUid) updateUser();
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
    myCoords = pos.coords;
    updateUser();
  });

  listen();
});

function updateUser() {
  if (!myCoords) return;
  setDoc(
    doc(db, "users", myUid),
    {
      ...profile,
      lat: myCoords.latitude,
      lng: myCoords.longitude,
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
   RENDER LIST
========================= */
function render(snap) {
  list.innerHTML = "";
  renderMe();

  let visible = 0;

  snap.forEach(d => {
    if (d.id === myUid) return;
    const u = d.data();
    if (!u.lat || expired(u.updatedAt)) return;

    const km = distanceKm(
      myCoords.latitude,
      myCoords.longitude,
      u.lat,
      u.lng
    );

    visible++;

    const c = document.createElement("div");
    c.className = "card";
    c.innerHTML = `
      <div class="avatar"></div>
      <div class="info">
        <div class="name">${u.name || "Someone"} ${u.age || ""}</div>
        <div class="distance">${km.toFixed(1)} km away</div>
        <div class="now">${u.now || ""}</div>
        <button class="wave">👋 Wave</button>
      </div>
    `;

    c.querySelector(".wave").onclick = () => openConversation(d.id);
    list.appendChild(c);
  });

  count.textContent = visible
    ? `${visible} people near you`
    : "No one near you right now";
}

/* =========================
   CONVERSATION (TEXT GATE)
========================= */
function openConversation(otherUid) {
  const convoId = [myUid, otherUid].sort().join("_");

  setDoc(
    doc(db, "conversations", convoId),
    {
      a: myUid,
      b: otherUid,
      aCount: 0,
      bCount: 0,
      unlocked: false,
      updatedAt: Date.now()
    },
    { merge: true }
  );

  alert("Say hello 👋\nConnection unlocks naturally.");
}

/* =========================
   MESSAGE UPDATE (CALLED ON SEND)
========================= */
function updateTextGate(convo, sender, textLength) {
  if (sender === convo.a) convo.aCount += textLength;
  if (sender === convo.b) convo.bCount += textLength;

  if (
    convo.aCount >= TEXT_GATE &&
    convo.bCount >= TEXT_GATE
  ) {
    convo.unlocked = true;
  }
}
