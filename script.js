// 🔥 FIREBASE CONFIG — KEEP YOUR OWN VALUES
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();

let currentUser = null;
let myLocation = null;

/* ---------- AUTH ---------- */
auth.onAuthStateChanged(async (user) => {
  if (!user) {
    await auth.signInAnonymously();
    return;
  }

  currentUser = user;

  document.getElementById("user-email").textContent =
    user.email || "Anonymous";

  getLocation();
});

/* ---------- LOCATION ---------- */
function getLocation() {
  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      myLocation = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      await db.collection("users").doc(currentUser.uid).set({
        uid: currentUser.uid,
        email: currentUser.email || null,
        location: myLocation
      });

      document.getElementById("status").textContent =
        "✅ Location acquired";

      loadNearbyUsers();
    },
    () => {
      document.getElementById("status").textContent =
        "❌ Location permission denied";
    }
  );
}

/* ---------- DISTANCE ---------- */
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

/* ---------- NEARBY USERS ---------- */
async function loadNearbyUsers() {
  const list = document.getElementById("nearby-users");
  list.innerHTML = "";

  const snapshot = await db.collection("users").get();
  let found = false;

  snapshot.forEach(doc => {
    const data = doc.data();

    // ❌ Skip yourself
    if (doc.id === currentUser.uid) return;

    // ❌ Skip anonymous users
    if (!data.email) return;

    if (!data.location) return;

    const d = distanceKm(
      myLocation.lat,
      myLocation.lng,
      data.location.lat,
      data.location.lng
    );

    if (d <= 5) {
      const li = document.createElement("li");
      li.textContent = `${data.email} — ${d.toFixed(2)} km away`;
      list.appendChild(li);
      found = true;
    }
  });

  if (!found) {
    list.innerHTML = "<li>No nearby users yet</li>";
  }
}

/* ---------- LOGOUT ---------- */
function logout() {
  auth.signOut();
}
