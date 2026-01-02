import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  collection,
  getDocs,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

/* 🔐 Firebase config */
const firebaseConfig = {
  apiKey: "YOUR_KEY",
  authDomain: "YOUR_DOMAIN",
  projectId: "YOUR_PROJECT_ID"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth();
const db = getFirestore();

/* 📍 Distance helper */
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

/* 🔑 Auth */
signInAnonymously(auth);

onAuthStateChanged(auth, user => {
  if (!user) return;

  navigator.geolocation.watchPosition(async pos => {
    const me = {
      lat: pos.coords.latitude,
      lng: pos.coords.longitude
    };

    await setDoc(doc(db, "users", user.uid), {
      ...me,
      updated: serverTimestamp()
    });

    loadNearby(me, user.uid);
  });
});

/* 👀 Load nearby people */
async function loadNearby(me, myId) {
  const snap = await getDocs(collection(db, "users"));
  const list = document.getElementById("peopleList");
  const count = document.getElementById("count");

  list.innerHTML = "";
  let nearby = 0;

  snap.forEach(docu => {
    if (docu.id === myId) return;
    const u = docu.data();
    if (!u.lat) return;

    const d = distanceKm(me, u);
    if (d > 5) return;

    nearby++;

    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <div class="avatar"></div>
      <div class="info">
        <div class="name">Someone near you</div>
        <div class="distance">${d < 1 ? Math.round(d*1000)+'m' : d.toFixed(1)+'km'} away</div>
      </div>
    `;
    list.appendChild(card);
  });

  count.textContent =
    nearby === 0
      ? "No one near you right now"
      : `${nearby} people near you right now`;
                                                   }
