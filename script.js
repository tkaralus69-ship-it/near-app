import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signInAnonymously,
  signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

/* 🔐 FIREBASE CONFIG — KEEP YOURS */
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

/* UI */
const statusEl = document.getElementById("status");
const userEl = document.getElementById("user");
const locationEl = document.getElementById("location");
const nearbyEl = document.getElementById("nearby");
const logoutBtn = document.getElementById("logout");

/* Helpers */
function setStatus(text, type = "warn") {
  statusEl.textContent = text;
  statusEl.className = type;
}

function clearNearby(message) {
  nearbyEl.innerHTML = `<li>${message}</li>`;
}

/* AUTH */
onAuthStateChanged(auth, user => {
  if (!user) {
    setStatus("Signing in…", "warn");
    signInAnonymously(auth);
    return;
  }

  userEl.textContent = `User: ${user.uid}`;
  setStatus("Signed in", "ok");
  getLocation();
});

/* LOCATION */
function getLocation() {
  setStatus("Requesting location…", "warn");
  locationEl.textContent = "Location: requesting…";
  clearNearby("Waiting for location…");

  if (!navigator.geolocation) {
    setStatus("Geolocation not supported", "error");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    pos => {
      const lat = pos.coords.latitude.toFixed(5);
      const lon = pos.coords.longitude.toFixed(5);

      locationEl.textContent = `Location: ${lat}, ${lon}`;
      setStatus("Location acquired ✅", "ok");

      // MVP logic — alone is expected
      clearNearby("No nearby users yet. You are the only one online.");
    },
    err => {
      setStatus("Location blocked or unavailable", "error");
      locationEl.textContent = "Location: failed";
      clearNearby("Enable location permissions and refresh.");
    },
    {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0
    }
  );
}

/* LOGOUT */
logoutBtn.onclick = () => {
  signOut(auth);
  location.reload();
};
