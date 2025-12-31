// Firebase imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, setDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// 🔐 Firebase config (YOURS)
const firebaseConfig = {
  apiKey: "AIzaSyA2ApGkST41s9U53GQIatv4FL8aCPVzeAM",
  authDomain: "near-c7681.firebaseapp.com",
  projectId: "near-c7681",
  storageBucket: "near-c7681.firebasestorage.app",
  messagingSenderId: "316318833624",
  appId: "1:316318833624:web:480beb2c1909e23d1cf0ad"
};

// Init
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// UI
const emailEl = document.getElementById("userEmail");
const statusEl = document.getElementById("status");
const listEl = document.getElementById("nearbyUsers");
const logoutBtn = document.getElementById("logoutBtn");

// 🔢 Distance calc (km)
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

// 🔐 Auth state
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  emailEl.textContent = user.email;

  // 📍 Get location
  navigator.geolocation.getCurrentPosition(async (pos) => {
    const lat = pos.coords.latitude;
    const lng = pos.coords.longitude;

    statusEl.textContent = "Location received ✔";

    // Save user location
    await setDoc(doc(db, "users", user.uid), {
      email: user.email,
      lat,
      lng,
      updated: Date.now()
    });

    loadNearbyUsers(lat, lng, user.uid);
  }, () => {
    statusEl.textContent = "Location denied";
  });
});

// 👥 Load nearby users
async function loadNearbyUsers(myLat, myLng, myUid) {
  listEl.innerHTML = "";

  const snap = await getDocs(collection(db, "users"));
  let found = false;

  snap.forEach(docSnap => {
    if (docSnap.id === myUid) return;

    const u = docSnap.data();
    if (!u.lat || !u.lng) return;

    const d = distanceKm(myLat, myLng, u.lat, u.lng);

    if (d <= 5) {
      found = true;
      const li = document.createElement("li");
      li.textContent = `${u.email} — ${d.toFixed(2)} km away`;
      listEl.appendChild(li);
    }
  });

  if (!found) {
    listEl.innerHTML = "<li>No nearby users yet</li>";
  }
}

// 🚪 Logout
logoutBtn.onclick = () => signOut(auth);
