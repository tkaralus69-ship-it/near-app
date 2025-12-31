// ===== DEV MODE =====
const DEV_MODE = true; // show yourself when only 1 device

// ===== Firebase imports =====
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  collection,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

// ===== Firebase config =====
const firebaseConfig = {
  apiKey: "AIzaSyA2ApGkST41s9U53GQIatv4FL8aCPVzeAM",
  authDomain: "near-c7681.firebaseapp.com",
  projectId: "near-c7681",
  storageBucket: "near-c7681.firebasestorage.app",
  messagingSenderId: "316318833624",
  appId: "1:316318833624:web:480beb2c1909e23d1cf0ad"
};

// ===== Init =====
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ===== UI =====
const statusEl = document.getElementById("status");
const usersEl = document.getElementById("users");

// ===== State =====
let myLat = null;
let myLng = null;

// ===== Helpers =====
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

// ===== Start =====
statusEl.textContent = "Signing in…";

signInAnonymously(auth).then(({ user }) => {
  const uid = user.uid;

  statusEl.textContent = "Requesting location…";

  navigator.geolocation.watchPosition(
    async pos => {
      myLat = pos.coords.latitude;
      myLng = pos.coords.longitude;

      await setDoc(doc(db, "users", uid), {
        id: uid,
        lat: myLat,
        lng: myLng,
        updated: Date.now()
      });

      statusEl.textContent = "Location enabled";
    },
    err => {
      statusEl.textContent = "Location permission denied";
      console.error(err);
    },
    { enableHighAccuracy: true }
  );

  onSnapshot(collection(db, "users"), snap => {
    usersEl.innerHTML = "";
    let found = false;

    if (myLat === null || myLng === null) return;

    snap.forEach(d => {
      const u = d.data();
      if (!u.lat || !u.lng) return;

      const dist = distanceKm(myLat, myLng, u.lat, u.lng);

      if (DEV_MODE || u.id !== uid) {
        found = true;

        const div = document.createElement("div");
        div.className = "user";
        div.innerHTML = `
          <strong>${u.id === uid ? "You (test mode)" : "Someone nearby"}</strong>
          <div class="distance">${dist.toFixed(2)} km away</div>
        `;
        usersEl.appendChild(div);
      }
    });

    statusEl.textContent = found
      ? "Users nearby"
      : "No users found";
  });
});
