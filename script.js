<script type="module">
/* =========================
   Firebase setup
========================= */
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

/* 🔥 YOUR CONFIG */
const firebaseConfig = {
  apiKey: "YOUR_KEY",
  authDomain: "YOUR_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_BUCKET",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

/* =========================
   Helpers
========================= */
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

/* =========================
   UI hook
========================= */
const list = document.getElementById("peopleList");

/* =========================
   Auth + Location
========================= */
signInAnonymously(auth);

onAuthStateChanged(auth, user => {
  if (!user) return;

  navigator.geolocation.watchPosition(async pos => {
    const { latitude, longitude } = pos.coords;

    await setDoc(
      doc(db, "users", user.uid),
      {
        lat: latitude,
        lng: longitude,
        updated: serverTimestamp()
      },
      { merge: true }
    );

    loadNearby(user.uid, latitude, longitude);
  });
});

/* =========================
   Load nearby users
========================= */
async function loadNearby(myId, lat, lng) {
  const snap = await getDocs(collection(db, "users"));
  list.innerHTML = "";

  let count = 0;

  snap.forEach(docSnap => {
    if (docSnap.id === myId) return;

    const u = docSnap.data();
    if (!u.lat || !u.lng) return;

    const km = distanceKm(lat, lng, u.lat, u.lng);
    if (km > 5) return;

    count++;

    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <div class="avatar"></div>
      <div>
        <strong>Someone</strong>
        <div>${Math.round(km * 1000)}m away</div>
      </div>
    `;

    list.appendChild(card);
  });

  document.getElementById("count").innerText =
    `${count} people near you right now`;
}
</script>
