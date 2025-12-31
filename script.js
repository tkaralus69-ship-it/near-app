// 🔥 FIREBASE CONFIG (KEEP YOUR OWN VALUES)
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();

const statusEl = document.getElementById("status");
const userEl = document.getElementById("user");
const nearbyEl = document.getElementById("nearby");

// 📐 Distance in km (Haversine)
function distanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// 🔐 Auto sign-in
auth.signInAnonymously();

// 👤 Auth state
auth.onAuthStateChanged(user => {
  if (!user) return;

  userEl.textContent = user.uid;

  if (!navigator.geolocation) {
    statusEl.textContent = "Geolocation not supported";
    return;
  }

  navigator.geolocation.watchPosition(
    pos => {
      const { latitude, longitude } = pos.coords;
      statusEl.textContent = "Location received ✔";

      // 💾 Save / update user
      db.collection("users").doc(user.uid).set({
        lat: latitude,
        lng: longitude,
        lastSeen: firebase.firestore.FieldValue.serverTimestamp()
      });

      // 👀 Listen to others
      db.collection("users").onSnapshot(snapshot => {
        nearbyEl.innerHTML = "";

        snapshot.forEach(doc => {
          if (doc.id === user.uid) return;

          const data = doc.data();
          if (!data.lat || !data.lng) return;

          const d = distanceKm(latitude, longitude, data.lat, data.lng);

          if (d <= 5) {
            const li = document.createElement("li");
            li.textContent = `${doc.id.slice(0, 6)} • ${d.toFixed(2)} km`;
            nearbyEl.appendChild(li);
          }
        });

        if (!nearbyEl.children.length) {
          nearbyEl.innerHTML = "<li>No nearby users yet</li>";
        }
      });
    },
    err => {
      statusEl.textContent = "Location error";
      console.error(err);
    },
    { enableHighAccuracy: true }
  );
});

// 🚪 Logout
document.getElementById("logout").onclick = () => auth.signOut();
