import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  collection,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

/* 🔥 Firebase config — USE YOUR REAL ONE */
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "XXXX",
  appId: "XXXX"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const statusEl = document.getElementById("status");
const listEl = document.getElementById("list");

let myUid = null;
let myLocation = null;

/* 📐 Distance helper */
function distanceKm(a, b) {
  const R = 6371;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLon = (b.lng - a.lng) * Math.PI / 180;
  const lat1 = a.lat * Math.PI / 180;
  const lat2 = b.lat * Math.PI / 180;

  const x =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) *
    Math.cos(lat1) * Math.cos(lat2);

  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

/* 🔐 Auth */
signInAnonymously(auth).then(res => {
  myUid = res.user.uid;
  startLocation();
});

/* 📍 Location */
function startLocation() {
  if (!navigator.geolocation) {
    statusEl.textContent = "Geolocation not supported";
    return;
  }

  navigator.geolocation.watchPosition(
    pos => {
      myLocation = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        updated: Date.now()
      };

      setDoc(doc(db, "users", myUid), myLocation);
      statusEl.textContent = "Location enabled";
    },
    err => {
      statusEl.textContent = "Location blocked";
    },
    { enableHighAccuracy: true }
  );
}

/* 👥 Nearby users */
onSnapshot(collection(db, "users"), snap => {
  listEl.innerHTML = "";

  if (!myLocation) return;

  snap.forEach(docSnap => {
    if (docSnap.id === myUid) return; // ✅ FIX: hide yourself

    const other = docSnap.data();
    if (!other.lat || !other.lng) return;

    const km = distanceKm(myLocation, other);

    if (km > 5) return; // 5km radius

    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <strong>Someone nearby</strong>
      <div class="distance">${km.toFixed(2)} km away</div>
    `;
    listEl.appendChild(card);
  });
});
