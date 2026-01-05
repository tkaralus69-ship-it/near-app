/* =========================
   STATE
========================= */
const list = document.getElementById("list");
const count = document.getElementById("count");
const sheet = document.getElementById("profileSheet");

let myUid = null;
let profile = JSON.parse(localStorage.getItem("nearProfile") || "{}");

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
    updateFirestore(pos.coords.latitude, pos.coords.longitude);
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
   LISTEN FOR USERS
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

  if (!snap) return;

  snap.forEach(d => {
    if (d.id === myUid) return;

    const u = d.data();
    if (!u.lat) return;

    visible++;

    const c = document.createElement("div");
    c.className = "card";
    c.innerHTML = `
      <div class="avatar"></div>
      <div class="info">
        <div class="name">${u.name || "Someone"} ${u.age || ""}</div>
        <div class="now">${u.now || ""}</div>
      </div>
    `;

    list.appendChild(c);
  });

  count.textContent = visible
    ? `${visible} people near you`
    : "No one near you right now";
}
