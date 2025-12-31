// ===============================
// 🔧 DEV SETTINGS
// ===============================
const DEV_MODE = true;

// ===============================
// 🔥 Firebase imports
// ===============================
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDocs,
  collection
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";
import {
  getAuth,
  signInAnonymously
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";

// ===============================
// 🔥 Firebase config
// ===============================
const firebaseConfig = {
  apiKey: "AIzaSyA2ApGkST41s9U53GQIatv4FL8aCPVzeAM",
  authDomain: "near-c7681.firebaseapp.com",
  projectId: "near-c7681",
  storageBucket: "near-c7681.firebasestorage.app",
  messagingSenderId: "316318833624",
  appId: "1:316318833624:web:480beb2c1909e23d1cf0ad"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// ===============================
// 📏 Distance helper
// ===============================
function distanceKm(a, b) {
  const R = 6371;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLon = (b.lng - a.lng) * Math.PI / 180;
  const lat1 = a.lat * Math.PI / 180;
  const lat2 = b.lat * Math.PI / 180;

  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);

  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

// ===============================
// 🧠 UI
// ===============================
const statusEl = document.getElementById("status");
const usersEl = document.getElementById("users");

// ===============================
// 🚀 App start
// ===============================
signInAnonymously(auth).then(async ({ user }) => {
  navigator.geolocation.getCurrentPosition(async pos => {
    const me = {
      uid: user.uid,
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
      lastSeen: Date.now()
    };

    // Write self
    await setDoc(doc(db, "users", user.uid), me);

    // Write DEV user (always)
    if (DEV_MODE) {
      await setDoc(doc(db, "users", "__DEV__"), {
        uid: "__DEV__",
        name: "Test User",
        lat: me.lat + 0.00025,
        lng: me.lng + 0.00025,
        lastSeen: Date.now()
      });
    }

    statusEl.textContent = "Location enabled";

    // ⏱️ Small delay to guarantee Firestore consistency
    setTimeout(() => renderNearby(me), 500);
  }, err => {
    statusEl.textContent = "Location blocked";
    console.error(err);
  });
});

// ===============================
// 👀 Render users
// ===============================
async function renderNearby(me) {
  usersEl.innerHTML = "";

  const snap = await getDocs(collection(db, "users"));
  let found = false;

  snap.forEach(d => {
    const u = d.data();
    if (u.uid === me.uid) return;

    const km = distanceKm(me, u);
    if (km > 5) return;

    found = true;

    const div = document.createElement("div");
    div.className = "user";
    div.innerHTML = `
      <strong>${u.name || "Someone nearby"}</strong>
      <div class="distance">${km.toFixed(2)} km away</div>
    `;
    usersEl.appendChild(div);
  });

  if (!found) {
    usersEl.innerHTML = `
      <div class="user">
        <strong>No users yet</strong>
        <div class="distance">Waiting for someone nearby…</div>
      </div>
    `;
  }
}
