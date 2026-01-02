import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import {
  getAuth,
  signInAnonymously
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

/* 🔐 Firebase config — YOURS */
const firebaseConfig = {
  apiKey: "AIzaSyA2ApGkST41s9U53GQIatv4FL8aCPVzeAM",
  authDomain: "near-c7681.firebaseapp.com",
  projectId: "near-c7681",
  storageBucket: "near-c7681.firebasestorage.app",
  messagingSenderId: "316318833624",
  appId: "1:316318833624:web:480beb2c1909e23d1cf0ad"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const profilesContainer = document.querySelector(".profiles");

/* 📏 Distance helper */
function distanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/* 👤 Render user card */
function renderUser(user) {
  const div = document.createElement("div");
  div.className = "profile";
  div.innerHTML = `
    <div class="avatar"></div>
    <div class="info">
      <div class="name">${user.name}, ${user.age}</div>
      <div class="meta">${user.distance} away</div>
    </div>
  `;
  profilesContainer.appendChild(div);
}

/* 🌍 Main flow */
signInAnonymously(auth).then(({ user }) => {
  navigator.geolocation.getCurrentPosition(async (pos) => {
    const lat = pos.coords.latitude;
    const lng = pos.coords.longitude;

    /* Save self */
    await setDoc(doc(db, "users", user.uid), {
      lat,
      lng,
      lastSeen: Date.now(),
      name: "You",
      age: 30
    });

    profilesContainer.innerHTML = "";

    const snap = await getDocs(collection(db, "users"));
    let nearby = [];

    snap.forEach(docSnap => {
      if (docSnap.id === user.uid) return;

      const u = docSnap.data();
      if (!u.lat || !u.lng) return;

      const km = distanceKm(lat, lng, u.lat, u.lng);
      if (km <= 5) {
        nearby.push({
          name: u.name || "Someone",
          age: u.age || "",
          distance: km < 1
            ? `${Math.round(km * 1000)}m`
            : `${km.toFixed(1)}km`
        });
      }
    });

    nearby
      .sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance))
      .slice(0, 5)
      .forEach(renderUser);

    if (nearby.length === 0) {
      profilesContainer.innerHTML = `
        <div style="opacity:0.7;text-align:center;padding:20px;">
          <strong>You’re early.</strong><br/>
          Near works best as more people join your area.
        </div>
      `;
    }

  }, () => {
    alert("Location is required to show people near you.");
  });
});
